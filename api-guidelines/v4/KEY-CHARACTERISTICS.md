# Key Characteristics

An Ed-Fi API's key characteristics provide specific benefits to educational
organizations. Security and privacy of data and data systems are primary
concerns for all implementations and are addressed in an Ed-Fi API. The level of
abstraction available with an Ed-Fi API also allows for a variety of use cases.

## Benefits

An Ed-Fi API may be used to facilitate flexibility in a variety of situations
where different applications and/or data stores need to consume, exchange, or
manipulate education data. The major benefits of an Ed-Fi-aligned API are
described below:

* **Data store and application agnosticism.** Education organizations gain
  greater control over their application data infrastructure when they can use a
  common API that may be implemented or consumed by any number of vendors.
  Storage engines (backing an Ed-Fi API) may be selected to meet exact
  availability, distribution, and scalability needs. Applications (consuming an
  Ed-Fi API) all interoperate on common data, freeing education organizations to
  select product suites and/or individual applications that target specific user
  needs.
* **Data consistency between applications.** Educational organizations use many
  applications. Often, these applications use similar core entities such as
  student, school, and class. When changes are needed for any of these core
  entities, the entities must be updated in several systems. Inconsistencies
  often do not become apparent until the data are combined into a central
  repository for cross-reporting purposes. An Ed-Fi API implementation enables a
  common repository for core entities, so consistency is maintained across
  applications at all times.
* **Simplified infrastructure.** The IT staff at many educational organizations
  are overtaxed with ever-increasing system management, desktop support, and
  reporting requirements. Each additional application and data repository
  represents additional "surface area" that must be managed, monitored,
  maintained, and secured. Infrastructure may be simplified by using an Ed-Fi
  API instead of trying to synchronize between proprietary data stores or
  application-specific APIs.
* **Open infrastructure.** An Ed-Fi API is built on current industry best
  practices and standard HTTP verbs. Therefore, an Ed-Fi API neither requires
  nor precludes cloud-based providers (e.g., data repositories) or consumers
  (e.g., desktop or mobile applications), or data store topology (e.g.,
  relational or document storage). The technology provider has the choice to use
  any of these technologies.

## Security

Security is necessarily a major concern for all organizations that deal with
education data. An Ed-Fi API addresses those security concerns in specific ways.
Security, in this context, consists primarily of three activities:

* Identifying users and client applications seeking access to information (i.e.,
  authentication)
* Establishing access policies to information (i.e., authorization)
* Enforcing those access policies.

(Other operational security considerations, such as availability, are out of
scope for this document).

An Ed-Fi API platform containing personally identifiable data or data about
which there are privacy concerns will limit access to authenticated and
authorized client applications. Even systems that deal only with public data
should secure access by authorizing and authenticating all access.

It is recommended that API developers on a regular basis use open community
standards for application security — such as those provided by the [Open Web
Application Security Project](https://www.owasp.org) — to validate their
implementations against common security vulnerabilities.

More details and guidance regarding security are provided in the [API
Implementation Design Guidelines](API-IMPLEMENTATION-GUIDELINES.md) section.

## API Guidelines Contents

* [Scope](SCOPE.md)
* [Key Characteristics](KEY-CHARACTERISTICS.md)
* [Requirement Levels](REQUIREMENT-LEVELS.md)
* [API Design Guidelines](API-DESIGN-GUIDELINES/README.md)
* [API Implementation Guidelines](API-IMPLEMENTATION-GUIDELINES/README.md)
