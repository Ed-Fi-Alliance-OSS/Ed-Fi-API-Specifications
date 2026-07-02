# Uniform Resource Locators (URLs)

## URL Path Segments

All URLs _must_ follow this pattern:

```none
[scheme]://[host](:[port])/[as-needed-path-segments]/[model namespace]/[resource name](/[identifier])(?[key=value])
```

* The scheme, host, and port are standard features of HTTP (examples:
  `https://example.com` or `https://example.com:443`).
* These _may_ optionally be followed by any path segments desired by the API
  host. Example: `/api/data/v3`.
* The _required_ model namespace is a feature of an Ed-Fi API; in the core Ed-Fi
  Unifying Data Model, the namespace is always "ed-fi". Other values are used by
  Extensions ot the Data Model.
* The _required_ resource name corresponds to an entity in the Ed-Fi Unifying
  Data Model. Examples of resource names, which are always plural: `students`,
  `studentEducationOrganizationAssociations`. Pluralization follows standard
  English grammar, i.e. "agency" properly becomes "agencies", not "agencys".
* `PUT` and `DELETE` requests always specify a unique identifier after the
  resource; `GET` request may also specify that identifier.
* Finally, query string key-value pairs may be appended after the rest of the
  URL, prefixed by `?` and separated by `&`. Examples: `?firstName=John`,
  `?limit=200&offset=200`.

Given the potential variability in base paths, an API client should utilize the
[Discovery API](./ED-FI-DISCOVERY.md) to construct the full path segment
preceding the namespace component.

Also see [GET Requests](./GET-REQUESTS.md) for further detail on the use of
query string parameters.

## Resource Collections and Individual Resources

For each resource, there are two base forms for the URL: one for a collection of
resources and the other for a specific resource in the collection. The
collection form for the URL is referred to by the pluralized name of the
individual resource. A specific resource is referenced by the collection name,
followed by a slash and the resource's unique identifier. For example:

* `/students` refers to a collection of students
* `/students/ffc0a272` refers to a specific student with an assigned identifier
  of `ffc0a272`.

## Case Sensitivity

API routes and query string parameters _should not_ be case sensitive, although
this may be not be realistic in some API frameworks and case _insensitivity_ may
be impractical.

For example, the following pairs pairs _should_ be treated equivalently:

* `/ed-fi/students` and `/ed-FI/stUDeNTs`
* `/ed-fi/students?lastName=Doe` and `/ed-fi/students?LASTNAME=Doe`

Likewise, the _value_ of a query string _should_ be treated as _insensitive_.
Thus it is preferred that the query strings `?lastname=DOE` and `?lastname=Doe`
return the same results. While this is the default behavior in some database, it
may be difficult to achieve in others. Thus this is not a required feature.

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
