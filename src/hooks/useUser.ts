import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  role: 'SUPERADMIN' | 'ADMIN' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  created_at: string;
  updated_at: string;
}

export function useUser(initialData?: User | null) {
  const { data, error, mutate } = useSWR<{ user: User }>(
    '/api/auth/me',
    fetcher,
    {
      fallbackData: initialData ? { user: initialData } : undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000, // 1 minute
    }
  );

  return {
    user: data?.user || null,
    loading: !error && !data,
    error,
    mutate,
  };
}