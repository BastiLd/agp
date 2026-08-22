/* ==========================================================================
   Aufklapp-Verhalten der Frage/Antwort-Blöcke (V1 und V2).

   Die Blöcke sind im HTML native <details>. Ohne JavaScript funktionieren sie
   also ganz normal – dieses Skript legt sich nur darüber und ergänzt:

     - Maus drüber   -> geht auf
     - Maus weg      -> geht wieder zu
     - Klick         -> bleibt offen (angeheftet)
     - nochmal Klick -> Heftung weg, schließt beim Weggehen
     - ohne Zeiger (Touch) -> Tippen klappt schlicht auf und zu

   Geöffnet und geschlossen wird über die Höhe, damit es von oben nach unten
   läuft statt zu springen.
   ========================================================================== */

(function () {
  "use strict";

  var DURATION = 280; // muss zur CSS-Transition der Antwort passen

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var animate = !(reduced && reduced.matches);

  /* Auf Touchgeräten gibt es kein echtes Hover – dort würde ein Tipp den
     Block sonst öffnen und sofort "hängen" lassen. */
  var pointer = window.matchMedia && window.matchMedia("(hover: hover)");
  var canHover = pointer ? pointer.matches : false;

  function setup(details) {
    var summary = details.querySelector("summary");
    var panel = details.querySelector(".qa__answer, .qa2__answer");
    if (!summary || !panel) { return; }

    /* Erst jetzt setzen: die Höhen-Animation im CSS greift nur, wenn dieses
       Skript auch wirklich läuft. */
    details.classList.add("qa--js");

    var pinned = false;
    var hovering = false;
    var timer = null;

    function clearTimer() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function open() {
      clearTimer();

      if (!animate) {
        details.open = true;
        return;
      }

      if (!details.open) {
        details.open = true;
        panel.style.height = "0px";
      }

      /* Layout erzwingen, sonst fasst der Browser das Setzen auf 0 und den
         Zielwert zu einem Schritt zusammen und es springt doch. */
      var reflow = panel.offsetHeight;
      if (reflow < 0) { return; }

      panel.style.height = panel.scrollHeight + "px";

      timer = window.setTimeout(function () {
        /* Danach auf auto, damit der Block mitwächst, wenn sich der Text
           umbricht (Fenstergröße, Schriftgröße). */
        panel.style.height = "auto";
        timer = null;
      }, DURATION);
    }

    function close() {
      clearTimer();

      if (!details.open) { return; }

      if (!animate) {
        details.open = false;
        return;
      }

      panel.style.height = panel.scrollHeight + "px";
      var reflow = panel.offsetHeight;
      if (reflow < 0) { return; }

      panel.style.height = "0px";

      timer = window.setTimeout(function () {
        details.open = false;
        panel.style.height = "";
        timer = null;
      }, DURATION);
    }

    summary.addEventListener("click", function (event) {
      /* Wir steuern das Auf- und Zuklappen selbst, sonst schaltet der Browser
         zusätzlich um und die Animation kommt aus dem Takt. */
      event.preventDefault();

      if (!canHover) {
        if (details.open) { close(); } else { open(); }
        return;
      }

      if (pinned) {
        pinned = false;
        /* Angeheftet bleibt es nur bis zum nächsten Klick. Solange der Zeiger
           noch drauf ist, bleibt es offen und schließt erst beim Weggehen. */
        if (!hovering) { close(); }
      } else {
        pinned = true;
        open();
      }
    });

    if (canHover) {
      details.addEventListener("mouseenter", function () {
        hovering = true;
        open();
      });

      details.addEventListener("mouseleave", function () {
        hovering = false;
        if (!pinned) { close(); }
      });
    }
  }

  var items = document.querySelectorAll("details.qa, details.qa2");
  Array.prototype.forEach.call(items, setup);
})();
