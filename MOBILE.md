# Ascend OS — Android (Capacitor) Build Guide

This project ships a React + Vite frontend and an Express backend. The web
build is wrapped as a native Android app with [Capacitor](https://capacitorjs.com).

The web app and backend are unchanged. Capacitor only adds a native shell that
loads the same compiled frontend from `dist/public` and exposes native
capabilities (local notifications, etc.) through `@capacitor/core`.

---

## What's already wired up in the repo

| Concern | File |
|---|---|
| Capacitor config (appId, webDir, plugins) | `capacitor.config.ts` |
| Notification service & `scheduleTaskNotification()` | `client/src/lib/notificationService.ts` |
| API base URL resolver (web vs. native) | `client/src/lib/apiBase.ts` |
| API client (uses `apiUrl()`) | `client/src/lib/queryClient.ts` |
| Permission bootstrap on app start | `client/src/App.tsx` (`NativeBootstrap`) |
| Lazy-loaded heavy 3D pages | `client/src/App.tsx` (Game3D / Dungeon / Housing) |
| Env example for mobile builds | `.env.mobile.example` |

The web app continues to work exactly as before — `Capacitor.isNativePlatform()`
returns `false` in the browser, so notifications and native bootstrap are no-ops.

---

## One-time machine setup (do this on your local laptop, not in Replit)

Replit's Linux container does **not** ship the Android SDK or Android Studio,
so the native build must run on your own machine.

1. Install Android Studio — <https://developer.android.com/studio>
2. From Android Studio's SDK Manager, install:
   - Android SDK Platform 34 (or newer)
   - Android SDK Build-Tools 34+
   - Android SDK Command-line Tools
   - Android Emulator + a system image (e.g. Pixel 7, API 34)
3. Install JDK 17 (Android Studio bundles one; otherwise use `brew install --cask temurin@17`).
4. Set environment variables (add to `~/.zshrc` / `~/.bashrc`):

   ```bash
   export ANDROID_HOME="$HOME/Library/Android/sdk"     # macOS
   # export ANDROID_HOME="$HOME/Android/Sdk"           # Linux
   export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
   ```

---

## Add npm scripts to `package.json`

Open `package.json` and add these entries to the `"scripts"` block:

```jsonc
{
  "scripts": {
    "build:web":        "vite build",
    "cap:add:android":  "cap add android",
    "cap:sync":         "vite build && cap sync android",
    "cap:open:android": "cap open android",
    "android:dev":      "vite build && cap sync android && cap open android"
  }
}
```

> The repo only blocks programmatic edits to `package.json`; manual edits are
> fine. Add the scripts once and you're done.

---

## First-time Android project bootstrap (run locally, not in Replit)

```bash
# 1. Pull repo and install JS deps
git clone <your-repo>
cd <your-repo>
npm install

# 2. Set the backend URL the mobile bundle will hit
cp .env.mobile.example .env.production.local
# then edit .env.production.local to point VITE_API_BASE_URL at your live backend

# 3. Build the Vite frontend (writes to dist/public)
npm run build:web

# 4. Generate the Android project (only needed once)
npx cap add android

# 5. Copy the built web bundle into the Android project + sync plugins
npx cap sync android

# 6. Open in Android Studio
npx cap open android
```

In Android Studio, pick a device or emulator and press **Run ▶**. The first
build may take a few minutes while Gradle resolves dependencies.

---

## Day-to-day rebuild loop

After any frontend change:

```bash
npm run cap:sync          # vite build + cap sync android
npm run cap:open:android  # opens Android Studio (already-open is fine)
```

Or in one shot:

```bash
npm run android:dev
```

You don't have to recreate the Android project — just sync.

---

## Android 13+ notification permission

Capacitor's local-notifications plugin already declares the runtime
`POST_NOTIFICATIONS` permission, but you should verify after `npx cap add android`:

Open `android/app/src/main/AndroidManifest.xml` and confirm these are present
inside `<manifest>` (the plugin auto-adds them; this is just a sanity check):

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
```

The runtime prompt itself is triggered for you on app launch by
`initNotifications()` (called from `NativeBootstrap` in `client/src/App.tsx`).
On Android 13+ the OS will show its system permission sheet the first time;
older Android versions auto-grant.

> Notifications scheduled with `LocalNotifications.schedule()` survive the app
> being closed or the device being rebooted (the plugin uses `AlarmManager`
> with `RECEIVE_BOOT_COMPLETED`).

---

## Using `scheduleTaskNotification` from anywhere in the app

```ts
import { scheduleTaskNotification, cancelTaskNotification } from "@/lib/notificationService";

// Schedule a reminder for a daily ritual task at 7:00 AM tomorrow
const tomorrow7am = new Date();
tomorrow7am.setDate(tomorrow7am.getDate() + 1);
tomorrow7am.setHours(7, 0, 0, 0);

const result = await scheduleTaskNotification(
  "ritual-morning-breath",     // taskId — stable across calls; reused id replaces an existing scheduled notification
  "Morning Breath",            // title
  "2 minutes of calm breathing — let's open the day.", // body
  tomorrow7am,                 // dateTime
);

if (!result.scheduled) {
  console.log("Not scheduled:", result.reason);
  // result.reason: "not-native" | "no-permission" | "past-time" | "error"
}

// Cancel a scheduled notification later
await cancelTaskNotification("ritual-morning-breath");
```

In a browser (Replit dev preview, normal web) the function safely no-ops and
returns `{ scheduled: false, reason: "not-native" }`, so it is always safe to
call regardless of platform.

You can also listen for taps on a delivered notification:

```ts
useEffect(() => {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    console.log("notification tapped", detail);
  };
  window.addEventListener("ascend:notification-tap", handler);
  return () => window.removeEventListener("ascend:notification-tap", handler);
}, []);
```

---

## Backend URL strategy

The Express server stays exactly the same. The frontend now picks its base URL
in one place — `client/src/lib/apiBase.ts`:

- **Web (Replit / production web)**: `VITE_API_BASE_URL` is empty, so all API
  calls remain relative (`/api/...`) and hit the same Express server. Existing
  behavior is unchanged.
- **Mobile (Capacitor Android)**: set `VITE_API_BASE_URL` at build time
  (`.env.production.local`) to the absolute URL of your deployed backend. The
  WebView lives at `https://localhost`, so relative URLs would not reach
  Express.

Deploy your backend (Replit Deployments or anywhere else), then bake that URL
into the mobile build via the env var. No code changes needed.

---

## Performance notes already in place

- `Game3DPage`, `DungeonPage`, `HousingPage` (Three.js / R3F) are loaded with
  `React.lazy`, so the initial bundle the WebView parses on cold start is much
  smaller. They only download when the user navigates to them.
- `Suspense` shows a lightweight fallback while the chunk is fetched.
- The notification service is permission-cached, so requesting permission a
  second time is a no-op.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `cap: command not found` | `npx cap …` instead of `cap …`, or `npm i -g @capacitor/cli` |
| `Could not find Android SDK` in Android Studio | Set `ANDROID_HOME` and re-open the project |
| Notifications never fire on real device | Open Android Settings → App info → Notifications, confirm the channel is enabled. Check `await listPendingNotifications()` to verify schedule landed. |
| White screen on launch | Confirm `dist/public/index.html` exists before `cap sync`; rerun `npm run build:web` |
| API calls 404 in the app | `VITE_API_BASE_URL` was empty at build time. Set it and rebuild. |
