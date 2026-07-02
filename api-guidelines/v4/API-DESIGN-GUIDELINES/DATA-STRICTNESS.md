# Data Strictness

The recommendations for this section are designed to allow the least amount of
friction in the data exchange while still ensuring data are valid.

## Schema Validation

With respect to a given API Specification document, an Ed-Fi API:

* _Must_ reject any POST or PUT request body that is missing a _required_
  attributes.
* _Must_ accept and store all _required_ and _optional_ attributes in a POST or PUT
  request body, and serve those fields as a valid document in response to GET
  requests.
* _Should_ ignore extra attributes in a POST or PUT request body that are not
  defined in the API specification.
* _Should not_ store extra attributes or include them in response to GET
  requests.

In many API applications, extra attributes would be rejected with status code
400 (BadRequest). In an Ed-Fi API, this allowing these extra attributes is
encouraged so that API clients are more likely to remain compatible across
variations in the API specification. For example:

* A source system vendor operates in two states. One of those states has
  extended `student` to include extra attributes. The vendor is able to send the
  same request body in both cases, knowing that the API application in the state
  without the extension will simply ignore the extra attributes.
* A minor update is made to the Ed-Fi Data Standard, adding an optional attribute
  to a `student`. An API client is programmed to send the new attribute, and
  it continues to interoperate without fail when accessing older API implementations
  that have yet to accept hte minor Data Standard update.

## Case Sensitivity

An Ed-Fi API _should_ enforce case sensitivity of property names in `POST` and
`PUT` request bodies. All implementations _must_ use the proper casing in
responses to `GET` requests.

The [Uniform Resource Locators (URLs)](./UNIFORM-RESOURCE-LOCATORS.md) section
describes that URLs _should not_ be case sensitive, which is seemingly at odds
with the requirement above. The URL insensitivity provides backwards
compatibility with prior versions of these Guidelines. Case sensitivity in the
document structure was not previously addressed. Requiring proper casing in
`GET` responses ensures consistency for API _consumer_ clients and downstream
reporting and analytics systems.

Ideally, an Ed-Fi API _should_ treat property _values_ as case insensitive. For
example, the local course codes "MATH-01" and "math-01" would be treated as
exactly equivalent. By implication, if a system contains a `Course` with a
`LocalCourseCode` of "MATH-01", then that system ought to accept "math-01" and
other variants interchangeably in place of "MATH-01". This requirement is not
mandatory because it may be impractical in some data stores.

## Inference

All data types _must_ be enforced while validating POST and PUT request bodies.
An application _could_ make reasonable inferences, so long as the response to a
GET request contains the correct data type. Inference is not a preferred
behavior, as it can lead to a fragmented landscape where some applications
accept inferred values and others do not. It is, however, accepted here for
legacy reasons: the Ed-Fi ODS/API Platform infers data types; this was likely an
outcome of the programming framework rather than an intentional design feature.

Reasonable inferences include:

| Data Type | Alternate Value | Inferred Value |
| --------- | --------------- | -------------- |
| Boolean   | 1               | true           |
| Boolean   | "1"             | true           |
| Boolean   | "true"          | true           |
| Boolean   | 0               | false          |
| Boolean   | "0"             | false          |
| Boolean   | "false"         | false          |
| Numeric   | "1"             | 1              |
| Numeric   | "1.234"         | 1.234          |

## DateTime

All API endpoints with date/time properties _should_ require both the date and
time, not just a date. Otherwise, a system is likely to infer midnight, which
may not be accurate. The value _should_ include the timezone/offset. See [RFC
3339](https://www.rfc-editor.org/rfc/rfc3339) for detailed guidance on proper
formatting of `datetime` type fields. Typical examples of validate `datetime` fields:

* `2021-09-28T15:00:00Z`, that is, 3:00 PM in UTC on September 28, 2021.
* `2021-09-28T15:00:00-06:00`, which is 3:00 PM in CST (central standard) on
  September 28, 2021.

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
