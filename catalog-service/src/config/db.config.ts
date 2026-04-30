import { Pool } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  return _pool;
}

export default new Proxy({} as Pool, {
  get: (_, prop) => {
    const pool = getPool();
    return (pool as any)[prop];
  },
});