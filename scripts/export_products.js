#!/usr/bin/env node
// ============================================================
// Export products from Supabase to CSV
// Usage: node scripts/export_products.js
// Output: data/products_current.csv
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) { console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"); process.exit(1); }

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from("products")
    .select("code, name, category, group, unit, deposit, presentation, active")
    .order("code");

  if (error) { console.error("Query failed:", error.message); process.exit(1); }
  if (!data || data.length === 0) { console.log("No products found."); process.exit(0); }

  const headers = ["code", "name", "category", "group", "unit", "deposit", "presentation", "active"];
  const escape = (v) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => escape(row[h])).join(",")),
  ].join("\n");

  const outPath = resolve(__dirname, "../data/products_current.csv");
  writeFileSync(outPath, csv, "utf-8");
  console.log(`Exported ${data.length} products to ${outPath}`);
}

main();
