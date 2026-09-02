// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

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
  expect(methodNotAllowed).toBeTruthy();
  expect(methodNotAllowed.count).toBe(4);

  const componentName = methodNotAllowed.name;
  expect(doc.components.responses[componentName]).toBeTruthy();
  expect(doc.components.responses[componentName].description).toMatch(/Method Is Not Allowed/);

  for (let i = 1; i <= 4; i += 1) {
    const resp = doc.paths[`/ed-fi/thing${i}`].put.responses['405'];
    expect(resp).toStrictEqual({ $ref: `#/components/responses/${componentName}` });
  }
});

test('never touches 200 responses, even when structurally coincidental with a hoisted shape', () => {
  const doc = loadFixture();
  hoistResponses(doc, { minHoistCount: 3 });

  const coincidence = doc.paths['/ed-fi/coincidence'].get.responses['200'];
  expect(coincidence.description).toBe(
    'Method Is Not Allowed. When the Use-Snapshot header is set to true, the method is not allowed.'
  );
  expect(Object.prototype.hasOwnProperty.call(coincidence, '$ref')).toBe(false);

  for (let i = 1; i <= 4; i += 1) {
    const resp200 = doc.paths[`/ed-fi/thing${i}`].put.responses['200'];
    expect(Object.prototype.hasOwnProperty.call(resp200, '$ref')).toBe(false);
  }
});

test('leaves a repeated shape inline when it is below minHoistCount, and reports it', () => {
  const doc = loadFixture();
  const report = hoistResponses(doc, { minHoistCount: 3 });

  const belowThreshold = report.belowThreshold.find((r) => r.statusCode === '410');
  expect(belowThreshold).toBeTruthy();
  expect(belowThreshold.count).toBe(2);

  for (let i = 1; i <= 2; i += 1) {
    const resp = doc.paths[`/ed-fi/gone${i}`].get.responses['410'];
    expect(Object.prototype.hasOwnProperty.call(resp, '$ref')).toBe(false);
    expect(resp.description).toMatch(/Gone/);
  }
});

test('hoists two distinct shapes at the same status code under two distinct component names', () => {
  const doc = loadFixture();
  const report = hoistResponses(doc, { minHoistCount: 3 });

  const fourOhFours = report.hoisted.filter((r) => r.statusCode === '404');
  expect(fourOhFours.length).toBe(2);

  const names = fourOhFours.map((r) => r.name).sort();
  expect(new Set(names).size).toBe(2);

  const generic = fourOhFours.find((r) => !/Snapshot/i.test(r.name));
  const snapshot = fourOhFours.find((r) => /Snapshot/i.test(r.name));
  expect(generic && snapshot).toBeTruthy();
  expect(generic.name).toBe('NotFound');
  expect(snapshot.name).toBe('NotFoundUseSnapshot');

  for (let i = 1; i <= 3; i += 1) {
    expect(doc.paths[`/ed-fi/generic${i}`].delete.responses['404']).toStrictEqual({
      $ref: `#/components/responses/${generic.name}`,
    });
    expect(doc.paths[`/ed-fi/snapshotted${i}`].delete.responses['404']).toStrictEqual({
      $ref: `#/components/responses/${snapshot.name}`,
    });
  }
});

test('naming is stable regardless of discovery order: a snapshot-specific shape never claims the plain status name', () => {
  const genericShape = { description: 'The resource could not be found.' };
  const snapshotShape = {
    description:
      'The resource could not be found. If Use-Snapshot header is set to true, this response can indicate the snapshot may have been removed.',
  };

  function makeDoc(order) {
    const paths = {};
    for (let i = 1; i <= 3; i += 1) {
      paths[`/ed-fi/${order[0]}${i}`] = {
        delete: { responses: { 404: JSON.parse(JSON.stringify(order[0] === 'generic' ? genericShape : snapshotShape)) } },
      };
      paths[`/ed-fi/${order[1]}${i}`] = {
        delete: { responses: { 404: JSON.parse(JSON.stringify(order[1] === 'generic' ? genericShape : snapshotShape)) } },
      };
    }
    return { openapi: '3.0.4', info: {}, paths, components: {} };
  }

  const genericFirst = hoistResponses(makeDoc(['generic', 'snapshotted']), { minHoistCount: 3 });
  const snapshotFirst = hoistResponses(makeDoc(['snapshotted', 'generic']), { minHoistCount: 3 });

  for (const report of [genericFirst, snapshotFirst]) {
    const fourOhFours = report.hoisted.filter((r) => r.statusCode === '404');
    const generic = fourOhFours.find((r) => !/Snapshot/i.test(r.name));
    const snapshot = fourOhFours.find((r) => /Snapshot/i.test(r.name));
    expect(generic.name).toBe('NotFound');
    expect(snapshot.name).toBe('NotFoundUseSnapshot');
  }
});

test('reuses an existing identically-shaped component instead of creating a duplicate', () => {
  const doc = loadFixture();
  doc.components.responses = {
    PreExisting: {
      description: 'Method Is Not Allowed. When the Use-Snapshot header is set to true, the method is not allowed.',
    },
  };

  const report = hoistResponses(doc, { minHoistCount: 3 });
  const methodNotAllowed = report.hoisted.find((r) => r.statusCode === '405');
  expect(methodNotAllowed.name).toBe('PreExisting');
  expect(methodNotAllowed.reused).toBe(true);
  expect(doc.components.responses.MethodNotAllowed).toBeUndefined();
});
