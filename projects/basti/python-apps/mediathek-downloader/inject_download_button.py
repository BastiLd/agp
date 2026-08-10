import os
import glob
from pathlib import Path

MIRACULOUS_DIR = Path(__file__).parent / "miraculous" / "miraculous.to"

BUTTON_HTML = """
<!-- LADYBUG DOWNLOAD BUTTON INJECTION -->
<div class="mto-ladybug-download-bar" style="margin: 15px 0; padding: 14px 20px; background: linear-gradient(135deg, #14161f, #1c1f2e); border: 1px solid rgba(229,9,20,0.4); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 6px 20px rgba(0,0,0,0.3); font-family: 'Montserrat', sans-serif;">
    <div style="display: flex; align-items: center; gap: 12px; color: #fff;">
        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #e50914, #b71c1c); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff;">🐞</div>
        <div>
            <strong style="font-size: 14px; display: block; color: #fff;">Ladybug Video Downloader</strong>
            <span style="font-size: 11px; color: #a0a5ba;">Diese Folge direkt auf deinen PC herunterladen</span>
        </div>
    </div>
    <button onclick="mtoTriggerDownloadThis()" style="background: linear-gradient(135deg, #e50914, #c62828); color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;">
        <span id="mtoDlBtnText">⬇ Folge herunterladen</span>
    </button>
</div>

<script>
function mtoTriggerDownloadThis() {
    var btnText = document.getElementById('mtoDlBtnText');
    if(btnText) btnText.innerText = '⏳ Starte Download...';
    
    var epMatch = window.location.href.match(/episode-(\\d+)/) || document.body.innerHTML.match(/ep=(\\d+)/);
    var epCode = epMatch ? epMatch[1] : '';
    
    fetch('http://localhost:5000/api/download', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ ep_code: epCode, lang: 'de' })
    })
    .then(res => res.json())
    .then(data => {
        if(btnText) btnText.innerText = '✔ In Warteschlange!';
        setTimeout(() => { if(btnText) btnText.innerText = '⬇ Folge herunterladen'; }, 4000);
    })
    .catch(err => {
        alert('Bitte starte den Miraculous Downloader (python server.py) auf deinem PC!');
        if(btnText) btnText.innerText = '⬇ Folge herunterladen';
    });
}
</script>
<!-- END INJECTION -->
"""

def inject_buttons():
    if not MIRACULOUS_DIR.exists():
        print("[!] Website Pfad nicht gefunden!")
        return

    html_files = glob.glob(str(MIRACULOUS_DIR / "**" / "*.html"), recursive=True)
    injected_count = 0

    for hf in html_files:
        base_name = Path(hf).name
        if base_name in ["index.html", "episodes.html", "music.html", "about.html", "index-2.html", "episodes-2.html", "music-2.html", "about-2.html"]:
            continue
        try:
            with open(hf, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if "LADYBUG DOWNLOAD BUTTON INJECTION" in content:
                continue

            # Inject right below videoarea div or watch stage
            if '<div id="videoarea">' in content:
                new_content = content.replace('<div id="videoarea">', '<div id="videoarea">\n' + BUTTON_HTML)
                with open(hf, "w", encoding="utf-8") as f:
                    f.write(new_content)
                injected_count += 1
        except Exception as e:
            print(f"Fehler bei {hf}: {e}")

    print(f"[+] Download-Buttons in {injected_count} HTML-Seiten erfolgreich eingebettet!")

if __name__ == "__main__":
    inject_buttons()
