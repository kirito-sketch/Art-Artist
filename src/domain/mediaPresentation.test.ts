import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { Media } from '../data/types';
import { deliveredMedia, MEDIA_PRESETS, mediaPresentation, postFrame, sourceOnly, withFraming } from './mediaPresentation';
const image = (ratio: number, contentType: Media['contentType'] = 'photo'): Media => ({ id: 'source', kind: 'image', src: 'original.jpg', width: ratio * 1000, height: 1000, contentType, focal: { x: 80,y: 20 } });
const ratios = [4,16/9,3/2,4/3,1,4/5,3/4,.3,9/16];
test('natural posts and bounded extremes preserve the source composition', () => {
  for (const r of ratios) {
    const m = image(r), frame = postFrame([m]);
    assert.equal(frame, Math.max(.75,Math.min(1.91,r)));
    assert.equal(mediaPresentation(m,'post',frame).fit, r < .75 || r > 1.91 ? 'contain' : 'cover');
    assert.equal(m.src,'original.jpg');
  }
});
test('destination crops are isolated, originals immutable, posters contained on public surfaces', () => {
  const original = image(16/9), snapshot = JSON.stringify(original);
  const framed = withFraming(original,'post',{ fit:'cover',focal:{x:10,y:90} });
  assert.equal(JSON.stringify(original),snapshot);
  assert.equal(mediaPresentation(framed,'post').position,'10% 90%');
  assert.equal(mediaPresentation(framed,'discover-bento').position,'80% 20%');
  assert.equal(mediaPresentation(framed,'profile-hero').position,'80% 20%');
  assert.equal(mediaPresentation(framed,'original').fit,'contain');
  assert.equal(sourceOnly(framed).presentations,undefined);
  for (const surface of Object.keys(MEDIA_PRESETS) as (keyof typeof MEDIA_PRESETS)[]) {
    if (surface === 'avatar') continue;
    assert.equal(mediaPresentation(image(2/3,'artwork'),surface).fit,'contain',surface);
  }
});
test('carousel frame does not change with active slide; mixed slides fit by default', () => {
  const slides = ratios.map(r=>image(r));
  for (const mode of ['original','portrait','square','landscape'] as const) {
    const frame = postFrame(slides,mode);
    for (const slide of slides) assert.equal(mediaPresentation(slide,'post',frame).ratio,frame);
    assert.equal(postFrame(slides,mode),frame);
  }
});
test('genuine vertical video keeps its native frame without changing image limits', () => {
  const video: Media = { ...image(9 / 16), kind: 'video', src: 'video/vertical.mp4' };
  assert.equal(postFrame([video]), 9 / 16);
  assert.equal(postFrame([{ ...video, width: 400, height: 500 }]), 4 / 5);
  assert.equal(postFrame([image(9 / 16)]), 3 / 4);
  assert.equal(postFrame([{ ...video, src: 'poster.jpg' }]), 3 / 4);
  assert.equal(postFrame([video, image(16 / 9)]), 9 / 16);
  assert.equal(postFrame([image(16 / 9), video]), 16 / 9);
  assert.equal(postFrame([video], 'square'), 1);
  assert.equal(mediaPresentation(video, 'post', postFrame([video])).fit, 'cover');
});
test('artwork and unknown geometry preserve composition on Bento and other previews', () => {
  const unknown: Media = { id:'unknown',kind:'image',src:'unknown.jpg' };
  for (const surface of ['discover-bento','post','portfolio-thumbnail','project-hero','event-card','credit-card','spotlight'] as const) assert.equal(mediaPresentation(unknown,surface).fit,'contain');
});
test('missing poster delivery is classified by the actual fallback, not the absent poster', () => {
  const poster: Media = { ...image(2/3,'artwork'), src:'images/posters/missing.jpg', fallback:'images/covers/neela.jpg' };
  const actual = deliveredMedia(poster,poster.fallback!);
  assert.equal(mediaPresentation(poster,'credit-card').fit,'contain');
  assert.equal(mediaPresentation(actual,'credit-card').fit,'cover');
  assert.equal(poster.src,'images/posters/missing.jpg');
});
