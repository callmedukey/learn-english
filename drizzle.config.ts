import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ENV MISSING in DRIZZLE CONFIG");
}

export default defineConfig({
  out: "./db/migrations",
  schema: "./db/schemas",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
