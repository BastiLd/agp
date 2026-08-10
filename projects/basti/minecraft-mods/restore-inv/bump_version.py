#!/usr/bin/env python3
"""
Erhöht die Mod-Version in gradle.properties.

Verwendung:
    python bump_version.py                # patch +1 (Standard)
    python bump_version.py patch          # 2.0.5 -> 2.0.6
    python bump_version.py minor          # 2.0.5 -> 2.1.0
    python bump_version.py major          # 2.0.5 -> 3.0.0
    python bump_version.py 3.1.4          # explizit auf 3.1.4 setzen
    python bump_version.py patch --tag    # zusaetzlich git-tag v<version> anlegen
    python bump_version.py patch --commit # zusaetzlich commit + tag

Die Mod-Version wird ausschliesslich aus gradle.properties gelesen.
build.gradle und fabric.mod.json bekommen sie automatisch beim Build.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROPS = ROOT / "gradle.properties"
KEY = "mod_version"

VERSION_RE = re.compile(r"^(?P<key>mod_version)\s*=\s*(?P<ver>\d+\.\d+\.\d+)\s*$", re.MULTILINE)
SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")


def read_version() -> str:
    text = PROPS.read_text(encoding="utf-8")
    m = VERSION_RE.search(text)
    if not m:
        sys.exit(f"FEHLER: '{KEY}=x.y.z' nicht in {PROPS} gefunden.")
    return m.group("ver")


def write_version(new_version: str) -> None:
    text = PROPS.read_text(encoding="utf-8")
    new_text, count = VERSION_RE.subn(f"{KEY}={new_version}", text, count=1)
    if count != 1:
        sys.exit("FEHLER: Konnte mod_version nicht ersetzen.")
    PROPS.write_text(new_text, encoding="utf-8")


def bump(version: str, part: str) -> str:
    major, minor, patch = (int(x) for x in version.split("."))
    if part == "patch":
        patch += 1
    elif part == "minor":
        minor += 1
        patch = 0
    elif part == "major":
        major += 1
        minor = 0
        patch = 0
    else:
        sys.exit(f"FEHLER: Unbekannter Bump-Typ '{part}'.")
    return f"{major}.{minor}.{patch}"


def run_git(*args: str) -> None:
    try:
        subprocess.run(["git", *args], check=True, cwd=ROOT)
    except FileNotFoundError:
        sys.exit("FEHLER: 'git' ist nicht installiert oder nicht im PATH.")
    except subprocess.CalledProcessError as exc:
        sys.exit(f"FEHLER: git {' '.join(args)} -> exit {exc.returncode}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Erhoeht die Mod-Version in gradle.properties.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "target",
        nargs="?",
        default="patch",
        help="patch | minor | major | x.y.z  (Standard: patch)",
    )
    parser.add_argument("--tag", action="store_true", help="Git-Tag v<version> anlegen.")
    parser.add_argument(
        "--commit",
        action="store_true",
        help="gradle.properties committen und Tag anlegen.",
    )
    args = parser.parse_args()

    current = read_version()

    if SEMVER_RE.match(args.target):
        new_version = args.target
    elif args.target in {"patch", "minor", "major"}:
        new_version = bump(current, args.target)
    else:
        sys.exit("FEHLER: Argument muss patch, minor, major oder x.y.z sein.")

    if new_version == current:
        print(f"Version ist bereits {current}. Nichts zu tun.")
        return

    write_version(new_version)
    print(f"Version: {current} -> {new_version}")

    if args.commit:
        run_git("add", "gradle.properties")
        run_git("commit", "-m", f"chore: bump version to {new_version}")
        run_git("tag", f"v{new_version}")
        print(f"Commit + Tag v{new_version} erstellt. Push mit: git push --follow-tags")
    elif args.tag:
        run_git("tag", f"v{new_version}")
        print(f"Tag v{new_version} erstellt. Push mit: git push --tags")


if __name__ == "__main__":
    main()
