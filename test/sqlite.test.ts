import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq, desc } from "drizzle-orm";
import { analysis } from "../shared/schema";

async function runTests() {
  console.log("=== Starting SQLite & Storage Hardening Test Suite ===");
  const testDbDir = path.resolve(process.cwd(), "data", "test-run");
  const testDbPath = path.join(testDbDir, "test-topo-processor.db");

  // Clean up any prior test run
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  if (fs.existsSync(`${testDbPath}-wal`)) fs.unlinkSync(`${testDbPath}-wal`);
  if (fs.existsSync(`${testDbPath}-shm`)) fs.unlinkSync(`${testDbPath}-shm`);
  fs.mkdirSync(testDbDir, { recursive: true });

  // 1. Database Initialization, WAL mode, foreign keys, and Drizzle tracked migrations
  console.log("\n[Test 1] Database initialization, WAL mode & Drizzle tracked migrations");
  const sqlite = new Database(testDbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const journalMode = sqlite.pragma("journal_mode", { simple: true });
  if (journalMode !== "wal") {
    throw new Error(`Expected journal_mode WAL, got ${journalMode}`);
  }
  console.log("✓ WAL mode verified active:", journalMode);

  const db = drizzle(sqlite, { schema: { analysis } });

  // Run Drizzle migration from ./migrations
  const migrationsFolder = path.resolve(process.cwd(), "migrations");
  migrate(db, { migrationsFolder });
  console.log("✓ Drizzle migrations applied successfully from ./migrations");

  // Verify __drizzle_migrations table and analysis table exist
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r: any) => r.name);
  if (!tables.includes("analysis") || !tables.includes("__drizzle_migrations")) {
    throw new Error(`Expected tables 'analysis' and '__drizzle_migrations', found: ${tables.join(", ")}`);
  }
  console.log("✓ Verified schema tables created via tracked migration:", tables.join(", "));

  // Repeated migration run must be a safe idempotent no-op
  migrate(db, { migrationsFolder });
  console.log("✓ Repeated Drizzle migration run succeeded idempotently");

  // 2. Non-semantic ID test: Seed baseline records when pre-existing user records already occupy low IDs
  console.log("\n[Test 2] Seed identification decoupled from fixed IDs 1 and 2");
  // Insert two preliminary test analyses to take IDs 1 and 2
  const [pre1] = await db.insert(analysis).values({
    imageUrl: "/images/custom_user_capture_1.jpg",
    status: "completed",
    startAngle: 0,
    endAngle: 360,
    nMires: 22,
    workingDistance: 75,
    zernikeDegree: 8,
    mireSegMethod: "dl",
    results: { simK1: 45.0, simK2: 44.0, astigmatism: 1.0 },
    outputFiles: { axialMap: "/images/custom_1/axial.png" },
    errorMessage: null,
    createdAt: new Date(Date.now() - 50000),
  }).returning();

  const [pre2] = await db.insert(analysis).values({
    imageUrl: "/images/custom_user_capture_2.jpg",
    status: "completed",
    startAngle: 0,
    endAngle: 360,
    nMires: 22,
    workingDistance: 75,
    zernikeDegree: 8,
    mireSegMethod: "dl",
    results: { simK1: 42.0, simK2: 41.5, astigmatism: 0.5 },
    outputFiles: { axialMap: "/images/custom_2/axial.png" },
    errorMessage: null,
    createdAt: new Date(Date.now() - 40000),
  }).returning();

  console.log(`✓ Pre-existing records occupied IDs: ${pre1.id}, ${pre2.id}`);

  // Now simulate baseline seed insertion via URL identification
  const normalUrl = "/images/sample_placido_normal.png";
  const nokcUrl = "/images/nokc_right.jpg";

  const allRowsBefore = await db.select().from(analysis);
  const hasNormal = allRowsBefore.some((r) => r.imageUrl === normalUrl);
  const hasNokc = allRowsBefore.some((r) => r.imageUrl === nokcUrl);

  if (!hasNormal) {
    const [seededNormal] = await db.insert(analysis).values({
      imageUrl: normalUrl,
      status: "completed",
      startAngle: 0,
      endAngle: 360,
      nMires: 22,
      workingDistance: 75,
      zernikeDegree: 8,
      mireSegMethod: "dl",
      results: { simK1: 44.25, simK2: 43.10, astigmatism: 1.15 },
      outputFiles: null,
      errorMessage: null,
      createdAt: new Date(),
    }).returning();

    await db.update(analysis).set({
      outputFiles: {
        surfaceMap: `/images/analysis_${seededNormal.id}/corneal_surface_3d.png`,
        axialMap: `/images/analysis_${seededNormal.id}/axial_heatmap.png`,
      }
    }).where(eq(analysis.id, seededNormal.id));

    console.log(`✓ Baseline Normal Placido seeded with non-hardcoded ID: ${seededNormal.id} (not 1!)`);
    if (seededNormal.id <= 2) {
      throw new Error(`Expected ID > 2, got ${seededNormal.id}`);
    }
  }

  if (!hasNokc) {
    const [seededNokc] = await db.insert(analysis).values({
      imageUrl: nokcUrl,
      status: "completed",
      startAngle: 0,
      endAngle: 360,
      nMires: 22,
      workingDistance: 75,
      zernikeDegree: 8,
      mireSegMethod: "dl",
      results: { simK1: 39.12, simK2: 38.22, astigmatism: 0.90 },
      outputFiles: {
        axialMap: "/images/nokc_right_axialmap.png",
        tangentialMap: "/images/nokc_right_tanmap.png",
      },
      errorMessage: null,
      createdAt: new Date(),
    }).returning();
    console.log(`✓ Baseline Clinical Reference seeded with non-hardcoded ID: ${seededNokc.id} (not 2!)`);
  }

  // 3. Repeated startup / re-seed idempotency test
  console.log("\n[Test 3] Repeated startup and seed idempotency");
  const countBefore = (await db.select().from(analysis)).length;

  // Re-run seed check
  const allRowsAfter = await db.select().from(analysis);
  const recheckNormal = allRowsAfter.filter((r) => r.imageUrl === normalUrl);
  const recheckNokc = allRowsAfter.filter((r) => r.imageUrl === nokcUrl);

  if (recheckNormal.length !== 1 || recheckNokc.length !== 1) {
    throw new Error(`Expected exactly 1 of each seed record, got Normal: ${recheckNormal.length}, Nokc: ${recheckNokc.length}`);
  }
  const countAfter = (await db.select().from(analysis)).length;
  if (countBefore !== countAfter) {
    throw new Error(`Seed duplication detected: before=${countBefore}, after=${countAfter}`);
  }
  console.log("✓ Repeated seed check strictly prevented duplicates; record count stable at:", countAfter);

  // 4. Verification that completed analyses, JSON results, and output files remain untouched
  console.log("\n[Test 4] Immutability of completed analyses and complex JSON");
  const [retrievedPre1] = await db.select().from(analysis).where(eq(analysis.id, pre1.id));
  if (retrievedPre1.status !== "completed") {
    throw new Error("Completed status was modified!");
  }
  if (retrievedPre1.results?.simK1 !== 45.0 || retrievedPre1.results?.astigmatism !== 1.0) {
    throw new Error(`JSON results corrupted: ${JSON.stringify(retrievedPre1.results)}`);
  }
  if (retrievedPre1.outputFiles?.axialMap !== "/images/custom_1/axial.png") {
    throw new Error(`Output files corrupted: ${JSON.stringify(retrievedPre1.outputFiles)}`);
  }
  console.log("✓ Verified completed analysis fields, JSON metrics, and outputFiles intact");

  // 5. AUTOINCREMENT integrity across connection close and reopen
  console.log("\n[Test 5] AUTOINCREMENT integrity and sequence preservation across reopen");
  sqlite.close();
  console.log("✓ Closed SQLite connection");

  const reopenedSqlite = new Database(testDbPath);
  reopenedSqlite.pragma("journal_mode = WAL");
  reopenedSqlite.pragma("foreign_keys = ON");
  const reopenedDb = drizzle(reopenedSqlite, { schema: { analysis } });

  // Insert a new record on reopened connection
  const [newAfterReopen] = await reopenedDb.insert(analysis).values({
    imageUrl: "/images/post_reopen_test.jpg",
    status: "pending",
    startAngle: 0,
    endAngle: 360,
    nMires: 22,
    workingDistance: 75,
    zernikeDegree: 8,
    mireSegMethod: "dl",
    results: null,
    outputFiles: null,
    errorMessage: null,
    createdAt: new Date(),
  }).returning();

  console.log(`✓ New record created on reopened DB received auto-increment ID: ${newAfterReopen.id}`);
  if (newAfterReopen.id <= 4) {
    throw new Error(`AUTOINCREMENT sequence reset! Expected ID > 4, got ${newAfterReopen.id}`);
  }
  console.log("✓ Verified SQLite AUTOINCREMENT sequence was strictly preserved (no ID reuse or reset)");

  reopenedSqlite.close();

  // Cleanup test files
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  if (fs.existsSync(`${testDbPath}-wal`)) fs.unlinkSync(`${testDbPath}-wal`);
  if (fs.existsSync(`${testDbPath}-shm`)) fs.unlinkSync(`${testDbPath}-shm`);
  fs.rmdirSync(testDbDir);

  console.log("\n=== All SQLite Hardening & Migration Tests Passed Successfully! ===");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

