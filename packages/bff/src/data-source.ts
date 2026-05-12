import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { DefaultAzureCredential } from '@azure/identity';
import config from './config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AAD_TOKEN_SCOPE = 'https://ossrdbms-aad.database.windows.net/.default';
const credential = new DefaultAzureCredential();

async function getAadDbToken(): Promise<string> {
  let lastError: unknown;
  const delays = [200, 400, 800];
  for (let i = 0; i <= delays.length; i++) {
    try {
      const { token } = await credential.getToken(AAD_TOKEN_SCOPE);
      return token;
    } catch (err) {
      lastError = err;
      if (i < delays.length) {
        await new Promise<void>((resolve) => setTimeout(resolve, delays[i]));
      }
    }
  }
  throw lastError;
}

const commonOptions = {
  synchronize: false,
  logging: false,
  entities: ['src/entities.ts'],
  migrations: [__dirname + '/migrations/**/*.ts'],
} satisfies Partial<DataSourceOptions>;

const aadOptions = {
  ...commonOptions,
  type: 'postgres',
  host: config.postgresql.host,
  port: config.postgresql.port,
  database: config.postgresql.database,
  username: config.postgresql.user,
  password: getAadDbToken,
  extra: { ssl: { rejectUnauthorized: false } },
} as unknown as DataSourceOptions;

const legacyOptions: DataSourceOptions = {
  ...commonOptions,
  type: 'postgres',
  url: config.postgresql.connectionString,
  ...(config.enableHttps && { extra: { ssl: { rejectUnauthorized: false } } }),
};

export const connectionOptions: DataSourceOptions = config.postgresql.useAadAuth ? aadOptions : legacyOptions;

export default new DataSource(connectionOptions);
