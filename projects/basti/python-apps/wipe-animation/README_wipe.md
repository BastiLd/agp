# Before/After Wisch-Animation

Erzeugt aus zwei Bildern ein hochwertiges, endlos laufendes Before/After mit
weichem, bewegtem Wischübergang – als **GIF, APNG, animiertem WebP, MP4 oder MOV**.

## Installation

```bash
pip install -r requirements.txt
```

`imageio-ffmpeg` ist nur für MP4/MOV nötig. Mit `python wipe_transition.py --check`
siehst du, welche Features verfügbar sind.

## GUI (am einfachsten)

```bash
python wipe_transition.py
```

Bilder laden, Regler einstellen, Vorschau abspielen, **Exportieren**.

## Kommandozeile

```bash
# Standard: GIF
python wipe_transition.py bild1.png bild2.png -o ergebnis.gif

# Anderes Format
python wipe_transition.py bild1.png bild2.png -o out.webp --format webp
python wipe_transition.py bild1.png bild2.png -o out.mp4  --format mp4

# Feineinstellung
python wipe_transition.py a.png b.png --fps 50 --frames 144 \
    --feather 40 --glow-strength 0.4 --motion-blur 1.2 --direction lr
```

## Wichtige Optionen

| Option | Bedeutung |
|---|---|
| `--format` | `gif`, `apng`, `webp`, `webp-lossy`, `mp4`, `mov` |
| `--fps` | Bildrate (50 ist in GIF exakt darstellbar) |
| `--frames` | Frames pro kompletter Schleife (hin + zurück) |
| `--direction` | `lr`, `rl`, `tb`, `bt`, `diag` |
| `--feather` | Breite der weichen Kante in px (0 = automatisch) |
| `--glow-strength` | Stärke des Kanten-Glows (0 = aus) |
| `--glow-color R G B` | Glow-Farbe normiert 0..1 (Standard leicht bläulich-weiß) |
| `--motion-blur` | Stärke des Motion Blur (0 = aus) |
| `--background R G B` | Hintergrund für transparente PNGs (0..255) |
| `--colors`, `--quant`, `--dither` | GIF-Qualität |
| `--webp-quality`, `--crf` | WebP- bzw. MP4-Qualität |
| `--workers` | Threads (0 = automatisch) |

## Format-Empfehlung

- **Maximale Qualität, verlustfrei:** APNG oder WebP (verlustfrei).
- **Universelle Kompatibilität:** GIF (256 Farben/Frame, adaptive Palette + Dithering).
- **Kleinste Datei bei guter Qualität:** MP4 (H.264).
- **Weiterverarbeitung/Schnitt:** MOV (ProRes 422 HQ).

## Eigenschaften

- Ease-In/Out (Kosinus), nahtlose Endlosschleife, keine Pause an den Enden.
- Reine Alpha-Mischung – **kein** Morphing, beide Bilder bleiben pixelgenau.
- Weiche Kante, dezenter Glow und Motion Blur folgen dem Bewegungstempo
  (an den Endpunkten saubere Standbilder).
- Originalbilder werden nur auf eine gemeinsame Größe gebracht, nicht
  nachgeschärft oder farblich verändert.
