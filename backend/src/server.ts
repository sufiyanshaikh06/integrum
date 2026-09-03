import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import app from './app.js';

const startServer = () => {
  const PORT = env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`[${signal}] Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Server closed. Database disconnected.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
