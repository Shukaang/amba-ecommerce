import { useCallback } from 'react';
import { getSessionId } from '@/lib/tracking/session';
import { useAuth } from '@/lib/auth/context';

export function useTrackProduct() {
  const { user } = useAuth();

  const track = useCallback((productId: string, type: 'view' | 'add_to_cart' | 'add_to_wishlist') => {
    // Don't track if admin
    if (user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN')) return;

    const sessionId = getSessionId();
    if (!sessionId) return; // should never happen

    fetch('/api/track/product-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        productId,
        type,
        userId: user?.id || null,
      }),
    }).catch(console.error);
  }, [user]);

  return track;
}