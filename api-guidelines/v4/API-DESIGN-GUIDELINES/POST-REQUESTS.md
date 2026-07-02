# POST Requests

An HTTP POST creates an individual subordinate resource. POST is a required verb
for non-read-only Resources.

## Request URLs

The URL _must_ end with the resource type. It _must not_ support provision of a
specific identifier or query string parameters.

## Request Headers

There are no specific request headers associated with a `POST` request in an
Ed-Fi API.

## Request Body

The request body _must_ contain exactly one item to be saved in the API
application. Performing a `POST` with identical natural keys to a resource
already in the data store _must_ perform an update rather than create a new
resource (colloquially known as an "upsert"). A POST operation _must not_ allow
a desired unique identifier to be provided to the REST API.

See [Data Strictness](./DATA-STRICTNESS.md) for more information about
validation of the request body.

## Response Body

The response _could_ contain the item that has just been created, optionally
including the same [metadata](./GET-REQUESTS.md#metadata) used in a `GET`
response.

## Response Headers

If successful, the URL to the new resource is returned in the `Location` HTTP
header of the response. Example:

```none
Location: https://api.example.com/ed-fi/students/[identifier]
```

If the application supports [ETags](./REST-API.md#etags), then the ETag _must_
be provided in an `Etag` header. Example:

```none
Etag: 5250159352800270276
```

## Applicable Status Codes

The following status codes _must_ be supported for `POST` responses:

| Status Code | Meaning      | When to Use                                                                                            |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| 200         | OK           | The item was updated ("upsert").                                                                       |
| 201         | Created      | The item was created.                                                                                  |
| 400         | Bad Request  | The request was invalid and cannot be completed. See the response body for specific validation errors. |
| 401         | Unauthorized | The request requires authentication. The OAuth bearer token was either not provided or is invalid.     |
| 403         | Forbidden    | The request cannot be completed in the current authorization context.                                  |
| 404         | NotFound     | GET by ID request where the identifier does not exist.                                                 |
| 405         | Not Allowed  | The API is only intended for reads, or the `Use-Snapshot` header is set to true.                          |
| 500         | Server Error | An unhandled error occurred on the server.                                                             |

Other [HTTP status codes](./REST-API.md#status-codes) may be used as needed for specific situations.

## Ed-Fi API Design and Implementation Guidelines

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
