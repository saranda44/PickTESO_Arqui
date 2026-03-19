import { Pool } from "pg";

export class UserRepository {
    constructor(private readonly pool: Pool) {}

    async findById(id: number): Promise<{ id: number } | null> {
        const { rows } = await this.pool.query("SELECT id FROM users WHERE id = $1", [id]);
        return rows[0] || null;
    }

    async exists(id: number): Promise<boolean> {
        return !!(await this.findById(id));
    }
}