import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import app from './app.js';
import { reminderService } from './services/reminder.service.js';

const startServer = () => {
  const PORT = env.PORT || 5000;

  if (env.NODE_ENV !== 'test') {
    reminderService.startReminderProcessor(env.REMINDER_INTERVAL_MS);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[${signal}] Shutting down gracefully...`);
    await reminderService.stopReminderProcessor();
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
