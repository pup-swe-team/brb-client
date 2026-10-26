# Sprint 3 coordination

Base branch: `sprint-3` (made from the final Sprint 2 branch). Everyone branches
from it and opens pull requests back into it. Do not push to `sprint-3` directly.

## Who owns what

| Owner | Tickets | Files you edit |
|---|---|---|
| Danielo | CP-201 Borrower dashboard, CP-503 Cancel order | `features/profile/screens/ProfileScreen.tsx` (borrower sections), `features/orders/screens/OrderDetailScreen.tsx` (shell), `features/orders/components/CancelOrderAction.tsx`, the `getMyOrders` / `getOrder` / `cancelOrder` functions in `ordersService.ts` |
| Member A-Lance | CP-203 Lender dashboard + switch, CP-506 Overdue indicators + Admin case view | `features/dashboard/components/LenderDashboard.tsx`, `DashboardSwitch.tsx`, `OverdueIndicator.tsx`, `features/admin/screens/AdminCaseScreen.tsx`, `features/admin/services/*` |
| Member B-Izzy | CP-501 Request form, CP-502 Accept/decline, CP-504 Handover code, CP-505 Return code | `features/listings/screens/ItemDetailScreen.tsx` (request form only), `features/dashboard/components/IncomingRequestsSection.tsx`, `features/orders/components/{RespondToRequestActions,HandoverCodeAction,ReturnCodeAction}.tsx`, `features/orders/screens/{HandoverCode,ReturnCode,ReportDamage}Screen.tsx`, the CP-501 / 502 / 504 / 505 functions in `ordersService.ts` |

Every stub file starts with an `OWNER:` comment naming its ticket, the HTML
screens to match, and where it plugs in. Replace the `SlotPlaceholder` in your
stub with the real UI.

## Shared files: change only your own part

- `navigation/types.ts` and `navigation/index.tsx`: all Sprint 3 routes are already registered. Need a new route? Add one line, and tell the group.
- `shared/types.ts`, `shared/components/*`, `theme`: do not change in a feature branch. Ask Danielo, or open a separate small PR into `sprint-3`.
- `ordersService.ts`: edit only the functions marked with your ticket. Do not change another ticket's function signature.
- `ProfileScreen.tsx`: Danielo only. It renders `DashboardSwitch` and `LenderDashboard`; Member A edits those component files instead.

## How the pieces connect

- `OrderDetail` is one screen for every order state and both viewpoints. It shows
  the right action slot by status and role:
  Requested + Lender → accept/decline (CP-502); Confirmed → handover code (CP-504);
  Active/Overdue → return code (CP-505); Requested/Confirmed → cancel (CP-503).
- Open it with `navigation.navigate('OrderDetail', { orderId: 'o2' })`.
- Mock orders in `ordersService.ts` (use mock mode: `EXPO_PUBLIC_USE_MOCK=true`):
  o1 Requested, o2 Confirmed, o3 Active, o4 Overdue, o5 Completed, o6 Declined (all Borrower);
  o7 Requested, o8 Confirmed, o9 Active (all Lender).
- The Lender dashboard renders `IncomingRequestsSection` (Member B's file). Cards in
  it open `OrderDetail` with `role: 'Lender'`.
- Overdue and Unreturned labels use `OverdueIndicator` (Member A) on both dashboards.

## Rules (from CLAUDE.md)

Theme tokens only, reuse shared components, no hardcoded data or axios in screens,
variants are state of one screen, status UI uses `StatusBadge`, PHP (₱) display only.
