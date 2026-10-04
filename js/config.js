/* ==========================================================================
   Chunk Lands: site configuration
   --------------------------------------------------------------------------
   This is the only file you need to edit for links and the server address.
   Leave a value as "" and the UI degrades gracefully (links are disabled
   and a "coming soon" notice is shown instead of a broken link).
   ========================================================================== */

window.CL = {
  /* --- Server ---------------------------------------------------------- */
  // Shown at the top of the page, in the hero, and in the footer.
  serverAddress: "play.chunklands.net",

  // Optional: shown in the FAQ. Leave "" to hide the line.
  // supportedVersions: "1.21.x",
  // clientEdition: "Java Edition",

  /* --- Community links ------------------------------------------------- */
  // Required for the beta / builder / feature-request buttons to work.
  discordUrl: "",

  /* --- Donations ------------------------------------------------------- */
  // Direct donation links (open in a new tab). Both optional.
  // For PayPal: create one at https://www.paypal.com/paypalme/
  // For Ko-fi:   create one at https://ko-fi.com/
  paypalUrl: "",
  kofiUrl: "",

  /* --- Automatic rank delivery ----------------------------------------- */
  // Base URL of the webhook/relay backend that turns a completed payment into
  // an in-game rank. GitHub Pages cannot receive webhooks, so this points at
  // a small separate service (a Cloudflare Worker is the cheapest option).
  //
  // Endpoints expected by js/donate.js:
  //   POST {base}/checkout  -> { checkoutUrl: "https://..." }
  //
  // See README.md ("Automatic ranks from donations") for the full contract.
  donationApiBase: "",

  // In-game command players run to get their redeem code. Shown on donate.html
  // and in the FAQ.
  redeemCommand: "/donate",
};