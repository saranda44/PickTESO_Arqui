import { Pool } from "pg";
import { IInventory } from "../interfaces";

export class InventoryRepository {
    constructor(private readonly pool: Pool) { }

    async create(data: Omit<IInventory, "id" | "created_at" | "updated_at">): Promise<IInventory> {
        const query = `
        INSERT INTO inventory (product_id, movement_type, quantity, moved_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `;

        const { rows } = await this.pool.query(query, [
            data.product_id,
            data.movement_type,
            data.quantity,
            data.moved_at ?? new Date(), // Permite que moved_at sea opcional
        ]);
        return rows[0];
    }


    async delete(id: number): Promise<boolean> {
        const query = `DELETE FROM inventory WHERE id = $1`;
        const { rowCount } = await this.pool.query(query, [id]);
        return rowCount !== null && rowCount > 0;
    }

    async findEntriesByProductId(product_id: number): Promise<IInventory[]> {
        const query = `SELECT * FROM inventory WHERE product_id = $1 ORDER BY moved_at DESC`;
        const { rows } = await this.pool.query(query, [product_id]);
        return rows;
    }

    async findStockByProductId(product_id: number): Promise<number> {
        const query = `
        SELECT 
            SUM(CASE WHEN movement_type = 'in' THEN quantity
                     WHEN movement_type = 'out' THEN -quantity
                     ELSE 0
            END) AS stock
        FROM inventory
        WHERE product_id = $1
        `;
        const { rows } = await this.pool.query(query, [product_id]);
        return Number(rows[0].stock) ?? 0;
    }

    async findById(id: number): Promise<IInventory | null> {
        const query = `SELECT * FROM inventory WHERE id = $1`;
        const { rows } = await this.pool.query(query, [id]);
        return rows[0] || null;
    }

}