/* ==========================================================================
   Fragen als Kacheln mit Overlay (V1).

   Vorher standen die Fragen als Aufklapper untereinander. Beim Öffnen wuchs
   der Abschnitt, alles darunter rutschte weg und die halbe Seite sprang.
   Jetzt liegen die Fragen als Kacheln nebeneinander; ein Klick öffnet die
   Antwort in einem Fenster über der Seite. Im Layout bewegt sich dabei
   nichts mehr.

   ---------------------------------------------------------------------------
   OHNE JAVASCRIPT
   Im HTML stehen weiterhin ganz normale <details>. Läuft dieses Skript
   nicht – oder kennt der Browser <dialog> nicht –, bleibt es bei den
   Aufklappern und die Seite ist vollständig benutzbar. Erst wenn beides da
   ist, werden die <details> versteckt und durch die Kacheln ersetzt.

   Der Inhalt bleibt dabei im <details> stehen und wird beim Öffnen in das
   Fenster kopiert. So gibt es keine zweite Fassung des Textes, die
   auseinanderlaufen könnte.
   ---------------------------------------------------------------------------
   ========================================================================== */

(function () {
  "use strict";

  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"))
    .filter(function (s) { return s.querySelector("details.qa"); });

  if (!sections.length) { return; }

  /* Ohne <dialog> lassen wir die Aufklapper unangetastet. */
  var dialog = document.createElement("dialog");
  if (typeof dialog.showModal !== "function") { return; }

  dialog.className = "qa-dialog";
  dialog.innerHTML =
    '<div class="qa-dialog__head">' +
      '<h2 class="qa-dialog__title" id="qa-dialog-title"></h2>' +
      '<button type="button" class="qa-dialog__close" aria-label="Antwort schließen">' +
        '<span aria-hidden="true">×</span>' +
      '</button>' +
    '</div>' +
    '<div class="qa-dialog__body"></div>';

  dialog.setAttribute("aria-labelledby", "qa-dialog-title");
  document.body.appendChild(dialog);

  var titleEl = dialog.querySelector(".qa-dialog__title");
  var bodyEl = dialog.querySelector(".qa-dialog__body");
  var closeBtn = dialog.querySelector(".qa-dialog__close");

  /* Wohin der Fokus nach dem Schließen zurückgeht. */
  var opener = null;

  function open(question, answer, button) {
    opener = button;

    titleEl.textContent = question;
    bodyEl.innerHTML = "";
    /* Kopie einsetzen – das Original bleibt im <details> stehen. */
    bodyEl.appendChild(answer.cloneNode(true));

    dialog.showModal();
    /* Die Seite darunter soll nicht mitscrollen, solange das Fenster offen ist. */
    document.body.classList.add("has-dialog");
    closeBtn.focus();
  }

  function close() {
    if (dialog.open) { dialog.close(); }
  }

  dialog.addEventListener("close", function () {
    document.body.classList.remove("has-dialog");
    bodyEl.innerHTML = "";
    if (opener) {
      opener.focus();
      opener = null;
    }
  });

  closeBtn.addEventListener("click", close);

  /* Klick auf die abgedunkelte Fläche neben dem Fenster schließt ebenfalls.
     Der Klick landet auf dem <dialog> selbst, nicht auf dessen Inhalt. */
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) { close(); }
  });

  /* Escape schließt von sich aus – hier ist nichts zu tun. */

  sections.forEach(function (section) {
    var items = Array.prototype.slice.call(section.querySelectorAll("details.qa"));
    if (!items.length) { return; }

    var list = document.createElement("ul");
    list.className = "qa-tiles";

    items.forEach(function (details) {
      var summary = details.querySelector("summary");
      var answer = details.querySelector(".qa__inner");
      if (!summary || !answer) { return; }

      var question = summary.textContent.trim();

      var item = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "qa-tile";
      button.innerHTML =
        '<span class="qa-tile__text"></span>' +
        '<span class="qa-tile__mark" aria-hidden="true"></span>';
      button.querySelector(".qa-tile__text").textContent = question;

      button.addEventListener("click", function () {
        open(question, answer, button);
      });

      item.appendChild(button);
      list.appendChild(item);

      /* Der Aufklapper verschwindet aus der Anzeige, bleibt aber als Quelle
         des Antworttextes im Dokument. */
      details.hidden = true;
      details.open = false;
    });

    /* Die Kacheln kommen an die Stelle des ersten Aufklappers, damit die
       Reihenfolge der Absätze im Abschnitt erhalten bleibt. */
    items[0].parentNode.insertBefore(list, items[0]);
  });

  document.documentElement.classList.add("qa-tiles-on");
})();
