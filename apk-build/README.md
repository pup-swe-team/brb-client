# Android APK Build (`eas.json` + EAS Configuration)

All EAS/APK-specific configuration is archived in this folder so the repository root stays clean while keeping Android packaging repeatable.

- `brb-client/app.json` stays at the repository root (required by Expo & Render) and already contains `expo.android.package` (`com.copup.brbclient`) and `expo.extra.eas.projectId`.
- Root `eas.json` is excluded via `.gitignore` (`/eas.json`), while this reference copy (`apk-build/eas.json`) is tracked and configured for `CoPUP_Server` (`https://copup-apk-server.onrender.com/api/v1`).

## Building an Android APK

From `brb-client/`:

```powershell
Copy-Item apk-build/eas.json eas.json -Force
npx eas-cli build -p android --profile preview
```
