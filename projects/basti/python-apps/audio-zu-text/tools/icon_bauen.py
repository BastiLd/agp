"""Erzeugt das Programmsymbol (Sprechblase mit Schallwellen) ohne Fremdbibliotheken."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

HINTERGRUND = (99, 102, 241)   # Indigo
VORDERGRUND = (255, 255, 255)


def _malen(kante: int) -> list[list[tuple[int, int, int, int]]]:
    m = kante / 32.0
    bild = [[(0, 0, 0, 0)] * kante for _ in range(kante)]

    radius = 6 * m
    for y in range(kante):
        for x in range(kante):
            # Abgerundetes Quadrat als Hintergrund.
            dx = max(radius - x, 0, x - (kante - 1 - radius))
            dy = max(radius - y, 0, y - (kante - 1 - radius))
            if dx * dx + dy * dy <= radius * radius:
                bild[y][x] = (*HINTERGRUND, 255)

    # Mikrofonkapsel: abgerundeter Balken in der Mitte.
    kapsel_breite, kapsel_hoehe = 7 * m, 13 * m
    mx, oben = kante / 2, 6 * m
    kr = kapsel_breite / 2
    for y in range(kante):
        for x in range(kante):
            px, py = x + 0.5, y + 0.5
            if oben + kr <= py <= oben + kapsel_hoehe - kr:
                innen = abs(px - mx) <= kr
            else:
                naechstes_y = oben + kr if py < oben + kr else oben + kapsel_hoehe - kr
                innen = (px - mx) ** 2 + (py - naechstes_y) ** 2 <= kr * kr
            if innen:
                bild[y][x] = (*VORDERGRUND, 255)

    # Buegel unter der Kapsel plus Staender.
    b_aussen, b_innen = 11 * m, 8.6 * m
    b_mitte_y = oben + kapsel_hoehe - 2 * m
    for y in range(kante):
        for x in range(kante):
            px, py = x + 0.5, y + 0.5
            abstand = ((px - mx) ** 2 + (py - b_mitte_y) ** 2) ** 0.5
            if py > b_mitte_y and b_innen <= abstand <= b_aussen:
                bild[y][x] = (*VORDERGRUND, 255)
            if abs(px - mx) <= 1.1 * m and b_mitte_y + b_innen <= py <= b_mitte_y + b_aussen + 2.4 * m:
                bild[y][x] = (*VORDERGRUND, 255)
            if abs(px - mx) <= 4.6 * m and abs(py - (b_mitte_y + b_aussen + 3 * m)) <= 1.1 * m:
                bild[y][x] = (*VORDERGRUND, 255)
    return bild


def _png(bild: list[list[tuple[int, int, int, int]]]) -> bytes:
    kante = len(bild)
    roh = b"".join(b"\x00" + b"".join(struct.pack("4B", *p) for p in zeile) for zeile in bild)

    def block(kennung: bytes, daten: bytes) -> bytes:
        return (struct.pack(">I", len(daten)) + kennung + daten
                + struct.pack(">I", zlib.crc32(kennung + daten) & 0xFFFFFFFF))

    return (b"\x89PNG\r\n\x1a\n"
            + block(b"IHDR", struct.pack(">IIBBBBB", kante, kante, 8, 6, 0, 0, 0))
            + block(b"IDAT", zlib.compress(roh, 9))
            + block(b"IEND", b""))


def schreiben(ziel: Path) -> None:
    ziel.parent.mkdir(parents=True, exist_ok=True)
    kanten = (16, 32, 48, 64, 128, 256)
    pngs = [_png(_malen(k)) for k in kanten]

    kopf = struct.pack("<HHH", 0, 1, len(pngs))
    versatz = len(kopf) + 16 * len(pngs)
    eintraege, koerper = b"", b""
    for kante, daten in zip(kanten, pngs):
        eintraege += struct.pack("<BBBBHHII", kante % 256, kante % 256, 0, 0, 1, 32,
                                 len(daten), versatz)
        koerper += daten
        versatz += len(daten)

    ziel.write_bytes(kopf + eintraege + koerper)
    (ziel.parent / "icon.png").write_bytes(pngs[-1])
    print(f"Geschrieben: {ziel} ({ziel.stat().st_size} Bytes)")


if __name__ == "__main__":
    schreiben(Path(__file__).resolve().parents[1] / "gui" / "src-tauri" / "icons" / "icon.ico")
