"""Die eine Wahrheit über alle Befehle.

Aus dieser Datenstruktur entstehen drei Dinge, die dadurch nie auseinanderlaufen:
der Argument-Parser, die Hilfe (`mittelkap hilfe`) und die Befehlszerlegung
(`mittelkap erklaere`, im Stil von explainshell.com).
"""
from __future__ import annotations

from dataclasses import dataclass, field

PROGRAMM = "mittelkap"
PROGRAMM_ERKLAERUNG = (
    "Das Programm selbst. Verwandelt deutsche Sprachnachrichten offline in Text - "
    "die Audiodaten verlassen deinen Rechner nie."
)


@dataclass(frozen=True)
class Option:
    lang: str
    kurzinfo: str
    erklaerung: str
    kurz: str | None = None
    wertname: str | None = None
    standard: str | None = None
    werte: tuple[str, ...] = ()
    werterklaerung: dict[str, str] = field(default_factory=dict)

    @property
    def ist_schalter(self) -> bool:
        return self.wertname is None

    @property
    def namen(self) -> tuple[str, ...]:
        return (self.lang, self.kurz) if self.kurz else (self.lang,)

    def anzeige(self) -> str:
        namen = "/".join(self.namen)
        return namen if self.ist_schalter else f"{namen} <{self.wertname}>"


@dataclass(frozen=True)
class Argument:
    name: str
    kurzinfo: str
    erklaerung: str
    mehrfach: bool = False
    pflicht: bool = True

    def anzeige(self) -> str:
        text = f"<{self.name}>"
        if self.mehrfach:
            text += "..."
        return text if self.pflicht else f"[{text}]"


@dataclass(frozen=True)
class Befehl:
    name: str
    kurzinfo: str
    erklaerung: str
    argumente: tuple[Argument, ...] = ()
    optionen: tuple[Option, ...] = ()
    beispiele: tuple[tuple[str, str], ...] = ()

    def verwendung(self) -> str:
        teile = [PROGRAMM, self.name, *(a.anzeige() for a in self.argumente)]
        if self.optionen:
            teile.append("[Optionen]")
        return " ".join(t for t in teile if t)

    def option_finden(self, name: str) -> Option | None:
        for option in (*self.optionen, *GLOBALE_OPTIONEN):
            if name in option.namen:
                return option
        return None


# ---------------------------------------------------------------- Bausteine

MODELL = Option(
    lang="--modell", kurz="-m", wertname="NAME", standard="large-v3",
    kurzinfo="Welches Whisper-Modell geladen wird.",
    erklaerung=(
        "Legt fest, welches Whisper-Modell für die Erkennung geladen wird. Größere Modelle "
        "verstehen Dialekt, Nuscheln und Hintergrundgeräusche besser, brauchen aber mehr "
        "Grafikspeicher und Rechenzeit."
    ),
    werte=("tiny", "base", "small", "medium", "large-v2", "large-v3"),
    werterklaerung={
        "tiny": "Winzig (~75 MB VRAM). Sehr schnell, macht bei Deutsch viele Fehler. Nur zum Testen.",
        "base": "Klein (~150 MB VRAM). Schnell, für klare Aufnahmen brauchbar.",
        "small": "Mittel-klein (~500 MB VRAM). Der CPU-Standard - läuft auch ohne Grafikkarte flüssig.",
        "medium": "Mittel (~2 GB VRAM). Guter Kompromiss, spürbar schneller als large.",
        "large-v2": "Groß (~3,9 GB VRAM). Fast so gut wie v3, gelegentlich stabiler bei langen Dateien.",
        "large-v3": "Größtes Modell (~3,9 GB VRAM, gemessen). Beste Qualität bei Deutsch. Standard auf der RTX 4060.",
    },
)

GERAET = Option(
    lang="--geraet", kurz="-g", wertname="ZIEL", standard="auto",
    kurzinfo="Ob auf Grafikkarte oder Prozessor gerechnet wird.",
    erklaerung=(
        "Bestimmt, welcher Chip die Erkennung berechnet. Die Grafikkarte ist um ein Vielfaches "
        "schneller, der Prozessor läuft dafür auf jedem Rechner."
    ),
    werte=("auto", "cuda", "cpu"),
    werterklaerung={
        "auto": "Empfohlen. Sucht eine NVIDIA-Grafikkarte; findet es keine, wird automatisch der Prozessor genommen.",
        "cuda": "Erzwingt die NVIDIA-Grafikkarte. Ohne passende Karte wird trotzdem auf den Prozessor zurückgefallen.",
        "cpu": "Erzwingt den Prozessor. Langsamer, aber unabhängig von Treibern und Grafikspeicher.",
    },
)

TXT = Option(
    lang="--txt", kurz="-t",
    kurzinfo="Legt den Text als .txt neben die Audiodatei.",
    erklaerung=(
        "Schreibt das fertige Transkript als Textdatei mit gleichem Namen direkt neben die "
        "Audiodatei. Aus 'nachricht.opus' wird also zusätzlich 'nachricht.txt'."
    ),
)

