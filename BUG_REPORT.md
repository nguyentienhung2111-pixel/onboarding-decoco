# BUG REPORT: Extra White Space at Bottom of Tables

> **Status:** RESOLVED (Round 2) — `margin-bottom: 24px` on `.doc-reader table` removed; the inline `<style>` block in `scripts/fix_vercel_css.mjs` updated so any future re-upload of the doc content will not re-introduce the wrapper-gap.

## Description
Tables rendered within the onboarding documents (via the `.doc-reader` component) exhibited an unwanted ~24px white gap at the bottom, inside the rounded border/shadow container. The gap persisted even after the round-1 fix that applied `border-collapse: separate` and `background: transparent` to `<table>`.

## Visual Evidence
A ~24px white strip appears below the last row but *inside* the rounded border container. Most visible in `doc-content-san-xuat-video`.

## Root Cause Analysis (Round 2 — actually causal)
1.  **Margin lived inside the rounded container.** Global CSS set `margin-bottom: 24px` on every `.doc-reader table`. When the document HTML (or its embedded inline `<style>`) gives the `<table>` a white background and a rounded outer border, the table's own bottom margin shifts the next sibling 24px down — and because the rounded container *is* the table, that 24px sits as an empty white strip below the last row, inside the box-shadow ring.
2.  **Inline `<style>` reinforced the problem on `doc-content-san-xuat-video`.** The script `scripts/fix_vercel_css.mjs` previously embedded:
    ```css
    .premium-table {
      margin: 24px 0;
      background-color: #ffffff !important;
      ...
    }
    ```
    Both halves of the bug came from this — the margin gave 24px of empty space below the table; the white background made that space visible.
3.  **Why round-1 didn't fully fix it.** Round-1 zeroed the *table-level* background and forced `border-collapse: separate`, which fixed corner-clipping artifacts and bg leak from the table element itself. But the table-level margin and the inline `.premium-table` rule (which also has `!important`) were untouched, so a 24px gap with white fill remained whenever that inline style was active.

## Impacted Files
- `src/app/globals.css` — `.doc-reader table` margin rule.
- `scripts/fix_vercel_css.mjs` — the inline `<style>` block embedded in Supabase document content.

## Applied Fix

### 1. `src/app/globals.css` (line 778)
```css
.doc-reader table {
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  background-color: transparent !important;
  margin-bottom: 0 !important;          /* WAS: margin-bottom: 24px; */
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--gray-200), 0 2px 8px rgba(0,0,0,0.10);
}
```
Vertical rhythm between a table and the next block is preserved by the next element's `margin-top` (e.g. `.doc-reader h3 { margin: 28px 0 12px 0 }`, `.doc-reader h4 { margin: 20px 0 8px 0 }`). All current document layouts have an `<h3>`/`<h4>` between consecutive tables, so removing the table's bottom margin does not collapse spacing in practice.

### 2. `scripts/fix_vercel_css.mjs`
The embedded `<style>` block was updated:
```css
.premium-table {
  margin: 0 !important;                  /* WAS: margin: 24px 0; */
  background-color: transparent !important; /* WAS: #ffffff !important; */
  ...
}
```
This change does **not** retroactively update the content already stored in Supabase — it just ensures that the next time someone runs `node scripts/fix_vercel_css.mjs`, the embedded styles are correct. The currently-stored `content_html` for `doc-content-san-xuat-video` still has the old inline `<style>` with `margin: 24px 0` and `background-color: #ffffff !important`, but the round-2 globals.css change overrides the global table rule and the visible white-gap symptom is gone because:
- The global `.doc-reader table { background-color: transparent !important }` defeats the inline `<style>` setting `background-color: #ffffff !important` (both have `!important`; the global rule's selector specificity is higher than the class-only `.premium-table`).
- The global `margin-bottom: 0 !important` similarly defeats the inline `margin: 24px 0` (since the inline `.premium-table` doesn't use `!important` on margin).

So the production fix is *fully delivered by the globals.css change alone*. Re-running the script is optional cleanup, not required.

## Verification
1. After deploy, open `/documents/doc-content-san-xuat-video`. The white strip at the bottom of every table is gone.
2. DevTools → Inspect any `.doc-reader table` → Computed: `margin-bottom: 0px`, `background-color: rgba(0, 0, 0, 0)`.
3. Spacing between consecutive tables is still natural (driven by `<h3>`/`<h4>` margin-top).
4. Per-document brand colors on cell borders/headers still render correctly (we never touched cell-level rules).

## History
- `78a6067` — initial premium table styling (rounded corners + shadow).
- `401aa71` — applied `border-radius` directly to corner cells.
- `8540c6a` — simplified CSS to stop conflicting with inline styles (stripped per-cell border rules and `border-collapse: separate`).
- `ca12c3f` — Round 1: re-introduced `border-collapse: separate !important`, `border-spacing: 0 !important`, `background-color: transparent !important` on `.doc-reader table` only. Fixed corner-clipping and table-element bg leak, but a residual 24px gap remained.
- `[this fix — Round 2]` — removed `margin-bottom: 24px` from `.doc-reader table` (made it `0 !important`); updated `scripts/fix_vercel_css.mjs` inline style to match (margin: 0, transparent bg) so future re-uploads stay clean.

## Lessons for future similar bugs
- Inline `<style>` blocks embedded inside content stored in Supabase are a hidden third layer of CSS — easy to forget when debugging visual issues. When a fix in `globals.css` doesn't take effect, grep `scripts/*.mjs` for inline `<style>` blocks that the content might carry.
- For elements that act as their own visual container (rounded corners + box-shadow + bg), avoid setting `margin-bottom` on the element itself. Either let the next sibling control top spacing, or wrap the element and put margin on the wrapper.
- When global CSS uses `!important` against inline styles, remember that **selector specificity still arbitrates between two `!important` declarations**. `.doc-reader table` (one class + one type) beats `.premium-table` (one class) — that's why the global `background-color: transparent !important` wins over the inline `.premium-table { background-color: #ffffff !important }`.
