# E-Commerce MVP - Complete Project Structure Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Components](#components)
7. [Utilities & Libraries](#utilities--libraries)
8. [Authentication Flow](#authentication-flow)
9. [Key Features](#key-features) 10.[Environment Variables](#environment-variables)

---

## Project Overview

This is a production-ready E-Commerce MVP built with Next.js 15, Supabase, and TypeScript. It includes:

- User authentication (registration, login, logout)
- Product browsing with search and filters
- Shopping cart management
- Order placement and tracking
- Admin dashboard for management
- Visitor tracking and analytics
- OTP-based authentication support for password recovery (for future registration also needs OTP)

**Tech Stack:**

- Frontend: Next.js 15, React, TypeScript
- Styling: Tailwind CSS v4, Shadcn/UI
- Database: PostgreSQL (Supabase)
- ORM: Prisma
- Authentication: JWT + bcryptjs
- UI Components: Radix UI
- Forms: React Hook Form + Zod validation
- State Management: React Context API
- Notifications: Sonner (Toast)

---

## Tech Stack Details

| Technology      | Version | Purpose                         |
| --------------- | ------- | ------------------------------- |
| Next.js         | 15.5.11 | React framework with App Router |
| React           | 19.1.0  | UI library                      |
| TypeScript      | 5.9.3   | Type safety                     |
| Tailwind CSS    | 4.1.18  | Styling                         |
| Shadcn/UI       | Latest  | Pre-built components            |
| Supabase        | 2.93.3  | PostgreSQL hosting + Auth       |
| Prisma          | 7.3.0   | ORM for database                |
| Zod             | 3.25.76 | Schema validation               |
| React Hook Form | 7.71.1  | Form management                 |
| Sonner          | 2.0.7   | Toast notifications             |
| bcryptjs        | 3.0.3   | Password hashing                |
| jsonwebtoken    | 9.0.3   | JWT token generation            |

---

## Directory Structure

```
ecommerce-mvp/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home page
│   ├── globals.css                   # Global styles
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx             # Login page
│   │   ├── register/
│   │   │   └── page.tsx             # Registration page
│   │   └── dashboard/
│   │       └── page.tsx             # User dashboard (protected)
│   │
│   ├── products/                     # Product pages
│   │   ├── page.tsx                 # Product listing with filters
│   │   └── [id]/
│   │       └── page.tsx             # Product detail page
│   │
│   ├── cart/
│   │   └── page.tsx                 # Shopping cart page
│   │
│   ├── checkout/
│   │   └── page.tsx                 # Checkout page
│   │
│   ├── orders/                       # Order pages
│   │   ├── page.tsx                 # Order history
│   │   └── [id]/
│   │       └── page.tsx             # Order detail
│   │
│   ├── admin/                        # Admin pages (role-protected)
│   │   ├── page.tsx                 # Admin dashboard
│   │   ├── orders/
│   │   │   └── page.tsx             # Admin order management
│   │   ├── products/
│   │   │   ├── new
│   │   │   │   └── page.tsx
│   │   │   ├── edit
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx             # Admin product management
│   │   └── users/
│   │       └── page.tsx             # Admin user management
│   │
│   └── api/                          # API routes
│       ├── auth/
│       │   ├── register/route.ts    # User registration
│       │   ├── login/route.ts       # User login
│       │   ├── logout/route.ts      # User logout
│       │   └── me/route.ts          # Get current user
│       │
│       ├── products/
│       │   ├── route.ts             # List products (GET), Create (POST)
│       │   └── [id]/route.ts        # Get/Update/Delete product
│       │
│       ├── cart/
│       │   ├── route.ts             # Get cart, Add to cart
│       │   └── [id]/route.ts        # Update/Remove cart item
│       │
│       ├── orders/
│       │   ├── route.ts             # Get all orders, Create order
│       │   └── [id]/route.ts        # Get order, Cancel order
│       │
│       └── admin/
│           ├── orders/
│           │   ├── route.ts         # List all orders (admin)
│           │   └── [id]/route.ts    # Update order status
│           └── users/
│               ├── route.ts         # List all users (admin)
│               └── [id]/route.ts    # Update user status
│
├── components/                       # Reusable React components
│   ├── auth/
│   │   ├── login-form.tsx           # Login form component
│   │   └── register-form.tsx        # Registration form component
│   │
│   ├── products/
│   │   ├── product-card.tsx         # Product card display
│   │   └── product-filters.tsx      # Product filter sidebar
│   │
│   ├── notifications/
│   │   └── toast-notification.tsx   # Toast notification system
│   │
│   ├── theme-provider.tsx            # Theme provider wrapper
│   │
│   └── ui/                           # Shadcn/UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── badge.tsx
│       ├── spinner.tsx
│       └── [30+ more UI components]
│
├── lib/                              # Utility functions & services
│   ├── auth/
│   │   ├── context.tsx              # Auth context provider
│   │   ├── middleware.ts            # Auth verification utilities
│   │   ├── jwt.ts                   # JWT token creation/verification
│   │   ├── password.ts              # Password hashing/verification
│   │   └── schemas.ts               # Zod validation schemas for auth
│   │
│   ├── cart/
│   │   └── context.tsx              # Cart context provider
│   │
│   ├── products/
│   │   └── schemas.ts               # Product validation schemas
│   │
│   ├── email/
│   │   └── service.tsx              # Email service templates
│   │
│   ├── supabase/
│   │   ├── SupabaseClient.ts                # Supabase client (browser)
│   │   └── SupabaseServer.ts                # Supabase server client
│   │
│   ├── db.ts                        # Prisma client singleton
│   ├── utils.ts                     # General utility functions
│
├── hooks/                            # Custom React hooks
│   ├── use-mobile.ts                # Mobile device detection
│   └── use-toast.ts                 # Toast notification hook
│
├── prisma/
│   └── schema.prisma                # Prisma ORM schema (database models)
│
├── scripts/
│   └── supabase_schema.sql          # Complete Supabase schema with RLS
│
├── public/                           # Static assets
│   ├── logo.png
│   └── icon.svg
│
├── styles/
│   └── globals.css                  # Global styles
│
├── docs/                             # Documentation files
│   ├── AUTH_SYSTEM.md               # Authentication system docs
│   ├── SUPABASE_SETUP.md            # Supabase setup guide
│   ├── NOTIFICATIONS.md             # Email & notifications docs
│   └── PROJECT_STRUCTURE.md         # This file
│
├── next.config.mjs                  # Next.js configuration
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── postcss.config.mjs               # PostCSS configuration
├── components.json                  # Shadcn/UI config
├── package.json                     # Project dependencies
└── pnpm-lock.yaml                   # Dependency lock file
```

---

## Database Schema

### Tables Overview

#### 1. **users**

Stores user profiles and authentication data.

| Column     | Type        | Description                    |
| ---------- | ----------- | ------------------------------ |
| id         | UUID        | Primary key (unique user ID)   |
| email      | TEXT        | Unique email address           |
| name       | TEXT        | User's full name               |
| password   | TEXT        | Hashed password (bcrypt)       |
| phone      | TEXT        | Contact phone number           |
| address    | TEXT        | Shipping address               |
| role       | user_role   | SUPERADMIN, ADMIN, or CUSTOMER |
| status     | user_status | ACTIVE, INACTIVE, or BANNED    |
| created_at | TIMESTAMP   | Account creation date          |
| updated_at | TIMESTAMP   | Last update date               |

**Indexes:** email, role, status

#### 2. **categories**

Product categories with support for subcategories.

| Column      | Type         | Description                       |
| ----------- | ------------ | --------------------------------- |
| id          | UUID         | Primary key                       |
| title       | VARCHAR(255) | Category name                     |
| description | TEXT         | Category description              |
| image       | VARCHAR(255) | Category image URL                |
| parent_id   | UUID         | Parent category for subcategories |
| created_at  | TIMESTAMP    | Creation date                     |
| updated_at  | TIMESTAMP    | Last update date                  |

**Indexes:** parent_id, title

#### 3. **products**

Product catalog.

| Column         | Type          | Description               |
| -------------- | ------------- | ------------------------- |
| id             | UUID          | Primary key               |
| title          | TEXT          | Product name              |
| description    | TEXT          | Product description       |
| category_id    | UUID          | Foreign key to categories |
| price          | DECIMAL(10,2) | Base product price        |
| images         | TEXT[]        | Array of image URLs       |
| average_rating | DECIMAL(3,2)  | Average customer rating   |
| created_at     | TIMESTAMP     | Creation date             |
| updated_at     | TIMESTAMP     | Last update date          |

**Indexes:** category_id, price, title

#### 4. **product_variants**

Product variants (color, size, unit with separate pricing).

| Column     | Type          | Description                 |
| ---------- | ------------- | --------------------------- |
| id         | UUID          | Primary key                 |
| product_id | UUID          | Foreign key to products     |
| color      | VARCHAR(100)  | Variant color               |
| size       | VARCHAR(100)  | Variant size                |
| unit       | VARCHAR(100)  | Variant unit (e.g., ml, kg) |
| price      | DECIMAL(10,2) | Variant-specific price      |
| created_at | TIMESTAMP     | Creation date               |
| updated_at | TIMESTAMP     | Last update date            |

**Indexes:** product_id, color, size

#### 5. **orders**

Customer orders with human-readable tracking IDs.

| Column        | Type          | Description                                                     |
| ------------- | ------------- | --------------------------------------------------------------- |
| id            | UUID          | Primary key                                                     |
| order_number  | VARCHAR(50)   | Human-readable order ID (e.g., ORD-0226-0001)                   |
| user_id       | UUID          | Foreign key to users                                            |
| total_price   | DECIMAL(12,2) | Total order amount                                              |
| shipping_info | TEXT          | Shipping address                                                |
| status        | order_status  | PENDING, CONFIRMED, SHIPPED, READY, COMPLETED, CANCELED, FAILED |
| created_at    | TIMESTAMP     | Order creation date                                             |
| updated_at    | TIMESTAMP     | Last update date                                                |

**Indexes:** user_id, status, order_number
**Unique:** order_number

#### 6. **order_items**

Individual items in an order (supports variants).

| Column     | Type          | Description                     |
| ---------- | ------------- | ------------------------------- |
| id         | UUID          | Primary key                     |
| order_id   | UUID          | Foreign key to orders           |
| product_id | UUID          | Foreign key to products         |
| variant_id | UUID          | Foreign key to product_variants |
| quantity   | INTEGER       | Item quantity (>0)              |
| price      | DECIMAL(10,2) | Price at time of order          |
| created_at | TIMESTAMP     | Date added                      |

**Indexes:** order_id, product_id, variant_id

#### 7. **ratings**

Product reviews and ratings with moderation flag.

| Column     | Type      | Description             |
| ---------- | --------- | ----------------------- |
| id         | UUID      | Primary key             |
| user_id    | UUID      | Foreign key to users    |
| product_id | UUID      | Foreign key to products |
| rating     | SMALLINT  | Rating 1-5 stars        |
| review     | TEXT      | Review text (optional)  |
| moderated  | BOOLEAN   | Admin moderation status |
| created_at | TIMESTAMP | Creation date           |
| updated_at | TIMESTAMP | Last update date        |

**Indexes:** product_id, user_id, moderated
**Unique:** user_id + product_id (one rating per user per product)

#### 8. **cart_items**

Shopping cart items (supports variants).

| Column     | Type      | Description                     |
| ---------- | --------- | ------------------------------- |
| id         | UUID      | Primary key                     |
| user_id    | UUID      | Foreign key to users            |
| product_id | UUID      | Foreign key to products         |
| variant_id | UUID      | Foreign key to product_variants |
| quantity   | INTEGER   | Item quantity (default: 1)      |
| created_at | TIMESTAMP | Date added                      |
| updated_at | TIMESTAMP | Last update date                |

**Indexes:** user_id, product_id
**Unique:** user_id + product_id + variant_id

#### 9. **visitor_tracking**

Analytics tracking for page visits, product clicks, and searches.

| Column         | Type         | Description                               |
| -------------- | ------------ | ----------------------------------------- |
| id             | UUID         | Primary key                               |
| session_id     | VARCHAR(255) | Unique session identifier                 |
| user_id        | UUID         | Foreign key to users (null for anonymous) |
| ip_address     | VARCHAR(45)  | Visitor IP address                        |
| location       | VARCHAR(255) | Geographic location                       |
| device_info    | TEXT         | Device information                        |
| pages_visited  | TEXT[]       | Array of visited page paths               |
| product_clicks | TEXT[]       | Array of clicked product IDs              |
| searches       | TEXT[]       | Array of search queries                   |
| duration       | INTEGER      | Session duration in seconds               |
| visited_at     | TIMESTAMP    | Session start time                        |

**Indexes:** user_id, session_id, visited_at

#### 10. **otp**

One-time passwords for authentication.

| Column     | Type      | Description          |
| ---------- | --------- | -------------------- |
| id         | UUID      | Primary key          |
| user_id    | UUID      | Foreign key to users |
| otp_hash   | TEXT      | Hashed OTP value     |
| expires_at | TIMESTAMP | OTP expiration time  |
| created_at | TIMESTAMP | Creation date        |

**Indexes:** user_id, expires_at

### 11. **order_counters**

Order number tracking table used to generate sequential, human-readable order IDs per month.

| Column      | Type    | Description                        |
| ----------- | ------- | ---------------------------------- |
| year_month  | CHAR(4) | Month/year for counter (e.g. 0226) |
| last_number | INTEGER | Last order number generated        |

**Primary key:** year_month

---

## API Routes

### Authentication Routes

#### `POST /api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "jwt_token"
}
```

#### `POST /api/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "CUSTOMER"
  },
  "token": "jwt_token"
}
```

#### `POST /api/auth/logout`

Logout user (clears JWT cookie).

**Response (200):**

```json
{ "success": true }
```

#### `GET /api/auth/me`

Get current authenticated user.

**Response (200):**

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CUSTOMER"
}
```

