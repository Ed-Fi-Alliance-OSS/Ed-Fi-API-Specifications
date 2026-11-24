# Ed-Fi RFC Review Checklist

Work through each group. Record every failure as a finding with the section,
the quoted text, and the fix. Rank findings: **Blocking** (model errors,
contradictions, missing breaking-change detail), **Should fix** (missing
sections or evidence), **Nit** (style, formatting).

## 1. Header and Identity

- [ ] One H1 in the form `# Ed-Fi RFC <NN><letter>: <Title>`.
- [ ] Product, Affects, Obsoletes, Obsoleted By, Status, Author, and Date all
      present, in the template format.
- [ ] No placeholders anywhere (`[date]`, `[TBD]`, `<...>`, "coming soon").
- [ ] Status is one of `Draft`, `Early Access`, `Active`, `Published`,
      `Obsolete`.
- [ ] Obsoletes links the replaced RFC, and the body explains what carried
      over and what changed.
- [ ] File name follows `RFC-<NN><letter>_<Title-With-Hyphens>.md`, and
      `RFC/README.md` lists it with a link that resolves.

## 2. Synopsis

- [ ] States what is introduced or changed, the problem, breaking or not,
      target release, and the comment link.
- [ ] Every claim matches the body. Compare verbs: "will be deprecated" vs.
      "deprecation is proposed" vs. "removed".
- [ ] Lists anything still missing if the draft is incomplete.

## 3. Problem and Evidence

- [ ] Describes the current model precisely (entities, keys, elements).
- [ ] Names the concrete failure implementers face today.
- [ ] Names at least one field implementation, requirement source, or
      external standard. Notes where surveyed implementers reported no use.
- [ ] Links Jira tickets and/or GitHub Issues roadmap items.
- [ ] Quantifies impact where a number exists.

## 4. Use Cases

- [ ] Each use case names an actor, an action, and an outcome.
- [ ] Each use case maps to entities in the Model.
- [ ] Use cases do not just restate the Background.

## 5. Design Rationale

- [ ] Answers "why not reuse or extend the existing structure?" with reasons.
- [ ] Provides a mapping when an overlapping model exists.
- [ ] States what happens to existing structures and which to use when.
- [ ] Lists differences from the source model when promoting an extension or
      community model, each with a reason.
- [ ] States out-of-scope items.

## 6. Model Consistency

For each new or changed element, check these places agree on name, type,
length, required/optional, collection, and key membership:

- [ ] Synopsis
- [ ] ER diagram
- [ ] Identity and Properties tables
- [ ] Prose descriptions
- [ ] Breaking Changes tables
- [ ] API resource and route names (for example, `StudentIEP` →
      `/ed-fi/studentIEPs`)

Also:

- [ ] The diagram has a notation legend.
- [ ] The diagram renders: attributes are `type name "comment"`, no nested or
      multi-word attribute names, no references to internal working files.
- [ ] New and changed entities are highlighted; unchanged entities show only
      keys.
- [ ] For changes, current and proposed are shown side by side.
- [ ] Every type has its length or precision.
- [ ] Every description is an implementable definition, not only a change
      note.
- [ ] Every existing entity, element, and descriptor named actually exists in
      the target Data Standard version (check with
      `ed-fi-api-spec`).
- [ ] Each new descriptor has a definition and proposed values or a source.
- [ ] Cardinality between entities is stated in prose and matches the
      diagram.
- [ ] History semantics are stated (new record vs. update).
- [ ] Date semantics (inclusive vs. exclusive) are stated where dates bound a
      period.
- [ ] The combined natural key size will not exceed the size limit when turned
      into a clustered index in MSSQL.

## 7. Conventions

- [ ] String identities end in `Identifier`.
- [ ] Names are agnostic, not state- or vendor-specific.
- [ ] No widely used descriptor is repurposed for a new meaning.
- [ ] Every `Required` and identity element can be supplied by every SEA,
      LEA, and vendor, including where collection is restricted by law.
      Challenge each one.

## 8. Authorization and Identity

- [ ] Each identity part is justified.
- [ ] The authorization approach is stated (education organization,
      namespace, person-based).
- [ ] Reference changes that could affect authorization are called out.
- [ ] Open questions about keys are listed in Questions for the Community.

## 9. Breaking Changes and Migration

- [ ] Breaking or non-breaking is stated, with what that means here.
- [ ] Identity changes have an old-key vs. new-key table.
- [ ] Every removed, renamed, relocated, and deprecated element is listed with
      its replacement and reason.
- [ ] Deprecation timeline is given in Data Standard versions.
- [ ] Any deletion without deprecation is justified.
- [ ] Migration guidance covers data mapping and source-system cleanup.

## 10. API

- [ ] Resource and route table, with namespace and operations.
- [ ] Conformance statement referencing the Ed-Fi API Design and
      Implementation Guidelines, with precedence stated.
- [ ] OpenAPI link or publication plan.
- [ ] At least one realistic JSON example for a non-obvious resource.

## 11. Community Engagement

- [ ] Review history with dates (DSWG, SIGs, vendor feedback summary).
- [ ] Questions are numbered and citable, give context and trade-offs, and
      are answerable.
- [ ] The body points to the relevant question wherever an issue is open.
- [ ] Feedback venue is a link, and respondents are told what context to
      include.
- [ ] Target release and comment window are stated.

## 12. Hygiene

- [ ] Passes `.markdownlint.yaml` (underscore emphasis, consistent list
      markers, leading and trailing table pipes, allowed inline HTML only).
- [ ] Real headings, not bold text in headings.
- [ ] Acronyms expanded on first use.
- [ ] Element names in backticks, spelled as in the model.
- [ ] Absolute dates only.
- [ ] Product and standard names spelled correctly.
- [ ] No repeated paragraphs; each point made once.
- [ ] LF line endings, two-space indentation.
