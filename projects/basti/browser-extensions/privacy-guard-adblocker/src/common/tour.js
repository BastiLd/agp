(function initPrivacyGuardTour(globalScope) {
  if (globalScope.PrivacyGuardTour) {
    return;
  }

  const TOUR_STATE_KEY = "tourState";
  const TOUR_PREFERENCES_KEY = "tourPreferences";

  const COPY = {
    de: {
      menuStart: "Tour starten",
      menuRestart: "Tour neu starten",
      introEyebrow: "Tour",
      yes: "Ja",
      next: "Weiter",
      back: "Zurueck",
      skip: "Ueberspringen",
      details: "Genauer",
      hideDetails: "Weniger",
      done: "Fertig",
      openOptions: "Einstellungen oeffnen",
      progress: "Schritt {current} von {total}"
    },
    en: {
      menuStart: "Start tour",
      menuRestart: "Restart tour",
      introEyebrow: "Tour",
      yes: "Yes",
      next: "Next",
      back: "Back",
      skip: "Skip",
      details: "More",
      hideDetails: "Less",
      done: "Done",
      openOptions: "Open options",
      progress: "Step {current} of {total}"
    }
  };

  function createTour(config) {
    const state = {
      stepIndex: 0,
      detailOpen: false,
      root: null,
      spotlight: null,
      mascot: null,
      bubble: null,
      menu: null,
      started: false
    };

    const api = {
      attachMascotMenu,
      start,
      resumeFromStorage,
      stop
    };

    return api;

    function attachMascotMenu(mascotElement, buttonLabel) {
      if (!mascotElement) {
        return;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pg-tour-mascot-button";
      button.setAttribute("aria-label", buttonLabel || text("menuStart"));
      mascotElement.parentNode.insertBefore(button, mascotElement);
      button.append(mascotElement);
      mascotElement.removeAttribute("aria-hidden");
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleMenu(button);
      });
      document.addEventListener("click", closeMenu);
      window.addEventListener("blur", closeMenu);
    }

    async function resumeFromStorage() {
      const stored = await chrome.storage.local.get(TOUR_STATE_KEY);
      const tourState = stored[TOUR_STATE_KEY];
      if (!tourState?.active || tourState.surface !== config.surface) {
        return;
      }
      const nextIndex = config.steps.findIndex((step) => step.id === tourState.stepId);
      await start({ stepId: nextIndex >= 0 ? tourState.stepId : config.steps[0]?.id, skipIntroFlight: true });
    }

    async function start(options = {}) {
      closeMenu();
      const requestedIndex = config.steps.findIndex((step) => step.id === options.stepId);
      state.stepIndex = requestedIndex >= 0 ? requestedIndex : 0;
      state.detailOpen = false;
      state.started = true;
      await saveState(config.steps[state.stepIndex]?.id);
      renderRoot();
      renderStep({ skipIntroFlight: Boolean(options.skipIntroFlight) });
    }

    async function stop(completed = true) {
      closeMenu();
      state.started = false;
      document.documentElement.classList.remove("pg-tour-active");
      if (state.root) {
        state.root.remove();
      }
      state.root = null;
      state.spotlight = null;
      state.mascot = null;
      state.bubble = null;
      await chrome.storage.local.set({
        [TOUR_STATE_KEY]: {
          active: false,
          surface: config.surface,
          stepId: null,
          completed,
          startedAt: Date.now()
        },
        [TOUR_PREFERENCES_KEY]: { hasSeenTour: true }
      });
    }

    function renderRoot() {
      if (state.root) {
        return;
      }
      document.documentElement.classList.add("pg-tour-active");
      state.root = document.createElement("div");
      state.root.className = "pg-tour-root";
      state.spotlight = document.createElement("div");
      state.spotlight.className = "pg-tour-spotlight";
      state.mascot = cloneMascot();
      state.bubble = document.createElement("section");
      state.bubble.className = "pg-tour-bubble";
      state.bubble.setAttribute("role", "dialog");
      state.bubble.setAttribute("aria-live", "polite");
      state.root.append(state.spotlight, state.mascot, state.bubble);
      document.body.append(state.root);
    }

    function renderStep(options = {}) {
      const step = config.steps[state.stepIndex];
      if (!step) {
        stop(true);
        return;
      }
      state.detailOpen = false;
      const target = step.target ? document.querySelector(step.target) : null;
      if (target && config.surface === "options") {
        target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
        window.setTimeout(() => positionStep(step, target, options), prefersReducedMotion() ? 0 : 220);
      } else {
        positionStep(step, target, options);
      }
      renderBubble(step);
      saveState(step.id);
    }

    function positionStep(step, target, options = {}) {
      const rect = target?.getBoundingClientRect();
      if (rect) {
        state.spotlight.classList.add("is-visible");
        const pad = step.pad ?? 8;
        state.spotlight.style.left = `${Math.max(8, rect.left - pad)}px`;
        state.spotlight.style.top = `${Math.max(8, rect.top - pad)}px`;
        state.spotlight.style.width = `${Math.min(window.innerWidth - 16, rect.width + pad * 2)}px`;
        state.spotlight.style.height = `${Math.min(window.innerHeight - 16, rect.height + pad * 2)}px`;
      } else {
        state.spotlight.classList.remove("is-visible");
      }

      const mascotPoint = getMascotPoint(rect, step);
      moveMascot(mascotPoint, options.skipIntroFlight);
      positionBubble(mascotPoint, rect);
    }

    function renderBubble(step) {
      const copy = text();
      state.bubble.textContent = "";

      const eyebrow = document.createElement("span");
      eyebrow.className = "pg-tour-eyebrow";
      eyebrow.textContent = step.eyebrow?.[config.language()] || copy.introEyebrow;

      const title = document.createElement("h2");
      title.textContent = localized(step.title);

      const body = document.createElement("p");
      body.textContent = localized(step.body);

      const detail = document.createElement("div");
      detail.className = "pg-tour-detail";
      detail.textContent = localized(step.detail);

      const actions = document.createElement("div");
      actions.className = "pg-tour-actions";

      const backButton = button(copy.back, () => go(-1));
      backButton.disabled = state.stepIndex === 0;

      const detailButton = button(copy.details, () => {
        state.detailOpen = !state.detailOpen;
        detail.classList.toggle("is-open", state.detailOpen);
        detailButton.textContent = state.detailOpen ? copy.hideDetails : copy.details;
      });
      detailButton.hidden = !step.detail;

      const primary = button(primaryLabel(step, copy), () => primaryAction(step));
      primary.className = "pg-tour-primary";

      const skip = button(step.final ? copy.done : copy.skip, () => stop(true));
      skip.className = "pg-tour-ghost";

      actions.append(backButton, detailButton, primary, skip);

      const progress = document.createElement("div");
      progress.className = "pg-tour-progress";
      progress.textContent = copy.progress
        .replace("{current}", String(state.stepIndex + 1))
        .replace("{total}", String(config.steps.length));

      state.bubble.append(eyebrow, title, body);
      if (step.detail) {
        state.bubble.append(detail);
      }
      state.bubble.append(actions, progress);
    }

    async function primaryAction(step) {
      if (step.openOptions) {
        await chrome.storage.local.set({
          [TOUR_STATE_KEY]: {
            active: true,
            surface: "options",
            stepId: "options-intro",
            completed: false,
            startedAt: Date.now()
          }
        });
        config.onOpenOptions?.();
        return;
      }
      if (step.final || state.stepIndex === config.steps.length - 1) {
        await stop(true);
        return;
      }
      go(1);
    }

    function go(delta) {
      const next = Math.min(config.steps.length - 1, Math.max(0, state.stepIndex + delta));
      if (next === state.stepIndex) {
        return;
      }
      state.stepIndex = next;
      renderStep({ skipIntroFlight: true });
    }

    function toggleMenu(anchor) {
      if (state.menu) {
        closeMenu();
        return;
      }
      const rect = anchor.getBoundingClientRect();
      state.menu = document.createElement("div");
      state.menu.className = "pg-tour-menu";
      state.menu.style.left = `${Math.min(window.innerWidth - 188, Math.max(8, rect.left))}px`;
      state.menu.style.top = `${Math.min(window.innerHeight - 56, rect.bottom + 8)}px`;
      const item = button(state.started ? text("menuRestart") : text("menuStart"), () => start());
      state.menu.append(item);
      document.body.append(state.menu);
    }

    function closeMenu() {
      if (state.menu) {
        state.menu.remove();
        state.menu = null;
      }
    }

    async function saveState(stepId) {
      await chrome.storage.local.set({
        [TOUR_STATE_KEY]: {
          active: true,
          surface: config.surface,
          stepId,
          completed: false,
          startedAt: Date.now()
        }
      });
    }

    function cloneMascot() {
      const source = document.querySelector(config.mascotSelector);
      const clone = source ? source.cloneNode(true) : document.createElement("div");
      clone.classList.add("pg-tour-mascot");
      clone.removeAttribute("id");
      clone.removeAttribute("aria-hidden");
      return clone;
    }

    function moveMascot(point, skipFlight) {
      const source = document.querySelector(config.mascotSelector);
      const sourceRect = source?.getBoundingClientRect();
      state.mascot.style.left = `${point.x}px`;
      state.mascot.style.top = `${point.y}px`;
      if (!sourceRect || skipFlight || prefersReducedMotion()) {
        return;
      }
      state.mascot.animate(
        [
          { transform: `translate(${sourceRect.left - point.x}px, ${sourceRect.top - point.y}px) scale(0.78) rotate(-8deg)` },
          { transform: "translate(46px, -54px) scale(1.08) rotate(11deg)", offset: 0.54 },
          { transform: "translate(0, 0) scale(1) rotate(0deg)" }
        ],
        { duration: 760, easing: "cubic-bezier(.2,.86,.2,1)" }
      );
    }

    function positionBubble(point, targetRect) {
      const desiredTop = targetRect
        ? Math.min(window.innerHeight - 210, Math.max(14, targetRect.bottom + 18))
        : Math.min(window.innerHeight - 210, point.y + 68);
      const desiredLeft = targetRect
        ? Math.min(window.innerWidth - 326, Math.max(14, targetRect.left))
        : Math.min(window.innerWidth - 326, Math.max(14, point.x - 6));
      state.bubble.style.left = `${desiredLeft}px`;
      state.bubble.style.top = `${desiredTop}px`;
      state.bubble.style.animation = "none";
      state.bubble.offsetHeight;
      state.bubble.style.animation = "";
    }

    function getMascotPoint(rect, step) {
      if (!rect) {
        return {
          x: config.surface === "popup" ? 22 : 28,
          y: config.surface === "popup" ? 84 : 96
        };
      }
      const side = step.mascotSide || "top";
      if (side === "right") {
        return {
          x: Math.min(window.innerWidth - 70, rect.right + 14),
          y: Math.max(12, rect.top - 8)
        };
      }
      return {
        x: Math.max(14, Math.min(window.innerWidth - 70, rect.left + rect.width / 2 - 27)),
        y: Math.max(12, rect.top - 74)
      };
    }

    function primaryLabel(step, copy) {
      if (step.openOptions) {
        return copy.openOptions;
      }
      if (step.final || state.stepIndex === config.steps.length - 1) {
        return copy.done;
      }
      return state.stepIndex === 0 ? copy.yes : copy.next;
    }

    function localized(value) {
      if (!value) {
        return "";
      }
      if (typeof value === "string") {
        return value;
      }
      return value[config.language()] || value.de || value.en || "";
    }

    function text(key) {
      const copy = COPY[config.language()] || COPY.de;
      return key ? copy[key] : copy;
    }

    function button(label, onClick) {
      const node = document.createElement("button");
      node.type = "button";
      node.textContent = label;
      node.addEventListener("click", onClick);
      return node;
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  globalScope.PrivacyGuardTour = {
    createTour,
    TOUR_STATE_KEY,
    TOUR_PREFERENCES_KEY
  };
})(globalThis);
