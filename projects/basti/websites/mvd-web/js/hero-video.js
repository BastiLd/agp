/* ==========================================================================
   Hero-Video (V2-Startseite) – wird erst geladen, wenn es gebraucht wird.

   Die Datei ist rund 16 MB. Würde sie beim Seitenaufruf sofort mitgeladen,
   dauert der erste Aufbau auf dem Handy spürbar lange und frisst mobiles
   Datenvolumen – für ein Bild, das man vielleicht gar nicht ansieht.

   Deshalb steht im HTML nur das Standbild (poster) und preload="none". Die
   Quelle wird hier erst gesetzt, wenn das Video wirklich im Bild ist. Bis
   dahin sieht man das Standbild, es gibt also keinen leeren Kasten.

   Läuft etwas schief (kein IntersectionObserver, Ladefehler, Autoplay vom
   Browser blockiert), bleibt das Standbild stehen – der Bereich sieht dann
   aus wie vorher mit einem festen Bild.
   ========================================================================== */

(function () {
  "use strict";

  var video = document.querySelector(".vhero__video");
  if (!video) { return; }

  var SRC = "assets/videos/hero.mp4";
  var loaded = false;

  function load() {
    if (loaded) { return; }
    loaded = true;

    var source = document.createElement("source");
    source.src = SRC;
    source.type = "video/mp4";
    video.appendChild(source);

    video.preload = "auto";
    video.load();

    /* Autoplay kann trotz muted abgelehnt werden. Dann bleibt einfach das
       Standbild stehen, statt dass eine Fehlermeldung in der Konsole landet. */
    var attempt = video.play();
    if (attempt && attempt.catch) {
      attempt.catch(function () {
        video.classList.add("is-paused");
      });
    }
  }

  video.addEventListener("playing", function () {
    video.classList.add("is-playing");
  });

  video.addEventListener("error", function () {
    video.classList.add("is-paused");
  });

  if (!("IntersectionObserver" in window)) {
    load();
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) { return; }
    observer.disconnect();
    load();
  }, { rootMargin: "200px" });

  observer.observe(video);
})();
