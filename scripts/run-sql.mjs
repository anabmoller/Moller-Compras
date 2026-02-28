#!/usr/bin/env node
// ============================================================
// Execute SQL file against Supabase via direct PostgreSQL connection
// Usage: node scripts/run-sql.mjs scripts/001-schema.sql
// ============================================================
// This script is for LOCAL USE ONLY — never commit credentials.

import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/run-sql.mjs <sql-file>");
  process.exit(1);
}

const sql = readFileSync(resolve(sqlFile), "utf-8");

// Split into manageable chunks on blank-line boundaries between statements
// This avoids sending one massive payload
function splitSQL(fullSQL) {
  // Split by semicolons that are followed by a newline (statement boundaries)
  // But keep CREATE FUNCTION blocks together (they contain semicolons inside $$ blocks)
  const chunks = [];
  let current = "";
  let inDollarQuote = false;

  for (const line of fullSQL.split("\n")) {
    // Track $$ dollar-quoted blocks
    const dollarCount = (line.match(/\$\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
      inDollarQuote = !inDollarQuote;
    }

    current += line + "\n";

    // If we hit a semicolon at end of line and we're not inside $$...$$ block
    if (!inDollarQuote && line.trim().endsWith(";")) {
      chunks.push(current.trim());
      current = "";
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  // Group small chunks together (max ~20 statements per batch)
  const batches = [];
  let batch = [];
  for (const chunk of chunks) {
    // Skip empty or comment-only chunks
    const stripped = chunk.replace(/--[^\n]*/g, "").trim();
    if (!stripped) continue;
    batch.push(chunk);
    if (batch.length >= 15) {
      batches.push(batch.join("\n\n"));
      batch = [];
    }
  }
  if (batch.length > 0) {
    batches.push(batch.join("\n\n"));
  }
  return batches;
}

async function executeSQL(sqlText, batchNum, totalBatches) {
  const url = `https://${projectRef}.supabase.co/rest/v1/rpc/`;

  // Try the pg-meta SQL execution endpoint
  const pgMetaUrl = `https://${projectRef}.supabase.co/pg/query`;

  // Method 1: Try pg/query endpoint
  try {
    const res = await fetch(pgMetaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Supabase-Api-Version": "2024-01-01",
      },
      body: JSON.stringify({ query: sqlText }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  Batch ${batchNum}/${totalBatches} OK (pg/query)`);
      return { ok: true, method: "pg/query", data };
    }

    // If 404, try alternative endpoint
    if (res.status === 404) {
      throw new Error("pg/query not available");
    }

    const errText = await res.text();
    return { ok: false, method: "pg/query", status: res.status, error: errText };
  } catch (e) {
    // Method 2: Try the sql endpoint
    try {
      const sqlUrl = `https://${projectRef}.supabase.co/sql`;
      const res2 = await fetch(sqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sqlText }),
      });

      if (res2.ok) {
        console.log(`  Batch ${batchNum}/${totalBatches} OK (/sql)`);
        return { ok: true, method: "/sql" };
      }

      if (res2.status === 404) {
        throw new Error("/sql not available");
      }

      const errText2 = await res2.text();
      return { ok: false, method: "/sql", status: res2.status, error: errText2 };
    } catch {
      // Method 3: Fallback — use Supabase Management API
      try {
        const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
        const res3 = await fetch(mgmtUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: sqlText }),
        });

        if (res3.ok) {
          console.log(`  Batch ${batchNum}/${totalBatches} OK (management API)`);
          return { ok: true, method: "management" };
        }

        const errText3 = await res3.text();
        return { ok: false, method: "management", status: res3.status, error: errText3 };
      } catch (e3) {
        return { ok: false, method: "all-failed", error: e3.message };
      }
    }
  }
}

async function main() {
  console.log(`\nYPOTI — SQL Executor`);
  console.log(`Project: ${projectRef}`);
  console.log(`File: ${sqlFile}`);
  console.log(`SQL length: ${sql.length} chars\n`);

  const batches = splitSQL(sql);
  console.log(`Split into ${batches.length} batches\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const result = await executeSQL(batches[i], i + 1, batches.length);
    if (result.ok) {
      successCount++;
    } else {
      failCount++;
      console.error(`  FAIL batch ${i + 1}: [${result.method}] ${result.status || ""} ${result.error?.substring(0, 200)}`);
    }
  }

  console.log(`\nDone: ${successCount} succeeded, ${failCount} failed out of ${batches.length} batches`);

  if (failCount > 0) {
    console.log(`\nIf API execution failed, you can run the SQL manually:`);
    console.log(`1. Open https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log(`2. Paste the contents of ${sqlFile}`);
    console.log(`3. Click "Run"\n`);
    process.exit(1);
  }
}

main();
