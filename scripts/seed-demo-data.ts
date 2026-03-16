#!/usr/bin/env ts-node
/**
 * FunMap Seed Script — inserts fake fun signals for visual testing.
 * Uses the Supabase service role key to bypass RLS.
 *
 * Usage:
 *   npx ts-node scripts/seed-demo-data.ts --lat 32.0853 --lng 34.7818 --count 10
 *   npx ts-node scripts/seed-demo-data.ts --cleanup
 *
 * Options:
 *   --lat      Center latitude  (default: 32.0853)
 *   --lng      Center longitude (default: 34.7818)
 *   --count    Number of fake users (default: 5)
 *   --spread   Coordinate spread in degrees (default: 0.002)
 *   --cleanup  Delete all seed rows instead of inserting
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (flag: string, def: string) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};

const centerLat = parseFloat(getArg('--lat', '32.0853'));
const centerLng = parseFloat(getArg('--lng', '34.7818'));
const count = parseInt(getArg('--count', '5'), 10);
const spread = parseFloat(getArg('--spread', '0.002'));
const cleanup = args.includes('--cleanup');

// Fake user IDs that are clearly not real (prefixed with 'seed-')
// We use a deterministic UUID-like format to make cleanup easy
function seedUserId(index: number): string {
  return `00000000-seed-0000-0000-${String(index).padStart(12, '0')}`;
}

function randomOffset(spread: number): number {
  return (Math.random() - 0.5) * 2 * spread;
}

async function seedSignals() {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();

  const rows = Array.from({ length: count }, (_, i) => ({
    user_id: seedUserId(i),
    latitude: centerLat + randomOffset(spread),
    longitude: centerLng + randomOffset(spread),
    status: true,
    updated_at: now.toISOString(),
    expires_at: expiresAt,
  }));

  const { error } = await supabase.from('fun_signals').upsert(rows);

  if (error) {
    console.error('❌  Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`✅  Seeded ${count} fun signals near (${centerLat}, ${centerLng})`);
  console.log(`    Spread: ±${spread}°  |  Expires: ${expiresAt}`);
  console.log('\n    Open the map and navigate to that location to see the heat blobs!');
  console.log('    Run with --cleanup to remove seed data.\n');
}

async function cleanupSignals() {
  // Delete all rows where user_id starts with our seed prefix pattern
  const seedIds = Array.from({ length: 1000 }, (_, i) => seedUserId(i));

  const { error, count: deleted } = await supabase
    .from('fun_signals')
    .delete({ count: 'exact' })
    .in('user_id', seedIds);

  if (error) {
    console.error('❌  Cleanup failed:', error.message);
    process.exit(1);
  }

  console.log(`✅  Cleaned up ${deleted ?? 0} seed signals.`);
}

if (cleanup) {
  cleanupSignals();
} else {
  seedSignals();
}
