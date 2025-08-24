import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function restoreBackup() {
  const backupFile = path.resolve(
    __dirname,
    "../backups/backup_20250714_134941.sql",
  );

  // Check if backup file exists
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    rl.close();
    process.exit(1);
  }

  console.log(`\n📦 Found backup file: ${backupFile}`);
  console.log(
    `📏 File size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`,
  );

  console.log("\n⚠️  WARNING: This will REPLACE ALL DATA in your database!");
  console.log(
    "All current data will be lost and replaced with the backup data.",
  );
  console.log("\nThis action cannot be undone!\n");

  const answer = await askQuestion(
    "Are you sure you want to restore this backup? (yes/no): ",
  );

  if (answer.toLowerCase() !== "yes") {
    console.log("Operation cancelled.");
    rl.close();
    return;
  }

  const confirm = await askQuestion('Type "RESTORE BACKUP" to confirm: ');

  if (confirm !== "RESTORE BACKUP") {
    console.log("Confirmation text did not match. Operation cancelled.");
    rl.close();
    return;
  }

  console.log("\n🔄 Starting database restore...\n");

  try {
    // Database connection details
    const dbHost = "localhost";
    const dbPort = "5432";
    const dbName = "my-local-db";
    const dbUser = "postgres";
    const dbPassword = "redisPrismaNaver2025@";

    console.log("1️⃣ Dropping all existing tables...");
    // Drop all tables in the public schema
    const dropTablesCmd = `PGPASSWORD='${dbPassword}' psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
    execSync(dropTablesCmd, { stdio: "inherit" });
    console.log("✓ All tables dropped successfully");

    console.log("\n2️⃣ Restoring backup...");
    // Restore the backup (uncompressed SQL file)
    const restoreCmd = `PGPASSWORD='${dbPassword}' psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} < "${backupFile}"`;
    execSync(restoreCmd, { stdio: "inherit" });
    console.log("✓ Backup restored successfully");

    console.log(
      "\n3️⃣ Running Prisma migrations to ensure schema is up to date...",
    );
    execSync("npm run db:push", { stdio: "inherit" });
    console.log("✓ Database schema updated");

    console.log("\n✅ Database restore completed successfully!");
    console.log("Your database has been restored from the backup.\n");
  } catch (error) {
    console.error("\n❌ Error during restore:", error);
    console.error(
      "The restore process failed. Your database may be in an inconsistent state.",
    );
    console.error(
      "You may need to manually restore the backup or fix the database.",
    );
  } finally {
    rl.close();
  }
}

// Execute the restore
restoreBackup().catch((error) => {
  console.error("Fatal error:", error);
  rl.close();
  process.exit(1);
});
