#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.
"""Verify an RFC's *backward-facing* model claims against MetaEd source.

Directional grounding, the rule this script exists to enforce:

  * BASELINE claims -- "existing field, unchanged", "retained", "renamed from
    X", "relocated from Y", "deprecate Z", "the current key is K" -- are
    statements about the model as it is today. They are verified.

  * PROPOSED claims -- new entities, fields, descriptors, commons -- are
    statements about a model that does not exist yet. They are NEVER looked
    up. A proposed element is *supposed* to be absent; reporting it as
    missing is noise, and worse, it pressures an author into "fixing" a
    correct proposal.

  * Proposed NAMES are still checked for collision with existing ones. This is
    the Feedback -> FeedbackEntry case: the proposal is sound but the name is
    taken.

Claim format (JSON list on stdin or via --claims):

    [
      {"entity": "OpenStaffPosition",
       "expect_key": ["RequisitionNumber", "EducationOrganization"]},

      {"entity": "OpenStaffPosition", "field": "IsActive",
       "direction": "baseline", "expect": {"required": false}},

      {"entity": "OpenStaffPosition", "field": "PositionVacancy",
       "direction": "proposed"}
    ]

`direction` defaults to "baseline" -- omitting it must not silently skip
verification.

Usage:
    python verify_baseline_claims.py --claims claims.json
    python verify_baseline_claims.py --claims claims.json --json
    python verify_baseline_claims.py --collisions FeedbackEntry,Requisition
    python verify_baseline_claims.py --dump-entity OpenStaffPosition
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field as dataclass_field
from pathlib import Path

from resolve_model_package import resolve

CONFIRMED = "CONFIRMED"
MISMATCH = "MISMATCH"
ABSENT = "ABSENT"
PROPOSED_NOT_CHECKED = "PROPOSED_NOT_CHECKED"
COLLISION = "COLLISION"
UNVERIFIABLE = "UNVERIFIABLE"

BASELINE = "baseline"
PROPOSED = "proposed"

# Directories in the package that hold entity-shaped definitions.
ENTITY_DIRS = ("DomainEntity", "Association", "Common", "Descriptor", "Choice")

# MetaEd property type keywords. Order matters: longest first, so
# "shared string" is matched before "string" and "inline common" before
# "common".
TYPE_KEYWORDS = (
    "inline common",
    "domain entity",
    "shared string",
    "shared decimal",
    "shared integer",
    "shared short",
    "association",
    "descriptor",
    "enumeration",
    "datetime",
    "duration",
    "currency",
    "integer",
    "percent",
    "decimal",
    "common",
    "choice",
    "string",
    "short",
    "date",
    "time",
    "bool",
    "year",
)

# Attribute lines that belong to the property above them. Anything starting
# with one of these is never treated as a property declaration.
ATTRIBUTE_PREFIXES = (
    "documentation",
    "is required",
    "is optional",
    "is part of identity",
    "is queryable",
    "role name",
    "merge",
    "max length",
    "min length",
    "min value",
    "max value",
    "total digits",
    "decimal places",
    "deprecated",
    "renames identity property",
    "allow primary key updates",
    "is weak reference",
)

_TYPE_LABELS = {
    "descriptor": "Descriptor",
    "domain entity": "Reference",
    "association": "Reference",
    "common": "Common",
    "inline common": "Common",
    "choice": "Choice",
    "enumeration": "Enumeration",
    "bool": "Boolean",
    "date": "Date",
    "datetime": "Datetime",
    "time": "Time",
    "duration": "Duration",
    "integer": "Integer",
    "shared integer": "Integer",
    "short": "Integer",
    "shared short": "Integer",
    "decimal": "Decimal",
    "shared decimal": "Decimal",
    "currency": "Currency",
    "percent": "Percent",
    "year": "Year",
    "string": "String",
    "shared string": "String",
}

_PROPERTY_RE = re.compile(
    r"^(?P<type>" + "|".join(TYPE_KEYWORDS) + r")\s+"
    r"(?P<name>[A-Z][A-Za-z0-9]*)"
    r"(?:\s*\[\d+\])?"
    r"(?:\s+named\s+(?P<alias>[A-Z][A-Za-z0-9]*))?"
    r"\s*$"
)


@dataclass
class Property:
    declared_name: str
    metaed_type: str
    alias: str | None = None
    role_name: str | None = None
    is_identity: bool = False
    is_collection: bool = False
    is_deprecated: bool = False
    _requiredness: str | None = None
    max_length: int | None = None

    @property
    def name(self) -> str:
        """The effective field name, as it appears in the API and in RFC tables."""
        base = self.alias or self.declared_name
        if self.role_name:
            return self.role_name + base
        return base

    @property
    def shared_type(self) -> str | None:
        """For `shared X Y named Z`, the shared simple type name (Y)."""
        if self.metaed_type.startswith("shared") and self.alias:
            return self.declared_name
        if self.metaed_type.startswith("shared"):
            return self.declared_name
        return None

    @property
    def is_required(self) -> bool:
        if self.is_identity:
            return True
        return self._requiredness == "required"


@dataclass
class Entity:
    name: str
    kind: str = "Domain Entity"
    properties: list[Property] = dataclass_field(default_factory=list)

    def field_names(self) -> list[str]:
        return [p.name for p in self.properties]

    def field(self, name: str) -> Property | None:
        for prop in self.properties:
            if prop.name == name:
                return prop
        return None

    def identity_field_names(self) -> list[str]:
        return [p.name for p in self.properties if p.is_identity]


@dataclass
class ClaimResult:
    status: str
    claim: dict
    detail: str = ""

    @property
    def label(self) -> str:
        entity = self.claim.get("entity", "?")
        name = self.claim.get("field")
        return entity + "." + name if name else entity


_HEADER_RE = re.compile(
    r"^(Domain Entity|Association|Common|Inline Common|Descriptor|Choice|"
    r"Enumeration|Shared String|Shared Decimal|Shared Integer|Shared Short)\s+"
    r"(?P<name>[A-Za-z0-9]+)"
)


def parse_entity_text(text: str) -> Entity:
    """Parse a .metaed file body into an Entity.

    Deliberately indentation-independent. The real model is inconsistent:
    Application.metaed indents properties by 2 spaces while
    OpenStaffPosition.metaed uses 4. An indent-driven parser silently reads
    zero properties from half the files.
    """
    entity = Entity(name="", properties=[])
    current: Property | None = None

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue

        header = _HEADER_RE.match(line)
        if header and entity.name == "":
            entity.kind = line.split(header.group("name"))[0].strip()
            entity.name = header.group("name")
            current = None
            continue

        lowered = line.lower()

        if lowered.startswith(ATTRIBUTE_PREFIXES):
            if current is not None:
                _apply_attribute(current, line, lowered)
            continue

        match = _PROPERTY_RE.match(line)
        if match:
            current = Property(
                declared_name=match.group("name"),
                metaed_type=match.group("type"),
                alias=match.group("alias"),
            )
            entity.properties.append(current)

    return entity


def _apply_attribute(prop: Property, line: str, lowered: str) -> None:
    if lowered.startswith("is part of identity"):
        prop.is_identity = True
    elif lowered.startswith("is required collection"):
        prop._requiredness = "required"
        prop.is_collection = True
    elif lowered.startswith("is optional collection"):
        prop._requiredness = "optional"
        prop.is_collection = True
    elif lowered.startswith("is required"):
        prop._requiredness = "required"
    elif lowered.startswith("is optional"):
        prop._requiredness = "optional"
    elif lowered.startswith("role name"):
        parts = line.split()
        if len(parts) >= 3:
            prop.role_name = parts[2]
    elif lowered.startswith("deprecated"):
        prop.is_deprecated = True
    elif lowered.startswith("max length"):
        found = re.findall(r"\d+", line)
        if found:
            prop.max_length = int(found[0])


def find_entity_file(package, name: str) -> Path | None:
    package = Path(package)
    for directory in ENTITY_DIRS:
        candidate = package / directory / (name + ".metaed")
        if candidate.is_file():
            return candidate
    return None


def load_entity(package, name: str) -> Entity | None:
    path = find_entity_file(package, name)
    if path is None:
        return None
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    return parse_entity_text(text)


def resolve_shared_max_length(package, shared_name: str) -> int | None:
    """A `shared string X` gets its length from Shared/X.metaed, not the entity.

    RFC-29a's `String (20)` for PositionIdentifier is exactly this lookup.
    """
    path = Path(package) / "Shared" / (shared_name + ".metaed")
    if not path.is_file():
        return None
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    match = re.search(r"^\s*max length\s+(\d+)", text, re.MULTILINE)
    return int(match.group(1)) if match else None


def type_label(prop: Property, package=None, max_length: int | None = None) -> str:
    """The Type-column value for an RFC Identity/Properties table."""
    base = _TYPE_LABELS.get(prop.metaed_type, prop.metaed_type.title())

    if base == "String":
        length = max_length if max_length is not None else prop.max_length
        if length is None and package is not None and prop.shared_type:
            length = resolve_shared_max_length(package, prop.shared_type)
        if length is not None:
            base = "String (" + str(length) + ")"

    if prop.is_collection:
        base += " collection"
    return base


def _load_entities(package, names) -> dict:
    loaded = {}
    for name in names:
        if name and name not in loaded:
            entity = load_entity(package, name)
            if entity is not None:
                loaded[name] = entity
    return loaded


def verify_claims(claims, package=None, entities=None) -> list[ClaimResult]:
    """Verify baseline claims; refuse to look up proposed ones."""
    if entities is None:
        if package is None:
            raise ValueError("verify_claims needs either `package` or `entities`")
        entities = _load_entities(package, {c.get("entity") for c in claims})

    results: list[ClaimResult] = []
    for claim in claims:
        direction = claim.get("direction", BASELINE)

        if direction == PROPOSED:
            results.append(
                ClaimResult(
                    PROPOSED_NOT_CHECKED,
                    claim,
                    "Proposed element -- not looked up by design.",
                )
            )
            continue

        entity_name = claim.get("entity")
        entity = entities.get(entity_name)
        if entity is None:
            results.append(
                ClaimResult(
                    ABSENT,
                    claim,
                    "Entity " + repr(entity_name) + " not found in core model.",
                )
            )
            continue

        if "expect_key" in claim:
            results.append(_verify_key(claim, entity, package))
            continue

        results.append(_verify_field(claim, entity, package))

    return results


def _verify_key(claim, entity, package) -> ClaimResult:
    expected = sorted(claim["expect_key"])
    actual = sorted(entity.identity_field_names())
    if expected == actual:
        return ClaimResult(
            CONFIRMED, claim, "Key is " + ", ".join(actual) + "."
        )
    missing = [n for n in actual if n not in expected]
    extra = [n for n in expected if n not in actual]
    bits = []
    if missing:
        bits.append("claim omits " + ", ".join(missing))
    if extra:
        bits.append("claim adds " + ", ".join(extra))
    return ClaimResult(
        MISMATCH,
        claim,
        "Actual key is " + ", ".join(actual) + "; " + "; ".join(bits) + ".",
    )


def _verify_field(claim, entity, package) -> ClaimResult:
    field_name = claim.get("field")
    if not field_name:
        return ClaimResult(UNVERIFIABLE, claim, "No `field` or `expect_key` given.")

    prop = entity.field(field_name)
    if prop is None:
        return ClaimResult(
            ABSENT,
            claim,
            field_name + " not found on " + entity.name + ".",
        )

    expect = claim.get("expect") or {}
    problems = []

    if "required" in expect and bool(expect["required"]) != prop.is_required:
        problems.append(
            "claim says required=" + str(bool(expect["required"]))
            + " but model says required=" + str(prop.is_required)
        )
    if "identity" in expect and bool(expect["identity"]) != prop.is_identity:
        problems.append(
            "claim says identity=" + str(bool(expect["identity"]))
            + " but model says identity=" + str(prop.is_identity)
        )
    if "collection" in expect and bool(expect["collection"]) != prop.is_collection:
        problems.append(
            "claim says collection=" + str(bool(expect["collection"]))
            + " but model says collection=" + str(prop.is_collection)
        )
    if "deprecated" in expect and bool(expect["deprecated"]) != prop.is_deprecated:
        problems.append(
            "claim says deprecated=" + str(bool(expect["deprecated"]))
            + " but model says deprecated=" + str(prop.is_deprecated)
        )
    if "type" in expect:
        actual_type = type_label(prop, package=package)
        if expect["type"] != actual_type:
            problems.append(
                "claim says type=" + repr(expect["type"])
                + " but model says type=" + repr(actual_type)
            )

    if problems:
        return ClaimResult(MISMATCH, claim, "; ".join(problems) + ".")

    return ClaimResult(
        CONFIRMED,
        claim,
        entity.name + "." + prop.name + " is "
        + type_label(prop, package=package)
        + (", required" if prop.is_required else ", optional")
        + (", identity" if prop.is_identity else "")
        + ".",
    )


def find_name_collisions(proposed_names, package=None, entities=None) -> dict:
    """Report proposed names that are already taken in the model.

    Returns {proposed_name: ["Entity.Field", "OtherEntity", ...]} for hits
    only. An empty dict means every proposed name is free.
    """
    hits: dict[str, list[str]] = {}

    if entities is None:
        if package is None:
            raise ValueError("find_name_collisions needs `package` or `entities`")
        package = Path(package)
        for name in proposed_names:
            found = []
            if find_entity_file(package, name) is not None:
                found.append(name + " (entity)")
            for directory in ENTITY_DIRS:
                folder = package / directory
                if not folder.is_dir():
                    continue
                for path in folder.glob("*.metaed"):
                    entity = parse_entity_text(path.read_text(encoding="utf-8"))
                    if entity.field(name) is not None:
                        found.append(entity.name + "." + name)
            if found:
                hits[name] = found
        return hits

    for name in proposed_names:
        found = []
        for entity in entities.values():
            if entity.name == name:
                found.append(name + " (entity)")
            if entity.field(name) is not None:
                found.append(entity.name + "." + name)
        if found:
            hits[name] = found
    return hits


def _package_or_die() -> Path:
    res = resolve()
    if not res.ok:
        print("model grounding UNVERIFIED - package not resolved", file=sys.stderr)
        print(res.remedy, file=sys.stderr)
        raise SystemExit(2)
    print(
        "grounded against: " + str(res.path)
        + " (projectVersion " + str(res.project_version) + ")",
        file=sys.stderr,
    )
    return Path(res.path)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Verify backward-facing RFC model claims."
    )
    parser.add_argument("--claims", help="path to a JSON claim list, or - for stdin")
    parser.add_argument("--collisions", help="comma-separated proposed names to check")
    parser.add_argument("--dump-entity", help="print a parsed entity and exit")
    parser.add_argument("--json", action="store_true", help="emit JSON")
    args = parser.parse_args(argv)

    package = _package_or_die()

    if args.dump_entity:
        entity = load_entity(package, args.dump_entity)
        if entity is None:
            print("ABSENT from core: " + args.dump_entity)
            return 1
        print(entity.kind + " " + entity.name)
        for prop in entity.properties:
            flags = []
            if prop.is_identity:
                flags.append("identity")
            flags.append("required" if prop.is_required else "optional")
            if prop.is_collection:
                flags.append("collection")
            if prop.is_deprecated:
                flags.append("deprecated")
            print(
                "  " + prop.name.ljust(34)
                + type_label(prop, package=package).ljust(22)
                + ", ".join(flags)
            )
        return 0

    if args.collisions:
        names = [n.strip() for n in args.collisions.split(",") if n.strip()]
        hits = find_name_collisions(names, package=package)
        if args.json:
            print(json.dumps(hits, indent=2))
        elif not hits:
            print("No collisions: " + ", ".join(names) + " are all free.")
        else:
            for name, where in hits.items():
                print("COLLISION  " + name + " -> " + ", ".join(where))
        return 1 if hits else 0

    if not args.claims:
        parser.error("one of --claims, --collisions or --dump-entity is required")

    text = sys.stdin.read() if args.claims == "-" else Path(args.claims).read_text(
        encoding="utf-8"
    )
    claims = json.loads(text)
    results = verify_claims(claims, package=package)

    if args.json:
        print(
            json.dumps(
                [
                    {"status": r.status, "claim": r.claim, "detail": r.detail}
                    for r in results
                ],
                indent=2,
            )
        )
    else:
        for res in results:
            print(res.status.ljust(21) + res.label.ljust(46) + res.detail)

    bad = [r for r in results if r.status in (MISMATCH, ABSENT, UNVERIFIABLE)]
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
