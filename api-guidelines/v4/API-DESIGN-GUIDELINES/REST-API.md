# REST API Conventions

All Ed-Fi API specifications are based on the Hypertext Transfer Protocol and
follow the [semantics](https://datatracker.ietf.org/doc/html/rfc9110) described
for that protocol. Furthermore, these API specifications follow the
[REST](https://en.wikipedia.org/wiki/REST) (REpresentational State Transfer)
architectural style. These API Design Guidelines highlight particular aspects of
these protocols as they apply to an Ed-Fi API.

## Verbs

HTTP verbs communicate actions that can be taken against a resource. An Ed-Fi
API _can_ support only the `GET` verb, when providing a read-only interface.
Otherwise, an  Ed-Fi API _must_ support the following HTTP verbs: `POST`, `GET`,
`PUT`, and `DELETE`. Each verb has specific usage patterns with respect to URL
construction, HTTP headers, request bodies, response bodies, and status codes.
These are described in separate pages for each.

* [POST Requests](./POST-REQUESTS.md) for creating items
* [GET Requests](./GET-REQUESTS.md) for retrieving items
* [PUT Requests](./PUT-REQUESTS.md) for updating items
* [DELETE Requests](./DELETE-REQUESTS.md) for deleting items

An HTTP `PATCH` performs a partial update on an existing individual resource. For
a partial update, only the properties that are submitted will be updated on the
target resource. The entire patch will be applied, or none of it will. The new
representation of the entire resource is returned in the response body. Due to a
lack of industry standard practice in the use of PATCH for REST APIs, it is _not
recommended_ that implementations support PATCH in Ed-Fi API applications.

## Content Type

For all Ed-Fi API transactional requests and responses, JSON _must_ be the
default format. If a media-type header is not provided, "application/json" is
presumed. Alternate packet formats _may_ also be supported.

## Authentication

To safeguard student data, an Ed-Fi API _must_ require authentication and
implement one or more authorization schemes. Exception: the [Discovery
API](./DISCOVERY-API.md) does not provide access to student data and _must_ be
accessible to anonymous clients. The API application _must_ support the
[Authorization](https://datatracker.ietf.org/doc/html/rfc7235) header and
_should_ support [OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
style authentication using the _client credentials_ grant.

For more detail on authentication and authorization, see the [API Implementation
Guidelines: Handling Authentication and
Authorization](../API-IMPLEMENTATION-GUIDELINES/AUTH.md).

## Status Codes

The list below contains the HTTP status codes most likely to be used in an Ed-Fi
API; other canonical status codes _may_ be used in appropriate circumstances.

| Code | Meaning             | When to Use                                                                                                     |
| ---- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| 200  | OK                  | The requested resource was successfully retrieved.                                                              |
| 201  | Created             | The item was created.                                                                                           |
| 204  | No Content          | The resource was successfully updated or deleted.                                                               |
| 304  | Not Modified        | The item's ETag value matched the `If-None-Match` header value; the resource has not been modified.               |
| 400  | Bad Request         | The request was invalid and cannot be completed. See the response body for specific validation errors.          |
| 401  | Unauthorized        | The request requires authentication. The OAuth bearer token was either not provided or is invalid.              |
| 403  | Forbidden           | The request cannot be completed in the current authorization context.                                           |
| 404  | NotFound            | The resource could not be found.                                                                                |
| 405  | Not Allowed         | Special cases where a verb is not allowed, for example in a read-only API.                                      |
| 409  | Conflict            | The request cannot be completed because it would result in an invalid state.                                    |
| 412  | Precondition Failed | The resource's current server-side ETag value does not match the supplied If-Match header value in the request. |
| 429  | Too Many Requests   | Too many requests have been received from the client (rate limiting).                                           |
| 500  | Server Error        | An unhandled error occurred on the server.                                                                      |
| 502  | Bad Gateway         | A network resource is not available (e.g. web server misconfiguration; unreachable database).                   |

## Error Handling

Requests that result in an error _must_ receive a standard HTTP status code in
the response. The applicable status codes are listed in the sections for each
verb. In situations where a response body is warranted, for providing detailed
information on the error, the response _should_ follow the [Problem Details for
HTTP APIs](https://datatracker.ietf.org/doc/html/rfc9457) specification.

> [!WARNING]
> When reporting on error details, the API implementation must carefully
> consider the potential for leakage of Personally Identifiable Information
> (PII) or other sensitive information.

## ETags

[ETags (Entity Tags)](https://tools.ietf.org/html/rfc7232#section-2.3) are
mechanisms used to support optimistic concurrency and efficient bandwidth
handling. The use of ETags is _recommended_ for Ed-Fi REST API implementations.

Also see [Optimistic
Concurrency](../API-IMPLEMENTATION-GUIDELINES/OPTIMISTIC-CONCURRENCY.md) for
further guidance on implementing ETags.

## API Guidelines Contents

* [Scope](../SCOPE.md)
* [Key Characteristics](../KEY-CHARACTERISTICS.md)
* [Requirement Levels](../REQUIREMENT-LEVELS.md)
* [API Design Guidelines](../API-DESIGN-GUIDELINES/README.md)
  * [Resources](RESOURCES.md)
    * [Validation of Natural and Foreign Keys](./NATURAL-FOREIGN-KEYS.md)
  * [Discovery API](./DISCOVERY-API.md)
  * [Ed-Fi Descriptors](./ED-FI-DESCRIPTORS.md)
  * [REST API Conventions](./REST-API.md)
    * [Uniform Resource Locators (URLs)](./UNIFORM-RESOURCE-LOCATORS.md)
    * [Data Strictness](./DATA-STRICTNESS.md)
    * [POST Requests](./POST-REQUESTS.md)
    * [GET Requests](./GET-REQUESTS.md)
    * [PUT Requests](./PUT-REQUESTS.md)
    * [DELETE Requests](./DELETE-REQUESTS.md)
* [API Implementation Guidelines](../API-IMPLEMENTATION-GUIDELINES/README.md)
