# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

"""Tests for resolve_model_package.

The point of this resolver is portability: the skill must not depend on one
machine's layout. These tests therefore build fake packages in tmp dirs and
never require the real model to be installed -- except for the clearly
separated live tests at the bottom, which skip when it is absent.
"""

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from resolve_model_package import (  # noqa: E402
    ENV_VAR,
    is_model_package,
    read_project_version,
    resolve,
)


def make_package(root, project_version="6.1.0", with_domain_entity=True):
    """Build a minimal directory that looks like an Ed-Fi MetaEd package."""
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    (root / "package.json").write_text(
        json.dumps(
            {
                "name": "@edfi/ed-fi-model-6.1",
                "version": "3.0.0-pre.90",
                "metaEdProject": {
                    "projectName": "Ed-Fi",
                    "projectVersion": project_version,
                },
            }
        ),
        encoding="utf-8",
    )
    if with_domain_entity:
        (root / "DomainEntity").mkdir(exist_ok=True)
        (root / "DomainEntity" / "Placeholder.metaed").write_text(
            "Domain Entity Placeholder\n", encoding="utf-8"
        )
    return root


class TestIsModelPackage(unittest.TestCase):
    def test_valid_package_is_recognized(self):
        with tempfile.TemporaryDirectory() as tmp:
            pkg = make_package(Path(tmp) / "package")
            self.assertTrue(is_model_package(pkg))

    def test_empty_dir_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertFalse(is_model_package(Path(tmp)))

    def test_missing_path_is_rejected(self):
        self.assertFalse(is_model_package(Path("/definitely/not/here/at/all")))

    def test_package_json_without_metaedproject_is_rejected(self):
        """A random node package is not an Ed-Fi model package."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "package"
            root.mkdir()
            (root / "package.json").write_text('{"name": "lodash"}', encoding="utf-8")
            (root / "DomainEntity").mkdir()
            self.assertFalse(is_model_package(root))

    def test_package_json_without_domain_entity_dir_is_rejected(self):
        """Guards against pointing at a parent dir that merely holds a manifest."""
        with tempfile.TemporaryDirectory() as tmp:
            pkg = make_package(Path(tmp) / "package", with_domain_entity=False)
            self.assertFalse(is_model_package(pkg))

    def test_malformed_package_json_is_rejected_not_raised(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "package"
            root.mkdir()
            (root / "package.json").write_text("{not json", encoding="utf-8")
            (root / "DomainEntity").mkdir()
            self.assertFalse(is_model_package(root))


class TestReadProjectVersion(unittest.TestCase):
    def test_reads_project_version(self):
        with tempfile.TemporaryDirectory() as tmp:
            pkg = make_package(Path(tmp) / "package", project_version="7.0.0")
            self.assertEqual(read_project_version(pkg), "7.0.0")


class TestResolve(unittest.TestCase):
    def test_env_var_wins(self):
        with tempfile.TemporaryDirectory() as tmp:
            wanted = make_package(Path(tmp) / "wanted", project_version="9.9.9")
            other = make_package(Path(tmp) / "other", project_version="1.1.1")
            res = resolve(
                env={ENV_VAR: str(wanted)}, candidates=[other]
            )
            self.assertTrue(res.ok)
            self.assertEqual(Path(res.path), wanted)
            self.assertEqual(res.project_version, "9.9.9")
            self.assertEqual(res.source, ENV_VAR)

    def test_invalid_env_var_does_not_silently_pass(self):
        """An env var pointing at junk must be reported, not trusted."""
        with tempfile.TemporaryDirectory() as tmp:
            junk = Path(tmp) / "junk"
            junk.mkdir()
            res = resolve(env={ENV_VAR: str(junk)}, candidates=[])
            self.assertFalse(res.ok)
            self.assertTrue(
                any(ENV_VAR in w for w in res.warnings),
                f"expected a warning naming {ENV_VAR}, got {res.warnings}",
            )

    def test_invalid_env_var_still_falls_back_to_candidate(self):
        with tempfile.TemporaryDirectory() as tmp:
            junk = Path(tmp) / "junk"
            junk.mkdir()
            good = make_package(Path(tmp) / "good")
            res = resolve(env={ENV_VAR: str(junk)}, candidates=[good])
            self.assertTrue(res.ok)
            self.assertEqual(Path(res.path), good)
            self.assertTrue(res.warnings)

    def test_falls_back_to_first_valid_candidate(self):
        with tempfile.TemporaryDirectory() as tmp:
            missing = Path(tmp) / "missing"
            good = make_package(Path(tmp) / "good")
            later = make_package(Path(tmp) / "later")
            res = resolve(env={}, candidates=[missing, good, later])
            self.assertTrue(res.ok)
            self.assertEqual(Path(res.path), good)

    def test_not_found_is_reported_not_raised(self):
        res = resolve(env={}, candidates=[Path("/nope/nothing/here")])
        self.assertFalse(res.ok)
        self.assertIsNone(res.path)
        self.assertIsNone(res.project_version)

    def test_not_found_message_is_actionable(self):
        """The failure path must tell the user how to fix it."""
        res = resolve(env={}, candidates=[])
        self.assertFalse(res.ok)
        self.assertIn(ENV_VAR, res.remedy)


REAL_PACKAGE = os.environ.get(ENV_VAR) or "C:/dev/models/Ed-Fi-Model/package"


@unittest.skipUnless(
    is_model_package(Path(REAL_PACKAGE)),
    f"live model package not present at {REAL_PACKAGE}",
)
class TestAgainstLiveModel(unittest.TestCase):
    """Confirms the validator accepts a real package, not just our fixtures.

    Without this, every test above could pass against a fixture shape that the
    real package does not actually have.
    """

    def test_real_package_is_recognized(self):
        self.assertTrue(is_model_package(Path(REAL_PACKAGE)))

    def test_real_package_reports_a_project_version(self):
        version = read_project_version(Path(REAL_PACKAGE))
        self.assertIsNotNone(version)
        self.assertRegex(version, r"^\d+\.\d+")


if __name__ == "__main__":
    unittest.main()
