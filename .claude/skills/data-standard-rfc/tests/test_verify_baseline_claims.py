# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

"""Tests for verify_baseline_claims.

Two groups:

* Parser tests on inline fixtures -- portable, always run. These cover the
  MetaEd grammar quirks, most importantly that indentation is NOT consistent
  across the real model (Application.metaed indents properties 2 spaces,
  OpenStaffPosition.metaed indents them 4), so the parser must be
  keyword-driven rather than indent-driven.

* Live-model tests -- skipped when the package is absent. These assert facts
  confirmed by hand against @edfi/ed-fi-model-6.1. Without them the parser
  could pass every fixture while mis-reading the real files.
"""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from resolve_model_package import is_model_package, resolve  # noqa: E402
from verify_baseline_claims import (  # noqa: E402
    ABSENT,
    CONFIRMED,
    MISMATCH,
    PROPOSED_NOT_CHECKED,
    find_name_collisions,
    load_entity,
    parse_entity_text,
    type_label,
    verify_claims,
)

# OpenStaffPosition-style: 4-space properties, 8-space attributes.
FOUR_SPACE = """Domain Entity OpenStaffPosition [572]
    documentation "An open staff position."
    descriptor EmploymentStatus [1549]
        documentation "Type of employment desired."
        is required
    shared string RequisitionNumber [1554]
        documentation "Requisition number from HR."
        is part of identity
    descriptor GradeLevel [1550]
        documentation "Grade levels the position covers."
        is optional collection
        role name Instructional
    domain entity EducationOrganization [1548]
        documentation "The ed org with the opening."
        is part of identity
    bool IsActive
        documentation "Whether the position is active."
        is optional
    shared decimal CompensationPackageAmount named MaxSalary
        documentation "Maximum salary."
        is optional
    shared string PositionControlNumber
        documentation "Identifier assigned to the position."
        is optional
"""

# Application-style: 2-space properties, 4-space attributes.
TWO_SPACE = """Domain Entity Application
  documentation "An application."
  date ApplicationDate
    documentation "When submitted."
    is required
  descriptor Term
    documentation "Intended term."
    is optional collection
  bool CurrentEmployee
    documentation "Is a current employee."
    is optional
"""

DEPRECATED_FIXTURE = """Domain Entity Legacy
    documentation "Legacy entity."
    shared string OldField
        documentation "Going away."
        is optional
        deprecated "Use NewField instead."
"""


