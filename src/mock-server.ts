// mock-server.ts — servidor falso para desarrollo
import express from 'express';
const app = express();
app.use(express.json());

// Simula catalog service
app.get('/products/:id', (req, res) => {
  res.json({
    id: Number(req.params.id),
    store_id: 1,
    name: 'Producto test',
    price: 65.00,
    active: true
  });
});

app.get('/stores/:id', (req, res) => {
  res.json({
    id: Number(req.params.id),
    name: 'Cafetería test',
    active: true,
    opening_time: '07:00',
    closing_time: '21:00',
    admin_id: 2
  });
});

// Simula store-admin service
app.get('/product/:id/stock', (req, res) => {
  res.json({ stock: 100 });
});

app.post('/product/:id/stock', (req, res) => {
  res.json({ ok: true });
});


// Simula payments service
app.post('/payments/:orderId/refund', (req, res) => {
  console.log(`Refund requested for order ${req.params.orderId}`);
  res.json({ ok: true });
});

// Simular notifications service
// =========================================================
// NOTIFICATIONS SERVICE
// =========================================================
 
// POST /notifications/order-confirmed — sent to customer (with OTP) + store on payment confirmed
app.post('/notifications/order-confirmed', (req, res) => {
  const { order_id, customer_email, store_email, otp } = req.body;
  console.log(`[notifications] order-confirmed — order: ${order_id} | customer: ${customer_email} | otp: ${otp}`);
  res.json({ ok: true });
});
 
// POST /notifications/order-status-updated — sent to customer on status change
app.post('/notifications/order-status-updated', (req, res) => {
  const { order_id, customer_email, status } = req.body;
  console.log(`[notifications] order-status-updated — order: ${order_id} | customer: ${customer_email} | status: ${status}`);
  res.json({ ok: true });
});
 
// POST /notifications/order-cancelled-by-store — store cancelled, includes refund notice
app.post('/notifications/order-cancelled-by-store', (req, res) => {
  const { order_id, customer_email } = req.body;
  console.log(`[notifications] order-cancelled-by-store — order: ${order_id} | customer: ${customer_email}`);
  res.json({ ok: true });
});
 
// POST /notifications/order-cancelled-by-payment — payment failed, ask customer to retry
app.post('/notifications/order-cancelled-by-payment', (req, res) => {
  const { order_id, customer_email } = req.body;
  console.log(`[notifications] order-cancelled-by-payment — order: ${order_id} | customer: ${customer_email}`);
  res.json({ ok: true });
});

app.listen(3099, () => console.log('Mock server en puerto 3099'));
