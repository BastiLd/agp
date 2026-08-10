"""
Baut die Offline-Mediathek fuer die gespiegelte Website.

Ergebnis: miraculous/miraculous.to/en/mediathek.html
Die Seite ist eigenstaendig (Daten sind eingebettet), braucht keinen Server und
laesst sich per Doppelklick oeffnen. Die Thumbnails werden dafuer einmalig nach
en/thumbs/ geladen - danach funktioniert alles ohne Internet.

Aufruf:  python build_mediathek.py
"""

import json
import shutil
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import downloader_core as core
from downloader_core import (
    get_all_media_items, MIRACULOUS_EN_DIR, HTTP_HEADERS,
    DEFAULT_DOWNLOAD_DIR, target_file_for, sanitize_filename,
)

THUMB_DIR = MIRACULOUS_EN_DIR / "thumbs"
OUT_FILE = MIRACULOUS_EN_DIR / "mediathek.html"


def fetch_thumbs(items):
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    done = {"n": 0, "new": 0}

    def one(it):
        dest = THUMB_DIR / f"{sanitize_filename(it['uid'])}.webp"
        if not (dest.exists() and dest.stat().st_size > 500):
            # Wenn der Downloader den Poster schon geholt hat, nur kopieren.
            cached = core.thumbnail_path(it)
            if cached.exists() and cached.stat().st_size > 500:
                shutil.copyfile(cached, dest)
            elif it.get("poster_url"):
                try:
                    req = urllib.request.Request(it["poster_url"], headers=HTTP_HEADERS)
                    with urllib.request.urlopen(req, timeout=25) as r:
                        data = r.read()
                    if len(data) > 500:
                        dest.write_bytes(data)
                        core.THUMBNAIL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
                        core.thumbnail_path(it).write_bytes(data)
                        done["new"] += 1
                except Exception as e:
                    print(f"    Poster fehlgeschlagen: {it['title']} ({e})")
        done["n"] += 1
        if done["n"] % 25 == 0:
            print(f"    {done['n']}/{len(items)} …")
        return dest.exists()

    with ThreadPoolExecutor(max_workers=12) as pool:
        oks = list(pool.map(one, items))
    return sum(1 for o in oks if o), done["new"]


def build_payload(items):
    out_dir = Path(DEFAULT_DOWNLOAD_DIR)
    data = []
    for it in items:
        thumb = THUMB_DIR / f"{sanitize_filename(it['uid'])}.webp"
        f = target_file_for(it, out_dir)
        have = f.exists() and f.stat().st_size > 5 * 1024 * 1024
        data.append({
            "uid": it["uid"],
            "title": it["title"],
            "ep": it["ep_code"],
            "cat": it["category"],
            "desc": (it["description"] or "")[:400],
            "page": it["local_page"],
            "thumb": f"thumbs/{thumb.name}" if thumb.exists() else (it.get("poster_url") or ""),
            "have": have,
            "mb": round(f.stat().st_size / 1048576) if have else 0,
            "file": Path(f).as_uri() if have else "",
        })
    return data


