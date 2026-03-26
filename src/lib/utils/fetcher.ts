export async function fetcher<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.cause = await res.json();
    throw error;
  }
  return res.json();
}