---

### Product Routes

#### `GET /api/products`

List all products with optional filters.

**Query Parameters:**

- `category`: Filter by category ID
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `search`: Search by title
- `page`: Pagination (default: 1)
- `limit`: Items per page (default: 10)

**Response (200):**

```json
{
  "products": [
    {
      "id": "prod_123",
      "title": "Product Name",
      "price": 99.99,
      "category": "Category",
      "images": ["url1", "url2"],
      "averageRating": 4.5
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 10
}
```

#### `GET /api/products/[id]`

Get product details with ratings.

**Response (200):**

```json
{
  "id": "prod_123",
  "title": "Product",
  "description": "Description",
  "price": 99.99,
  "images": ["url"],
  "averageRating": 4.5,
  "ratings": [
    {
      "id": "rating_1",
      "rating": 5,
      "review": "Great product!",
      "user": { "name": "John", "email": "john@example.com" }
    }
  ]
}
```

#### `POST /api/products` (Admin)

Create new product.

#### `PUT /api/products/[id]` (Admin)

Update product details.

#### `DELETE /api/products/[id]` (Admin)

Delete product.

---

### Cart Routes

#### `GET /api/cart`

Get user's shopping cart.

**Response (200):**

```json
{
  "cartItems": [
    {
      "id": "cart_1",
      "product": { "id": "prod_123", "title": "Product", "price": 99.99 },
      "quantity": 2
    }
  ],
  "total": 199.98
}
```

