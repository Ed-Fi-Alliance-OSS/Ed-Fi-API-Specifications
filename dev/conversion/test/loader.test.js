// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { loadDocument } = require('../src/loader');
const { InputFormatError } = require('../src/errors');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test('loads and parses a valid JSON file', async () => {
  const doc = await loadDocument(path.join(FIXTURES_DIR, 'minimal.json'));
  expect(doc.openapi).toBe('3.0.4');
});

test('throws InputFormatError (not a plain Error) for malformed JSON', async () => {
  const badFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'loader-test-')), 'bad.json');
  fs.writeFileSync(badFile, '{ this is not valid json');

  await expect(loadDocument(badFile)).rejects.toBeInstanceOf(InputFormatError);
  await expect(loadDocument(badFile)).rejects.toThrow(/Unable to parse input file/);
});

test('throws InputFormatError (not a plain Error) when the file cannot be read', async () => {
  const missingFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'loader-test-')), 'does-not-exist.json');

  await expect(loadDocument(missingFile)).rejects.toBeInstanceOf(InputFormatError);
  await expect(loadDocument(missingFile)).rejects.toThrow(/Unable to read input file/);
});
