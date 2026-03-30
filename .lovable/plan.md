

## Plan: Block auth pages in browser, allow only profile for guests

### What changes
The `/auth`, `/login`, `/signup`, `/forgot-password`, and `/two-factor-verify` routes will be restricted to PWA only. When accessed from a browser (non-PWA), they will show a message telling the user to download the app.

### Changes

**1. Create `src/components/common/PwaOnlyGate.tsx`**
- A wrapper component that checks `useIsPWA()`
- If not PWA: renders a full-screen page with Soccer Vitae branding, message "Para fazer login ou criar sua conta, baixe o app Soccer Vitae", and a button linking to `/install`
- If PWA: renders `children`

**2. `src/App.tsx`** — Wrap auth routes with PwaOnlyGate
- Wrap `/auth`, `/forgot-password`, `/two-factor-verify` routes with `<PwaOnlyGate>`
- `/login` and `/signup` already redirect to `/auth`, so they're covered
- Profile route (`/:username`) remains public as-is

### Files
- `src/components/common/PwaOnlyGate.tsx` (new)
- `src/App.tsx` (modify 3 routes)

