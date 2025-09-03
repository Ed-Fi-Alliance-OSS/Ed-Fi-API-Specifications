# Summary of Changes for Ed-Fi API Guidelines, Version 4.0

## Synopsis

This document describes a set of proposed changes to replace the _Ed-Fi API
Design & Implementation Guidelines_ v3.1.

The Ed-Fi API Design & Implementation Guidelines (herein after referred to as
the "Guidelines") describe requirements for an Ed-Fi representational state
transfer (REST) application programming interface (API). The Guidelines describe
the properties to which an API specification and related implementation must
adhere in order to be considered aligned to the Ed-Fi Data Standard. They do
not describe a specific implementation technology.

These changes are intended to ensure the establishment of API specifications that can
be relied upon when building or using an Ed-Fi compliant API, allowing client
applications to interoperate with _any_ Ed-Fi API with minimal friction.

The proposed changes are summarized below.

## Document Wide Changes

Any references to a specific implementation of an Ed-Fi API or to an Ed-Fi REST
API have been replaced with "an Ed-Fi API" or "Ed-Fi compatible API".

The document has been significantly restructured to present a new user
experience. The changes of substance are noted separately below. The new outline
is:

* Scope
* Key Characteristics
* Requirement Levels
* API Design Guidelines
  * Resources
  * Discovery API
  * Ed-Fi Descriptors
  * REST API Conventions
    * Uniform Resource Locators (URLs)
    * Data Strictness
    * POST Requests
    * GET Requests
    * PUT Requests
    * DELETE Requests
* API Implementation Guidelines
  * Handling Authentication and Authorization
  * Handling Non-Repudiation
  * Handling Optimistic Concurrency with ETags
  * Handling Web Cache Validation with ETags

## Summary of Modifications

* [Discovery API](v4.0/API-DESIGN-GUIDELINES/DISCOVERY-API.md): new section
* [Data Strictness](v4.0/API-DESIGN-GUIDELINES/DATA-STRICTNESS.md): new section
* [Ed-Fi Descriptors](v4.0/API-DESIGN-GUIDELINES/ED-FI-DESCRIPTORS.md)
  * NEW: requires implementation of the Descriptor API and explains the expected
    schema.
* [REST API Conventions](v4.0/API-DESIGN-GUIDELINES/REST-API.md): The sections
  under "REST API Conventions" are new and/or replace existing sections.
  * The former "ETags" and "Response Codes" contents are in this section, along with
    additional high-level API semantics and norms such as HTTP status codes and
    error response.
    * NEW: recommendation to structure error responses using [Problem Details
      for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc9457).
    * NEW: additional status codes that may be relevant.
* The former "General Request Construction" section is now [Uniform Resource
  Locators (URLs)](./v4.0/API-DESIGN-GUIDELINES/UNIFORM-RESOURCE-LOCATORS.md).
  It clarifies expectations for the URL's used in Ed-Fi API applications,
  separating out what is convention in the Ed-Fi ODS/API Platform from what is
  required of any Ed-Fi API application.
* Former "HTTP Verbs" section expanded out specific sections for each verb
  ([POST](./v4.0/API-DESIGN-GUIDELINES/POST-REQUESTS.md),
  [GET](./v4.0/API-DESIGN-GUIDELINES/GET-REQUESTS.md),
  [PUT](./v4.0/API-DESIGN-GUIDELINES/PUT-REQUESTS.md),
  [DELETE](./v4.0/API-DESIGN-GUIDELINES/DELETE-REQUESTS.md)). The rewritten
  content points out specific details of how today's Ed-Fi API clients and
  servers expect to interact with HTTP requests to an Ed-Fi API.
  * Former "Query Operators" section has moved into "GET Requests".
  * The "GET Requests" section removes the concept of selectors, relaxes the
    requirement to have OFFSET/LIMIT paging and opens the possibility of
    alternate paging mechanisms, and adds a proposal for sorting results.
  * Deprecation of `link` metadata in `GET` responses.
* The [Data Strictness](./v4.0/API-DESIGN-GUIDELINES/DATA-STRICTNESS.md) content
  provides new details on schema validation and data type handling, based on
  experience with the Ed-Fi ODS/API Platform.
* Changed all usage of "UUID" to the more generic "unique identifier" or
  "identifier", so that the implementation is free to use any scheme, not just a
  UUID, as the identifier for a specific resource.
* Remove notes on encryption, which is an operational concern rather than a
  design topic.
* Added content describing [natural and foreign key
  validation](./v4.0/API-DESIGN-GUIDELINES/NATURAL-FOREIGN-KEYS.md).

## Deleted Sections

Ed-Fi API applications are intended for use by systems, not end users. Therefore
the following pages have been removed:

* User Authorization
* User Claims
* User Roles
* External User Authorization
* Internal User Authorization

The Bulk Operations section has also been removed, as it was a feature of a
particular application, and not a prescribed part of the Ed-Fi API Standards.