PAGE = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Miraculous Mediathek</title>
<style>
:root{--bg:#08090d;--card:#161925;--line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.18);
  --tx:#f3f5f9;--tx2:#99a0b6;--tx3:#666d85;--red2:#ff2d45;--grn:#22c55e;--r:13px}
*{box-sizing:border-box;margin:0;padding:0}
body{font:15px/1.5 "Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;
  background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:#2a2f42;border-radius:6px;border:2px solid var(--bg)}
a{color:inherit;text-decoration:none}
svg{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
header{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:14px;
  padding:14px 30px;background:rgba(8,9,13,.9);backdrop-filter:blur(16px);
  border-bottom:1px solid var(--line);flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:11px}
.brand .dot{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;
  background:linear-gradient(140deg,var(--red2),#8b0d18);font-size:18px}
.brand b{font-size:16px;font-weight:650;display:block;letter-spacing:-.02em}
.brand span{font-size:11.5px;color:var(--tx3)}
.spacer{flex:1}
.search{position:relative;width:250px}
.search input{width:100%;padding:9px 12px 9px 34px;background:var(--card);
  border:1px solid var(--line);border-radius:10px;outline:none;font-size:13.5px;color:var(--tx)}
.search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--tx3);font-size:15px}
.b{display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:10px;
  border:1px solid var(--line);background:var(--card);cursor:pointer;font-size:13.5px;
  font-weight:550;transition:.15s;color:var(--tx)}
.b:hover{border-color:var(--line2)}
.b.p{background:linear-gradient(140deg,var(--red2),#b80716);border-color:transparent;color:#fff}
.seg{display:flex;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:3px;gap:2px}
.seg button{padding:6px 12px;border:0;background:none;border-radius:7px;cursor:pointer;
  font-size:12.5px;color:var(--tx2)}
.seg button.on{background:#232838;color:#fff;font-weight:600}
.hero{position:relative;padding:50px 30px 42px;border-bottom:1px solid var(--line);overflow:hidden}
.hero::before{content:"";position:absolute;inset:0;
  background:radial-gradient(900px 420px at 15% -20%,rgba(229,9,28,.28),transparent 65%)}
.hero>*{position:relative}
.hero h1{font-size:clamp(26px,4.4vw,42px);font-weight:750;letter-spacing:-.03em;margin-bottom:9px}
.hero p{color:var(--tx2);max-width:60ch;font-size:14.5px}
.stats{display:flex;gap:26px;margin-top:20px;flex-wrap:wrap}
.stat b{display:block;font-size:22px;font-weight:700}
.stat span{font-size:11.5px;color:var(--tx3);text-transform:uppercase;letter-spacing:.07em}
main{padding:20px 0 70px}
.row{margin-bottom:32px}
.rowhead{display:flex;align-items:baseline;gap:12px;padding:0 30px 12px}
.rowhead h2{font-size:18px;font-weight:650}
.rowhead .n{font-size:12.5px;color:var(--tx3)}
.strip{display:flex;gap:14px;overflow-x:auto;padding:4px 30px 12px}
.grid{display:grid;gap:15px;padding:4px 30px 12px;grid-template-columns:repeat(auto-fill,minmax(215px,1fr))}
.card{width:238px;flex:none;cursor:pointer;transition:.16s}
.grid .card{width:auto}
.card:hover{transform:translateY(-4px)}
.thumb{position:relative;aspect-ratio:16/9;border-radius:var(--r);overflow:hidden;
  background:#0e1017;border:1px solid var(--line)}
.card:hover .thumb{border-color:var(--line2);box-shadow:0 12px 30px rgba(0,0,0,.55)}
.thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:.35s}
.card:hover .thumb img{transform:scale(1.06)}
.thumb .ph{position:absolute;inset:0;display:grid;place-items:center;font-size:28px;opacity:.18}
.play{position:absolute;inset:0;display:grid;place-items:center;opacity:0;transition:.18s;
  background:rgba(6,7,11,.5)}
.card:hover .play{opacity:1}
.play i{width:46px;height:46px;border-radius:50%;background:#fff;color:#0a0b10;
  display:grid;place-items:center;font-size:17px;font-style:normal;padding-left:3px}
.tag{position:absolute;top:8px;left:8px;padding:3px 7px;border-radius:6px;font-size:10.5px;
  font-weight:700;background:rgba(0,0,0,.72)}
.tag.ok{background:rgba(34,197,94,.92);color:#04240f;left:auto;right:8px}
.card h3{font-size:13.5px;font-weight:600;margin-top:9px;line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card .sub{font-size:11.5px;color:var(--tx3);margin-top:2px}
.ov{position:fixed;inset:0;background:rgba(3,4,7,.93);z-index:200;display:none;
  align-items:center;justify-content:center;padding:22px}
.ov.on{display:flex}
.md{width:min(100%,880px);max-height:92vh;overflow-y:auto;background:#101219;
  border:1px solid var(--line);border-radius:16px}
.md img.big{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px 16px 0 0;display:block}
.mb{padding:18px 22px 22px}
.mb .top{display:flex;gap:14px;margin-bottom:11px}
.mb h2{font-size:19px;font-weight:650;flex:1}
.mb .close{background:none;border:0;color:var(--tx3);font-size:24px;cursor:pointer;padding:2px 7px}
.pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.pill{padding:4px 10px;border-radius:999px;background:var(--card);border:1px solid var(--line);
  font-size:11.5px;color:var(--tx2)}
.pill.ok{background:rgba(34,197,94,.14);border-color:rgba(34,197,94,.34);color:#7ee2a4}
.mb p{font-size:13.5px;line-height:1.6;color:var(--tx2);margin-bottom:16px}
.acts{display:flex;gap:9px;flex-wrap:wrap}
.note{font-size:12px;color:var(--tx3);padding:12px 14px;background:var(--card);
  border:1px solid var(--line);border-radius:11px;margin-bottom:14px;line-height:1.55}
.empty{text-align:center;padding:60px;color:var(--tx3)}
@media(max-width:760px){header,.hero,.rowhead,.strip,.grid{padding-left:16px;padding-right:16px}
  .search{width:100%;order:9}.card{width:190px}}
</style>
</head>
<body>
<header>
  <div class="brand"><div class="dot">&#128030;</div>
    <div><b>Mediathek</b><span>Miraculous Ladybug</span></div></div>
  <div class="spacer"></div>
  <div class="seg" id="filt">
    <button data-f="all" class="on">Alles</button>
    <button data-f="have">Auf dem PC</button>
  </div>
  <div class="search">
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none"/><path d="m20 20-3.5-3.5"/></svg>
    <input id="q" placeholder="Folge suchen &#8230;">
  </div>
  <a class="b" href="index.html">Zur Website</a>
</header>

<section class="hero">
  <h1>Alle Staffeln, Filme und Specials</h1>
  <p>Klick auf eine Folge, um sie anzusehen. Was du heruntergeladen hast,
     laeuft direkt vom PC &#8211; der Rest oeffnet die gespiegelte Seite.</p>
  <div class="stats">
    <div class="stat"><b id="kT">0</b><span>Titel</span></div>
    <div class="stat"><b id="kH">0</b><span>auf dem PC</span></div>
    <div class="stat"><b id="kC">0</b><span>Kategorien</span></div>
    <div class="stat"><b id="kS">0</b><span>Speicher</span></div>
  </div>
</section>

<main id="main"></main>

<div class="ov" id="ov"><div class="md" id="md"></div></div>

<script>
const DATA = __DATA__;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let q = '', filt = 'all';

const ord = c => { const m = c.match(/Staffel (\\d+)/); return m ? +m[1] : 99; };

function stats() {
  const h = DATA.filter(d => d.have);
  $('#kT').textContent = DATA.length;
  $('#kH').textContent = h.length;
  $('#kC').textContent = new Set(DATA.map(d => d.cat)).size;
  const gb = h.reduce((a, d) => a + d.mb, 0) / 1024;
  $('#kS').textContent = gb >= 1 ? gb.toFixed(1) + ' GB' : Math.round(gb * 1024) + ' MB';
}

function render() {
  let list = DATA;
  if (filt === 'have') list = list.filter(d => d.have);
  if (q) list = list.filter(d => (d.title + ' ' + d.ep + ' ' + d.cat).toLowerCase().includes(q));
  if (!list.length) { $('#main').innerHTML = '<div class="empty">Nichts gefunden.</div>'; return; }
  const cats = [...new Set(list.map(d => d.cat))].sort((a, b) => ord(a) - ord(b));
  const wide = !!q || filt === 'have';
  $('#main').innerHTML = cats.map(c => {
    const l = list.filter(d => d.cat === c);
    const dn = l.filter(d => d.have).length;
    return `<section class="row"><div class="rowhead"><h2>${esc(c)}</h2>
      <span class="n">${dn} von ${l.length} auf dem PC</span></div>
      <div class="${wide ? 'grid' : 'strip'}">${l.map(card).join('')}</div></section>`;
  }).join('');
  document.querySelectorAll('.card').forEach(el => el.onclick = () => open(el.dataset.u));
}

function card(d) {
  return `<div class="card" data-u="${esc(d.uid)}"><div class="thumb">
    ${d.thumb ? `<img src="${esc(d.thumb)}" loading="lazy" alt="" onerror="this.remove()">` : ''}
    <div class="ph">&#128030;</div>
    ${d.ep ? `<span class="tag">${esc(d.ep)}</span>` : ''}
    ${d.have ? '<span class="tag ok">Offline</span>' : ''}
    <div class="play"><i>&#9654;</i></div></div>
    <h3>${esc(d.title)}</h3>
    <div class="sub">${d.have ? d.mb + ' MB &#183; lokal' : 'auf der Website ansehen'}</div></div>`;
}

function open(uid) {
  const d = DATA.find(x => x.uid === uid); if (!d) return;
  $('#md').innerHTML = `
    ${d.have
      ? `<video controls autoplay playsinline style="width:100%;aspect-ratio:16/9;
           background:#000;border-radius:16px 16px 0 0;display:block"
           src="${esc(d.file)}"></video>`
      : d.thumb ? `<img class="big" src="${esc(d.thumb)}" alt="">` : ''}
    <div class="mb">
      <div class="top"><h2>${esc(d.title)}</h2>
        <button class="close" onclick="closeP()">&times;</button></div>
      <div class="pills"><span class="pill">${esc(d.cat)}</span>
        ${d.ep ? `<span class="pill">Folge ${esc(d.ep)}</span>` : ''}
        ${d.have ? `<span class="pill ok">Offline &#183; ${d.mb} MB</span>` : ''}</div>
      ${d.have ? '' : `<div class="note">Diese Folge liegt noch nicht auf dem PC.
        Starte den Downloader (python server.py), um sie zu laden.</div>`}
      <p>${esc(d.desc || '')}</p>
      <div class="acts">
        <a class="b p" href="${esc(d.page)}">Auf der Website ansehen</a>
        ${d.have ? `<a class="b" href="${esc(d.file)}" download>Datei speichern</a>` : ''}
      </div>
    </div>`;
  $('#ov').classList.add('on');
}
function closeP() { $('#ov').classList.remove('on'); $('#md').innerHTML = ''; }

$('#q').oninput = e => { q = e.target.value.toLowerCase().trim(); render(); };
$('#filt').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  filt = b.dataset.f;
  $('#filt').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  render();
};
$('#ov').onclick = e => { if (e.target === $('#ov')) closeP(); };
document.onkeydown = e => { if (e.key === 'Escape') closeP(); };
stats(); render();
</script>
</body>
</html>
"""


def main():
    items = get_all_media_items()
    if not items:
        print("[!] Keine Folgen gefunden - liegt der Mirror unter miraculous/miraculous.to/en/ ?")
        return

    print(f"[1/3] {len(items)} Titel gefunden.")
    print("[2/3] Thumbnails werden geholt (einmalig) ...")
    have, new = fetch_thumbs(items)
    print(f"      {have}/{len(items)} Thumbnails lokal ({new} neu geladen).")

    print("[3/3] Mediathek wird gebaut ...")
    payload = json.dumps(build_payload(items), ensure_ascii=False)
    OUT_FILE.write_text(PAGE.replace("__DATA__", payload), encoding="utf-8")

    downloaded = sum(1 for d in json.loads(payload) if d["have"])
    print(f"\n[+] Fertig: {OUT_FILE}")
    print(f"    {len(items)} Titel, davon {downloaded} bereits auf dem PC.")
    print("    Einfach die Datei doppelklicken - laeuft ohne Server.")


if __name__ == "__main__":
    main()
