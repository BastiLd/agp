#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
wipe_transition.py  —  Before/After Wisch-Animation (Engine + CLI + GUI)
========================================================================

Erzeugt aus zwei Bildern ein hochwertiges, endlos laufendes Before/After-GIF
(oder APNG / WebP / MP4 / MOV) mit einem weichen, bewegten Wischuebergang.

Highlights
----------
* Engine
    - Wisch von Bild 1 -> Bild 2 und fliessend wieder zurueck (Kosinus =
      Ease-In/Out, nahtlose Endlosschleife, kein Halten an den Enden).
    - Reine Alpha-Mischung: KEIN Morphing, beide Bilder bleiben pixelgenau.
    - Weiche Kante (Feather/Smoothstep), dezenter blaeulich-weisser Glow,
      Motion Blur in Bewegungsrichtung.
    - Wischrichtung waehlbar: L->R, R->L, oben->unten, unten->oben, diagonal.
    - Parallelisiert (ThreadPool) -> deutlich schneller.
* Export
    - GIF   : adaptive 256-Farb-Palette pro Frame + Dithering, optimize=False.
    - APNG  : verlustfrei, volle Farbtiefe.
    - WebP  : animiert, verlustfrei ODER klein (Qualitaet einstellbar).
    - MP4   : H.264 (hohe Qualitaet, kleine Datei) — benoetigt ffmpeg.
    - MOV   : ProRes 422 HQ (Schnitt/Maximalqualitaet) — benoetigt ffmpeg.
* GUI (Tkinter, gehoert zur Standard-Bibliothek)
    - Datei-Auswahl, Live-Vorschau mit Abspielen, alle Parameter als Regler,
      Farbwahl fuer Hintergrund & Glow, Fortschrittsbalken, Export im Hintergrund.

Aufruf
------
    python wipe_transition.py                 # startet die GUI
    python wipe_transition.py a.png b.png      # CLI, Standard = GIF
    python wipe_transition.py a.png b.png -o out.webp --format webp
    python wipe_transition.py --check          # zeigt verfuegbare Features

Abhaengigkeiten:  pip install pillow numpy        (Pflicht)
                  pip install imageio-ffmpeg       (optional, fuer MP4/MOV)
