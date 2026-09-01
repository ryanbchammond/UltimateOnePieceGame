import { app } from './app.js';
import { config } from './config.js';
import { closeDatabasePool } from './database.js';

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => {
    await closeDatabasePool();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
