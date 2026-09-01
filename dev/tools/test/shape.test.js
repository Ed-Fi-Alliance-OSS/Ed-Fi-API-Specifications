'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { canonicalKey, findReusableComponentName } = require('../src/optimizer/shape');

test('canonicalKey is key-order independent for objects', () => {
  const a = { b: 1, a: 2, c: { y: 1, x: 2 } };
  const b = { a: 2, c: { x: 2, y: 1 }, b: 1 };
  assert.equal(canonicalKey(a), canonicalKey(b));
});

test('canonicalKey preserves array order', () => {
  const a = { required: ['x', 'y'] };
  const b = { required: ['y', 'x'] };
  assert.notEqual(canonicalKey(a), canonicalKey(b));
});

test('canonicalKey distinguishes differing primitive values', () => {
  assert.notEqual(canonicalKey({ maxLength: 20 }), canonicalKey({ maxLength: 32 }));
});

test('findReusableComponentName finds a name with a matching canonical shape', () => {
  const components = {
    Foo: { description: 'x' },
    Bar: { description: 'y' },
  };
  const name = findReusableComponentName(components, canonicalKey({ description: 'y' }));
  assert.equal(name, 'Bar');
});

test('findReusableComponentName returns null when nothing matches', () => {
  const components = { Foo: { description: 'x' } };
  const name = findReusableComponentName(components, canonicalKey({ description: 'z' }));
  assert.equal(name, null);
});
