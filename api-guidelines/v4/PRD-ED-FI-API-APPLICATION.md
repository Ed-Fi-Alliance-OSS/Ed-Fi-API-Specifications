# Product Requirements Document: Ed-Fi API Application

**Status:** Published \
**Owner:** Ed-Fi Alliance \
**Contact:** Stephen Fuqua \
**Date:** June 2026 \
**Version:** 4.0 \
**Guideline source:** Ed-Fi API Design & Implementation Guidelines v4.0 \
**Related specifications:** Ed-Fi Resources API, Ed-Fi Descriptors API, Ed-Fi Discovery API

## 1. Product Overview

This document describes the requirements for a new implementation of an Ed-Fi API application that exposes the Ed-Fi Resource API, the Ed-Fi Descriptors API, and the Ed-Fi Discovery API as a unified service. The application is intended to serve as an "Ed-Fi compatible" platform — meaning it supports the entire Resource API and implements the Discovery API — as defined by the Ed-Fi API Design and Implementation Guidelines v4.0.

The application acts as a data exchange hub for K-12 education data. Client applications (student information systems, assessment platforms, reporting tools, etc.) read and write education data through the API using standard HTTP methods. The API enforces data consistency, referential integrity, and access control, freeing education organizations from managing bespoke, point-to-point integrations.

### 1.1 Strategic Alignment

The application exists to:

- Enable education organizations to adopt a vendor-neutral, standards-based data exchange layer for K-12 data
- Reduce integration burden on districts and state agencies by providing a common API contract that any conforming client application can use
- Enforce data quality through schema validation, referential integrity, and controlled enumeration values (Descriptors)
- Support FERPA and related student privacy obligations through mandatory authentication, authorization, and audit logging

The application must achieve "Ed-Fi compatible" status as defined in the guidelines: it must implement the full Ed-Fi Resource API, implement the Discovery API, and adhere to all SHALL requirements of the Ed-Fi API Design and Implementation Guidelines v4.0.

### 1.2 Target Users and Personas

#### API Consumers — Integration Developers

- Build client applications (SIS vendors, assessment platforms, analytics tools) that read from and write to the API
- Need predictable URL conventions, stable identifiers, clear error responses, and discoverable metadata
- Pain point: inconsistent behavior across Ed-Fi implementations forces bespoke client logic
- Success: A client built against the OpenAPI specification works without modification

#### API Consumers — Bulk Loader Operators

- Run system-level processes (e.g., nightly ETL jobs) that POST large volumes of records
- Need upsert semantics, reliable ordering, and actionable error feedback
- Do not operate in a user-authenticated context; rely on application-only OAuth credentials
- Success: Bulk loads complete idempotently without requiring manual intervention

#### Platform Administrators

- Provision API client credentials and configure authorization policies out-of-band
- Need audit logs to investigate data issues and security incidents
- Success: Can identify who wrote what data and when, with confidence in the log integrity

#### Ed-Fi Alliance / Certification Reviewers

- Validate that the implementation conforms to the Ed-Fi API Guidelines
- Need the Discovery API to self-describe the application version and data model versions
- Success: Implementation passes Ed-Fi certification review

### 1.3 Jobs to Be Done

- When a SIS needs to push student enrollment data, I want to POST to a standardized resource endpoint so that I do not need to learn a proprietary API.
- When an analytics tool needs to read all student records in pages, I want to use `limit` and `offset` query parameters so that I can iterate through large data sets without overloading the server.
- When a client application starts up for the first time knowing only the base URL, I want to read the Discovery API so that I can locate the OAuth token endpoint and the data management API base path without hard-coding them.
- When two concurrent processes attempt to update the same resource, I want optimistic concurrency via ETags so that the second writer is notified of the conflict and can refresh before retrying.
- When an administrator needs to investigate a data quality issue, I want audit logs of all API operations so that I can determine who submitted bad data and when.

## 2. Enterprise and System Context

The application operates as a RESTful HTTP service. Clients initiate requests; the server processes them and returns responses. The application is the sole authority over resource identifiers and referential integrity within its data boundary.

