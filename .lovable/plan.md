

## Plan: Keep scroll position at tabs when switching tabs while sticky

### Problem
When the tabs bar is sticky at the top and the user clicks a different tab icon, the page scrolls back to the very top (position 0) if that tab has no saved scroll position. The user expects it to stay at the tabs level.

### Solution
In `src/pages/Profile.tsx`, when restoring scroll for a tab that has no saved position, instead of scrolling to `0`, scroll to the **minimum of the tabs element's offset** — so the tabs remain visible at the top without showing the profile header above.

### Changes — single file: `src/pages/Profile.tsx`

1. **In `useLayoutEffect` (line ~212-213)**: When `savedY` is `undefined`, calculate the tabs element's `offsetTop` minus the header height (50px) as the minimum scroll position:

```tsx
const tabsEl = document.querySelector('[data-profile-tabs-list="true"]') as HTMLElement | null;
const tabsOffsetY = tabsEl ? tabsEl.offsetTop - 50 : 0;

// If user was scrolled past the tabs (tabs were sticky), keep at tabs level
const wasSticky = (window.scrollY || 0) >= tabsOffsetY && tabsOffsetY > 0;
const targetY = savedY !== undefined ? savedY : (wasSticky ? tabsOffsetY : 0);
```

2. **Save the "was sticky" state before tab switch** — in `handleTabChange` (line ~514), capture whether tabs are currently sticky before saving scroll and switching:

```tsx
const handleTabChange = (nextTab: string) => {
  if (nextTab === activeTab) return;
  saveCurrentTabScroll();
  // Check if tabs are sticky before switching
  const tabsEl = document.querySelector('[data-profile-tabs-list="true"]') as HTMLElement | null;
  const tabsOffsetY = tabsEl ? tabsEl.offsetTop - 50 : 0;
  const wasSticky = (window.scrollY || 0) >= tabsOffsetY && tabsOffsetY > 0;
  wasStickyRef.current = wasSticky;
  pendingScrollRestoreRef.current = collectScrollTargets();
  setActiveTab(nextTab);
};
```

3. **Add a ref** to pass the sticky state: `const wasStickyRef = useRef(false);`

4. **Use it in restore**: Replace the `targetY` calculation to use `wasStickyRef.current` when no saved scroll exists.

This ensures clicking a tab while the tabs bar is sticky keeps the page scrolled to the tabs position instead of jumping to the top.

