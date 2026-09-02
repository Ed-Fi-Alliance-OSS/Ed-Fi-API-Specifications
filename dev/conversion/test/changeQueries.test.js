// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const { stripChangeQueries } = require('../src/changeQueries');

function baseDoc() {
  return {
    openapi: '3.0.4',
    info: {},
    paths: {
      '/ed-fi/academicWeeks': {
        get: {
          parameters: [
            { $ref: '#/components/parameters/offset' },
            { $ref: '#/components/parameters/MinChangeVersion' },
            { $ref: '#/components/parameters/MaxChangeVersion' },
            {
              name: 'Use-Snapshot',
              in: 'header',
              description: 'Indicates if the configured Snapshot should be used.',
              schema: { type: 'boolean', default: false },
            },
          ],
          responses: {
            200: { description: 'ok' },
            404: { $ref: '#/components/responses/NotFoundUseSnapshot' },
          },
        },
      },
      '/ed-fi/academicWeeks/{id}': {
        parameters: [{ $ref: '#/components/parameters/Use-Snapshot' }],
        get: {
          responses: {
            404: { $ref: '#/components/responses/NotFoundUseSnapshot' },
          },
        },
      },
      '/ed-fi/academicWeeks/deletes': {
        get: { parameters: [{ $ref: '#/components/parameters/MinChangeVersion' }], responses: {} },
      },
      '/ed-fi/academicWeeks/keyChanges': {
        get: { parameters: [{ $ref: '#/components/parameters/MinChangeVersion' }], responses: {} },
      },
    },
    components: {
      parameters: { MinChangeVersion: {}, MaxChangeVersion: {} },
      responses: { NotFound: { description: 'not found' }, NotFoundUseSnapshot: { description: 'snapshot' } },
      schemas: {
        edFi_academicWeek: { type: 'object', properties: { weekIdentifier: { type: 'string' } } },
        trackedChanges_edFi_academicWeekKey: { type: 'object', properties: { id: { type: 'string' } } },
        trackedChanges_edFi_academicWeekDelete: {
          allOf: [{ $ref: '#/components/schemas/trackedChanges_edFi_academicWeekKey' }],
        },
        trackedChanges_edFi_academicWeekKeyChange: {
          allOf: [{ $ref: '#/components/schemas/trackedChanges_edFi_academicWeekKey' }],
        },
      },
    },
  };
}

test('removes MinChangeVersion, MaxChangeVersion, and Use-Snapshot parameter entries', () => {
  const { doc } = stripChangeQueries(baseDoc());

  expect(doc.paths['/ed-fi/academicWeeks'].get.parameters).toStrictEqual([
    { $ref: '#/components/parameters/offset' },
  ]);
  expect(doc.paths['/ed-fi/academicWeeks/{id}'].parameters).toStrictEqual([]);
});

test('replaces NotFoundUseSnapshot response refs with NotFound', () => {
  const { doc } = stripChangeQueries(baseDoc());

  expect(doc.paths['/ed-fi/academicWeeks'].get.responses['404']).toStrictEqual({
    $ref: '#/components/responses/NotFound',
  });
  expect(doc.paths['/ed-fi/academicWeeks/{id}'].get.responses['404']).toStrictEqual({
    $ref: '#/components/responses/NotFound',
  });
});

test('removes /deletes and /keyChanges path items entirely', () => {
  const { doc } = stripChangeQueries(baseDoc());

  expect(doc.paths['/ed-fi/academicWeeks/deletes']).toBeUndefined();
  expect(doc.paths['/ed-fi/academicWeeks/keyChanges']).toBeUndefined();
  expect(Object.keys(doc.paths)).toStrictEqual([
    '/ed-fi/academicWeeks',
    '/ed-fi/academicWeeks/{id}',
  ]);
});

test('removes the now-unreferenced MinChangeVersion/MaxChangeVersion/NotFoundUseSnapshot component definitions', () => {
  const { doc } = stripChangeQueries(baseDoc());

  expect(doc.components.parameters.MinChangeVersion).toBeUndefined();
  expect(doc.components.parameters.MaxChangeVersion).toBeUndefined();
  expect(doc.components.responses.NotFoundUseSnapshot).toBeUndefined();
});

test('leaves unrelated component definitions untouched', () => {
  const { doc } = stripChangeQueries(baseDoc());

  expect(doc.components.responses.NotFound).toBeTruthy();
  expect(doc.components.schemas.edFi_academicWeek).toBeTruthy();
});

test('removes all trackedChanges_* schemas', () => {
  const { doc } = stripChangeQueries(baseDoc());

  expect(doc.components.schemas.trackedChanges_edFi_academicWeekKey).toBeUndefined();
  expect(doc.components.schemas.trackedChanges_edFi_academicWeekDelete).toBeUndefined();
  expect(doc.components.schemas.trackedChanges_edFi_academicWeekKeyChange).toBeUndefined();
  expect(Object.keys(doc.components.schemas)).toStrictEqual(['edFi_academicWeek']);
});

test('reports what was removed/replaced', () => {
  const { report } = stripChangeQueries(baseDoc());

  expect(report.pathsRemoved).toStrictEqual([
    '/ed-fi/academicWeeks/deletes',
    '/ed-fi/academicWeeks/keyChanges',
  ]);
  expect(report.parametersRemoved).toBe(4);
  expect(report.responsesReplaced).toBe(2);
  expect(report.schemasRemoved.sort()).toStrictEqual([
    'trackedChanges_edFi_academicWeekDelete',
    'trackedChanges_edFi_academicWeekKey',
    'trackedChanges_edFi_academicWeekKeyChange',
  ]);
});

test('is a no-op on a doc with no Change Queries surface', () => {
  const doc = {
    openapi: '3.0.4',
    info: {},
    paths: {
      '/ed-fi/schools': { get: { parameters: [{ $ref: '#/components/parameters/offset' }], responses: { 200: {} } } },
    },
    components: { schemas: { edFi_school: { type: 'object' } } },
  };

  const { doc: result, report } = stripChangeQueries(doc);

  expect(result.paths['/ed-fi/schools'].get.parameters).toStrictEqual([
    { $ref: '#/components/parameters/offset' },
  ]);
  expect(result.components.schemas.edFi_school).toBeTruthy();
  expect(report).toStrictEqual({
    pathsRemoved: [],
    schemasRemoved: [],
    parametersRemoved: 0,
    responsesReplaced: 0,
  });
});
