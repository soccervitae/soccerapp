

## Plan: Add semi-transparent login card on desktop Landing page

### What will be built
A login card with semi-transparent background (`bg-white/10 backdrop-blur`) positioned on the right side of the hero section, vertically centered. Only visible on desktop (hidden on mobile). The card will contain email/password fields, login button, Google login, and a link to signup.

### Changes

**1. `src/pages/Landing.tsx`**
- Restructure the hero section to use a flex layout with the existing left content and a new right-side login card
- The login card will include:
  - Small logo at top
  - Email input with icon
  - Password input with show/hide toggle
  - "Lembrar dispositivo" checkbox
  - "Esqueceu a senha?" link
  - Login button (primary)
  - Google login button
  - "Não tem conta? Cadastre-se" link (navigates to `/auth` with signup tab)
- Card styling: `bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8`, max-width ~380px
- Hidden on mobile (`hidden md:flex`)
- Login logic will use `useAuth().signIn` and handle redirect, 2FA, etc. (reusing the same flow from Auth.tsx)
- Import necessary components: `Input`, `Label`, `Checkbox`, icons

**2. Files**
- `src/pages/Landing.tsx` (modify — add login card component inline or as a local component)

