#!/usr/bin/env python3
"""
Aktualisiert Minecraft-, Yarn-, Fabric-Loader- und Fabric-API-Version
fuer ein oder alle Multi-Version-Subprojekte unter versions/<mc>/.

Datenquellen (alle frei, ohne Account):
    - https://meta.fabricmc.net  (Yarn, Loader)
    - https://api.modrinth.com   (Fabric API)

Verwendung:
    python update_fabric.py                  # alle vorhandenen Versionen aktualisieren
    python update_fabric.py 1.21.11          # nur dieses Subprojekt aktualisieren
    python update_fabric.py 1.21.11 --dry-run

Existiert das Subprojekt versions/<mc>/ noch nicht, wird ein Fehler ausgegeben
(Subprojekte werden bewusst nicht automatisch angelegt, weil sie eigenen Code
benoetigen).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSIONS_DIR = ROOT / "versions"

KEYS = ("minecraft_version", "yarn_mappings", "loader_version", "fabric_api_version")


def http_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "RestoreInv-update-script"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def latest_yarn(mc: str) -> str:
    data = http_json(f"https://meta.fabricmc.net/v2/versions/yarn/{mc}")
    if not data:
        sys.exit(f"FEHLER: Keine Yarn-Mappings fuer Minecraft {mc} gefunden.")
    return data[0]["version"]


def latest_loader() -> str:
    data = http_json("https://meta.fabricmc.net/v2/versions/loader")
    for entry in data:
        if entry.get("stable"):
            return entry["version"]
    sys.exit("FEHLER: Keinen stabilen Fabric-Loader gefunden.")


def latest_fabric_api(mc: str) -> str:
    qs = urllib.parse.urlencode(
        {
            "game_versions": json.dumps([mc]),
            "loaders": json.dumps(["fabric"]),
        }
    )
    data = http_json(f"https://api.modrinth.com/v2/project/fabric-api/version?{qs}")
    if not data:
        sys.exit(f"FEHLER: Keine Fabric-API-Version fuer Minecraft {mc} gefunden.")
    return data[0]["version_number"]


def read_props(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    for key in KEYS:
        m = re.search(rf"^{re.escape(key)}\s*=\s*(.+)\s*$", text, re.MULTILINE)
        if m:
            out[key] = m.group(1).strip()
    return out


def write_props(path: Path, updates: dict[str, str]) -> None:
    text = path.read_text(encoding="utf-8")
    for key, value in updates.items():
        pattern = rf"^{re.escape(key)}\s*=.*$"
        repl = f"{key}={value}"
        text, count = re.subn(pattern, repl, text, count=1, flags=re.MULTILINE)
        if count != 1:
            sys.exit(f"FEHLER: Konnte '{key}' nicht in {path} ersetzen.")
    path.write_text(text, encoding="utf-8")


def update_subproject(mc: str, dry_run: bool) -> None:
    sub = VERSIONS_DIR / mc
    props_path = sub / "gradle.properties"
    if not props_path.is_file():
        sys.exit(f"FEHLER: Subprojekt {sub} existiert nicht (erwarte gradle.properties dort).")

    print(f"\n=== Subprojekt versions/{mc} ===")
    print(f"Hole Versionen fuer Minecraft {mc} ...")

    new = {
        "minecraft_version": mc,
        "yarn_mappings":     latest_yarn(mc),
        "loader_version":    latest_loader(),
        "fabric_api_version": latest_fabric_api(mc),
    }
    current = read_props(props_path)

    print(f"{'Property':<22} {'Alt':<22} -> Neu")
    print("-" * 70)
    changed = False
    for key in KEYS:
        old = current.get(key, "<fehlt>")
        if old != new[key]:
            changed = True
            print(f"{key:<22} {old:<22} -> {new[key]}")
        else:
            print(f"{key:<22} {old:<22}    (unveraendert)")

    if not changed:
        print("Bereits aktuell.")
        return
    if dry_run:
        print("--dry-run: nichts geschrieben.")
        return

    write_props(props_path, new)
    print("gradle.properties aktualisiert.")


def list_existing_versions() -> list[str]:
    if not VERSIONS_DIR.is_dir():
        return []
    return sorted(p.name for p in VERSIONS_DIR.iterdir() if p.is_dir())


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("mc", nargs="?", help="Minecraft-Version. Ohne Angabe: alle vorhandenen.")
    parser.add_argument("--dry-run", action="store_true", help="Nur anzeigen.")
    args = parser.parse_args()

    if args.mc:
        targets = [args.mc]
    else:
        targets = list_existing_versions()
        if not targets:
            sys.exit("FEHLER: Keine Subprojekte unter versions/ gefunden.")
        print(f"Aktualisiere {len(targets)} Subprojekt(e): {', '.join(targets)}")

    for mc in targets:
        update_subproject(mc, args.dry_run)

    if not args.dry_run:
        print("\nBuild mit:  ./gradlew build")


if __name__ == "__main__":
    main()
