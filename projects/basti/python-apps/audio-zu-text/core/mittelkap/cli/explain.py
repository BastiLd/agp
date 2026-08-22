"""Hilfe und Befehlszerlegung im Stil von explainshell.com."""
from __future__ import annotations

import shlex
import sys
import textwrap
from dataclasses import dataclass

from .spec import (BEFEHLE, GLOBALE_OPTIONEN, PROGRAMM, PROGRAMM_ERKLAERUNG,
                   STANDARDBEFEHL, Befehl, befehl_finden)

BREITE = 96

# Aeltere Windows-Konsolen laufen auf einer Codepage ohne Rahmenzeichen. Statt dort
# unlesbaren Zeichensalat zu erzeugen, wird auf reines ASCII zurueckgefallen.
_UNICODE = {"ecke": "└", "ende": "┘", "quer": "─", "ab": "┬", "senk": "│"}
_ASCII = {"ecke": "\\", "ende": "/", "quer": "_", "ab": "+", "senk": "|"}


def _zeichensatz() -> dict[str, str]:
    codierung = getattr(sys.stdout, "encoding", None) or "ascii"
    try:
        "".join(_UNICODE.values()).encode(codierung)
    except (UnicodeEncodeError, LookupError):
        return _ASCII
    return _UNICODE


def _umbrechen(text: str, einzug: str = "", erste_zeile: str | None = None) -> str:
    return textwrap.fill(
        text, width=BREITE, initial_indent=erste_zeile if erste_zeile is not None else einzug,
        subsequent_indent=einzug, break_long_words=False, break_on_hyphens=False,
    )


# ---------------------------------------------------------------- Hilfe

def uebersicht() -> str:
    zeilen = [
        f"{PROGRAMM} - Sprachnachrichten offline in Text verwandeln.",
        "",
        _umbrechen(PROGRAMM_ERKLAERUNG),
        "",
        "AUFRUF",
        f"  {PROGRAMM} <datei-oder-ordner>...        (Kurzform für '{PROGRAMM} {STANDARDBEFEHL}')",
        f"  {PROGRAMM} <befehl> [Argumente] [Optionen]",
        "",
        "BEFEHLE",
    ]
    breite = max(len(b.name) for b in BEFEHLE)
    for befehl in BEFEHLE:
        zeilen.append(f"  {befehl.name:<{breite}}  {befehl.kurzinfo}")

    zeilen += ["", "ALLGEMEINE OPTIONEN"]
    breite = max(len(o.anzeige()) for o in GLOBALE_OPTIONEN)
    for option in GLOBALE_OPTIONEN:
        zeilen.append(f"  {option.anzeige():<{breite}}  {option.kurzinfo}")

    zeilen += [
        "",
        "MEHR ERFAHREN",
        f"  {PROGRAMM} hilfe <befehl>            Einen Befehl mit allen Optionen erklärt bekommen.",
        f'  {PROGRAMM} erklaere "<befehlszeile>"  Eine komplette Zeile Stück für Stück zerlegen.',
        "",
    ]
    return "\n".join(zeilen)


def befehl_hilfe(befehl: Befehl) -> str:
    zeilen = [
        f"{PROGRAMM} {befehl.name} - {befehl.kurzinfo}",
        "",
        _umbrechen(befehl.erklaerung),
        "",
        "AUFRUF",
        f"  {befehl.verwendung()}",
    ]

    if befehl.argumente:
        zeilen += ["", "ARGUMENTE"]
        for argument in befehl.argumente:
            zeilen.append(f"  {argument.anzeige()}")
            zeilen.append(_umbrechen(argument.erklaerung, einzug="      "))

    if befehl.optionen:
        zeilen += ["", "OPTIONEN"]
        for option in befehl.optionen:
            kopf = f"  {option.anzeige()}"
            if option.standard:
                kopf += f"   (Standard: {option.standard})"
            zeilen.append(kopf)
            zeilen.append(_umbrechen(option.erklaerung, einzug="      "))
            for wert in option.werte:
                erklaerung = option.werterklaerung.get(wert, "")
                zeilen.append(_umbrechen(erklaerung, einzug="            ",
                                         erste_zeile=f"      {wert:<10}  "))

    zeilen += ["", "ALLGEMEINE OPTIONEN"]
    for option in GLOBALE_OPTIONEN:
        zeilen.append(f"  {option.anzeige()}")
        zeilen.append(_umbrechen(option.erklaerung, einzug="      "))

    if befehl.beispiele:
        zeilen += ["", "BEISPIELE"]
        for aufruf, zweck in befehl.beispiele:
            zeilen += [f"  $ {aufruf}", _umbrechen(zweck, einzug="      "), ""]

    return "\n".join(zeilen).rstrip() + "\n"


def hilfe(name: str | None = None) -> str:
    if not name:
        return uebersicht()
    if befehl := befehl_finden(name):
        return befehl_hilfe(befehl)
    vorschlaege = [b.name for b in BEFEHLE if b.name.startswith(name[:2])]
    hinweis = f" Meintest du: {', '.join(vorschlaege)}?" if vorschlaege else ""
    return f"Unbekannter Befehl '{name}'.{hinweis}\n\n{uebersicht()}"


# ---------------------------------------------------------------- Zerlegung

@dataclass
class Teil:
    """Ein Stück der Befehlszeile samt Erklärung."""
    text: str
    rolle: str
    erklaerung: str


