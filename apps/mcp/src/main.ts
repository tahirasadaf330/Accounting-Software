/**
 * Entry point. Loads .env, fails closed on misconfiguration (no secret → exit),
 * starts the HTTP server, and shuts down cleanly on SIGTERM/SIGINT.
 */
import 'dotenv/config';
import { validateConfigOrExit } from './config.js';
import { startHttpServer } from './http/server.js';
import { closePools } from './db/pools.js';
import { log } from './logging.js';

validateConfigOrExit();

const srv = startHttpServer();

async function shutdown(signal: string): Promise<void> {
  log.info(null, `received ${signal}, shutting down`);
  srv.close();
  await closePools();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
