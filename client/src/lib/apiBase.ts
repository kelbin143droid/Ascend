import { Capacitor } from "@capacitor/core";

/**
 * Resolve the absolute base URL for backend API calls.
 *
 * Web (Replit dev/prod):  empty string -> relative URLs hit the same Express server.
 * Native (Android via Capacitor): must hit a fully-qualified URL because the WebView
 * is loaded from a `capacitor://` / `https://localhost` origin and has no Express
 * server attached to it.
 *
 * Set `VITE_API_BASE_URL` (e.g. https://ascend.example.com) at build time for
 * the mobile bundle.
 */
export const API_BASE: string = (() => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, "");
  if (Capacitor.isNativePlatform()) {
    console.warn(
      "[apiBase] Running on native but VITE_API_BASE_URL is not set; API calls will fail.",
    );
  }
  return "";
})();

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * On native platforms, install a one-time global fetch wrapper that rewrites
 * any relative `/api/...` URL to the configured backend.
 *
 * This is the safety net for the many call sites in the app that use the raw
 * `fetch()` directly (rather than going through `apiRequest`/`getQueryFn`).
 * In the browser this is a no-op, so existing web behavior is unchanged.
 */
let nativeFetchInstalled = false;
export function installNativeFetchBase(): void {
  if (nativeFetchInstalled) return;
  if (!Capacitor.isNativePlatform()) return;
  if (!API_BASE) return;
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;

  const originalFetch = window.fetch.bind(window);
  nativeFetchInstalled = true;

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === "string") {
        if (input.startsWith("/")) {
          return originalFetch(`${API_BASE}${input}`, init);
        }
      } else if (input instanceof URL) {
        // Absolute URL — leave alone.
      } else if (input && typeof (input as Request).url === "string") {
        const req = input as Request;
        if (req.url.startsWith("/")) {
          return originalFetch(new Request(`${API_BASE}${req.url}`, req), init);
        }
      }
    } catch (err) {
      console.warn("[apiBase] fetch wrapper failed, falling back", err);
    }
    return originalFetch(input as RequestInfo, init);
  }) as typeof fetch;
}
