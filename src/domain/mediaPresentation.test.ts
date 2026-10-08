import { mediaRatio } from './mediaLayout';
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { Media } from '../data/types';
import { cardRatio, CARD_LANDSCAPE, CARD_PORTRAIT, deliveredMedia, MEDIA_PRESETS, mediaPresentation, postFrame, sourceOnly, withFraming } from './mediaPresentation';
const image = (ratio: number, contentType: Media['contentType'] = 'photo'): Media => ({ id: 'source', kind: 'image', src: 'original.jpg', width: ratio * 1000, height: 1000, contentType, focal: { x: 80,y: 20 } });
const ratios = [4,16/9,3/2,4/3,1,4/5,3/4,.3,9/16];
test('natural posts and bounded extremes preserve the source composition', () => {
  for (const r of ratios) {
    const m = image(r), frame = postFrame([m]);
    assert.equal(frame, Math.max(.75,Math.min(2.39,r)));
    assert.equal(mediaPresentation(m,'post',frame).fit, r < .75 || r > 2.39 ? 'contain' : 'cover');
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
  assert.equal(postFrame([image(16 / 9), video]), 1, 'a landscape image then a vertical video mixes orientations: square');
  assert.equal(postFrame([video], 'square'), 1);
  assert.equal(mediaPresentation(video, 'post', postFrame([video])).fit, 'cover');
});
test('unknown geometry preserves composition on previews; a Bento tile always fills its own shape', () => {
  const unknown: Media = { id:'unknown',kind:'image',src:'unknown.jpg' };
  for (const surface of ['post','portfolio-thumbnail','project-hero','event-card','credit-card','spotlight'] as const) assert.equal(mediaPresentation(unknown,surface).fit,'contain');
  assert.equal(mediaPresentation(unknown,'discover-bento').fit,'cover');
  assert.equal(mediaPresentation({ ...unknown, contentType: 'artwork' },'discover-bento').fit,'contain', 'typographic artwork is never cropped');
});
test('an undelivered seed still is measured by the fallback that is actually shown', () => {
  const still: Media = { id:'s',kind:'image',src:'images/stills/never-delivered.jpg',fallback:'images/covers/neela.jpg' };
  assert.ok(Math.abs(mediaRatio(still) - 500 / 245) < .001);
  assert.equal(mediaPresentation(still,'post').fit,'cover', 'a 2.04:1 still shows whole: no bands, no crop');
});
test("a video's poster keeps the video's geometry", () => {
  const video: Media = { id:'v',kind:'video',src:'video/x.mp4',poster:'images/posts/x-poster.jpg',width:400,height:500 };
  const shown = deliveredMedia(video, video.poster!);
  assert.equal(mediaRatio(shown), .8);
  assert.equal(mediaPresentation(shown,'discover-bento').fit,'cover');
});
test('missing poster delivery is classified by the actual fallback, not the absent poster', () => {
  const poster: Media = { ...image(2/3,'artwork'), src:'images/posters/missing.jpg', fallback:'images/covers/neela.jpg' };
  const actual = deliveredMedia(poster,poster.fallback!);
  assert.equal(mediaPresentation(poster,'credit-card').fit,'contain');
  assert.equal(mediaPresentation(actual,'credit-card').fit,'cover');
  assert.equal(poster.src,'images/posters/missing.jpg');
});

test('a set of cards takes one shape from its sources, never forcing landscape into portrait', () => {
  assert.equal(cardRatio([image(2.2), image(2), image(.8)]), CARD_LANDSCAPE);
  assert.equal(cardRatio([image(.8), image(.75), image(2)]), CARD_PORTRAIT);
  assert.equal(cardRatio([image(2/3,'artwork'), image(2/3,'artwork')]), CARD_PORTRAIT, 'posters stay portrait');
  assert.equal(cardRatio([]), CARD_PORTRAIT);
});

test('cards are shaped by what is shown: an undelivered poster shows its landscape fallback', () => {
  const poster: Media = { id:'p',kind:'image',src:'images/posters/never.jpg',fallback:'images/covers/neela.jpg' };
  assert.equal(cardRatio([poster, poster]), CARD_LANDSCAPE);
});

test('carousel frames: square for mixed orientations, least empty band otherwise; single images keep their own', () => {
  assert.equal(postFrame([image(.8), image(2.04), image(2.33)]), 1, 'portrait cover with wide stills: neutral square');
  assert.equal(postFrame([image(2.04), image(1.78), image(2.33)]), 2.04, 'all landscape: the least-band landscape shape');
  assert.equal(postFrame([image(.8), image(.75)]), .8, 'all portrait: the cover shape');
  assert.equal(postFrame([image(1.5)]), 1.5);
  assert.equal(postFrame([image(.8), image(2)], 'square'), 1, 'an explicit creator choice wins');
});
