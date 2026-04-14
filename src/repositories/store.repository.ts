import { Pool } from "pg";
import { IStore } from "../interfaces";

export class StoreRepository {
    constructor(private readonly pool: Pool) { }

    async create(data: Omit<IStore, "id" | "created_at" | "updated_at">): Promise<IStore> {
        const query = `
        INSERT INTO stores (name, location, opening_time, closing_time, image, active, admin_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `;

        const { rows } = await this.pool.query(query, [
            data.name,
            data.location,
            data.opening_time,
            data.closing_time,
            data.image,
            data.active,
            data.admin_id,
        ]);
        return rows[0];
    }

    async findById(id: number): Promise<IStore | null> {
        const query = `SELECT * FROM stores WHERE id = $1`;
        const { rows } = await this.pool.query(query, [id]);
        return rows[0] || null;
    }

    async update(id: number, data: Partial<Omit<IStore, "id" | "created_at" | "updated_at" | "admin_id">>): Promise<IStore | null> {
        const allowedFields = ["name", "location", "opening_time", "closing_time", "image", "active"];
        const fields = Object.keys(data).filter(f => allowedFields.includes(f));
        if (fields.length === 0) return null;

        const setClause = fields
            .map((field, index) => `${field} = $${index + 1}`)
            .join(", ");

        const values = fields.map(f => (data as any)[f]);

        const query = `
      UPDATE stores
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
        const { rows } = await this.pool.query(query, [...values, id]);
        return rows[0] ?? null;
    }

    async softDelete(id: number): Promise<boolean> {
        const query = `UPDATE stores SET active = false WHERE id = $1`;
        const { rowCount } = await this.pool.query(query, [id]);
        return rowCount !== null && rowCount > 0;
    }

    async findByAdminId(admin_id: number): Promise<IStore[]> {
        const query = `SELECT * FROM stores WHERE admin_id = $1 AND active = true`;
        const { rows } = await this.pool.query(query, [admin_id]);
        return rows;
    }

}