The application does not prescribe the underlying data store, deployment topology, or client technology. It presents a stable HTTP contract to all clients regardless of how data are internally stored.

External systems interact with the application through three interfaces:

- **OAuth 2.0 token endpoint** — may be hosted by the application itself or delegated to a third-party identity provider
- **Discovery API endpoint** — the root base URL; accessible to anonymous clients
- **Data management API endpoints** — all Resource and Descriptor CRUD operations; require authenticated and authorized clients

The application is expected to contain personally identifiable student data. All access to the data management API must therefore be authenticated and authorized.

## 3. Functional Requirements

Requirements use the following language per the Ed-Fi API Guidelines: SHALL (absolute requirement), SHOULD (recommended with valid exceptions), MAY (optional).

### 3.1 Discovery API

- **FR-DISC-1** — The application SHALL respond to a GET request at its root base URL with a JSON document describing the running application (the Discovery API response).
- **FR-DISC-2** — The Discovery API SHALL be accessible to anonymous (unauthenticated) clients.
- **FR-DISC-3** — The Discovery API response SHALL include a `version` field identifying the deployed application version.
- **FR-DISC-4** — The Discovery API response SHALL include a `dataModels` array listing all data models served by the application, including the core Ed-Fi Unifying Data Model with its name and version.
- **FR-DISC-5** — The Discovery API response SHALL include a `urls` object containing absolute URLs (not relative) for: the OAuth token endpoint (`oauth`), the data management API base path (`dataManagementApi`), and the dependency metadata endpoint (`dependencies`).
- **FR-DISC-6** — The dependency metadata endpoint SHALL provide a JSON document listing all resources and the order in which they must be loaded, enabling clients to load resources in dependency order.
- **FR-DISC-7** — The dependency metadata endpoint MAY also provide a GraphML representation.
- **FR-DISC-8** — The application SHOULD declare itself via an OpenAPI specification document; that specification MUST be a faithful representation of all available resources and MUST be consistent with the official Ed-Fi API specifications.
- **FR-DISC-9** — If an OpenAPI specification is provided, the Discovery API response SHALL include an `openApiMetadata` URL pointing to it.
- **FR-DISC-10** — The Discovery API response MAY include additional application-specific URLs beyond the required set.

### 3.2 Resources API

#### Resource Identification

- **FR-RES-1** — Each resource exposed by the application SHALL be assigned an internally generated unique identifier represented as a string with a maximum length of 255 characters.
- **FR-RES-2** — The application SHOULD generate resource identifiers itself and SHOULD NOT accept client-supplied identifiers on insert or update.
- **FR-RES-3** — Resource identifiers SHALL be immutable: modifying a resource's data SHALL NOT change its identifier.
- **FR-RES-4** — Each resource SHALL be accessible by GET request using the URI form `{resourceURI}/{id}`.
- **FR-RES-5** — Each resource SHALL be created with and retrievable by its natural key values using standard HTTP GET query string syntax: `{resourceURI}?{keyField1}={value1}&{keyField2}={value2}`.

#### URL Construction

- **FR-RES-6** — All resource URLs SHALL follow the pattern: `[scheme]://[host](:[port])/[optional-path-segments]/[model-namespace]/[resource-name](/[identifier])(?[key=value])`.
- **FR-RES-7** — The model namespace SHALL be present in all resource URLs (e.g., `ed-fi` for core UDM resources; extension namespaces for extended resources).
- **FR-RES-8** — Resource names in URLs SHALL be plural and SHALL follow standard English grammar pluralization.
- **FR-RES-9** — API routes and query string parameter names SHOULD be treated as case-insensitive.

#### HTTP Verbs

- **FR-RES-10** — The application SHALL support GET, POST, PUT, and DELETE for all non-read-only resources.
- **FR-RES-11** — The application MAY support GET only for read-only resources.
- **FR-RES-12** — The application SHOULD NOT support PATCH on Ed-Fi API resources due to a lack of industry-standard practice for PATCH in REST APIs.

#### POST (Create / Upsert)

