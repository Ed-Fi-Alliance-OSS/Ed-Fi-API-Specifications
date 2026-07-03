# GET Requests

An HTTP `GET` returns existing Resource item(s). `GET` _must_ be an idempotent
operation. `GET` is a required verb.

## Request URLs

A `GET` request can specify either a collection of items or a specific item:

* `GET /ed-fi/students` with or without query string parameters retrieves a list
  ("GET All" queries).
* `GET /ed-fi/students/[identifier]` retrieves a specific student ("GET by ID").

If the natural key is provided as a query string, then the result will be a
collection containing only one item.

An Ed-Fi API _should_ support searching capabilities with the possible use of
filters, paging, and ordering. These are discussed below.  Information about all
supported capabilities, their configurations, and their default values should be
available to client applications via the [Discovery API](./DISCOVERY-API.md).

### Search

An Ed-Fi API _must_ support querying capabilities when searching a collection
of Resources. Query operators are applied to the query string using the
following format: `{collectionURI}?{propertyName}={value}`. Additional
`{propertyName}={value}` terms may be appended after an ampersand, `&`.

For example, to search all available Students having the first name "John" and
surname "Smith":

```none
https://api.example.com/v3/ed-fi/students?firstName=john&lastSurname=Smith
```

Resources _must_ be queryable by natural key, and _should_ also be queryable by
other properties on the root of the Resource. The Open API specification
documents will show which properties are searchable.

When a searchable parameter is nested under another object in the JSON
payload, the Ed-Fi API specifications require the query string to use only the
parameter name _without_ dereferencing the parent element name. For example, the
JSON document for a `studentSchoolAssociation` includes `schoolId` nested below
`schoolReference`. In the JsonPath query language, the query for a particular
schoolId would then be `?schoolReference.schoolId=xyz`. However, the Ed-Fi API
specifications predate and do not use JsonPath. Instead, they make a simplifying
assumption that `schoolId` by itself is uniquely searchable without
dereferencing the parent entity, `schoolReference`. Thus, the correct HTTP query
term is therefore simply `?schoolId=xyz`.

### Paging

Paging is a mechanism that restricts the number of results returned by an
operation and has proven critical to the efficient usage of Ed-Fi APIs. An Ed-Fi
API _must_ support at least one paging mechanism. Two approaches are defined
below: limit/offset paging and cursor-based paging.

#### Limit/Offset Paging

The `limit` parameter _should_ be supported in the query string and allow the
client to set the maximum number of records to return. If no value is supplied,
the `limit` parameter _should_ default to 25.

The `offset` parameter _should_ be available to the client to specify how many
records to skip when getting the result set. The value for `offset` _should_
default to 0.

When multiple records are being returned, the total count of all records _should_
be returned as part of the HTTP response header information.

An Ed-Fi API _must_ use the same sort order on all query requests, so that
repeated `GET` requests with the same `limit` and `offset` parameters retrieve
the same records, unless the collection has been modified. If new records are
inserted or existing records are deleted, these modifications will necessarily
alter which records are included in the response.

> [!NOTE]
> Many databases have known performance limitations when using `offset` beyond
> around 10,000 records. Before the fourth revision to these guidelines, support
> for `limit`/`offset` queries was a _required_ feature of an Ed-Fi API. This
> has been relaxed to a `recommended` feature, so that API hosts may disable use
> of these parameters if they are concerned about the potential impact of "deep"
> (beyond 10,000) queries on their databases.

##### Limit/Offset Paging Examples

The following request will retrieve the first 25 student records:

```none
https://api.example.com/ed-fi/students
```

If the `total-count` response header has a value greater than 25, then the
following request will retrieve the next set of students, up to 25. Note that
the `offset` is zero-based, so the number 25 represents the 26th record.

```none
https://api.example.com/v1/students?offset=25
```

The next example increases the number of records requested to 100 and starts
with the 101st record in the collection.

```none
https://api.example.com/v1/students?offset=100&limit=100
```

#### Cursor-Based Paging

Cursor-based paging (also called seek-based or keyset paging) resolves the
performance limitations of limit/offset paging by anchoring each page request to
a specific record in the underlying data set rather than computing an offset. An
Ed-Fi API _should_ support cursor-based paging.

##### Page Tokens

When cursor-based paging is supported, the API _must_ communicate the cursor for
the next page to the client via a response header. The _recommended_ header name
is `Next-Page-Token`. The token _must_ be an opaque, URL-safe string (e.g., a
Base64url-encoded representation of an internal cursor position). Clients _must
not_ attempt to interpret or construct page token values; they _must_ treat them
as opaque strings.

