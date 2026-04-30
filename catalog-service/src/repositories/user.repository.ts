import { Pool } from "pg";
import { User } from "../interfaces";

export class UserRepository {
	constructor(private readonly pool: Pool) { }

	async findById(id: number): Promise<User | null> {
		const query = `SELECT * FROM users WHERE id = $1`;
		const { rows } = await this.pool.query(query, [id]);
		return rows[0] || null;
	}
}
