/* ==========================================================================
   Sektions-Navigation – wird von V1 und V2 gemeinsam genutzt.

   Zwei Dinge auf einmal:

     1. Fortschrittsbalken: Jeder Bereich trägt oben links einen farbigen
        Strich. Der wächst von Bereich zu Bereich, beim letzten reicht er
        über die ganze Breite.

     2. Sprungmarken: Rechts in der Mitte liegen waagrechte Striche, einer je
        Bereich. Beim Überfahren erscheint der Name, ein Klick springt hin.
        Der Strich des Bereichs, in dem man gerade ist, hebt sich ab.

   WICHTIG – das hier muss beim Hinzufügen eines Bereichs von selbst passen:
   Beides wird zur Laufzeit aus dem HTML gelesen. Ein neuer Bereich braucht
   nur zwei Dinge:

       <section id="…" data-nav="Anzeigename"> … </section>

   Also eine id (das Sprungziel) und data-nav (der Name im Menü). Sonst
   nichts. Die Breiten des Fortschrittsbalkens und die Anzahl der Striche
   rechnet dieses Skript neu aus – es gibt keine Stelle, an der die Anzahl
   der Bereiche fest eingetragen wäre.
   ========================================================================== */

(function () {
  "use strict";

  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  if (sections.length < 2) { return; }

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var smooth = !(reduced && reduced.matches);

  /* ---------------------------------------------------------------- 1. Balken
     Anteil je Bereich: beim ersten ein n-tel, beim letzten voll. Der Wert
     landet als CSS-Variable am Bereich, gezeichnet wird im Stylesheet. */
  sections.forEach(function (section, i) {
    section.style.setProperty("--band-progress", ((i + 1) / sections.length).toFixed(4));
  });

  /* ------------------------------------------------------------ 2. Sprungmarken */
  var nav = document.createElement("nav");
  nav.className = "secnav";
  nav.setAttribute("aria-label", "Bereiche");

  var list = document.createElement("ul");
  nav.appendChild(list);

  var links = sections.map(function (section, i) {
    var item = document.createElement("li");
    var link = document.createElement("a");

    link.className = "secnav__link";
    link.href = "#" + section.id;
    link.innerHTML =
      '<span class="secnav__dash" aria-hidden="true"></span>' +
      '<span class="secnav__label">' + section.getAttribute("data-nav") + "</span>";

    link.addEventListener("click", function (event) {
      event.preventDefault();
      section.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      /* Der Fokus soll mitwandern, sonst springt die Tastaturbedienung
         danach wieder an den Seitenanfang. */
      section.setAttribute("tabindex", "-1");
      section.focus({ preventScroll: true });
    });

    item.appendChild(link);
    list.appendChild(item);
    return link;
  });

  document.body.appendChild(nav);

  /* ----------------------------------------------------- Aktiven Bereich merken
     Genommen wird der Bereich, dessen Oberkante zuletzt oberhalb der
     Bildschirmmitte lag – das entspricht dem, was man gerade liest. */
  var current = -1;

  function update() {
    var line = window.innerHeight * 0.4;
    var active = 0;

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) {
        active = i;
      }
    }

    if (active === current) { return; }
    current = active;

    for (var j = 0; j < links.length; j++) {
      var on = j === active;
      links[j].classList.toggle("is-active", on);
      if (on) {
        links[j].setAttribute("aria-current", "true");
      } else {
        links[j].removeAttribute("aria-current");
      }
    }
  }

  /* Auf einem eigenen Frame statt bei jedem Scroll-Ereignis – sonst rechnet
     die Seite beim Scrollen dauernd Layout neu. */
  var queued = false;
  function onScroll() {
    if (queued) { return; }
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      update();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
