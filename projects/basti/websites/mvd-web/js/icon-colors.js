/* ==========================================================================
   Schalter: Social-Media-Icons im Footer in Originalfarben oder zurückhaltend.

   Aus bleibt es beim bisherigen Aussehen – runde Umrisse in der Farbe des
   jeweiligen Designs. An bekommt jedes Icon den echten Markenton als Fläche
   und ein weißes Zeichen: YouTube rot, Twitch violett, Discord blurple,
   Instagram mit seinem Verlauf, TikTok und X schwarz.

   ---------------------------------------------------------------------------
   DIESES FEATURE WIEDER LOSWERDEN
   Es steckt vollständig in dieser einen Datei plus einem CSS-Block. Zum
   Entfernen genügt:

       1. <script src="js/icon-colors.js"></script> aus allen vier Seiten
          löschen
       2. diese Datei löschen

   Danach wird die Klasse "brand-icons" nie gesetzt, die zugehörigen
   CSS-Regeln greifen nicht mehr und die Icons bleiben dauerhaft
   zurückhaltend. Am übrigen Stylesheet ist nichts zu ändern.
   ---------------------------------------------------------------------------

   Die Wahl wird im Browser gemerkt, damit sie beim Seitenwechsel und beim
   nächsten Besuch erhalten bleibt.
   ========================================================================== */

(function () {
  "use strict";

  /* Ohne Icons im Footer gibt es nichts umzuschalten. */
  if (!document.querySelector(".social-icon")) { return; }

  var KEY = "mvd-brand-icons";
  var root = document.documentElement;

  function stored() {
    try {
      return window.localStorage.getItem(KEY) === "1";
    } catch (e) {
      /* Privates Fenster oder Speicher gesperrt – dann eben ohne Merken. */
      return false;
    }
  }

  function remember(on) {
    try {
      window.localStorage.setItem(KEY, on ? "1" : "0");
    } catch (e) { /* nicht weiter schlimm */ }
  }

  var on = stored();

  var button = document.createElement("button");
  button.type = "button";
  button.className = "icon-toggle";

  var label = document.createElement("span");
  label.className = "icon-toggle__label";
  button.appendChild(label);

  function apply() {
    root.classList.toggle("brand-icons", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
    label.textContent = on ? "Social-Icons: Originalfarben" : "Social-Icons: schlicht";
    button.title = on
      ? "Icons in den Farben der Plattformen – klicken für die schlichte Fassung"
      : "Icons schlicht – klicken für die Originalfarben der Plattformen";
  }

  button.addEventListener("click", function () {
    on = !on;
    remember(on);
    apply();
  });

  apply();
  document.body.appendChild(button);
})();