#### `POST /api/cart`

Add item to cart.

**Request Body:**

```json
{
  "productId": "prod_123",
  "quantity": 2,
  "variantId": "optional_variant_id"
}
```

#### `PUT /api/cart/[id]`

Update cart item quantity.

**Request Body:**

```json
{
  "quantity": 3
}
```

#### `DELETE /api/cart/[id]`

Remove item from cart.

---

### Order Routes

#### `GET /api/orders`

Get user's orders.

**Response (200):**

```json
[
  {
    "id": "order_1",
    "orderNumber": "ORD-0226-0001",
    "totalPrice": 299.97,
    "status": "CONFIRMED",
    "items": [...]
  }
]
```

#### `POST /api/orders`

Create new order (place order).

**Request Body:**

```json
{
  "shippingInfo": "123 Main St, City, State 12345"
}
```

#### `GET /api/orders/[id]`

Get specific order details.

#### `PUT /api/orders/[id]`

Cancel order (only PENDING or CONFIRMED).

---

### Admin Routes

#### `GET /api/admin/orders`

List all orders (admin only).

#### `PUT /api/admin/orders/[id]`

Update order status (admin only).

**Request Body:**

```json
{
  "status": "SHIPPED"
}
```

#### `GET /api/admin/users`

List all users (admin only).

