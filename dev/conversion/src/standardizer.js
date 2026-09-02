// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const { UsageError } = require('./errors');

const VERSION_RE = /^\d+\.\d+\.\d+$/;

const DESCRIPTIONS = {
  resources:
    'The Ed-Fi Resources API enables applications to read and write education data stored in an Ed-Fi-compatible application through a secure REST interface.',
  descriptors:
    'The Ed-Fi Descriptors API supports reading and modifying descriptors (enumeration sets) in an Ed-Fi API application.',
};

function majorMinor(version) {
  const [major, minor] = version.split('.');
  return `${major}.${minor}`;
}

function titleFor(kind, version) {
  const mm = majorMinor(version);
  return kind === 'resources' ? `Ed-Fi Resource API (${mm})` : `Ed-Fi Descriptors API (${mm})`;
}

/**
 * Applies the "Standardization" step from dev/docs/FROM-SWAGGER-TO-OPENAPI.md:
 * sets info.title/info.description/info.version to the canonical published
 * values for `kind`/`version`, and strips the top-level `servers` key
 * entirely (it always points at one specific dev ODS/API instance and is
 * never part of the published spec).
 *
 * Mutates `doc` in place and also returns it.
 *
 * @param {object} doc
 * @param {{ kind: 'resources'|'descriptors', version: string }} options
 * @returns {object} doc
 */
function standardize(doc, { kind, version } = {}) {
  if (kind !== 'resources' && kind !== 'descriptors') {
    throw new UsageError(`Invalid kind "${kind}"; expected "resources" or "descriptors".`);
  }
  if (typeof version !== 'string' || !VERSION_RE.test(version)) {
    throw new UsageError(
      `Invalid data standard version "${version}"; expected a semantic version like "6.1.0".`
    );
  }

  if (!doc.info) doc.info = {};
  doc.info.title = titleFor(kind, version);
  doc.info.description = DESCRIPTIONS[kind];
  doc.info.version = version;

  delete doc.servers;

  return doc;
}

module.exports = { standardize, majorMinor, DESCRIPTIONS, VERSION_RE };
