// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const { InputFormatError } = require('./errors');

const OPENAPI_3_VERSION_RE = /^3\.\d+\.\d+$/;
// `components` is intentionally excluded: it's optional per the OpenAPI 3
// spec, and both optimizer hoisters (optimizer/parameters.js,
// optimizer/responses.js) already initialize it when absent.
const REQUIRED_TOP_LEVEL_KEYS = ['info', 'paths'];

/**
 * Confirms that `doc` is an OpenAPI 3.x document with the top-level keys
 * this tool depends on. Throws InputFormatError with a specific, actionable
 * message otherwise.
 *
 * @param {object} doc
 */
function assertOpenApi3(doc) {
  if (doc && Object.prototype.hasOwnProperty.call(doc, 'swagger')) {
    throw new InputFormatError(
      `Input file declares Swagger 2.0 ("swagger": "${doc.swagger}"). This tool ` +
        'only converts OpenAPI 3.x documents. See the manual process in ' +
        'dev/docs/FROM-SWAGGER-TO-OPENAPI.md for Swagger 2 inputs.'
    );
  }

  const openapiVersion = doc ? doc.openapi : undefined;
  if (typeof openapiVersion !== 'string' || !OPENAPI_3_VERSION_RE.test(openapiVersion)) {
    throw new InputFormatError(
      'Input file does not declare a supported OpenAPI 3.x version via the ' +
        `top-level "openapi" key (found: ${JSON.stringify(openapiVersion)}). ` +
        'This tool requires a document with "openapi": "3.x.y".'
    );
  }

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!doc || !Object.prototype.hasOwnProperty.call(doc, key)) {
      throw new InputFormatError(
        `Input file is missing the required top-level "${key}" key.`
      );
    }
  }
}

module.exports = { assertOpenApi3, OPENAPI_3_VERSION_RE };
