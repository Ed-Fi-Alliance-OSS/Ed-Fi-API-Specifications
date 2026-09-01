'use strict';

const fs = require('fs/promises');

/**
 * Reads a file and parses it as JSON, wrapping any failure in a clear,
 * path-qualified error message instead of a raw/cryptic fs or SyntaxError.
 *
 * @param {string} filePath
 * @returns {Promise<object>}
 */
async function loadDocument(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Unable to read input file "${filePath}": ${err.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Unable to parse input file "${filePath}" as JSON: ${err.message}`
    );
  }
}

module.exports = { loadDocument };
