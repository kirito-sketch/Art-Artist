import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VIDEO_PILOT, videoEmbed, videoFileError, videoLink, videoMetadataError } from './showreel';
import { reelMetadata } from '../../server/media/metadata';

test('video URLs accept supported individual videos and preserve Vimeo unlisted hashes', () => {
  assert.equal(videoLink('https://youtu.be/abcdefghijk?t=30')?.url, 'https://www.youtube.com/watch?v=abcdefghijk');
  assert.equal(videoLink('https://www.youtube.com/shorts/abcdefghijk')?.source.videoId, 'abcdefghijk');
  const v = videoLink('https://vimeo.com/12345678/abcdef1234')!;
  assert.equal(videoEmbed(v.source, v.url), 'https://player.vimeo.com/video/12345678?h=abcdef1234');
  assert.equal(videoLink('https://vimeo.com/album/1234/video/5678')?.source.videoId, '5678');
});

test('video URLs reject arbitrary hosts, credentials, roots and active schemes', () => {
  for (const url of ['javascript:alert(1)', 'http://youtu.be/abcdefghijk', 'https://vimeo.com/', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'https://user:pass@vimeo.com/123', 'https://127.0.0.1/video', 'https://drive.google.com/file/123', 'https://youtu.be/short']) assert.equal(videoLink(url), null, url);
});

test('native preview pilot enforces files, duration and resolution, including portrait video', () => {
  assert.equal(videoFileError({ name: 'reel.mp4', type: 'video/mp4', size: VIDEO_PILOT.bytes }), null);
  assert.ok(videoFileError({ name: 'reel.mp4', type: 'video/mp4', size: VIDEO_PILOT.bytes + 1 }));
  assert.ok(videoFileError({ name: 'bad.html', type: 'video/mp4', size: 40 }));
  assert.ok(videoFileError({ name: 'reel.webm', type: 'video/webm', size: 0 }));
  assert.equal(videoMetadataError(180, 1080, 1920), null);
  assert.ok(videoMetadataError(181, 1920, 1080));
  assert.ok(videoMetadataError(60, 3840, 2160));
  assert.ok(videoMetadataError(Infinity, 1920, 1080));
});

test('metadata fetch uses fixed provider endpoints and returns data rather than embed HTML', async () => {
  const original = globalThis.fetch;
  let destination = '';
  globalThis.fetch = async (input, init) => {
    destination = String(input);
    assert.equal(init?.redirect, 'error');
    return new Response(JSON.stringify({ title: 'My work', thumbnail_url: 'https://i.vimeocdn.com/video/123.jpg', duration: 134, html: '<script>bad</script>' }));
  };
  try {
    assert.deepEqual(await reelMetadata('https://vimeo.com/12345'), { title: 'My work', thumbnail: 'https://i.vimeocdn.com/video/123.jpg', duration: '2:14' });
    assert.equal(new URL(destination).hostname, 'vimeo.com');
    await assert.rejects(() => reelMetadata('https://localhost:3000/private'));
  } finally { globalThis.fetch = original; }
});

test('metadata failure and oversized metadata are recoverable instead of inventing details', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 403 });
    await assert.rejects(() => reelMetadata('https://vimeo.com/12345'));
    globalThis.fetch = async () => new Response('x'.repeat(70000));
    await assert.rejects(() => reelMetadata('https://vimeo.com/12345'), /metadata_too_large/);
  } finally { globalThis.fetch = original; }
});
