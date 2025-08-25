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
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  APPLICATIONINSIGHTS_ENABLED: z.preprocess(stringToBoolean, z.boolean().default(false)),
  PORT: z.coerce.number().default(3000),
  OIDC_URL: z.string().default('test.idporten.no'),
  HOSTNAME: z.string().default('http://localhost'),
  SESSION_SECRET: z.string().min(32).default('SecretHereSecretHereSecretHereSecretHereSecretHereSecretHereSecretHere'),
  ENABLE_HTTPS: z.preprocess(stringToBoolean, z.boolean().default(false)),
  COOKIE_MAX_AGE: z.coerce.number().default(30 * 24 * 60 * 60 * 1000),
  COOKIE_SECURE: z.preprocess(stringToBoolean, z.boolean().default(true)),
  COOKIE_HTTP_ONLY: z.preprocess(stringToBoolean, z.boolean().default(false)),
  REDIS_CONNECTION_STRING: z.string().default('redis://:mysecretpassword@127.0.0.1:6379/0'),
  CLIENT_ID: z.string().default(''),
  CLIENT_SECRET: z.string().default(''),
  PLATFORM_EXCHANGE_TOKEN_ENDPOINT_URL: z
    .string()
    .default('https://platform.at22.altinn.cloud/authentication/api/v1/exchange/id-porten?test=true'),
  PLATFORM_PROFILE_API_URL: z.string().default('https://platform.at22.altinn.cloud/profile/api/v1/'),
  MIGRATION_RUN: z.preprocess(stringToBoolean, z.boolean().default(false)),
  DIALOGPORTEN_URL: z.string().default('https://altinn-dev-api.azure-api.net/dialogporten/graphql'),
  CONTAINER_APP_REPLICA_NAME: z.string().default(''),
  ENABLE_GRAPHIQL: z.preprocess(stringToBoolean, z.boolean().default(true)),
  ENABLE_INIT_SESSION_ENDPOINT: z.preprocess(stringToBoolean, z.boolean().default(false)),
  DISABLE_PROFILE: z.preprocess(stringToBoolean, z.boolean().default(false)),
  LOGOUT_REDIRECT_URI: z.string().default('https://tt02.altinn.no/'),
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
  oidc_url: env.OIDC_URL,
  hostname: env.HOSTNAME,
  client_id: env.CLIENT_ID,
  client_secret: env.CLIENT_SECRET,
  platformExchangeTokenEndpointURL: env.PLATFORM_EXCHANGE_TOKEN_ENDPOINT_URL,
  platformProfileAPI_url: env.PLATFORM_PROFILE_API_URL,
  applicationInsights: {
    enabled: env.APPLICATIONINSIGHTS_ENABLED,
    connectionString: env.APPLICATIONINSIGHTS_CONNECTION_STRING,
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
  dialogportenURL: env.DIALOGPORTEN_URL,
  enableGraphiql: env.ENABLE_GRAPHIQL,
  enableInitSessionEndpoint: env.ENABLE_INIT_SESSION_ENDPOINT,
  disableProfile: env.DISABLE_PROFILE,
  logoutRedirectUri: env.LOGOUT_REDIRECT_URI,
};

export default config;
