import 'reflect-metadata';
import { logger } from '@altinn/dialogporten-node-logger';
import config from './config.ts';
import { connectToDB } from './db.ts';

export const runMigrationApp = async () => {
  try {
    logger.info(`${config.version}: Starting migration:`);
    const { dataSource } = await connectToDB();
    if (!dataSource.isInitialized) {
      throw new Error('Something went from initializing a connection to database');
    }
    // Run migrations
    await dataSource.runMigrations();
    // Disconnect from database
    await dataSource.destroy();

    logger.info('Migration successful');
  } catch (error) {
    logger.error(error, 'Migration failed: ');
    process.exit(1);
  }
};