#### `PUT /api/admin/users/[id]` (SuperAdmin)

Update user status.

**Request Body:**

```json
{
  "status": "BANNED"
}
```

#### `DELETE /api/admin/users/[id]` (SuperAdmin)

Delete user.

---

## Components

### Authentication Components

#### `<login-form />`

Login form with email and password fields.

**Props:** None (uses internal state)

**Features:**

- Email validation
- Password field with show/hide toggle
- Loading state
- Error handling

#### `<register-form />`

Registration form with email, password, and name fields.

**Props:** None (uses internal state)

**Features:**

- Name, email, password inputs
- Password confirmation
- Form validation with Zod
- Error messages with toast

### Product Components

#### `<product-card />`

Displays a single product in grid.

**Props:**

```typescript
{
  product: Product;
  onAddToCart?: (product: Product) => void;
}
```

#### `<product-filters />`

Filter sidebar for products.

**Props:**

```typescript
{
  onFilterChange: (filters: FilterOptions) => void;
}
```

**Features:**

- Category filter
- Price range slider
- Rating filter

### Notification Component

#### `<toast-notifications />`

Toast notification system using Sonner.

**Features:**

- Success messages
- Error alerts
- Info notifications
- Auto-dismiss

---

## Utilities & Libraries

### Authentication (`lib/auth/`)

