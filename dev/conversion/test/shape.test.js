// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const { canonicalKey, findReusableComponentName } = require('../src/optimizer/shape');

test('canonicalKey is key-order independent for objects', () => {
  const a = { b: 1, a: 2, c: { y: 1, x: 2 } };
  const b = { a: 2, c: { x: 2, y: 1 }, b: 1 };
  expect(canonicalKey(a)).toBe(canonicalKey(b));
});

test('canonicalKey preserves array order', () => {
  const a = { required: ['x', 'y'] };
  const b = { required: ['y', 'x'] };
  expect(canonicalKey(a)).not.toBe(canonicalKey(b));
});

test('canonicalKey distinguishes differing primitive values', () => {
  expect(canonicalKey({ maxLength: 20 })).not.toBe(canonicalKey({ maxLength: 32 }));
});

test('findReusableComponentName finds a name with a matching canonical shape', () => {
  const components = {
    Foo: { description: 'x' },
    Bar: { description: 'y' },
  };
  const name = findReusableComponentName(components, canonicalKey({ description: 'y' }));
  expect(name).toBe('Bar');
});

test('findReusableComponentName returns null when nothing matches', () => {
  const components = { Foo: { description: 'x' } };
  const name = findReusableComponentName(components, canonicalKey({ description: 'z' }));
  expect(name).toBe(null);
});
