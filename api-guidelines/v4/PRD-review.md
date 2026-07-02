# PRD Review: Ed-Fi API Application

**Reviewer:** Claude Code  
**Date:** 2026-06-21  
**Document:** PRD-ED-FI-API-APPLICATION.md

## Overall Assessment

This is a well-structured, comprehensive PRD. The requirements are clearly organized and use appropriate SHALL/SHOULD/MAY language. However, several areas require attention for accuracy, clarity, and completeness.

---

## Accuracy & Clarity Issues

### 1. Date Inconsistency (Line 6)

**Issue:** The document states "Date: June 2026" which is today's date.

**Problem:** Ambiguous intent — is this the target release date, document creation date, or version date?

**Recommendation:** Clarify with explicit language:
- If creation date: "Document Date: June 21, 2026"
- If target release: "Target Release: June 2026" or specify a more precise date
- If version date: "Version Date: June 2026 (v4.0)"

---

### 2. Case-Sensitivity Contradiction (FR-RES-9 vs FR-RES-40)

**Issue:** Two requirements appear to conflict:
- **Line 105 (FR-RES-9):** Routes and query parameters "SHOULD be treated as case-insensitive"
- **Line 154 (FR-RES-40):** Property names in POST/PUT bodies "SHOULD be treated as case-sensitive"

**Problem:** While technically correct (they apply to different contexts), the proximity could cause confusion.

**Recommendation:** Add clarifying note after FR-RES-9:
> "This applies to URL route segments and query parameter names (e.g., `/schools` vs `/Schools`). Note: property names in request bodies remain case-sensitive per FR-RES-40."

---

### 3. Vague Language in FR-DISC-8 (Line 86)

**Issue:** Phrase "must be a faithful representation" is subjective and unmeasurable.

**Recommendation:** Replace with measurable language:
> "must be a complete and accurate representation of all available resources, endpoints, and operations as implemented in the running application"

---

### 4. Oddly-Specific Optional Requirement (FR-DISC-7, Line 85)

**Issue:** "MAY also provide a GraphML representation" is a very specific format for an optional feature.

**Problem:** GraphML is a niche choice—why not other graph formats (DOT, JSON-LD)? This seems like an implementation detail rather than an architectural requirement.

**Recommendation:** Either:
- Move to Out of Scope if not planned, OR
- Generalize: "MAY provide alternate graph representations (e.g., GraphML, DOT) for dependency metadata"

---

### 5. Duplicate Requirements

**Issue:** FR-RES-44 (Line 164) and NFR-REL-3 (Line 245) both specify educationOrganizationId uniqueness:
- **FR-RES-44:** "The `educationOrganizationId` value SHALL be unique across all child entity types"
- **NFR-REL-3:** "The educationOrganizationId namespace SHALL be unique across all child entity types at all times"