KOPIEREN = Option(
    lang="--kopieren", kurz="-k",
    kurzinfo="Legt den Text in die Zwischenablage.",
    erklaerung=(
        "Kopiert das Ergebnis sofort in die Zwischenablage, sodass du es direkt mit Strg+V "
        "einfügen kannst. Bei mehreren Dateien werden alle Transkripte aneinandergehängt."
    ),
)

ZEITMARKEN = Option(
    lang="--zeitmarken",
    kurzinfo="Stellt jeder Zeile die Sprechzeit voran.",
    erklaerung=(
        "Setzt vor jeden Abschnitt den Zeitpunkt in der Aufnahme, etwa '[00:12 - 00:19]'. "
        "Nützlich bei langen Aufnahmen, wenn du eine Stelle wiederfinden willst."
    ),
)

MARKDOWN = Option(
    lang="--markdown", kurz="-M",
    kurzinfo="Räumt den Text zusätzlich per KI zu Markdown auf.",
    erklaerung=(
        "Lässt nach der Transkription ein zweites, kleines Sprachmodell den Rohtext aufräumen: "
        "Absätze, Überschriften und Aufzählungen entstehen, Füllwörter wie 'ähm' verschwinden. "
        "Dafür wird Whisper zuerst aus dem Grafikspeicher entladen, weil beide Modelle nicht "
        "gleichzeitig hineinpassen. Der Originaltext bleibt immer erhalten."
    ),
)

REKURSIV = Option(
    lang="--rekursiv", kurz="-r",
    kurzinfo="Bezieht Unterordner mit ein.",
    erklaerung=(
        "Durchsucht beim Angeben eines Ordners auch alle darin liegenden Unterordner nach "
        "Audiodateien. Ohne diesen Schalter wird nur die oberste Ebene betrachtet."
    ),
)

GLOBALE_OPTIONEN: tuple[Option, ...] = (
    Option(
        lang="--ausfuehrlich", kurz="-v",
        kurzinfo="Zeigt während des Laufs mehr Meldungen an.",
        erklaerung=(
            "Schaltet die ausführliche Protokollierung ein. Du siehst dann, welches Modell "
            "geladen wird, wie viel Grafikspeicher belegt ist und wie lange jeder Schritt dauert. "
            "Hilfreich, wenn etwas nicht funktioniert."
        ),
    ),
    Option(
        lang="--leise", kurz="-q",
        kurzinfo="Gibt nur das reine Ergebnis aus.",
        erklaerung=(
            "Unterdrückt alle Status- und Fortschrittsmeldungen. Uebrig bleibt nur der "
            "erkannte Text - praktisch, wenn du die Ausgabe in eine andere Datei umleiten willst."
        ),
    ),
)


# ---------------------------------------------------------------- Befehle

