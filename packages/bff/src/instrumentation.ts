import type { IncomingMessage } from 'node:http';
import { useAzureMonitor } from '@azure/monitor-opentelemetry';
import { logger } from '@digdir/dialogporten-node-logger';
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { type ProxyTracerProvider, metrics, trace } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation, type HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { resourceFromAttributes } from '@opentelemetry/resources';
// SEMRESATTRS_SERVICE_INSTANCE_ID is deprecaed, but the replacement ATTR_SERVICE_INSTANCE_ID is not available in the semantic-conventions package
import { ATTR_SERVICE_NAME, SEMRESATTRS_SERVICE_INSTANCE_ID } from '@opentelemetry/semantic-conventions';
import config from './config.ts';

const { applicationInsights } = config;

const initializeApplicationInsights = () => {
  if (!applicationInsights.connectionString) {
    const errorMsg =
      'Unable to initialize Application Insights: Application Insights enabled, but connection string is missing.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const customResource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.info.name,
      [SEMRESATTRS_SERVICE_INSTANCE_ID]: config.info.instanceId,
    });

    // register the azure monitor exporter
    useAzureMonitor({
      resource: customResource,
      azureMonitorExporterOptions: {
        connectionString: applicationInsights.connectionString,
      },
      instrumentationOptions: {
        http: { enabled: true },
        azureSdk: { enabled: true },
        postgreSql: { enabled: true },
      },
    });

    const httpInstrumentationConfig: HttpInstrumentationConfig = {
      enabled: true,
      ignoreIncomingRequestHook: (request: IncomingMessage) => {
        // Ignore OPTIONS incoming requests
        if (request.method === 'OPTIONS') {
          return true;
        }
        // Ignore readiness and liveness probes
        if (request.url === '/api/liveness' || request.url === '/api/readiness') {
          return true;
        }
        return false;
      },
    };

    // register additional instrumentations that are not included in the azure monitor exporter
    const instrumentations = [
      new HttpInstrumentation(httpInstrumentationConfig),
      new IORedisInstrumentation(),
      new FastifyOtelInstrumentation(),
      new GraphQLInstrumentation({
        ignoreTrivialResolveSpans: true,
        mergeItems: true,
      }),
    ];

    const tracerProvider = (trace.getTracerProvider() as ProxyTracerProvider).getDelegate();
    const meterProvider = metrics.getMeterProvider();

    registerInstrumentations({
      tracerProvider: tracerProvider,
      meterProvider: meterProvider,
      instrumentations: instrumentations,
    });

    logger.info('Application Insights initialized');
  } catch (error) {
    logger.error('Error initializing Application Insights:', error);
    throw error;
  }
};

if (applicationInsights.enabled) {
  initializeApplicationInsights();
}
