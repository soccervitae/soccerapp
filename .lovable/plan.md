

# Fix PWA Authentication and Navigation Issues

## Problems Identified

1. **Auth initialization order is wrong**: The `onAuthStateChange` listener is set up AFTER `getSession()`. Supabase docs require the listener to be registered FIRST, then `getSession()`. This causes a race condition where auth events fire before the listener is ready, leading to blank pages after login in PWA.

2. **PWA clears its own session**: After restoring session from IndexedDB in PWA mode, it immediately clears the IndexedDB data. But `onAuthStateChange` only saves to IndexedDB when NOT in PWA mode (`if (!isPWA())`). So on next PWA open, there is no session to restore and Supabase localStorage may have been purged by the browser.

3. **Redirect cascade in ProtectedRoute**: Multiple sequential checks (conta_verificada → account_type → profile_completed → onboarding_completed) cause the user to briefly see one page then get redirected to another, creating the "page after page" bug.

4. **QueryClient cache lost on PWA update**: When the PWA auto-updates and reloads, all React Query cache is wiped. Combined with the auth race condition, this causes blank screens or incorrect redirects.

## Plan

### Step 1: Fix AuthContext initialization order
- Move `onAuthStateChange` subscription setup BEFORE `getSession()` call
- Use a flag to avoid double-setting state when both `onAuthStateChange` and `getSession` resolve
- Remove the `await` on ban check inside `signIn` to avoid blocking

### Step 2: Fix PWA session persistence
- In `onAuthStateChange`, save session to IndexedDB in ALL modes (remove `!isPWA()` guard)
- Only clear IndexedDB after confirming Supabase localStorage has the session persisted
- This ensures PWA always has a backup session available

### Step 3: Stabilize ProtectedRoute redirects
- Add a single, deterministic redirect calculation that runs only after ALL data is loaded (profile, admin status, PWA check)
- Prevent multiple sequential Navigate renders by computing the final redirect destination in one pass
- Add a brief stabilization delay after login to prevent flash redirects

### Step 4: Prevent stale redirects on PWA reload
- Invalidate profile query cache when auth state changes to ensure fresh data drives redirect logic
- In AuthContext `onAuthStateChange`, call `queryClient.invalidateQueries(["profile"])` on SIGNED_IN events

## Files to Modify

- `src/contexts/AuthContext.tsx` — Fix init order, fix IndexedDB persistence logic
- `src/components/ProtectedRoute.tsx` — Stabilize redirect logic, single-pass redirect calculation
- `src/App.tsx` — Pass queryClient reference to AuthProvider for cache invalidation

## Technical Details

The critical Supabase pattern fix:
```typescript
// CORRECT ORDER (current code has it reversed)
const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
const { data: { session } } = await supabase.auth.getSession();
```

PWA session save fix:
```typescript
// Save in ALL modes, not just browser
if (currentSession) {
  saveSessionToIndexedDB(currentSession.access_token, currentSession.refresh_token, currentSession.expires_at);
}
```

ProtectedRoute single-pass redirect:
```typescript
// Compute final destination once instead of multiple if/return blocks
const redirectTo = !profileData.conta_verificada ? "/verify-account"
  : (!profileData.account_type || !profileData.profile_completed) ? "/choose-account-type"
  : (!profileData.onboarding_completed) ? "/welcome"
  : null;

if (redirectTo && location.pathname !== redirectTo) {
  return <Navigate to={redirectTo} replace />;
}
```

