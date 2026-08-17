# Summary of Changes for Ed-Fi Management API, Version 2.4.0

## Synopsis

This document describes the changes introduced in `management-api-2.4.0.yaml`
relative to `management-api-2.3.0.yaml`.

## Document Wide Changes

* `info.title` changed from "Ed-Fi Management API" to "Admin API
  Documentation", and `info.description` now reads "The Ed-Fi Admin API is a
  REST API-based administrative interface for managing vendors, applications,
  client credentials, and authorization rules for accessing an Ed-Fi API."
* `info.version` changed from `v2.3.0` to `v2`.
* The OAuth scope was renamed from `api` ("Full access to the Management
  API") to `edfi_admin_api/full_access` ("Full access to the Admin API").
* Error responses are now consistently documented: `400`/`401`/`403`/`404`/
  `500` responses across roughly 40 operations gained an explicit
  `application/problem+json` body (`$ref: '#/components/schemas/problemDetails'`)
  where none was previously specified.
* Most `201 Created` responses for POST operations (vendors, profiles,
  odsInstances, odsInstanceDerivatives, odsInstanceContexts, apiClients,
  claimSets, claimSets/copy, claimSets/import, resourceClaimActions,
  overrideAuthorizationStrategy) now include a `Location` response header.
* `/connect/register` and `/connect/token` now explicitly declare
  `security: [{}]` (anonymous access) and document `problemDetails` bodies
  on their `400`/`500` responses.

## New Paths and Operations

* `GET '/v2/tenants/{tenantName}/odsInstances/edOrgs'` — replaces the two
  removed tenant paths (below); returns a `tenantDetailsResponse`.
* `GET '/v2/odsInstances/{instanceId}/edOrgs'` — returns an array of
  `odsInstanceWithEducationOrganizationsModel`.
* `GET /v2/odsInstances/manage` and `POST /v2/odsInstances/manage` — new
  ODS instance management surface using `odsInstanceManageModel` and
  `addOdsInstanceManageRequest`; POST returns `202 Accepted`.
* `GET '/v2/odsInstances/manage/{id}'` and `DELETE
  '/v2/odsInstances/manage/{id}'` — DELETE returns `204 No Content`.
* `GET '/v2/jobs/{jobId}'` — retrieves job status via the new `response`
  schema.
* `POST /v2/odsInstances/edOrgs/refresh` and `POST
  '/v2/odsInstances/{instanceId}/edOrgs/refresh'` — trigger a refresh job;
  both return `201 Created` with a `Location` header pointing at the job
  status endpoint.

## Removed Paths

* `GET /v2/tenants`
* `GET '/v2/tenants/{tenantName}'`

Both are superseded by `GET '/v2/tenants/{tenantName}/odsInstances/edOrgs'`.

## Renamed Paths and Tags

* `/v2/apiclients` → `/v2/apiClients`
* `'/v2/apiclients/{id}'` → `'/v2/apiClients/{id}'`
* `'/v2/apiclients/{id}/reset-credential'` →
  `'/v2/apiClients/{id}/reset-credential'`
* Tag `Apiclients` renamed to `ApiClients`, with matching casing updates to
  operation summaries (e.g., "Retrieves all apiclients." → "Retrieves all
  apiClients.").

## New Schema Components

* `addOdsInstanceManageRequest`
* `educationOrganizationModel`
* `odsInstanceManageModel`
* `odsInstanceWithEducationOrganizationsModel`
* `problemDetails`
* `response`
* `tenancyResult`
* `tenantDetailsResponse`
* `tenantOdsInstanceModel`

## Schema Property Changes

* `informationResult` gained two properties: `tenancy` (`$ref:
  tenancyResult`) and `specificationVersion` (string).
* The informational root endpoint's `500` response body changed from
  `application/json` + `informationResult` to `application/problem+json` +
  `problemDetails`; the endpoint also gained `security: [{}]`.

## Documentation-Only Changes

* Line-ending normalization (`\r\n` → `\n`) in the profile example JSON
  payload. No functional impact.