"""

import argparse
import math
import os
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, replace

try:
    import numpy as np
except ImportError:
    sys.exit("Fehler: numpy wird benoetigt  ->  pip install numpy")

try:
    from PIL import Image
except ImportError:
    sys.exit("Fehler: Pillow wird benoetigt  ->  pip install pillow")


# --------------------------------------------------------------------------- #
# Pillow-Konstanten (kompatibel zu alten und neuen Pillow-Versionen)
# --------------------------------------------------------------------------- #
try:
    DITHER = {"none": Image.Dither.NONE, "floyd": Image.Dither.FLOYDSTEINBERG}
    QUANT = {"median": Image.Quantize.MEDIANCUT, "octree": Image.Quantize.FASTOCTREE}
    RESAMPLE = Image.Resampling.LANCZOS
except AttributeError:  # aeltere Pillow-Versionen
    DITHER = {"none": Image.NONE, "floyd": Image.FLOYDSTEINBERG}
    QUANT = {"median": Image.MEDIANCUT, "octree": Image.FASTOCTREE}
    RESAMPLE = Image.LANCZOS


# Format-Schluessel -> (Dateiendung, Anzeigename)
FORMATS = {
    "gif":        (".gif",  "GIF"),
    "apng":       (".png",  "APNG (verlustfrei)"),
    "webp":       (".webp", "WebP (verlustfrei)"),
    "webp-lossy": (".webp", "WebP (klein)"),
    "mp4":        (".mp4",  "MP4 / H.264"),
    "mov":        (".mov",  "MOV / ProRes 422 HQ"),
}

DIRECTIONS = {
    "lr": "Links -> Rechts",
    "rl": "Rechts -> Links",
    "tb": "Oben -> Unten",
    "bt": "Unten -> Oben",
    "diag": "Diagonal",
}


# --------------------------------------------------------------------------- #
# Konfiguration
# --------------------------------------------------------------------------- #
@dataclass
class Config:
    fps: int = 50
    frames: int = 120
    feather: float = 0.0          # 0 = automatisch (~2.5 % der Breite)
    glow_strength: float = 0.35
    glow_color: tuple = (0.70, 0.82, 1.0)   # leicht blaeulich-weiss, 0..1
    motion_blur: float = 1.0
    blur_samples: int = 16
    background: tuple = (255, 255, 255)      # fuer transparente PNGs, 0..255
    direction: str = "lr"
    colors: int = 256
    quant: str = "median"
    dither: str = "floyd"
    webp_quality: int = 90
    crf: int = 12
    workers: int = 0              # 0 = automatisch (CPU-Kerne)

    def effective_workers(self):
        return self.workers if self.workers > 0 else (os.cpu_count() or 4)


# --------------------------------------------------------------------------- #
# Bild laden / Alpha auf Hintergrund legen
# --------------------------------------------------------------------------- #
def composite_rgb(im, background):
    """Legt ein (evtl. transparentes) Bild auf einen Hintergrund und gibt RGB."""
    has_alpha = im.mode in ("RGBA", "LA", "PA") or (
        im.mode == "P" and "transparency" in im.info
    )
    if has_alpha:
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, tuple(background) + (255,))
        return Image.alpha_composite(bg, im).convert("RGB")
    return im.convert("RGB")


def load_image(src, background, size=None):
    """Laedt PNG/Bild (Pfad oder PIL.Image), legt es auf den Hintergrund und
    bringt es optional auf eine Zielgroesse (LANCZOS, kein Nachschaerfen)."""
    im = src if isinstance(src, Image.Image) else Image.open(src)
    im = composite_rgb(im, background)
    if size is not None and im.size != size:
        im = im.resize(size, RESAMPLE)
    return im


def resolve_feather(value, width):
    return float(value) if value and value > 0 else max(6.0, round(width * 0.025))


# --------------------------------------------------------------------------- #
# Projektion (Wischachse) und Einzelbild-Berechnung
# --------------------------------------------------------------------------- #
def build_projection(W, H, direction):
    """Liefert (mode, s, smin, smax). s ist die Projektion der Pixel auf die
    Wischachse: 'x' (1D), 'y' (1D) oder '2d' (Feld) fuer diagonal."""
    if direction in ("lr", "rl"):
        x = np.arange(W, dtype=np.float32)
        s = (W - 1 - x) if direction == "rl" else x
        return "x", s, 0.0, float(W - 1)
    if direction in ("tb", "bt"):
        y = np.arange(H, dtype=np.float32)
        s = (H - 1 - y) if direction == "bt" else y
        return "y", s, 0.0, float(H - 1)
    # diagonal (45 Grad)
    ang = math.radians(45.0)
    dx, dy = math.cos(ang), math.sin(ang)
    X, Y = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    s = (X * dx + Y * dy).astype(np.float32)
    return "2d", s, float(s.min()), float(s.max())


def edge_profiles(s, edge, feather, sigma, blur_len, max_k):
    """Mischmaske (0..1) und Glow-Profil entlang der Wischachse, inkl. Motion
    Blur durch Mittelung mehrerer Sub-Positionen."""
    k = int(min(max_k, max(1, math.ceil(blur_len))))
    offsets = (0.0,) if k <= 1 else np.linspace(-0.5, 0.5, k) * blur_len
    inv_f = 1.0 / feather
    two_s2 = 2.0 * sigma * sigma
    mask = np.zeros_like(s, dtype=np.float32)
    glow = np.zeros_like(s, dtype=np.float32)
    for off in offsets:
        e = edge + float(off)
        t = np.clip((e - s) * inv_f + 0.5, 0.0, 1.0)
        mask += t * t * (3.0 - 2.0 * t)        # Smoothstep -> weiche Kante
        d = s - e
        glow += np.exp(-(d * d) / two_s2)      # Gauss -> Glow
    n = len(offsets) if hasattr(offsets, "__len__") else 1
    return mask / n, glow / n


def render_frame(a, b, proj, feather, glow_rgb, motion_blur, blur_samples, i, frames):
    """Berechnet ein RGB-Einzelbild (uint8) fuer Frame-Index i."""
    mode, s, smin, smax = proj
    travel = (smax - smin) + 2.0 * feather
    tt = i / frames
    speed = math.sin(2.0 * math.pi * tt)                 # signiert: Tempo & Richtung
    p = 0.5 - 0.5 * math.cos(2.0 * math.pi * tt)         # Ease-In/Out, nahtlos
    edge = smin - feather + p * travel
    v = abs(travel * math.pi * speed / frames)
    blur_len = min(v * motion_blur, feather * 3.0)
    sigma = max(1.5, feather * 0.8)

    # Glow & Blur folgen dem Tempo: an den Endpunkten (Tempo 0) sauberes Standbild,
    # in der Wischmitte am staerksten  ->  Glow betont nur den Uebergang.
    glow_factor = abs(speed)

    mask, glow = edge_profiles(s, edge, feather, sigma, blur_len, blur_samples)
    glow = glow * glow_factor

    if mode == "x":
        m, g = mask[None, :, None], glow[None, :, None]
    elif mode == "y":
        m, g = mask[:, None, None], glow[:, None, None]
    else:
        m, g = mask[..., None], glow[..., None]

    out = a + (b - a) * m                # reine Alpha-Mischung (kein Morph)
    out = out + g * glow_rgb             # additiver Glow
    np.clip(out, 0.0, 255.0, out=out)
    return out.astype(np.uint8)


def render_all(a, b, proj, cfg, feather, glow_rgb, progress=None):
    """Berechnet alle Frames parallel und gibt sie in Reihenfolge zurueck."""
    frames = cfg.frames
    results = [None] * frames
    done = 0
    workers = cfg.effective_workers()

    def work(i):
        return render_frame(a, b, proj, feather, glow_rgb,
                            cfg.motion_blur, cfg.blur_samples, i, frames)

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(work, i): i for i in range(frames)}
        for fut in as_completed(futs):
            results[futs[fut]] = fut.result()
            done += 1
            if progress:
                progress(done, frames, "Render")
    return results


# --------------------------------------------------------------------------- #
# Exporter
# --------------------------------------------------------------------------- #
def export_gif(frames, path, duration, cfg, progress=None):
    total = len(frames)
    pal = [None] * total
    done = 0

    def q(i):
        rgb = Image.fromarray(frames[i], "RGB")
        return rgb.quantize(colors=cfg.colors, method=QUANT[cfg.quant],
                            dither=DITHER[cfg.dither])

    with ThreadPoolExecutor(max_workers=cfg.effective_workers()) as ex:
        futs = {ex.submit(q, i): i for i in range(total)}
        for fut in as_completed(futs):
            pal[futs[fut]] = fut.result()
            done += 1
            if progress:
                progress(done, total, "GIF")

    pal[0].save(path, format="GIF", save_all=True, append_images=pal[1:], loop=0,
                duration=duration, optimize=False, disposal=1)


def export_apng(frames, path, duration, progress=None):
    imgs = [Image.fromarray(f, "RGB") for f in frames]
    if progress:
        progress(len(frames), len(frames), "APNG")
    imgs[0].save(path, format="PNG", save_all=True, append_images=imgs[1:],
                 loop=0, duration=duration)


def export_webp(frames, path, duration, lossless, quality, progress=None):
    imgs = [Image.fromarray(f, "RGB") for f in frames]
    if progress:
        progress(len(frames), len(frames), "WebP")
    imgs[0].save(path, format="WEBP", save_all=True, append_images=imgs[1:],
                 loop=0, duration=duration, lossless=lossless,
                 quality=(100 if lossless else quality), method=6,
                 minimize_size=False)


def find_ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg")


def export_video(frames, path, fps, crf, fmt, progress=None):
    exe = find_ffmpeg()
    if not exe:
        raise RuntimeError(
            "ffmpeg wurde nicht gefunden.\n"
            "Installiere es mit:  pip install imageio-ffmpeg\n"
            "oder lege ffmpeg in den PATH."
        )
    H, W = frames[0].shape[:2]
    pad_w, pad_h = W + (W & 1), H + (H & 1)   # gerade Masse fuer die Codecs

    if fmt == "mp4":
        codec = ["-c:v", "libx264", "-crf", str(crf), "-preset", "slow",
                 "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
    else:  # mov -> ProRes 422 HQ
        codec = ["-c:v", "prores_ks", "-profile:v", "3",
                 "-pix_fmt", "yuv422p10le"]

    args = [exe, "-y", "-loglevel", "error", "-nostats",
            "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{pad_w}x{pad_h}", "-r", str(fps), "-i", "-"] + codec + [path]

    proc = subprocess.Popen(args, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    total = len(frames)
    try:
        for i, f in enumerate(frames):
            if pad_w != W or pad_h != H:
                f = np.pad(f, ((0, pad_h - H), (0, pad_w - W), (0, 0)), mode="edge")
            try:
                proc.stdin.write(np.ascontiguousarray(f, dtype=np.uint8).tobytes())
            except (BrokenPipeError, OSError):
                break          # ffmpeg ist abgebrochen -> echten Fehler unten melden
            if progress:
                progress(i + 1, total, fmt.upper())
    finally:
        try:
            proc.stdin.close()
        except (BrokenPipeError, OSError):
            pass
    err = proc.stderr.read()
    proc.wait()
    if proc.returncode != 0:
        raise RuntimeError("ffmpeg-Fehler:\n" + err.decode("utf-8", "replace"))


# --------------------------------------------------------------------------- #
# High-Level
# --------------------------------------------------------------------------- #
def create_animation(image1, image2, output, fmt, cfg, progress=None):
    """Laedt beide Bilder, rendert und exportiert in das gewuenschte Format.
    Gibt (output, (W, H), frames) zurueck."""
    fmt = fmt.lower()
    if fmt not in FORMATS:
        raise ValueError(f"Unbekanntes Format: {fmt}")
    if not os.path.splitext(output)[1]:        # fehlende Endung ergaenzen
        output += FORMATS[fmt][0]

    a_img = load_image(image1, cfg.background)
    b_img = load_image(image2, cfg.background, size=a_img.size)   # gleiche Groesse
    W, H = a_img.size
    a = np.asarray(a_img, dtype=np.float32)
    b = np.asarray(b_img, dtype=np.float32)

    feather = resolve_feather(cfg.feather, W)
    glow_rgb = np.array(cfg.glow_color, dtype=np.float32) * 255.0 * cfg.glow_strength
    proj = build_projection(W, H, cfg.direction)

    frames = render_all(a, b, proj, cfg, feather, glow_rgb, progress)
    duration = max(1, round(1000.0 / cfg.fps))

    if fmt == "gif":
        export_gif(frames, output, duration, cfg, progress)
    elif fmt == "apng":
        export_apng(frames, output, duration, progress)
    elif fmt == "webp":
        export_webp(frames, output, duration, True, 100, progress)
    elif fmt == "webp-lossy":
        export_webp(frames, output, duration, False, cfg.webp_quality, progress)
    elif fmt in ("mp4", "mov"):
        export_video(frames, output, cfg.fps, cfg.crf, fmt, progress)

    return output, (W, H), len(frames)


# --------------------------------------------------------------------------- #
# Feature-Check
# --------------------------------------------------------------------------- #
def feature_report():
    import PIL
    lines = [f"Pillow {PIL.__version__} | numpy {np.__version__}",
             f"CPU-Kerne: {os.cpu_count()}"]
    ff = find_ffmpeg()
    lines.append(f"ffmpeg (MP4/MOV): {'gefunden -> ' + ff if ff else 'NICHT gefunden'}")
    try:
        import tkinter  # noqa: F401
        lines.append("Tkinter-GUI: verfuegbar")
    except Exception:
        lines.append("Tkinter-GUI: NICHT verfuegbar")
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Hochwertige Before/After-Wisch-Animation (GIF/APNG/WebP/MP4/MOV).",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument("image1", nargs="?", help="Erstes Bild (Startzustand)")
    p.add_argument("image2", nargs="?", help="Zweites Bild (wird darueber gewischt)")
    p.add_argument("-o", "--output", help="Ausgabedatei (Endung passt sich dem Format an)")
    p.add_argument("--format", choices=list(FORMATS), default="gif", help="Ausgabeformat")
    p.add_argument("--gui", action="store_true", help="Grafische Oberflaeche starten")
    p.add_argument("--check", action="store_true", help="Verfuegbare Features anzeigen")

    p.add_argument("--fps", type=int, default=50)
    p.add_argument("--frames", type=int, default=120, help="Frames pro kompletter Schleife")
    p.add_argument("--direction", choices=list(DIRECTIONS), default="lr")

    p.add_argument("--feather", type=float, default=0.0,
                   help="Breite der weichen Kante in px (0 = automatisch)")
    p.add_argument("--glow-strength", type=float, default=0.35)
    p.add_argument("--glow-color", type=float, nargs=3, default=[0.70, 0.82, 1.0],
                   metavar=("R", "G", "B"))
    p.add_argument("--motion-blur", type=float, default=1.0)
    p.add_argument("--blur-samples", type=int, default=16)
    p.add_argument("--background", type=int, nargs=3, default=[255, 255, 255],
                   metavar=("R", "G", "B"))

    p.add_argument("--colors", type=int, default=256, help="GIF: Farben pro Frame")
    p.add_argument("--quant", choices=list(QUANT), default="median")
    p.add_argument("--dither", choices=list(DITHER), default="floyd")
    p.add_argument("--webp-quality", type=int, default=90)
    p.add_argument("--crf", type=int, default=12, help="MP4: 0=verlustfrei .. 51")
    p.add_argument("--workers", type=int, default=0, help="0 = automatisch")
    return p.parse_args(argv)


def cfg_from_args(args):
    return Config(
        fps=args.fps, frames=args.frames, feather=args.feather,
        glow_strength=args.glow_strength, glow_color=tuple(args.glow_color),
        motion_blur=args.motion_blur, blur_samples=args.blur_samples,
        background=tuple(args.background), direction=args.direction,
        colors=args.colors, quant=args.quant, dither=args.dither,
        webp_quality=args.webp_quality, crf=args.crf, workers=args.workers,
    )


def cli_progress(done, total, stage):
    bar = int(30 * done / total)
    sys.stdout.write(f"\r{stage:7s} [{'#' * bar}{'.' * (30 - bar)}] {done}/{total}")
    sys.stdout.flush()
    if done == total:
        sys.stdout.write("\n")


def run_cli(args):
    if args.colors < 2 or args.colors > 256:
        sys.exit("Fehler: --colors muss zwischen 2 und 256 liegen.")
    if args.frames < 2:
        sys.exit("Fehler: --frames muss mindestens 2 sein.")

    cfg = cfg_from_args(args)
    output = args.output
    if not output:
        base = os.path.splitext(os.path.basename(args.image1))[0]
        output = base + "_wipe" + FORMATS[args.format][0]

    out, (W, H), n = create_animation(args.image1, args.image2, output,
                                      args.format, cfg, cli_progress)
    print(f"Fertig: {out}  ({W}x{H}, {n} Frames, {args.fps} FPS, "
          f"{n / args.fps:.2f}s Loop, Format {FORMATS[args.format][1]})")


# --------------------------------------------------------------------------- #
# GUI
# --------------------------------------------------------------------------- #
def run_gui(prefill1=None, prefill2=None):
    import queue
    import tkinter as tk
    from tkinter import ttk, filedialog, colorchooser, messagebox
    try:
        from PIL import ImageTk
    except ImportError:
        sys.exit("Fuer die GUI wird ImageTk benoetigt (Teil von Pillow).")

    PREVIEW_MAX = 440

    class App:
        def __init__(self, root):
            self.root = root
            root.title("Before/After Wisch-Animation")
            root.minsize(940, 620)

            self.raw1 = None          # Original-PIL
            self.raw2 = None
            self.small_a = None       # kleine RGB-Arrays fuer die Vorschau
            self.small_b = None
            self.small_size = None
            self.scale = 1.0
            self.full_size = None
            self.preview_ref = None
            self.playing = False
            self.play_job = None
            self.queue = queue.Queue()
            self.rendering = False

            # --- Tk-Variablen ---
            self.v_fps = tk.IntVar(value=50)
            self.v_frames = tk.IntVar(value=120)
            self.v_feather = tk.DoubleVar(value=0.0)
            self.v_glow = tk.DoubleVar(value=0.35)
            self.v_motion = tk.DoubleVar(value=1.0)
            self.v_dir = tk.StringVar(value=DIRECTIONS["lr"])
            self.v_fmt = tk.StringVar(value=FORMATS["gif"][1])
            self.v_webpq = tk.IntVar(value=90)
            self.v_crf = tk.IntVar(value=12)
            self.v_index = tk.IntVar(value=0)
            self.bg_color = (255, 255, 255)
            self.glow_color = (0.70, 0.82, 1.0)
            self.v_out = tk.StringVar(value="before_after.gif")

            self._build()
            self.root.after(100, self._poll)

            if prefill1:
                self._set_image(1, prefill1)
            if prefill2:
                self._set_image(2, prefill2)

        # ---- Layout ----
        def _build(self):
            main = ttk.Frame(self.root, padding=10)
            main.pack(fill="both", expand=True)
            left = ttk.Frame(main)
            left.pack(side="left", fill="y")
            right = ttk.Frame(main)
            right.pack(side="left", fill="both", expand=True, padx=(12, 0))

            # --- Dateien ---
            box = ttk.LabelFrame(left, text="Bilder", padding=8)
            box.pack(fill="x")
            ttk.Button(box, text="Bild 1 laden ...",
                       command=lambda: self._pick(1)).grid(row=0, column=0, sticky="w")
            self.lbl1 = ttk.Label(box, text="(kein Bild)", width=34)
            self.lbl1.grid(row=0, column=1, sticky="w", padx=6)
            ttk.Button(box, text="Bild 2 laden ...",
                       command=lambda: self._pick(2)).grid(row=1, column=0, sticky="w", pady=4)
            self.lbl2 = ttk.Label(box, text="(kein Bild)", width=34)
            self.lbl2.grid(row=1, column=1, sticky="w", padx=6)

            # --- Animation ---
            box = ttk.LabelFrame(left, text="Animation", padding=8)
            box.pack(fill="x", pady=8)
            self._slider(box, 0, "FPS (Bilder/Sek.)", self.v_fps, 10, 60, 1)
            self._slider(box, 1, "Frames (Bilder/Loop)", self.v_frames, 24, 240, 1, self._on_frames)
            self._slider(box, 2, "Feather (px, 0=auto)", self.v_feather, 0, 200, 1)
            self._slider(box, 3, "Glow (0=aus)", self.v_glow, 0.0, 1.0, 0.01)
            self._slider(box, 4, "Motion Blur (0=aus)", self.v_motion, 0.0, 3.0, 0.05)
            ttk.Label(box, text="Richtung").grid(row=5, column=0, sticky="w", pady=(6, 0))
            om = ttk.OptionMenu(box, self.v_dir, self.v_dir.get(),
                                *DIRECTIONS.values(), command=lambda *_: self._refresh())
            om.grid(row=5, column=1, sticky="ew", pady=(6, 0))

            # --- Farben ---
            box = ttk.LabelFrame(left, text="Farben", padding=8)
            box.pack(fill="x")
            ttk.Button(box, text="Hintergrund ...",
                       command=self._pick_bg).grid(row=0, column=0, sticky="w")
            self.sw_bg = tk.Label(box, width=4, relief="solid",
                                  bg=self._hex(self.bg_color))
            self.sw_bg.grid(row=0, column=1, sticky="w", padx=6)
            ttk.Button(box, text="Glow-Farbe ...",
                       command=self._pick_glow).grid(row=1, column=0, sticky="w", pady=4)
            self.sw_glow = tk.Label(box, width=4, relief="solid",
                                    bg=self._hex(self._glow255()))
            self.sw_glow.grid(row=1, column=1, sticky="w", padx=6)

            # --- Export ---
            box = ttk.LabelFrame(left, text="Export", padding=8)
            box.pack(fill="x", pady=8)
            ttk.Label(box, text="Format").grid(row=0, column=0, sticky="w")
            ttk.OptionMenu(box, self.v_fmt, self.v_fmt.get(),
                           *[v[1] for v in FORMATS.values()],
                           command=lambda *_: self._on_format()).grid(row=0, column=1, sticky="ew")
            self._slider(box, 1, "WebP-Qual. (nur 'WebP klein')", self.v_webpq, 1, 100, 1)
            self._slider(box, 2, "MP4 CRF (0=groß/verlustfrei..40=klein)", self.v_crf, 0, 40, 1)
            ttk.Label(box, text="Ausgabe").grid(row=3, column=0, sticky="w", pady=(6, 0))
            ttk.Entry(box, textvariable=self.v_out, width=26).grid(row=3, column=1, sticky="ew", pady=(6, 0))
            ttk.Button(box, text="Speicherort ...",
                       command=self._pick_out).grid(row=4, column=1, sticky="e", pady=4)

            self.btn_export = ttk.Button(left, text="  Exportieren  ",
                                         command=self._export)
            self.btn_export.pack(fill="x", pady=(4, 2))
            self.prog = ttk.Progressbar(left, mode="determinate")
            self.prog.pack(fill="x")
            self.status = ttk.Label(left, text="Bereit.")
            self.status.pack(fill="x", pady=(4, 0))

            for c in range(2):
                box.columnconfigure(c, weight=1)

            # --- Vorschau ---
            pv = ttk.LabelFrame(right, text="Vorschau", padding=8)
            pv.pack(fill="both", expand=True)
            self.canvas = tk.Label(pv, background="#202020")
            self.canvas.pack(fill="both", expand=True)
            ctr = ttk.Frame(pv)
            ctr.pack(fill="x", pady=(8, 0))
            self.btn_play = ttk.Button(ctr, text="Abspielen", width=12,
                                       command=self._toggle_play)
            self.btn_play.pack(side="left")
            self.scl_index = ttk.Scale(ctr, from_=0, to=119, orient="horizontal",
                                       command=self._on_index)
            self.scl_index.pack(side="left", fill="x", expand=True, padx=8)

        def _slider(self, parent, row, label, var, lo, hi, step, cmd=None):
            ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w")

            is_int = isinstance(var, tk.IntVar)
            decimals = 0 if step >= 1 else (1 if step >= 0.1 else 2)

            def fmt(value):
                return str(int(round(value))) if is_int else f"{value:.{decimals}f}"

            value_lbl = ttk.Label(parent, width=5, anchor="e")
            value_lbl.grid(row=row, column=2, sticky="e", padx=(4, 0))
            value_lbl.config(text=fmt(var.get()))

            def on(v):
                # ttk.Scale hat kein "Rastern" auf Schrittweiten (anders als
                # klassisches tk.Scale) -> hier von Hand auf `step` runden,
                # sonst bewegt sich der Regler stufenlos trotz Schrittangabe.
                raw = float(v)
                snapped = round(raw / step) * step
                snapped = int(round(snapped)) if is_int else round(snapped, decimals)
                if snapped != raw:
                    var.set(snapped)
                value_lbl.config(text=fmt(snapped))
                if cmd:
                    cmd()
                self._refresh()

            s = ttk.Scale(parent, from_=lo, to=hi, variable=var,
                          orient="horizontal", command=on)
            s.grid(row=row, column=1, sticky="ew", padx=4)
            parent.columnconfigure(1, weight=1)
            return s

        # ---- Helpers ----
        @staticmethod
        def _hex(rgb):
            r, g, b = (int(max(0, min(255, c))) for c in rgb)
            return f"#{r:02x}{g:02x}{b:02x}"

        def _glow255(self):
            return tuple(int(c * 255) for c in self.glow_color)

        def _fmt_key(self):
            for k, v in FORMATS.items():
                if v[1] == self.v_fmt.get():
                    return k
            return "gif"

        def _dir_key(self):
            for k, v in DIRECTIONS.items():
                if v == self.v_dir.get():
                    return k
            return "lr"

        def _cfg(self):
            return Config(
                fps=int(self.v_fps.get()), frames=int(self.v_frames.get()),
                feather=float(self.v_feather.get()), glow_strength=float(self.v_glow.get()),
                glow_color=self.glow_color, motion_blur=float(self.v_motion.get()),
                background=self.bg_color, direction=self._dir_key(),
                webp_quality=int(self.v_webpq.get()), crf=int(self.v_crf.get()),
            )

        # ---- Bilder ----
        def _pick(self, which):
            path = filedialog.askopenfilename(
                title=f"Bild {which} waehlen",
                filetypes=[("Bilder", "*.png *.jpg *.jpeg *.webp *.bmp"), ("Alle", "*.*")])
            if path:
                self._set_image(which, path)

        def _set_image(self, which, path):
            try:
                im = Image.open(path)
                im.load()
            except Exception as e:
                messagebox.showerror("Fehler", f"Konnte Bild nicht laden:\n{e}")
                return
            if which == 1:
                self.raw1 = im
                self.lbl1.config(text=os.path.basename(path))
                base = os.path.splitext(path)[0]
                self.v_out.set(base + "_wipe" + FORMATS[self._fmt_key()][0])
            else:
                self.raw2 = im
                self.lbl2.config(text=os.path.basename(path))
            self._rebuild_small()
            self._refresh()

        def _pick_bg(self):
            c = colorchooser.askcolor(color=self._hex(self.bg_color), title="Hintergrund")
            if c and c[0]:
                self.bg_color = tuple(int(x) for x in c[0])
                self.sw_bg.config(bg=self._hex(self.bg_color))
                self._rebuild_small()
                self._refresh()

        def _pick_glow(self):
            c = colorchooser.askcolor(color=self._hex(self._glow255()), title="Glow-Farbe")
            if c and c[0]:
                self.glow_color = tuple(x / 255.0 for x in c[0])
                self.sw_glow.config(bg=self._hex(self._glow255()))
                self._refresh()

        def _pick_out(self):
            key = self._fmt_key()
            ext = FORMATS[key][0]
            path = filedialog.asksaveasfilename(
                defaultextension=ext, initialfile=os.path.basename(self.v_out.get()),
                filetypes=[(FORMATS[key][1], "*" + ext), ("Alle", "*.*")])
            if path:
                self.v_out.set(path)

        def _on_format(self):
            cur = self.v_out.get()
            root, _ = os.path.splitext(cur)
            self.v_out.set(root + FORMATS[self._fmt_key()][0])

        def _on_frames(self):
            n = max(2, int(self.v_frames.get()))
            self.scl_index.config(to=n - 1)

        def _on_index(self, _v):
            self.v_index.set(int(float(_v)))
            self._render_preview()

        # ---- Vorschau ----
        def _rebuild_small(self):
            if not (self.raw1 and self.raw2):
                return
            a = composite_rgb(self.raw1, self.bg_color)
            self.full_size = a.size
            b = load_image(self.raw2, self.bg_color, size=a.size)
            W, H = a.size
            self.scale = min(1.0, PREVIEW_MAX / max(W, H))
            sw, sh = max(1, round(W * self.scale)), max(1, round(H * self.scale))
            self.small_size = (sw, sh)
            self.small_a = np.asarray(a.resize((sw, sh), RESAMPLE), dtype=np.float32)
            self.small_b = np.asarray(b.resize((sw, sh), RESAMPLE), dtype=np.float32)

        def _render_preview(self):
            if self.small_a is None:
                return
            sw, sh = self.small_size
            cfg = self._cfg()
            feather_full = resolve_feather(cfg.feather, self.full_size[0])
            feather = max(2.0, feather_full * self.scale)
            glow_rgb = np.array(cfg.glow_color, dtype=np.float32) * 255.0 * cfg.glow_strength
            proj = build_projection(sw, sh, cfg.direction)
            frames = max(2, cfg.frames)
            i = min(int(self.v_index.get()), frames - 1)
            arr = render_frame(self.small_a, self.small_b, proj, feather, glow_rgb,
                               cfg.motion_blur, cfg.blur_samples, i, frames)
            self.preview_ref = ImageTk.PhotoImage(Image.fromarray(arr, "RGB"))
            self.canvas.config(image=self.preview_ref)

        def _refresh(self):
            self._on_frames()
            self._render_preview()

        def _toggle_play(self):
            if self.small_a is None:
                return
            self.playing = not self.playing
            self.btn_play.config(text="Pause" if self.playing else "Abspielen")
            if self.playing:
                self._tick()
            elif self.play_job:
                self.root.after_cancel(self.play_job)
                self.play_job = None

        def _tick(self):
            if not self.playing:
                return
            n = max(2, int(self.v_frames.get()))
            i = (int(self.v_index.get()) + 1) % n
            self.v_index.set(i)
            self.scl_index.set(i)
            self._render_preview()
            delay = max(1, round(1000.0 / max(1, int(self.v_fps.get()))))
            self.play_job = self.root.after(delay, self._tick)

        # ---- Export (Hintergrund-Thread) ----
        def _export(self):
            if self.rendering:
                return
            if not (self.raw1 and self.raw2):
                messagebox.showwarning("Fehlt", "Bitte zuerst beide Bilder laden.")
                return
            out = self.v_out.get().strip()
            if not out:
                messagebox.showwarning("Fehlt", "Bitte einen Ausgabepfad angeben.")
                return
            cfg = self._cfg()
            fmt = self._fmt_key()
            self.rendering = True
            self.btn_export.config(state="disabled")
            self.prog.config(value=0)
            self.status.config(text="Starte ...")

            import threading
            raw1, raw2 = self.raw1, self.raw2

            def worker():
                try:
                    def prog(d, t, stage):
                        self.queue.put(("progress", d, t, stage))
                    res = create_animation(raw1, raw2, out, fmt, cfg, prog)
                    self.queue.put(("done", res))
                except Exception as e:
                    self.queue.put(("error", str(e)))

            threading.Thread(target=worker, daemon=True).start()

        def _poll(self):
            try:
                while True:
                    msg = self.queue.get_nowait()
                    if msg[0] == "progress":
                        _, d, t, stage = msg
                        self.prog.config(maximum=t, value=d)
                        self.status.config(text=f"{stage}: {d}/{t}")
                    elif msg[0] == "done":
                        out, (W, H), n = msg[1]
                        self.rendering = False
                        self.btn_export.config(state="normal")
                        self.status.config(text=f"Gespeichert: {os.path.basename(out)}  ({W}x{H}, {n} Frames)")
                        messagebox.showinfo("Fertig", f"Datei gespeichert:\n{out}")
                    elif msg[0] == "error":
                        self.rendering = False
                        self.btn_export.config(state="normal")
                        self.status.config(text="Fehler.")
                        messagebox.showerror("Fehler", msg[1])
            except queue.Empty:
                pass
            self.root.after(100, self._poll)

    root = tk.Tk()
    App(root)
    root.mainloop()


# --------------------------------------------------------------------------- #
# Einstieg
# --------------------------------------------------------------------------- #
def main():
    args = parse_args()
    if args.check:
        print(feature_report())
        return
    if args.gui or (not args.image1 and not args.image2):
        run_gui(args.image1, args.image2)
        return
    if not args.image1 or not args.image2:
        sys.exit("Bitte zwei Bilder angeben oder die GUI nutzen "
                 "(ohne Argumente starten).")
    run_cli(args)


if __name__ == "__main__":
    main()
