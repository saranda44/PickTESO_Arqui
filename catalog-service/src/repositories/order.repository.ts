import { Pool } from "pg";
import {
  Order,
  OrderWithProducts,
} from '../interfaces/order.interface';

export class OrderRepository {
    constructor(private readonly pool: Pool) { }
    
    async findByUserIdWithProducts(userId: number): Promise<OrderWithProducts[]> {
        const { rows } = await this.pool.query(
            `SELECT 
                o.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'product_id', p.id,
                            'name', p.name,
                            'product_image', p.product_image,
                            'quantity', op.quantity,
                            'unit_price', op.unit_price
                        )
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'
                ) AS products
            FROM orders o
            LEFT JOIN order_products op ON op.order_id = o.id
            LEFT JOIN products p ON p.id = op.product_id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC`,
            [userId]
        );
        return rows;
    }
}