When there is no next page — that is, the last page of results has been reached —
the `Next-Page-Token` header _must_ be omitted from the response.

To retrieve the next page, the client passes the token back as a `pageToken`
query parameter:

```none
GET https://api.example.com/ed-fi/students?pageToken=eyJhZ2dyZWdhdGVJZCI6MTIzNDV9&limit=100
```

The `limit` parameter _should_ be honored alongside `pageToken` to control page
size. When `pageToken` is present, the `offset` parameter _must_ be ignored.

##### Partitions Endpoint

Because cursor-based paging is inherently sequential — each page depends on the
cursor returned by the previous page — it does not naturally support parallel
processing. To enable clients to parallelize large data extractions, an Ed-Fi
API that supports cursor-based paging _should_ also provide a `/partitions`
child endpoint for each resource collection.

A `GET` request to the `/partitions` endpoint _should_ accept a `number` query
parameter specifying the desired number of partitions, and _must_ return an array
of page token objects. Each object represents the starting cursor for one
partition of the full result set, with each partition covering an approximately
equal share of the available records:

```none
GET https://api.example.com/ed-fi/students/partitions?number=4
```

Example response body:

```json
[
  { "pageToken": "eyJtaW4iOi0yMTQ3NDgzNjQ4LCJtYXgiOi0xMDczNzQxODI1fQ" },
  { "pageToken": "eyJtaW4iOi0xMDczNzQxODI0LCJtYXgiOi0xfQ" },
  { "pageToken": "eyJtaW4iOjAsIm1heCI6MTAwMDAwMH0" },
  { "pageToken": "eyJtaW4iOjEwMDAwMDEsIm1heCI6MjE0NzQ4MzY0N30" }
]
```

Each partition token encodes the range boundaries needed for the API to constrain
results to that partition's scope. The client uses each token as the `pageToken`
parameter to start paging through its partition, following successive
`Next-Page-Token` response headers until no further token is returned, signaling
the end of the partition.

This design allows a client to distribute partitions across independent
processing threads, achieving parallel throughput comparable to limit/offset
paging while retaining the performance benefits of seek-based paging.

Cursor-based paging and the `/partitions` endpoint are _not required_ for Change
Queries child endpoints (`/keyChanges` and `/deletes`). Those endpoints are
typically used with `minChangeVersion`/`maxChangeVersion` filter parameters that
constrain result sets via an indexed column, yielding similar performance
characteristics to cursor-based paging.

### Ordering

Ordering is a mechanism that sorts the objects returned by one or more of the
fields returned.  Ordering could be implemented with the use of URL query string
parameters. If implemented, it must:

* Take directionality as a parameter (ascending/descending).
* Respect paging parameters.
* Guarantee that repeated queries with the same order and paging parameters,
  when no data changes have occurred, reliably return the same sequence of
  objects.

For example, an Ed-Fi API could return all Student School Associations from
smallest School Id to largest with the following URL fragment:

```none
/ed-fi/studentSchoolAssociations?orderBy=SchoolId&direction=desc.
```

> [!NOTE]
> As an experimental feature, this example is merely one possibility, rather than
> a prescribed approach.

## Request Body

`GET` requests do not have a request body.

## Request Headers

In general, there is no requirement that an Ed-Fi API support any special
request headers other than `Authorization`. Specific implementations may use
request headers for special purposes; for example, the Ed-Fi ODS/API uses
special headers with the Profiles and Change Queries features.

