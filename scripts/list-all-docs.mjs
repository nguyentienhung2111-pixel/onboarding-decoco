// scripts/list-all-docs.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (urlMatch) SUPABASE_URL = urlMatch[1].trim();
  if (keyMatch) SUPABASE_SERVICE_ROLE_KEY = keyMatch[1].trim();
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listDocs() {
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, estimated_read_minutes, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error listing documents:', error.message);
    return;
  }

  console.log('📄 Current Documents in Supabase:');
  console.table(data);
}

listDocs();
