import { createServer } from 'node:http';

import { createApp } from './app.js';
import { env, isDatabaseConfigured } from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp();
const httpServer = createServer(app);

const startServer = async () => {
  if (isDatabaseConfigured) {
    try {
      await prisma.$connect();
      console.info('Database connection established.');
    } catch (error) {
      console.error('Failed to connect to the database.', error);

      if (env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  } else {
    console.warn('DATABASE_URL not configured. Prisma will stay idle until configured.');
  }

  httpServer.listen(env.PORT, () => {
    console.info(`Backend listening on port ${env.PORT}.`);
  });
};

const shutdown = async (signal: NodeJS.Signals) => {
  console.info(`Received ${signal}. Shutting down backend.`);

  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void startServer();
