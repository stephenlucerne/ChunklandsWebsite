/* ==========================================================================
   Chunk Lands: shared behaviour
   - Applies js/config.js values to the DOM (server address, links)
   - Copy-to-clipboard buttons with a fallback for non-secure contexts
   - Small toast for feedback
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.CL || {};
  var ADDRESS = CFG.serverAddress || "play.chunklands.net";

  /* --------------------------------------------------------------------
     Links: config-driven, degrade gracefully when empty
     -------------------------------------------------------------------- */
  function applyLink(key, url, label) {
    var nodes = document.querySelectorAll('[data-config-link="' + key + '"]');

    Array.prototype.forEach.call(nodes, function (a) {
      if (!url) {
        a.setAttribute("aria-disabled", "true");
        a.removeAttribute("href");
        a.setAttribute("role", "button");
        a.setAttribute("title", label + " isn't set up yet");
        // Swap the call to action for a placeholder so nobody clicks a dead link.
        // data-coming-soon lets a link keep its identity, e.g. "PayPal: Coming soon".
        a.textContent = a.getAttribute("data-coming-soon") || "Coming soon";
        a.addEventListener("click", function (e) {
          e.preventDefault();
          toast(label + " is coming soon");
        });
        return;
      }

      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.removeAttribute("aria-disabled");
      a.removeAttribute("title");
    });
  }

  /* --------------------------------------------------------------------
     Server address: fill every placeholder
     -------------------------------------------------------------------- */
  function applyAddress() {
    var nodes = document.querySelectorAll("[data-server-address]");
    Array.prototype.forEach.call(nodes, function (el) {
      el.textContent = ADDRESS;
    });
  }

  /* --------------------------------------------------------------------
     Toast
     -------------------------------------------------------------------- */
  var toastTimer = null;

  function toast(message) {
    var el = document.getElementById("toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("is-open");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-open");
    }, 2400);
  }
  window.clToast = toast;

  /* --------------------------------------------------------------------
     Clipboard: async API where available, execCommand fallback otherwise
     (the fallback matters when previewing over http:// or opening the file
     directly from disk, where navigator.clipboard is undefined or blocked)
     -------------------------------------------------------------------- */
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.width = "1px";
    ta.style.height = "1px";
    ta.style.padding = "0";
    ta.style.border = "none";
    ta.style.outline = "none";
    ta.style.boxShadow = "none";
    ta.style.background = "transparent";
    ta.style.opacity = "0";

    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);

    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }

    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  /* --------------------------------------------------------------------
     Copy buttons
     -------------------------------------------------------------------- */
  function initCopyButtons() {
    var buttons = document.querySelectorAll("[data-copy]");

    Array.prototype.forEach.call(buttons, function (btn) {
      var idleLabel = btn.getAttribute("data-copy-label") || btn.textContent.trim();
      var doneLabel = btn.getAttribute("data-copied-label") || "Copied!";
      var resetTimer = null;

      btn.setAttribute("aria-live", "polite");

      btn.addEventListener("click", function () {
        copyText(ADDRESS).then(function (ok) {
          if (!ok) {
            toast("Couldn't copy automatically. Server IP is " + ADDRESS);
            return;
          }

          btn.setAttribute("data-copied", "true");
          btn.textContent = doneLabel;
          toast("Copied " + ADDRESS + " to clipboard");

          clearTimeout(resetTimer);
          resetTimer = setTimeout(function () {
            btn.removeAttribute("data-copied");
            btn.textContent = idleLabel;
          }, 2000);
        });
      });
    });
  }

  /* --------------------------------------------------------------------
     Footer year
     -------------------------------------------------------------------- */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* --------------------------------------------------------------------
     Boot
     -------------------------------------------------------------------- */
  function init() {
    applyAddress();
    applyLink("discord", CFG.discordUrl, "Discord");
    applyLink("donate-paypal", CFG.paypalUrl, "PayPal");
    applyLink("donate-kofi", CFG.kofiUrl, "Ko-fi");
    initCopyButtons();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();