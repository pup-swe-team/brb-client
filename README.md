# brb-client
BRB (Borrow, Return, Borrow) mobile app. Expo + React Native + TypeScript.

## Run
```
npm install
cp .env.example .env
npx expo start
```
Scan the QR with Expo Go. Open the **Component Gallery** from the Home tab to see every shared component.

## Branches
`main` (releases) <- `develop` <- `feature/<area>-<screen>` e.g. `feature/orders-handover-code`.
Open PRs into `develop`. Integrator merges.

## Structure
```
src/theme        design tokens (replace values from Figma Colors & Typography)
src/shared       components used by everyone
src/navigation   tabs + root stack (add routes in types.ts)
src/services     http client (axios + JWT)
src/features     one folder per area: screens/ components/ services/
```
Read `CLAUDE.md` before using an AI tool.
