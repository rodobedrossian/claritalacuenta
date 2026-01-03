import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for push notifications
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log("[PWA] New content available, refresh to update");
    },
    onOfflineReady() {
      console.log("[PWA] App ready to work offline");
    },
    onRegisteredSW(swUrl, registration) {
      console.log("[PWA] Service Worker registered:", swUrl);
      if (registration) {
        console.log("[PWA] Registration scope:", registration.scope);
        console.log("[PWA] SW state:", registration.active?.state);
      }
    },
    onRegisterError(error) {
      console.error("[PWA] Service Worker registration error:", error);
      // Fallback: try direct registration
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => console.log("[PWA] Fallback registration success:", reg.scope))
        .catch(err => console.error("[PWA] Fallback registration failed:", err));
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