BEFEHLE: tuple[Befehl, ...] = (
    Befehl(
        name="text",
        kurzinfo="Wandelt Sprachnachrichten in Text um.",
        erklaerung=(
            "Der Hauptbefehl. Nimmt einzelne Audiodateien oder ganze Ordner entgegen und gibt "
            "den erkannten Text aus. Kann auch weggelassen werden - 'mittelkap nachricht.opus' "
            "bedeutet dasselbe wie 'mittelkap text nachricht.opus'."
        ),
        argumente=(
            Argument(
                name="pfad", mehrfach=True,
                kurzinfo="Audiodatei(en) oder Ordner.",
                erklaerung=(
                    "Was verarbeitet werden soll. Erlaubt sind einzelne Audiodateien und Ordner; "
                    "bei einem Ordner werden alle darin gefundenen Audiodateien der Reihe nach "
                    "abgearbeitet. Erkannte Formate: opus, ogg, m4a, mp3, wav, mp4, aac, flac, webm."
                ),
            ),
        ),
        optionen=(TXT, KOPIEREN, MARKDOWN, ZEITMARKEN, MODELL, GERAET, REKURSIV),
        beispiele=(
            ("mittelkap nachricht.opus", "Eine WhatsApp-Sprachnachricht in Text umwandeln."),
            ("mittelkap C:\\Sprachnachrichten --txt", "Einen ganzen Ordner abarbeiten und je eine .txt daneben legen."),
            ("mittelkap notiz.m4a --markdown --kopieren", "Aufräumen lassen und direkt in die Zwischenablage legen."),
        ),
    ),
    Befehl(
        name="beobachte",
        kurzinfo="Überwacht einen Ordner und verarbeitet neue Dateien sofort.",
        erklaerung=(
            "Bleibt dauerhaft laufen und behält einen Ordner im Auge. Sobald dort eine neue "
            "Audiodatei auftaucht, wird sie automatisch transkribiert. Praktisch, wenn du deinen "
            "WhatsApp-Download-Ordner beobachten lassen willst. Beenden mit Strg+C."
        ),
        argumente=(
            Argument(
                name="ordner",
                kurzinfo="Der zu überwachende Ordner.",
                erklaerung=(
                    "Der Ordner, der beobachtet wird. Bereits vorhandene Dateien bleiben "
                    "unangetastet - es zählt nur, was ab jetzt neu hinzukommt."
                ),
            ),
        ),
        optionen=(TXT, MARKDOWN, ZEITMARKEN, MODELL, GERAET),
        beispiele=(
            ("mittelkap beobachte C:\\Users\\basti\\Downloads --txt",
             "Den Download-Ordner beobachten und jede neue Sprachnachricht als .txt ablegen."),
        ),
    ),
    Befehl(
        name="formatiere",
        kurzinfo="Räumt einen vorhandenen Text per KI zu Markdown auf.",
        erklaerung=(
            "Nimmt einen bereits vorhandenen Text - etwa eine früher erzeugte .txt - und lässt "
            "ihn vom kleinen Sprachmodell zu sauberem Markdown umbauen. Whisper wird dafür nicht "
            "geladen, es ist also kein Audio nötig."
        ),
        argumente=(
            Argument(
                name="datei",
                kurzinfo="Die aufzuräumende Textdatei.",
                erklaerung=(
                    "Pfad zu einer Textdatei. Ein einzelner Bindestrich '-' liest stattdessen "
                    "von der Standardeingabe, sodass du Text hineinleiten kannst."
                ),
            ),
        ),
        optionen=(KOPIEREN,),
        beispiele=(
            ("mittelkap formatiere nachricht.txt", "Ein bestehendes Transkript zu Markdown aufräumen."),
        ),
    ),
    Befehl(
        name="protokoll",
        kurzinfo="Zeigt das Protokoll der letzten Läufe.",
        erklaerung=(
            "Gibt aus, was das Programm zuletzt getan hat: geladene Modelle, verarbeitete "
            "Dateien, Grafikspeicher, Fehler. Genau dieser Text lässt sich mit --kopieren "
            "abgreifen, wenn du ein Problem melden willst."
        ),
        optionen=(KOPIEREN,),
        beispiele=(
            ("mittelkap protokoll --kopieren", "Das gesamte Protokoll in die Zwischenablage legen."),
        ),
    ),
    Befehl(
        name="zustand",
        kurzinfo="Zeigt Grafikkarte, Modelle und Speicherbelegung.",
        erklaerung=(
            "Prüft dein System: Wird eine NVIDIA-Grafikkarte gefunden? Wie viel Grafikspeicher "
            "ist frei? Welche Modelle sind bereits heruntergeladen? Der erste Befehl, wenn "
            "etwas nicht läuft."
        ),
    ),
    Befehl(
        name="hilfe",
        kurzinfo="Erklärt alle Befehle oder einen einzelnen.",
        erklaerung=(
            "Ohne Angabe eine Übersicht aller Befehle. Mit einem Befehlsnamen dahinter nur "
            "dieser eine, dafür mit allen Optionen ausfuehrlich erklärt."
        ),
        argumente=(
            Argument(
                name="befehl", pflicht=False,
                kurzinfo="Optional: nur diesen Befehl erklären.",
                erklaerung="Name eines Befehls, etwa 'beobachte'. Ohne Angabe erscheint die Gesamtübersicht.",
            ),
        ),
        beispiele=(
            ("mittelkap hilfe", "Alle Befehle auf einen Blick."),
            ("mittelkap hilfe beobachte", "Nur den Befehl 'beobachte', mit allen Optionen."),
        ),
    ),
    Befehl(
        name="erklaere",
        kurzinfo="Zerlegt eine komplette Befehlszeile Stück für Stück.",
        erklaerung=(
            "Das Gegenstück zu explainshell.com: Du gibst eine ganze Befehlszeile in "
            "Anführungszeichen an, und jedes einzelne Teilstück wird darunter erklärt - "
            "auch die Werte einzelner Optionen. Unbekannte Teile werden als solche benannt, "
            "statt dass etwas abbricht."
        ),
        argumente=(
            Argument(
                name="befehlszeile",
                kurzinfo="Die zu zerlegende Zeile, in Anführungszeichen.",
                erklaerung=(
                    "Die komplette Befehlszeile als ein Textstück, zum Beispiel "
                    "\"mittelkap beobachte C:\\Sprachis --txt\". Die Anführungszeichen sind wichtig, "
                    "damit die Zeile als Ganzes ankommt und nicht schon von der Konsole zerlegt wird."
                ),
            ),
        ),
        beispiele=(
            ('mittelkap erklaere "mittelkap beobachte C:\\Sprachis --txt --modell large-v3"',
             "Jeden Teil dieser Zeile einzeln erklärt bekommen."),
        ),
    ),
)

STANDARDBEFEHL = "text"


def befehl_finden(name: str) -> Befehl | None:
    return next((b for b in BEFEHLE if b.name == name), None)
