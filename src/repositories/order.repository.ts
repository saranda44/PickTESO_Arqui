import pool from './db';
import { PoolClient } from 'pg';
import {
  Order,
  OrderProduct,
  OrderWithProducts,
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


// Find order with its products
async function findByIdWithProducts(orderId: number): Promise<OrderWithProducts | null> {
    const orderResult = await pool.query<Order>(
        `SELECT * FROM orders WHERE id = $1`,
        [orderId]
    );
    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];

    const itemsResult = await pool.query<OrderProduct>(
        `SELECT * FROM order_products WHERE order_id = $1`,
        [orderId]
    );

    return { ...order, items: itemsResult.rows };
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