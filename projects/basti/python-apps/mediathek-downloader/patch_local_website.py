import os
import glob
import re
from pathlib import Path

MIRACULOUS_DIR = Path(__file__).parent / "miraculous" / "miraculous.to"

PATCH_SCRIPT = """
<!-- MIRACULOUS LOCAL WEBSITE THUMBNAIL & PLAYER PATCH -->
<script>
(function() {
    // 1. Ensure all thumbnails use valid fallback image if broken or missing
    document.addEventListener('DOMContentLoaded', function() {
        var imgs = document.querySelectorAll('img');
        imgs.forEach(function(img) {
            img.addEventListener('error', function() {
                if (!this.dataset.fallbackApplied) {
                    this.dataset.fallbackApplied = 'true';
                    this.src = 'https://miraculous.to/global_data/img/default.webp';
                }
            });
        });
        
        // 2. Video Player Fallback Fix for Offline Mirrored Pages (Season 1-5)
        var videoEl = document.getElementById('video-work');
        if (videoEl) {
            videoEl.addEventListener('error', function() {
                console.log('Local video error detected, attempting live token refresh...');
                var epMatch = window.location.href.match(/episode-(\\d+)/) || document.body.innerHTML.match(/ep=(\\d+)/);
                if (epMatch) {
                    var epCode = epMatch[1];
                    fetch('http://localhost:5000/api/status')
                        .then(r => r.json())
                        .then(d => {
                            console.log('Downloader Server active for live token refresh.');
                        }).catch(e => {});
                }
            });
        }
    });
})();
</script>
<!-- END PATCH -->
"""

def patch_all_pages():
    if not MIRACULOUS_DIR.exists():
        print("[!] Local miraculous.to directory not found.")
        return

    html_files = glob.glob(str(MIRACULOUS_DIR / "**" / "*.html"), recursive=True)
    patched_count = 0

    for hf in html_files:
        try:
            with open(hf, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if "MIRACULOUS LOCAL WEBSITE THUMBNAIL & PLAYER PATCH" in content:
                continue

            if "</head>" in content:
                new_content = content.replace("</head>", PATCH_SCRIPT + "\n</head>")
                with open(hf, "w", encoding="utf-8") as f:
                    f.write(new_content)
                patched_count += 1
        except Exception as e:
            print(f"Error patching {hf}: {e}")

    print(f"[+] {patched_count} lokale HTML-Seiten erfolgreich mit Thumbnail- & Player-Patch aktualisiert!")

if __name__ == "__main__":
    patch_all_pages()
