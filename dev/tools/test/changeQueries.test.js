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

test('leaves unrelated component definitions untouched', () => {
  const { doc } = stripChangeQueries(baseDoc());

  expect(doc.components.parameters.MinChangeVersion).toBeTruthy();
  expect(doc.components.parameters.MaxChangeVersion).toBeTruthy();
  expect(doc.components.responses.NotFoundUseSnapshot).toBeTruthy();
});

test('reports what was removed/replaced', () => {
  const { report } = stripChangeQueries(baseDoc());

  expect(report.pathsRemoved).toStrictEqual([
    '/ed-fi/academicWeeks/deletes',
    '/ed-fi/academicWeeks/keyChanges',
  ]);
  expect(report.parametersRemoved).toBe(4);
  expect(report.responsesReplaced).toBe(2);
});

test('is a no-op on a doc with no Change Queries surface', () => {
  const doc = {
    openapi: '3.0.4',
    info: {},
    paths: {
      '/ed-fi/schools': { get: { parameters: [{ $ref: '#/components/parameters/offset' }], responses: { 200: {} } } },
    },
    components: {},
  };

  const { doc: result, report } = stripChangeQueries(doc);

  expect(result.paths['/ed-fi/schools'].get.parameters).toStrictEqual([
    { $ref: '#/components/parameters/offset' },
  ]);
  expect(report).toStrictEqual({ pathsRemoved: [], parametersRemoved: 0, responsesReplaced: 0 });
});
