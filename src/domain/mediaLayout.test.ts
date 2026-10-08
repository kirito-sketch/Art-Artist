import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mediaFit, mediaPosition, mediaRatio } from './mediaLayout';
import type { Media } from '../data/types';
const media = (width: number, height: number, contentType: Media['contentType'] = 'photo'): Media => ({ id: `${width}-${height}`, kind: 'image', src: 'fixture.svg', width, height, contentType });
test('complete artwork, focal photography and missing metadata have deliberate fallbacks', () => {
  assert.equal(mediaFit(media(600,900,'artwork')),'contain');
  assert.equal(mediaFit(media(1920,1080)),'cover');
  assert.equal(mediaPosition(media(600,900,'portrait')),'50% 25%');
  assert.equal(mediaPosition(media(900,900), { x:-20,y:140 }),'0% 100%');
  assert.equal(mediaPosition(media(900,900), { x:NaN,y:Infinity }),'50% 50%');
  assert.equal(mediaRatio({id:'unknown',kind:'image',src:'upload.jpg'}),1);
});