def zerlegen(zeile: str) -> list[Teil]:
    """Ordnet jedem Token der Befehlszeile eine Erklärung zu."""
    try:
        tokens = shlex.split(zeile, posix=False)
    except ValueError:
        tokens = zeile.split()
    if not tokens:
        return []

    teile: list[Teil] = []
    rest = list(tokens)

    erstes = rest[0].strip('"')
    if erstes.lower().replace(".exe", "").endswith(PROGRAMM):
        teile.append(Teil(rest.pop(0), "Programm", PROGRAMM_ERKLAERUNG))

    befehl = befehl_finden(rest[0]) if rest else None
    if befehl:
        teile.append(Teil(rest.pop(0), "Befehl", befehl.erklaerung))
    else:
        befehl = befehl_finden(STANDARDBEFEHL)
        if rest:
            teile.append(Teil("", "Befehl (weggelassen)",
                              f"Es wurde kein Befehl genannt, deshalb greift '{STANDARDBEFEHL}'. "
                              f"{befehl.erklaerung}"))

    argumente = list(befehl.argumente) if befehl else []
    erwartete_option = None

    for token in rest:
        if erwartete_option is not None:
            option, erwartete_option = erwartete_option, None
            erklaerung = option.werterklaerung.get(
                token, f"Der Wert für {option.lang}. {option.kurzinfo}")
            if option.werte and token not in option.werte:
                erklaerung = (f"'{token}' ist kein gültiger Wert für {option.lang}. "
                              f"Erlaubt sind: {', '.join(option.werte)}.")
            teile.append(Teil(token, f"Wert für {option.lang}", erklaerung))
            continue

        if token.startswith("-") and len(token) > 1:
            name, _, angehaengt = token.partition("=")
            option = befehl.option_finden(name) if befehl else None
            if option is None:
                teile.append(Teil(token, "unbekannt",
                                  f"'{token}' kennt {PROGRAMM} nicht. Tippfehler? "
                                  f"'{PROGRAMM} hilfe {befehl.name if befehl else ''}' zeigt alle Optionen."))
                continue
            teile.append(Teil(name, "Schalter" if option.ist_schalter else "Option", option.erklaerung))
            if not option.ist_schalter:
                if angehaengt:
                    erklaerung = option.werterklaerung.get(
                        angehaengt, f"Der Wert für {option.lang}. {option.kurzinfo}")
                    teile.append(Teil(angehaengt, f"Wert für {option.lang}", erklaerung))
                else:
                    erwartete_option = option
            continue

        if argumente:
            argument = argumente[0]
            if not argument.mehrfach:
                argumente.pop(0)
            teile.append(Teil(token, f"Argument <{argument.name}>", argument.erklaerung))
        else:
            teile.append(Teil(token, "ueberzaehlig",
                              f"'{token}' steht an einer Stelle, an der "
                              f"'{befehl.name if befehl else PROGRAMM}' nichts mehr erwartet."))

    if erwartete_option is not None:
        teile.append(Teil("", "fehlender Wert",
                          f"Nach {erwartete_option.lang} fehlt der Wert. {erwartete_option.kurzinfo}"))
    return teile


def zerlegung_zeichnen(zeile: str) -> str:
    """Zeichnet die Zerlegung mit Klammerlinien - wie explainshell.com."""
    alle = zerlegen(zeile)
    teile = [t for t in alle if t.text]
    unsichtbar = [t for t in alle if not t.text]
    if not teile:
        return "Nichts zu erklären. Beispiel:\n" \
               f'  {PROGRAMM} erklaere "{PROGRAMM} beobachte C:\\Sprachis --txt"\n'

    z = _zeichensatz()

    # Jedes Teilstueck bekommt eine Spalte; die Verbindungslinie zeigt auf dessen Mitte.
    spalten: list[int] = []
    stelle = 0
    kopf: list[str] = []
    for teil in teile:
        spalten.append(stelle + len(teil.text) // 2)
        kopf.append(teil.text)
        stelle += len(teil.text) + 1
    breite = stelle

    zeilen = [" ".join(kopf)]

    balken = [" "] * breite
    for teil, mitte in zip(teile, spalten):
        start = mitte - len(teil.text) // 2
        for i in range(start, start + len(teil.text)):
            balken[i] = z["quer"]
        balken[start] = z["ecke"]
        balken[start + len(teil.text) - 1] = z["ende"]
        balken[mitte] = z["ab"]
    zeilen.append("".join(balken).rstrip())

    # Von hinten nach vorne, damit die Linien der frueheren Teile durchlaufen koennen.
    for nummer in range(len(teile) - 1, -1, -1):
        teil = teile[nummer]
        gerippe = [" "] * breite
        for mitte in spalten[:nummer]:
            gerippe[mitte] = z["senk"]
        gerippe[spalten[nummer]] = z["ecke"]
        praefix = "".join(gerippe)[:spalten[nummer] + 1] + z["quer"] + " "

        # Fortsetzungszeilen muessen die Linien der darueberliegenden Ebenen weiterfuehren,
        # sonst reisst der Baum bei jedem Umbruch ab.
        fortsetzung = [" "] * len(praefix)
        for mitte in spalten[:nummer]:
            fortsetzung[mitte] = z["senk"]
        einzug = "".join(fortsetzung)

        zeilen.append(_umbrechen(f"{teil.rolle}: {teil.erklaerung}", einzug=einzug, erste_zeile=praefix))
        if nummer:
            zwischenraum = [" "] * breite
            for mitte in spalten[:nummer]:
                zwischenraum[mitte] = z["senk"]
            zeilen.append("".join(zwischenraum).rstrip())

    # Was nicht als Token dasteht, aber trotzdem wirkt - etwa ein weggelassener Befehl.
    for teil in unsichtbar:
        zeilen += ["", _umbrechen(f"{teil.rolle}: {teil.erklaerung}", einzug="   ",
                                  erste_zeile="(*) ")]

    return "\n".join(zeilen) + "\n"
