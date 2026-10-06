import { videoLink, videoDuration } from '../../src/domain/showreel.js';

export type ReelMetadata = { title: string; thumbnail?: string; duration?: string };

/** Public oEmbed only, from fixed provider endpoints. Never fetch an arbitrary pasted host or embed HTML. */
export async function reelMetadata(raw: string): Promise<ReelMetadata> {
  const link = videoLink(raw);
  if (!link) throw new Error('unsupported_link');
  const endpoint = link.source.provider === 'youtube' ? 'https://www.youtube.com/oembed' : 'https://vimeo.com/api/oembed.json';
  const url = new URL(endpoint);
  url.searchParams.set('url', link.url);
  url.searchParams.set('format', 'json');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('metadata_unavailable');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('metadata_unavailable');
  let text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      text += decoder.decode(part.value, { stream: true });
      if (text.length > 65536) throw new Error('metadata_too_large');
    }
  } finally { await reader.cancel(); }
  const data = JSON.parse(text) as Record<string, unknown>;
  const thumbnail = typeof data.thumbnail_url === 'string' && /^https:\/\//.test(data.thumbnail_url) ? data.thumbnail_url : undefined;
  return { title: typeof data.title === 'string' ? data.title.slice(0, 200) : 'Showreel', ...(thumbnail ? { thumbnail } : {}), ...(typeof data.duration === 'number' && Number.isFinite(data.duration) ? { duration: videoDuration(data.duration) } : {}) };
}
