# Handling Optimistic Concurrency with ETags

Concurrency becomes an issue in high-volume systems with multiple clients
accessing the same data. An Ed-Fi REST API can support an opt-in optimistic
[concurrency
model](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)
using ETags. During PUT and DELETE operations, the API will verify that the
resource has not been modified by another party since it was last obtained by
the client. If the resource has not changed, the operation will continue
normally. If, however, the resource has changed, clients will receive an error
as notification that they _must_ obtain the latest version of the resource
before attempting further modifications. This approach can be used to prevent
"last-in-wins" update scenarios and related potential data loss.

When ETag-enabled systems respond to a GET request for an individual resource
(for example, `/students/{id}`), the response header returned by the API must
contain an ETag that uniquely identifies the version of the resource.

The following is an example response header:

```none
ETag: "-8588261538364775808"
Content-Type: application/json; charset=utf-8
Cache-Control: private
Content-Length: 1398
```

The following is the body in a GET response corresponding to the example header
above:

```json
{ 
    "schoolId":12345,
    "classPeriodName":"4th Period", 
    "classroomIdentificationCode":"abcde", 
    "localCourseCode":"Math 101", 
    "termTypeId":1, 
    "schoolYear":2012, 
    "uniqueSectionCode":"3FJ56", 
    "sequenceOfCourse":1, 
    "availableCredit":1.5
}
```

To opt-in to an optimistic update, the ETag value is added to an `If-Match`
header of a subsequent PUT or DELETE request, and the operation will be
processed only if the If-Match header value matches the latest ETag for the
resource stored on the server.

If the ETags do not match, a 412 (Precondition Failed) response code will be
returned. If the If-Match header is not specified in the request, then the
operation _must_ be processed and the server _must_ respond with a response code
of 204 (No Content) if the operation succeeds. However, the API _may_ be
implemented to require optimistic concurrency for updates and deletes, and if no
If-Match request header is supplied by the client, it _must_ respond with a
general 400 Bad Request error status code.

For example, here is a header value in a PUT or DELETE request:

```none
If-Match: -8588261538364775808
```

## ETag Generation

The ETag _may_ be generated as a hashed representation of the resource, as a
version number, a timestamp representing the last modification to the resource
(if timestamp resolution is fine enough), or a unique identifier that is
refreshed after each modification to the resource.

The ETag value _should_ meet
strong validation criteria as described in [IETF RFC
9110](https://www.rfc-editor.org/info/rfc9110/):

> "A "strong validator" is representation metadata that changes value whenever a
> change occurs to the representation data that would be observable in the
> content of a 200 (OK) response to GET."

By implication, a strong ETag value for the same object _must_ differ for each
of the following scenarios:

- Change of content-type (JSON, XML, gzip, etc)
- Change in the fields surfaced in a GET request due to profiles, field
  selectors, or changes to the data model
- Inclusion or exclusion of  metadata in a GET response

## Ed-Fi API Design and Implementation Guidelines

* [Scope](../SCOPE.md)
* [Key Characteristics](../KEY-CHARACTERISTICS.md)
* [Requirement Levels](../REQUIREMENT-LEVELS.md)
* [API Design Guidelines](../API-DESIGN-GUIDELINES/README.md)
* [API Implementation Guidelines](../API-IMPLEMENTATION-GUIDELINES/README.md)
  * [Handling Authentication and Authorization](AUTH.md)
  * [Handling Non-Repudiation](NON-REPUDIATION.md)
  * [Handling Optimistic Concurrency with ETags](OPTIMISTIC-CONCURRENCY.md)
  * [Handling Web Cache Validation with ETags](CACHE-VALIDATION.md)
