

## Plan: Create "Saiba Mais" page

### What will be built
A new `/saiba-mais` page containing all the content currently below the hero banner on the Landing page (Account Types, Features by Account Type, Shared Features, and CTA sections). The page will have a fixed header with the Soccer Vitae logo.

### Changes

**1. Create `src/pages/SaibaMais.tsx`**
- Fixed header with white background, Soccer Vitae green logo (`logoGreen`), and a back arrow linking to `/`
- Copy all content sections from Landing.tsx (lines 168-298): Account Types, Features by Account Type with all 3 account cards, Shared Features, and CTA section
- Same data arrays (`featuresByAccount`, `sharedFeatures`) and same styling/layout
- Same install sheet logic for mobile CTA buttons

**2. Update `src/App.tsx`**
- Add route `/saiba-mais` as a public route (no auth required), rendering the new page

**3. Update `src/pages/Landing.tsx`**
- Change the "Saiba Mais" button's `onClick` to navigate to `/saiba-mais` instead of scrolling to `#account-types`
- Remove all sections below the hero (Account Types, Features by Account, Shared Features, CTA) since they move to the new page
- Keep only the hero banner and install sheet

### Files
- `src/pages/SaibaMais.tsx` (new)
- `src/App.tsx` (add route)
- `src/pages/Landing.tsx` (simplify, update button)

