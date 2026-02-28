#!/usr/bin/env node
// ============================================================
// YPOTI Compras — Phase 3: User Migration to Supabase
// Creates auth.users + public.profiles for all 238 employees
// Run: node scripts/migrate-users.mjs
// ============================================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- Config (all from environment — see .env) ----
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = process.env.YPOTI_DEFAULT_PASSWORD;

if (!SUPABASE_URL || !serviceKey) {
  console.error('ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}
if (!DEFAULT_PASSWORD) {
  console.error('ERROR: YPOTI_DEFAULT_PASSWORD must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ---- Role corrections ----
// Ronei (u001) and Mauricio must be diretoria, Ana Moller stays admin
const ROLE_OVERRIDES = {
  'ronei': 'diretoria',
  'mauricio': 'diretoria',
  'ana.moller': 'admin',
};

// ---- Parse defaultUsers.js ----
function parseUsers() {
  const filePath = join(__dirname, '..', 'src', 'constants', 'defaultUsers.js');
  const content = readFileSync(filePath, 'utf-8');

  // Extract array content between [ and the final ]
  const arrayMatch = content.match(/export\s+const\s+DEFAULT_USERS\s*=\s*\[([\s\S]*)\];?\s*$/m);
  if (!arrayMatch) throw new Error('Could not find DEFAULT_USERS array');

  const arrayContent = arrayMatch[1];

  // Parse each user object using regex
  const userRegex = /\{[^}]*?"id"\s*:\s*"([^"]+)"[^}]*?"name"\s*:\s*"([^"]+)"[^}]*?"email"\s*:\s*"([^"]+)"[^}]*?"role"\s*:\s*"([^"]+)"[^}]*?"establishment"\s*:\s*"([^"]+)"[^}]*?"position"\s*:\s*"([^"]+)"[^}]*?"avatar"\s*:\s*"([^"]+)"[^}]*?"active"\s*:\s*(true|false)[^}]*?\}/g;

  const users = [];
  let match;
  while ((match = userRegex.exec(arrayContent)) !== null) {
    const [, legacyId, name, email, role, establishment, position, avatar, active] = match;
    users.push({
      legacyId,
      name,
      username: email,         // "email" field in source is actually username
      role: ROLE_OVERRIDES[email] || role,
      establishment: establishment === 'General' ? null : establishment,
      position,
      avatar,
      active: active === 'true',
    });
  }

  return users;
}

// ---- Migration ----
async function migrateUsers() {
  console.log('=== YPOTI User Migration to Supabase ===\n');

  // Parse users from source
  const users = parseUsers();
  console.log(`Parsed ${users.length} users from defaultUsers.js`);

  // Check role distribution
  const roleCounts = {};
  for (const u of users) {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  }
  console.log('Role distribution:', roleCounts);

  // Check existing profiles count
  const { count: existingCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log(`Existing profiles in DB: ${existingCount || 0}\n`);

  if (existingCount >= users.length) {
    console.log('All users already migrated. Skipping.');
    return;
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const email = `${user.username}@ypoti.local`;

    // Progress indicator every 20 users
    if (i > 0 && i % 20 === 0) {
      console.log(`  ... processed ${i}/${users.length} (created: ${created}, skipped: ${skipped}, errors: ${errors})`);
    }

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,   // Skip email verification
      });

      if (authError) {
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
          // User already exists - try to find their ID and ensure profile exists
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existing = existingUsers?.users?.find(u => u.email === email);
          if (existing) {
            // Check if profile exists
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', existing.id)
              .single();

            if (!existingProfile) {
              // Create missing profile
              await createProfile(existing.id, user, email);
              created++;
            } else {
              skipped++;
            }
          } else {
            skipped++;
          }
          continue;
        }
        console.error(`  ERROR creating auth for ${email}: ${authError.message}`);
        errors++;
        continue;
      }

      // Step 2: Create profile
      await createProfile(authData.user.id, user, email);
      created++;

    } catch (err) {
      console.error(`  EXCEPTION for ${email}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Total: ${users.length} | Created: ${created} | Skipped: ${skipped} | Errors: ${errors}`);

  // Final verification
  const { count: finalCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log(`Profiles in DB: ${finalCount}`);

  // Verify role distribution in DB
  const { data: dbRoles } = await supabase
    .from('profiles')
    .select('role');
  if (dbRoles) {
    const dbRoleCounts = {};
    for (const r of dbRoles) {
      dbRoleCounts[r.role] = (dbRoleCounts[r.role] || 0) + 1;
    }
    console.log('DB role distribution:', dbRoleCounts);
  }
}

async function createProfile(authId, user, email) {
  const { error } = await supabase.from('profiles').insert({
    id: authId,
    username: user.username,
    email: email,
    name: user.name,
    role: user.role,
    establishment: user.establishment,
    position: user.position,
    avatar: user.avatar,
    active: user.active,
    force_password_change: true,
  });

  if (error) {
    throw new Error(`Profile insert failed: ${error.message}`);
  }
}

// ---- Run ----
migrateUsers().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
