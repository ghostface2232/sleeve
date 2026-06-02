import { Platform } from 'react-native';

// On web we route through a Cloudflare Worker proxy (added in step 6) to dodge
// CORS. The proxy convention is `${BASE}/?url=<encoded upstream URL>`. Native
// builds always call the upstream APIs directly.
const PROXY_BASE = (process.env.EXPO_PUBLIC_API_PROXY ?? '').replace(/\/+$/, '');

export async function proxiedFetch(targetUrl: string, init?: RequestInit): Promise<Response> {
  if (Platform.OS !== 'web' || !PROXY_BASE) {
    return fetch(targetUrl, init);
  }
  return fetch(`${PROXY_BASE}/?url=${encodeURIComponent(targetUrl)}`, init);
}
