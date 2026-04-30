import { Pool } from "pg";
import { IProduct, IProductWithTags } from "../interfaces";

export class ProductRepository {
    constructor(private readonly pool: Pool) { }

    async create(data: Omit<IProduct, "id" | "created_at" | "updated_at">): Promise<IProduct> {
        const query = `
        INSERT INTO products (store_id, name, description, price, product_image, active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `;

        const { rows } = await this.pool.query(query, [
            data.store_id,
            data.name,
            data.description,
            data.price,
            data.product_image,
            data.active,
        ]);
        return rows[0];
    }

    async findById(id: number): Promise<IProduct | null> {
        const query = `SELECT * FROM products WHERE id = $1`;
        const { rows } = await this.pool.query(query, [id]);
        return rows[0] || null;
    }

    async findByIds(ids: number[]): Promise<IProduct[]> {
        if (ids.length === 0) return [];
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        const query = `SELECT * FROM products WHERE id IN (${placeholders})`;
        const { rows } = await this.pool.query(query, ids);
    return rows;
    }

    async update(id: number, data: Partial<Omit<IProduct, "id" | "created_at" | "updated_at">>): Promise<IProduct | null> {
        const allowedFields = ["name", "description", "price", "product_image", "active"];

        const fields = Object.keys(data).filter(f => allowedFields.includes(f));
        if (fields.length === 0) return null;

        const setClause = fields
            .map((field, index) => `${field} = $${index + 1}`)
            .join(", ");

        const values = fields.map(f => (data as any)[f]);

        const query = `
        UPDATE products
        SET ${setClause}, updated_at = NOW()
        WHERE id = $${fields.length + 1}
        RETURNING *
        `;

        const { rows } = await this.pool.query(query, [...values, id]);
        return rows[0] ?? null;
    }

    async delete(id: number): Promise<boolean> {
        const query = `UPDATE products SET active = false WHERE id = $1`;
        const { rowCount } = await this.pool.query(query, [id]);
        return rowCount !== null && rowCount > 0;
    }

    async findByStoreId(store_id: number): Promise<IProduct[]> {
        const query = `SELECT * FROM products WHERE store_id = $1`;
        const { rows } = await this.pool.query(query, [store_id]);
        return rows;
    }

    async getProductsWithTags(store_id: number): Promise<IProductWithTags[]> {
        const query = `
        SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            p.product_image,
            p.active,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', t.id,
                        'name', t.name,
                        'color', t.color
                    )
                ) FILTER (WHERE t.id IS NOT NULL),
                '[]'
            ) AS tags
        FROM products p
        LEFT JOIN product_tags pt ON p.id = pt.product_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE p.store_id = $1
        GROUP BY p.id
        `;
        const { rows } = await this.pool.query(query, [store_id]);
        return rows;
    }

}