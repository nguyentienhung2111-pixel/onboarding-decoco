import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/).at(1).trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/).at(1).trim();
const supabase = createClient(url, key);

async function restore() {
  console.log('📖 Reading backup from doc_t1_current.html...');
  const originalHtml = readFileSync('doc_t1_current.html', 'utf8');

  const cssHeader = `
<!-- CSS OVERRIDE V6 -> PREMIUM STYLING & VERTICAL DIVIDERS -->
<style>
  .doc-reader table {
    width: 100% !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    margin: 24px 0 !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    background-color: #ffffff !important;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
  }
  .doc-reader th, .doc-reader td {
    border: none !important;
    padding: 14px !important;
    vertical-align: middle !important;
  }
  .doc-reader th:not(:last-child), .doc-reader td:not(:last-child) {
    border-right: 1px solid #f1f5f9 !important;
  }
  .doc-reader th {
    background-color: #be185d !important;
    color: #ffffff !important;
    text-align: left !important;
    border-bottom: 2px solid #9d174d !important;
  }
</style>
<!-- END CSS OVERRIDE -->
`;

  const finalHtml = cssHeader + originalHtml;

  console.log('🚀 Uploading full content (10 sections) to Supabase...');
  const { error } = await supabase.from('documents').update({ content_html: finalHtml }).eq('id', 'doc-content-san-xuat-video');
  
  if (error) {
    console.error('❌ Sync Error:', error.message);
    process.exit(1);
  } else {
    console.log('✅ RESTORE SUCCESSFUL: Full content with Premium styling and Vertical Borders is now Live.');
    process.exit(0);
  }
}

restore();
