import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

async function checkDoc() {
  const { data, error } = await supabase
    .from('documents')
    .select('content_html')
    .eq('id', 'doc-so-do-to-chuc')
    .single();

  if (error) {
    console.error('Error fetching doc:', error);
    return;
  }

  console.log('--- Content HTML Length ---');
  console.log(data.content_html.length);
  console.log('--- Does it contain ORG_CHART_HERE? ---');
  console.log(data.content_html.includes('<!-- ORG_CHART_HERE -->'));
  console.log('--- First 500 chars ---');
  console.log(data.content_html.substring(0, 500));
  console.log('--- End ---');
}

checkDoc();
