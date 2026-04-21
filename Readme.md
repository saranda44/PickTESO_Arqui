# API Gateway

Central entry point for the PickTESO microservices architecture. Handles Google SSO authentication, JWT generation, role-based authorization, and proxying requests to downstream services.

---

## Getting Started

### Prerequisites

- Node.js v20+
- A Google Cloud project with OAuth 2.0 credentials
- PostgreSQL database (NeonDB or local)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root of the project:

```env
PORT=3000
JWT_SECRET=your_long_and_secure_secret_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
DB_URL=postgresql://user:password@host/db?sslmode=require
CATALOG_SERVICE_URL=http://localhost:3001
ORDERS_SERVICE_URL=http://localhost:3002
NOTIFICATIONS_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3004
SELLERS_SERVICE_URL=http://localhost:3005
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create an OAuth 2.0 Client ID
3. Add the following to your credentials:

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/google/callback
```

4. Enable the **Google People API** in APIs & Services

### Run in Development

```bash
npm run dev
```

---

## Project Structure

```
api-gateway/
├── src/
│   ├── config/
│   │   ├── passport.ts        # Google OAuth2 strategy
│   │   └── proxy.ts           # Proxy config for each microservice
│   ├── controllers/
│   │   └── authController.ts  # Login, register and me handlers
│   ├── db/
│   │   └── client.ts          # PostgreSQL connection pool
│   ├── middlewares/
│   │   └── auth.ts            # authenticate and authorize middlewares
│   ├── routes/
│   │   └── auth.ts            # Auth routes
│   └── app.ts                 # Express app setup
├── .env
├── .gitignore
├── tsconfig.json
└── package.json
```

---

## Endpoints

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/auth/google` | Public | Initiates Google SSO flow |
| `GET` | `/auth/google/callback` | Public | Google callback, returns JWT |
| `POST` | `/auth/register` | Public | Registers a new customer |
| `GET` | `/auth/me` | JWT | Returns the authenticated user |

### Register

```
POST /auth/register
```

**Body:**

```json
{
  "firstName": "Juan",
  "paternalLastName": "Garcia",
  "maternalLastName": "Lopez",
  "email": "juan.garcia@gmail.com"
}
```

**Response:**

```json
{
  "message": "User registered successfully, please login",
  "loginUrl": "http://localhost:3000/auth/google"
}
```

### Login (Google SSO)

Open in browser:
```
http://localhost:3000/auth/google
```

**Response:**

```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 19,
    "email": "juan@gmail.com",
    "role": "customer",
    "firstName": "Juan"
  }
}
```

For `store_admin` role, the response also includes:
```json
{
  "storeId": 1
}
```

---

## Proxy Routes

All requests to downstream services must include a valid JWT in the `Authorization` header.

| Prefix | Target Service | Port |
|--------|---------------|------|
| `/api/catalog` | catalog-service | 3001 |
| `/api/orders` | orders-service | 3002 |
| `/api/notifications` | notifications-service | 3003 |
| `/api/payments` | payment-service | 3004 |
| `/api/sellers` | sellers-service | 3005 |

The JWT is automatically forwarded to each downstream service via the `Authorization` header.

---

## Auth Middlewares

### authenticate

Verifies the JWT token from the `Authorization` header.

```typescript
app.use('/protected-route', authenticate, handler);
```

### authorize

Restricts access to specific roles. Must be used after `authenticate`.

```typescript
app.use('/admin-route', authenticate, authorize('platform_admin'), handler);
app.use('/store-route', authenticate, authorize('store_admin', 'platform_admin'), handler);
```

**Available roles:** `customer`, `store_admin`, `platform_admin`

---

## Roles

| Role | Description |
|------|-------------|
| `customer` | Regular student user |
| `store_admin` | Manages a specific store |
| `platform_admin` | Full platform access |

---

## Testing with curl

**Register a new user:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Juan","paternalLastName":"Garcia","maternalLastName":"Lopez","email":"juan@gmail.com"}'
```

**Get current user:**
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Proxy request to payment-service:**
```bash
curl http://localhost:3000/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Docker

**Build:**
```bash
docker build -t api-gateway .
```

**Run:**
```bash
docker run -p 3000:3000 --env-file .env api-gateway
```

---

## Scripts

```bash
npm run dev      # Run in development with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled build
```

---

## Notes

- JWT tokens expire after 8 hours
- Only `customer` role can self-register via `POST /auth/register`
- `store_admin` and `platform_admin` must be pre-registered in the database
- Never commit your `.env` file or expose your credentials