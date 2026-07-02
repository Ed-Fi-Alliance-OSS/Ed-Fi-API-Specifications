# Validation of Natural and Foreign Keys

A _natural key_ is a property or combination of properties that is intrinsic to
a Resource type and uniquely identifies an individual resource.

As mentioned in [Resources](./RESOURCES.md), this natural key can always be used
to lookup a given resource. This section further describes validation of
resources in POST, PUT, and DELETE requests.

## Field and Key Unification

The Ed-Fi UDM describes cases in which fields on a resource are merged with
other fields on a resource, producing a situation in which two fields _must_ have
the same value. This most commonly occurs in references to other API resources,
as these references use the (often composite) primary key fields. In such cases,
key fields from the reference may be defined — via the UDM — to be unified with
existing fields on the resource.

This unification has proven valuable to ensuring basic data quality in field
operations. All field and key unification scenarios defined in the UDM _must_ be
implemented in an Ed-Fi  API.

For example, the two `schoolId` values, nested within `schoolReference` and
`sessionReference`, must have the same value in the following `CourseOffering`
resource.

```json
{
  "id": "5394aabc256d4b938a8137d3b971b372",
  "courseReference": {
    "courseCode": "ALG-1",
    "educationOrganizationId": 255901001
  },
  "schoolReference": {
    "schoolId": 255901001
  },
  "sessionReference": {
    "schoolId": 255901001,
    "schoolYear": 2022,
    "sessionName": "2021-2022 Fall Semester"
  },
  "localCourseCode": "ALG-1"
}
```

A POST or PUT request that contains mismatched values on merged keys _must_ be
rejected by the API as a Bad Request (status code 400).

## Foreign Keys

The sample document shown above contains three references to other entities:
Course, School, and Session. The `{resource}Reference` properties contain the
natural key properties of those referenced Resource types. In this document's
context, the three sets of natural keys are _foreign keys_.

One of the key value propositions of using an Ed-Fi API is _referential
integrity_: on receiving a POST or PUT request, an Ed-Fi API _should_ validate
that the referenced resource(s) actually exist. In the contrary case, the
application would respond with Bad Request (status code 400).

Validating the referential integrity for all resources thus guarantees
consistency of the data: an API cannot have a StudentEducationOrganization that
refers to a Student or Education Organization that does not already exist in the
API. This referential integrity might be disabled in some specific circumstances
where the API host has a business reason to accept incomplete data. Generally,
such a host would either provide the missing data through an alternate method or
prevent the incomplete data from being used in reporting or analytics.

## Cascading Key Modifications

Relational databases typically provide the capability of _cascading_ a
modification. When cascading is enabled:

* A single PUT request on a resource to change its natural key automatically
  propagates the change to all other resources that contain a foreign key
  reference to the initially modified resource.
  * Ex: modifying a School resource's `schoolId` would automatically replace
    that value in all other resources that contain a reference to that School.
* A DELETE request on a resource automatically propagates the deletion to all
  other documents that refer to it.

Cascading these modifications thus allows one PUT or DELETE request to cause
mass updates in the data store. An Ed-Fi API is _not_ required to cascade these
modifications. When cascading is not enabled, then the API must reject a PUT or
DELETE requests that would break a reference from another resource to the
modified one, responding with Conflict (status code 409).

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
