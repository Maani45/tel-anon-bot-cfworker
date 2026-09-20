# 🤫 Anonymous Message Bot

A privacy-focused anonymous messaging bot for Telegram, built entirely on **Cloudflare Workers**. Anyone can send you a message — through Telegram or a public web form — without ever revealing their identity to you, or yours to them.

No server to maintain. No database to host. Runs entirely on Cloudflare's edge network.

---

## ✨ Features

- **Anonymous inbound messages** — via a personal Telegram deep-link or a shareable web page (no Telegram account required for senders)
- **Anonymous two-way replies** — reply to a message and the sender receives it without learning who you are, and vice versa
- **Reactions** (👍 ❤️ 😂 😮) on messages, routed back to the right person without exposing either side's identity
- **Save, block, and report** controls per message
- **Word filters** — auto-reject messages containing chosen words
- **Do Not Disturb mode** — pause incoming messages for 8 hours
- **VIP custom links** — `t.me/yourbot?start=your_name` instead of a random ID
- **Daily question broadcast** — an optional scheduled prompt sent to all users to nudge friends into messaging them
- **Bilingual** — Persian and English, selectable per user from the settings menu; every message, menu, and the public web form adapt automatically
- **Stats** — link views and message counts

## 🔐 Privacy & security design

This bot's entire purpose is anonymity, so identity protection isn't an afterthought — it's the core design constraint:

- **No real user ID ever appears in a Telegram `callback_data` payload.** Every reaction/reply/block button carries a random opaque token; the token → real chat ID mapping lives only in server-side KV storage with an expiry. Even if a `callback_data` value were somehow exposed, it decodes to nothing.
- **No secrets in source.** The bot token is read from a Cloudflare Workers secret (`env.BOT_TOKEN`) at runtime — it is never hardcoded, logged, or committed.
- **Defense in depth is left to you to configure at the platform level** (see [Security recommendations](#-security-recommendations-optional-hardening) below) — Cloudflare's DDoS/TLS protection covers network-level attacks, but application-level access control (e.g. restricting the `/webhook` endpoint) is worth adding for a serious deployment.

## 🏗️ Architecture

| Component | Technology |
|---|---|
| Compute | Cloudflare Workers (V8 isolates, no server) |
| Storage | Cloudflare Workers KV (user records, link mappings, anonymity tokens) |
| Bot interface | Telegram Bot API (webhook-based) |
| Web interface | A single static HTML page served per-user at `/p/<linkId>`, posting to `/api/send` |
| Scheduling | Cloudflare Cron Triggers (daily question broadcast) |

Everything lives in a single `worker.js` file — no build step, no framework, no dependencies.

## 🚀 Deployment

### Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (the free plan is enough for most personal use)
- [Node.js](https://nodejs.org/) and [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) installed (`npm install -g wrangler`)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

### 1. Clone and configure

```bash
git clone <this-repo-url>
cd anonymous-message-bot
```

Create a `wrangler.json` (or `wrangler.toml`) in the project root:

```json
{
  "name": "anonymous-message-bot",
  "main": "worker.js",
  "compatibility_date": "2026-06-20",
  "kv_namespaces": [
    { "binding": "ANON_STORE", "id": "<your-kv-namespace-id>" }
  ],
  "triggers": {
    "crons": ["0 8 * * *"]
  }
}
```

Create the KV namespace:

```bash
wrangler kv namespace create ANON_STORE
```

Copy the returned `id` into `wrangler.json`.

### 2. Set your bot token as a secret

**Never put your bot token in the source code.** Set it as an encrypted Cloudflare secret instead:

```bash
wrangler secret put BOT_TOKEN
```

Paste the token you got from @BotFather when prompted.

### 3. Update the web link domain

Near the top of `worker.js`, update this constant to match your actual deployed domain (your `*.workers.dev` subdomain or custom domain):

```js
const WEB_BASE_URL = "https://your-worker-name.your-subdomain.workers.dev";
```

### 4. Deploy

```bash
wrangler deploy
```

### 5. Register the Telegram webhook

Point Telegram at your deployed Worker:

```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-worker-url/webhook"
```

### 6. (Optional) Enable the daily question broadcast

The cron trigger you configured in `wrangler.json` calls `/cron` on schedule automatically once deployed — no extra step needed beyond step 1.

## 🧑‍💻 Usage

1. Users start a chat with your bot and send `/start` to get their personal anonymous link (both a Telegram deep-link and a public web link).
2. They share that link with friends.
3. Anyone who opens the link — through Telegram or a plain browser — can send them a message without an account or any identifying trace reaching the recipient.
4. The recipient can react, reply anonymously, save, block, or report each message from inline buttons.
5. Language (Persian/English) is set per user from **Settings**.

## 🔧 Security recommendations (optional hardening)

These aren't implemented by default, but are worth adding if you deploy this for real use:

- **Verify webhook authenticity**: set a `secret_token` when calling Telegram's `setWebhook` and check the `X-Telegram-Bot-Api-Secret-Token` header on every request to `/webhook`, rejecting anything that doesn't match.
- **Rate-limit `/api/send`**: add per-IP or per-link rate limiting to prevent abuse of the public web form.
- **Cloudflare Access**: if you build an admin view on top of this, gate it behind [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) rather than rolling your own auth.

## 📄 License

MIT — use it, fork it, modify it.

---

Built on [Cloudflare Workers](https://workers.cloudflare.com/).
