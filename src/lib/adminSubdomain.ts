/**
 * Admin subdomain: when the app is served at admin.rucula.app (desktop),
 * admin routes are at / and /dashboard. On the main domain they stay at /admin and /admin/dashboard.
 * iOS app is unaffected and keeps using /admin and /admin/dashboard.
 */

const ADMIN_SUBDOMAIN_HOST =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_ADMIN_SUBDOMAIN) ||
  "admin.rucula.app";

export function isAdminSubdomain(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  // Support localhost for dev: ?adminSubdomain=1
  if (host === "localhost" || host === "127.0.0.1") {
    return new URLSearchParams(window.location.search).get("adminSubdomain") === "1";
  }
  return host === ADMIN_SUBDOMAIN_HOST;
}

/** Path to admin login (subdomain: "/", main: "/admin") */
export function getAdminLoginPath(): string {
  return isAdminSubdomain() ? "/" : "/admin";
}

/** Path to admin dashboard (subdomain: "/dashboard", main: "/admin/dashboard") */
export function getAdminDashboardPath(): string {
  return isAdminSubdomain() ? "/dashboard" : "/admin/dashboard";
}

export { ADMIN_SUBDOMAIN_HOST };
