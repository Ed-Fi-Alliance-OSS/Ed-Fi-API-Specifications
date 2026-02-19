# Ed-Fi API Specifications

The following specifications files are in OpenAPI 2 (aka Swagger) or OpenAPI 3
format.

* Ed-Fi Discovery API
  * [Discovery API (1.0)](./discovery/1.0/) (implemented in all versions of the
    Ed-Fi ODS/API)
  * [Discovery API (2.0)](./discovery/2.0-draft/) (draft proposal)
* Ed-Fi Resource API
  * [Resources API (3.3)](./resources/3.3/) (implemented in Ed-Fi ODS/API v5.3)
  * [Resources API (4.0)](./resources/4.0/) (implemented in Ed-Fi ODS/API v6.x
    and 7.x)
  * [Resources API (5.0)](./resources/5.0/) (implemented in Ed-Fi ODS/API 7.x)
* Ed-Fi Descriptor API
  * [Descriptors API (3.3)](./descriptors/3.3/) (implemented in Ed-Fi ODS/API
    v5.3)
  * [Descriptors API (4.0)](./descriptors/4.0/) (implemented in Ed-Fi ODS/API
    v6.x and 7.x)
  * [Descriptors API (5.0)](./descriptors/5.0/) (implemented in Ed-Fi ODS/API
    7.x)
* Management API
  * [Management API 1.4.0](./management/management-api-1.4.0.yaml) (implemented in Ed-Fi Admin API < v1.4)
  * [Management API 1.4.3](./management/management-api-1.4.3.yaml) (implemented in Ed-Fi Admin API > v1.4 or > v2.3)
  * [Management API 2.2.0](./management/management-api-2.2.0.yaml) (implemented in Ed-Fi Admin API < v2.2)
  * [Management API 2.3.0](./management/management-api-2.3.0.yaml) (implemented in Ed-Fi Admin API > 2.3)

## OpenAPI Resources

* [Swagger Editor](https://editor.swagger.io/)
* [Swagger UI](https://petstore.swagger.io/) - note that you can paste a json or
  yml spec link from above in here to get a nicely formatted view of the API.
* [OpenAPI Generator](https://openapi-generator.tech/)

## Using Postman

[Postman](https://postman.com) is one of the most popular tools for interacting
with and exploring an API application. We do not include Postman files for
the Resources API because the files are too large, and can easily be recreated
using the instructions below.

[Import, Cleaning, and Export with Postman](../dev/docs/IMPORT-EXPORT-POSTMAN.md)

The [postman-environments](postman-environments) directory contains environment
files that can be used to interact with the official Ed-Fi Alliance
demonstration environment.
