/* ==========================================================================
   Chunk Lands: interactive chunk-expansion demo
   --------------------------------------------------------------------------
   Mirrors the server's core loop so visitors understand it in five seconds:
   you own one chunk, tokens buy the chunks next to it, and prices climb as
   you push outward.
   ========================================================================== */
(function () {
  "use strict";

  var MOUNT_ID = "expander-mount";
  var SIZE = 9;            // 9x9 grid
  var MID = Math.floor(SIZE / 2);
  var START_TOKENS = 850;
  var BASE_COST = 100;

  var mount = document.getElementById(MOUNT_ID);
  if (!mount) return;

  /* Chebyshev ring distance from the starting chunk */
  function ringOf(index) {
    var x = index % SIZE;
    var y = Math.floor(index / SIZE);
    return Math.max(Math.abs(x - MID), Math.abs(y - MID));
  }

  /* Price scales with how far the chunk is from spawn */
  function costOf(index) {
    return BASE_COST * ringOf(index);
  }

  var owned = new Set([MID * SIZE + MID]);
  var tokens = START_TOKENS;
  var cells = [];

  /* --------------------------------------------------------------------
     Markup
     -------------------------------------------------------------------- */
  var hudTokens = el("div", "hud-item");
  var hudChunks = el("div", "hud-item");
  var hudBlocks = el("div", "hud-item");
  var grid = el("div", "chunk-grid");
  var hint = el("p", "expander__hint");

  var hud = el("div", "expander__hud");
  hud.appendChild(hudTokens);
  hud.appendChild(hudChunks);
  hud.appendChild(hudBlocks);
  mount.appendChild(hud);

  var panel = el("div", "panel panel--sunken");
  panel.appendChild(el("p", "eyebrow", "Try it yourself"));
  panel.appendChild(grid);

  grid.style.gridTemplateColumns = "repeat(" + SIZE + ", minmax(0, 1fr))";
  grid.style.gridTemplateRows = "repeat(" + SIZE + ", minmax(0, 1fr))";
  grid.setAttribute("role", "group");
  grid.setAttribute(
    "aria-label",
    "Land expansion demo. Start with the one chunk in the middle, then buy adjacent chunks."
  );

  for (var i = 0; i < SIZE * SIZE; i++) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chunk";
    b.dataset.index = String(i);
    b.addEventListener("click", onClick);
    grid.appendChild(b);
    cells.push(b);
  }

  var foot = el("div", "btn-row");
  foot.style.justifyContent = "center";
  foot.style.marginTop = "14px";

  var resetBtn = el("button", "btn btn--ghost btn--sm", "Reset");
  resetBtn.type = "button";
  resetBtn.addEventListener("click", function () {
    owned = new Set([MID * SIZE + MID]);
    tokens = START_TOKENS;
    update();
    if (window.clToast) window.clToast("Reset. You're back to a single chunk.");
  });

  foot.appendChild(resetBtn);

  panel.appendChild(hint);
  panel.appendChild(foot);
  mount.appendChild(panel);

  /* --------------------------------------------------------------------
     Helpers
     -------------------------------------------------------------------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderHud(node, label, value, tone) {
    node.innerHTML = "";
    var l = el("span", "hud-item__l", label);
    var v = el("div", "hud-item__v" + (tone ? " " + tone : ""), value);
    node.appendChild(l);
    node.appendChild(v);
  }

  function isAdjacentToOwned(index) {
    var x = index % SIZE;
    var y = Math.floor(index / SIZE);
    var offsets = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    for (var i = 0; i < offsets.length; i++) {
      var nx = x + offsets[i][0];
      var ny = y + offsets[i][1];
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
      if (owned.has(ny * SIZE + nx)) return true;
    }
    return false;
  }

  /* --------------------------------------------------------------------
     Render
     -------------------------------------------------------------------- */
  function update() {
    var buyable = 0;

    cells.forEach(function (cell, index) {
      var isOwned = owned.has(index);
      var adjacent = !isOwned && isAdjacentToOwned(index);
      var cost = costOf(index);
      var affordable = adjacent && tokens >= cost;

      if (isOwned) {
        cell.className = "chunk is-owned";
        cell.disabled = true;
        cell.setAttribute("aria-label", "Owned chunk");
        return;
      }

      if (affordable) {
        buyable++;
        cell.className = "chunk is-buyable";
        cell.disabled = false;
        cell.setAttribute("aria-label", "Buy adjacent chunk for " + cost + " tokens");
        return;
      }

      cell.className = adjacent ? "chunk is-buyable is-too-expensive" : "chunk";
      cell.disabled = true;
      cell.setAttribute(
        "aria-label",
        adjacent
          ? "Adjacent chunk costs " + cost + " tokens. You have " + tokens
          : "Locked chunk"
      );
    });

    var count = owned.size;

    renderHud(hudTokens, "Tokens", String(tokens), "green");
    renderHud(hudChunks, "Chunks owned", String(count), "");
    renderHud(hudBlocks, "Blocks revealed", (count * 256).toLocaleString(), "");

    if (buyable > 0) {
      hint.innerHTML = "Click a <b>gold</b> chunk to buy it.";
    } else {
      hint.innerHTML =
        "Next chunk costs <b>" +
        BASE_COST +
        "</b> tokens and you have <b>" +
        tokens +
        "</b>. On the server you'd earn them by playing.";
    }
  }

  function onClick(e) {
    var index = Number(e.currentTarget.dataset.index);
    var cost = costOf(index);

    if (owned.has(index) || tokens < cost || !isAdjacentToOwned(index)) return;

    owned.add(index);
    tokens -= cost;
    update();
  }

  update();
})();