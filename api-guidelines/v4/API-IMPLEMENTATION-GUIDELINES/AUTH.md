# Handling Authentication and Authorization

Because security is an ongoing concern and best security practices are
continually evolving, an Ed-Fi REST API implementation _should not_ preclude any
future security enhancements. Implementations _should_ reflect the current best
practices where they affect the actual API structure or use. Additional layers
of security _may_ be employed on top of those identified here.

In order to secure a data repository, the repository _must_ know who is
requesting an operation, and what the requestor is allowed to do. The question
of who is known as authentication; the what is authorization.

## Authentication

The process of authentication provides the means of reliably identifying
applications and users to an Ed-Fi REST API implementation. Both applications
and users require authentication in order to maintain secure data. The [OAuth 2
framework](https://oauth.net/2/) is used by an Ed-Fi REST API for
authentication. This specification is broad enough to handle both private and
public identity providers. An identity provider issues identification
information for all providers desiring interaction with the system. An
authentication module verifies a security token as an alternative to explicitly
authenticating the user.

Both application authentication and user authentication _should_ be used. When
applications do not have user authentication associated with API calls, the API
_must_ allow application-only authentication. When user credentials are
available, the API _must_ require both application and user credentials. These
situations are described below.

### System Applications

Some classes of applications do not naturally operate in the context of a user;
they do not have user authentication associated with API calls. Examples of this
type of application include: bulk load and extract tools, enterprise-wide SISs,
and some classes of reporting tools. In these cases, extreme discretion should
be used when considering eliminating user authentication from the security
framework for these implementation scenarios.

In these cases it becomes necessary for the API to allow application-only
authentication or, preferably, to operate as a "system" user with global
privileges.

## Authorization

Authorization is a set of mechanisms for identifying what operations can be
performed, and upon which resources. Due to privacy concerns and
[FERPA](https://studentprivacy.ed.gov/ferpa) (the Family Educational Rights and
Privacy Act) regulations, it is critical that an Ed-Fi REST API implementation
correctly authorizes all resource requests.

The principle of least privilege _should be_ used for an Ed-Fi REST API
implementation. Least privilege means that default application and user
permissions are no privileges and that all privileges be explicitly granted.

Privileges for applications and users _should be_ assigned out-of-band to an
Ed-Fi REST API.

### Application Authorization

Applications perform actions against data based on user directives. It is
important to consider what actions are appropriate in relation to specific data.
In some cases, it _may not_ be appropriate for an application to act within a
specific resource domain. For example, an application that only records
attendance _should not_ have authorization to access assessment information. In
the same way, it _may not_ be appropriate for an application to be authorized to
act within all resource domains. For example, a SIS package used only at one
school _should not_ be authorized to work with resources at other schools.

Application credentials _should_ be assigned out-of-band for each resource group
and (if necessary) each organization appropriate to the application within an
Ed-Fi REST API.

### Client Applications

For three-legged OAuth scenarios, each request _should_ be authorized based on
claims-based security (see below) and Ed-Fi domain data to identify the students
for which they have responsibility. For example, superintendents would be
granted access to student data for all students in their districts, principals
would be granted access to all students in their schools, and teachers would be
granted access only to students enrolled in their sections.

## Authentication and Authorization Permutations

Authorization presupposes authentication. In the figure below, the empty boxes
represent impossible security models. The lightest boxes (on the upper left) are
less secure combinations and _should not_ be used. The medium boxes are security
models requiring that applications be certified for their intended purposes and
_should_ be used only with extreme caution. The darkest box (on the lower right)
represents the _recommended_ Ed-Fi REST API Authorization and Authentication
model in which both the user and application are authenticated and authorized
within the implementation.

![Diagram showing intersection of Authorization and
Authentication](Authentication-Figure.jpg)

**Figure 2.** Permutations of Authentication and Authorization

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
