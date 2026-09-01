'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { assertOpenApi3 } = require('../src/validator');
const { InputFormatError } = require('../src/errors');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));
}

test('assertOpenApi3 accepts a minimal valid OpenAPI 3 document', () => {
  const doc = loadFixture('minimal.json');
  assert.doesNotThrow(() => assertOpenApi3(doc));
});

test('assertOpenApi3 rejects Swagger 2.0 with a distinct, mentioning message', () => {
  const doc = loadFixture('swagger2.json');
  assert.throws(
    () => assertOpenApi3(doc),
    (err) => {
      assert.ok(err instanceof InputFormatError);
      assert.match(err.message, /Swagger 2\.0/);
      return true;
    }
  );
});

test('assertOpenApi3 rejects a document missing both openapi and swagger keys with a different message', () => {
  const doc = loadFixture('no-version-key.json');
  assert.throws(
    () => assertOpenApi3(doc),
    (err) => {
      assert.ok(err instanceof InputFormatError);
      assert.doesNotMatch(err.message, /Swagger 2\.0/);
      assert.match(err.message, /openapi/);
      return true;
    }
  );
});

test('assertOpenApi3 rejects a document missing a required top-level key', () => {
  const doc = { openapi: '3.0.4', info: {}, paths: {} }; // missing components
  assert.throws(
    () => assertOpenApi3(doc),
    (err) => {
      assert.ok(err instanceof InputFormatError);
      assert.match(err.message, /components/);
      return true;
    }
  );
});
