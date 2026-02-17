# TASK: Fix Mobile Layout — Mission Control

## Priority: URGENT

## Screenshot Reference
See `/tmp/mc-mobile-fix-screenshot.jpg` for the current broken state on iPhone.

## Issues to Fix

### 1. Sidebar Not Collapsing on Mobile
- The sidebar shows ALL nav links inline on mobile instead of being hidden behind hamburger menu
- Links are wrapping and look like a mess of blue text
- **Fix**: Sidebar must be hidden by default on mobile (< 768px), toggled via hamburger button
- The `<` back button and `☰` hamburger are showing but sidebar content is still visible

### 2. Page Header Duplication  
- "Second Brain" title appears TWICE — once from the page layout and once from the page component
- **Fix**: Remove one of them. The page component should handle its own title.

### 3. Category Pills Running Together
- "AllDecisionsLearningsRulesPeopleProjects" shows as one continuous string
- No spacing or gaps between filter pills
- **Fix**: Add `gap-2` or `space-x-2` and ensure pills wrap properly with `flex-wrap`

### 4. Source Filter Chips Running Together  
- "All SourcesManualAgentTelegramEmail" — same problem
- **Fix**: Same as above — proper gap and flex-wrap

### 5. Split-Panel Layout Broken on Mobile
- Both the list panel (left) AND detail panel (right) are showing stacked
- The detail panel shows "Your Second Brain / Select a memory to view details..." even though nothing is selected
- **Fix**: On mobile, ONLY show the list. Detail panel should be a full-screen overlay that appears when a memory is tapped (the code may already have this logic but it's not working)

### 6. "Loading memories..." Spinner
- Shows loading state but may be stuck — check if the Supabase query works with the new columns (source_type, access_count etc. may not exist yet in DB)
- **Fix**: Make the query graceful — only select columns that exist, or handle 400 errors

### 7. FAB (+) Button
- The floating action button at bottom-left is partially hidden
- **Fix**: Ensure proper z-index and positioning, not overlapping with browser chrome

## Files to Edit
- `src/app/memory/page.tsx` — main memory page (split-panel, filters, mobile logic)
- `src/components/memory/memory-card.tsx` — card component
- `src/components/memory/memory-detail-panel.tsx` — detail panel
- `src/components/memory/create-memory-dialog.tsx` — create dialog
- `src/components/layout/sidebar.tsx` — sidebar mobile behavior
- `src/app/layout.tsx` — root layout (check if duplicate header comes from here)

## Tech Stack
- Next.js 16, App Router
- Tailwind CSS (utility classes)
- shadcn/ui components
- Static export to GitHub Pages

## Key Constraints
- Mobile-first! iPhone is the primary device
- Dark theme (bg-zinc-950, text-white)
- Test at 375px viewport width
- `basePath: '/mission-control'` in next.config.ts
- Build must pass: `npx next build`

## When Done
1. Run `npx next build` — must succeed
2. Verify the fixes address all 7 issues above
