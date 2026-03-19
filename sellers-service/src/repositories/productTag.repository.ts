import { Pool } from "pg";
import { IProductTag, ITag } from "../interfaces";

export class ProductTagRepository {
    constructor(private readonly pool: Pool) { }

    async replaceMany(product_id: number, tag_ids: number[]): Promise<IProductTag[]> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            await client.query(`DELETE FROM product_tags WHERE product_id = $1`, [product_id]);

            const results: IProductTag[] = [];
            for (const tag_id of tag_ids) {
                const { rows } = await client.query(
                    `INSERT INTO product_tags (product_id, tag_id) VALUES ($1, $2) RETURNING *`,
                    [product_id, tag_id]
                );
                results.push(rows[0]);
            }

            await client.query("COMMIT");
            return results;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async findTagsByProductId(product_id: number): Promise<ITag[]> {
        const query = `SELECT t.* FROM product_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.product_id = $1`;
        const { rows } = await this.pool.query(query, [product_id]);
        return rows;
    }

    async findByProductId(product_id: number): Promise<IProductTag[]> {
        const query = `SELECT * FROM product_tags WHERE product_id = $1`;
        const { rows } = await this.pool.query(query, [product_id]);
        return rows;
    }

    async findByTagId(tag_id: number): Promise<IProductTag[]> {
        const query = `SELECT * FROM product_tags WHERE tag_id = $1`;
        const { rows } = await this.pool.query(query, [tag_id]);
        return rows;
    }
}