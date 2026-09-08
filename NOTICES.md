# Ed-Fi-ODS

This product includes software developed at the [Ed-Fi
Alliance](https://www.ed-fi.org).

Copyright (c) 2024 Ed-Fi Alliance, LLC and contributors.

This software distribution includes or contains external references to several
open source packages that are attributed below in this notice. Where required,
copies of the license agreement are provided in separate files in the Licenses
subdirectory. Unless noted below, all open source software is distributed in its
original form without modification.

## 1EdTech Consortium

The OpenAPI specification
[api-specifications/oneroster/oneroster-api-1.2.yaml](api-specifications/oneroster/oneroster-api-1.2.yaml)
is licensed by 1EdTech Consortium, Inc. under the Apache License, Version 2.0.
It originates from the [Ed-Fi OneRoster
Service](https://docs.ed-fi.org/reference/oneroster), which was developed in
collaboration with 1EdTech Consortium, Inc., and it is redistributed here **with
modification**:

* The `servers` entry parameterized with a `host` variable in place of a
  hard-coded `http://localhost:3000`.
* A `description` added to the `oauth2_auth` security scheme, explaining the
  `{OAUTH_TOKEN_URL}` placeholder that each deployment replaces.
* An `x-ed-fi-publication-adaptations` extension listing the changes above.

1EdTech® and OneRoster® are trademarks of 1EdTech Consortium, Inc.
