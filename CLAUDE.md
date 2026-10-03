# BRB Client rules (for any AI tool)
Stack: Expo + React Native + TypeScript, React Navigation. Backend: Django REST (JWT).

1. Colors, spacing, radii, text styles come ONLY from `src/theme`. No raw hex or magic numbers in screens.
2. Reuse `src/shared/components` before creating anything. Need something new? Add it to shared in a separate small PR.
3. Never copy the Figma frame size (430x932). Use flex, `ScreenContainer` (safe area) and percentages.
4. Screens never hardcode data or call axios directly. Use `src/features/<area>/services/*` (mock/real switch via EXPO_PUBLIC_USE_MOCK).
5. Variants (error, empty, locked, blocked) are props/state of ONE screen, not separate files.
6. Status UI must use `StatusBadge` (color + icon + label). Never color alone.
7. Currency is PHP (₱). Payment happens outside the app; show it as a note only.
8. File layout: `src/features/<area>/{screens,components,services}`. PascalCase components, camelCase functions.
9. Follow the SRS rules for behavior (codes single-use/expiring/lockout, blocked actions, etc.).
10. Never commit secrets or real user data. Repo is public.
