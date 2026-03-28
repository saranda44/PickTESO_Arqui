# PickTESO Notifications Service

Email delivery service for order events. Sends transactional emails via AWS SES.

## Quick Start

```bash
npm install
npm run dev
```

Health check: `GET /health`

---

## What it does

Sends emails when:
- Order is confirmed → Customer + Store emails
- Order status changes → Customer email
- Order cancelled by store → Customer email
- Order payment fails → Customer email

---

## Environment Variables (.env)

```env
PORT=3003
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
SES_FROM_EMAIL=no-reply@your-domain.com
```

**Required:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SES_FROM_EMAIL`

---

## Endpoints

### `POST /api/notifications/order-confirmed`

Sends confirmation email to customer (with OTP) + store.

**Body:**
```json
{
  "order_id": 123,
  "customer_email": "ana@example.com",
  "store_email": "store@example.com",
  "otp": "123456",
  "order": {
    "id": 123,
    "total": 195.0,
    "status": "paid",
    "created_at": "2026-03-28T20:30:00Z",
    "customer": {
      "first_name": "Ana",
      "paternal_last_name": "Lopez",
      "email": "ana@example.com"
    },
    "store": {
      "name": "Cafeteria Centro",
      "email": "store@example.com"
    },
    "items": [
      {
        "product_id": 10,
        "name": "Sandwich",
        "quantity": 2,
        "unit_price": 65
      }
    ]
  }
}
```

**Response 200:**
```json
{ "ok": true }
```

---

### `POST /api/notifications/order-status-updated`

Sends status update email to customer.

**Body:**
```json
{
  "order_id": 123,
  "customer_email": "ana@example.com",
  "status": "preparing",
  "order": {
    "id": 123,
    "total": 195.0,
    "status": "preparing",
    "created_at": "2026-03-28T20:30:00Z",
    "customer": {
      "first_name": "Ana",
      "paternal_last_name": "Lopez",
      "email": "ana@example.com"
    },
    "store": {
      "name": "Cafeteria Centro",
      "email": "store@example.com"
    },
    "items": [
      {
        "product_id": 10,
        "name": "Sandwich",
        "quantity": 2,
        "unit_price": 65
      }
    ]
  }
}
```

**Response 200:**
```json
{ "ok": true }
```

---

### `POST /api/notifications/order-cancelled-by-store`

Sends cancellation email to customer (store initiated).

**Body:**
```json
{
  "order_id": 123,
  "customer_email": "ana@example.com",
  "order": {
    "id": 123,
    "total": 195.0,
    "status": "cancelled",
    "created_at": "2026-03-28T20:30:00Z",
    "customer": {
      "first_name": "Ana",
      "paternal_last_name": "Lopez",
      "email": "ana@example.com"
    },
    "store": {
      "name": "Cafeteria Centro",
      "email": "store@example.com"
    },
    "items": [
      {
        "product_id": 10,
        "name": "Sandwich",
        "quantity": 2,
        "unit_price": 65
      }
    ]
  }
}
```

**Response 200:**
```json
{ "ok": true }
```

---

### `POST /api/notifications/order-cancelled-by-payment`

Sends cancellation email to customer (payment failed).

**Body:**
```json
{
  "order_id": 123,
  "customer_email": "ana@example.com",
  "order": {
    "id": 123,
    "total": 195.0,
    "status": "cancelled",
    "created_at": "2026-03-28T20:30:00Z",
    "customer": {
      "first_name": "Ana",
      "paternal_last_name": "Lopez",
      "email": "ana@example.com"
    },
    "store": {
      "name": "Cafeteria Centro",
      "email": "store@example.com"
    },
    "items": [
      {
        "product_id": 10,
        "name": "Sandwich",
        "quantity": 2,
        "unit_price": 65
      }
    ]
  }
}
```

**Response 200:**
```json
{ "ok": true }
```

---

## Scripts

```bash
npm run dev      # Development
npm run build    # Compile
npm start        # Production
```