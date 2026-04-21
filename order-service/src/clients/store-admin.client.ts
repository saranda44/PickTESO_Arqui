// Store-Admin Service
// Used by Orders to update inventory after order events
import axios from "axios";

const STORE_ADMIN_SERVICE_URL = process.env.STORE_ADMIN_SERVICE_URL;


// Get stock for a single product
// GET /product/:id/stock
// Returns the available stock as a number
export async function getProductStock(productId: number): Promise<number> {
  const endpoint = `${STORE_ADMIN_SERVICE_URL}/inventory/product/${productId}/stock`;
  try {
    const response = await axios.get<{ stock: number }>(endpoint);
    return response.data.stock;
  } catch (error) {
    const err = error as {
      response?: { status?: number; data?: unknown };
      code?: string;
      message?: string;
    };
    const statusOrCode = err.response?.status ?? err.code ?? "unknown";
    const detail = typeof err.response?.data === "string" ? err.response.data : err.message;

    throw new Error(
      `Store-admin service error at ${endpoint}: ${statusOrCode}${
        detail ? ` - ${detail}` : ""
      }`
    );
  }
}
 

// Update stock for a single product
// POST /product/:id/stock
// Body: { quantity, type: 'in' | 'out' }
async function updateProductStock(productId: number,quantity: number, type: 'in' | 'out'): Promise<void> {
  const endpoint = `${STORE_ADMIN_SERVICE_URL}/inventory`;
  try {
    await axios.post(endpoint, { quantity, movement_type: type , product_id:productId});
  } catch (error) {
    const err = error as {
      response?: { status?: number; data?: unknown };
      code?: string;
      message?: string;
    };
    const statusOrCode = err.response?.status ?? err.code ?? "unknown";
    const detail = typeof err.response?.data === "string" ? err.response.data : err.message;

    throw new Error(
      `Store-admin service error at ${endpoint}: ${statusOrCode}${
        detail ? ` - ${detail}` : ""
      }`
    );
  }
}
 

// Deduct inventory for multiple products after order creation
// Calls POST /product/:id/stock with type 'out' for each item
export async function deductInventory(items: { product_id: number; quantity: number }[]): Promise<void> {
  for (const item of items) {
    await updateProductStock(item.product_id, item.quantity, 'out');
  }
}
 
// Restore inventory for multiple products after cancellation
// Calls POST /product/:id/stock with type 'in' for each item
export async function restoreInventory(items: { product_id: number; quantity: number }[]): Promise<void> {
  for (const item of items) {
    await updateProductStock(item.product_id, item.quantity, 'in');
  }
}