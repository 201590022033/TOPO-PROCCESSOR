import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import path from "path";
import * as schema from "@shared/schema";

const DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), "data", "topo-processor.db");

// Ensure target data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let sqlite: Database.Database;
try {
  sqlite = new Database(DB_PATH);
  // Enable Write-Ahead Logging (WAL) for high concurrency and performance
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
} catch (error) {
  console.error(`[Database Initialization Error] Failed to open SQLite database at ${DB_PATH}:`, error);
  throw error;
}

const db = drizzle(sqlite, { schema });

// Run tracked Drizzle migrations deterministically
const migrationsFolder = path.resolve(process.cwd(), "migrations");
if (fs.existsSync(migrationsFolder)) {
  try {
    migrate(db, { migrationsFolder });
  } catch (migError) {
    console.error(`[Database Migration Error] Failed to apply migrations from ${migrationsFolder}:`, migError);
    throw migError;
  }
}

export { sqlite, db, DB_PATH };