- **FR-RES-13** — A POST request body SHALL contain exactly one resource document.
- **FR-RES-14** — A POST request with natural keys that match an existing resource SHALL perform an upsert (update the existing resource) rather than creating a duplicate.
- **FR-RES-15** — A POST request SHALL NOT accept a client-supplied unique identifier.
- **FR-RES-16** — On successful creation, the response SHALL include a `Location` header containing the URL of the new resource.
- **FR-RES-17** — A POST that creates a new resource SHALL return HTTP 201; a POST that updates an existing resource via upsert SHALL return HTTP 200.

#### GET (Retrieve)

- **FR-RES-18** — GET SHALL be an idempotent operation.
- **FR-RES-19** — A GET by ID request SHALL return the single matching resource if found, or HTTP 404 if not found.
- **FR-RES-20** — A GET collection request SHALL return a collection (an empty array `[]` when no results match), never a 404.
- **FR-RES-21** — The application SHALL support querying a resource collection by property values using query string parameters.
- **FR-RES-22** — Resources SHALL be queryable by natural key; resources SHOULD also be queryable by other root-level properties as described in the OpenAPI specification.
- **FR-RES-23** — The application SHOULD support a `limit` query parameter (default: 25) to constrain the number of records returned.
- **FR-RES-24** — The application SHOULD support an `offset` query parameter (default: 0) to skip records for paging.
- **FR-RES-25** — When returning multiple records, the application SHOULD support a `?totalCount=true` query parameter and, when requested, return the total record count in a `total-count` response header.
- **FR-RES-26** — The application SHALL use the same sort order on all queries so that repeated GET requests with identical `limit` and `offset` parameters return the same records when the collection has not changed.
- **FR-RES-27** — The application SHOULD support cursor-based paging via a `pageToken` query parameter as a performant alternative to `offset`-based paging.
- **FR-RES-28** — When cursor-based paging is supported, the application MUST return a `Next-Page-Token` response header containing an opaque, URL-safe token when a next page of results exists; this header MUST be omitted when the last page is returned.
- **FR-RES-29** — When a `pageToken` parameter is present in a request, the application MUST ignore any `offset` parameter.
- **FR-RES-30** — When cursor-based paging is supported, the application SHOULD expose a `/partitions` child endpoint for each resource collection. A GET to `/partitions?number={n}` MUST return an array of page token objects, each representing the start of an approximately equal partition of the full result set, enabling parallel client-side processing.
- **FR-RES-31** — Response bodies MAY include metadata fields: `_etag`, `_lastModifiedDate`, and optionally `_lineage`. New implementations SHOULD NOT include the deprecated `link` construct on references.

#### PUT (Update)

- **FR-RES-32** — PUT SHALL perform an idempotent full replacement of an existing resource.
- **FR-RES-33** — A PUT request URL SHALL end with the unique identifier of the resource to be replaced.
- **FR-RES-34** — A PUT against a nonexistent identifier SHALL NOT create a new resource; it SHALL return HTTP 404.
- **FR-RES-35** — If the request body includes an `id` field, it SHALL match the identifier in the URL; a mismatch SHALL result in HTTP 400.

#### DELETE (Remove)

- **FR-RES-36** — A DELETE request URL SHALL end with the unique identifier of the resource to be removed.
- **FR-RES-37** — A DELETE of a resource that is referenced by another resource SHALL return HTTP 409 (Conflict) when cascading is not enabled.
- **FR-RES-38** — The application is NOT required to cascade deletes; it MAY choose to do so.

#### Data Validation

- **FR-RES-39** — The application SHALL reject POST and PUT request bodies missing any required attribute with HTTP 400.
- **FR-RES-40** — The application SHALL accept and persist all required and optional attributes in POST and PUT bodies and return them in GET responses.
- **FR-RES-41** — The application SHOULD silently ignore extra attributes in POST and PUT bodies that are not defined in the API specification (rather than rejecting with HTTP 400).
- **FR-RES-42** — The application SHALL enforce all data types during validation of POST and PUT request bodies.
- **FR-RES-43** — All datetime fields SHOULD require both date and time, and SHOULD include timezone/offset per RFC 3339.
- **FR-RES-44** — Property names in POST and PUT request bodies SHOULD be treated as case-sensitive; property names in GET responses SHALL use the correct casing as defined in the specification.

