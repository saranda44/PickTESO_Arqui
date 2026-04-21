# PickTESO Orders Service
 
Orders microservice for PickTESO. Manages order creation, payments, status updates, and notifications.
 
## Quick Start
 
```bash
npm install
npm run dev
```
 
Health check: `GET /health`
 
---
 
## Order Lifecycle
 
```
pending → paid → preparing → ready → completed
            ↓  
        cancelled
```
 
---
 
## Authentication
 
All endpoints require headers (except payment callbacks):
 
```
x-user-id: <number>
x-user-role: customer | store_admin | platform_admin
```

## Project structure

```text
src/
  app.ts                         # Express app setup, /health, /api routes, error middleware
  index.ts                       # Service entrypoint
  mock-server.ts                 # Local mock server for external dependencies

  clients/
    catalog.client.ts            # Catalog service client
    payment.client.ts            # Payments service client
    notification.client.ts       # Notifications service client
    store-admin.client.ts        # Store Admin service client

  controllers/
    orders.controller.ts         # HTTP layer for orders

  services/
    orders.service.ts            # Business logic for orders

  repositories/
    db.ts                        # PostgreSQL pool initialization
    order.repository.ts          # SQL access layer

  models/
    order.model.ts               # Types, DTOs, status enum
    order.model.sql              # SQL schema for orders and order_products

  routes/
    routes.ts                    # Root /api router
    orders.customer.routes.ts    # Customer routes
    orders.store.route.ts        # Store admin routes

  middlewares/
    auth.middleware.ts
    orders.validation.middleware.ts
    error.middleware.ts

  errors/
    app.error.ts
    http.error.ts
```
---
 
## Endpoints
 
###  Customer
 
#### `POST /api/user/stores/:storeId/orders` - Create Order
 
**Headers:**
```
x-user-id: 7
x-user-role: customer
Content-Type: application/json
```
 
**Body:**
```json
{
  "items": [
    { "product_id": 10, "quantity": 2 },
    { "product_id": 12, "quantity": 1 }
  ]
}
```
 
**Response 201:**
```json
{
  "order": {
    "id": 123,
    "user_id": 7,
    "store_id": 1,
    "total": 195,
    "status": "pending",
    "created_at": "2026-03-28T20:30:00Z",
    "updated_at": "2026-03-28T20:30:00Z",
    "items": [
      {
        "id": 1,
        "order_id": 123,
        "product_id": 10,
        "quantity": 2,
        "unit_price": 65
      }
    ]
  }
}
```
 
---
 
#### `GET /api/user/orders` - List My Orders
 
**Headers:**
```
x-user-id: 7
x-user-role: customer
```
 
**Response 200:**
```json
{
  "orders": [
    {
      "id": 123,
      "user_id": 7,
      "store_id": 1,
      "total": 195,
      "status": "pending",
      "created_at": "2026-03-28T20:30:00Z",
      "updated_at": "2026-03-28T20:30:00Z"
    }
  ]
}
```
 
---
 
#### `GET /api/user/orders/:orderId` - Get Order Details
 
**Headers:**
```
x-user-id: 7
x-user-role: customer
```
 
**Response 200:**
```json
{
  "order": {
    "id": 123,
    "user_id": 7,
    "store_id": 1,
    "total": 195,
    "status": "pending",
    "created_at": "2026-03-28T20:30:00Z",
    "updated_at": "2026-03-28T20:30:00Z",
    "customer": {
      "id": 7,
      "first_name": "Ana",
      "paternal_last_name": "Lopez",
      "maternal_last_name": "Perez",
      "email": "ana@mail.com"
    },
    "store": {
      "id": 1,
      "name": "Cafeteria Centro",
      "email": "admin@store.com"
    },
    "items": [
      {
        "id": 1,
        "order_id": 123,
        "product_id": 10,
        "quantity": 2,
        "unit_price": 65,
        "name": "Sandwich"
      }
    ]
  }
}
```
 
---
 
###  Store Admin
 
#### `PATCH /api/stores/:storeId/orders/:orderId/status` - Update Status
 
