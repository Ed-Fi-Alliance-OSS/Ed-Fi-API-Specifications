# Summary of Changes for Ed-Fi Management API, Version 2.4.0

## Synopsis

This document describes the changes introduced in `management-api-2.4.0.yaml`
relative to `management-api-2.3.0.yaml`.

## Document Wide Changes

* The OAuth scope was renamed from `api` to `edfi_admin_api/full_access`; its
  description is unchanged ("Full access to the Management API").
* Error responses are now consistently documented: `400`/`404`/`500`
  (and `409`/`503` where applicable) responses across roughly 40 operations
  gained an explicit body where none was previously specified. The bodies are
  the legacy v2 error shapes the service returns, not RFC 7807 problem
  details: `messageResult` (`{ "message": ... }`), `notFoundResult`
  (`{ "title": ... }`), and `validationErrorResult` (`{ "title": ...,
  "errors": ... }`). POST/PUT `400` responses use `oneOf`
  `validationErrorResult` or `messageResult`. The content type remains
  `application/problem+json`, which is what the service sends. `401` and
  `403` responses have no body.
* Most `201 Created` responses for POST operations (vendors, profiles,
  odsInstances, odsInstanceDerivatives, odsInstanceContexts, apiClients,
  claimSets, claimSets/copy, claimSets/import, resourceClaimActions,
  overrideAuthorizationStrategy) now include a `Location` response header.
* `/connect/register` and `/connect/token` now explicitly declare
  `security: [{}]` (anonymous access). `/connect/register` documents
  `validationErrorResult` on `400` and `/connect/token` documents the new
  `oauthErrorResult` (OAuth 2.0 error body) on `400`, as `oneOf`
  `oauthErrorResult` or `validationErrorResult` for `application/problem+json`
  (a missing or invalid tenant header in multi-tenant mode returns the
  latter); both document
  `messageResult` on `500`.

## New Paths and Operations

* `GET '/v2/tenants/{tenantName}/odsInstances/edOrgs'` — replaces the two
  removed tenant paths (below); returns a `tenantDetailsResponse`.
* `GET /v2/odsInstances/manage` and `POST /v2/odsInstances/manage` — new
  ODS instance management surface using `odsInstanceManageModel` and
  `addOdsInstanceManageRequest`; POST returns `202 Accepted` with a
  `jobQueuedResult` body containing the `jobId` for the queued creation job.
* `GET '/v2/odsInstances/manage/{id}'` and `DELETE
  '/v2/odsInstances/manage/{id}'` — DELETE returns `202 Accepted` with a
  `jobQueuedResult` body containing the `jobId` for the queued deletion job.
* `GET '/v2/jobs/{jobId}'` — retrieves job status via the new
  `jobStatusResult` schema.
* `POST /v2/odsInstances/edOrgs/refresh` and `POST
  '/v2/odsInstances/{instanceId}/edOrgs/refresh'` — trigger a refresh job;
  both return `202 Accepted` with a `Location` header pointing at the job
  status endpoint and a `jobQueuedResult` body containing the `jobId`.

## Removed Paths

* `GET /v2/tenants`
* `GET '/v2/tenants/{tenantName}'`

Both are superseded by `GET '/v2/tenants/{tenantName}/odsInstances/edOrgs'`.

## Renamed Paths and Tags

* Applied correct camel casing to the `apiClients` routes: `apiclients` →
  `apiClients` (`/v2/apiclients` → `/v2/apiClients`,
  `'/v2/apiclients/{id}'` → `'/v2/apiClients/{id}'`,
  `'/v2/apiclients/{id}/reset-credential'` →
  `'/v2/apiClients/{id}/reset-credential'`). Real-world application behavior
  should be unchanged, accepting any casing.
* Applied the same casing correction to the `Apiclients` tag and its
  operation summaries (e.g., "Retrieves all apiclients." → "Retrieves all
  apiClients."). Documentation-only; does not affect application behavior.

## Schema Property Changes

* New `jobQueuedResult` schema (titled `JobQueuedResult`; `jobId`,
  `message`, both nullable strings) — the response body for background job
  queue operations.
* `informationResult` gained two properties: `tenancy` (`$ref:
  tenancyResult`) and `specificationVersion` (string).
* The informational root endpoint's `500` response body changed from
  `application/json` + `informationResult` to `application/problem+json` +
  `messageResult`; the endpoint also gained `security: [{}]`.
* New error schemas `messageResult`, `notFoundResult`, `validationErrorResult`
  and `oauthErrorResult` describe the v2 error bodies above.
