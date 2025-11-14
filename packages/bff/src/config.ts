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
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_EXPORTER_OTLP_PROTOCOL: z
    .enum(['http/protobuf', 'http/json', 'grpc'])
    .default('http/protobuf')
    .or(z.literal('').transform(() => 'http/protobuf')),
  APP_CONFIG_CONNECTION_STRING: z.string().default(''),
  PORT: z.coerce.number().default(3000),
  OIDC_URL: z.string().default('test.idporten.no'),
  OIDC_PLATFORM_URL: z.string().default('platform.at23.altinn.cloud/authentication/api/v1/openid'),
  ENABLE_NEW_OIDC: z.preprocess(stringToBoolean, z.boolean().default(false)), // Note: Will be removed when Altinn OIDC takes over
  HOSTNAME: z.string().default('http://localhost'),
  SESSION_SECRET: z.string().min(32).default('SecretHereSecretHereSecretHereSecretHereSecretHereSecretHereSecretHere'),
  ENABLE_HTTPS: z.preprocess(stringToBoolean, z.boolean().default(false)),
  COOKIE_MAX_AGE: z.coerce.number().default(30 * 24 * 60 * 60 * 1000),
  COOKIE_SECURE: z.preprocess(stringToBoolean, z.boolean().default(true)),
  COOKIE_HTTP_ONLY: z.preprocess(stringToBoolean, z.boolean().default(false)),
  REDIS_CONNECTION_STRING: z.string().default('redis://:mysecretpassword@127.0.0.1:6379/0'),
  OIDC_CLIENT_ID: z.string().default(''),
  OIDC_CLIENT_SECRET: z.string().default(''),
  CLIENT_ID: z.string().default(''), // Note: Will be removed when Altinn OIDC takes over
  CLIENT_SECRET: z.string().default(''), // Note: Will be removed when Altinn OIDC takes over
  PLATFORM_BASEURL: z.string().default('https://platform.at23.altinn.cloud'),
  ALTINN2_BASE_URL: z.string().default('https://at23.altinn.cloud'),
  ALTINN2_API_KEY: z.string().default(''),
  MIGRATION_RUN: z.preprocess(stringToBoolean, z.boolean().default(false)),
  DIALOGPORTEN_URL: z.string().default('https://altinn-dev-api.azure-api.net/dialogporten'),
  CONTAINER_APP_REPLICA_NAME: z.string().default(''),
  ENABLE_GRAPHIQL: z.preprocess(stringToBoolean, z.boolean().default(true)),
  ENABLE_INIT_SESSION_ENDPOINT: z.preprocess(stringToBoolean, z.boolean().default(false)),
  LOGOUT_REDIRECT_URI: z.string().default('https://tt02.altinn.no/ui/Authentication/Logout'),
  AUTH_CONTEXT_COOKIE_DOMAIN: z.string().default('.at23.altinn.cloud'),
});

const env = envVariables.parse(process.env);
const enableNewOIDC = env.ENABLE_NEW_OIDC;
const config = {
  info: {
    name: 'bff',
    instanceId: env.CONTAINER_APP_REPLICA_NAME, // provided by container app environment variable
  },
  version: env.GIT_SHA,
  port: env.PORT,
  host: env.HOST,
  hostname: env.HOSTNAME,
  oidc_url: enableNewOIDC ? env.OIDC_PLATFORM_URL : env.OIDC_URL,
  client_id: enableNewOIDC ? env.OIDC_CLIENT_ID : env.CLIENT_ID,
  client_secret: enableNewOIDC ? env.OIDC_CLIENT_SECRET : env.CLIENT_SECRET,
  platformBaseURL: env.PLATFORM_BASEURL,
  altinn2BaseURL: env.ALTINN2_BASE_URL,
  altinn2ApiKey: env.ALTINN2_API_KEY,
  openTelemetry: {
    enabled: !!env.OTEL_EXPORTER_OTLP_ENDPOINT,
    endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    protocol: env.OTEL_EXPORTER_OTLP_PROTOCOL,
  },
  postgresql: {
    connectionString: env.DB_CONNECTION_STRING,
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
  logoutRedirectUri: env.LOGOUT_REDIRECT_URI,
  appConfigConnectionString: env.APP_CONFIG_CONNECTION_STRING,
  enableNewOIDC,
  authContextCookieDomain: env.AUTH_CONTEXT_COOKIE_DOMAIN,
};

export default config;
