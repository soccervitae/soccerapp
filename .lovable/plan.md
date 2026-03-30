

## Plan: Add Favorites to Settings

### What will be built
1. A new database table `favorite_profiles` to persist which users the current user has favorited
2. A new page `/settings/favorites` showing the list of favorited users
3. A "Favoritos" menu item in the Settings page, placed above "Verificação Premium"
4. Wire up the existing "Favoritar" button in the cheering options drawer (ProfileInfo.tsx) to actually insert/toggle in the database

### Database migration
Create table `favorite_profiles`:
- `id` uuid PK
- `user_id` uuid (the user who favorited)
- `favorite_id` uuid (the user being favorited)
- `created_at` timestamptz
- Unique constraint on (user_id, favorite_id)
- RLS: users can insert/delete/select their own rows

### Files to create
- **`src/pages/settings/Favorites.tsx`** — Page with header (back arrow + "Favoritos"), fetches `favorite_profiles` joined with `profiles` to display avatar, name, username, position. Each item navigable to `/profile/:username`. Empty state when no favorites.

### Files to modify
- **`src/App.tsx`** — Import and add route `/settings/favorites`
- **`src/pages/settings/Index.tsx`** — Add "Favoritos" SettingsItem with `star` icon above "Verificação Premium" (line 91)
- **`src/components/profile/ProfileSettingsSheet.tsx`** — Add "Favoritos" item above "Verificação Premium"
- **`src/components/profile/ProfileInfo.tsx`** — Replace toast in "Favoritar" button with actual insert/delete to `favorite_profiles`. Toggle label between "Favoritar" and "Remover dos favoritos" based on current state.

### Technical details
- Query favorites with profile join: `supabase.from('favorite_profiles').select('*, profiles!favorite_id(*)').eq('user_id', userId)`
- In ProfileInfo, check if profile is favorited on mount via query, then toggle on click
- Standard 50px header on the Favorites page matching existing settings pages