#### `context.tsx` - AuthContext

Manages global authentication state.

**Provides:**

- Current user
- Login/logout/register functions

- Auth status
- Error handling

#### `middleware.ts`

- Route protection and authorization.
- Page visibility for admins and superadmins

**Functions:**

- `verifyAuth()` - Verify JWT token
- `withAuth()` - Wrapper for protected routes
- `withAdminAuth()` - Wrapper for admin routes
- `withSuperAdminAuth()` - Wrapper for Superadmin routes

#### `jwt.ts`

JWT token management.

**Functions:**

- `createToken(payload)` - Create JWT
- `verifyToken(token)` - Verify JWT
- `decodeToken(token)` - Decode JWT

#### `password.ts`

Password security.

**Functions:**

- `hashPassword(password)` - Hash with bcrypt
- `verifyPassword(password, hash)` - Verify password

#### `schemas.ts`

Zod validation schemas for auth.

**Schemas:**

- `registerSchema` - Registration validation
- `loginSchema` - Login validation

### Cart (`lib/cart/`)

#### `context.tsx` - CartContext

Manages shopping cart state.

**Provides:**

- Cart items
- Add/remove/update functions
- Cart total
- Item count

### Database (`lib/db.ts`)

Prisma client singleton for database queries.

### Email (`lib/email/service.tsx`)

Email templates and sending.

**Templates:**

- Order confirmation
- Order status updates
- Password reset
- Welcome emails

### Supabase (`lib/supabase/`)

#### `SupabaseClient.ts`

Browser-side Supabase client.

#### `SupabaseServer.ts`

Server-side Supabase client with admin key.

---

## Authentication Flow

### Registration Flow

```
User → /register page
  ↓
Fill form (email, password, name)
  ↓
POST /api/auth/register
  ↓
Validate input with Zod schema
  ↓
Check if email exists
  ↓
Hash password with bcryptjs
  ↓
Create user in database
  ↓
Generate JWT token
  ↓
Set HTTP-only cookie
  ↓
Redirect to /home
```

### Login Flow

