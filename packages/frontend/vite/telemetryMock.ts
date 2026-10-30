import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

export const TELEMETRY_MOCK_PATH = '/__telemetry';
const TRACK_PATH = `${TELEMETRY_MOCK_PATH}/v2/track`;
const MAX_ITEMS = 2000;

export interface TelemetryEnvelope {
  name?: string;
  time?: string;
  iKey?: string;
  tags?: Record<string, string>;
  data?: {
    baseType?: string;
    baseData?: { name?: string; properties?: Record<string, string>; [key: string]: unknown };
  };
}

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

// The SDK posts a JSON array, but the v2/track endpoint also accepts newline-delimited envelopes
const parseEnvelopes = (body: string): TelemetryEnvelope[] => {
  try {
    const parsed = JSON.parse(body);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return body
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  }
};

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const matches = (envelope: TelemetryEnvelope, query: URLSearchParams) => {
  const baseType = query.get('baseType');
  const name = query.get('name');
  const userId = query.get('userId');
  return (
    (!baseType || envelope.data?.baseType === baseType) &&
    (!name || envelope.data?.baseData?.name === name) &&
    (!userId || envelope.tags?.['ai.user.id'] === userId)
  );
};

/**
 * Local stand-in for the Application Insights ingestion endpoint, served by the Vite dev server only.
 * The app sends telemetry here instead of to Azure while running in dev (see src/analytics/analytics.ts).
 *
 * - POST /__telemetry/v2/track  receives envelopes like the real endpoint
 * - GET  /__telemetry           lists received envelopes, filtered by ?baseType=, ?name= and ?userId=
 * - DELETE /__telemetry         clears them
 */
export const telemetryMock = (): Plugin => {
  let envelopes: TelemetryEnvelope[] = [];

  return {
    name: 'telemetry-mock',
    apply: 'serve',
    config: () => ({
      define: {
        'import.meta.env.VITE_TELEMETRY_MOCK_ENDPOINT': JSON.stringify(TRACK_PATH),
      },
    }),
    configureServer(server) {
      const logger = server.config.logger;

      server.middlewares.use(TELEMETRY_MOCK_PATH, async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');

        if (req.method === 'POST' && url.pathname === '/v2/track') {
          try {
            const received = parseEnvelopes(await readBody(req));
            envelopes = [...envelopes, ...received].slice(-MAX_ITEMS);
            for (const envelope of received) {
              const label = envelope.data?.baseData?.name ? ` "${envelope.data.baseData.name}"` : '';
              logger.info(`[telemetry] ${envelope.data?.baseType ?? envelope.name}${label}`, { timestamp: true });
            }
            sendJson(res, 200, { itemsReceived: received.length, itemsAccepted: received.length, errors: [] });
          } catch (error) {
            logger.warn(`[telemetry] Could not parse telemetry payload: ${error}`);
            sendJson(res, 400, { itemsReceived: 0, itemsAccepted: 0, errors: [] });
          }
          return;
        }

        if (url.pathname === '/') {
          if (req.method === 'GET') {
            sendJson(
              res,
              200,
              envelopes.filter((envelope) => matches(envelope, url.searchParams)),
            );
            return;
          }
          if (req.method === 'DELETE') {
            envelopes = [];
            res.statusCode = 204;
            res.end();
            return;
          }
        }

        sendJson(res, 404, { error: `No telemetry mock route for ${req.method} ${req.url}` });
      });
    },
  };
};