#### Natural Key and Foreign Key Validation

- **FR-RES-45** — All field and key unification scenarios defined in the Ed-Fi UDM SHALL be enforced; a POST or PUT containing mismatched values on unified keys SHALL be rejected with HTTP 400.
- **FR-RES-46** — The application SHOULD validate that referenced resources (foreign keys) exist on POST and PUT; if a reference does not exist, the application SHOULD return HTTP 400.
- **FR-RES-47** — PUT and DELETE operations that would break an existing reference to the modified resource SHALL be rejected with HTTP 409 when cascading is not enabled.

#### Education Organization Identifiers

- **FR-RES-48** — The `educationOrganizationId` value SHALL be unique across all child entity types (e.g., `schoolId`, `localEducationAgencyId`). A value used as one child entity type SHALL NOT be reused for a different child entity type.

#### Resource Extensions

- **FR-RES-49** — Extended resources (additions to the Ed-Fi UDM) SHALL use the `_ext` field with a namespace key to distinguish extension attributes from core attributes (e.g., `"_ext": { "grandbend": { ... } }`).
- **FR-RES-50** — New domain aggregates created via extensions SHALL use the extension namespace as the model namespace segment in the URL path (e.g., `/grand-bend/applicants`).
- **FR-RES-51** — Extension namespaces SHOULD NOT be fully dereferenceable URIs; they SHALL be lightweight short identifiers.

### 3.3 Descriptors API

- **FR-DESC-1** — The application SHOULD expose all Descriptors as resources accessible via standard REST API conventions.
- **FR-DESC-2** — A Descriptor resource SHALL have the following attributes: `id`, `namespace`, `codeValue`, `shortDescription`. The attributes `description`, `effectiveBeginDate`, and `effectiveEndDate` are optional on POST/PUT and SHALL be returned on GET if they were supplied.
- **FR-DESC-3** — A POST to `/[abc]Descriptors` SHALL add a new Descriptor; a GET SHALL return all Descriptors for that type; PUT and DELETE SHALL return an error for collection-level requests.
- **FR-DESC-4** — A GET to `/[abc]Descriptors/{id}` SHALL return the individual Descriptor; PUT SHALL update it; DELETE SHALL remove it.
- **FR-DESC-5** — Descriptor values used in resource documents SHALL be expressed as URIs in the format `uri://[namespace]/[name of descriptor]#[descriptor value]`.
- **FR-DESC-6** — Descriptor URI values in requests SHALL be sent as-is and SHALL NOT be URI-encoded (e.g., spaces in codeValues must remain as literal spaces).
- **FR-DESC-7** — The application SHOULD validate Descriptor references in POST and PUT requests by parsing the namespace and codeValue from the URI; if the referenced Descriptor does not exist, the application SHALL return HTTP 400.
- **FR-DESC-8** — All API clients SHOULD have GET (read) access to Descriptors; access to POST SHOULD be granted only in carefully controlled situations.
- **FR-DESC-9** — The preferred approach for modifying existing Descriptors is to update `effectiveEndDate` or `description` via PUT; changing `namespace` or `codeValue` is not a recommended practice.

### 3.4 Authentication and Authorization

