export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

export function renderRichText(value: string): string {
  const escaped = escapeHtml(value);
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function parseVerbs(raw: string): string[] {
  return raw
    .split(/[,|\n]/)
    .map((verb) => verb.trim().toLowerCase())
    .filter((verb, index, list) => verb.length > 0 && list.indexOf(verb) === index);
}
