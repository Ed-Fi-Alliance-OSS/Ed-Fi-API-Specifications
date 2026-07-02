# Discovery API

The default response when retrieving the base endpoint on an Ed-Fi
implementation _must_ be a JSON document that provides information about the
application version, supported data model(s), and URLs for additional metadata.
Historically, this root-level metadata resource was informally known as the
"version endpoint". It is now formally called the Discovery API.

> [!TIP]
> The Discovery API is completely described in an
> [Open API 3 specification document](../../../api-specifications/discovery-api/)
> This specification document describes the required and optional features in
> detail. The guidance below supplements the specification file by providing
> additional context.

The following sample JSON demonstrates a typical example of the document:

```json
{
    "version": "7.1",
    "informationalVersion": "7.1",
    "suite": "3",
    "build": "7.1.1294.0",
    "dataModels": [
        {
            "name": "Ed-Fi",
            "version": "5.0.0",
            "informationalVersion": "The Ed-Fi Data Model 5.0"
        },
        {
            "name": "TPDM",
            "version": "1.1.0",
            "informationalVersion": "TPDM-Core"
        }
    ],
    "urls": {
        "dependencies": "https://api.ed-fi.org/v7.1/api/metadata/data/v3/dependencies",
        "openApiMetadata": "https://api.ed-fi.org/v7.1/api/metadata/",
        "oauth": "https://api.ed-fi.org/v7.1/api/oauth/token",
        "dataManagementApi": "https://api.ed-fi.org/v7.1/api/data/v3/"
    }
}
```

The example above is based on the [version
1.0](../../../api-specifications/discovery/1.0/) specification, used by the
Ed-Fi ODS/API Platform. New Ed-Fi API implementations are encouraged to look
into the modifications in the [draft version
2.0](../../../api-specifications/discovery/2.0-draft/).

## Root-Level Information

The root-level information (in this example, `version`, `informationalVersion`,
`suite`, and `build`) describes the deployed application. If the application
complies with these design guidelines and the relevant API specification, then
most _client applications_ should not need to know which _server_ application it
is communicating with. However, this information can be valuable when debugging
the client-server interaction.

## Data Models

This section lists all of the Data Models that are served by this API
application. This _must_ include the core Ed-Fi (Unifying) Data Model. Other
models listed are the _extensions_ that a given deployment implements. The
example above shows the core Teacher Preparation Data Model (TPDM) extension.

> [!TIP]
> The [Ed-Fi extension framework](https://edfi.atlassian.net/wiki/x/5IWXAQ) is
> defined elsewhere. All implementations that include extensions should follow
> the extension framework guidance as supplementary to this guide.

## URLs Section

The URLs section helps client applications discover for themselves how to
interact with the Ed-Fi API application. All listed URLS _must_ be absolute, not
relative. The most common URLs are further described in the following sections.

The optional values listed below represent features of the the Ed-Fi ODS/API
Platform. Other applications can add their own URLs as needed.

```json
"xsdMetadata": "https://api.ed-fi.org/v7.0/api/metadata/xsd",
"changeQueries": "https://api.ed-fi.org/v7.0/api/changeQueries/v1/",
"composites": "https://api.ed-fi.org/v7.0/api/composites/v1/",
"identity": "https://api.ed-fi.org/v7.0/api/identity/v2/"
```

### Dependencies

All implementations of an Ed-Fi API _must_ expose an endpoint for dependency
metadata. This endpoint will provide developers with the data needed to load
resources in the appropriate order. A client application should read the exact
URL to the dependencies from the `urls` section of the root Discovery document,
rather than hard-code the location.

The endpoint _must_ have a JSON implementation and _may_ have an optional a
GraphML implementation.  A sample of the JSON output is below:

```json
[
  {
    "resource": "/ed-fi/absenceEventCategoryDescriptors",
    "order": 1,
    "operations": [
      "Create"
    ]
  },
  {
    "resource": "/ed-fi/academicHonorCategoryDescriptors",
    "order": 1,
    "operations": [
      "Create"
    ]
  },
  …
  {
    "resource": "/tpdm/surveySectionResponsePersonTargetAssociations",
    "order": 22,
    "operations": [
      "Create"
    ]
  }
]
```

### OpenApiMetadata

An Ed-Fi API implementation _should_ declare itself in OpenAPI; the version of
OpenAPI is up to the implementation. The OpenAPI specification must be a
faithful representation of all available resources supported by the API. A given
API application might support multiple specifications, for example one for the
core Ed-Fi data model resources, and one for Ed-Fi descriptors. The
specifications provided by an API application _must_ be consistent with the
official [Ed-Fi API Specifications](../../../api-specifications/).

### OAuth

The OAuth URL _must_ be provided; it is the URL used by clients for token
authentication. The URL is not required to be on the same base address, i.e. it
could be hosted on another server or by a third party.

### DataManagementApi

This _required_ URL represents the base path for constructing the full [Uniform
Resource Locators](./UNIFORM-RESOURCE-LOCATORS.md) (URL) to a given resource. To
this base path, a client appends the data model namespace. For example, the
`/ed-fi/students` resource can be reached at the URL formed by combining the
`dataManagementApi` URL with the resource information. From the example above,
this yields the URL `https://api.ed-fi.org/v7.1/api/data/v3/ed-fi/students`.
While the Ed-Fi ODS/API Platform uses "data/v3" in the URL, other
implementations can use different path segments.

> [!WARNING]
> The following note about a specific implementation problem is shared to help
> other implementations of an Ed-Fi API avoid making similar mistakes.
>
> In versions of the Ed-Fi ODS/API Platform prior to 7.x, there were modes of
> operation that added another segment to the path, for example a school year.
> In those modes of operation, an API client could not rely solely on the
> `dataManagementApi` URL to determine the correct base address. This was
> changed in ODS/API 7.x with its new multi-tenancy modes. A single tenant's
> base URL is itself a proper Discovery document: thus, the hosting provider
> would give the vendor the specific tenant URL, not the root URL for the
> deployment.

## Application Settings

The Discovery API 2.0 specifications will introduce a section for listing application
settings that could be useful for client application self-discovery. These may
include standard settings such as:

* Default page size for `GET` requests.
* Case sensitivity.
* ETags support.
* ... and more.

> [!NOTE]
> These settings will not be backported to version 1 of the Discovery API specification.

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
