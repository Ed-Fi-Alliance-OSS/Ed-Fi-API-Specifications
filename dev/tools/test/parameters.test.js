'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { hoistParameters } = require('../src/optimizer/parameters');
const { canonicalKey } = require('../src/optimizer/shape');

function loadFixture() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'parameters-hoist.json'), 'utf8')
  );
}

test('hoists a single-shape parameter repeated several times into one shared component', () => {
  const doc = loadFixture();
  const report = hoistParameters(doc, { minHoistCount: 3 });

  const useSnapshot = report.hoisted.find((p) => p.name === 'Use-Snapshot' && p.in === 'header');
  assert.ok(useSnapshot);
  assert.equal(useSnapshot.count, 4);
  assert.ok(doc.components.parameters['Use-Snapshot']);

  for (let i = 1; i <= 4; i += 1) {
    const params = doc.paths[`/ed-fi/snap${i}`].parameters;
    assert.deepEqual(params[0], { $ref: "#/components/parameters/Use-Snapshot" });
  }
});

test('id as a path parameter and id as a query parameter get distinct component names and are never merged', () => {
  const doc = loadFixture();
  const report = hoistParameters(doc, { minHoistCount: 3 });

  const idPath = report.hoisted.find((p) => p.name === 'id' && p.in === 'path');
  const idQuery = report.hoisted.find((p) => p.in === 'query' && p.count === 3 && /id/i.test(p.name));
  assert.ok(idPath, 'expected id/path to be hoisted');
  assert.ok(idQuery, 'expected id/query to be hoisted under a distinct name');
  assert.notEqual(idPath.name, idQuery.name);

  assert.deepEqual(doc.components.parameters[idPath.name], {
    name: 'id',
    in: 'path',
    required: true,
    description: 'A resource identifier that uniquely identifies the resource.',
    schema: { type: 'string' },
  });
  assert.deepEqual(doc.components.parameters[idQuery.name], {
    name: 'id',
    in: 'query',
    description: '',
    schema: { type: 'string' },
  });

  for (let i = 1; i <= 3; i += 1) {
    assert.deepEqual(doc.paths[`/ed-fi/items${i}/{id}`].parameters[0], {
      $ref: `#/components/parameters/${idPath.name}`,
    });
    assert.deepEqual(doc.paths[`/ed-fi/itemsById${i}`].get.parameters[0], {
      $ref: `#/components/parameters/${idQuery.name}`,
    });
  }
});

test('If-Match with 2 shapes cleanly partitioned by method (put vs delete) hoists both under method-qualified names', () => {
  const doc = loadFixture();
  const report = hoistParameters(doc, { minHoistCount: 3 });

  const putEntry = report.hoisted.find((p) => p.name === 'IfMatchPut');
  const deleteEntry = report.hoisted.find((p) => p.name === 'IfMatchDelete');
  assert.ok(putEntry, 'expected IfMatchPut to be hoisted');
  assert.ok(deleteEntry, 'expected IfMatchDelete to be hoisted');
  assert.equal(putEntry.count, 3);
  assert.equal(deleteEntry.count, 3);
  assert.equal(putEntry.method, 'put');
  assert.equal(deleteEntry.method, 'delete');

  assert.match(doc.components.parameters.IfMatchPut.description, /PUT/);
  assert.match(doc.components.parameters.IfMatchDelete.description, /DELETE/);

  // Never merged into a single "If-Match" component.
  assert.equal(doc.components.parameters['If-Match'], undefined);

  for (let i = 1; i <= 3; i += 1) {
    assert.deepEqual(doc.paths[`/ed-fi/matched${i}`].put.parameters[0], {
      $ref: '#/components/parameters/IfMatchPut',
    });
    assert.deepEqual(doc.paths[`/ed-fi/matched${i}`].delete.parameters[0], {
      $ref: '#/components/parameters/IfMatchDelete',
    });
  }
});

