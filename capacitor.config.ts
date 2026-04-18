import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ascendos.app",
  appName: "Ascend OS",
  webDir: "dist/public",
  bundledWebRuntime: false,
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
