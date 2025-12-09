import type { IncomingMessage } from 'node:http';
import { logger } from '@altinn/dialogporten-node-logger';
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation, type HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, SEMRESATTRS_SERVICE_INSTANCE_ID } from '@opentelemetry/semantic-conventions';
import config from './config.ts';

const { openTelemetry } = config;

// Configure HTTP instrumentation with filtering
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

// Configure instrumentations
const instrumentations = [
  new HttpInstrumentation(httpInstrumentationConfig),
  new IORedisInstrumentation(),
  new FastifyOtelInstrumentation(),
  new GraphQLInstrumentation({
    ignoreTrivialResolveSpans: true,
    mergeItems: true,
  }),
  new PgInstrumentation(),
];

// Create custom resource with service information
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: config.info.name,
  [SEMRESATTRS_SERVICE_INSTANCE_ID]: config.info.instanceId || 'local-dev',
});

const initializeOpenTelemetry = () => {
  try {
    if (!config.openTelemetry.enabled) {
      logger.info('OpenTelemetry disabled - no OTEL_EXPORTER_OTLP_ENDPOINT configured');
      return null;
    }

    const traceExporter: OTLPTraceExporter = new OTLPTraceExporter({
      url: openTelemetry.endpoint,
    });
    const metricReader: PeriodicExportingMetricReader = new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: openTelemetry.endpoint,
      }),
      exportIntervalMillis: 30000,
    });

    const sampler = new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(openTelemetry.sampleRate),
    });

    logger.info(
      {
        endpoint: openTelemetry.endpoint,
        protocol: openTelemetry.protocol,
        serviceName: config.info.name,
        instanceId: config.info.instanceId,
        sampleRate: openTelemetry.sampleRate,
      },
      'Initializing OpenTelemetry with OTLP exporter',
    );

    // Initialize NodeSDK
    const sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReaders: [metricReader],
      instrumentations,
      sampler,
    });

    sdk.start();

    logger.info(
      {
        mode: openTelemetry.enabled ? 'production' : 'local-dev',
        serviceName: config.info.name,
        instanceId: config.info.instanceId,
      },
      'OpenTelemetry initialized successfully',
    );

    return sdk;
  } catch (error) {
    logger.error(error, 'Error initializing OpenTelemetry');
    if (openTelemetry.enabled) {
      throw error;
    }
    return null;
  }
};

export const otelSDK = initializeOpenTelemetry();
