import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profileHeroCrop, protectedHeroFrame } from './profileHeroCrop';

test('wide work keeps left and right focal subjects inside a phone crop', () => {
  const image = { width: 1920, height: 800 }, viewport = { width: 393, height: 852 };
  for (const x of [15, 85]) {
    const crop = profileHeroCrop(image, viewport, { x, y: 25 });
    const scale = viewport.height / image.height;
    const subjectX = image.width * scale * x / 100 - (image.width * scale - viewport.width) * crop.x / 100;
    assert.ok(Math.abs(subjectX - viewport.width / 2) < 1);
    assert.equal(crop.y, 50);
  }
});
test('a tall image moves the focal subject into the clear upper region when possible', () => {
  const image = { width: 600, height: 2000 }, viewport = { width: 393, height: 852 };
  const crop = profileHeroCrop(image, viewport, { x: 50, y: 40 });
  const scale = viewport.width / image.width;
  const subjectY = image.height * scale * .4 - (image.height * scale - viewport.height) * crop.y / 100;
  assert.ok(Math.abs(subjectY - viewport.height * .28) < 1);
});
test('invalid dimensions and extreme focal positions cannot uncover image edges', () => {
  assert.deepEqual(profileHeroCrop({ width: 0, height: 0 }, { width: 393, height: 852 }, { x: 50, y: 50 }), { x: 50, y: 25 });
  for (const focus of [{ x: -200, y: 400 }, { x: NaN, y: Infinity }]) {
    const crop = profileHeroCrop({ width: 400, height: 1800 }, { width: 320, height: 568 }, focus);
    assert.ok([crop.x, crop.y].every(n => Number.isFinite(n) && n >= 0 && n <= 100));
  }
});

test('short-screen framing protects the declared eyes-to-mouth region without uncovering image edges', () => {
  for (const [width, height, safeBottom] of [[320, 568, 281], [393, 852, 527], [430, 932, 600]]) {
    const frame = protectedHeroFrame({ width: 480, height: 600 }, { width, height }, { x: 50, y: 53 }, safeBottom, 26)!;
    assert.equal(frame.protected, true);
    assert.ok(frame.y + frame.height * .4 >= Math.min(64, height * .1) - .5);
    assert.ok(frame.y + frame.height * .66 <= safeBottom + .5);
    assert.ok(frame.x <= 0 && frame.y <= 0);
    assert.ok(frame.x + frame.width >= width && frame.y + frame.height >= height);
  }
});

test('an impossible protected region stays bounded and honestly reports the limitation', () => {
  const frame = protectedHeroFrame({ width: 500, height: 600 }, { width: 320, height: 568 }, { x: 50, y: 99 }, 200, 40)!;
  assert.equal(frame.protected, false);
  assert.ok(Number.isFinite(frame.y));
  assert.ok(frame.y <= 0 && frame.y + frame.height >= 568);
});
