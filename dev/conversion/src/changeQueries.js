'use strict';

const { HTTP_METHODS } = require('./optimizer/responses');

const CHANGE_QUERY_PARAMETER_REFS = new Set([
  '#/components/parameters/MinChangeVersion',
  '#/components/parameters/MaxChangeVersion',
  '#/components/parameters/Use-Snapshot',
]);

const NOT_FOUND_USE_SNAPSHOT_REF = '#/components/responses/NotFoundUseSnapshot';
const NOT_FOUND_REF = '#/components/responses/NotFound';

// Use-Snapshot arrives inline (not yet a $ref) in raw ODS/API exports -- it
// is only hoisted into a $ref later, by the optimizer. Match it by shape so
// it never reaches that hoisting step and no orphaned component is created.
function isChangeQueryParameter(param) {
  if (!param || typeof param !== 'object') return false;
  if (CHANGE_QUERY_PARAMETER_REFS.has(param.$ref)) return true;
  return param.name === 'Use-Snapshot' && param.in === 'header';
}

function stripParameters(holder) {
  if (!holder || !Array.isArray(holder.parameters)) return 0;
  const before = holder.parameters.length;
  holder.parameters = holder.parameters.filter((param) => !isChangeQueryParameter(param));
  return before - holder.parameters.length;
}

function replaceNotFoundUseSnapshot(responses) {
  if (!responses || typeof responses !== 'object') return 0;
  let count = 0;
  for (const response of Object.values(responses)) {
    if (response && response.$ref === NOT_FOUND_USE_SNAPSHOT_REF) {
      response.$ref = NOT_FOUND_REF;
      count += 1;
    }
  }
  return count;
}

// Every trackedChanges_* schema exists only to shape the responses of the
// /deletes and /keyChanges endpoints removed above, and only ever references
// other trackedChanges_* schemas -- never a schema outside that family. Once
// the paths are gone, the whole family is orphaned and safe to drop as a
// group.
function stripTrackedChangesSchemas(doc) {
  const schemas = (doc.components && doc.components.schemas) || {};
  const schemasRemoved = [];
  for (const name of Object.keys(schemas)) {
    if (name.startsWith('trackedChanges_')) {
      delete schemas[name];
      schemasRemoved.push(name);
    }
  }
  return schemasRemoved;
}

/**
 * Strips the "Change Queries" surface from `doc`: the `/deletes` and
 * `/keyChanges` tracked-change path items, the schemas that shape their
 * responses, the MinChangeVersion / MaxChangeVersion / Use-Snapshot
 * parameters that support them, and the NotFoundUseSnapshot response
 * (replaced with the plain NotFound response). This matches the
 * historical, hand-edited published specs, which never included this
 * surface.
 *
 * Mutates `doc` in place and also returns it, alongside a report.
 *
 * @param {object} doc
 * @returns {{ doc: object, report: { pathsRemoved: string[], schemasRemoved: string[], parametersRemoved: number, responsesReplaced: number } }}
 */
function stripChangeQueries(doc) {
  const paths = doc.paths || {};
  const pathsRemoved = [];
  let parametersRemoved = 0;
  let responsesReplaced = 0;

  for (const pathKey of Object.keys(paths)) {
    if (pathKey.endsWith('/deletes') || pathKey.endsWith('/keyChanges')) {
      delete paths[pathKey];
      pathsRemoved.push(pathKey);
      continue;
    }

    const pathItem = paths[pathKey];
    if (!pathItem || typeof pathItem !== 'object') continue;

    parametersRemoved += stripParameters(pathItem);

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== 'object') continue;
      parametersRemoved += stripParameters(operation);
      responsesReplaced += replaceNotFoundUseSnapshot(operation.responses);
    }
  }

  const schemasRemoved = stripTrackedChangesSchemas(doc);

  return { doc, report: { pathsRemoved, schemasRemoved, parametersRemoved, responsesReplaced } };
}

module.exports = { stripChangeQueries };
