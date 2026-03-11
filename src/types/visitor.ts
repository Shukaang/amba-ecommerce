export interface ProductClick {
  product_id: string;
  type: 'view' | 'add_to_cart' | 'add_to_wishlist';
  timestamp: string;
  product_title?: string; // Optional because it's added by the API
}

export interface Visitor {
  id: string;
  session_id: string;
  user_id: string | null;
  users?: { email: string; name: string } | null;
  device_info: string | null;
  visited_at: string;
  updated_at: string;
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  product_clicks: ProductClick[] | null;
  duration: number | null;
}