**Headers:**
```
x-user-id: 2
x-user-role: store_admin
Content-Type: application/json
```
 
**Body:**
```json
{ "status": "preparing" }
```
 
**Allowed transitions:**
- `paid` → `preparing`
- `preparing` → `ready`
 
**Response 200:**
```json
{
  "order": {
    "id": 123,
    "user_id": 7,
    "store_id": 1,
    "total": 195,
    "status": "preparing",
    "created_at": "2026-03-28T20:30:00Z",
    "updated_at": "2026-03-28T20:35:00Z"
  }
}
```
 
---
 
#### `PATCH /api/stores/:storeId/orders/:orderId/complete` - Complete with OTP
 
**Headers:**
```
x-user-id: 2
x-user-role: store_admin
Content-Type: application/json
```
 
**Body:**
```json
{ "otp": "123456" }
```
 
**Response 200:**
```json
{
  "data": {
    "id": 123,
    "user_id": 7,
    "store_id": 1,
    "total": 195,
    "status": "completed",
    "created_at": "2026-03-28T20:30:00Z",
    "updated_at": "2026-03-28T20:40:00Z"
  }
}
```
 
---
 
#### `DELETE /api/stores/:storeId/orders/:orderId/cancel` - Cancel Order
 
**Headers:**
```
x-user-id: 2
x-user-role: store_admin
```
 
Only cancels if order is in `paid` status. Automatically refunds, restores stock, and notifies customer.
 
**Response 200:**
```json
{
  "order": {
    "id": 123,
    "user_id": 7,
    "store_id": 1,
    "total": 195,
    "status": "cancelled",
    "created_at": "2026-03-28T20:30:00Z",
    "updated_at": "2026-03-28T20:45:00Z"
  },
  "alreadyCancelled": false
}
```
 
---
 
#### `GET /api/stores/:storeId/orders` - List Store Orders
 
**Headers:**
```
x-user-id: 2
x-user-role: store_admin
```
 
**Response 200:**
```json
{
  "orders": [
    {
      "id": 123,
      "user_id": 7,
      "store_id": 1,
      "total": 195,
      "status": "pending",
      "created_at": "2026-03-28T20:30:00Z"
    }
  ]
}
```
 
---
 
#### `GET /api/stores/:storeId/orders/:orderId` - Get Order Details
 
**Headers:**
```
x-user-id: 2
x-user-role: store_admin
```
 
Returns order with complete data (customer, store, items).
 
---
 
### Payment Service Callbacks (no auth)
 
#### `PATCH /api/orders/:orderId/confirm-payment` - Confirm Payment
 
Called by Payments Service when payment succeeds.
 
Transition: `pending` → `paid`
 
**Response 200:**
```json
{
  "order": {
    "id": 123,
    "status": "paid"
  }
}
```
 
---
 
#### `DELETE /api/orders/:orderId/cancel` - Cancel on Payment Failure
 
Called by Payments Service when payment fails.
 
Transition: `pending` → `cancelled`
 
**Response 200:**
```json
{
  "order": {
    "id": 123,
    "status": "cancelled"
  }
}
```
 
---
 
## Error Codes
 
```json
{ "error": "BadRequestError", "message": "..." }      // 400
{ "error": "Unauthorized", "message": "..." }          // 401
{ "error": "Forbidden", "message": "..." }             // 403
{ "error": "NotFound", "message": "..." }              // 404
{ "error": "ConflictError", "message": "..." }         // 409
{ "error": "InternalServerError", "message": "..." }   // 500
```
 
---
 
## Environment Variables (.env)
 
```env
PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5432/db
CATALOG_SERVICE_URL=http://localhost:3099
STORE_ADMIN_SERVICE_URL=http://localhost:3099
NOTIFICATIONS_SERVICE_URL=http://localhost:3099
PAYMENTS_SERVICE_URL=http://localhost:3099
```
 
---
 
## Scripts
 
```bash
npm run dev      # Development
npm run mock     # Mock server
npm run build    # Compile
npm start        # Production
```