test('SAFETY RULE: a (name, in) pair with 3+ distinct shapes is never hoisted and stays fully inline', () => {
  const doc = loadFixture();
  const originalShapesByPath = {};
  for (const p of ['resourceA1', 'resourceA2', 'resourceA3', 'resourceB1', 'resourceB2', 'resourceB3', 'resourceC1', 'resourceC2', 'resourceC3']) {
    originalShapesByPath[p] = JSON.parse(
      JSON.stringify(doc.paths[`/ed-fi/${p}`].get.parameters[0])
    );
  }

  const report = hoistParameters(doc, { minHoistCount: 3 });

  // (a) no new component created for educationOrganizationId
  assert.equal(doc.components.parameters.educationOrganizationId, undefined);
  assert.equal(
    Object.keys(doc.components.parameters).some((k) => /educationOrganizationId/i.test(k)),
    false
  );

  // (b) every occurrence remains fully inline and deep-equal to the original input
  for (const [p, original] of Object.entries(originalShapesByPath)) {
    const current = doc.paths[`/ed-fi/${p}`].get.parameters[0];
    assert.deepEqual(current, original);
    assert.equal(Object.prototype.hasOwnProperty.call(current, '$ref'), false);
  }

  // (c) reported as skipped-ambiguous with the correct shape count and occurrence count
  const ambiguous = report.ambiguous.find((a) => a.name === 'educationOrganizationId' && a.in === 'query');
  assert.ok(ambiguous, 'expected educationOrganizationId/query to be reported as ambiguous');
  assert.equal(ambiguous.shapeCount, 3);
  assert.equal(ambiguous.totalCount, 9);
});

test('a 2-shape group that does NOT cleanly partition by method falls through to the general safety rule', () => {
  const doc = loadFixture();
  const report = hoistParameters(doc, { minHoistCount: 3 });

  assert.equal(doc.components.parameters['Snapshot-Identifier'], undefined);
  assert.equal(
    Object.keys(doc.components.parameters).filter((k) => k.startsWith('SnapshotIdentifier')).length,
    0
  );

  const ambiguous = report.ambiguous.find(
    (a) => a.name === 'Snapshot-Identifier' && a.in === 'header'
  );
  assert.ok(ambiguous, 'expected Snapshot-Identifier/header to be reported as ambiguous');
  assert.equal(ambiguous.shapeCount, 2);

  // Left fully inline everywhere.
  for (let i = 1; i <= 3; i += 1) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(doc.paths[`/ed-fi/notclean${i}`].put.parameters[0], '$ref'),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(doc.paths[`/ed-fi/notclean${i}`].delete.parameters[0], '$ref'),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(doc.paths[`/ed-fi/notcleanB${i}`].put.parameters[0], '$ref'),
      false
    );
  }
});

test('leaves a single-shape group inline when below minHoistCount and reports it', () => {
  const doc = {
    openapi: '3.0.4',
    info: {},
    paths: {
      '/a': { get: { parameters: [{ name: 'foo', in: 'query', schema: { type: 'string' } }], responses: {} } },
      '/b': { get: { parameters: [{ name: 'foo', in: 'query', schema: { type: 'string' } }], responses: {} } },
    },
    components: {},
  };

  const report = hoistParameters(doc, { minHoistCount: 3 });
  assert.equal(report.hoisted.length, 0);
  assert.equal(report.belowThreshold.length, 1);
  assert.equal(report.belowThreshold[0].count, 2);
  assert.equal(doc.components.parameters.foo, undefined);
});

test('reuses an existing identically-shaped parameter component instead of creating a duplicate', () => {
  const doc = loadFixture();
  const shape = doc.paths['/ed-fi/snap1'].parameters[0];
  doc.components.parameters.PreExistingSnapshotFlag = JSON.parse(JSON.stringify(shape));

  const report = hoistParameters(doc, { minHoistCount: 3 });
  const useSnapshot = report.hoisted.find((p) => p.in === 'header' && p.count === 4);
  assert.equal(useSnapshot.name, 'PreExistingSnapshotFlag');
  assert.equal(useSnapshot.reused, true);
  assert.equal(doc.components.parameters['Use-Snapshot'], undefined);
});

test('canonicalKey sanity: differing maxLength/description produce different shapes', () => {
  const a = { name: 'x', in: 'query', description: 'd1', schema: { type: 'string', maxLength: 20 } };
  const b = { name: 'x', in: 'query', description: 'd1', schema: { type: 'string', maxLength: 32 } };
  assert.notEqual(canonicalKey(a), canonicalKey(b));
});
