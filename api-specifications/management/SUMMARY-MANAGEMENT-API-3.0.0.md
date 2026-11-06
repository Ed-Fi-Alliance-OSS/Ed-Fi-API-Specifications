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
    context/derivative models, and `odsInstanceIds` → `dataStoreIds` on
    `applicationModel` and `addApplicationRequest`. `editApplicationRequest`
    lost `odsInstanceIds` instead of having it renamed; see **Application
    edit request no longer sets data stores or enabled** below.

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
  `DELETE '/v3/dataStores/manage/{id}'` is the exception: it returns `202
  Accepted` with a `jobQueuedResult` body, since deletion is queued as a
  background job rather than completed synchronously.

* **POST changed from upsert to create-only.** In 2.3.0, `POST` created or
  updated a resource ("upsert"): when a resource with matching natural key
  values existed, the service updated it. In 3.0.0, `POST` only creates; if a
  match is found, the request is rejected with an error and no data is
  changed. This applies to `POST` on `/v3/vendors`, `/v3/profiles`,
  `/v3/dataStores`, `/v3/dataStoreDerivatives`, `/v3/dataStoreContexts`,
  `/v3/claimSets`, `/v3/applications` and `/v3/apiClients`. Clients that
  re-post an existing resource to update it must use `PUT` on the resource's
  `{id}` path instead.

* **Application edit request no longer sets data stores or enabled.** In
  2.3.0, `editApplicationRequest` included `odsInstanceIds` and `enabled`. In
  3.0.0 it has neither; both are set per API client, through `dataStoreIds`
  and `isApproved` on `editApiClientRequest` (`PUT '/v3/apiClients/{id}'`),
  and `applicationModel.enabled` and `applicationModel.dataStoreIds` are
  derived from the Application's API clients. Clients that change an
  Application's data stores or enabled state through
  `PUT '/v3/applications/{id}'` must use the API client endpoints instead.

* **Application credential reset can return `409 Conflict`.** In 2.3.0,
  `PUT '/v2/applications/{id}/reset-credential'` documented no `409`. In
  3.0.0, `PUT '/v3/applications/{id}/reset-credential'` returns `409` (type
  `urn:ed-fi:management-api:conflict`) when the Application has zero API
  clients or more than one. Clients must handle `409`, and reset an
  individual client's credentials with
  `PUT '/v3/apiClients/{id}/reset-credential'`.

## Non-Breaking Additive Changes

* New paths: `'/v3/jobs/{jobId}'`, `/v3/dataStores/manage` (GET/POST),
  `'/v3/dataStores/manage/{id}'` (GET/DELETE),
  `/v3/dataStores/edOrgs/refresh`,
  `'/v3/dataStores/{dataStoreId}/edOrgs/refresh'`. `POST
  /v3/dataStores/manage`, `DELETE '/v3/dataStores/manage/{id}'` and both
  `edOrgs/refresh` endpoints return `202 Accepted` with a `jobQueuedResult`
  body containing the `jobId` for the queued job. Every `202` response except
  the `DELETE` one also carries a `Location` header (`format: uri`) with the
  relative path of the job, in the form `/v3/jobs/{jobId}`.
* New schema components: `dataStoreManageModel`, `addDataStoreManageRequest`,
  `tenancyResult`, `tenantDataStoreModel`, `tenantDetailsResponse`,
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
* New property `claimSetId` added to `overrideAuthStategyOnClaimSetRequest`.
  The schema still has `additionalProperties: false`, as in 2.3.0.
* **API client education organizations.** An API client can be narrowed to
  some of its Application's education organizations:
  * `addApiClientRequest` and `editApiClientRequest` gained optional
    `educationOrganizationIds` (array of int64) and
    `inheritsApplicationEducationOrganizations` (boolean). The rules for
    combining them, including moving a client to another Application, are in
    the `POST` and `PUT /v3/apiClients` operation descriptions. On `PUT`,
    omitting both keeps the client's current flag and list.
  * `apiClientModel` gained `inheritsApplicationEducationOrganizations`.
    `educationOrganizationIds` is documented as the client's effective list
    and is no longer nullable; `[]` means no education organization access.
  * `PUT '/v3/applications/{id}'` is documented to remove deleted education
    organizations from every client and add new ones only to inheriting
    clients, and to work for Applications with zero clients.
* **Applications without a default client.** `addApplicationRequest` gained
  optional `createDefaultCredentials` (default `true`). When it is `false`, no
  API client is created, `key` and `secret` are `null`, and sending `enabled`
  or `dataStoreIds` returns `400`.
* `applicationModel.enabled` and `applicationModel.dataStoreIds` are
  documented as derived from the Application's API clients.
* `DELETE '/v3/apiClients/{id}'` is documented to leave the Application in
  place when it deletes the last client.
* **New error responses.** `409` was added to `PUT` and
  `DELETE '/v3/applications/{id}'`, `POST /v3/apiClients`, `PUT` and
  `DELETE '/v3/apiClients/{id}'` and
  `PUT '/v3/apiClients/{id}/reset-credential'`. `502` (identity provider
  failure) was added to `POST /v3/applications`, `PUT` and
  `DELETE '/v3/applications/{id}'`,
  `PUT '/v3/applications/{id}/reset-credential'`, `POST /v3/apiClients`,
  `PUT` and `DELETE '/v3/apiClients/{id}'` and
  `PUT '/v3/apiClients/{id}/reset-credential'`. `problemDetails.type` lists
  the new problem types `urn:ed-fi:management-api:conflict`,
  `conflict:unresolved-reference`, `conflict:education-organization-scope`,
  `bad-gateway` and `bad-gateway:partial-sync`.
  * Every new `502` applies only to implementations that keep client
    credentials in an external identity provider. Implementations without
    one, such as ODS Admin API, don't return it.
  * Implementations that process changes to an Application one at a time
    may return `409` (type `conflict`) when a concurrent change to the
    Application held the request up; the caller retries. This applies to
    every endpoint above that changes an Application or its API clients,
    including `PUT '/v3/applications/{id}/reset-credential'`.
  * Implementations that keep client credentials in an external identity
    provider may also return `409` (type `conflict`) on
    `POST /v3/apiClients` when the generated client key is already in use
    (retry), or when the identity provider client is already associated with
    another API client.
* **Partial sync.** The `502` on `PUT '/v3/applications/{id}'` documents only
  the `urn:ed-fi:management-api:bad-gateway:partial-sync` outcome: the
  Application change is saved, but the identity provider update of some API
  clients isn't confirmed. `problemDetails` gained an `apiClientIds`
  extension member listing them in ascending order. Resending the request
  finishes them.

## Non-Functional / Documentation Changes

* `info.version` format updated from `v2.3.0` to `3.0.0`. `info.title` and
  `info.description` are unchanged from 2.3.0 ("Ed-Fi Management API").
* OAuth scope description is "Full access to the Management API" (unchanged
  from 2.3.0 wording).
* Applied correct camel casing to the `apiClients` routes: `apiclients` →
  `apiClients` (`/v2/apiclients` → `/v3/apiClients`,
  `'/v2/apiclients/{id}'` → `'/v3/apiClients/{id}'`,
  `'/v2/apiclients/{id}/reset-credential'` →
  `'/v3/apiClients/{id}/reset-credential'`), and the same casing correction
  to the `Apiclients` tag. Real-world application behavior should be
  unchanged, accepting any casing.
* Minor description-text removals on the `id`/`name` query parameters for
  `GET /v3/dataStores`.