```
User → /login page
  ↓
Enter email & password
  ↓
POST /api/auth/login
  ↓
Find user by email
  ↓
Verify password with bcryptjs
  ↓
Generate JWT token
  ↓
Set HTTP-only cookie
  ↓
Redirect to /home or previous page
```

### Protected Routes

```
User accesses protected page
  ↓
Check for JWT cookie
  ↓
If missing → Redirect to /login
  ↓
If exists → Verify JWT
  ↓
If invalid/expired → Redirect to /login
  ↓
If valid → Show protected content
```

---

## Key Features

### 1. User Authentication

- Registration with email/password
- Secure login with bcryptjs password hashing
- JWT-based sessions
- HTTP-only cookie storage
- Protected routes and API endpoints

### 2. Product Management

- Browse products with categories
- Search and filter products
- View product details with ratings
- Admin can create/edit/delete products
- Support for product variants (color, size, unit)

### 3. Shopping Cart

- Add/remove items from cart
- Update quantities
- Persistent cart state
- Cart total calculation

### 4. Order Management

- Place orders with checkout
- Human-readable order tracking IDs (ORD-MMDD-XXXX)
- Order tracking id is only generated after admin confirms the order
- Order status tracking
- Order history for users
- Admin order management

### 5. Reviews & Ratings

- Users can rate and review products
- Rating moderation by admin
- Average rating calculation

### 6. Admin Dashboard

- View all orders
- Update order status
- Manage users (ADMIN role)
- SUPERADMIN-only: Delete users, create admins, view tracking

### 7. Visitor Tracking

- Track page visits
- Track product clicks
- Track search submissions
- Session analytics
- SUPERADMIN-only access

### 8. Role-Based Access Control

- **SUPERADMIN**: Full system access, user management, tracking
- **ADMIN**: Order management, product management
- **CUSTOMER**: Browse, order, rate products

---

## Environment Variables

### Required in `.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Configuration
JWT_SECRET=your_random_secret_key_min_32_chars

# Email Service (if using)
mailjet APIs goes here
```

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <repository>
cd amba-ecommerce
npm install
```

### 2. Database Setup

- Create Supabase project
- Copy SQL from `/scripts/supabase_schema.sql`
- Paste into Supabase SQL Editor and run
- Create first SUPERADMIN user manually

### 3. Environment Configuration

- Copy `.env.example` to `.env.local`
- Add Supabase credentials
- Add JWT_SECRET
- Add email service credentials (optional)

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. First Login

- Go to `/register` and create account SUPERADMIN can update the role
- Login and access admin panel

---

## File Naming Conventions

- **Pages:** `page.tsx`
- **API Routes:** `route.ts`
- **Components:** `login-form.tsx`
- **Utilities:** camelCase (e.g., `authUtils.ts`)
- **Constants:** UPPER_SNAKE_CASE
- **Types:** TypeScript interfaces/types with `T` prefix or in separate `.types.ts` files

---

## Git Workflow

1. Create feature branch from `main`
2. Make changes following conventions
3. Test thoroughly
4. Create pull request
5. Merge after review

---

## Performance Optimizations

- Image optimization with Next.js Image component
- Code splitting with dynamic imports
- Caching strategies with SWR
- Database indexing on frequently queried fields
- RLS policies for security at database level

---

## Security Features

- Password hashing with bcryptjs
- JWT token validation
- HTTP-only cookies (CSRF protection)
- Row Level Security (RLS) in Supabase
- Input validation with Zod schemas
- Rate limiting recommendations for production

---

## Deployment Checklist

- [x] Set all environment variables
- [ ] Run database migrations
- [ ] Test all auth flows
- [ ] Verify RLS policies
- [ ] Set up email service
- [ ] More coming soo...

---

## Contributing

Follow the project structure, naming conventions, and testing requirements when contributing.

---

## Support & Documentation

- See `AUTH_SYSTEM.md` for authentication details
- See `SUPABASE_SETUP.md` for database setup
- See `NOTIFICATIONS.md` for email configuration

---

**Last Updated:** 2026-02-05
**Project Version:** 0.1.0
**Status:** Development
