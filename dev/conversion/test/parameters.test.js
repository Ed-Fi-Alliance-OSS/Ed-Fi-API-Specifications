'use strict';

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
  expect(useSnapshot).toBeTruthy();
  expect(useSnapshot.count).toBe(4);
  expect(doc.components.parameters['Use-Snapshot']).toBeTruthy();

  for (let i = 1; i <= 4; i += 1) {
    const params = doc.paths[`/ed-fi/snap${i}`].parameters;
    expect(params[0]).toStrictEqual({ $ref: '#/components/parameters/Use-Snapshot' });
  }
});

test('id as a path parameter and id as a query parameter get distinct component names and are never merged', () => {
  const doc = loadFixture();
  const report = hoistParameters(doc, { minHoistCount: 3 });

  const idPath = report.hoisted.find((p) => p.name === 'id' && p.in === 'path');
  const idQuery = report.hoisted.find((p) => p.in === 'query' && p.count === 3 && /id/i.test(p.name));
  expect(idPath).toBeTruthy();
  expect(idQuery).toBeTruthy();
  expect(idPath.name).not.toBe(idQuery.name);

  expect(doc.components.parameters[idPath.name]).toStrictEqual({
    name: 'id',
    in: 'path',
    required: true,
    description: 'A resource identifier that uniquely identifies the resource.',
    schema: { type: 'string' },
  });
  expect(doc.components.parameters[idQuery.name]).toStrictEqual({
    name: 'id',
    in: 'query',
    description: '',
    schema: { type: 'string' },
  });

  for (let i = 1; i <= 3; i += 1) {
    expect(doc.paths[`/ed-fi/items${i}/{id}`].parameters[0]).toStrictEqual({
      $ref: `#/components/parameters/${idPath.name}`,
    });
    expect(doc.paths[`/ed-fi/itemsById${i}`].get.parameters[0]).toStrictEqual({
      $ref: `#/components/parameters/${idQuery.name}`,
    });
  }
});

test('If-Match with 2 shapes cleanly partitioned by method (put vs delete) hoists both under method-qualified names', () => {
  const doc = loadFixture();
  const report = hoistParameters(doc, { minHoistCount: 3 });

  const putEntry = report.hoisted.find((p) => p.name === 'IfMatchPut');
  const deleteEntry = report.hoisted.find((p) => p.name === 'IfMatchDelete');
  expect(putEntry).toBeTruthy();
  expect(deleteEntry).toBeTruthy();
  expect(putEntry.count).toBe(3);
  expect(deleteEntry.count).toBe(3);
  expect(putEntry.method).toBe('put');
  expect(deleteEntry.method).toBe('delete');

  expect(doc.components.parameters.IfMatchPut.description).toMatch(/PUT/);
  expect(doc.components.parameters.IfMatchDelete.description).toMatch(/DELETE/);

  // Never merged into a single "If-Match" component.
  expect(doc.components.parameters['If-Match']).toBeUndefined();

  for (let i = 1; i <= 3; i += 1) {
    expect(doc.paths[`/ed-fi/matched${i}`].put.parameters[0]).toStrictEqual({
      $ref: '#/components/parameters/IfMatchPut',
    });
    expect(doc.paths[`/ed-fi/matched${i}`].delete.parameters[0]).toStrictEqual({
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
  expect(doc.components.parameters.educationOrganizationId).toBeUndefined();
  expect(
    Object.keys(doc.components.parameters).some((k) => /educationOrganizationId/i.test(k))
  ).toBe(false);

  // (b) every occurrence remains fully inline and deep-equal to the original input
  for (const [p, original] of Object.entries(originalShapesByPath)) {
    const current = doc.paths[`/ed-fi/${p}`].get.parameters[0];
    expect(current).toStrictEqual(original);
    expect(Object.prototype.hasOwnProperty.call(current, '$ref')).toBe(false);
  }

  // (c) reported as skipped-ambiguous with the correct shape count and occurrence count
  const ambiguous = report.ambiguous.find((a) => a.name === 'educationOrganizationId' && a.in === 'query');
  expect(ambiguous).toBeTruthy();
  expect(ambiguous.shapeCount).toBe(3);
  expect(ambiguous.totalCount).toBe(9);
});

test('a 2-shape group that does NOT cleanly partition by method falls through to the general safety rule', () => {
  const doc = loadFixture();
  const report = hoistParameters(doc, { minHoistCount: 3 });

  expect(doc.components.parameters['Snapshot-Identifier']).toBeUndefined();
  expect(
    Object.keys(doc.components.parameters).filter((k) => k.startsWith('SnapshotIdentifier')).length
  ).toBe(0);

  const ambiguous = report.ambiguous.find(
    (a) => a.name === 'Snapshot-Identifier' && a.in === 'header'
  );
  expect(ambiguous).toBeTruthy();
  expect(ambiguous.shapeCount).toBe(2);

  // Left fully inline everywhere.
  for (let i = 1; i <= 3; i += 1) {
    expect(
      Object.prototype.hasOwnProperty.call(doc.paths[`/ed-fi/notclean${i}`].put.parameters[0], '$ref')
    ).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(doc.paths[`/ed-fi/notclean${i}`].delete.parameters[0], '$ref')
    ).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(doc.paths[`/ed-fi/notcleanB${i}`].put.parameters[0], '$ref')
    ).toBe(false);
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
  expect(report.hoisted.length).toBe(0);
  expect(report.belowThreshold.length).toBe(1);
  expect(report.belowThreshold[0].count).toBe(2);
  expect(doc.components.parameters.foo).toBeUndefined();
});

test('reuses an existing identically-shaped parameter component instead of creating a duplicate', () => {
  const doc = loadFixture();
  const shape = doc.paths['/ed-fi/snap1'].parameters[0];
  doc.components.parameters = { PreExistingSnapshotFlag: JSON.parse(JSON.stringify(shape)) };

  const report = hoistParameters(doc, { minHoistCount: 3 });
  const useSnapshot = report.hoisted.find((p) => p.in === 'header' && p.count === 4);
  expect(useSnapshot.name).toBe('PreExistingSnapshotFlag');
  expect(useSnapshot.reused).toBe(true);
  expect(doc.components.parameters['Use-Snapshot']).toBeUndefined();
});

test('canonicalKey sanity: differing maxLength/description produce different shapes', () => {
  const a = { name: 'x', in: 'query', description: 'd1', schema: { type: 'string', maxLength: 20 } };
  const b = { name: 'x', in: 'query', description: 'd1', schema: { type: 'string', maxLength: 32 } };
  expect(canonicalKey(a)).not.toBe(canonicalKey(b));
});
