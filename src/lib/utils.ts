import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes a filename for use in storage keys.
 * Removes diacritics, special characters, and spaces to prevent InvalidKey errors.
 */
export function sanitizeFilename(filename: string): string {
  // Get the extension
  const lastDot = filename.lastIndexOf(".");
  const ext = lastDot > 0 ? filename.slice(lastDot).toLowerCase() : "";
  const name = lastDot > 0 ? filename.slice(0, lastDot) : filename;

  // Normalize Unicode and remove diacritics
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Convert to lowercase and replace invalid characters with underscores
  const sanitized = normalized
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_|_$/g, ""); // Trim leading/trailing underscores

  // Truncate to reasonable length (80 chars max for name)
  const truncated = sanitized.slice(0, 80);

  return truncated + ext;
}
