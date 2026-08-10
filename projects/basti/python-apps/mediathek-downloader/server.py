"""
Weboberflaeche des Miraculous-Downloaders.

Starten:  python server.py
Dann im Browser http://localhost:5000 oeffnen (Adresse fuers Handy wird angezeigt).
"""

import os
import re
import sys
import json
import time
import socket
import threading
import subprocess
import urllib.parse
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from concurrent.futures import ThreadPoolExecutor

import downloader_core as core
from downloader_core import (
    get_all_media_items, download_media_item, target_file_for, thumbnail_path,
    fetch_thumbnail, probe_langs, cached_langs, verify_file, find_item,
    DEFAULT_DOWNLOAD_DIR, DEFAULT_BASE_URL, ALL_LANGS, LANG_NAMES, have_tools,
)

PORT = 5000
BASE_DIR = Path(__file__).parent.resolve()
WEB_UI_DIR = BASE_DIR / "web_ui"
SETTINGS_FILE = BASE_DIR / "settings.json"

DEFAULT_SETTINGS = {
    "base_url": DEFAULT_BASE_URL,
    "primary_lang": "de",
    "extra_langs": ["en"],
    "remux_single_file": True,
    "max_parallel": 2,
    "concurrent_fragments": 16,
    "download_dir": str(DEFAULT_DOWNLOAD_DIR),
}


def load_settings():
    s = dict(DEFAULT_SETTINGS)
    try:
        s.update(json.loads(SETTINGS_FILE.read_text(encoding="utf-8")))
    except Exception:
        pass
    return s


