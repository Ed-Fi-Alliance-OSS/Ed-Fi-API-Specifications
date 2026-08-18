# Summary of Changes for Ed-Fi Management API, Version 3.0.0

## Synopsis

This document describes the changes introduced in `management-api-3.0.0.yaml`
relative to `management-api-2.3.0.yaml`. This is a major version increment,
and it includes changes that require action from anyone implementing or
consuming this specification. Those changes are called out in **Breaking
Changes** below; implementers should review that section first.

## Breaking Changes

* **Base path version bump.** All paths moved from `/v2/...` to `/v3/...`
  (roughly 35 paths).

* **The "odsInstance(s)" resource domain was renamed to "dataStore(s)"**
  across paths, tags, schemas, and properties (roughly 10 paths and 10
  schemas affected):
  * Paths: `/v2/odsInstances` → `/v3/dataStores`,
    `'/v2/odsInstances/{id}'` → `'/v3/dataStores/{id}'`,
    `/v2/odsInstanceDerivatives(/{id})` → `/v3/dataStoreDerivatives(/{id})`,
    `/v2/odsInstanceContexts(/{id})` → `/v3/dataStoreContexts(/{id})`,
    `'/v2/odsInstances/{id}/applications'` →
    `'/v3/dataStores/{id}/applications'`.
  * Tag `OdsInstances` → `DataStores`.
  * Schemas: `odsInstanceModel` → `dataStoreModel`,
    `odsInstanceDetailModel` → `dataStoreDetailModel`,
    `odsInstanceContextModel` → `dataStoreContextModel`,
    `odsInstanceDerivativeModel` → `dataStoreDerivativeModel`,
    `addOdsInstanceRequest` → `addDataStoreRequest`,
    `addOdsInstanceContextRequest` → `addDataStoreContextRequest`,
    `addOdsInstanceDerivativeRequest` → `addDataStoreDerivativeRequest`,
    `editOdsInstanceRequest` → `editDataStoreRequest`,
    `editOdsInstanceContextRequest` → `editDataStoreContextRequest`,
    `editOdsInstanceDerivativeRequest` → `editDataStoreDerivativeRequest`.
  * Properties: `instanceType` → `dataStoreType` (including the query
    parameter on `GET /v3/dataStores`), `odsInstanceId` → `dataStoreId` on
    context/derivative models, and `odsInstanceIds` → `dataStoreIds` on the
    application schema.

* **Tenant endpoints were removed and replaced.** `GET /v2/tenants` and
  `GET '/v2/tenants/{tenantName}'` are removed with no direct equivalent;
  they are superseded by `GET '/v3/tenants/{tenantName}/dataStores/edOrgs'`,
  which requires `tenantName` and returns a new `tenantDetailsResponse`
  schema (`id`, `name`, `dataStores: [tenantDataStoreModel]`).

* **`apiClient` schema fields changed.** Property `key` renamed to
  `clientId`; properties `useSandbox` (boolean) and `sandboxType` (integer)
  were removed.

* **Claim set property renamed.** `name` → `claimSetName` on claim-set-related
  schemas. Any client reading or writing `name` on a claim set object must
  switch to `claimSetName`.

* **Resource claim authorization strategy fields removed.** `authStrategyId`
  (integer) and `isInheritedFromParent` (boolean) were removed from the
  resource-claim-authorization-strategy schema; only `authStrategyName`
  remains.

* **PUT and DELETE success responses changed from `200` to `204 No
  Content`.** This affects roughly 16 operations across vendors, profiles,
  dataStores, dataStoreContexts, dataStoreDerivatives, applications,
  claimSets, and apiClients. Clients that parse a response body or check
  strictly for status `200` on these calls must be updated to expect `204`.

## Non-Breaking Additive Changes

* New paths: `'/v3/jobs/{jobId}'`, `/v3/dataStores/manage` (GET/POST),
  `'/v3/dataStores/manage/{id}'` (GET/DELETE),
  `'/v3/dataStores/{dataStoreId}/edOrgs'`, `/v3/dataStores/edOrgs/refresh`,
  `'/v3/dataStores/{dataStoreId}/edOrgs/refresh'`.
* New schema components: `dataStoreManageModel`, `addDataStoreManageRequest`,
  `dataStoreWithEducationOrganizationsModel`, `tenancyResult`,
  `tenantDataStoreModel`, `tenantDetailsResponse`,
  `educationOrganizationModel`, `jobQueuedResult`, `jobStatusResult`,
  `problemDetails`.
* `informationResult` gained new properties `tenancy` (`$ref: tenancyResult`)
  and `specificationVersion` (string).
* A `Location` response header was added to `201 Created` responses across
  most POST endpoints (vendors, profiles, dataStores, dataStoreContexts,
  dataStoreDerivatives, applications, apiClients, claimSets, claimSets/copy,
  claimSets/import, overrideAuthorizationStrategy).
* Nearly every `400`/`401`/`403`/`404`/`500` response gained an explicit
  `application/problem+json` body (`$ref: problemDetails`) where none was
  previously documented.
* New property `claimSetId` added to `addResourceClaimOnClaimSetRequest`
  (optional).
* `dataStoreDerivativeModel` gained a new `connectionString` property.
* `overrideAuthStategyOnClaimSetRequest` relaxed from
  `additionalProperties: false` to permissive (`additionalProperties: {}`) —
  widens what the schema accepts rather than narrowing it.

## Non-Functional / Documentation Changes

* `info.version` format updated from `v2.3.0` to `3.0.0`. `info.title` and
  `info.description` are unchanged from 2.3.0 ("Ed-Fi Management API").
* OAuth scope description text updated to reflect "Admin API" wording.
* Applied correct camel casing to the `apiClients` routes: `apiclients` →
  `apiClients` (`/v2/apiclients` → `/v3/apiClients`,
  `'/v2/apiclients/{id}'` → `'/v3/apiClients/{id}'`,
  `'/v2/apiclients/{id}/reset-credential'` →
  `'/v3/apiClients/{id}/reset-credential'`), and the same casing correction
  to the `Apiclients` tag. Real-world application behavior should be
  unchanged, accepting any casing.
* Minor description-text removals on the `id`/`name` query parameters for
  `GET /v3/dataStores`.
