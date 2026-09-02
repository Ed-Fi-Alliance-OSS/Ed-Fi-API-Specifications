'use strict';

const { hoistResponses } = require('./responses');
const { hoistParameters } = require('./parameters');

/**
 * Runs the full hoisting pipeline (responses, then parameters) against a
 * deep clone of `doc`, so this function is pure with respect to its
 * caller's object -- neither hoistResponses nor hoistParameters ever
 * mutates the document passed in here.
 *
 * @param {object} doc
 * @param {{ minHoistCount?: number }} [opts]
 * @returns {{ doc: object, report: object }}
 */
function optimize(doc, opts = {}) {
  const beforeSize = Buffer.byteLength(JSON.stringify(doc), 'utf8');

  const clone = JSON.parse(JSON.stringify(doc));

  const responsesReport = hoistResponses(clone, opts);
  const parametersReport = hoistParameters(clone, opts);

  const afterSize = Buffer.byteLength(JSON.stringify(clone), 'utf8');

  const report = {
    responses: responsesReport,
    parameters: parametersReport,
    sizeBytes: { before: beforeSize, after: afterSize },
  };

  return { doc: clone, report };
}

module.exports = { optimize };
