# Agent instructions

This tool converts raw OpenAPI 3 exports from the Ed-Fi ODS/API into the
official published spec YAML files under `api-specifications/{resources,
descriptors}/`. See `README.md` for usage/options and exit codes.

- Never hand-edit a generated `*.yaml` file in `api-specifications/`. Fix
  the bug in `src/`, add/update a test, then regenerate by re-running the
  CLI against the same raw JSON input with `--force`.
- The generated specs deliberately omit the "Change Queries" surface
  (`/deletes` and `/keyChanges` paths, `MinChangeVersion`/
  `MaxChangeVersion`/`Use-Snapshot` parameters, the `NotFoundUseSnapshot`
  response, `trackedChanges_*` schemas) — see `src/changeQueries.js`. This
  matches the historical hand-edited specs; it is not a bug to "restore".
- In `cli.js`, the raw doc is standardized on a *clone* before optimizing
  that clone, not the other way around — this keeps the report's
  "Standardized, unoptimized" vs. "Optimized" size comparison honest.
  Preserve that order if you touch the pipeline.
- Run `npm run lint` / `npm run lint:fix` (ESLint) and `npm test` (Jest)
  before considering a change done.
