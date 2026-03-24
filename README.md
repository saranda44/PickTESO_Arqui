# Payments Microservice

A REST microservice built with **Node.js**, **Express**, and **TypeScript** for processing payments using the **Stripe API** in test/sandbox mode.

---

## Getting Started

### Prerequisites

- Node.js v18+
- A Stripe account with test mode API keys

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root of the project:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
PORT=3000
```

### Run in Development

```bash
npm run dev
```

---

## Project Structure

```
payments-service/
├── src/
│   ├── controllers/
│   │   └── paymentController.ts   # Business logic for all payment operations
│   ├── middlewares/
│   │   └── errorHandler.ts        # Global error handler for Stripe and generic errors
│   ├── routes/
│   │   ├── payments.ts            # Payment routes
│   │   └── health.ts              # Health check route
│   └── app.ts                     # Express app setup
├── .env
├── .gitignore
├── tsconfig.json
└── package.json
```

---

## Endpoints

### Health Check

```
GET /api/health
```

Returns the server status, uptime, and current timestamp.

---

### Create Payment Intent

```
POST /api/payments/create-payment-intent
```

**Body:**

```json
{
  "amount": 1000,
  "currency": "mxn"
}
```

> `amount` is in cents. Example: 1000 = $10.00 MXN

**Allowed currencies:** `mxn`, `usd`, `eur`

**Response:**

```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

---

### Get Payment Intent

```
GET /api/payments/:id
```

Returns the current status of a PaymentIntent.

**Response:**

```json
{
  "id": "pi_xxx",
  "amount": 1000,
  "currency": "mxn",
  "status": "requires_payment_method"
}
```

**Possible statuses:**

| Status | Description |
|--------|-------------|
| `requires_payment_method` | Created, waiting for a card |
| `requires_confirmation` | Card added, pending confirmation |
| `processing` | Payment is being processed |
| `succeeded` | Payment was successful |
| `canceled` | Payment was canceled |

---

### Confirm Payment Intent

```
POST /api/payments/:id/confirm
```

Confirms a PaymentIntent using a test card. The `card` parameter accepts either an enum value or a raw Stripe test card number.

**Body:**

```json
{
  "card": "1"
}
```

**Card options:**

| Value | Card Number           | Result				|
|-------|-----------------------|-----------------------|
| `1`   | `4242 4242 4242 4242` | Payment succeeded		|
| `2`   | `4000 0000 0000 0002` | Card declined			|
| `3`   | `4000 0000 0000 9995` | Insufficient funds	|
| `4`   | `4000 0000 0000 0069` | Expired card			|
| `5`   | `4000 0000 0000 0127` | Incorrect CVC			|
| `6`   | `4000 0025 0000 3155` | 3D Secure required	|

You can also pass the card number directly:

```json
{
  "card": "4242 4242 4242 4242"
}
```

---

### Cancel Payment Intent

```
POST /api/payments/:id/cancel
```

Cancels a PaymentIntent. Only works if the status is `requires_payment_method` or `requires_confirmation`.

> A `succeeded` payment cannot be canceled — use a refund instead.

---

## Testing with curl (Windows CMD)

**Create a payment:**
```bash
curl -X POST http://localhost:3000/api/payments/create-payment-intent ^
  -H "Content-Type: application/json" ^
  -d "{\"amount\": 1000, \"currency\": \"mxn\"}"
```

**Confirm with a successful card:**
```bash
curl -X POST http://localhost:3000/api/payments/pi_YOUR_ID/confirm ^
  -H "Content-Type: application/json" ^
  -d "{\"card\": \"1\"}"
```

**Confirm with a declined card:**
```bash
curl -X POST http://localhost:3000/api/payments/pi_YOUR_ID/confirm ^
  -H "Content-Type: application/json" ^
  -d "{\"card\": \"2\"}"
```

**Cancel a payment:**
```bash
curl -X POST http://localhost:3000/api/payments/pi_YOUR_ID/cancel ^
  -H "Content-Type: application/json"
```

---

## Error Handling

All errors are handled by a global middleware that returns structured responses:

```json
{
  "error": "Your card was declined.",
  "type": "StripeCardError",
  "code": "card_declined"
}
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

- This microservice runs in **Stripe Test Mode** only. No real money is involved.
- Never commit your `.env` file or expose your `STRIPE_SECRET_KEY`.
- To go to production, replace the test key with your live key and verify your Stripe account.