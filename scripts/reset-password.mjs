#!/usr/bin/env node
// ============================================================
// YPOTI — Reset user password to default
// Usage: node scripts/reset-password.mjs <username>
// Requires: SUPABASE_SERVICE_ROLE_KEY and YPOTI_DEFAULT_PASSWORD in .env
// ============================================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = process.env.YPOTI_DEFAULT_PASSWORD;

if (!SUPABASE_URL || !SERVICE_KEY || !DEFAULT_PASSWORD) {
  console.error('ERROR: Required env vars missing in .env:');
  if (!SUPABASE_URL) console.error('  - VITE_SUPABASE_URL');
  if (!SERVICE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  if (!DEFAULT_PASSWORD) console.error('  - YPOTI_DEFAULT_PASSWORD');
  process.exit(1);
}

const username = process.argv[2];
if (!username) {
  console.error('Usage: node scripts/reset-password.mjs <username>');
  console.error('Example: node scripts/reset-password.mjs ana.moller');
  process.exit(1);
}

const email = `${username}@ypoti.local`;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resetPassword() {
  console.log(`\nResetting password for: ${email}\n`);

  // Step 1: Find user via profiles table (avoids listUsers pagination issues)
  const { data: profile, error: profileLookupErr } = await supabase
    .from('profiles')
    .select('id, username, name, role')
    .eq('username', username)
    .single();

  if (profileLookupErr || !profile) {
    console.error(`Profile not found for username: ${username}`);
    if (profileLookupErr) console.error('  Error:', profileLookupErr.message);
    // Fallback: try email lookup in profiles
    const { data: byEmail } = await supabase
      .from('profiles')
      .select('id, username, name')
      .ilike('email', `%${username.replace('.', '%')}%`)
      .limit(5);
    if (byEmail?.length) {
      console.error('  Similar profiles found:');
      byEmail.forEach(p => console.error(`    - ${p.username} (${p.name}, id: ${p.id})`));
    }
    process.exit(1);
  }

  const userId = profile.id;
  console.log(`  Found: ${profile.name} (${profile.username}, id: ${userId})`);

  // Step 2: Reset password
  const { error: pwErr } = await supabase.auth.admin.updateUserById(userId, {
    password: DEFAULT_PASSWORD,
  });
  if (pwErr) {
    console.error('Password reset failed:', pwErr.message);
    process.exit(1);
  }
  console.log('  ✓ Password reset to default');

  // Step 3: Set force_password_change = true
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ force_password_change: true })
    .eq('id', userId);

  if (profileErr) {
    console.error('Profile update failed:', profileErr.message);
    process.exit(1);
  }
  console.log('  ✓ force_password_change = true');

  // Step 4: Verify profile
  const { data: verifyProfile } = await supabase
    .from('profiles')
    .select('username, name, role, active, force_password_change')
    .eq('id', userId)
    .single();

  if (verifyProfile) {
    console.log('\n  Profile:');
    console.log(`    username: ${verifyProfile.username}`);
    console.log(`    name: ${verifyProfile.name}`);
    console.log(`    role: ${verifyProfile.role}`);
    console.log(`    active: ${verifyProfile.active}`);
    console.log(`    force_password_change: ${verifyProfile.force_password_change}`);
  }

  console.log(`\n✓ Done. User can now login with: ${username} / ${DEFAULT_PASSWORD}`);
}

resetPassword().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
