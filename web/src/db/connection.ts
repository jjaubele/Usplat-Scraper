import postgres from "postgres";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), "..", ".env") });

function getConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.HOST || "localhost";
  const port = process.env.PORT || "5432";
  const database = process.env.DATABASE || "usplat_db";
  const user = process.env.DB_USER || "postgres";
  const password = process.env.DB_PASSWORD || "";
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export const sql = postgres(getConnectionString(), {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