class TestParserGrammar(unittest.TestCase):
    def test_parses_four_space_indentation(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertEqual(entity.name, "OpenStaffPosition")
        self.assertIn("EmploymentStatus", entity.field_names())

    def test_parses_two_space_indentation(self):
        """Indent-driven parsing would miss this file's properties entirely."""
        entity = parse_entity_text(TWO_SPACE)
        self.assertEqual(entity.name, "Application")
        self.assertEqual(
            sorted(entity.field_names()),
            ["ApplicationDate", "CurrentEmployee", "Term"],
        )

    def test_identity_is_detected(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertEqual(
            sorted(entity.identity_field_names()),
            ["EducationOrganization", "RequisitionNumber"],
        )

    def test_requiredness_is_detected(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertTrue(entity.field("EmploymentStatus").is_required)
        self.assertFalse(entity.field("IsActive").is_required)

    def test_identity_implies_required(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertTrue(entity.field("RequisitionNumber").is_required)

    def test_collection_is_detected(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertTrue(entity.field("InstructionalGradeLevel").is_collection)
        self.assertFalse(entity.field("IsActive").is_collection)

    def test_role_name_forms_the_effective_field_name(self):
        """`descriptor GradeLevel` + `role name Instructional` is
        InstructionalGradeLevel in the API and in the RFC tables."""
        entity = parse_entity_text(FOUR_SPACE)
        self.assertIn("InstructionalGradeLevel", entity.field_names())
        self.assertNotIn("GradeLevel", entity.field_names())
        self.assertEqual(entity.field("InstructionalGradeLevel").declared_name, "GradeLevel")

    def test_named_alias_becomes_the_field_name(self):
        """`shared decimal CompensationPackageAmount named MaxSalary` is MaxSalary."""
        entity = parse_entity_text(FOUR_SPACE)
        self.assertIn("MaxSalary", entity.field_names())
        self.assertNotIn("CompensationPackageAmount", entity.field_names())
        self.assertEqual(
            entity.field("MaxSalary").shared_type, "CompensationPackageAmount"
        )

    def test_deprecated_is_detected(self):
        entity = parse_entity_text(DEPRECATED_FIXTURE)
        self.assertTrue(entity.field("OldField").is_deprecated)

    def test_documentation_is_not_mistaken_for_a_property(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertNotIn("documentation", [n.lower() for n in entity.field_names()])


class TestTypeLabel(unittest.TestCase):
    def test_descriptor(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertEqual(type_label(entity.field("EmploymentStatus")), "Descriptor")

    def test_reference(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertEqual(
            type_label(entity.field("EducationOrganization")), "Reference"
        )

    def test_boolean(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertEqual(type_label(entity.field("IsActive")), "Boolean")

    def test_string_without_known_length(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertEqual(type_label(entity.field("PositionControlNumber")), "String")

    def test_string_with_known_length(self):
        entity = parse_entity_text(FOUR_SPACE)
        self.assertEqual(
            type_label(entity.field("PositionControlNumber"), max_length=20),
            "String (20)",
        )


class TestDirectionalGrounding(unittest.TestCase):
    """The core safety property: proposed elements are never looked up.

    An RFC describes changes that do not exist in the model yet. Reporting them
    as ABSENT would be noise at best and would pressure an author into
    'fixing' a correct proposal at worst.
    """

    def setUp(self):
        self.entity = parse_entity_text(FOUR_SPACE)
        self.entities = {"OpenStaffPosition": self.entity}

    def test_baseline_claim_that_holds_is_confirmed(self):
        results = verify_claims(
            [
                {
                    "entity": "OpenStaffPosition",
                    "field": "IsActive",
                    "direction": "baseline",
                    "expect": {"required": False},
                }
            ],
            entities=self.entities,
        )
        self.assertEqual(results[0].status, CONFIRMED)

    def test_baseline_claim_that_fails_is_a_mismatch(self):
        results = verify_claims(
            [
                {
                    "entity": "OpenStaffPosition",
                    "field": "IsActive",
                    "direction": "baseline",
                    "expect": {"required": True},
                }
            ],
            entities=self.entities,
        )
        self.assertEqual(results[0].status, MISMATCH)
        self.assertIn("required", results[0].detail.lower())

    def test_baseline_claim_for_a_missing_field_is_absent(self):
        results = verify_claims(
            [
                {
                    "entity": "OpenStaffPosition",
                    "field": "NoSuchField",
                    "direction": "baseline",
                    "expect": {"required": True},
                }
            ],
            entities=self.entities,
        )
        self.assertEqual(results[0].status, ABSENT)

    def test_proposed_claim_is_never_looked_up(self):
        results = verify_claims(
            [
                {
                    "entity": "OpenStaffPosition",
                    "field": "PositionVacancy",
                    "direction": "proposed",
                    "expect": {"required": False},
                }
            ],
            entities=self.entities,
        )
        self.assertEqual(results[0].status, PROPOSED_NOT_CHECKED)

    def test_proposed_claim_never_reports_absent_even_when_missing(self):
        """Regression guard for the whole point of directional grounding."""
        results = verify_claims(
            [
                {
                    "entity": "OpenStaffPosition",
                    "field": "TotallyNewThing",
                    "direction": "proposed",
                }
            ],
            entities=self.entities,
        )
        self.assertNotEqual(results[0].status, ABSENT)
        self.assertNotEqual(results[0].status, MISMATCH)

    def test_direction_defaults_to_baseline(self):
        """Omitting `direction` must not silently skip verification."""
        results = verify_claims(
            [
                {
                    "entity": "OpenStaffPosition",
                    "field": "IsActive",
                    "expect": {"required": False},
                }
            ],
            entities=self.entities,
        )
        self.assertEqual(results[0].status, CONFIRMED)

    def test_key_claim_confirmed(self):
        results = verify_claims(
            [
                {
                    "entity": "OpenStaffPosition",
                    "expect_key": ["RequisitionNumber", "EducationOrganization"],
                }
            ],
            entities=self.entities,
        )
        self.assertEqual(results[0].status, CONFIRMED)

    def test_key_claim_mismatch_names_the_difference(self):
        results = verify_claims(
            [{"entity": "OpenStaffPosition", "expect_key": ["RequisitionNumber"]}],
            entities=self.entities,
        )
        self.assertEqual(results[0].status, MISMATCH)
        self.assertIn("EducationOrganization", results[0].detail)

    def test_missing_entity_is_absent_not_an_exception(self):
        results = verify_claims(
            [{"entity": "NoSuchEntity", "field": "Whatever"}], entities=self.entities
        )
        self.assertEqual(results[0].status, ABSENT)


class TestNameCollisions(unittest.TestCase):
    def test_proposed_name_that_already_exists_is_flagged(self):
        entities = {"OpenStaffPosition": parse_entity_text(FOUR_SPACE)}
        collisions = find_name_collisions(["IsActive"], entities=entities)
        self.assertIn("IsActive", collisions)
        self.assertIn("OpenStaffPosition.IsActive", collisions["IsActive"])

    def test_genuinely_new_name_is_not_flagged(self):
        entities = {"OpenStaffPosition": parse_entity_text(FOUR_SPACE)}
        self.assertEqual(find_name_collisions(["PositionVacancy"], entities=entities), {})


_RES = resolve()
PACKAGE = Path(_RES.path) if _RES.ok else None


@unittest.skipUnless(
    PACKAGE is not None and is_model_package(PACKAGE),
    "live Ed-Fi model package not resolvable",
)
class TestAgainstLiveModel(unittest.TestCase):
    """Facts confirmed by hand against @edfi/ed-fi-model-6.1 on 2026-09-03.

    These are the claims RFC-29a and the Performance Evaluation DS-Need make
    about the current model. If the parser cannot reproduce them, directional
    grounding is worthless.
    """

    def test_open_staff_position_current_key(self):
        entity = load_entity(PACKAGE, "OpenStaffPosition")
        self.assertEqual(
            sorted(entity.identity_field_names()),
            ["EducationOrganization", "RequisitionNumber"],
        )

    def test_position_control_number_is_optional_today(self):
        entity = load_entity(PACKAGE, "OpenStaffPosition")
        self.assertFalse(entity.field("PositionControlNumber").is_required)

    def test_position_control_number_max_length_is_20(self):
        """RFC-29a types PositionIdentifier as String (20). That 20 lives in
        Shared/PositionControlNumber.metaed, not in the entity file."""
        entity = load_entity(PACKAGE, "OpenStaffPosition")
        field = entity.field("PositionControlNumber")
        self.assertEqual(type_label(field, package=PACKAGE), "String (20)")

    def test_instructional_grade_level_role_name_resolves(self):
        entity = load_entity(PACKAGE, "OpenStaffPosition")
        self.assertIn("InstructionalGradeLevel", entity.field_names())

    def test_is_active_exists_and_is_optional(self):
        entity = load_entity(PACKAGE, "OpenStaffPosition")
        self.assertFalse(entity.field("IsActive").is_required)

    def test_two_space_indented_entity_parses(self):
        """Application.metaed uses 2-space property indentation."""
        entity = load_entity(PACKAGE, "Application")
        self.assertIn("ApplicationDate", entity.field_names())

    def test_feedback_already_exists_on_evaluation_element_rating(self):
        """DS-Need 4.2 requires the new common be FeedbackEntry, not Feedback,
        because Feedback is already core. This is the collision check."""
        entity = load_entity(PACKAGE, "EvaluationElementRating")
        names = entity.field_names()
        self.assertIn("Feedback", names)
        self.assertIn("AreaOfRefinement", names)
        self.assertIn("AreaOfReinforcement", names)

    def test_feedback_collision_is_reported_from_the_real_model(self):
        collisions = find_name_collisions(["Feedback"], package=PACKAGE)
        self.assertIn("Feedback", collisions)

    def test_education_organization_reviewer_is_absent_from_core(self):
        """It exists only in the TPDM extension, so the DS-Need's 'add new
        entity' is correct."""
        self.assertIsNone(load_entity(PACKAGE, "EducationOrganizationReviewer"))

    def test_performance_evaluation_entities_exist_in_core(self):
        for name in (
            "Evaluation",
            "EvaluationRating",
            "EvaluationObjectiveRating",
            "EvaluationElementRating",
            "PerformanceEvaluation",
            "PerformanceEvaluationRating",
            "Goal",
            "FieldworkExperience",
        ):
            with self.subTest(entity=name):
                self.assertIsNotNone(load_entity(PACKAGE, name))

    def test_json_roundtrip_of_a_real_claim_set(self):
        claims = json.loads(
            json.dumps(
                [
                    {
                        "entity": "OpenStaffPosition",
                        "expect_key": [
                            "RequisitionNumber",
                            "EducationOrganization",
                        ],
                    },
                    {
                        "entity": "OpenStaffPosition",
                        "field": "PositionVacancy",
                        "direction": "proposed",
                    },
                ]
            )
        )
        results = verify_claims(claims, package=PACKAGE)
        self.assertEqual(results[0].status, CONFIRMED)
        self.assertEqual(results[1].status, PROPOSED_NOT_CHECKED)


if __name__ == "__main__":
    unittest.main()
