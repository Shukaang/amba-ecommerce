const DEBOUNCE_API_KEY = process.env.DEBOUNCE_API_KEY;
const DEBOUNCE_URL = 'https://api.debounce.io/v1/';

export async function verifyEmail(email: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  if (!DEBOUNCE_API_KEY) {
    console.warn('DeBounce API key missing – skipping verification');
    return { valid: true }; // fallback
  }

  try {
    const url = new URL(DEBOUNCE_URL);
    url.searchParams.append('api', DEBOUNCE_API_KEY);
    url.searchParams.append('email', email);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.success !== "1") {
      throw new Error('DeBounce API error');
    }

    const result = data.debounce.result;
    const reason = data.debounce.reason;
    const isDisposable = data.debounce.disposable === "1";

    if (result === "Safe to Send" && !isDisposable) {
      return { valid: true };
    } else {
      let finalReason = reason || 'Email is invalid or disposable';
      if (isDisposable) finalReason = 'Disposable email addresses are not allowed';
      else if (result === "Invalid") finalReason = 'Email address does not exist';
      else if (result === "Unknown") finalReason = 'Could not verify email – try again later';
      return { valid: false, reason: finalReason };
    }
  } catch (error) {
    console.error('DeBounce API error:', error);
    return { valid: false, reason: 'Email verification service unavailable' };
  }
}