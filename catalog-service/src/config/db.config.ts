import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  maxLifetimeSeconds: 1800,
  query_timeout: 15000,
  statement_timeout: 15000,
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

export default pool;