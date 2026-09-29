/** Shared HTML helpers for outbound guest emails. */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function guestGreeting(guestName?: string | null): string {
  const name = guestName?.trim();
  return name ? `Hello ${name},` : "Hello,";
}
