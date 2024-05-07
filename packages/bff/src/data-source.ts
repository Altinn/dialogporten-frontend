import path from 'path';
import { fileURLToPath } from 'url';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import config from './config.ts';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

console.log(
  `REMINDER: In datasource file, typeormSynchronizeEnabled needs to be changed to false for production (typeormSynchronizeEnabled: ${config.typeormSynchronizeEnabled})`,
);

export const connectionOptions: DataSourceOptions = {
  type: 'postgres',
  url: config.postgresql.connectionString,
  synchronize: config.typeormSynchronizeEnabled,
  logging: false,
  entities: ['src/entities.ts'],
  migrations: [__dirname + '/migrations/**/*.ts'],
  ...(config.enableHttps && {
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }),
};

export default new DataSource(connectionOptions);
