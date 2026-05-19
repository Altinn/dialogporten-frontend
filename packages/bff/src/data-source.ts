import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'reflect-metadata';
import { DefaultAzureCredential } from '@azure/identity';
import { entraTokenProvider } from '@azure/postgresql-auth';
import { DataSource, type DataSourceOptions } from 'typeorm';
import config from './config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonOptions = {
  synchronize: false,
  logging: false,
  entities: ['src/entities.ts'],
  migrations: [__dirname + '/migrations/**/*.ts'],
} satisfies Partial<DataSourceOptions>;

const aadOptions: DataSourceOptions = {
  ...commonOptions,
  type: 'postgres',
  host: config.postgresql.host,
  port: config.postgresql.port,
  database: config.postgresql.database,
  username: config.postgresql.user,
  password: entraTokenProvider(new DefaultAzureCredential()) as unknown as string,
  extra: { ssl: { rejectUnauthorized: false } },
};

const legacyOptions: DataSourceOptions = {
  ...commonOptions,
  type: 'postgres',
  url: config.postgresql.connectionString,
  ...(config.enableHttps && { extra: { ssl: { rejectUnauthorized: false } } }),
};

export const connectionOptions: DataSourceOptions = config.postgresql.useAadAuth ? aadOptions : legacyOptions;

export default new DataSource(connectionOptions);
