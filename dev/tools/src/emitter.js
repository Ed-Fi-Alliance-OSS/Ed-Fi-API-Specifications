'use strict';

const yaml = require('js-yaml');

const LICENSE_HEADER = `# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.
`;

const DEFAULT_DUMP_OPTIONS = {
  lineWidth: 80,
  noRefs: true,
  quotingType: "'",
  forceQuotes: false,
};

/**
 * Serializes `doc` to YAML, prepended with the standard Ed-Fi Alliance
 * license header, using house-style-approximating js-yaml dump options.
 * Byte-for-byte parity with hand-edited files is not a goal.
 *
 * @param {object} doc
 * @param {object} [opts] additional/overriding js-yaml dump options
 * @returns {string}
 */
function stripTrailingWhitespace(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n');
}

function toYaml(doc, opts = {}) {
  const body = yaml.dump(doc, { ...DEFAULT_DUMP_OPTIONS, ...opts });
  return stripTrailingWhitespace(`${LICENSE_HEADER}\n${body}`);
}

module.exports = { toYaml, LICENSE_HEADER, DEFAULT_DUMP_OPTIONS };
