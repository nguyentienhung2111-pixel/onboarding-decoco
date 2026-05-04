# BUG REPORT: Extra White Space at Bottom of Tables

> **Status:** RESOLVED — fix applied in commit on branch `main` (2026-05-04).

## Description
Tables rendered within the onboarding documents (via the `.doc-reader` component) exhibited an unwanted white gap at the bottom, inside the rounded border/shadow container. The issue affected the visual consistency of the documents, especially when viewed against the reader's dark background.

## Visual Evidence
The white gap appears between the last row of the table and the bottom border of the table container. It looks as if the table element itself is taller than the sum of its rows, and its white background is leaking through the bottom.

## Root Cause Analysis (verified)
1.  **CSS Conflict:** The global CSS (`src/app/globals.css`) styles `.doc-reader table` with `overflow: hidden` and a `box-shadow` (acting as a border). However, the HTML content stored in the database (Supabase `documents.content_html`) contains inline styles like `style="width: 100%; border-collapse: collapse; margin: 16px 0;"` on `<table>` elements. Because inline styles beat plain class selectors on specificity, the inline `border-collapse: collapse` always won.
2.  **Rendering Bug:** Using `border-collapse: collapse` together with `border-radius` and `overflow: hidden` on a `<table>` element causes rendering artifacts in Chromium-based browsers — the table's intrinsic background area is computed from the border box (which extends past the collapsed cell borders), so the white background bleeds at the bottom edge inside the rounded clipping mask.
3.  **Background leak:** The table inherits a white-ish background in some places (and the implicit `<tbody>` inside the rounded container has its own block formatting). Once the rendering artifact creates extra height, the white background fills the gap.

## Impacted Files
- `src/app/globals.css` — `.doc-reader table` rules (around line 773).
- Document content (HTML) stored in Supabase — contains inline `border-collapse: collapse` on `<table>` and various `border`/`background-color` styles on `<td>`/`<th>`.

## Why the original proposed fix was adjusted
The original proposal in this report suggested adding:

```css
.doc-reader th,
.doc-reader td {
  border-bottom: 1px solid var(--gray-200);
}
.doc-reader tr:last-child td {
  border-bottom: none;
}
```

This was rejected because the HTML content already sets per-cell borders inline (e.g. `<td style="border: 1px solid #fbcfe8; padding: 12px;">`). Adding a uniform CSS `border-bottom` would:

1. **Conflict with `border-collapse: separate`** — separate keeps each cell's borders independent, so the new CSS rule would render alongside the inline border, producing visible 2px "double borders" between rows.
2. **Override per-cell color schemes** — different documents use different brand-coloured borders (pink `#fbcfe8`, slate `#cbd5e1`, etc.). Forcing `var(--gray-200)` everywhere would flatten those palettes.
3. **Be ignored anyway on cells with full inline `border`** — inline beats the class selector on specificity (without `!important` on the CSS side).

Plus, an earlier attempt (commit `8540c6a — fix: simplify doc-reader table CSS to stop conflicting with inline styles`) had already learned this lesson the hard way: aggressive cell-level border rules in the global CSS caused visual artifacts and were stripped out.

## Applied Fix
Only the `<table>` element is forced into a layout that supports `border-radius + overflow:hidden` cleanly. Cell-level styling is left untouched so inline styles continue to drive per-document brand colors.

```css
.doc-reader table {
  width: 100% !important;
  border-collapse: separate !important;   /* required for clean rounded corners */
  border-spacing: 0 !important;           /* mimic collapse visually — no gaps between cells */
  background-color: transparent !important; /* prevents white bleed at bottom */
  margin-bottom: 24px;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--gray-200), 0 2px 8px rgba(0,0,0,0.10);
}

.doc-reader table tbody,
.doc-reader table thead,
.doc-reader table tfoot {
  background-color: transparent;
}
```

The `!important` declarations are necessary specifically to defeat the inline `style="border-collapse: collapse;"` written into every `<table>` in the database content.

## Why this works
- `border-collapse: separate` + `border-spacing: 0` lets `overflow: hidden` correctly clip the corners against `border-radius`. Collapsed tables have edge-rendering quirks that cause the white bleed.
- `background-color: transparent` on the `<table>`, `<thead>`, `<tbody>`, `<tfoot>` removes any default white surface that could appear past the last row.
- Cell-level inline styles (`<td style="border: ...">`) continue to define per-document border colors. We don't fight them.

## Verification
1. Open `/documents/doc-content-san-xuat-video` (the doc with the most inline-styled tables). The white gap below the last row is gone.
2. Open other docs that contain tables (e.g. `doc-noi-quy-chung`, `doc-van-hoa`). Per-document brand colors on borders/headers are preserved.
3. Rounded corners clip correctly on all four corners of the table container (still visually consistent with commit `401aa71`).

## Steps to Reproduce (original)
1.  Open any document containing a table (e.g., `/documents/doc-content-san-xuat-video`).
2.  Scroll to the table.
3.  Observe the white space below the last row, inside the rounded border.

## History (for future debug context)
- `78a6067` — initial premium table styling (rounded corners + shadow).
- `401aa71` — applied `border-radius` directly to corner cells.
- `8540c6a` — simplified CSS to stop conflicting with inline styles (stripped per-cell border rules and `border-collapse: separate` because they were being overridden by inline styles, causing artifacts).
- `[this fix]` — re-introduced `border-collapse: separate` + `border-spacing: 0` on `<table>` only, but with `!important` so it actually wins against the inline `border-collapse: collapse`. Did NOT re-introduce the per-cell border CSS rules — those still belong to the inline styles.

## Lessons for future similar bugs
- When the database stores HTML with inline styles, the global CSS for `.doc-reader` needs `!important` on any property the inline style also sets — otherwise the inline wins and the override is silently ignored.
- For rounded `<table>` containers with `overflow: hidden`, prefer `border-collapse: separate; border-spacing: 0;`. Collapsed tables have known edge artifacts in Chromium when combined with rounded clipping.
- Per-cell border colors in this project come from inline styles (different docs use different brand palettes). Don't add cell-level border rules in `globals.css` — they will either be ignored (no `!important`) or trample the brand colors (with `!important`).