An Ed-Fi API that supports [`etags`](./REST-API.md#etags) _should_ support the
[`If-Match`](https://datatracker.ietf.org/doc/html/rfc7232#section-3.1) and
[`If-None-Match`](https://datatracker.ietf.org/doc/html/rfc7232#section-3.2)
header for supporting caches.

## Response Body

A "GET by ID" request _must_ return a single item if the identifier exists, or
nothing if the identifier is not found. In the latter case, the request must use
status code 404 (NotFound).

A "GET All" query must return a _collection_, even if the collection is empty.
In a JSON response, an empty collection is represented by `[]`.

### Metadata

The items in a `GET` response body _could_ be modified to include the one or
more of the following metadata attributes:

* `_lastModifiedDate`, which is the [datetime](./DATA-STRICTNESS.md#datetime)
  when one or more of the document's values were last modified.
* [`etag`](./REST-API.md#etags) value
* `_lineage` describing the source and/or modifications to the data. Recording
  the modifications may be useful for data that have been manipulated after
  receipt, for example an address that has been regularized by third party
  postal software. The two proposed timestamps are with respect to the API
  itself - not the source system. The format is a Unix timestamp. The
  `apiModifyTimestamp` is thus the same value as the `_lastModifiedDate`; the
  new name provides a more compact format without breaking any existing
  integrations with `_lastModifiedDate`.

The following example demonstrates all forms of metadata.

```json
{
  "id": "986a44e7cfcf4019b7b2ea4a640c6d20",
  "schoolReference": {
    "schoolId": 255901107
  },
  "schoolYearTypeReference": {
    "schoolYear": 2022
  },
  "calendarCode": "2010605675",
  "calendarTypeDescriptor": "uri://ed-fi.org/CalendarTypeDescriptor#Student Specific",
  "gradeLevels": [],
  "_etag": "5250159352800270276",
  "_lastModifiedDate": "2024-03-29T18:23:57.2882372Z",
  "_lineage": {
      "sourceSystem": "Example SIS",
      "apiCreateTimestamp": 1711754637,
      "apiModifyTimestamp": 1711761837,
      "modifications": []
  }
}
```

> [!NOTE]
> At the time of publication, _lineage_ is a new proposal that has not been
> implemented in any known Ed-Fi API applications. The example provided above
> is not a required format for optional lineage information.

#### Deprecation of Links

While not described in prior versions of these Guidelines, the Ed-Fi ODS/API
Platform inserts a `link` metadata construct on all references when responding
to a `GET` request. This property describes the relationship of the reference
and provides a locator that can be used to construct the full URL to the
referenced item.

If this element were required, systems that store JSON documents would be forced
to enrich the document with information not immediately available in the `POST`
or `PUT` request pipeline, unlike the other metadata described above. Few client
applications utilize this feature, and alternatives exist. Therefore, it is _not
recommended_ that new Ed-Fi API applications include this metadata element.

The `Calendar` resource shown above is duplicated here, with inclusion of two
`link` entries as provided by the Ed-Fi ODS/API Platform. To re-iterate,
inclusion of `link` is _not_ a preferred practice in new implementations.

```json
{
  "id": "986a44e7cfcf4019b7b2ea4a640c6d20",
  "schoolReference": {
    "schoolId": 255901107,
    "link": {
      "rel": "School",
      "href": "/ed-fi/schools/2af36358c7824afe8b3b88aea077c172"
    }
  },
  "schoolYearTypeReference": {
    "schoolYear": 2022,
    "link": {
      "rel": "SchoolYearType",
      "href": "/ed-fi/schoolYearTypes/337ea29f861b4ee88fa9714863cc0b98"
    }
  },
  "calendarCode": "2010605675",
  "calendarTypeDescriptor": "uri://ed-fi.org/CalendarTypeDescriptor#Student Specific",
  "gradeLevels": [],
  "_etag": "5250159352800270276",
  "_lastModifiedDate": "2024-03-29T18:23:57.2882372Z"
}
```

A client application wishing to to look up information about the `School` with
identifier `255901107` can read the exact path from the `link`. Without this,
all clients can alternately perform a query, i.e. `GET
/ed-fi/schools?schoolId=255901107`. Examples with multiple part natural keys
also support direct queries, as the components of the natural key are always
queryable.

## Response Headers

There is no restriction on the standard or custom response headers that may be
included in the response to a `GET` request. A special header of note: an Ed-Fi
API _should_ provide a query string option for retrieving a count of all items
in the collection, which is useful in determining if there are additional pages
of data to retrieve. The _recommended_ approach is use query string
`?totalCount=true` and respond with an additional header, `total-count:
[number]` (example: `total-count: 1234`).

## Content Type

An Ed-Fi REST API application _must_ support the JSON content type. The
application _may_ disregard the requested content type and respond with JSON
instead.

Alternatively, it _may_ support other content types requested by an API client
(i.e. via the `accept` header). When it accepts other content types, the
application _must_ respond to a request for an unsupported content type with
status code 406 and a response body describing the available representations.

## Standard Status Codes

The following status codes _must_ be supported for `GET` responses:

| Status Code | Meaning      | When to Use                                                                                                 |
| ----------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| 200         | OK           | All successful requests, including "GET All" when there are no results to list                              |
| 401         | Unauthorized | The request requires authentication. The OAuth bearer token was either not provided or is invalid.          |
| 403         | Forbidden    | The request cannot be completed in the current authorization context.                                       |
| 404         | Not Found    | The resource could not be found. If Use-Snapshot header is set to true, the snapshot may have been removed. |
| 500         | Server Error | An unhandled error occurred on the server.                                                                  |

Code 304 (Not Modified) also _must_ be supported _if_ the application supports
[ETags](./REST-API.md#etags). Other [HTTP status
codes](./REST-API.md#status-codes) may be used as needed for specific
situations.

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
