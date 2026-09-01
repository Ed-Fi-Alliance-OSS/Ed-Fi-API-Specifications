'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
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
  assert.equal(code, 0);
  assert.equal(fs.existsSync(outPath), false);
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
  assert.equal(code, 1);
  assert.ok(stderr.some((s) => /already exists/.test(s)));
  assert.equal(fs.readFileSync(outPath, 'utf8'), 'placeholder');
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
  assert.equal(code, 0);
  const written = fs.readFileSync(outPath, 'utf8');
  assert.match(written, /SPDX-License-Identifier/);
  assert.doesNotMatch(written, /placeholder/);
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
  assert.equal(code, 2);
  assert.ok(stderr.some((s) => /Swagger 2\.0/.test(s)));
  assert.equal(fs.existsSync(outPath), false);
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
  assert.equal(code, 1);
  assert.ok(stderr.some((s) => /not found/.test(s)));
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
  assert.equal(code, 0);
  assert.ok(stdout.join('\n').includes('openapi-build report'));
  assert.ok(fs.existsSync(outPath));
});
