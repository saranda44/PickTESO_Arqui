import pool from './db';
import { PoolClient } from 'pg';
import {
  Order,
  OrderProduct,
  OrderWithProducts,
  OrderProductDetail,
  OrderStatus,
} from '../models/order.model';

export const OrderRepository = {
    getClient,
    findById,
    findByUserId,
    findByStoreId,
    findByIdWithProducts,
    createOrder,
    createOrderProducts,
    updateStatus
}


// Find one order by id
async function findById(orderId: number): Promise<Order | null> {
    const { rows } = await pool.query<Order>(
        `SELECT * FROM orders WHERE id = $1`,
        [orderId]
    );
    return rows[0] ?? null;
}

// Find all orders for a specific user
async function findByUserId(userId: number): Promise<Order[]> {
    const { rows } = await pool.query<Order>(
        `SELECT * FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}


// Find all orders for a specific store
async function findByStoreId(storeId: number): Promise<Order[]> {
    const { rows } = await pool.query<Order>(
        `SELECT * FROM orders
        WHERE store_id = $1
        ORDER BY created_at DESC`,
        [storeId]
    );
    return rows;
}


 // ---------------------------------------------------------
  // Find order with full details:
  //   - customer info (from users)
  //   - store info + admin email (from stores JOIN users)
  //   - items with product name (from order_products JOIN products)
  // ---------------------------------------------------------
  async function findByIdWithProducts(orderId: number): Promise<OrderWithProducts | null> {
    // Query 1: order + customer + store info
    const orderResult = await pool.query(
      `SELECT
        o.id,
        o.user_id,
        o.store_id,
        o.total,
        o.status,
        o.created_at,
        o.updated_at,
 
        -- customer info
        u.id              AS customer_id,
        u.first_name      AS customer_first_name,
        u.paternal_last_name AS customer_paternal_last_name,
        u.maternal_last_name AS customer_maternal_last_name,
        u.email           AS customer_email,
 
        -- store info (email comes from the store admin user)
        s.id              AS store_id_detail,
        s.name            AS store_name,
        sa.email          AS store_email
 
       FROM orders o
       JOIN users  u  ON u.id  = o.user_id
       JOIN stores s  ON s.id  = o.store_id
       LEFT JOIN users sa ON sa.id = s.admin_id
       WHERE o.id = $1`,
      [orderId]
    );
 
    if (orderResult.rows.length === 0) return null;
 
    const row = orderResult.rows[0];
 
    // Query 2: items with product name
    const itemsResult = await pool.query<OrderProductDetail>(
      `SELECT
        op.id,
        op.order_id,
        op.product_id,
        op.quantity,
        op.unit_price,
        p.name
       FROM order_products op
       JOIN products p ON p.id = op.product_id
       WHERE op.order_id = $1`,
      [orderId]
    );
 
    return {
      // order fields
      id:         row.id,
      user_id:    row.user_id,
      store_id:   row.store_id,
      total:      row.total,
      status:     row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
 
      // customer object
      customer: {
        id:                   row.customer_id,
        first_name:           row.customer_first_name,
        paternal_last_name:   row.customer_paternal_last_name,
        maternal_last_name:   row.customer_maternal_last_name,
        email:                row.customer_email,
      },
 
      // store object
      store: {
        id:    row.store_id_detail,
        name:  row.store_name,
        email: row.store_email,
      },
 
      // items with product name
      items: itemsResult.rows,
    };
  }


// Create order (inside a transaction client)
async function createOrder(client: PoolClient, userId: number, storeId: number,total: number): Promise<Order> {
    const { rows } = await client.query<Order>(
        `INSERT INTO orders (user_id, store_id, total, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING *`,
        [userId, storeId, total]
    );
    return rows[0];
}


// Insert order products (inside a transaction client)
async function createOrderProducts(
    client: PoolClient, 
    orderId: number, 
    items: { product_id: number; quantity: number; unit_price: number }[]): Promise<OrderProduct[]> {
    const inserted: OrderProduct[] = [];

    for (const item of items) {
        const { rows } = await client.query<OrderProduct>(
        `INSERT INTO order_products (order_id, product_id, quantity, unit_price)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
        [orderId, item.product_id, item.quantity, item.unit_price]
        );
        inserted.push(rows[0]);
    }

    return inserted;
}


// Update order status 
async function updateStatus(orderId: number, newStatus: OrderStatus, expectedCurrentStatus: OrderStatus): Promise<Order | null> {
    const { rows } = await pool.query<Order>(
        `UPDATE orders
        SET status = $1
        WHERE id = $2 AND status = $3
        RETURNING *`,
        [newStatus, orderId, expectedCurrentStatus]
    );
    return rows[0] ?? null;
}


// Get a transaction client from the pool
async function getClient() {
    return pool.connect();
}