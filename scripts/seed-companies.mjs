#!/usr/bin/env node

/**
 * seed-companies.mjs
 * 
 * Downloads the Alpha Vantage LISTING_STATUS CSV (all active US stocks & ETFs)
 * and upserts into core_companies in Supabase.
 *
 * Usage:
 *   node scripts/seed-companies.mjs
 *
 * Required env vars (add to .env.local or export in terminal):
 *   NEXT_PUBLIC_SUPABASE_URL   — already in your .env.local
 *   SUPABASE_SERVICE_ROLE_KEY  — get from Supabase Dashboard → Settings → API → service_role
 *
 * Optional:
 *   ALPHA_VANTAGE_API_KEY      — falls back to 'demo' which works for this endpoint
 *   SEED_FILTER                — 'stocks' (default), 'etfs', or 'all'
 *   SEED_EXCHANGES             — comma-separated list, default 'NYSE,NASDAQ'
 *   DRY_RUN                    — set to 'true' to preview without inserting
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// 1. Load env vars from .env.local (simple parser, no dotenv dependency)
// ---------------------------------------------------------------------------
function loadEnvFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      // Don't overwrite existing env vars
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local not found — that's fine, rely on exported env vars
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));

// ---------------------------------------------------------------------------
// 2. Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AV_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
const SEED_FILTER = process.env.SEED_FILTER || 'stocks';       // 'stocks', 'etfs', 'all'
const SEED_EXCHANGES = (process.env.SEED_EXCHANGES || 'NYSE,NASDAQ').split(',').map(s => s.trim().toUpperCase());
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 500; // Supabase upsert batch size

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ Missing required env vars.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌ missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌ missing');
  console.error('\n   Add SUPABASE_SERVICE_ROLE_KEY to your .env.local or export it:');
  console.error('   export SUPABASE_SERVICE_ROLE_KEY="your-key-here"\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Fetch & parse the Alpha Vantage listing CSV
// ---------------------------------------------------------------------------
async function fetchListingCSV() {
  const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${AV_API_KEY}`;
  console.log(`📡 Fetching listing CSV from Alpha Vantage (key: ${AV_API_KEY === 'demo' ? 'demo' : '***'})...`);
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Alpha Vantage returned ${res.status}: ${res.statusText}`);
  }
  
  const text = await res.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  console.log(`   CSV headers: ${headers.join(', ')}`);
  console.log(`   Total rows: ${lines.length - 1}`);
  
  // Parse CSV rows into objects
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    if (vals.length < headers.length) continue;
    
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = vals[idx]?.trim() || ''; });
    rows.push(row);
  }
  
  return rows;
}

// ---------------------------------------------------------------------------
// 4. Filter and transform rows → core_companies records
// ---------------------------------------------------------------------------
function transformRows(rows) {
  let filtered = rows;
  
  // Filter by asset type
  if (SEED_FILTER === 'stocks') {
    filtered = filtered.filter(r => r.assetType === 'Stock');
  } else if (SEED_FILTER === 'etfs') {
    filtered = filtered.filter(r => r.assetType === 'ETF');
  }
  // 'all' = no filter
  
  // Filter by exchange
  filtered = filtered.filter(r => {
    const exchange = r.exchange?.toUpperCase() || '';
    return SEED_EXCHANGES.some(e => exchange.includes(e));
  });
  
  // Filter out empty symbols or clearly invalid tickers
  filtered = filtered.filter(r => {
    const sym = r.symbol || '';
    // Skip blank, skip tickers with special chars (warrants, units, etc.)
    if (!sym || sym.includes(' ') || sym.length > 6) return false;
    // Skip tickers with hyphens or dots (preferred shares, warrants)
    if (sym.includes('-') || sym.includes('.')) return false;
    return true;
  });
  
  // Transform to core_companies shape
  const records = filtered.map(r => ({
    ticker: r.symbol.toUpperCase(),
    name: r.name || r.symbol,
    exchange: normalizeExchange(r.exchange),
    metadata: {
      source: 'alpha_vantage_listing',
      asset_type: r.assetType,
      ipo_date: r.ipoDate || null,
      seeded_at: new Date().toISOString(),
    },
  }));
  
  return records;
}

function normalizeExchange(raw) {
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  if (upper.includes('NASDAQ')) return 'NASDAQ';
  if (upper === 'NYSE') return 'NYSE';
  if (upper.includes('NYSE')) return upper; // NYSE ARCA, etc.
  return upper;
}

// ---------------------------------------------------------------------------
// 5. Upsert into Supabase in batches
// ---------------------------------------------------------------------------
async function upsertCompanies(records) {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  let inserted = 0;
  let errors = 0;
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    const { data, error } = await supabase
      .from('core_companies')
      .upsert(batch, { 
        onConflict: 'ticker',
        ignoreDuplicates: false   // Update name/exchange if ticker exists
      })
      .select('id');
    
    if (error) {
      console.error(`   ❌ Batch ${batchNum}/${totalBatches} failed:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(`   ✅ Batch ${batchNum}/${totalBatches}: ${data.length} rows upserted`);
    }
  }
  
  return { inserted, errors };
}

// ---------------------------------------------------------------------------
// 6. Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('');
  console.log('🌱 Lumis Company Seed — Alpha Vantage Listing');
  console.log('─'.repeat(50));
  console.log(`   Filter:    ${SEED_FILTER}`);
  console.log(`   Exchanges: ${SEED_EXCHANGES.join(', ')}`);
  console.log(`   Dry run:   ${DRY_RUN}`);
  console.log('');
  
  // Fetch
  const rows = await fetchListingCSV();
  
  // Transform
  const records = transformRows(rows);
  console.log(`\n🔍 After filtering: ${records.length} companies to seed`);
  
  // Preview
  console.log('\n📋 Sample (first 5):');
  records.slice(0, 5).forEach(r => {
    console.log(`   ${r.ticker.padEnd(6)} | ${r.exchange?.padEnd(8) || 'N/A'.padEnd(8)} | ${r.name}`);
  });
  console.log('   ...');
  
  // Exchange breakdown
  const exchangeCounts = {};
  records.forEach(r => {
    const ex = r.exchange || 'Unknown';
    exchangeCounts[ex] = (exchangeCounts[ex] || 0) + 1;
  });
  console.log('\n📊 Exchange breakdown:');
  Object.entries(exchangeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ex, count]) => console.log(`   ${ex.padEnd(12)} ${count}`));
  
  if (DRY_RUN) {
    console.log('\n⏸️  Dry run — no data inserted. Remove DRY_RUN=true to seed.\n');
    return;
  }
  
  // Upsert
  console.log(`\n💾 Upserting ${records.length} companies into core_companies...`);
  const { inserted, errors } = await upsertCompanies(records);
  
  console.log('\n─'.repeat(50));
  console.log(`✅ Done! ${inserted} companies seeded, ${errors} errors.`);
  console.log('');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
