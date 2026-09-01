'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');

const { toYaml, LICENSE_HEADER } = require('../src/emitter');

test('toYaml prepends the exact 4-line license header', () => {
  const output = toYaml({ openapi: '3.0.4' });
  assert.ok(output.startsWith(LICENSE_HEADER));
  const headerLines = LICENSE_HEADER.trimEnd().split('\n');
  assert.equal(headerLines.length, 4);
  assert.equal(headerLines[0], '# SPDX-License-Identifier: Apache-2.0');
  assert.equal(headerLines[1], '# Licensed to the Ed-Fi Alliance under one or more agreements.');
  assert.equal(
    headerLines[2],
    '# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.'
  );
  assert.equal(
    headerLines[3],
    '# See the LICENSE and NOTICES files in the project root for more information.'
  );
});

test('toYaml output round-trips back to a deep-equal document', () => {
  const doc = {
    openapi: '3.0.4',
    info: { title: 'Ed-Fi Resource API (6.1)', version: '6.1.0', description: 'x' },
    paths: {
      '/ed-fi/things': {
        get: {
          parameters: [{ $ref: '#/components/parameters/offset' }],
          responses: { 200: { description: 'ok', content: {} } },
        },
      },
    },
    components: {
      parameters: {
        offset: { name: 'offset', in: 'query', schema: { type: 'integer' } },
      },
    },
  };

  const output = toYaml(doc);
  const roundTripped = yaml.load(output);
  assert.deepEqual(roundTripped, doc);
});

test('a $ref string renders single-quoted', () => {
  const doc = {
    paths: {
      '/x': { get: { parameters: [{ $ref: '#/components/parameters/offset' }] } },
    },
  };
  const output = toYaml(doc);
  assert.match(output, /\$ref: '#\/components\/parameters\/offset'/);
});
