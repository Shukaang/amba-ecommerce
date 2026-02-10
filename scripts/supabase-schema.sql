-- ============================================
-- AMBASTORE - SUPABASE SCHEMA
-- ============================================

-- ============================================
-- 1. CREATE ENUM TYPES
-- ============================================
CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'ADMIN', 'CUSTOMER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'READY', 'COMPLETED', 'CANCELED', 'FAILED');

-- Order counters table (one row per month)
CREATE TABLE order_counters (
  year_month CHAR(4) PRIMARY KEY, -- e.g. '0226'
  last_number INTEGER NOT NULL
);

-- ============================================
-- 1.5 ORDER NUMBER GENERATION (ATOMIC)
-- ============================================

-- Atomic order number generator
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ym TEXT;
  next_number INTEGER;
BEGIN
  ym := to_char(now(), 'MMYY');

  INSERT INTO order_counters (year_month, last_number)
  VALUES (ym, 1)
  ON CONFLICT (year_month)
  DO UPDATE
    SET last_number = order_counters.last_number + 1
  RETURNING last_number INTO next_number;

  RETURN 'ORD-' || ym || '-' || lpad(next_number::TEXT, 4, '0');
END;
$$;

-- ============================================
-- 2. USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- 3. CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_title ON categories(title);

-- ============================================
-- 4. PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_title ON products(title);

-- ============================================
-- 5. PRODUCT VARIANTS TABLE
-- ============================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color VARCHAR(100),
  size VARCHAR(100),
  unit VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_color ON product_variants(color);
CREATE INDEX idx_product_variants_size ON product_variants(size);

-- ============================================
-- 6. ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_order_number(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_price DECIMAL(12, 2) NOT NULL,
  shipping_info TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- ============================================
-- 7. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- ============================================
-- 8. RATINGS TABLE
-- ============================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  moderated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_ratings_product_id ON ratings(product_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_moderated ON ratings(moderated);

-- ============================================
-- 9. CART ITEMS TABLE
-- ============================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- ============================================
-- 10. VISITOR TRACKING TABLE
-- ============================================
CREATE TABLE visitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  location VARCHAR(255),
  device_info TEXT,
  pages_visited TEXT[] DEFAULT '{}',
  product_clicks TEXT[] DEFAULT '{}',
  searches TEXT[] DEFAULT '{}',
  duration INTEGER,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visitor_tracking_user_id ON visitor_tracking(user_id);
CREATE INDEX idx_visitor_tracking_session_id ON visitor_tracking(session_id);
CREATE INDEX idx_visitor_tracking_visited_at ON visitor_tracking(visited_at);

-- ============================================
-- 11. OTP TABLE
-- ============================================
CREATE TABLE otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_user_id ON otp(user_id);
CREATE INDEX idx_otp_expires_at ON otp(expires_at);

-- ============================================
-- 12. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE order_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. RLS POLICIES - USERS TABLE
-- ============================================
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Only SUPERADMIN can update users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN'
  )
);

CREATE POLICY "Only SUPERADMIN can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN'
  )
);

-- ============================================
-- 14. RLS POLICIES - CATEGORIES TABLE
-- ============================================
CREATE POLICY "Anyone can view categories"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admins can insert categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

CREATE POLICY "Only admins can update categories"
ON categories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

CREATE POLICY "Only admins can delete categories"
ON categories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- 15. RLS POLICIES - PRODUCTS TABLE
-- ============================================
CREATE POLICY "Anyone can view products"
ON products FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admins can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

CREATE POLICY "Only admins can update products"
ON products FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

CREATE POLICY "Only admins can delete products"
ON products FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- 16. RLS POLICIES - PRODUCT VARIANTS TABLE
-- ============================================
CREATE POLICY "Anyone can view product variants"
ON product_variants FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admins can insert product variants"
ON product_variants FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

CREATE POLICY "Only admins can update product variants"
ON product_variants FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

CREATE POLICY "Only admins can delete product variants"
ON product_variants FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- 17. RLS POLICIES - ORDERS TABLE
-- ============================================
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

CREATE POLICY "Users can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- 18. RLS POLICIES - ORDER ITEMS TABLE
-- ============================================
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- 19. RLS POLICIES - RATINGS TABLE
-- ============================================
CREATE POLICY "Anyone can view ratings"
ON ratings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can create ratings"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings"
ON ratings FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can moderate ratings"
ON ratings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- 20. RLS POLICIES - CART ITEMS TABLE
-- ============================================
CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create cart items"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart"
ON cart_items FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 21. RLS POLICIES - VISITOR TRACKING TABLE
-- ============================================
CREATE POLICY "Only SUPERADMIN can view visitor tracking"
ON visitor_tracking FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN'
  )
);

CREATE POLICY "Anyone can insert visitor tracking"
ON visitor_tracking FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================
-- 22. RLS POLICIES - OTP TABLE
-- ============================================
CREATE POLICY "Users can view own OTP"
ON otp FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only SUPERADMIN can view all OTP"
ON otp FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SUPERADMIN'
  )
);

CREATE POLICY "System can insert OTP"
ON otp FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete own OTP"
ON otp FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all OTP"
ON otp FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- ============================================
-- 23. RLS POLICIES - ORDER COUNTERS TABLE
-- ============================================

-- Anyone (customer or admin) can SELECT to see their order numbers
CREATE POLICY "Anyone can view order counters"
ON order_counters FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can INSERT (needed for atomic order number generation)
CREATE POLICY "Anyone can insert into order counters"
ON order_counters FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow UPDATE for order counters (needed for atomic generation)
CREATE POLICY "Anyone can update order counters"
ON order_counters FOR UPDATE
TO anon, authenticated
USING (true);