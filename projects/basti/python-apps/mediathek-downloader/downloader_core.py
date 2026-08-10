"""
Kern des Miraculous-Downloaders.

Aufgaben:
  * die gespiegelte Website unter miraculous/miraculous.to/en/ einlesen
  * fuer jede Folge die echten Stream-Adressen ermitteln
  * Video einmal laden, dazu jede gewuenschte Tonspur, und alles in eine MP4 muxen

Wichtig zum Verstaendnis der Streams:
Der Anbieter liefert pro Folge ein reines Video (ohne Ton) und je Sprache eine
eigene Tonspur:

    .../episodes/video_NEW/<ep>/video/media_0.m3u8
    .../episodes/audio_NEW/<lang>/<ep>/audio/media_0.m3u8

Damit muss das Video nur EINMAL geladen werden, egal wie viele Sprachen man
moechte - eine Tonspur ist nur wenige Prozent so gross wie das Video.
Aeltere Folgen/Specials gibt es teilweise nur als fertig gemischte Datei
(video2/EN618/EN618.mp4); dafuer gibt es einen Fallback.
"""

import os
import re
import glob
import json
import time
import shutil
import threading
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor

BASE_DIR = Path(__file__).parent.resolve()
MIRACULOUS_EN_DIR = BASE_DIR / "miraculous" / "miraculous.to" / "en"
DEFAULT_DOWNLOAD_DIR = BASE_DIR / "Downloads"
THUMBNAIL_CACHE_DIR = BASE_DIR / "web_ui" / "thumbnails"
LANG_CACHE_FILE = BASE_DIR / "lang_cache.json"
STREAM_CACHE_FILE = BASE_DIR / "stream_cache.json"

DEFAULT_BASE_URL = "https://miraculous.to"
CDN = "https://ep-distribution.miraculous.to/episodes"

HTTP_HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"),
    "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://miraculous.to/",
}

# Alle Sprachen, die der Anbieter grundsaetzlich anbietet.
ALL_LANGS = ["en", "de", "fr", "it", "es", "pl", "pt", "cz", "la", "tr", "jp"]

LANG_NAMES = {
    "en": "Englisch", "de": "Deutsch", "fr": "Franzoesisch", "it": "Italienisch",
    "es": "Spanisch", "pl": "Polnisch", "pt": "Portugiesisch", "cz": "Tschechisch",
    "la": "Latino", "tr": "Tuerkisch", "jp": "Japanisch",
}

# ISO-639-2 fuer die Sprach-Kennzeichnung in der MP4 (damit Player sie anzeigen).
ISO3 = {
    "en": "eng", "de": "deu", "fr": "fra", "it": "ita", "es": "spa",
    "pl": "pol", "pt": "por", "cz": "ces", "la": "spa", "tr": "tur", "jp": "jpn",
}

THUMBNAIL_CACHE_DIR.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------------------------------
# Kleine Helfer
# --------------------------------------------------------------------------

def sanitize_filename(name):
    """Entfernt Zeichen, die Windows in Dateinamen nicht erlaubt."""
    name = str(name).replace("/", "_").replace("\\", "_")
    return re.sub(r'[*?:"<>|]', "", name).strip().rstrip(".")


