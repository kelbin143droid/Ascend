import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.soloquest.app",
  appName: "Solo Quest RPG",
  webDir: "dist/public",
  bundledWebRuntime: false,
  // Load the live Replit deployment directly so UI updates show up on the
  // phone without rebuilding the APK. Anything you ship to
  // solo-quest-rpg.replit.app is picked up on the next app launch.
  server: {
    url: "https://solo-quest-rpg.replit.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#0ea5e9",
    },
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#0b1020",
      showSpinner: false,
    },
  },
};

export default config;
