

## Plan: Show Posts tab for team profiles when guest + Auth prompt modal

### Changes

**1. `src/pages/Profile.tsx`** — Show "profile" (Posts) tab for team profiles even when guest

- Update `tabOrder` for `isTeamOrSchool` guest case: change from `["videos", "photos", "championships", "achievements"]` to `["profile", "videos", "photos", "championships", "achievements"]`
- Update `activeTab` default: when `isGuest` and `isTeamOrSchool`, default to `"profile"` instead of `"teams"`
- In the TabsList rendering, show the Posts tab trigger for team profiles even when `isGuest` (currently hidden by `{!isGuest && ...}`)

**2. `src/components/profile/ProfileInfo.tsx`** — Replace `navigate("/login")` with a ResponsiveModal prompt

- Add state `authPromptOpen` to control the modal
- In `handleFollowClick` and `handleMessageClick`, when `!user`, open the auth prompt modal instead of navigating to `/login`
- Render a `ResponsiveModal` (drawer on mobile, dialog on desktop) with:
  - Title: "Entre na Soccer Vitae"
  - Message: "Você precisa estar logado ou criar sua conta para usar esta funcionalidade."
  - Two buttons: "Entrar" (navigates to `/login`) and "Criar conta" (navigates to `/auth`)

### Files to modify
- `src/pages/Profile.tsx` (tab order + default tab + tab visibility)
- `src/components/profile/ProfileInfo.tsx` (auth prompt modal)

