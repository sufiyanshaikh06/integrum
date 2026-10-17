import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const emailService = {
  async send(to: string, subject: string, body: string): Promise<void> {
    if (env.EMAIL_PROVIDER === 'resend') {
      if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
        throw ApiError.internal('Email delivery is not configured');
      }
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text: body }),
          signal: AbortSignal.timeout(10_000),
          redirect: 'error',
        });
        if (!response.ok) throw new Error('Provider rejected delivery');
        const result: unknown = await response.json();
        if (!result || typeof result !== 'object' || !('id' in result) ||
            typeof result.id !== 'string' || result.id.length === 0) throw new Error('Invalid provider response');
        return;
      } catch {
        // Do not expose provider errors, recipient details, credentials or tokens.
        throw new ApiError(503, 'Email delivery is temporarily unavailable');
      }
    }
    if (env.NODE_ENV === 'production') {
      throw ApiError.internal('Console email delivery is disabled in production');
    }
    console.log('\n📧 [DEV EMAIL]');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:\n${body}`);
    console.log('─'.repeat(60));
  },
};
