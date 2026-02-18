# Scope

The Ed-Fi Alliance produces several related Application Programming Interface
(API) specifications for exchange of K-12 education data. The essential feature
that characterizes an "Ed-Fi API" is implementation of one or more Ed-Fi API
specifications, following the REST architectural style.

An application that exposes some subset of the Ed-Fi Resource API, and adheres
to this guideline document, is said to be "Ed-Fi aligned." An application that
is Ed-Fi aligned, supports the _entire_ Resource API, and implements the Ed-Fi
Discovery API is said to be "Ed-Fi compatible".  In either situation, an
application _may_ expose other API's, whether from Ed-Fi or another source.

Unless otherwise stated, the guidelines provided by this document apply to both
_compatible_ and _aligned_ API applications.

## Ed-Fi API Specifications

### Resource API

The [Ed-Fi Unifying Data Model](https://edfi.atlassian.net/wiki/x/MIC-Bw) (UDM)
provides the basis for the data transferred and manipulated by an Ed-Fi REST API
implementation. The Ed-Fi UDM is a structured, conceptual model of common K–12
education data. The model includes entities that are easily recognized by
educators and administrators: schools, students, teachers, attendance, grades,
assessment results, and many others. These entities contain attributes (i.e.,
properties) that are also easily recognized. For example, assessment results
contain data, such as a score and the date the assessment was administered. The
UDM also includes associations (i.e., relationships) between entities, such as
the association between students and schools.

REST interfaces are built around Resources that define nouns. In the education
domain, these nouns include such things as schools, students, and teachers. In
the Ed-Fi UDM these nouns have been rigorously defined as "entities," with
specific attributes and associations. Compositions of entities, with their
attributes and associations, are called "domain aggregates." These are
identified from the Ed-Fi UDM according to the principles of Domain-Driven
Design (DDD). Domain aggregates are the Resources for an Ed-Fi
REST API. These concepts are discussed in more detail later in this document.

Entities are abstract concepts. They are implemented as "models" that define
data types, validation requirements, and inter-relationships. The words are
loosely interchangeable.

_Also see [Resources](./API-DESIGN-GUIDELINES/RESOURCES.md)_.

### Discovery API

The Ed-Fi Discovery API presents clients with configuration information about
a running application, including:

* The software version.
* Which version of the UDM is exposed by its implementation of the Resource API.
* URL's for authentication and access to the various API specification(s)
  implemented by that application.
* And, potentially, other runtime configuration parameters.

The Discovery API allows client developers to build applications that need know
only one base URL, can extract runtime information from it, and alter behavior
as appropriate.

_Also see [Discovery API](./API-DESIGN-GUIDELINES/DISCOVERY-API.md)_.

### Other API Specifications

Ed-Fi API software _must_ utilize the OAuth 2.0 API specification for managing
authentication, though the implementation _may_ use non-Ed-Fi software to
provision OAuth-related services.

> ![NOTE]
> The Ed-Fi ODS/API Platform exclusively uses a built-in OAuth 2.0 provider, which
> cannot be replaced by an off-the-shelf component. This need not be true of other
> implementations.

Other specifications managed by the Ed-Fi Alliance include:

* [Ed-Fi Descriptors API](./API-DESIGN-GUIDELINES/ED-FI-DESCRIPTORS.md)
* Ed-Fi Management API
* Ed-Fi Identity API
* Ed-Fi Change Queries API
* Ed-Fi Enrollment API
* various _profiles_ of the Resource API
* and others as may be defined from time to time.

## Architectural Style

The REST architectural style is a convention-based approach to defining APIs
using the HTTP methods (GET, PUT, POST, DELETE, etc.), as the application
protocol.

REST-style architectures consist of clients and servers. Clients initiate
requests to servers; servers process requests and return appropriate responses.
Requests and responses are built around the transfer of representations of
Resources. As depicted below, a data store or server-based application
implements, exposes, or is wrapped with an Ed-Fi API to allow client
applications to exchange and manipulate education data.

![Image showing HTTP request and response between client and REST API service](Client-Server-Figure.png)

**Figure 1.** Interaction between REST API and client application

APIs can be thought of as a "contract" between data sources and client
applications. The underlying platform and application choices are unimportant in
terms of this contract. An Ed-Fi API follows this pattern. An Ed-Fi API imposes
no technical requirements on how data are internally stored or how they are used
by client applications. The API need only provide the technical contract between
a provider of data and its consumer applications, externally representing the
exchanged data Resources in a way that is aligned with the Ed-Fi UDM.

The same resource may be represented to different clients using different
representations. For example, an API application may represent a resource as
JSON for an application that is performing transactions, but may use XML to
represent the same resource for another purpose. The representation is a way to
externally represent the resource, but is not the resource itself. While some
use cases may remain for other format, all Ed-Fi API implementations _must_
support JSON representations.

There may be circumstances where an Ed-Fi API application would diverge from a
pure REST approach to support specific use cases, for example, to support
application-specific operations. Such use cases should be defined by their own
specifications, which can sit alongside the Ed-Fi specification implementation.

## Additional References

* **Domain-Driven Design**: see, e.g., Evans, Eric, et al. (2006), [Domain-Driven
Design Quickly](http://www.infoq.com/minibooks/domain-driven-design-quickly),
C4Media Inc., for a brief outline of Domain-Driven Design principles.
* **REST**: The key principles of REST are outlined in Fielding, Roy Thomas (2000),
[Architectural Styles and the Design of Network-Based Software
Architectures](http://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm),
Doctoral dissertation, University of California, Irvine.

## API Guidelines Contents

* [Scope](SCOPE.md)
* [Key Characteristics](KEY-CHARACTERISTICS.md)
* [Requirement Levels](REQUIREMENT-LEVELS.md)
* [API Design Guidelines](API-DESIGN-GUIDELINES/README.md)
* [API Implementation Guidelines](API-IMPLEMENTATION-GUIDELINES/README.md)
