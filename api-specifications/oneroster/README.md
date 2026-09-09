# Ed-Fi OneRoster API

[1EdTech® OneRoster®](https://www.imsglobal.org/spec/oneroster/v1p2) is a
standard for exchanging roster information — people, classes, courses,
organizations, and enrollments — between student information systems and the
applications that consume rosters. The **Ed-Fi OneRoster Service** is in
conformance with the 1EdTech® OneRoster® 1.2 Rostering service. It was developed
in collaboration with 1EdTech Consortium, Inc. and has been certified by 1EdTech.
See the [Ed-Fi OneRoster Service
documentation](https://docs.ed-fi.org/reference/oneroster) for installation,
configuration, and data mapping.

* [Ed-Fi OneRoster API (1.2)](./oneroster-api-1.2.yaml)

> [!IMPORTANT]
> This is the OpenAPI description of the Ed-Fi OneRoster Service, generated from
> that product. It describes only the read-only Rostering endpoints
> (`/ims/oneroster/rostering/v1p2/...`) that the service exposes.
>
> It is **not** the OneRoster specification. The normative definition of
> OneRoster is published by 1EdTech Consortium, Inc. at
> [imsglobal.org/spec/oneroster/v1p2](https://www.imsglobal.org/spec/oneroster/v1p2),
> and that document governs in any case of difference.

## Service Tags

Operations are grouped by the OneRoster service tags:

| Tag | Description |
| --- | --- |
| Rostering | Full set of rostering endpoints for people, classes, courses, organizations, and enrollments |
| Basic Rostering | Core rostering endpoints needed to establish who is in which class, and the organizational context |
| Convenience Rostering | Optional endpoints that simplify common client queries and navigation |
| Demographics | Demographics information associated with users |
| Basic Demographics | Minimal demographics supporting identity and basic profile use cases |

## Authorization

All operations use the OAuth 2.0 client credentials flow with the OneRoster 1.2
scopes:

* `https://purl.imsglobal.org/spec/or/v1p2/scope/roster-core.readonly`
* `https://purl.imsglobal.org/spec/or/v1p2/scope/roster.readonly`
* `https://purl.imsglobal.org/spec/or/v1p2/scope/roster-demographics.readonly`

The token endpoint appears in the specification as the placeholder
`{OAUTH_TOKEN_URL}`, which each deployment replaces with the token endpoint of
its OAuth issuer.

## Refreshing this file

`oneroster-api-1.2.yaml` is generated from `config/swagger.yml` in
[Ed-Fi-Alliance-OSS/edfi-oneroster](https://github.com/Ed-Fi-Alliance-OSS/edfi-oneroster).
It is a **port, not a copy**: three publication-only fields differ from the
product, and overwriting this file with the product's would drop them.

To refresh, copy the product's file over this one and then restore the three
adaptations:

```bash
cp <path-to>/edfi-oneroster/config/swagger.yml api-specifications/oneroster/oneroster-api-1.2.yaml
git diff api-specifications/oneroster/oneroster-api-1.2.yaml
```

The diff shows each adaptation as a deletion. Restore them with `git checkout
-p` on those hunks, or re-paste them from the table below.

The three adaptations are permanent:

| Adaptation | Why it only exists here |
| --- | --- |
| `servers` | The service rebuilds this per request from its configured host and tenant/context routing, so a value set in the product never reaches a client |
| `oauth2_auth.description` | The service rebuilds its security schemes and supplies its own description, discarding whatever the product holds |
| `x-ed-fi-publication-adaptations` | The list describes this document, so it has no meaning in the product |

---

1EdTech® and OneRoster® are trademarks of 1EdTech Consortium, Inc.
