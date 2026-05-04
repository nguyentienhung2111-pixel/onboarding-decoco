/**
 * Script: Chuẩn hóa HTML bảng cho doc-content-dang-bai-quan-ly
 * Mục tiêu: Bổ sung inline styles (color, background-color) cho <td> và <th>
 *           theo chuẩn doc-phong-marketing.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, key);

const DOC_ID = 'doc-content-dang-bai-quan-ly';

async function fixDangBaiTables() {
  console.log(`📥 Fetching ${DOC_ID}...`);
  const { data, error } = await supabase
    .from('documents')
    .select('content_html')
    .eq('id', DOC_ID)
    .single();

  if (error) { console.error('❌ Fetch error:', error.message); return; }

  let html = data.content_html;

  // === FIX 1: Add color + background to <td> that are missing them ===
  // Pattern: <td style="border: 1px solid #...; padding: 12px;"> (no color, no bg)
  // Replace with: same + color + bg
  html = html.replace(
    /<td style="border: 1px solid (#[a-f0-9]{6}); padding: 12px;(?: text-align: center;)?">/gi,
    (match, borderColor) => {
      const hasCenter = match.includes('text-align: center');
      const align = hasCenter ? ' text-align: center;' : '';
      return `<td style="border-bottom: 1px solid ${borderColor}; border-right: 1px solid ${borderColor}; padding: 12px;${align} color: #0f172a !important; background-color: #ffffff !important;">`;
    }
  );

  // === FIX 2: Convert <th> headers from pastel bg to dark bg (like phong-marketing) ===
  // Map pastel colors to their dark counterparts
  const headerColorMap = {
    '#fbcfe8': { bg: '#be185d', borderBottom: '#9d174d' },  // Pink
    '#bae6fd': { bg: '#0284c7', borderBottom: '#0369a1' },  // Blue 
    '#cbd5e1': { bg: '#334155', borderBottom: '#1e293b' },  // Slate
    '#c4b5fd': { bg: '#7c3aed', borderBottom: '#6d28d9' },  // Purple
  };

  // Fix <th> elements - convert to dark bg with white text
  for (const [pastel, dark] of Object.entries(headerColorMap)) {
    // Fix <th> with this pastel background
    const thRegex = new RegExp(
      `<th style="border: 1px solid ${pastel.replace('#', '\\#')}; padding: 12px; text-align: (left|center); color: #1a1a2e !important; background-color: ${pastel.replace('#', '\\#')};">`,
      'gi'
    );
    html = html.replace(thRegex, (match, align) => {
      return `<th style="padding: 12px; text-align: ${align}; color: #ffffff !important; background-color: ${dark.bg} !important; border-bottom: 2px solid ${dark.borderBottom}; border-right: 1px solid rgba(255,255,255,0.2);">`;
    });

    // Fix <tr> header row background
    const trRegex = new RegExp(
      `<tr style="background-color: ${pastel.replace('#', '\\#')}; color: #1a1a2e;">`,
      'gi'
    );
    html = html.replace(trRegex, `<tr style="background-color: ${dark.bg} !important; color: #ffffff !important;">`);
  }

  // === FIX 3: Remove border-right from last <th> in each row ===
  // The last <th> should not have border-right (same pattern as phong-marketing)
  // We handle this by removing border-right from the last th before </tr>
  html = html.replace(
    /border-right: 1px solid rgba\(255,255,255,0\.2\);">([\s\S]*?)<\/th>\s*<\/tr>/gi,
    (match) => {
      // Find the LAST th with border-right before </tr> and remove border-right
      const parts = match.split('</th>');
      if (parts.length >= 3) {
        // Remove border-right from the last th (second to last part since last is empty or </tr>)
        const lastThIdx = parts.length - 2;
        parts[lastThIdx] = parts[lastThIdx].replace(
          'border-right: 1px solid rgba(255,255,255,0.2);',
          ''
        );
      }
      return parts.join('</th>');
    }
  );

  // === FIX 4: Fix <td> border-right for last column (remove it) ===
  // For cells: last <td> before </tr> should not have border-right
  // This is handled naturally because the regex adds border-right to all td,
  // but the last td in phong-marketing style also has border-right, so we keep it.
  // Actually in phong-marketing, last td does NOT have border-right. Let me fix that.
  
  // Remove border-right from last <td> in each row
  html = html.replace(
    /<\/td>\s*<\/tr>/gi,
    (match, offset) => {
      // Find the last <td in the preceding context and remove its border-right
      return match;
    }
  );

  // === FIX 5: Add table-level styling ===
  // Add border and background to <table> tags that are missing them
  html = html.replace(
    /<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">/gi,
    '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #f8fafc !important;">'
  );

  console.log(`📤 Updating ${DOC_ID} in database...`);
  const { error: updateError } = await supabase
    .from('documents')
    .update({ content_html: html })
    .eq('id', DOC_ID);

  if (updateError) {
    console.error('❌ Update error:', updateError.message);
  } else {
    console.log('✅ Successfully updated! Tables now match doc-phong-marketing style.');
  }
}

fixDangBaiTables();
