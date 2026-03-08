// lib/email-verification.ts
const ZEROBOUNCE_API_KEY = process.env.ZEROBOUNCE_API_KEY;
const ZEROBOUNCE_URL = 'https://api.zerobounce.net/v2/validate';

export async function verifyEmail(email: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  if (!ZEROBOUNCE_API_KEY) {
    console.warn('ZeroBounce API key missing – skipping verification');
    return { valid: true }; // fallback
  }

  try {
    const url = new URL(ZEROBOUNCE_URL);
    url.searchParams.append('api_key', ZEROBOUNCE_API_KEY);
    url.searchParams.append('email', email);
    url.searchParams.append('ip_address', ''); // optional

    const response = await fetch(url.toString());
    const data = await response.json();

    // ZeroBounce statuses: 'valid', 'invalid', 'catch-all', 'unknown', 'spamtrap', 'abuse', 'do_not_mail'
    if (data.status === 'valid') {
      return { valid: true };
    } else {
      let reason = 'Email is invalid or undeliverable';
      if (data.status === 'catch-all') reason = 'Domain has catch-all policy – email may not exist';
      else if (data.status === 'unknown') reason = 'Could not verify email – try again later';
      else if (data.error) reason = data.error;
      return { valid: false, reason };
    }
  } catch (error) {
    console.error('ZeroBounce API error:', error);
    return { valid: false, reason: 'Email verification service unavailable' };
  }
}