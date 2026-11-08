# Sprint 4 coordination

Base branch: `sprint-4` (made from the final Sprint 3 branch, `sprint-3_with-backend`). Everyone
branches from it and opens pull requests back into it. Do not push to `sprint-4` directly.

Admin work (CP-206, CP-902, CP-1101, CP-1102) is NOT in this sprint: the admin side is the Django
admin and belongs to the backend team. Do not build or extend admin screens here.

## Who owns what

| Owner | Tickets | Files you edit |
|---|---|---|
| Danielo | CP-202 Borrower dashboard actions + recent-notifications panel, CP-205 Revoke own Lender status | `features/profile/screens/ProfileScreen.tsx`, `features/orders/screens/OrderDetailScreen.tsx`, `features/orders/components/{CancelOrderAction,CancelOrderSheet,HandoverCodeAction,ReturnCodeAction}.tsx` (wiring only), `features/profile/services/lenderRoleService.ts` (add `revokeLenderRole`), a new dashboard panel component, `getMyOrders` / `getOrder` / `cancelOrder` in `ordersService.ts` |
| Izzy | CP-601 Rate and review after order completion | everything in `features/reviews/` (`ReviewFormScreen`, `ReviewAction`, `ReviewsSection`, `reviewsService`), plus the review display in `features/profile/screens/LenderProfileScreen.tsx` (reviews section only), `features/profile/components/{LenderReviewCard,StarRating}.tsx`, `features/profile/services/{lenderProfile,lenderTypes,mockLenders}.ts`, and the "Product Reviews" part of `features/listings/screens/ItemDetailScreen.tsx` |
| Lance | CP-801 Notifications list + mark as read, CP-901 Report form | everything in `features/notifications/` and `features/reports/` |

Every stub starts with an `OWNER:` comment naming its ticket and where it plugs in. Replace the
`SlotPlaceholder` with the real UI.

## What the scaffold already did for you

All shared edits are done in the base so nobody touches another person's file:

- Routes registered in `navigation/types.ts` and `navigation/index.tsx`: `Notifications`, `ReviewForm { orderId }`.
- `OrderDetailScreen` shows `ReviewAction` (Izzy) when the order is Completed.
- `ProfileScreen` mounts `<ReviewsSection />` (Izzy) above the bottom spacer.
- `ReportButton` (Lance) is placed on `ItemDetailScreen` (listing), `LenderProfileScreen` (user) and
  `LenderReviewCard` (review). It opens `ReportSheet`.
- `notificationsService.ts` already has the final contract and a working mock, so Danielo can build the
  dashboard panel now:

```ts
getNotifications(limit?: number): Promise<AppNotification[]>   // newest first
getUnreadCount(): Promise<number>
markAsRead(id: string): Promise<void>
markAllAsRead(): Promise<void>
// AppNotification { id, type, title, body, createdAt, read, orderId?, role? }
```

Lance may extend the service but must keep these signatures and fields. Danielo's panel shows
`getNotifications(3)` and opens the `Notifications` route.

## Shared files: change only your own part

- `shared/types.ts`, `shared/components/*`, `theme`: do not change in a feature branch. Ask Danielo, or open a separate small PR into `sprint-4`.
- `ProfileScreen.tsx`, `OrderDetailScreen.tsx`: Danielo only.
- `ItemDetailScreen.tsx`: Izzy edits the "Product Reviews" part only. The request form (Sprint 3) is finished; do not change it.
- `ordersService.ts`: edit only the functions marked with your ticket. Never change another ticket's signature.
- `navigation/*`: need a new route? Add one line and tell the group.

## Known gaps

- **Chat does not exist yet** (`features/chat` is empty, the Chat tab is a placeholder). CP-202's "open chat" only navigates to the Chat tab. Reporting a *message* (CP-901) waits for chat; `ReportTargetType` already includes `'message'`.
- **No Sprint 4 endpoints are documented yet.** Everything is mock-first (`EXPO_PUBLIC_USE_MOCK=true`). The real paths in the services are assumptions:
  - `GET /notifications/`, `POST /notifications/{id}/read/`, `POST /notifications/read-all/`
  - `POST /reports/` `{ target_type, target_id, category, description }`
  - `GET /orders/{id}/review/`, `POST /reviews/` `{ order_id, rating, comment }`
  - revoke Lender status: not defined (Danielo to confirm with the backend lead)
- Existing Sprint 3 admin code (`AdminCaseScreen`, `adminCaseService`) stays untouched. Do not extend it.

## Rules (from CLAUDE.md)

Theme tokens only, reuse shared components, no hardcoded data or axios in screens, variants are state
of one screen, status UI uses `StatusBadge`, PHP (₱) display only.
