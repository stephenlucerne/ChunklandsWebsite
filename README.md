# Chunk Lands website

Static website for the Chunk Lands Minecraft server. No build step, no dependencies,
no npm. Plain HTML, CSS and vanilla JavaScript, hosted on GitHub Pages.

```
index.html          Landing page
donate.html         Donation + automatic rank flow
css/style.css       All styling
js/config.js        The only file you normally need to edit
js/main.js          Address + link wiring, copy-to-clipboard, toast
js/expand.js        Interactive chunk-expansion demo
js/donate.js        Donation form submission
assets/favicon.svg  Pixel grass-block icon
```

## Run it locally

Any static server works. From this directory:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

> Opening `index.html` directly off the filesystem also works. The copy button falls back
> to `document.execCommand` in that case, because `navigator.clipboard` is unavailable
> outside a secure context.

## Deploy to GitHub Pages

1. Create a repo (e.g. `ChunkLandsWebsite`) and push this folder.
2. On GitHub: **Settings → Pages → Source → Deploy from a branch**.
3. Pick `main` / `(root)`, save.
4. Your site goes live at `https://<user>.github.io/<repo>/` within a minute or two.

To serve it from a root domain (`chunklands.net`) instead, point your domain's DNS at
GitHub's Pages IPs and set **Settings → Pages → Custom domain**. GitHub issues the
`CNAME` record and certificate for you.

`.nojekyll` is already present so Pages serves the files as-is instead of running them
through Jekyll.

## Things to edit before you launch

Almost everything is in **`js/config.js`**:

| Setting | What it does |
| --- | --- |
| `serverAddress` | The IP shown at the top of every page. Already `play.chunklands.net`. |
| `discordUrl` | Enables every Discord button (beta, builders, feature requests). Until set, those buttons are disabled and say "coming soon". |
| `paypalUrl` / `kofiUrl` | Your direct donation links. |
| `donationApiBase` | Backend that turns a payment into a rank. Leave `""` and the donate page falls back to a manual "message staff" flow. |
| `redeemCommand` | The in-game command that prints a player's redeem code. |

Two more things worth a look:

- **Ranks**: `index.html`, the `#ranks` section. The four cards (`Newcomer`,
  `Supporter`, `Premium`, `Staff`) are placeholders. Rename them, set real prices and
  real perks.
- **Version / edition**: the FAQ answer "Which version and edition?" currently tells
  players to check Discord. If you pin a version, put it in the HTML and add
  `supportedVersions` / `clientEdition` to `config.js`.

Links set to `""` in `config.js` degrade gracefully: the element becomes
`aria-disabled`, stops being a link, and shows a toast if clicked. Nothing renders as a
broken `#` link.

## Automatic ranks from donations

You asked for donations to grant ranks automatically via a webhook. The frontend is
ready for it. One constraint to be aware of up front:

**GitHub Pages cannot receive webhooks.** It only serves static files. There's no
runtime to accept a POST, verify a signature, or talk to your Minecraft server. So the
site stays on GitHub Pages and a *tiny separate backend* handles money.

The moving part is that **PayPal and Ko-fi don't know your Minecraft username**. The
server solves this by issuing a one-time code:

```
1. Player runs /donate in game
        server issues code  CL-4F9K2Q  bound to that player, single-use, expires in 24h
2. Player enters code + username + amount on /donate.html
        browser POSTs to {donationApiBase}/checkout
3. Backend creates a PayPal order carrying that code as the invoice/reference
        returns { "checkoutUrl": "https://paypal.me/..." }
4. Player pays. PayPal POSTs the payment event to the backend's /webhook
5. Backend verifies PayPal's signature, checks the code is unused,
   then talks to the Minecraft server over RCON:
        rcon lp user <player> parent addmeta
   (or a console command for whichever plugin issues ranks)
6. Player's rank is live. Usually seconds, worst case next restart.
```

### Contract the frontend expects

`donate.html` posts this to `{donationApiBase}/checkout`:

```json
{ "code": "CL-4F9K2Q", "username": "Steve", "tier": "premium", "amount": 0 }
```

and expects:

```json
{ "checkoutUrl": "https://www.paypal.com/checkoutnow?token=EC-..." }
```

On failure it reads `{ "error": "..." }` and shows the message to the player.

### Where to put the backend

A **Cloudflare Worker** is the cheapest fit: free tier, and it can hold secrets as
encrypted environment variables rather than in git:

- Worker route `POST /checkout`: creates the PayPal order, returns `checkoutUrl`
- Worker route `POST /webhook`: verifies the PayPal signature, de-duplicates by
  event ID, and executes the RCON command

Other options: a tiny Node or Python server on the same box as the Minecraft server, or
any serverless platform. The frontend doesn't care which.

### Security notes: please don't skip these

This endpoint hands out paid ranks, so treat it as an auth system:

- **Verify the provider's signature on every webhook.** Ko-fi signs with
  `X-Ko-Fi-Signature` (HMAC-SHA1 over the raw body). If you skip verification, anyone
  can POST a fake "payment" and grant themselves a rank. This is the one mistake that
  matters.
- **Check the amount paid matches the tier** you're about to grant. Otherwise someone
  pays $1 and requests the $30 rank.
- **Make code redemption idempotent.** Providers retry webhooks; grant once per event ID
  and return 2xx on repeats so they stop retrying.
- **Never put the PayPal secret or the RCON password in this repo.** They live in the
  Worker's secrets, not in `config.js`.
- **Never call the backend from client-side code for anything privileged.**
  `donate.js` only ever calls `/checkout`. Rank granting happens server-side only.
- **Rate-limit `/checkout`** so it can't be used to spam PayPal orders.

### Manual fallback

Until `donationApiBase` is set, `donate.html` shows the manual path: direct PayPal /
Ko-fi buttons plus "message staff with your username". That page works as-is, so you
can take donations today and switch on automation whenever you're ready.

## Browser support

Modern evergreen browsers. Uses `grid`, `clamp()`, CSS custom properties, `Set`, and
`fetch`. Clipboard falls back to `execCommand` where the async API is blocked.