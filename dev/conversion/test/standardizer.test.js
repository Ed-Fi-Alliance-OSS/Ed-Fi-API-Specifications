// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const { standardize } = require('../src/standardizer');

function freshDoc() {
  return {
    openapi: '3.0.4',
    info: {
      title: 'Ed-Fi Operational Data Store API',
      description: 'generic app description',
      version: '3',
    },
    servers: [{ url: 'https://api.ed-fi.org:443/v7.3.2/api/data/v3' }],
    paths: {},
    components: {},
  };
}

test('standardize sets resources title/version/description and removes servers', () => {
  const doc = freshDoc();
  standardize(doc, { kind: 'resources', version: '6.1.0' });

  expect(Object.prototype.hasOwnProperty.call(doc, 'servers')).toBe(false);
  expect(doc.info.title).toBe('Ed-Fi Resource API (6.1)');
  expect(doc.info.version).toBe('6.1.0');
  expect(doc.info.description).toBe(
    'The Ed-Fi Resources API enables applications to read and write education data stored in an Ed-Fi-compatible application through a secure REST interface.'
  );
});

test('standardize sets descriptors title/version/description (plural title) and removes servers', () => {
  const doc = freshDoc();
  standardize(doc, { kind: 'descriptors', version: '6.1.0' });

  expect(Object.prototype.hasOwnProperty.call(doc, 'servers')).toBe(false);
  expect(doc.info.title).toBe('Ed-Fi Descriptors API (6.1)');
  expect(doc.info.version).toBe('6.1.0');
  expect(doc.info.description).toBe(
    'The Ed-Fi Descriptors API supports reading and modifying descriptors (enumeration sets) in an Ed-Fi API application.'
  );
});

test('standardize rejects an invalid kind', () => {
  const doc = freshDoc();
  expect(() => standardize(doc, { kind: 'bogus', version: '6.1.0' })).toThrow();
});

test('standardize rejects a malformed version', () => {
  const doc = freshDoc();
  expect(() => standardize(doc, { kind: 'resources', version: '6.1' })).toThrow();
});
