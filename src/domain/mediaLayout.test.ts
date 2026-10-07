import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { bentoPattern, mediaFit, mediaPosition, mediaRatio } from './mediaLayout';
import type { Media } from '../data/types';
const media = (width: number, height: number, contentType: Media['contentType'] = 'photo'): Media => ({ id: `${width}-${height}`, kind: 'image', src: 'fixture.svg', width, height, contentType });
test('portrait placement follows image shape without reordering results', () => {
  const wide = media(1920,1080), portrait = media(600,1200,'portrait');
  assert.deepEqual(bentoPattern([wide,portrait,wide],0), { kind:'portrait-left', feature:1 });
  assert.deepEqual(bentoPattern([wide,wide,portrait],1), { kind:'portrait-right', feature:2 });
  assert.equal(bentoPattern([wide,wide,wide],0).kind,'wide');
  assert.equal(bentoPattern([portrait,portrait,wide],0).kind,'portrait-pair');
  assert.equal(bentoPattern([media(800,800),wide,wide],0).kind,'balanced');
});
test('complete artwork, focal photography and missing metadata have deliberate fallbacks', () => {
  assert.equal(mediaFit(media(600,900,'artwork')),'contain');
  assert.equal(mediaFit(media(1920,1080)),'cover');
  assert.equal(mediaPosition(media(600,900,'portrait')),'50% 25%');
  assert.equal(mediaPosition(media(900,900), { x:-20,y:140 }),'0% 100%');
  assert.equal(mediaPosition(media(900,900), { x:NaN,y:Infinity }),'50% 50%');
  assert.equal(mediaRatio({id:'unknown',kind:'image',src:'upload.jpg'}),1);
  assert.ok(!bentoPattern([undefined],0).kind.includes('portrait'));
});
