import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const emailService = {
  async send(to: string, subject: string, body: string): Promise<void> {
    if (env.EMAIL_PROVIDER === 'resend') {
      if (!env.RESEND_API_KEY) {
        throw ApiError.internal('RESEND_API_KEY is not configured');
      }
      throw ApiError.internal('Resend email provider not yet integrated. Set EMAIL_PROVIDER=console for development.');
    }
    console.log('\n📧 [DEV EMAIL]');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:\n${body}`);
    console.log('─'.repeat(60));
  },
};
