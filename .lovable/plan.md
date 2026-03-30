

## Plan: Handle deleted user in chat

### Problem
When a user's account is deleted, the conversation still shows but displays "Usuário" with no name, and allows sending messages and calling.

### Detection
When the profile query returns `null` for the other participant, that means the account was deleted. We'll pass a new `isDeletedUser` flag based on whether the participant profile exists but the user_id was found in conversation_participants.

### Changes

**1. `src/pages/Chat.tsx`**
- Track `isDeletedUser` state: set to `true` when `otherParticipant` user_id exists but profile query returns `null`
- Pass `isDeletedUser` to `ChatHeader`
- When `isDeletedUser`: replace `ChatInput` with a blocked area showing "Este usuário não está mais disponível na Soccer Vitae" + a "Excluir conversa" button
- The delete button opens a `ResponsiveModal` for confirmation (sheet on mobile, dialog on desktop), reusing `handleDeleteConversation`

**2. `src/components/messages/ChatHeader.tsx`**
- Accept new prop `isDeletedUser?: boolean`
- When `isDeletedUser` is true: hide the Phone, Video, and MoreVertical (3 dots) buttons entirely
- Only show the back arrow and the user name ("Usuário")

### Files
- `src/pages/Chat.tsx`
- `src/components/messages/ChatHeader.tsx`

