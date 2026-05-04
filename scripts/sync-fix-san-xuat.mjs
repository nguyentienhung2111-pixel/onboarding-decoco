/**
 * Script: Chuẩn hóa HTML bảng cho doc-content-san-xuat-video
 * Mục tiêu: Loại bỏ wrapper div, style block, class premium-table
 *           và bổ sung border-right theo chuẩn doc-phong-marketing.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, key);

const DOC_ID = 'doc-content-san-xuat-video';

async function fixSanXuatTables() {
  console.log(`📥 Fetching ${DOC_ID}...`);
  const { data, error } = await supabase
    .from('documents')
    .select('content_html')
    .eq('id', DOC_ID)
    .single();

  if (error) { console.error('❌ Fetch error:', error.message); return; }

  let html = data.content_html;

  // === STEP 1: Remove the <style> block ===
  html = html.replace(/<!-- CSS RESET FOR DOC -->\s*<style>[\s\S]*?<\/style>\s*/g, '');

  // === STEP 2: Remove wrapper divs around tables ===
  // Pattern: <div style="background-color: #ffffff !important; border-radius: 16px; overflow: hidden; ...">
  //            <table ...>...</table>
  //          </div>
  // Replace with just the <table> but with border/radius/overflow added to it
  
  // Handle wrapper divs - extract the table and merge styles
  html = html.replace(
    /<!-- (TABLE:[^>]+) -->\s*<div style="background-color: #ffffff !important; border-radius: 16px; overflow: hidden; border: 1px solid ([^;]+); margin: 24px 0;[^"]*">\s*(<table[^>]*>)([\s\S]*?)<\/table>\s*<\/div>/g,
    (match, comment, borderColor, tableTag, tableContent) => {
      // Remove class="premium-table" and add proper styles to table tag
      let newTableTag = tableTag
        .replace(/ class="premium-table"/, '')
        .replace(
          'style="width: 100%; border-collapse: collapse;"',
          `style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid ${borderColor}; border-radius: 8px; overflow: hidden; background-color: #f8fafc !important;"`
        );
      
      return `<!-- ${comment} -->\n${newTableTag}${tableContent}</table>`;
    }
  );

  // === STEP 3: Add border-right to <th> elements (except last in row) ===
  // Find all <tr> rows with <th> and add border-right to all but last
  html = html.replace(
    /(<tr[^>]*>\s*)((<th[^>]*>[\s\S]*?<\/th>\s*)+)(<\/tr>)/g,
    (match, trOpen, thGroup, _, trClose) => {
      const ths = thGroup.match(/<th[^>]*>[\s\S]*?<\/th>/g);
      if (!ths || ths.length <= 1) return match;
      
      const processed = ths.map((th, i) => {
        if (i < ths.length - 1) {
          // Not last th: add border-right if not already present
          if (!th.includes('border-right')) {
            th = th.replace(
              /style="([^"]*)"/,
              (_, styles) => `style="${styles} border-right: 1px solid rgba(255,255,255,0.2);"`
            );
          }
        } else {
          // Last th: remove border-right if present
          th = th.replace(/\s*border-right:[^;]+;/g, '');
        }
        return th;
      });
      
      return trOpen + processed.join('\n      ') + '\n    ' + trClose;
    }
  );

  // === STEP 4: Add border-right to <td> elements (except last in row) ===
  html = html.replace(
    /(<tr[^>]*>\s*)((<td[^>]*>[\s\S]*?<\/td>\s*)+)(<\/tr>)/g,
    (match, trOpen, tdGroup, _, trClose) => {
      const tds = tdGroup.match(/<td[^>]*>[\s\S]*?<\/td>/g);
      if (!tds || tds.length <= 1) return match;
      
      const processed = tds.map((td, i) => {
        if (i < tds.length - 1) {
          // Not last td: add border-right using the border-bottom color
          if (!td.includes('border-right')) {
            // Extract the border-bottom color to use for border-right
            const colorMatch = td.match(/border-bottom: 1px solid ([^;]+);/);
            const borderColor = colorMatch ? colorMatch[1] : '#e2e8f0';
            td = td.replace(
              /style="([^"]*)"/,
              (_, styles) => `style="${styles} border-right: 1px solid ${borderColor};"`
            );
          }
        }
        return td;
      });
      
      return trOpen + processed.join('\n      ') + '\n    ' + trClose;
    }
  );

  // === STEP 5: Remove any leftover class="premium-table" ===
  html = html.replace(/ class="premium-table"/g, '');

  console.log(`📤 Updating ${DOC_ID} in database...`);
  const { error: updateError } = await supabase
    .from('documents')
    .update({ content_html: html })
    .eq('id', DOC_ID);

  if (updateError) {
    console.error('❌ Update error:', updateError.message);
  } else {
    console.log('✅ Successfully updated!');
    
    // Verify
    const { data: verify } = await supabase.from('documents').select('content_html').eq('id', DOC_ID).single();
    const h = verify.content_html;
    console.log('\n📊 Verification:');
    console.log('  Wrapper divs remaining:', (h.match(/<div style="background-color: #ffffff !important; border-radius: 16px/g) || []).length);
    console.log('  <style> blocks remaining:', (h.match(/<style>/g) || []).length);
    console.log('  class="premium-table" remaining:', (h.match(/class="premium-table"/g) || []).length);
    console.log('  border-right occurrences:', (h.match(/border-right/g) || []).length);
    console.log('  td with color #0f172a:', (h.match(/color: #0f172a/g) || []).length);
  }
}

fixSanXuatTables();
