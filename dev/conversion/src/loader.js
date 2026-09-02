// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const fs = require('fs/promises');

const { InputFormatError } = require('./errors');

/**
 * Reads a file and parses it as JSON, wrapping any failure in a clear,
 * path-qualified error message instead of a raw/cryptic fs or SyntaxError.
 * A malformed or unreadable input file is a user-input problem, not an
 * internal tool failure, so both failure modes throw InputFormatError
 * (see cli.js's exit-code mapping) rather than a plain Error.
 *
 * @param {string} filePath
 * @returns {Promise<object>}
 */
async function loadDocument(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    throw new InputFormatError(`Unable to read input file "${filePath}": ${err.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new InputFormatError(
      `Unable to parse input file "${filePath}" as JSON: ${err.message}`
    );
  }
}

module.exports = { loadDocument };
