// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { run } = require('../src/cli');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function makeIo() {
  const stdout = [];
  const stderr = [];
  return {
    io: {
      stdout: (s) => stdout.push(s),
      stderr: (s) => stderr.push(s),
    },
    stdout,
    stderr,
  };
}

function tmpOutPath(name) {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'openapi-build-test-')), name);
}

test('--dry-run does not write any file', async () => {
  const { io } = makeIo();
  const outPath = tmpOutPath('resources-api-6.1.yaml');
  const code = await run(
    [
      path.join(FIXTURES_DIR, 'minimal.json'),
      '--kind',
      'resources',
      '--data-standard-version',
      '6.1.0',
      '--out',
      outPath,
      '--dry-run',
    ],
    io
  );
  expect(code).toBe(0);
  expect(fs.existsSync(outPath)).toBe(false);
});

test('refuses to overwrite an existing output file without --force', async () => {
  const { io, stderr } = makeIo();
  const outPath = tmpOutPath('resources-api-6.1.yaml');
  fs.writeFileSync(outPath, 'placeholder');

  const code = await run(
    [
      path.join(FIXTURES_DIR, 'minimal.json'),
      '--kind',
      'resources',
      '--data-standard-version',
      '6.1.0',
      '--out',
      outPath,
    ],
    io
  );
  expect(code).toBe(1);
  expect(stderr.some((s) => /already exists/.test(s))).toBe(true);
  expect(fs.readFileSync(outPath, 'utf8')).toBe('placeholder');
});

test('overwrites an existing output file with --force', async () => {
  const { io } = makeIo();
  const outPath = tmpOutPath('resources-api-6.1.yaml');
  fs.writeFileSync(outPath, 'placeholder');

  const code = await run(
    [
      path.join(FIXTURES_DIR, 'minimal.json'),
      '--kind',
      'resources',
      '--data-standard-version',
      '6.1.0',
      '--out',
      outPath,
      '--force',
    ],
    io
  );
  expect(code).toBe(0);
  const written = fs.readFileSync(outPath, 'utf8');
  expect(written).toMatch(/SPDX-License-Identifier/);
  expect(written).not.toMatch(/placeholder/);
});

test('a Swagger 2.0 input produces exit code 2', async () => {
  const { io, stderr } = makeIo();
  const outPath = tmpOutPath('descriptor-api-6.1.yaml');
  const code = await run(
    [
      path.join(FIXTURES_DIR, 'swagger2.json'),
      '--kind',
      'descriptors',
      '--data-standard-version',
      '6.1.0',
      '--out',
      outPath,
    ],
    io
  );
  expect(code).toBe(2);
  expect(stderr.some((s) => /Swagger 2\.0/.test(s))).toBe(true);
  expect(fs.existsSync(outPath)).toBe(false);
});

test('a missing input file produces exit code 1', async () => {
  const { io, stderr } = makeIo();
  const code = await run(
    [
      path.join(FIXTURES_DIR, 'does-not-exist.json'),
      '--kind',
      'resources',
      '--data-standard-version',
      '6.1.0',
      '--out',
      tmpOutPath('x.yaml'),
    ],
    io
  );
  expect(code).toBe(1);
  expect(stderr.some((s) => /not found/.test(s))).toBe(true);
});

test('--verbose prints the report without crashing and a successful run writes valid content', async () => {
  const { io, stdout } = makeIo();
  const outPath = tmpOutPath('resources-api-6.1.yaml');
  const code = await run(
    [
      path.join(FIXTURES_DIR, 'responses-hoist.json'),
      '--kind',
      'resources',
      '--data-standard-version',
      '6.1.0',
      '--out',
      outPath,
      '--verbose',
    ],
    io
  );
  expect(code).toBe(0);
  expect(stdout.join('\n').includes('openapi-build report')).toBe(true);
  expect(fs.existsSync(outPath)).toBe(true);
});
