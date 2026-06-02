// Light normalization. Odesli's API resolves short links (spotify.link, etc.)
// and per-service URL variants on its own, so all we do here is validate that
// the input parses as an http(s) URL and return a canonical string.
export function normalizeLink(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}
