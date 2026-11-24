# Sprint 5 coordination

Base branch: `sprint-5` (made from the final Sprint 4 branch, `sprint-4_with-backend`). Everyone
branches from it and opens pull requests back into it. Do not push to `sprint-5` directly.

NOTE on Admin tickets:
Our production admin portal is the Django admin maintained by the backend team. For CP-703,
Lance handles the in-app conversation view within `AdminCaseScreen.tsx` for case triaging,
while conversation retention in the database and Django admin portal is coordinated with backend.

## Who owns what

| Owner | Tickets | Files you edit |
|---|---|---|
| Danielo (me) | Additional Ticket: Home Page Refinement, CP-903 Document and resolve item damage/missing-item disputes | `features/dashboard/screens/HomeScreen.tsx`, `features/orders/screens/ReportDamageScreen.tsx`, `features/orders/screens/DisputeResponseScreen.tsx`, `features/orders/screens/OrderDetailScreen.tsx` (dispute status & response trigger), `features/orders/services/ordersService.ts` (`submitDisputeResponse`) |
| Izzy | CP-701 One-to-one chat between Borrower and Lender, CP-702 Block another user in chat | everything in `features/chat/` (`ChatListScreen`, `ChatThreadScreen`, `chatService`, `chatTypes`, `mockChats`, `BlockUserModal`) |
| Lance | CP-802 Configure email notification preferences, CP-703 Retain conversations linked to reports or disputes | `features/profile/screens/NotificationPreferencesScreen.tsx`, `features/profile/services/accountService.ts` (preferences section), `features/admin/screens/AdminCaseScreen.tsx` (retained chat view), `features/admin/services/adminCaseService.ts` |

Every stub file starts with an `OWNER:` comment naming its ticket and where it plugs in. Replace the
`SlotPlaceholder` with the real UI.

## What the scaffold already did for you

All shared edits and routing are prepared in `sprint-5` so nobody needs to touch another teammate's files:

- **Routes registered** in `navigation/types.ts` and `navigation/index.tsx`:
  - `Chat` tab in bottom navigation is now wired to `ChatListScreen` (Izzy).
  - `ChatThread` stack route is registered with `{ conversationId, recipientId, recipientName, listingId, orderId, listingTitle }`.
  - `DisputeResponse` stack route is registered with `{ orderId }`.
- **Chat entry points wired**:
  - `ItemDetailScreen.tsx`: The bottom bar "Chat" button navigates to `ChatThread` passing the listing and lender details.
  - `OrderDetailScreen.tsx`: The "Chat" button (`OpenChatAction.tsx`) navigates to `ChatThread` with order and counterparty details.
- **Dispute response scaffold**:
  - `DisputeResponseScreen.tsx` is created for borrowers to respond to damage claims with explanation and photos/videos.
  - `submitDisputeResponse()` helper added to `ordersService.ts`.
- **Admin Case conversation view**:
  - `AdminCaseScreen.tsx` has a `SlotPlaceholder` under "Linked Conversation" for CP-703 (Lance).
- **Notification preferences**:
  - `NotificationPreferencesScreen.tsx` is stubbed for the 4 preference groups: Order Updates, Messages, Reviews, Account & Verification (Lance).
- **Home page refinement**:
  - `HomeScreen.tsx` is marked with owner comments for dynamic listings integration from the database (Danielo).

## Shared files: change only your own part

- `shared/types.ts`, `shared/components/*`, `theme`: do not change in a feature branch. Ask Danielo, or open a separate small PR into `sprint-5`.
- `OrderDetailScreen.tsx`, `HomeScreen.tsx`: Danielo only.
- `features/chat/*`: Izzy only.
- `NotificationPreferencesScreen.tsx`, `AdminCaseScreen.tsx`: Lance only.
- `navigation/*`: Routes are already registered. Need a new route? Ask Danielo first.

## How to start

1. Open your stub files. Each one starts with an `OWNER:` comment listing your ticket and where it plugs in.
2. Replace the dashed `SlotPlaceholder` with your real UI.
3. Use mock mode: set `EXPO_PUBLIC_USE_MOCK=true` in your `.env` (do not commit `.env`).
4. Build mock-first following the service contracts.

## Rules for you and your AI agent (prevent merge conflicts)

1. Edit ONLY the files listed as yours. If you need to change a file you do not own, STOP and message Danielo first.
2. Do NOT edit `shared/types.ts`, `shared/components`, `theme`, `ProfileScreen.tsx` or `OrderDetailScreen.tsx` in your branch without checking.
3. Do NOT reformat files, change line endings, reorder imports in files you did not write, or run an automatic formatter on whole files. Noisy diffs cause merge conflicts.
4. Do NOT rename, move or delete files you did not create. Do not add npm packages without telling Danielo.
5. Follow CLAUDE.md: theme tokens only, no hardcoded data or axios in screens, status shown with StatusBadge, prices in PHP.
6. Commit small and often, with clear messages that include the ticket number.

## Before you open a pull request

```bash
git fetch origin
git merge origin/sprint-5
```
- If Git reports conflicts, fix them on your branch, keeping BOTH sides' changes.
- Run `npx tsc --noEmit`. It must print nothing (0 errors).
- Run the app and test your screens in mock mode.
- Push and open the PR into `sprint-5`. In the PR description, list the tickets and every file you changed. Do not commit `.env` or `node_modules`.
