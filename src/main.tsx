import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for push notifications
const updateSW = registerSW({
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
    }
  },
  onRegisterError(error) {
    console.error("[PWA] Service Worker registration error:", error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
