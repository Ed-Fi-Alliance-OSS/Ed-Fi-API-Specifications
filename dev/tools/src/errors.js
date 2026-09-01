'use strict';

/**
 * Thrown when the input document is not a shape this tool can process
 * (e.g. Swagger 2.0, missing required top-level keys, malformed version).
 */
class InputFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputFormatError';
  }
}

/**
 * Thrown for CLI usage problems: bad flags, missing files, output already
 * exists without --force, etc.
 */
class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

module.exports = { InputFormatError, UsageError };
