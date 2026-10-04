/* ==========================================================================
   Chunk Lands: donation / automatic rank flow
   --------------------------------------------------------------------------
   Posts the player's in-game redeem code + username to the donation backend,
   which returns a payment link. GitHub Pages cannot receive webhooks, so the
   backend is a separate small service. See README.md.

   If js/config.js has no donationApiBase, the page shows the manual
   "message staff" path instead of a dead form.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.CL || {};

  var form = document.getElementById("donate-form");
  var fallback = document.getElementById("fallback-panel");
  var result = document.getElementById("result");
  var submitBtn = document.getElementById("submit-btn");
  var customField = document.getElementById("custom-amount-field");
  var customInput = document.getElementById("amount");

  var API = (CFG.donationApiBase || "").replace(/\/+$/, "");
  var enabled = API !== "";

  /* Show the configured command wherever the page references it */
  function applyRedeemCommand() {
    var cmd = CFG.redeemCommand || "/donate";
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-redeem-cmd]"),
      function (el) {
        el.textContent = cmd;
      }
    );
  }

  /* --------------------------------------------------------------------
     Custom amount visibility
     -------------------------------------------------------------------- */
  function initCustomAmount() {
    if (!form) return;

    var radios = form.querySelectorAll('input[name="tier"]');

    Array.prototype.forEach.call(radios, function (r) {
      r.addEventListener("change", syncCustom);
    });

    syncCustom();
  }

  function syncCustom() {
    if (!customField) return;
    var custom = form.querySelector('input[name="tier"]:checked');
    var isCustom = custom && custom.value === "custom";
    customField.hidden = !isCustom;
    if (customInput) customInput.required = !!isCustom;
  }

  /* --------------------------------------------------------------------
     Submit
     -------------------------------------------------------------------- */
  function initSubmit() {
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!enabled) return;

      var tier = form.querySelector('input[name="tier"]:checked');
      var tierValue = tier ? tier.value : "";

      var payload = {
        code: (form.elements.code.value || "").trim().toUpperCase(),
        username: (form.elements.username.value || "").trim(),
        tier: tierValue
      };

      if (tierValue === "custom") {
        payload.amount = Number(form.elements.amount.value || 0);
      }

      setBusy(true);

      fetch(API + "/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (r) {
          if (!r.ok || !r.body || !r.body.checkoutUrl) {
            throw new Error((r.body && r.body.error) || "Something went wrong");
          }
          window.location.href = r.body.checkoutUrl;
        })
        .catch(function (err) {
          setBusy(false);
          showResult(
            "error",
            "We couldn't start your payment. (" +
              err.message +
              ") Please try again, or donate directly and message staff."
          );
        });
    });
  }

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? "Opening payment…" : "Continue to payment";
  }

  function showResult(kind, message) {
    if (!result) return;
    result.hidden = false;
    result.className = "notice notice--" + (kind === "ok" ? "ok" : "warn");
    result.style.marginTop = "20px";
    result.textContent = message;
    if (form) form.hidden = true;
  }

  /* --------------------------------------------------------------------
     Boot
     -------------------------------------------------------------------- */
  function init() {
    applyRedeemCommand();

    if (!enabled) {
      if (form) form.hidden = true;
      if (fallback) fallback.hidden = false;
      return;
    }

    if (form) form.hidden = false;
    if (fallback) fallback.hidden = true;

    initCustomAmount();
    initSubmit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();