- **FR-AUTH-1** — The application SHALL require authentication and at least one authorization scheme for all data management API endpoints.
- **FR-AUTH-2** — The application SHALL support the OAuth 2.0 client credentials grant for application-only authentication (used by system-level integrations without user context).
- **FR-AUTH-3** — The application SHALL support the HTTP `Authorization` header for passing bearer tokens.
- **FR-AUTH-4** — The application SHOULD support both application authentication and user authentication; when user credentials are available, the application SHALL require both.
- **FR-AUTH-5** — The application SHALL apply the principle of least privilege: default permissions SHALL be no access, with all privileges explicitly granted.
- **FR-AUTH-6** — Application credentials SHOULD be assigned out-of-band per resource group and per organization, consistent with the intended scope of each client application.
- **FR-AUTH-7** — For three-legged OAuth scenarios, request authorization SHOULD use claims-based security together with Ed-Fi domain data to scope access to the appropriate students (e.g., a teacher's token limits access to their enrolled sections).

### 3.5 ETags and Concurrency

- **FR-ETG-1** — The application SHOULD support ETags on resource responses.
- **FR-ETG-2** — If ETags are supported: GET responses for individual resources SHALL include an `ETag` response header; PUT and DELETE requests SHALL support the `If-Match` request header; if the supplied ETag does not match the current server value, the application SHALL return HTTP 412.
- **FR-ETG-3** — If ETags are supported: if no `If-Match` header is supplied on PUT or DELETE, the application SHALL process the operation and respond with HTTP 204 on success, unless the application is configured to require optimistic concurrency, in which case it SHALL return HTTP 400.
- **FR-ETG-4** — GET responses SHOULD support the `If-None-Match` request header for cache validation; if the ETag matches, the application MAY return HTTP 304 with no response body.
- **FR-ETG-5** — ETags SHOULD be generated as a hashed representation of the resource; they MAY be implemented as a version number, timestamp, or refreshed unique identifier.

### 3.6 Error Handling

- **FR-ERR-1** — All error responses SHALL return a standard HTTP status code.
- **FR-ERR-2** — Error responses that include a body SHOULD conform to the Problem Details for HTTP APIs specification (RFC 9457).
- **FR-ERR-3** — Error response bodies SHALL NOT leak personally identifiable information (PII) or other sensitive data.

### 3.7 Content Type

- **FR-CT-1** — JSON SHALL be the default content type for all transactional requests and responses. If no `Content-Type` or `Accept` header is provided, `application/json` SHALL be assumed.
- **FR-CT-2** — The application MAY support alternate packet formats in addition to JSON.

### 3.8 Non-Repudiation and Audit Logging

- **FR-NR-1** — The application SHOULD maintain operational audit logs capturing at minimum: user/application identity, resource, operation type, and date/time for all API operations.
- **FR-NR-2** — Audit logs SHOULD be reviewed on a regular basis.

### 3.9 Bulk Operations

- **FR-BULK-1** — When a bulk load interface is provided, it MAY use system user authentication but SHALL use application authentication.
- **FR-BULK-2** — Bulk data installations SHOULD use additional authentication mechanisms (e.g., IP restrictions, pre-shared certificates, or VPN) where possible.
- **FR-BULK-3** — Bulk processing SHOULD be sequential; individual operation failures within a batch SHOULD NOT halt processing of subsequent valid operations.
- **FR-BULK-4** — The submitter SHOULD be notified of operation failures asynchronously.
- **FR-BULK-5** — The queuing mechanism SHOULD ensure transactional integrity, FIFO ordering, and minimal long-lived connections or resource locks.

## 4. Non-Functional Requirements

### Security

- **NFR-SEC-1** — The application SHALL require authentication and authorization on all data management API endpoints; the Discovery API SHALL be the only endpoint accessible without authentication.
- **NFR-SEC-2** — The implementation SHOULD be regularly validated against OWASP top-10 security vulnerabilities and applicable community security standards.
- **NFR-SEC-3** — The application SHALL NOT store or transmit PII in error messages, audit logs (beyond the minimum required for accountability), or any other unintended channel.
- **NFR-SEC-4** — The application SHOULD NOT preclude future security enhancements; the implementation SHOULD be designed to allow pluggable or upgradeable authentication mechanisms.

### Compatibility

- **NFR-COMP-1** — The application SHALL achieve "Ed-Fi compatible" status: it SHALL implement the full Ed-Fi Resource API, the Ed-Fi Descriptors API, and the Ed-Fi Discovery API, and SHALL meet all SHALL requirements of Ed-Fi API Design and Implementation Guidelines v4.0.
- **NFR-COMP-2** — The application SHALL serve OpenAPI specification documents that are consistent with the official Ed-Fi API specifications.
- **NFR-COMP-3** — The application SHALL support JSON as the primary data interchange format; all GET responses SHALL use correct property casing as defined by the specification.

### Reliability and Data Integrity

- **NFR-REL-1** — Upsert (POST) operations SHALL be idempotent: submitting the same document multiple times SHALL produce the same final state.
- **NFR-REL-2** — The application SHALL enforce referential integrity: resources with foreign key references that cannot be resolved SHALL be rejected.
- **NFR-REL-3** — The educationOrganizationId namespace SHALL be unique across all child entity types at all times.

### Performance and Scalability

- **NFR-PERF-1** — The application SHALL support paging; GET collection endpoints SHOULD support `limit` (default 25) and `offset` (default 0) query parameters for limit/offset paging.
- **NFR-PERF-2** — The application SHOULD support cursor-based paging via a `pageToken` query parameter and a `Next-Page-Token` response header. When cursor-based paging is supported, the application SHOULD also provide a `/partitions` child endpoint on each resource collection to enable parallel data extraction. Cursor-based paging is not required for Change Queries endpoints (`/keyChanges`, `/deletes`).
- **NFR-PERF-3** — Bulk data ingestion SHOULD accept batches for processing without an immediate synchronous validity check, using asynchronous processing for schema validation and referential integrity checks.

### Observability

- **NFR-OBS-1** — The application SHOULD provide operational audit logs sufficient for non-repudiation investigations (user/application, resource, operation, timestamp).
- **NFR-OBS-2** — The Discovery API response SHOULD include build and version metadata to facilitate debugging of client-server interactions.

### SDLC and Operations

- **NFR-OPS-1** — The application SHOULD expose runtime configuration parameters (e.g., default page size, ETag support, case sensitivity) via the Discovery API to enable client self-configuration.
- **NFR-OPS-2** — Deployment SHOULD NOT require changes to the API contract; client applications SHOULD be able to discover all base URLs via the Discovery API rather than requiring hard-coded paths.

## 5. System Architecture

| Component | Responsibility | Notes |
|---|---|---|
| Discovery API endpoint | Exposes root metadata document; anonymous access | Returns version, data model list, and all required URLs |
| OAuth token endpoint | Issues and validates bearer tokens | May be built-in or delegated to a third-party identity provider |
| Data management API | Handles all Resource and Descriptor CRUD operations | Authenticated and authorized; enforces all REST and data validation rules |
| Dependency metadata endpoint | Returns resource load-order metadata | Required; accessed via URL published in Discovery API |
| OpenAPI metadata endpoint | Serves OpenAPI specification documents | Recommended; must match official Ed-Fi specs |
| Authorization engine | Enforces least-privilege access control | Out-of-band provisioning of credentials and permissions |
| Audit logging subsystem | Records all API operations for non-repudiation | Minimum fields: identity, resource, operation, timestamp |
| Data store | Persists resource and descriptor documents | Implementation choice; must support referential integrity enforcement |

**Deployment boundary:** All components above may be co-located in a single deployable unit or distributed; the Discovery API URLs allow clients to locate each component regardless of deployment topology.

**Data ownership:** The application is the system of record for resource identifiers and referential integrity. Source systems are the authority for natural key values.

**Integration points:** Client applications (SIS, assessment platforms, analytics tools) connect via HTTPS using OAuth 2.0 bearer tokens. The OAuth token endpoint may be hosted externally.

## 6. Out of Scope and Known Limitations

- **PATCH support** — The HTTP PATCH verb is not recommended by the guidelines due to lack of industry-standard REST practice; it is excluded from this application's scope.
- **Ed-Fi Change Queries API** — Not in scope for this PRD; may be added via a separate specification.
- **Ed-Fi Identity API** — Not in scope for this PRD.
- **Ed-Fi Enrollment API** — Not in scope for this PRD.
- **Ed-Fi Management API** — Not in scope for this PRD.
- **XML representations** — JSON is required; XML and other formats are optional and not planned for initial delivery.
- **Client-generated resource identifiers** — The application will not accept client-supplied IDs on insert; clients must use server-assigned identifiers.
- **Cascading deletes/updates** — Not required by the guidelines; rejection with HTTP 409 is the default behavior. Cascading is not planned for initial delivery.
- **`link` metadata on references** — The deprecated `link` construct is explicitly out of scope; new implementations should not include it.
- **Three-legged OAuth (end-user flows)** — Initial delivery targets the client credentials grant for system applications; three-legged OAuth for user-context authorization is deferred.
- **`_lineage` metadata** — The lineage proposal in the guidelines is a new, unimplemented concept; it is deferred unless there is a specific implementation requirement.

## 7. Open Questions and Decision Log

| # | Question | Status | Decision / Notes |
|---|---|---|---|
| OQ-1 | Will the OAuth token endpoint be built into the application or delegated to a third-party identity provider (e.g., an enterprise IdP)? | Open | Guidelines permit either; choice affects FR-AUTH-1 and system architecture. |
| OQ-2 | Will the application require the `If-Match` ETag header on all PUT/DELETE operations, or make it optional? | Open | Guidelines permit both; mandatory ETag enforcement provides stronger concurrency safety but increases client complexity. |
| OQ-3 | Which paging mechanism will be the primary supported approach — `limit`/`offset`, keyset/cursor, or both? | Resolved | Both are now defined standards. `limit`/`offset` is recommended (SHOULD) and may be disabled for deep queries. Cursor-based paging is independently recommended (SHOULD) per FR-RES-27–30 and NFR-PERF-2. Implementations MUST support at least one mechanism. |
| OQ-4 | Will the application support user-context (three-legged OAuth) authorization in addition to application-only credentials? | Open | Guidelines recommend both; initial scope targets client credentials only (see Out of Scope). Confirm whether this deferral is acceptable. |
| OQ-5 | What subset of Ed-Fi UDM extensions (if any) will the application expose beyond the core Ed-Fi data model? | Open | Extensions affect the OpenAPI specification, the Discovery API `dataModels` list, and namespace URL segments. |
| OQ-6 | Will referential integrity validation be enabled by default, or will the application support a mode where it is disabled? | Open | Guidelines recommend enabling it; some deployments disable it for partial-data ingest scenarios. |

## 8. Glossary

- **Ed-Fi aligned** — An application that exposes a subset of the Ed-Fi Resource API and adheres to the Ed-Fi API Guidelines.
- **Ed-Fi compatible** — An application that is Ed-Fi aligned, supports the entire Resource API, and implements the Discovery API.
- **Domain aggregate** — A composition of Ed-Fi UDM entities identified according to Domain-Driven Design principles; the unit of exchange in the Resource API.
- **Aggregate root** — The top-level entity of a domain aggregate; subordinate entities are only accessible through it.
- **Natural key** — A property or combination of properties intrinsic to a resource type that uniquely identifies an individual resource (as opposed to a synthetic identifier assigned by the server).
- **Descriptor** — A controlled enumeration value in the Ed-Fi Data Standard, consisting of a namespace and a codeValue. Referenced in resource documents as a URI of the form `uri://[namespace]/[descriptor name]#[codeValue]`.
- **Discovery API** — The root metadata endpoint of an Ed-Fi API application; provides version information, data model references, and URLs for all other endpoints.
- **ETag** — An Entity Tag; an opaque value returned in HTTP responses that uniquely identifies a version of a resource, used for optimistic concurrency and cache validation.
- **Upsert** — An operation that creates a resource if it does not exist, or updates it if it does, based on matching natural keys. POST in an Ed-Fi API implements upsert semantics.
- **FERPA** — Family Educational Rights and Privacy Act; U.S. federal law governing the privacy of student education records; a key driver for mandatory authentication and authorization in Ed-Fi API implementations.
- **UDM** — Ed-Fi Unifying Data Model; the structured conceptual model of K-12 education data that defines entities, attributes, and associations represented by the Resource API.
- **ODS/API** — Operational Data Store / API; the Ed-Fi Alliance's reference implementation of an Ed-Fi compatible API platform.
