(function () {
  "use strict";

  var hamburger = document.getElementById("menu-toggle");
  var menu = document.getElementById("menu");

  function closeMenu() {
    menu.hidden = true;
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Menü öffnen");
  }

  function openMenu() {
    menu.hidden = false;
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Menü schließen");
  }

  hamburger.addEventListener("click", function () {
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  document.addEventListener("click", function (event) {
    if (!menu.hidden && !menu.contains(event.target) && !hamburger.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu();
    }
  });

  // Platzhalter-Links (Anmelden, Beitreten, Bewerben, Kontakt, Impressum ...)
  // tun aktuell bewusst nichts.
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#"]'), function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });

  function showAll(targets) {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("is-visible");
    });
  }

  function initReveal() {
    var targets = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      showAll(targets);
      return;
    }

    /* Sicherheitsnetz: Der Text darf nie dauerhaft unsichtbar bleiben, falls
       der Observer aus irgendeinem Grund nicht auslöst. */
    window.setTimeout(function () {
      showAll(targets);
    }, 4000);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    Array.prototype.forEach.call(targets, function (el) {
      observer.observe(el);
    });
  }

  initReveal();
})();
