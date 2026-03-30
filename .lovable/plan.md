

## Plan: Guest Contact Form & Inbox for Profile Owners

### Overview
When an unauthenticated visitor clicks "Mensagem" on a profile, instead of prompting login, navigate to a contact form page. The form shows the profile owner's photo, nickname, and position/function, plus fields for: nome, email, whatsapp, facebook, instagram, and mensagem. Profile owners can view received messages from a new "Mensagens de visitantes" section in Settings.

### Database Changes

**New table: `guest_messages`**
- `id` (uuid, PK)
- `profile_id` (uuid, FK to profiles, not null) — who the message is for
- `sender_name` (text, not null)
- `sender_email` (text, not null)
- `sender_whatsapp` (text, nullable)
- `sender_facebook` (text, nullable)
- `sender_instagram` (text, nullable)
- `message` (text, not null)
- `is_read` (boolean, default false)
- `created_at` (timestamptz, default now())

**RLS policies:**
- `anon` can INSERT (so guests can send messages)
- `authenticated` can SELECT where `profile_id = auth.uid()` (owners read their messages)
- `authenticated` can UPDATE `is_read` where `profile_id = auth.uid()`

### Frontend Changes

**1. New page: `src/pages/ContactProfile.tsx`**
- Route: `/:username/contact` (public, no auth required)
- Fetches profile by username (avatar, nickname, position_name)
- Displays profile photo, nickname, and position/function at top
- Form fields: Nome, Email, WhatsApp, Facebook, Instagram, Mensagem
- On submit: inserts into `guest_messages` table
- Success toast and redirect back to profile

**2. New page: `src/pages/settings/GuestMessages.tsx`**
- Route: `/settings/guest-messages` (protected)
- Lists all guest messages sent to the logged-in user
- Shows sender name, email, social links, message content, and timestamp
- Mark as read functionality
- Unread badge count

**3. Update `ProfileInfo.tsx`**
- In `handleMessageClick`, when `!user`: navigate to `/:username/contact` instead of opening auth prompt

**4. Update `src/pages/settings/Index.tsx`**
- Add "Mensagens de visitantes" item in the "Conta" or "Conteúdo" section with icon `mail` linking to `/settings/guest-messages`

**5. Update `src/App.tsx`**
- Add public route `/:username/contact` → `ContactProfile`
- Add protected route `/settings/guest-messages` → `GuestMessages`

### Technical Details
- Contact form uses client-side validation (zod) for required fields (name, email, message)
- Email validation with proper format check
- The form inserts using `supabase` client with anon key (RLS allows anon INSERT)
- Guest messages page uses `useQuery` to fetch from `guest_messages` where `profile_id = user.id`
- Unread count can be shown as a badge on the settings item

