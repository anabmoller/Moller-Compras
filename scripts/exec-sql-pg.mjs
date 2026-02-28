#!/usr/bin/env node
// ============================================================
// Execute SQL against Supabase via direct PostgreSQL connection
// Tries multiple connection methods (pooler w/ JWT, direct, etc.)
// Usage: node scripts/exec-sql-pg.mjs scripts/001-schema.sql
// ============================================================

import { readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";
const { Client } = pg;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || "";

const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("Usage: node scripts/exec-sql-pg.mjs <sql-file>");
  process.exit(1);
}

const sql = readFileSync(resolve(sqlFile), "utf-8");
console.log(`\nYPOTI — PostgreSQL SQL Executor`);
console.log(`Project: ${projectRef}`);
console.log(`File: ${sqlFile} (${sql.length} chars)\n`);

// Connection strategies to try
const strategies = [];

if (DB_PASSWORD) {
  // Direct connection with DB password
  strategies.push({
    name: "Direct (DB password)",
    config: {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  });
}

if (SERVICE_ROLE_KEY) {
  // Pooler with JWT auth (newer Supabase feature)
  const regions = ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "sa-east-1"];
  for (const region of regions) {
    strategies.push({
      name: `Pooler JWT (${region}) port 5432`,
      config: {
        host: `aws-0-${region}.pooler.supabase.com`,
        port: 5432,
        database: "postgres",
        user: `postgres.${projectRef}`,
        password: SERVICE_ROLE_KEY,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      },
    });
  }

  // Direct with service_role as password (unlikely but try)
  strategies.push({
    name: "Direct (service_role as password)",
    config: {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: SERVICE_ROLE_KEY,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    },
  });
}

async function tryConnect(strategy) {
  const client = new Client(strategy.config);
  try {
    await client.connect();
    console.log(`  Connected via: ${strategy.name}`);
    return client;
  } catch (e) {
    console.log(`  ${strategy.name}: ${e.message.substring(0, 80)}`);
    try { await client.end(); } catch {}
    return null;
  }
}

async function main() {
  console.log(`Trying ${strategies.length} connection strategies...\n`);

  let client = null;
  for (const strategy of strategies) {
    client = await tryConnect(strategy);
    if (client) break;
  }

  if (!client) {
    console.error(`\nAll connection strategies failed.`);
    console.error(`\nTo fix this, provide your Supabase DB password:`);
    console.error(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
    console.error(`2. Copy the database password`);
    console.error(`3. Add to .env: SUPABASE_DB_PASSWORD=your_password_here`);
    console.error(`4. Re-run this script\n`);
    console.error(`OR run the SQL manually in the Supabase SQL Editor:`);
    console.error(`https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    process.exit(1);
  }

  try {
    console.log(`\nExecuting SQL (${sql.length} chars)...\n`);
    await client.query(sql);
    console.log(`\nSUCCESS — All tables, triggers, functions and RLS policies created!`);
  } catch (e) {
    console.error(`\nSQL execution error: ${e.message}`);
    console.error(`\nPosition: ${e.position || "unknown"}`);

    // If error, try statement by statement
    console.log(`\nRetrying statement-by-statement...\n`);
    const statements = splitStatements(sql);
    let ok = 0, fail = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
        ok++;
      } catch (e2) {
        fail++;
        const first = stmt.split("\n").find(l => l.trim() && !l.trim().startsWith("--")) || stmt.substring(0, 60);
        console.error(`  FAIL [${i+1}/${statements.length}] ${first.trim().substring(0, 70)}...`);
        console.error(`        ${e2.message.substring(0, 120)}`);
      }
    }
    console.log(`\nResults: ${ok} succeeded, ${fail} failed out of ${statements.length} statements`);
  } finally {
    await client.end();
  }
}

function splitStatements(fullSQL) {
  const results = [];
  let current = "";
  let inDollar = false;

  for (const line of fullSQL.split("\n")) {
    const dollars = (line.match(/\$\$/g) || []).length;
    if (dollars % 2 !== 0) inDollar = !inDollar;
    current += line + "\n";

    if (!inDollar && line.trim().endsWith(";")) {
      const stripped = current.replace(/--[^\n]*/g, "").trim();
      if (stripped && stripped !== ";") {
        results.push(current.trim());
      }
      current = "";
    }
  }
  if (current.trim()) {
    const stripped = current.replace(/--[^\n]*/g, "").trim();
    if (stripped) results.push(current.trim());
  }
  return results;
}

main();
