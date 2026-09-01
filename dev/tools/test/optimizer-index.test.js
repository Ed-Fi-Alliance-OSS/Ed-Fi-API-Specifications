'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { optimize } = require('../src/optimizer');

test('optimize does not mutate the input document (pure function)', () => {
  const original = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'responses-hoist.json'), 'utf8')
  );
  const originalCopy = JSON.parse(JSON.stringify(original));

  const { doc, report } = optimize(original, { minHoistCount: 3 });

  assert.deepEqual(original, originalCopy, 'input document must be unchanged');
  assert.notEqual(doc, original, 'returned doc must be a different object');
  assert.ok(report.responses.hoisted.length > 0);
  assert.ok(report.sizeBytes.before > 0);
  assert.ok(report.sizeBytes.after > 0);
});

test('optimize merges responses and parameters reports plus a size comparison', () => {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'parameters-hoist.json'), 'utf8')
  );
  const { report } = optimize(doc, { minHoistCount: 3 });
  assert.ok('responses' in report);
  assert.ok('parameters' in report);
  assert.ok('sizeBytes' in report);
});
