import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });

export function createPool() {
  return new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT_INTERNAL || process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || "katabump",
    user: process.env.POSTGRES_USER || "katabump",
    password: process.env.POSTGRES_PASSWORD || "katabump",
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false
  });
}