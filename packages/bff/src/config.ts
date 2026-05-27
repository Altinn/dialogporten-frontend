import 'dotenv/config';
import z from 'zod';

const stringToBoolean = (val: unknown): boolean | unknown => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
  }
  return false;
};

const envVariables = z.object({
  // todo: rather use version here instead of git_sha
  GIT_SHA: z.string().default('v6.1.5'),
  HOST: z.string().default('0.0.0.0'),
  DB_CONNECTION_STRING: z.string().default('postgres://postgres:mysecretpassword@localhost:5432/dialogporten'),
  DB_USE_AAD_AUTH: z.preprocess(stringToBoolean, z.boolean().default(false)),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('dialogporten'),
  DB_USER: z.string().default('postgres'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_EXPORTER_OTLP_PROTOCOL: z
    .enum(['http/protobuf', 'http/json', 'grpc'])
    .default('http/protobuf')
    .or(z.literal('').transform(() => 'http/protobuf')),
  OTEL_TRACES_SAMPLER_ARG: z.coerce.number().min(0).max(1).default(1),
  APP_CONFIG_CONNECTION_STRING: z.string().default(''),
  PORT: z.coerce.number().default(3000),
  OIDC_PLATFORM_URL: z.string().default('platform.at23.altinn.cloud/authentication/api/v1/openid'),
  HOSTNAME: z.string().default('http://localhost'),
  SESSION_SECRET: z.string().min(32).default('SecretHereSecretHereSecretHereSecretHereSecretHereSecretHereSecretHere'),
  ENABLE_HTTPS: z.preprocess(stringToBoolean, z.boolean().default(false)),
  COOKIE_MAX_AGE: z.coerce.number().default(30 * 24 * 60 * 60 * 1000),
  COOKIE_SECURE: z.preprocess(stringToBoolean, z.boolean().default(true)),
  COOKIE_HTTP_ONLY: z.preprocess(stringToBoolean, z.boolean().default(false)),
  REDIS_CONNECTION_STRING: z.string().default('redis://:mysecretpassword@127.0.0.1:6379/0'),
  OIDC_CLIENT_ID: z.string().default(''),
  OIDC_CLIENT_SECRET: z.string().default(''),
  PLATFORM_BASEURL: z.string().default('https://platform.at23.altinn.cloud'),
  ALTINN2_BASE_URL: z.string().default('https://at23.altinn.cloud'),
  ALTINN2_API_KEY: z.string().default(''),
  MIGRATION_RUN: z.preprocess(stringToBoolean, z.boolean().default(false)),
  DIALOGPORTEN_URL: z.string().default('https://platform.at23.altinn.cloud/dialogporten'),
  CONTAINER_APP_REPLICA_NAME: z.string().default(''),
  ENABLE_GRAPHIQL: z.preprocess(stringToBoolean, z.boolean().default(true)),
  ENABLE_INIT_SESSION_ENDPOINT: z.preprocess(stringToBoolean, z.boolean().default(false)),
  AUTH_CONTEXT_COOKIE_DOMAIN: z.string().default('.at23.altinn.cloud'),
  ENVIRONMENT: z.enum(['dev', 'test', 'staging', 'yt01', 'prod']).default('test'),
  PERSON_URN_ENC_KEYS: z
    .string()
    .default('ZGV2a2V5LWRvLW5vdC11c2UtaW4tcHJvZGRldmtleS1kby1ub3QtdXNlLWluLXByb2RkZXZrZXktZG8tbm90LQ=='),
});

const env = envVariables.parse(process.env);
const config = {
  info: {
    name: 'bff',
    instanceId: env.CONTAINER_APP_REPLICA_NAME, // provided by container app environment variable
  },
  version: env.GIT_SHA,
  port: env.PORT,
  host: env.HOST,
  hostname: env.HOSTNAME,
  oidc_url: env.OIDC_PLATFORM_URL,
  client_id: env.OIDC_CLIENT_ID,
  client_secret: env.OIDC_CLIENT_SECRET,
  platformBaseURL: env.PLATFORM_BASEURL,
  altinn2BaseURL: env.ALTINN2_BASE_URL,
  altinn2ApiKey: env.ALTINN2_API_KEY,
  openTelemetry: {
    enabled: !!env.OTEL_EXPORTER_OTLP_ENDPOINT,
    endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    protocol: env.OTEL_EXPORTER_OTLP_PROTOCOL,
    sampleRate: env.OTEL_TRACES_SAMPLER_ARG,
  },
  postgresql: {
    connectionString: env.DB_CONNECTION_STRING,
    useAadAuth: env.DB_USE_AAD_AUTH,
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
  },
  secret: env.SESSION_SECRET,
  cookie: {
    secure: env.COOKIE_SECURE,
    httpOnly: env.COOKIE_HTTP_ONLY,
    maxAge: env.COOKIE_MAX_AGE,
  },
  enableHttps: env.ENABLE_HTTPS,
  redisConnectionString: env.REDIS_CONNECTION_STRING,
  migrationRun: env.MIGRATION_RUN,
  dialogporten: {
    graphqlUrl: `${env.DIALOGPORTEN_URL}/graphql`,
    graphqlSubscriptionUrl: `${env.DIALOGPORTEN_URL}/graphql/stream`,
    healthUrl: `${env.DIALOGPORTEN_URL}/health`,
  },
  enableGraphiql: env.ENABLE_GRAPHIQL,
  enableInitSessionEndpoint: env.ENABLE_INIT_SESSION_ENDPOINT,
  appConfigConnectionString: env.APP_CONFIG_CONNECTION_STRING,
  authContextCookieDomain: env.AUTH_CONTEXT_COOKIE_DOMAIN,
  environment: env.ENVIRONMENT,
  personUrnEncKeys: env.PERSON_URN_ENC_KEYS.split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0),
};

export default config;