def http_get(url, timeout=25, headers=None, max_bytes=None):
    req = urllib.request.Request(url, headers=headers or HTTP_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(max_bytes) if max_bytes else r.read()


def http_text(url, timeout=25):
    return http_get(url, timeout=timeout).decode("utf-8", errors="ignore")


def url_is_playlist(url, timeout=12):
    """True, wenn unter der Adresse wirklich eine HLS-Playlist liegt."""
    try:
        return http_get(url, timeout=timeout, max_bytes=64).startswith(b"#EXTM3U")
    except Exception:
        return False


def url_exists(url, timeout=12):
    """True, wenn die Datei abrufbar ist (fuer direkte MP4s)."""
    try:
        hdr = dict(HTTP_HEADERS, Range="bytes=0-64")
        req = urllib.request.Request(url, headers=hdr)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status in (200, 206)
    except Exception:
        return False


def cdn_video(ep):
    return f"{CDN}/video_NEW/{ep}/video/media_0.m3u8"


def cdn_audio(ep, lang):
    return f"{CDN}/audio_NEW/{lang}/{ep}/audio/media_0.m3u8"


def _tool(name):
    """Pfad zu yt-dlp / ffmpeg - oder None, wenn nicht installiert."""
    return shutil.which(name)


def have_tools():
    return {"yt-dlp": _tool("yt-dlp"), "ffmpeg": _tool("ffmpeg"), "ffprobe": _tool("ffprobe")}


# --------------------------------------------------------------------------
# HTML der gespiegelten Seite auslesen
# --------------------------------------------------------------------------

class _EpisodeParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.title = ""
        self.poster_url = ""
        self.description = ""
        self.duration = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "li" and a.get("id") == "nav-ep-title":
            self.in_title = True
        elif tag == "video" and a.get("poster"):
            self.poster_url = self.poster_url or a["poster"]
        elif tag == "meta":
            prop = a.get("property", "") or a.get("itemprop", "")
            name = a.get("name", "")
            content = a.get("content", "")
            if prop in ("thumbnailUrl", "og:image") and not self.poster_url:
                self.poster_url = content
            elif (prop == "description" or name == "description") and not self.description:
                self.description = content
            elif prop == "duration" and not self.duration:
                self.duration = content

    def handle_endtag(self, tag):
        if tag == "li" and self.in_title:
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data.strip()


# Reihenfolge = Verlaesslichkeit. Die alte Fassung kannte nur das erste Muster
# und lieferte deshalb bei vielen Folgen der Staffel 6 eine leere Folgennummer.
_EP_PATTERNS = [
    r'm3u8\.php\?ep=(\d+)',
    r'/video_NEW/(\d+)/',
    r'/audio_NEW/\w+/(\d+)/',
    r'/video2/[A-Z]{2}(\d+)',
]


def extract_ep_code(html, path_str=""):
    """Folgennummer (z.B. '618') aus dem Seitenquelltext oder notfalls dem Pfad."""
    plain = html.replace("\\u0026", "&").replace("&amp;", "&")
    for pat in _EP_PATTERNS:
        m = re.search(pat, plain)
        if m:
            return m.group(1)
    return ep_code_from_path(path_str)


def ep_code_from_path(path_str):
    """season-6/episode-18-... -> '618';  specials/3-awakening -> '003'."""
    p = str(path_str).replace("\\", "/").lower()
    m = re.search(r'season-(\d+)/episode-(\d+)', p)
    if m:
        return f"{m.group(1)}{int(m.group(2)):02d}"
    m = re.search(r'special[^/]*/(\d+)-', p)
    if m:
        return f"{int(m.group(1)):03d}"
    return ""


def category_for(path_str, title=""):
    """Ordnername + Typ aus dem Pfad ableiten."""
    p = str(path_str).replace("\\", "/").lower()
    m = re.search(r'season[-/](\d+)', p)
    if m:
        return f"Staffel {int(m.group(1))}", "episode"
    if "special" in p:
        if "movie" in p or "film" in p or "awakening" in p:
            return "Filme", "movie"
        return "Specials", "special"
    return "Sonstiges", "episode"


def parse_html_content(content, file_path_or_url):
    """Baut aus einer Episodenseite den Datensatz fuer eine Folge."""
    parser = _EpisodeParser()
    parser.feed(content)

    is_url = str(file_path_or_url).startswith("http")
    if is_url:
        stem = file_path_or_url.split("/")[-1].replace(".html", "")
        rel = stem
    else:
        stem = Path(file_path_or_url).stem
        try:
            rel = os.path.relpath(file_path_or_url, MIRACULOUS_EN_DIR)
        except ValueError:
            rel = stem
    rel = str(rel).replace("\\", "/")

    title = parser.title.strip() or stem.replace("-", " ").title()
    poster = parser.poster_url
    if poster and not poster.startswith("http"):
        poster = urllib.parse.urljoin("https://miraculous.to/global_data/", poster)

    ep_code = extract_ep_code(content, rel if not is_url else file_path_or_url)
    category, item_type = category_for(rel if not is_url else file_path_or_url, title)

    # Die fertig gemischte Quelle der Seite (Fallback, meist nur Englisch).
    muxed = ""
    m = re.search(r'"src":"(https://[^"]*?/video2/[^"]+?)"', content.replace("\\u0026", "&"))
    if m:
        muxed = m.group(1)

    return {
        "uid": rel[:-5] if rel.endswith(".html") else rel,
        "title": title,
        "ep_code": ep_code,
        "category": category,
        "type": item_type,
        "poster_url": poster,
        "description": (parser.description or "").strip(),
        "duration": parser.duration,
        "local_page": rel,
        "relative_path": rel,
        "page_url": f"{DEFAULT_BASE_URL}/en/{rel}",
        "muxed_url": muxed,
        "file_path_or_url": str(file_path_or_url),
    }


_SKIP_PAGES = {
    "index.html", "episodes.html", "music.html", "about.html", "mediathek.html",
    "index-2.html", "episodes-2.html", "music-2.html", "about-2.html",
}

_items_cache = {"stamp": 0.0, "items": []}


def get_all_media_items(force=False):
    """Alle Folgen der gespiegelten Website - mit kleinem Cache (30 s)."""
    if not force and _items_cache["items"] and time.time() - _items_cache["stamp"] < 30:
        return _items_cache["items"]

    items = []
    if not MIRACULOUS_EN_DIR.exists():
        return items

    for hf in sorted(glob.glob(str(MIRACULOUS_EN_DIR / "**" / "*.html"), recursive=True)):
        if Path(hf).name in _SKIP_PAGES:
            continue
        try:
            content = Path(hf).read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            print(f"Fehler beim Lesen von {hf}: {e}")
            continue
        # Nur echte Episodenseiten: sie enthalten immer einen Player.
        if "m3u8" not in content and "video2/" not in content:
            continue
        items.append(parse_html_content(content, hf))

    items.sort(key=_sort_key)
    _items_cache["items"] = items
    _items_cache["stamp"] = time.time()
    return items


def _sort_key(it):
    cat = it["category"]
    m = re.search(r'Staffel (\d+)', cat)
    grp = int(m.group(1)) if m else (90 if cat == "Specials" else 91 if cat == "Filme" else 99)
    return (grp, it["ep_code"] or "999", it["title"])


def find_item(items, uid):
    for it in items:
        if it["uid"] == uid:
            return it
    return None


def target_file_for(item, out_dir=DEFAULT_DOWNLOAD_DIR):
    """Zielpfad der fertigen MP4."""
    prefix = f"{item['ep_code']} - " if item.get("ep_code") else ""
    return Path(out_dir) / item["category"] / f"{prefix}{sanitize_filename(item['title'])}.mp4"


def thumbnail_path(item):
    """Vorschaubild im Cache - nach Folgennummer benannt."""
    key = item.get("ep_code") or sanitize_filename(item["uid"])
    return THUMBNAIL_CACHE_DIR / f"{key}.webp"


def fetch_thumbnail(item):
    """Laedt das Vorschaubild einmalig in den Cache. True, wenn es danach da ist."""
    dest = thumbnail_path(item)
    if dest.exists() and dest.stat().st_size > 500:
        return True
    url = item.get("poster_url")
    if not url:
        return False
    try:
        data = http_get(url, timeout=25)
        if len(data) > 500:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            return True
    except Exception:
        pass
    return False


# --------------------------------------------------------------------------
# Stream-Adressen ermitteln
# --------------------------------------------------------------------------

_cache_lock = threading.Lock()


def _load_json(path, default):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return default


def _save_json(path, data):
    try:
        Path(path).write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        print(f"Cache konnte nicht geschrieben werden ({path}): {e}")


def _lang_cache():
    return _load_json(LANG_CACHE_FILE, {})


def cached_langs(item):
    """Bereits bekannte Tonspuren - ohne Netzzugriff (fuer die Uebersicht)."""
    entry = _lang_cache().get(item["uid"])
    if entry:
        return entry.get("langs", [])
    # Beim ersten Start aus dem alten stream_cache.json uebernehmen.
    old = _load_json(STREAM_CACHE_FILE, {}).get(item.get("ep_code") or "")
    return old.get("langs", []) if old else []


def _page_html(item, base_url=DEFAULT_BASE_URL):
    """Aktuelle Episodenseite vom Server holen, sonst die lokale Kopie."""
    try:
        url = urllib.parse.urljoin(base_url.rstrip("/") + "/en/", item["local_page"])
        return http_text(url, timeout=20)
    except Exception:
        try:
            return Path(item["file_path_or_url"]).read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return ""


def resolve_streams(item, base_url=DEFAULT_BASE_URL, wanted=None):
    """
    Ermittelt die Stream-Adressen einer Folge.

    Rueckgabe:
      {"mode": "split", "video": <url>, "audio": {lang: url}}   bevorzugt
      {"mode": "muxed", "audio": {lang: url}}                   Notfall (fertig gemischt)
      {"mode": None,    "error": "..."}                          nichts gefunden
    """
    langs = list(wanted) if wanted else ALL_LANGS
    langs = [l for l in ALL_LANGS if l in langs]  # feste Reihenfolge
    ep = item.get("ep_code") or ep_code_from_path(item.get("local_page", ""))

    # 1) Der Normalfall: getrenntes Video + Tonspuren direkt vom Verteil-Server.
    if ep and url_is_playlist(cdn_video(ep)):
        with ThreadPoolExecutor(max_workers=11) as pool:
            found = list(pool.map(lambda l: (l, url_is_playlist(cdn_audio(ep, l))), langs))
        audio = {l: cdn_audio(ep, l) for l, ok in found if ok}
        if audio:
            return {"mode": "split", "video": cdn_video(ep), "audio": audio}

    # 2) Aeltere Folgen: nur eine fertig gemischte Datei auf der Seite.
    html = _page_html(item, base_url)
    muxed = item.get("muxed_url") or ""
    if html:
        m = re.search(r'"src":"(https://[^"]*?/video2/[^"]+?)"', html.replace("\\u0026", "&"))
        if m:
            muxed = m.group(1)

    if muxed:
        sources = {}
        m = re.search(r'/video2/([A-Za-z]{2})(\d+)', muxed)
        if m:
            base_lang, num = m.group(1).lower(), m.group(2)
            sources[base_lang] = muxed
            # Gleiche Datei in anderen Sprachen probieren (kostet nur einen Kopf-Abruf).
            others = [l for l in langs if l != base_lang]
            def try_lang(l):
                alt = re.sub(r'/video2/[A-Za-z]{2}' + num,
                             f"/video2/{l.upper()}{num}", muxed)
                alt = alt.replace(f"{m.group(1).upper()}{num}.", f"{l.upper()}{num}.")
                return (l, alt) if url_exists(alt) else (l, None)
            with ThreadPoolExecutor(max_workers=8) as pool:
                for l, alt in pool.map(try_lang, others):
                    if alt:
                        sources[l] = alt
        else:
            sources["en"] = muxed
        if sources:
            return {"mode": "muxed", "audio": sources}

    # 3) Letzter Versuch: die Master-Playlist mit frischem Token von der Seite.
    if html:
        m = re.search(r'(https://[^"\s\\]*?/secret/m3u8\.php\?ep=\d+&lang=)(\w+)(&sid=[0-9a-f]+&token=[0-9a-f]+)',
                      html.replace("\\u0026", "&").replace("&amp;", "&"))
        if m:
            pre, _, post = m.groups()
            try:
                master = http_text(pre + "en" + post, timeout=20)
                vid = next((l.strip() for l in master.splitlines()
                            if l.strip().startswith("http")), "")
                aud = re.search(r'URI="([^"]+)"', master)
                if vid and aud and url_is_playlist(vid):
                    return {"mode": "split", "video": vid, "audio": {"en": aud.group(1)}}
            except Exception:
                pass

    return {"mode": None, "error": "Keine Stream-Adresse gefunden."}


def probe_langs(item, base_url=DEFAULT_BASE_URL, force=False):
    """Verfuegbare Tonspuren einer Folge (mit Cache in lang_cache.json)."""
    with _cache_lock:
        cache = _lang_cache()
        entry = cache.get(item["uid"])
        if entry and not force:
            return entry.get("langs", [])

    info = resolve_streams(item, base_url=base_url)
    langs = sorted(info.get("audio", {}).keys(), key=lambda l: ALL_LANGS.index(l)
                   if l in ALL_LANGS else 99)

    with _cache_lock:
        cache = _lang_cache()
        cache[item["uid"]] = {"langs": langs, "mode": info.get("mode"), "ts": int(time.time())}
        _save_json(LANG_CACHE_FILE, cache)
    return langs


# --------------------------------------------------------------------------
# Herunterladen
# --------------------------------------------------------------------------

_PCT = re.compile(r'\[download\]\s+([\d.]+)%')
_SPEED = re.compile(r'at\s+([\d.]+\s*[KMG]?i?B/s)')
_ETA = re.compile(r'ETA\s+([\d:]+)')
_FF_TIME = re.compile(r'time=(\d+):(\d+):(\d+)')


class Cancelled(Exception):
    pass


def _run(cmd, on_line=None, cancel=None):
    """Startet einen Prozess und liest die Ausgabe zeilenweise mit."""
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding="utf-8", errors="replace", bufsize=1,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    try:
        for line in proc.stdout:
            if cancel is not None and cancel.is_set():
                proc.kill()
                proc.wait(timeout=10)
                raise Cancelled()
            if on_line:
                on_line(line.rstrip())
    finally:
        if proc.poll() is None:
            try:
                proc.wait(timeout=30)
            except Exception:
                proc.kill()
    return proc.returncode


def _ytdlp_download(url, out_stem, frags=16, on_progress=None, cancel=None):
    """
    Laedt eine HLS-Playlist oder eine Datei nach <out_stem>.<ext>.
    Gibt den erzeugten Pfad zurueck oder None.
    """
    ytdlp = _tool("yt-dlp")
    if not ytdlp:
        raise RuntimeError("yt-dlp ist nicht installiert (winget install yt-dlp).")

    for old in glob.glob(str(out_stem) + ".*"):
        # Angefangene Reste einer frueheren, abgebrochenen Runde entfernen.
        if old.endswith((".part", ".ytdl")) or Path(old).stat().st_size < 1024:
            try:
                os.remove(old)
            except Exception:
                pass

    frags = max(1, min(int(frags or 16), 32))
    cmd = [
        ytdlp,
        "--newline", "--no-warnings", "--no-playlist",
        "--retries", "10", "--fragment-retries", "20",
        "--concurrent-fragments", str(frags), "-N", str(frags),
        "--add-header", f"Referer:{HTTP_HEADERS['Referer']}",
        "--user-agent", HTTP_HEADERS["User-Agent"],
        "-o", f"{out_stem}.%(ext)s",
        url,
    ]

    state = {"speed": "", "eta": ""}

    def line(l):
        if on_progress is None:
            return
        m = _PCT.search(l)
        if not m:
            return
        s = _SPEED.search(l)
        e = _ETA.search(l)
        if s:
            state["speed"] = s.group(1)
        if e:
            state["eta"] = e.group(1)
        on_progress(float(m.group(1)), state["speed"], state["eta"])

    rc = _run(cmd, on_line=line, cancel=cancel)
    if rc != 0:
        return None

    made = [Path(p) for p in glob.glob(str(out_stem) + ".*")
            if not p.endswith((".part", ".ytdl"))]
    made = [p for p in made if p.stat().st_size > 1024]
    return max(made, key=lambda p: p.stat().st_size) if made else None


def _remote_size(url, timeout=20):
    """Groesse der Datei und ob der Server Teilabrufe (Range) beherrscht."""
    try:
        req = urllib.request.Request(url, headers=dict(HTTP_HEADERS, Range="bytes=0-64"))
        with urllib.request.urlopen(req, timeout=timeout) as r:
            cr = r.headers.get("Content-Range", "")
            m = re.search(r'/(\d+)$', cr)
            if r.status == 206 and m:
                return int(m.group(1)), True
            length = r.headers.get("Content-Length")
            return (int(length) if length else 0), False
    except Exception:
        return 0, False


def _http_parallel_download(url, dest, connections=8, chunk_mb=4,
                            on_progress=None, cancel=None):
    """
    Laedt eine gewoehnliche Datei mit mehreren Verbindungen gleichzeitig.

    Der Verteil-Server bremst eine einzelne Verbindung stark aus (unter
    100 KB/s). Mit acht parallelen Teilabrufen wird daraus ein Vielfaches.
    Rueckgabe: True bei Erfolg.
    """
    dest = Path(dest)
    total, ranged = _remote_size(url)
    if not total or not ranged:
        return False        # Aufrufer faellt auf yt-dlp zurueck

    chunk = max(1, int(chunk_mb)) * 1024 * 1024
    parts = [(i, i * chunk, min(total, (i + 1) * chunk) - 1)
             for i in range((total + chunk - 1) // chunk)]

    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "wb") as f:          # Platz reservieren
        f.truncate(total)

    done_bytes = [0]
    counter_lock = threading.Lock()
    t0 = time.time()
    failed = threading.Event()

    def fetch(part):
        idx, start, end = part
        for attempt in range(4):
            if cancel is not None and cancel.is_set():
                raise Cancelled()
            if failed.is_set():
                return
            try:
                req = urllib.request.Request(
                    url, headers=dict(HTTP_HEADERS, Range=f"bytes={start}-{end}"))
                with urllib.request.urlopen(req, timeout=60) as r:
                    buf = bytearray()
                    while len(buf) < (end - start + 1):
                        block = r.read(262144)
                        if not block:
                            break
                        buf += block
                        if cancel is not None and cancel.is_set():
                            raise Cancelled()
                if len(buf) != (end - start + 1):
                    raise IOError(f"Teil {idx} unvollstaendig")
                with open(dest, "r+b") as f:
                    f.seek(start)
                    f.write(buf)
                with counter_lock:
                    done_bytes[0] += len(buf)
                    if on_progress:
                        pct = done_bytes[0] / total * 100
                        el = max(0.1, time.time() - t0)
                        sp = done_bytes[0] / el
                        left = (total - done_bytes[0]) / sp if sp > 0 else 0
                        on_progress(pct, f"{sp/1048576:.2f} MiB/s",
                                    f"{int(left//60):02d}:{int(left % 60):02d}")
                return
            except Cancelled:
                raise
            except Exception:
                if attempt == 3:
                    failed.set()
                    return
                time.sleep(1.5 * (attempt + 1))

    try:
        with ThreadPoolExecutor(max_workers=max(1, min(int(connections), 16))) as pool:
            list(pool.map(fetch, parts))
    except Cancelled:
        if dest.exists():
            dest.unlink()
        raise

    if failed.is_set() or done_bytes[0] < total:
        if dest.exists():
            dest.unlink()
        return False
    return True


def _download_source(url, out_stem, frags=16, on_progress=None, cancel=None):
    """
    Laedt eine Quelle - HLS ueber yt-dlp, gewoehnliche Dateien parallel per Range.
    Rueckgabe: Pfad der erzeugten Datei oder None.
    """
    is_hls = ".m3u8" in url.lower()
    if not is_hls:
        ext = Path(urllib.parse.urlparse(url).path).suffix or ".mp4"
        dest = Path(f"{out_stem}{ext}")
        try:
            if _http_parallel_download(url, dest, connections=max(4, min(frags, 16)),
                                       on_progress=on_progress, cancel=cancel):
                return dest
        except Cancelled:
            raise
        except Exception as e:
            print(f"Paralleler Download fehlgeschlagen ({e}) - versuche yt-dlp.")

    return _ytdlp_download(url, out_stem, frags=frags,
                           on_progress=on_progress, cancel=cancel)


def _media_duration(path):
    ffprobe = _tool("ffprobe")
    if not ffprobe:
        return 0.0
    try:
        out = subprocess.run(
            [ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, timeout=60,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        ).stdout.strip()
        return float(out)
    except Exception:
        return 0.0


def file_audio_langs(path):
    """Welche Tonspuren stecken in einer fertigen Datei?"""
    ffprobe = _tool("ffprobe")
    if not ffprobe or not Path(path).exists():
        return []
    try:
        out = subprocess.run(
            [ffprobe, "-v", "error", "-select_streams", "a",
             "-show_entries", "stream_tags=language", "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, timeout=60,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        ).stdout
        back = {v: k for k, v in reversed(list(ISO3.items()))}
        return [back.get(l.strip(), l.strip()) for l in out.splitlines() if l.strip()]
    except Exception:
        return []


def verify_file(path, expect_seconds=0):
    """
    Prueft eine bereits geladene Datei grob auf Vollstaendigkeit.
    Rueckgabe: (ok, meldung, sekunden)
    """
    p = Path(path)
    if not p.exists():
        return False, "Datei fehlt", 0
    if p.stat().st_size < 5 * 1024 * 1024:
        return False, "Datei ist verdaechtig klein", 0
    dur = _media_duration(p)
    if dur <= 0:
        return False, "Datei laesst sich nicht lesen (defekt)", 0
    if expect_seconds and dur < expect_seconds * 0.9:
        return False, f"nur {int(dur/60)} von {int(expect_seconds/60)} Minuten", dur
    if dur < 240:
        return False, f"nur {int(dur/60)}:{int(dur%60):02d} Minuten - vermutlich abgebrochen", dur
    return True, f"{int(dur//60)}:{int(dur%60):02d} Minuten", dur


def _mux(video_file, audio_files, target, primary_lang, on_progress=None, cancel=None):
    """Video + Tonspuren in eine MP4 zusammenfuehren."""
    ffmpeg = _tool("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg ist nicht installiert (winget install ffmpeg).")

    total = _media_duration(video_file) or 1.0
    tmp_out = Path(str(target) + ".building.mp4")
    if tmp_out.exists():
        tmp_out.unlink()

    cmd = [ffmpeg, "-y", "-hide_banner", "-i", str(video_file)]
    for _, af in audio_files:
        cmd += ["-i", str(af)]
    cmd += ["-map", "0:v:0"]
    for idx in range(1, len(audio_files) + 1):
        cmd += ["-map", f"{idx}:a:0"]
    cmd += ["-c", "copy", "-movflags", "+faststart"]
    for idx, (lang, _) in enumerate(audio_files):
        cmd += [f"-metadata:s:a:{idx}", f"language={ISO3.get(lang, lang)}",
                f"-metadata:s:a:{idx}", f"title={LANG_NAMES.get(lang, lang.upper())}",
                f"-disposition:a:{idx}", "default" if lang == primary_lang else "0"]
    cmd.append(str(tmp_out))

    def line(l):
        if on_progress is None:
            return
        m = _FF_TIME.search(l)
        if m:
            sec = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
            on_progress(min(99.0, sec / total * 100))

    rc = _run(cmd, on_line=line, cancel=cancel)
    if rc != 0 or not tmp_out.exists() or tmp_out.stat().st_size < 1024:
        if tmp_out.exists():
            tmp_out.unlink()
        return False

    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        target.unlink()
    tmp_out.rename(target)
    return True


def download_media_item(
    item,
    primary_lang="de",
    extra_langs=None,
    base_url=DEFAULT_BASE_URL,
    output_base_dir=DEFAULT_DOWNLOAD_DIR,
    progress_callback=None,
    overwrite=False,
    concurrent_fragments=16,
    cancel=None,
    remux_into_single_file=True,
):
    """
    Laedt eine Folge.

    progress_callback(prozent, phase, speed="", eta="")
    Rueckgabe: (ok, dateipfad, meldung, geladene_sprachen)
    """
    extra_langs = list(extra_langs or [])
    target = target_file_for(item, output_base_dir)
    target.parent.mkdir(parents=True, exist_ok=True)

    def say(pct, phase, speed="", eta=""):
        if progress_callback:
            try:
                progress_callback(pct, phase, speed, eta)
            except TypeError:      # aeltere Callbacks mit nur zwei Argumenten
                progress_callback(pct, phase)

    if target.exists() and target.stat().st_size > 5 * 1024 * 1024 and not overwrite:
        say(100, "bereits vorhanden")
        return True, str(target), "Bereits vorhanden - uebersprungen", file_audio_langs(target)

    say(1, "Stream wird gesucht")
    wanted = [primary_lang] + [l for l in extra_langs if l != primary_lang]
    info = resolve_streams(item, base_url=base_url, wanted=None)
    if not info.get("mode"):
        return False, str(target), info.get("error", "Keine Stream-Adresse gefunden."), []

    available = info["audio"]
    with _cache_lock:
        cache = _lang_cache()
        cache[item["uid"]] = {"langs": sorted(available, key=lambda l: ALL_LANGS.index(l)
                                              if l in ALL_LANGS else 99),
                              "mode": info["mode"], "ts": int(time.time())}
        _save_json(LANG_CACHE_FILE, cache)

    use = [l for l in wanted if l in available]
    skipped = [l for l in wanted if l not in available]
    if not use:
        if not available:
            return False, str(target), "Keine Tonspur verfuegbar.", []
        use = [sorted(available, key=lambda l: ALL_LANGS.index(l) if l in ALL_LANGS else 99)[0]]
        skipped = [l for l in wanted if l not in use]
    main_lang = use[0]

    temp_dir = target.parent / ".temp_dl"
    temp_dir.mkdir(parents=True, exist_ok=True)
    stem = sanitize_filename(item.get("ep_code") or item["uid"])
    note = ""
    if skipped:
        note = "  (ohne " + ", ".join(LANG_NAMES.get(l, l) for l in skipped) + ")"

    try:
        # ---------------- Fall A: getrenntes Video + Tonspuren ----------------
        if info["mode"] == "split":
            say(2, f"Video wird geladen ({len(use)} Tonspur(en))")
            video_file = _download_source(
                info["video"], temp_dir / f"{stem}_video",
                frags=concurrent_fragments, cancel=cancel,
                on_progress=lambda p, s, e: say(2 + p * 0.83, "Video", s, e),
            )
            if not video_file:
                return False, str(target), "Video konnte nicht geladen werden.", []

            audio_files = []
            for n, lang in enumerate(use):
                base = 85 + n * (10 / max(1, len(use)))
                span = 10 / max(1, len(use))
                say(base, f"Ton {LANG_NAMES.get(lang, lang)}")
                af = _download_source(
                    available[lang], temp_dir / f"{stem}_audio_{lang}",
                    frags=concurrent_fragments, cancel=cancel,
                    on_progress=lambda p, s, e, b=base, sp=span, l=lang:
                        say(b + p * sp / 100, f"Ton {LANG_NAMES.get(l, l)}", s, e),
                )
                if af:
                    audio_files.append((lang, af))
                else:
                    skipped.append(lang)

            if not audio_files:
                return False, str(target), "Keine Tonspur konnte geladen werden.", []

            say(95, "Tonspuren werden eingebaut")
            ok = _mux(video_file, audio_files, target, main_lang,
                      on_progress=lambda p: say(95 + p * 0.05, "Tonspuren werden eingebaut"),
                      cancel=cancel)
            if not ok:
                return False, str(target), "Zusammenfuehren fehlgeschlagen.", []
            got = [l for l, _ in audio_files]

        # ---------------- Fall B: nur fertig gemischte Datei ----------------
        else:
            say(2, "Video wird geladen (fertige Fassung)")
            src = available[main_lang]
            got_file = _download_source(
                src, temp_dir / f"{stem}_full",
                frags=concurrent_fragments, cancel=cancel,
                on_progress=lambda p, s, e: say(2 + p * 0.93, "Video", s, e),
            )
            if not got_file:
                return False, str(target), "Video konnte nicht geladen werden.", []

            say(96, "wird abgelegt")
            ffmpeg = _tool("ffmpeg")
            tagged = temp_dir / f"{stem}_tagged.mp4"
            done = False
            if ffmpeg:
                # Nur die Sprache kennzeichnen, kein Neukodieren.
                cmd = [ffmpeg, "-y", "-hide_banner", "-i", str(got_file), "-c", "copy",
                       "-movflags", "+faststart",
                       "-metadata:s:a:0", f"language={ISO3.get(main_lang, main_lang)}",
                       "-metadata:s:a:0", f"title={LANG_NAMES.get(main_lang, main_lang.upper())}",
                       str(tagged)]
                if _run(cmd, cancel=cancel) == 0 and tagged.exists() and tagged.stat().st_size > 1024:
                    if target.exists():
                        target.unlink()
                    tagged.rename(target)
                    done = True
            if not done:
                if target.exists():
                    target.unlink()
                shutil.move(str(got_file), str(target))
            got = [main_lang]
            if len(available) > 1:
                note = ("  (diese Folge gibt es nur als fertige Fassung, "
                        "deshalb nur " + LANG_NAMES.get(main_lang, main_lang) + ")")

    except Cancelled:
        return False, str(target), "Abgebrochen.", []
    except Exception as e:
        return False, str(target), f"Fehler: {e}", []
    finally:
        for leftover in glob.glob(str(temp_dir / f"{stem}_*")):
            try:
                os.remove(leftover)
            except Exception:
                pass
        try:
            if temp_dir.exists() and not any(temp_dir.iterdir()):
                temp_dir.rmdir()
        except Exception:
            pass

    ok, msg, _dur = verify_file(target)
    if not ok:
        return False, str(target), f"Datei wirkt unvollstaendig: {msg}", got

    mb = round(target.stat().st_size / 1048576)
    langs_txt = ", ".join(LANG_NAMES.get(l, l) for l in got)
    return True, str(target), f"OK - {mb} MB, {langs_txt}{note}", got


def download_media_item_multi_audio(item, primary_lang="de", extra_langs=None, **kw):
    """Alter Name - bleibt fuer bestehende Skripte erhalten."""
    kw.pop("remux_into_single_file", None)
    ok, path, msg, _langs = download_media_item(
        item, primary_lang=primary_lang, extra_langs=extra_langs, **kw)
    return ok, path, msg
