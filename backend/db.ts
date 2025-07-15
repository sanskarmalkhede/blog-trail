import dotenv from "dotenv";
import { Pool } from "pg";
import supabase from "./supabase";

dotenv.config();

// Keep PostgreSQL pool for direct SQL queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
});

pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Export both pool for direct SQL and supabase client
export { supabase };
export default pool; 