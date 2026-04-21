import { Pool } from "pg";
import { ITag } from "../interfaces";

export class TagRepository {
    constructor(private readonly pool: Pool) { }

    async create(data: Omit<ITag, "id" | "created_at" | "updated_at">): Promise<ITag> {
        const query = `
        INSERT INTO tags (store_id, name, description, start_time, end_time, color, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `;

        const { rows } = await this.pool.query(query, [
            data.store_id,
            data.name,
            data.description,
            data.start_time,
            data.end_time,
            data.color,
            data.active,
        ]);
        return rows[0];
    }

    async findById(id: number): Promise<ITag | null> {
        const query = `SELECT * FROM tags WHERE id = $1`;
        const { rows } = await this.pool.query(query, [id]);
        return rows[0] || null;
    }

    async update(id: number, data: Partial<Omit<ITag, "id" | "created_at" | "updated_at">>): Promise<ITag | null> {

        const allowedFields = ["name", "description", "start_time", "end_time", "color", "active"];
        const fields = Object.keys(data).filter(f => allowedFields.includes(f));

        if (fields.length === 0) return null;

        const setClause = fields
            .map((field, index) => `${field} = $${index + 1}`)
            .join(", ");

        const values = fields.map(f => (data as any)[f]); // correcto

        const query = `
      UPDATE tags
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
        const { rows } = await this.pool.query(query, [...values, id]);
        return rows[0] ?? null;
    }

    async softDelete(id: number): Promise<boolean> {
        const query = `UPDATE tags SET active = false WHERE id = $1`;
        const { rowCount } = await this.pool.query(query, [id]);
        return rowCount !== null && rowCount > 0;
    }

    async findAllByStoreId(store_id: number): Promise<ITag[]> {
        const query = `SELECT * FROM tags WHERE store_id = $1 AND active = true`;
        const { rows } = await this.pool.query(query, [store_id]);
        return rows;
    }

}