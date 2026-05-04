#!/usr/bin/env node
/**
 * Verifies that the production CSS bundle on https://onboarding-decoco.vercel.app
 * contains the round-3 .doc-reader table fix rules.
 *
 * Usage: node scripts/verify-table-css.mjs
 *
 * Exits 0 on success (all assertions pass), 1 on failure.
 */

const ORIGIN = process.env.VERIFY_ORIGIN || 'https://onboarding-decoco.vercel.app';

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function findCssBundle() {
  const html = await fetchText(ORIGIN);
  const matches = [...html.matchAll(/"(\/_next\/static\/[^"]*\.css)"/g)].map(m => m[1]);
  if (!matches.length) throw new Error('No CSS bundle path found in homepage HTML');
  return matches[0];
}

function assertContains(css, pattern, label) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const ok = re.test(css);
  return { ok, label, pattern: pattern.toString() };
}

async function main() {
  console.log(`[verify] origin: ${ORIGIN}`);
  const bundlePath = await findCssBundle();
  console.log(`[verify] bundle: ${bundlePath}`);
  const css = await fetchText(`${ORIGIN}${bundlePath}`);
  console.log(`[verify] bundle size: ${css.length} chars`);

  const checks = [
    assertContains(css, /\.doc-reader\s+table\s*\{[^}]*margin-bottom:\s*24px\s*!important/, 'table has margin-bottom: 24px !important'),
    assertContains(css, /\.doc-reader\s+table\s*\{[^}]*background-color:\s*#fff(?:fff)?\s*!important/, 'table has background-color: #fff !important'),
    assertContains(css, /\.doc-reader\s+table\s*\{[^}]*border-radius:\s*12px\s*!important/, 'table has border-radius: 12px !important'),
    assertContains(css, /\.doc-reader\s+table\s*\{[^}]*overflow:\s*hidden\s*!important/, 'table has overflow: hidden !important'),
    assertContains(css, /\.doc-reader\s+table\s*\{[^}]*border-collapse:\s*separate\s*!important/, 'table has border-collapse: separate !important'),
    assertContains(css, /\.doc-reader\s+th\s*\{[^}]*background-color:\s*#be185d/, 'th has default pink background #be185d'),
    assertContains(css, /\.doc-reader\s+th\s*\{[^}]*color:\s*#fff(?:fff)?\s*!important/, 'th has color: #fff !important'),
    assertContains(css, /\.doc-reader\s+td\s*\{[^}]*border-bottom:\s*1px\s+solid\s+#f1f5f9\s*!important/, 'td has border-bottom: 1px solid #f1f5f9 !important'),
    assertContains(css, /\.doc-reader\s+tr:last-child\s+td\s*\{[^}]*border-bottom:\s*none\s*!important/, 'last-row td has border-bottom: none !important'),
    // Negative checks — round-2 regressions must be gone
    assertContains(css, /^(?!.*\.doc-reader\s+table\s*\{[^}]*background-color:\s*(?:transparent|#0000)\s*!important).*$/s, 'table NO longer transparent (corner gap fixed)'),
    assertContains(css, /^(?!.*\.doc-reader\s+table\s*\{[^}]*margin-bottom:\s*0\s*!important).*$/s, 'table NO longer margin-bottom: 0'),
  ];

  let passCount = 0;
  for (const c of checks) {
    if (c.ok) {
      passCount++;
      console.log(`  ✅ ${c.label}`);
    } else {
      console.log(`  ❌ ${c.label}`);
      console.log(`     pattern: ${c.pattern}`);
    }
  }

  const total = checks.length;
  console.log(`\n[verify] ${passCount}/${total} assertions passed`);

  if (passCount === total) {
    console.log('[verify] SUCCESS — production CSS matches round-3 fix.');
    process.exit(0);
  } else {
    console.log('[verify] FAILURE — production CSS does not match expected rules.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[verify] ERROR:', err.message);
  process.exit(2);
});
