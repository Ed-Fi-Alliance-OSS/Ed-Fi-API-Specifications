'use strict';

const fs = require('fs');
const path = require('path');

const { assertOpenApi3 } = require('../src/validator');
const { InputFormatError } = require('../src/errors');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));
}

function captureError(fn) {
  try {
    fn();
    return undefined;
  } catch (err) {
    return err;
  }
}

test('assertOpenApi3 accepts a minimal valid OpenAPI 3 document', () => {
  const doc = loadFixture('minimal.json');
  expect(() => assertOpenApi3(doc)).not.toThrow();
});

test('assertOpenApi3 rejects Swagger 2.0 with a distinct, mentioning message', () => {
  const doc = loadFixture('swagger2.json');
  const err = captureError(() => assertOpenApi3(doc));
  expect(err).toBeInstanceOf(InputFormatError);
  expect(err.message).toMatch(/Swagger 2\.0/);
});

test('assertOpenApi3 rejects a document missing both openapi and swagger keys with a different message', () => {
  const doc = loadFixture('no-version-key.json');
  const err = captureError(() => assertOpenApi3(doc));
  expect(err).toBeInstanceOf(InputFormatError);
  expect(err.message).not.toMatch(/Swagger 2\.0/);
  expect(err.message).toMatch(/openapi/);
});

test('assertOpenApi3 rejects a document missing a required top-level key', () => {
  const doc = { openapi: '3.0.4', info: {} }; // missing paths
  const err = captureError(() => assertOpenApi3(doc));
  expect(err).toBeInstanceOf(InputFormatError);
  expect(err.message).toMatch(/paths/);
});

test('assertOpenApi3 accepts a document with no top-level components key', () => {
  // `components` is optional per the OpenAPI 3 spec; the optimizer hoisters
  // initialize it when absent.
  const doc = { openapi: '3.0.4', info: {}, paths: {} };
  expect(() => assertOpenApi3(doc)).not.toThrow();
});
