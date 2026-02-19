export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
}

export async function trackPageView(pagePath: string) {
  const sessionId = getOrCreateSessionId();
  
  await fetch('/api/track-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      pagePath, 
      sessionId 
    }),
  });
}