**Recommendation:** Consolidate into one location (suggest keeping in FR-RES-44 as it's more specific) and reference from NFR-REL-3:
> **NFR-REL-3:** The educationOrganizationId namespace SHALL be unique across all child entity types per FR-RES-44.

---

## Missing or Unclear Sections

### 6. Critical Open Question: Extensions (OQ-5, Line 304)

**Issue:** OQ-5 asks "What subset of Ed-Fi UDM extensions will the application expose?" but provides no provisional guidance.

**Problem:** This affects:
- OpenAPI specification completeness
- Discovery API `dataModels` response
- URL namespace conventions (FR-RES-46)
- Client code generation

**Recommendation:** Add a placeholder decision or constraint:
> "Initial implementation targets core UDM only. Extension framework SHALL support namespaced extensions per FR-RES-45 and FR-RES-46."

---

### 7. Insufficient Natural Key Definition

**Issue:** Glossary defines natural key (Line 313) abstractly, but usage in FR-RES-5, FR-RES-22 requires concrete understanding.

**Problem:** Without examples, implementers may struggle. For instance, a "Student" resource might have multiple possible natural keys (social security number, state ID, local ID per district).

**Recommendation:** Expand glossary entry and add examples section:
- Student resource: natural key might be `educationOrganizationId` + `studentUniqueId`
- School resource: `educationOrganizationId` + `schoolId`

---

### 8. Missing: Content Negotiation Handling

**Issue:** FR-CT-1 (Line 210) specifies JSON default but doesn't address rejection scenarios.

**Problem:** Unclear behavior:
- If client sends `Accept: application/xml`, does server return 406 (Not Acceptable) or silently return JSON?
- Does the application support multiple formats or JSON-only?

**Recommendation:** Add clarification:
> **FR-CT-3** (new): If the application does not support the requested `Accept` media type, it SHALL return HTTP 406 (Not Acceptable), unless configured to support multiple formats.

---

## Security & Design Concerns

### 9. FR-RES-37: Silent Acceptance of Unknown Attributes

**Issue:** Line 151 recommends silently ignoring extra attributes in POST/PUT.

**Concern:** Could mask typos or enable subtle data quality issues:
- Client sends `misspelled_field: value` → ignored silently → client thinks field was saved

**Recommendation:** Add guardrail:
> "Extra attributes SHOULD be silently ignored except when they match known future extension namespaces (per FR-RES-45), which SHOULD be rejected with HTTP 400 if the extension is not supported."

---

### 10. Incomplete Authentication Details (Section 3.4)

**Issue:** FR-AUTH-2 through FR-AUTH-7 specify OAuth 2.0 client credentials but omit critical details:
- Token format (JWT? Opaque token? Custom?)
- Token lifetime and expiration
- Refresh mechanism (is it supported?)
- Scope claims (if JWT-based)
- Token revocation / blacklisting

**Recommendation:** Add new requirements or defer to OAuth spec:
> **FR-AUTH-8** (new): Bearer token format and lifetime requirements SHOULD be documented in the application's OAuth token endpoint documentation.

---

## Minor Observations

### 11. RFC 9457 Reference (FR-ERR-2)

**Status:** ✓ Good — Problem Details format is current standard (2023).

### 12. ETag Requirements (Section 3.5)

**Status:** ✓ Well-defined. OQ-2 appropriately captures the open decision.

### 13. Glossary Completeness

**Status:** ✓ Good coverage. Includes Ed-Fi specific terms and REST concepts.

---

## Completeness Checklist

| Area | Status | Notes |
|------|--------|-------|
| Discovery API | ✓ Complete | Well-specified; OQ about OAuth endpoint location is open |
| Resources API | ✓ Complete | Comprehensive CRUD coverage |
| Descriptors API | ✓ Complete | Good coverage; URI format is clear |
| Authentication | ⚠ Partial | OAuth 2.0 outlined; token format deferred |
| Authorization | ✓ Complete | Least-privilege principle clear |
| Error Handling | ✓ Complete | RFC 9457 referenced |
| Audit Logging | ✓ Complete | Minimum fields specified |
| ETags | ✓ Complete | Concurrency model clear |
| Validation | ✓ Complete | Data types and foreign keys covered |
| Performance | ⚠ Partial | Paging strategy open (OQ-3) |
| Extensions | ⚠ Partial | Framework present; scope open (OQ-5) |

---

## Recommended Next Steps

1. **Resolve Date**: Clarify intent of "June 2026" date
2. **Address OAuth Details**: Document token format, lifetime, and refresh strategy
3. **Consolidate Duplicates**: Merge FR-RES-44 and NFR-REL-3
4. **Clarify Case Sensitivity**: Add context note to FR-RES-9
5. **Make FR-DISC-8 Measurable**: Replace "faithful representation" with specific criteria
6. **Placeholder for Extensions**: Add provisional constraint for OQ-5

---

## Questions for Author

- Is GraphML specifically required for dependency metadata (FR-DISC-7), or should this be more flexible?
- Should the application reject unknown attributes with HTTP 400, or silently ignore them?
- Will token refresh be supported for OAuth 2.0 client credentials grants?

