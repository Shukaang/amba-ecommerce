import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const SESSION_COOKIE_NAME = 'visitor_session';
const COOKIE_EXPIRY_DAYS = 365; // 1 year

export function getOrCreateSessionId(): string {
  let sessionId = Cookies.get(SESSION_COOKIE_NAME);
  if (!sessionId) {
    sessionId = uuidv4();
    Cookies.set(SESSION_COOKIE_NAME, sessionId, { 
      expires: COOKIE_EXPIRY_DAYS, 
      sameSite: 'Lax',
      path: '/'  // Important: available across all pages
    });
  }
  return sessionId;
}

export function getSessionId(): string | undefined {
  return Cookies.get(SESSION_COOKIE_NAME);
}

export function clearSession() {
  Cookies.remove(SESSION_COOKIE_NAME, { path: '/' });
}