def save_settings(s):
    try:
        SETTINGS_FILE.write_text(json.dumps(s, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        print(f"Einstellungen konnten nicht gespeichert werden: {e}")


settings = load_settings()


# --------------------------------------------------------------------------
# Laufender Zustand
# --------------------------------------------------------------------------

lock = threading.RLock()

state = {
    "running": False,
    "started": 0.0,
    "finished": 0.0,
    "total": 0,
    "done": 0,
    "skipped": 0,
    "failed": 0,
    "summary": "Bereit",
    "logs": [],
    "jobs": {},                       # uid -> job
    "failures": [],                   # was ist beim letzten Lauf schiefgegangen
    "thumbs": {"running": False, "done": 0, "total": 0},
    "verify": {"running": False, "done": 0, "total": 0, "results": []},
}

cancel_event = threading.Event()
worker_thread = None


def log(msg):
    line = time.strftime("[%H:%M:%S] ") + msg
    with lock:
        state["logs"].append(line)
        if len(state["logs"]) > 300:
            del state["logs"][:-300]
    print(line, flush=True)


def snapshot():
    """Der Zustand so, wie ihn die Weboberflaeche erwartet."""
    with lock:
        elapsed = int((state["finished"] or time.time()) - state["started"]) if state["started"] else 0
        return {
            "running": state["running"],
            "total": state["total"],
            "done": state["done"],
            "skipped": state["skipped"],
            "failed": state["failed"],
            "elapsed": max(0, elapsed),
            "summary": state["summary"],
            "logs": list(state["logs"])[-200:],
            "jobs": list(state["jobs"].values()),
            "failures": list(state["failures"]),
            "thumbs": dict(state["thumbs"]),
            "verify": dict(state["verify"]),
        }


# --------------------------------------------------------------------------
# Titel-Liste fuer die Oberflaeche
# --------------------------------------------------------------------------

def enrich(item, out_dir):
    f = target_file_for(item, out_dir)
    have = f.exists() and f.stat().st_size > 5 * 1024 * 1024
    thumb = thumbnail_path(item)
    return {
        "uid": item["uid"],
        "title": item["title"],
        "ep_code": item["ep_code"],
        "category": item["category"],
        "type": item["type"],
        "description": item["description"],
        "poster_url": item["poster_url"],
        "thumb": f"/thumbnails/{thumb.name}" if thumb.exists() else "",
        "local_page": item["local_page"],
        "page_url": item["page_url"],
        "downloaded": have,
        "size_mb": round(f.stat().st_size / 1048576) if have else 0,
        "file": str(f),
        "known_langs": cached_langs(item),
    }


def all_items():
    out_dir = Path(settings.get("download_dir", str(DEFAULT_DOWNLOAD_DIR)))
    return [enrich(i, out_dir) for i in get_all_media_items()]


def pick_items(data):
    """Aus dem Anfrage-Rumpf die gewuenschten Folgen heraussuchen."""
    items = get_all_media_items()
    uid = data.get("uid")
    uids = data.get("uids") or ([uid] if uid else [])
    if uids:
        want = set(uids)
        return [i for i in items if i["uid"] in want]

    ep = data.get("ep_code")
    eps = data.get("ep_codes") or ([ep] if ep else [])
    if eps:
        want = set(str(e) for e in eps)
        return [i for i in items if i["ep_code"] in want]

    cat = data.get("category")
    if cat and cat != "all":
        return [i for i in items if i["category"] == cat]
    if cat == "all":
        return items
    return []


# --------------------------------------------------------------------------
# Download-Lauf
# --------------------------------------------------------------------------

def run_batch(items, primary_lang, extra_langs, base_url, out_dir, max_workers,
              frags, overwrite):
    with lock:
        state.update({
            "running": True, "started": time.time(), "finished": 0.0,
            "total": len(items), "done": 0, "skipped": 0, "failed": 0,
            "summary": "Download laeuft", "jobs": {}, "failures": [],
        })
    cancel_event.clear()

    tools = have_tools()
    if not tools["yt-dlp"]:
        log("FEHLER: yt-dlp ist nicht installiert - bitte 'winget install yt-dlp' ausfuehren.")
    if not tools["ffmpeg"]:
        log("FEHLER: ffmpeg fehlt - mehrere Tonspuren lassen sich nicht zusammenfuehren.")

    langs_txt = ", ".join(LANG_NAMES.get(l, l) for l in [primary_lang] + list(extra_langs))
    log(f"Start: {len(items)} Titel, Ton: {langs_txt}, {max_workers} gleichzeitig, "
        f"{frags} Segmente")

    def one(item):
        uid = item["uid"]
        if cancel_event.is_set():
            return
        job = {"uid": uid, "title": item["title"], "ep": item["ep_code"],
               "phase": "wartet", "percent": 0.0, "speed": "", "eta": "",
               "status": "running"}
        with lock:
            state["jobs"][uid] = job

        def prog(pct, phase, speed="", eta=""):
            with lock:
                job["percent"] = round(min(100.0, max(0.0, pct)), 1)
                job["phase"] = phase
                job["speed"] = speed
                job["eta"] = eta

        ok, path, msg, _langs = download_media_item(
            item,
            primary_lang=primary_lang,
            extra_langs=extra_langs,
            base_url=base_url,
            output_base_dir=out_dir,
            progress_callback=prog,
            overwrite=overwrite,
            concurrent_fragments=frags,
            cancel=cancel_event,
        )

        with lock:
            job["status"] = "done" if ok else "failed"
            job["percent"] = 100.0 if ok else job["percent"]
            job["phase"] = msg
            if ok and "vorhanden" in msg:
                state["skipped"] += 1
            elif ok:
                state["done"] += 1
            else:
                state["failed"] += 1
                state["failures"].append({"uid": uid, "title": item["title"],
                                          "ep": item["ep_code"], "msg": msg})
            state["jobs"].pop(uid, None)

        log(f"{'OK ' if ok else 'FEHLER'} {item['ep_code']} {item['title']}: {msg}")

    try:
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            list(pool.map(one, items))
    except Exception as e:
        log(f"FEHLER im Ablauf: {e}")

    with lock:
        state["running"] = False
        state["finished"] = time.time()
        state["jobs"] = {}
        if cancel_event.is_set():
            state["summary"] = "Abgebrochen"
            log("Abgebrochen.")
        else:
            d, s, f = state["done"], state["skipped"], state["failed"]
            parts = [f"{d} geladen"]
            if s:
                parts.append(f"{s} schon vorhanden")
            if f:
                parts.append(f"{f} fehlgeschlagen")
            state["summary"] = "Fertig - " + ", ".join(parts)
            log("Fertig: " + ", ".join(parts))


def run_thumbnails():
    items = get_all_media_items()
    with lock:
        state["thumbs"] = {"running": True, "done": 0, "total": len(items)}
    log(f"Vorschaubilder: {len(items)} Titel werden geprueft.")

    def one(it):
        fetch_thumbnail(it)
        with lock:
            state["thumbs"]["done"] += 1

    try:
        with ThreadPoolExecutor(max_workers=12) as pool:
            list(pool.map(one, items))
    finally:
        with lock:
            have = state["thumbs"]["done"]
            state["thumbs"]["running"] = False
        log(f"Vorschaubilder fertig ({have} geprueft).")


def run_verify():
    out_dir = Path(settings.get("download_dir", str(DEFAULT_DOWNLOAD_DIR)))
    items = [i for i in get_all_media_items() if target_file_for(i, out_dir).exists()]
    with lock:
        state["verify"] = {"running": True, "done": 0, "total": len(items), "results": []}
    log(f"Pruefung: {len(items)} vorhandene Dateien werden kontrolliert.")

    results = []

    def one(it):
        f = target_file_for(it, out_dir)
        ok, msg, _dur = verify_file(f)
        with lock:
            state["verify"]["done"] += 1
            results.append({"uid": it["uid"], "title": it["title"], "ok": ok, "msg": msg})
        if not ok:
            log(f"defekt: {it['ep_code']} {it['title']} - {msg}")

    try:
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(one, items))
    finally:
        bad = [r for r in results if not r["ok"]]
        with lock:
            state["verify"]["running"] = False
            state["verify"]["results"] = results
        log(f"Pruefung fertig: {len(results) - len(bad)} in Ordnung, {len(bad)} defekt.")


# --------------------------------------------------------------------------
# HTTP
# --------------------------------------------------------------------------

CONTENT_TYPES = {
    ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
    ".json": "application/json", ".webp": "image/webp", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
    ".svg": "image/svg+xml", ".ico": "image/x-icon",
}


class Handler(BaseHTTPRequestHandler):
    server_version = "MiraculousDownloader/2.0"

    def log_message(self, fmt, *args):
        pass  # Zugriffe nicht in die Konsole spammen

    # ---------- Antworten ----------
    def _json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _file(self, path):
        path = Path(path)
        if not path.is_file():
            self.send_error(404, "Not Found")
            return
        ctype = CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype + ("; charset=utf-8" if ctype.startswith("text") or ctype.endswith("javascript") else ""))
        self.send_header("Content-Length", str(len(data)))
        if path.suffix.lower() in (".webp", ".png", ".jpg", ".jpeg"):
            self.send_header("Cache-Control", "max-age=86400")
        else:
            self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _body(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
        except ValueError:
            n = 0
        if not n:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return {}

    # ---------- GET ----------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/items":
            self._json(all_items())
        elif path == "/api/status":
            self._json(snapshot())
        elif path == "/api/settings":
            self._json({**settings, "lang_names": LANG_NAMES, "all_langs": ALL_LANGS,
                        "tools": {k: bool(v) for k, v in have_tools().items()}})
        elif path == "/api/langs":
            uid = (query.get("uid") or [""])[0]
            item = find_item(get_all_media_items(), uid)
            if not item:
                self._json({"langs": [], "error": "Titel unbekannt"}, 404)
                return
            try:
                langs = probe_langs(item, base_url=settings.get("base_url", DEFAULT_BASE_URL),
                                    force=(query.get("force") or ["0"])[0] == "1")
                self._json({"uid": uid, "langs": langs,
                            "names": {l: LANG_NAMES.get(l, l) for l in langs}})
            except Exception as e:
                self._json({"langs": [], "error": str(e)}, 500)
        elif path in ("/", "/index.html"):
            self._file(WEB_UI_DIR / "index.html")
        elif path in ("/browse", "/browse.html", "/mediathek"):
            self._file(WEB_UI_DIR / "browse.html")
        else:
            rel = urllib.parse.unquote(path.lstrip("/"))
            target = (WEB_UI_DIR / rel).resolve()
            try:
                target.relative_to(WEB_UI_DIR.resolve())   # kein Ausbruch aus web_ui/
            except ValueError:
                self.send_error(403, "Forbidden")
                return
            self._file(target)

    # ---------- POST ----------
    def do_POST(self):
        global worker_thread, settings
        path = urllib.parse.urlparse(self.path).path
        data = self._body()

        if path == "/api/settings":
            clean = {k: v for k, v in data.items() if k not in ("lang_names", "all_langs", "tools")}
            settings.update(clean)
            save_settings(settings)
            self._json({"success": True, "settings": settings})

        elif path == "/api/download":
            with lock:
                if state["running"]:
                    self._json({"success": False, "message": "Es laeuft bereits ein Download."}, 409)
                    return

            items = pick_items(data)
            if not items:
                self._json({"success": False,
                            "message": "Keine passenden Titel gefunden."}, 400)
                return

            primary = data.get("primary_lang") or settings.get("primary_lang", "de")
            extra = data.get("extra_langs")
            if extra is None:
                extra = settings.get("extra_langs", [])
            extra = [l for l in extra if l != primary]
            base_url = data.get("base_url") or settings.get("base_url", DEFAULT_BASE_URL)
            out_dir = Path(settings.get("download_dir", str(DEFAULT_DOWNLOAD_DIR)))
            workers = max(1, min(int(data.get("max_parallel")
                                     or settings.get("max_parallel", 2)), 6))
            frags = max(1, min(int(data.get("concurrent_fragments")
                                   or settings.get("concurrent_fragments", 16)), 32))
            overwrite = bool(data.get("overwrite", False))

            worker_thread = threading.Thread(
                target=run_batch,
                args=(items, primary, extra, base_url, out_dir, workers, frags, overwrite),
                daemon=True)
            worker_thread.start()
            self._json({"success": True, "count": len(items),
                        "message": f"{len(items)} Titel werden geladen."})

        elif path == "/api/stop":
            cancel_event.set()
            with lock:
                state["summary"] = "wird abgebrochen …"
            self._json({"success": True, "message": "Wird abgebrochen …"})

        elif path == "/api/thumbnails":
            with lock:
                if state["thumbs"]["running"]:
                    self._json({"success": False, "message": "Laeuft bereits."}, 409)
                    return
            threading.Thread(target=run_thumbnails, daemon=True).start()
            self._json({"success": True, "message": "Vorschaubilder werden geladen."})

        elif path == "/api/verify":
            with lock:
                if state["verify"]["running"]:
                    self._json({"success": False, "message": "Laeuft bereits."}, 409)
                    return
            threading.Thread(target=run_verify, daemon=True).start()
            self._json({"success": True, "message": "Dateien werden geprueft."})

        elif path == "/api/open":
            uid = data.get("uid")
            item = find_item(get_all_media_items(), uid)
            if not item:
                self._json({"success": False, "message": "Titel unbekannt."}, 404)
                return
            out_dir = Path(settings.get("download_dir", str(DEFAULT_DOWNLOAD_DIR)))
            f = target_file_for(item, out_dir)
            if not f.exists():
                self._json({"success": False, "message": "Datei ist nicht vorhanden."}, 404)
                return
            try:
                if data.get("folder"):
                    subprocess.Popen(["explorer", "/select,", str(f)])
                else:
                    os.startfile(str(f))    # noqa: S606 - nur lokal
                self._json({"success": True})
            except Exception as e:
                self._json({"success": False, "message": str(e)}, 500)

        elif path == "/api/rescan":
            get_all_media_items(force=True)
            self._json({"success": True, "count": len(get_all_media_items())})

        else:
            self.send_error(404, "Not Found")


def local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    tools = have_tools()
    items = get_all_media_items(force=True)
    out_dir = Path(settings.get("download_dir", str(DEFAULT_DOWNLOAD_DIR)))
    have = sum(1 for i in items if target_file_for(i, out_dir).exists())

    print("=" * 66)
    print("   MIRACULOUS DOWNLOADER")
    print("=" * 66)
    print(f"  Auf dem PC:      http://localhost:{PORT}")
    print(f"  Im Netz/Handy:   http://{local_ip()}:{PORT}")
    print(f"  Titel gefunden:  {len(items)}  ({have} bereits geladen)")
    print(f"  Zielordner:      {out_dir}")
    if not tools["yt-dlp"]:
        print("  ! yt-dlp fehlt   ->  winget install yt-dlp")
    if not tools["ffmpeg"]:
        print("  ! ffmpeg fehlt   ->  winget install ffmpeg")
    print("=" * 66)

    srv = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    srv.daemon_threads = True
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nServer beendet.")
        srv.shutdown()


if __name__ == "__main__":
    main()
