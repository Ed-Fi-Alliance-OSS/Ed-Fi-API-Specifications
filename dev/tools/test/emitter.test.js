'use strict';

const yaml = require('js-yaml');

const { toYaml, LICENSE_HEADER } = require('../src/emitter');

test('toYaml prepends the exact 4-line license header', () => {
  const output = toYaml({ openapi: '3.0.4' });
  expect(output.startsWith(LICENSE_HEADER)).toBe(true);
  const headerLines = LICENSE_HEADER.trimEnd().split('\n');
  expect(headerLines.length).toBe(4);
  expect(headerLines[0]).toBe('# SPDX-License-Identifier: Apache-2.0');
  expect(headerLines[1]).toBe('# Licensed to the Ed-Fi Alliance under one or more agreements.');
  expect(headerLines[2]).toBe(
    '# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.'
  );
  expect(headerLines[3]).toBe(
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
  expect(roundTripped).toStrictEqual(doc);
});

test('a $ref string renders single-quoted', () => {
  const doc = {
    paths: {
      '/x': { get: { parameters: [{ $ref: '#/components/parameters/offset' }] } },
    },
  };
  const output = toYaml(doc);
  expect(output).toMatch(/\$ref: '#\/components\/parameters\/offset'/);
});

test('toYaml strips trailing whitespace left behind when js-yaml folds a description containing a double space', () => {
  // A double space inside a long description (a common data-quality artifact
  // in the raw ODS/API exports) can land exactly on a fold boundary, leaving
  // js-yaml's `>-` folded scalar with a trailing space on one wrapped line.
  const description =
    'The year, month and day on which the crisis affected the student. This date ' +
    'may not be the same as the date the crisis occurred if evacuation orders are ' +
    'implemented in anticipation of a crisis.  Note: Date interpretation may vary.';
  const doc = {
    paths: {
      '/ed-fi/crisisEvents': {
        get: {
          parameters: [{ name: 'crisisStartDate', in: 'query', description, schema: { type: 'string' } }],
        },
      },
    },
  };

  const output = toYaml(doc);

  expect(output).toMatch(/anticipation of a crisis\.$/m);
  for (const line of output.split('\n')) {
    expect(line).toBe(line.replace(/[ \t]+$/, ''));
  }
});
