'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { hoistResponses } = require('../src/optimizer/responses');

function loadFixture() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'responses-hoist.json'), 'utf8')
  );
}

test('hoists an inline response body repeated >= minHoistCount times, replacing all occurrences with $ref', () => {
  const doc = loadFixture();
  const report = hoistResponses(doc, { minHoistCount: 3 });

  const methodNotAllowed = report.hoisted.find((r) => r.statusCode === '405');
  assert.ok(methodNotAllowed, 'expected a hoisted 405 entry');
  assert.equal(methodNotAllowed.count, 4);

  const componentName = methodNotAllowed.name;
  assert.ok(doc.components.responses[componentName]);
  assert.match(
    doc.components.responses[componentName].description,
    /Method Is Not Allowed/
  );

  for (let i = 1; i <= 4; i += 1) {
    const resp = doc.paths[`/ed-fi/thing${i}`].put.responses['405'];
    assert.deepEqual(resp, { $ref: `#/components/responses/${componentName}` });
  }
});

test('never touches 200 responses, even when structurally coincidental with a hoisted shape', () => {
  const doc = loadFixture();
  hoistResponses(doc, { minHoistCount: 3 });

  const coincidence = doc.paths['/ed-fi/coincidence'].get.responses['200'];
  assert.equal(
    coincidence.description,
    'Method Is Not Allowed. When the Use-Snapshot header is set to true, the method is not allowed.'
  );
  assert.equal(Object.prototype.hasOwnProperty.call(coincidence, '$ref'), false);

  for (let i = 1; i <= 4; i += 1) {
    const resp200 = doc.paths[`/ed-fi/thing${i}`].put.responses['200'];
    assert.equal(Object.prototype.hasOwnProperty.call(resp200, '$ref'), false);
  }
});

test('leaves a repeated shape inline when it is below minHoistCount, and reports it', () => {
  const doc = loadFixture();
  const report = hoistResponses(doc, { minHoistCount: 3 });

  const belowThreshold = report.belowThreshold.find((r) => r.statusCode === '410');
  assert.ok(belowThreshold, 'expected 410 to be reported as left inline');
  assert.equal(belowThreshold.count, 2);

  for (let i = 1; i <= 2; i += 1) {
    const resp = doc.paths[`/ed-fi/gone${i}`].get.responses['410'];
    assert.equal(Object.prototype.hasOwnProperty.call(resp, '$ref'), false);
    assert.match(resp.description, /Gone/);
  }
});

test('hoists two distinct shapes at the same status code under two distinct component names', () => {
  const doc = loadFixture();
  const report = hoistResponses(doc, { minHoistCount: 3 });

  const fourOhFours = report.hoisted.filter((r) => r.statusCode === '404');
  assert.equal(fourOhFours.length, 2);

  const names = fourOhFours.map((r) => r.name).sort();
  assert.equal(new Set(names).size, 2, 'expected two distinct component names');

  const generic = fourOhFours.find((r) => !/Snapshot/i.test(r.name));
  const snapshot = fourOhFours.find((r) => /Snapshot/i.test(r.name));
  assert.ok(generic && snapshot, 'expected one generic and one snapshot-qualified 404 name');
  assert.equal(generic.name, 'NotFound');
  assert.equal(snapshot.name, 'NotFoundUseSnapshot');

  for (let i = 1; i <= 3; i += 1) {
    assert.deepEqual(doc.paths[`/ed-fi/generic${i}`].delete.responses['404'], {
      $ref: `#/components/responses/${generic.name}`,
    });
    assert.deepEqual(doc.paths[`/ed-fi/snapshotted${i}`].delete.responses['404'], {
      $ref: `#/components/responses/${snapshot.name}`,
    });
  }
});

test('reuses an existing identically-shaped component instead of creating a duplicate', () => {
  const doc = loadFixture();
  doc.components.responses.PreExisting = {
    description: 'Method Is Not Allowed. When the Use-Snapshot header is set to true, the method is not allowed.',
  };

  const report = hoistResponses(doc, { minHoistCount: 3 });
  const methodNotAllowed = report.hoisted.find((r) => r.statusCode === '405');
  assert.equal(methodNotAllowed.name, 'PreExisting');
  assert.equal(methodNotAllowed.reused, true);
  assert.equal(doc.components.responses.MethodNotAllowed, undefined);
});
