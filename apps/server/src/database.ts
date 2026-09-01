import pg from 'pg';
import { config } from './config.js';

let pool: pg.Pool | undefined;

export function getDatabasePool(): pg.Pool {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required before using persistence.');
  }

  pool ??= new pg.Pool({ connectionString: config.databaseUrl });
  return pool;
}

export async function closeDatabasePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
