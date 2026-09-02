'use strict';

const fs = require('fs');
const path = require('path');

const { optimize } = require('../src/optimizer');

test('optimize does not mutate the input document (pure function)', () => {
  const original = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'responses-hoist.json'), 'utf8')
  );
  const originalCopy = JSON.parse(JSON.stringify(original));

  const { doc, report } = optimize(original, { minHoistCount: 3 });

  expect(original).toStrictEqual(originalCopy);
  expect(doc).not.toBe(original);
  expect(report.responses.hoisted.length).toBeGreaterThan(0);
  expect(report.sizeBytes.before).toBeGreaterThan(0);
  expect(report.sizeBytes.after).toBeGreaterThan(0);
});

test('optimize merges responses and parameters reports plus a size comparison', () => {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'parameters-hoist.json'), 'utf8')
  );
  const { report } = optimize(doc, { minHoistCount: 3 });
  expect('responses' in report).toBe(true);
  expect('parameters' in report).toBe(true);
  expect('sizeBytes' in report).toBe(true);
});
