#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.
"""Locate the Ed-Fi MetaEd model package, portably.

The RFC skill verifies backward-facing model claims against `.metaed` source.
That source lives in a different place on every machine, so the path is
resolved at runtime and never hardcoded.

Resolution order, first valid hit wins:

  1. $EDFI_MODEL_PACKAGE_PATH
  2. Known candidate locations
  3. Newest MetaEd IDE VS Code extension bundle

On failure this exits non-zero with an actionable remedy. It never returns a
path it has not validated -- a resolver that guesses is worse than one that
admits it found nothing, because the caller would then assert unverified model
claims as fact.

Usage:
    python resolve_model_package.py           # human-readable
    python resolve_model_package.py --json    # machine-readable
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ENV_VAR = "EDFI_MODEL_PACKAGE_PATH"

_REMEDY = (
    "Set " + ENV_VAR + " to the Ed-Fi MetaEd model package directory -- the "
    "one containing package.json and a DomainEntity/ folder. For example:\n"
    '    export ' + ENV_VAR + '="C:/dev/models/Ed-Fi-Model/package"\n'
    "Without it, every backward-facing model claim in the RFC must be marked "
    "[Verify] and the run summary must lead with "
    "'model grounding UNVERIFIED - package not resolved'."
)


@dataclass
class Resolution:
    ok: bool
    path: str | None = None
    project_version: str | None = None
    package_version: str | None = None
    source: str | None = None
    warnings: list[str] = field(default_factory=list)
    remedy: str = _REMEDY


def _read_manifest(package_dir: Path) -> dict | None:
    manifest = package_dir / "package.json"
    try:
        with open(manifest, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def is_model_package(package_dir) -> bool:
    """True only for a directory that is genuinely a MetaEd model package.

    Requires BOTH a package.json carrying a `metaEdProject` block AND a
    DomainEntity/ directory. Checking only one lets a plain node package, or a
    parent directory that merely holds a manifest, pass as a model package --
    and a validator that accepts the wrong directory produces confident, wrong
    answers instead of an honest failure.
    """
    package_dir = Path(package_dir)
    if not package_dir.is_dir():
        return False
    if not (package_dir / "DomainEntity").is_dir():
        return False
    data = _read_manifest(package_dir)
    if data is None:
        return False
    return isinstance(data.get("metaEdProject"), dict)


def read_project_version(package_dir) -> str | None:
    """The MetaEd projectVersion, e.g. '6.1.0'. None if unreadable."""
    data = _read_manifest(Path(package_dir))
    if data is None:
        return None
    project = data.get("metaEdProject")
    if not isinstance(project, dict):
        return None
    version = project.get("projectVersion")
    return str(version) if version is not None else None


def read_package_version(package_dir) -> str | None:
    """The npm package version, e.g. '3.0.0-pre.90'. None if unreadable."""
    data = _read_manifest(Path(package_dir))
    if data is None:
        return None
    version = data.get("version")
    return str(version) if version is not None else None


def _git_root(start: Path) -> Path | None:
    for parent in [start, *start.parents]:
        if (parent / ".git").exists():
            return parent
    return None


def _version_key(path: Path) -> list[int]:
    nums = [int(n) for n in re.findall(r"\d+", path.name)]
    return nums or [0]


def _extension_candidates(home: Path) -> list[Path]:
    """Model packages bundled inside the MetaEd IDE VS Code extension.

    Sorted newest-first by version, so a machine with several installed
    extension versions grounds against the most recent.
    """
    ext_root = home / ".vscode" / "extensions"
    if not ext_root.is_dir():
        return []

    found: list[Path] = []
    try:
        exts = sorted(
            (
                p
                for p in ext_root.glob("ed-fialliance.vscode-metaed-ide-*")
                if p.is_dir()
            ),
            key=_version_key,
            reverse=True,
        )
    except OSError:
        return []

    for ext in exts:
        edfi = ext / "node_modules" / "@edfi"
        if not edfi.is_dir():
            continue
        try:
            models = sorted(
                (p for p in edfi.glob("ed-fi-model-*") if p.is_dir()),
                key=_version_key,
                reverse=True,
            )
        except OSError:
            continue
        for model in models:
            found.append(model / "package")
            found.append(model)
    return found


def default_candidates(cwd: Path | None = None, home: Path | None = None) -> list[Path]:
    cwd = Path(cwd) if cwd else Path.cwd()
    home = Path(home) if home else Path.home()

    candidates: list[Path] = []
    root = _git_root(cwd)
    if root is not None:
        candidates.append(root / "models" / "Ed-Fi-Model" / "package")
    candidates += [
        home / "dev" / "models" / "Ed-Fi-Model" / "package",
        Path("C:/dev/models/Ed-Fi-Model/package"),
        Path("/c/dev/models/Ed-Fi-Model/package"),
    ]
    candidates += _extension_candidates(home)
    return candidates


def resolve(env=None, candidates=None) -> Resolution:
    env = os.environ if env is None else env
    warnings: list[str] = []

    configured = env.get(ENV_VAR)
    if configured:
        if is_model_package(configured):
            return _describe(Path(configured), ENV_VAR, warnings)
        warnings.append(
            ENV_VAR + " is set to " + repr(configured) + " but that is not a "
            "MetaEd model package (needs package.json with a metaEdProject "
            "block, and a DomainEntity/ directory). Ignoring it and trying "
            "known locations."
        )

    search = default_candidates() if candidates is None else candidates
    for candidate in search:
        if is_model_package(candidate):
            return _describe(Path(candidate), "candidate path", warnings)

    return Resolution(ok=False, warnings=warnings)


def _describe(package_dir: Path, source: str, warnings: list[str]) -> Resolution:
    return Resolution(
        ok=True,
        path=str(package_dir),
        project_version=read_project_version(package_dir),
        package_version=read_package_version(package_dir),
        source=source,
        warnings=warnings,
    )


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Locate the Ed-Fi model package.")
    parser.add_argument("--json", action="store_true", help="emit JSON")
    args = parser.parse_args(argv)

    res = resolve()

    if args.json:
        print(
            json.dumps(
                {
                    "ok": res.ok,
                    "path": res.path,
                    "projectVersion": res.project_version,
                    "packageVersion": res.package_version,
                    "source": res.source,
                    "warnings": res.warnings,
                    "remedy": None if res.ok else res.remedy,
                },
                indent=2,
            )
        )
        return 0 if res.ok else 1

    for warning in res.warnings:
        print("WARNING: " + warning, file=sys.stderr)

    if not res.ok:
        print("model grounding UNVERIFIED - package not resolved", file=sys.stderr)
        print(res.remedy, file=sys.stderr)
        return 1

    print("path            : " + str(res.path))
    print("projectVersion  : " + str(res.project_version))
    print("packageVersion  : " + str(res.package_version))
    print("resolved via    : " + str(res.source))
    return 0


if __name__ == "__main__":
    sys.exit(main())
