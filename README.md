# Ed-Fi API Specifications

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications/badge)](https://securityscorecards.dev/viewer/?uri=github.com/Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications)

The [Ed-Fi Alliance](https://www.ed-fi.org) coordinates and publishes
community-led standards and specifications for education and the exchange of education data.

The **Ed-Fi Data Standard** is the widely adopted, CEDS-aligned, open-source
data standard developed by the educational community for the betterment of the
community. The Ed-Fi Data Standard serves as the foundation for enabling
interoperability among secure data systems and contains a Unifying Data Model
designed to capture the meaning and inherent structure in the most important
information in the K–12 education enterprise. _[more
information](https://edfi.atlassian.net/wiki/spaces/ETKB/pages/20875600/Ed-Fi+Standards)_
↗

An **Ed-Fi compatible API application** creates a REST-based interface for data
exchange, where the messages conform to the Ed-Fi Data Standard. The **Ed-Fi
ODS/API** is the Ed-Fi Alliance's production-ready reference implementation of
an Ed-Fi API. Any interested party can build an alternate, compatible,
application, by adhering to the Open API specifications and guidance provided in
this space.

```none
+------------------+      +---------------------+      +-------------------+
|  Data Standard   | ---> |  API Specifications | ---> |   Application     |
+------------------+      +---------------------+      +-------------------+
| - Unifying Data  |      | - Resources API     |      | - Ed-Fi ODS/API   |
|   Model          |      | - Descriptors API   |      | - Ed-Fi DMS       |
| - Extensions     |      | - Management API    |      | - Ed-Fi Admin API |
+------------------+      +---------------------+      +-------------------+
```

## Building an Ed-Fi API Application

What makes an application an "Ed-Fi (compatible) API"? An Ed-Fi API must:

* Implement the following [Open API specifications](api-specifications):
  * Resources API (current version: [5.0](api-specifications/resources/5.0))
  * Descriptors API (current version:
    [5.0](api-specifications/descriptors/5.0))
  * Discovery API (current version: [1.0](api-specifications/discovery/1.0),
    draft revision: [2.0](api-specifications/discovery/2.0-draft))
* And, adhere all of the normative guidance in the [Ed-Fi API
  Guidelines](./api-guidelines/) (current version: [4.0](api-guidelines/v4.0/).

Also see: [Tips for Success in Building an Ed-Fi Compatible
API](./api-guidelines/TIPS-FOR-SUCCESS.md)

## Other Documents

* [2024 Migration and Revision Project](docs/2024-MIGRATION-AND-REVISION.md)

## Legal Information

Copyright (c) 2025 Ed-Fi Alliance, LLC and contributors.

Licensed under the [Apache License, Version 2.0](LICENSE) (the "License").

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

See [NOTICES](NOTICES.md) for additional copyright and license notifications.
