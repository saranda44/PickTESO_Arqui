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
app.post('/notifications/order-confirmed', (req, res) => {
  console.log(`[notifications] order-confirmed — order_id: ${req.body.order_id}`);
  res.json({ ok: true });
});

app.post('/notifications/order-status-updated', (req, res) => {
  console.log(`[notifications] order-status-updated — order_id: ${req.body.order_id}, status: ${req.body.status}`);
  res.json({ ok: true });
});

app.post('/notifications/order-cancelled', (req, res) => {
  console.log(`[notifications] order-cancelled — order_id: ${req.body.order_id}`);
  res.json({ ok: true });
});

app.listen(3099, () => console.log('Mock server en puerto 3099'));
