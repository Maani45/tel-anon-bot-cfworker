// ─── Telegram API helpers ───────────────────────────────────────────────────
// BOT_TOKEN now comes from env (a Cloudflare secret), never hardcoded in source.
async function tgApi(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function sendMessage(env, chatId, text, extra = {}) {
  return tgApi(env, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}

async function sendPhoto(env, chatId, photo, caption = "", extra = {}) {
  return tgApi(env, "sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "HTML", ...extra });
}

async function forwardFile(env, chatId, fromMsg) {
  if (fromMsg.photo) {
    const fileId = fromMsg.photo[fromMsg.photo.length - 1].file_id;
    return tgApi(env, "sendPhoto", { chat_id: chatId, photo: fileId, caption: "📎 <b>فایل ناشناس:</b>", parse_mode: "HTML" });
  }
  if (fromMsg.sticker) {
    return tgApi(env, "sendSticker", { chat_id: chatId, sticker: fromMsg.sticker.file_id });
  }
  if (fromMsg.document) {
    return tgApi(env, "sendDocument", { chat_id: chatId, document: fromMsg.document.file_id, caption: "📎 <b>فایل ناشناس</b>", parse_mode: "HTML" });
  }
  if (fromMsg.voice) {
    return tgApi(env, "sendVoice", { chat_id: chatId, voice: fromMsg.voice.file_id, caption: "🎤 <b>پیام صوتی ناشناس</b>", parse_mode: "HTML" });
  }
  if (fromMsg.audio) {
    return tgApi(env, "sendAudio", { chat_id: chatId, audio: fromMsg.audio.file_id });
  }
  if (fromMsg.video) {
    return tgApi(env, "sendVideo", { chat_id: chatId, video: fromMsg.video.file_id, caption: "🎥 <b>ویدیو ناشناس</b>", parse_mode: "HTML" });
  }
  return null;
}

function makeId(len = 12) {
  return Array.from({ length: len }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Single source of truth for the web-form base URL — update this if your
// worker's route/domain changes, instead of hunting through the file.
const WEB_BASE_URL = "https://anonymous-telegram-bot.amirkiuter.workers.dev";

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

// ─── i18n ───────────────────────────────────────────────────────────────────
// Every user-facing string lives here in both fa/en. t(lang, key, ...args)
// looks it up; falls back to fa if the key or language is missing.
const STR = {
  fa: {
    menu_link: "🔗 لینک ناشناسم",
    menu_inbox: "📥 صندوق پیام‌ها",
    menu_fav: "⭐ پیام‌های محبوب",
    menu_stats: "📊 آمار",
    menu_settings: "⚙️ تنظیمات",
    menu_help: "❓ راهنما",
    menu_dnd: "🔇 حالت عدم مزاحمت",
    menu_filter: "🚫 کلمات فیلتر",
    menu_vip: "👑 لینک VIP",
    menu_back: "🔙 برگشت",
    btn_cancel: "❌ لغو",
    btn_cancel_reply: "❌ لغو پاسخ",
    settings_title: "⚙️ تنظیمات:",
    home_title: "🏠 خونه:",
    filter_none: "هیچ کلمه‌ای فیلتر نشده",
    filter_list: (list) => `🚫 کلمات فیلتر فعلی:\n${list}\n\nبرای اضافه/حذف: /addfilter کلمه یا /rmfilter کلمه`,
    start_hint: "برای شروع /start رو بفرست 👆",
    welcome: (link, webLink) => `👋 سلام به ربات پیام ناشناس امیر خوش اومدید چنلم : @shishekhord!\n\n🔗 <b>لینک تلگرامت:</b>\n<code>${link}</code>\n\n🌐 <b>لینک وب:</b>\n<code>${webLink}</code>\n\nاین لینک‌ها رو به دوستات بده تا بهت پیام ناشناس بفرستن!`,
    link_invalid: "❌ این لینک معتبر نیست یا منقضی شده.",
    cant_msg_self: "⚠️ نمی‌تونی به خودت پیام بفرستی!",
    cant_send: "⛔ امکان ارسال پیام وجود نداره.",
    dnd_wait: (h) => `🔇 این کاربر موقتاً پیام نمی‌گیره (${h} ساعت دیگه).`,
    ready_to_send: "✅ آماده‌ای! پیامت رو بنویس — متن، عکس، استیکر، فایل یا پیام صوتی.\n\n<i>این صحبت ۱ ساعت دیگه بسته میشه.</i>",
    cancelled: "لغو شد.",
    msg_filtered: "⚠️ پیام شما فیلتر شد و ارسال نشد.",
    anon_msg_label: (id) => `↑ پیام ناشناس — کد: <code>${id}</code>`,
    anon_msg_body: (text, id) => `📩 <b>پیام ناشناس:</b>\n\n${text}\n\n<i>کد: ${id}</i>`,
    sent_confirm: "✅ پیامت ارسال شد! می‌تونی پیام بعدی رو بفرستی.",
    reply_prompt: "↩️ پاسخت رو بنویس — ناشناس ارسال میشه:",
    reply_label_file: (id) => `↩️ <b>پاسخ ناشناس</b> به پیام <code>${id}</code>`,
    reply_label_text: (id, text) => `↩️ <b>پاسخ ناشناس</b> به پیام <code>${id}</code>:\n\n${text}`,
    reply_sent: "✅ پاسخت ارسال شد!",
    reply_expired: "❌ این پیام منقضی شده و دیگه قابل پاسخ نیست.",
    react_notify: (emoji, id) => `${emoji} یه نفر به پیام <code>${id}</code> واکنش داد!`,
    react_toast: "واکنش ثبت شد!",
    fav_toast: "⭐ پیام ذخیره شد!",
    block_expired: "❌ این پیام منقضی شده.",
    block_done_msg: "🚫 این فرستنده بلاک شد. دیگه نمی‌تونه پیام بفرسته.",
    block_toast: "بلاک شد",
    report_msg: (id) => `🚨 گزارش ثبت شد برای پیام <code>${id}</code>. ممنون!`,
    report_toast: "گزارش ثبت شد",
    mylink: (link, webLink, vipLine, views, messages) => `🔗 <b>لینک تلگرامت:</b>\n<code>${link}</code>\n\n🌐 <b>لینک وب:</b>\n<code>${webLink}</code>${vipLine}\n\n📊 بازدید: ${views} | پیام: ${messages}`,
    vip_line: (link) => `\n\n👑 <b>لینک VIP:</b>\n<code>${link}</code>`,
    inbox_empty: "📥 صندوقت خالیه! لینکت رو به دوستات بده.",
    inbox_title: (n) => `📥 <b>آخرین پیام‌ها (${n} پیام):</b>\n\n`,
    file_label: "[فایل]",
    fav_empty: "⭐ هنوز پیامی ذخیره نکردی.",
    fav_title: (n) => `⭐ <b>پیام‌های محبوب (${n}):</b>\n\n`,
    stats: (views, messages, favCount, blockedCount, dndStatus) => `📊 <b>آمار تو:</b>\n\n👁 بازدید لینک: ${views}\n📩 پیام دریافتی: ${messages}\n⭐ پیام‌های محبوب: ${favCount}\n🚫 بلاک‌شده‌ها: ${blockedCount}\n🔇 DND: ${dndStatus}`,
    dnd_on: "فعال",
    dnd_off: "غیرفعال",
    help: "❓ <b>راهنما:</b>\n\n🔗 <b>لینک ناشناسم</b> — لینکت رو بگیر\n📥 <b>صندوق</b> — آخرین پیام‌ها\n⭐ <b>محبوب‌ها</b> — پیام‌های ذخیره‌شده\n📊 <b>آمار</b> — بازدید و پیام\n\n<b>دستورات:</b>\n/addfilter کلمه — فیلتر کلمه\n/rmfilter کلمه — حذف فیلتر\n/setvip یوزرنیم — لینک VIP\n\n<b>دکمه‌های زیر هر پیام:</b>\n👍❤️😂 — واکنش\n↩️ — پاسخ ناشناس\n⭐ — ذخیره\n🚫 — بلاک فرستنده\n🚨 — گزارش",
    dnd_disabled: "🔔 حالت عدم مزاحمت غیرفعال شد.",
    dnd_enabled: "🔇 حالت عدم مزاحمت فعال شد (۸ ساعت).\nکسی نمی‌تونه پیام بفرسته.",
    vip_info: "👑 <b>لینک VIP</b>\n\nبا این قابلیت یه لینک اختصاصی با اسم دلخواه می‌گیری:\n<code>https://t.me/bot?start=اسم_تو</code>\n\nبرای تنظیم:\n/setvip یوزرنیم_دلخواه\n\n<i>فقط حروف انگلیسی و عدد — مثلاً /setvip ali123</i>",
    vip_bad_format: "❌ فرمت اشتباه. فقط حروف کوچک انگلیسی، عدد و _ (۳ تا ۲۰ کاراکتر)",
    vip_taken: "❌ این نام قبلاً گرفته شده. یه اسم دیگه امتحان کن.",
    vip_set: (link) => `👑 لینک VIP تو:\n<code>${link}</code>`,
    filter_need_word: "❌ کلمه رو وارد کن.",
    filter_added: (w) => `🚫 «${w}» به فیلتر اضافه شد.`,
    filter_removed: (w) => `✅ «${w}» از فیلتر حذف شد.`,
    sender_blocked: "🚫 فرستنده بلاک شد.",
    msg_saved: (id) => `⭐ پیام ${id} ذخیره شد.`,
    report_submitted: (id) => `🚨 گزارش پیام ${id} ثبت شد. ممنون!`,
    daily_question: (q) => `🌟 <b>سوال روز:</b>\n\n${q}\n\nاز دوستات بخواه جواب بدن 👇\n<i>لینک ناشناست رو ببین با /start</i>`,
    lang_set: "✅ زبان به فارسی تغییر کرد.",
  },
  en: {
    menu_link: "🔗 My Anonymous Link",
    menu_inbox: "📥 Inbox",
    menu_fav: "⭐ Favorites",
    menu_stats: "📊 Stats",
    menu_settings: "⚙️ Settings",
    menu_help: "❓ Help",
    menu_dnd: "🔇 Do Not Disturb",
    menu_filter: "🚫 Filtered Words",
    menu_vip: "👑 VIP Link",
    menu_back: "🔙 Back",
    btn_cancel: "❌ Cancel",
    btn_cancel_reply: "❌ Cancel Reply",
    settings_title: "⚙️ Settings:",
    home_title: "🏠 Home:",
    filter_none: "No words filtered",
    filter_list: (list) => `🚫 Currently filtered words:\n${list}\n\nTo add/remove: /addfilter word or /rmfilter word`,
    start_hint: "Send /start to begin 👆",
    welcome: (link, webLink) => `👋 Welcome to Amir's Anonymous Message Bot — my channel: @shishekhord!\n\n🔗 <b>Your Telegram link:</b>\n<code>${link}</code>\n\n🌐 <b>Web link:</b>\n<code>${webLink}</code>\n\nShare these links with your friends so they can send you anonymous messages!`,
    link_invalid: "❌ This link is invalid or has expired.",
    cant_msg_self: "⚠️ You can't send a message to yourself!",
    cant_send: "⛔ You can't send a message right now.",
    dnd_wait: (h) => `🔇 This user isn't accepting messages right now (${h}h left).`,
    ready_to_send: "✅ Ready! Write your message — text, photo, sticker, file, or voice.\n\n<i>This session closes in 1 hour.</i>",
    cancelled: "Cancelled.",
    msg_filtered: "⚠️ Your message was filtered and not sent.",
    anon_msg_label: (id) => `↑ Anonymous message — code: <code>${id}</code>`,
    anon_msg_body: (text, id) => `📩 <b>Anonymous message:</b>\n\n${text}\n\n<i>code: ${id}</i>`,
    sent_confirm: "✅ Your message was sent! You can send another one.",
    reply_prompt: "↩️ Write your reply — it'll be sent anonymously:",
    reply_label_file: (id) => `↩️ <b>Anonymous reply</b> to message <code>${id}</code>`,
    reply_label_text: (id, text) => `↩️ <b>Anonymous reply</b> to message <code>${id}</code>:\n\n${text}`,
    reply_sent: "✅ Your reply was sent!",
    reply_expired: "❌ This message has expired and can no longer be replied to.",
    react_notify: (emoji, id) => `${emoji} Someone reacted to message <code>${id}</code>!`,
    react_toast: "Reaction recorded!",
    fav_toast: "⭐ Message saved!",
    block_expired: "❌ This message has expired.",
    block_done_msg: "🚫 This sender has been blocked. They can no longer message you.",
    block_toast: "Blocked",
    report_msg: (id) => `🚨 Report submitted for message <code>${id}</code>. Thanks!`,
    report_toast: "Report submitted",
    mylink: (link, webLink, vipLine, views, messages) => `🔗 <b>Your Telegram link:</b>\n<code>${link}</code>\n\n🌐 <b>Web link:</b>\n<code>${webLink}</code>${vipLine}\n\n📊 Views: ${views} | Messages: ${messages}`,
    vip_line: (link) => `\n\n👑 <b>VIP link:</b>\n<code>${link}</code>`,
    inbox_empty: "📥 Your inbox is empty! Share your link with friends.",
    inbox_title: (n) => `📥 <b>Recent messages (${n}):</b>\n\n`,
    file_label: "[file]",
    fav_empty: "⭐ You haven't saved any messages yet.",
    fav_title: (n) => `⭐ <b>Favorite messages (${n}):</b>\n\n`,
    stats: (views, messages, favCount, blockedCount, dndStatus) => `📊 <b>Your stats:</b>\n\n👁 Link views: ${views}\n📩 Messages received: ${messages}\n⭐ Favorites: ${favCount}\n🚫 Blocked senders: ${blockedCount}\n🔇 DND: ${dndStatus}`,
    dnd_on: "On",
    dnd_off: "Off",
    help: "❓ <b>Help:</b>\n\n🔗 <b>My Anonymous Link</b> — get your link\n📥 <b>Inbox</b> — recent messages\n⭐ <b>Favorites</b> — saved messages\n📊 <b>Stats</b> — views and messages\n\n<b>Commands:</b>\n/addfilter word — filter a word\n/rmfilter word — remove a filter\n/setvip username — VIP link\n\n<b>Buttons under each message:</b>\n👍❤️😂 — react\n↩️ — anonymous reply\n⭐ — save\n🚫 — block sender\n🚨 — report",
    dnd_disabled: "🔔 Do Not Disturb turned off.",
    dnd_enabled: "🔇 Do Not Disturb enabled (8 hours).\nNo one can message you.",
    vip_info: "👑 <b>VIP Link</b>\n\nGet a custom link with your own name:\n<code>https://t.me/bot?start=your_name</code>\n\nTo set it:\n/setvip your_username\n\n<i>English letters and numbers only — e.g. /setvip ali123</i>",
    vip_bad_format: "❌ Invalid format. Lowercase English letters, numbers, and _ only (3–20 characters)",
    vip_taken: "❌ This name is already taken. Try another one.",
    vip_set: (link) => `👑 Your VIP link:\n<code>${link}</code>`,
    filter_need_word: "❌ Enter a word.",
    filter_added: (w) => `🚫 "${w}" added to the filter.`,
    filter_removed: (w) => `✅ "${w}" removed from the filter.`,
    sender_blocked: "🚫 Sender blocked.",
    msg_saved: (id) => `⭐ Message ${id} saved.`,
    report_submitted: (id) => `🚨 Report for message ${id} submitted. Thanks!`,
    daily_question: (q) => `🌟 <b>Question of the day:</b>\n\n${q}\n\nAsk your friends to answer 👇\n<i>Check your anonymous link with /start</i>`,
    lang_set: "✅ Language switched to English.",
  }
};

function t(lang, key, ...args) {
  const dict = STR[lang] && STR[lang][key] !== undefined ? STR[lang] : STR.fa;
  const v = dict[key];
  return typeof v === "function" ? v(...args) : v;
}

// True if `text` matches the given menu key in EITHER language — used so
// button taps still work right after a language switch or with a stale keyboard.
function isBtn(text, key) {
  return text === STR.fa[key] || text === STR.en[key];
}

const LANG_FA_BTN = "🇮🇷 فارسی";
const LANG_EN_BTN = "🇬🇧 English";

// ─── KV helpers ────────────────────────────────────────────────────────────
async function kv(env, op, key, val, opts) {
  if (op === "get") { const r = await env.ANON_STORE.get(key); return r ? JSON.parse(r) : null; }
  if (op === "set") return env.ANON_STORE.put(key, JSON.stringify(val), opts || {});
  if (op === "del") return env.ANON_STORE.delete(key);
}

// ─── Sender ID tokens (never expose real chatId in callback_data) ─────────
// Maps a random opaque token -> real chatId, stored server-side only.
// This is what keeps identities hidden even if callback_data leaks.
async function makeSenderToken(env, chatId) {
  const token = makeId(10);
  await env.ANON_STORE.put(`tok:${token}`, String(chatId), { expirationTtl: 2592000 }); // 30 days
  return token;
}

async function resolveSenderToken(env, token) {
  return await env.ANON_STORE.get(`tok:${token}`);
}

async function getUser(env, chatId) {
  return await kv(env, "get", `u:${chatId}`) || {
    chatId,
    linkId: null,
    vipUsername: null,
    lang: "fa",
    blocked: [],
    favorites: [],
    dnd: false,
    dndUntil: 0,
    filterWords: [],
    inbox: [],
    stats: { views: 0, messages: 0 },
    replySession: null,
    replySessionExpiry: 0,
    createdAt: Date.now()
  };
}

async function saveUser(env, user) {
  // trim inbox to last 50 to stay under KV size
  if (user.inbox.length > 50) user.inbox = user.inbox.slice(-50);
  await kv(env, "set", `u:${user.chatId}`, user);
}

async function getUserByLink(env, linkId) {
  const chatId = await env.ANON_STORE.get(`link:${linkId}`);
  if (!chatId) return null;
  return getUser(env, chatId);
}

async function getUserByVip(env, vip) {
  const chatId = await env.ANON_STORE.get(`vip:${vip.toLowerCase()}`);
  if (!chatId) return null;
  return getUser(env, chatId);
}

// ─── Main keyboards ─────────────────────────────────────────────────────────
function mainMenu(lang = "fa") {
  return {
    keyboard: [
      [t(lang, "menu_link"), t(lang, "menu_inbox")],
      [t(lang, "menu_fav"), t(lang, "menu_stats")],
      [t(lang, "menu_settings"), t(lang, "menu_help")]
    ],
    resize_keyboard: true
  };
}

function settingsMenu(lang = "fa") {
  return {
    keyboard: [
      [t(lang, "menu_dnd"), t(lang, "menu_filter")],
      [t(lang, "menu_vip"), t(lang, "menu_back")],
      [LANG_FA_BTN, LANG_EN_BTN]
    ],
    resize_keyboard: true
  };
}

// ─── Daily question scheduler ───────────────────────────────────────────────
const DAILY_QUESTIONS = {
  fa: [
    "اگه می‌تونستی یه چیز رو در موردم بدونی، چی بود؟ 🤔",
    "صادقانه بگو، اولین چیزی که از من یادت میاد چیه؟ 💭",
    "یه چیزی هست که بخوای بهم بگی ولی جرأت نداشتی؟ 😶",
    "چه ویژگی‌ای از من بیشتر دوست داری؟ ❤️",
    "اگه یه نصیحت بخوای بهم بدی چی میگی؟ 🎯",
    "در مورد من چه فکری می‌کنی؟ 🌟",
    "یه سوال بپرس که همیشه می‌خواستی بدونی! 🎤"
  ],
  en: [
    "If you could know one thing about me, what would it be? 🤔",
    "Honestly, what's the first thing you remember about me? 💭",
    "Is there something you want to tell me but never dared to? 😶",
    "What trait of mine do you like the most? ❤️",
    "If you had one piece of advice for me, what would it be? 🎯",
    "What do you think of me? 🌟",
    "Ask a question you've always wanted to know! 🎤"
  ]
};

// ─── Worker entry ────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Cron / scheduled daily question (triggered via GET /cron?secret=...)
    if (url.pathname === "/cron") {
      await sendDailyQuestions(env);
      return new Response("ok");
    }

    // ── Webhook
    if (request.method === "POST" && url.pathname === "/webhook") {
      const update = await request.json();
      await handleUpdate(update, env);
      return new Response("ok");
    }

    // ── Stats page (view link opens this, increments view counter)
    if (request.method === "GET" && url.pathname.startsWith("/p/")) {
      const linkId = url.pathname.slice(3);
      return handleWebPage(linkId, env);
    }

    // ── Web form submission (the /p/<linkId> page posts here)
    if (request.method === "POST" && url.pathname === "/api/send") {
      return handleApiSend(request, env);
    }

    return new Response("Anonymous Bot 🤫", { status: 200 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDailyQuestions(env));
  }
};

// ─── Daily questions ─────────────────────────────────────────────────────────
async function sendDailyQuestions(env) {
  const keys = await env.ANON_STORE.list({ prefix: "u:" });
  for (const key of keys.keys) {
    const user = JSON.parse(await env.ANON_STORE.get(key.name));
    if (!user || user.dnd) continue;
    const lang = user.lang || "fa";
    const q = DAILY_QUESTIONS[lang][new Date().getDay()];
    try {
      await sendMessage(env, user.chatId, t(lang, "daily_question", q), { reply_markup: mainMenu(lang) });
    } catch (_) {}
  }
}

// ─── Web page for anonymous message form ─────────────────────────────────────
async function handleWebPage(linkId, env) {
  const ownerChatId = await env.ANON_STORE.get(`link:${linkId}`);
  if (!ownerChatId) {
    return new Response("لینک منقضی شده یا وجود ندارد / Link expired or not found", { status: 404, headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
  // increment views
  const user = await getUser(env, ownerChatId);
  user.stats.views = (user.stats.views || 0) + 1;
  await saveUser(env, user);
  const lang = user.lang || "fa";
  const isFa = lang === "fa";

  const webTxt = isFa ? {
    dir: "rtl", htmlLang: "fa", title: "پیام ناشناس 🤫",
    h2: "💬 پیام ناشناس بفرست", p: "پیامت کاملاً ناشناس ارسال میشه — هیچ‌کس نمی‌دونه کی فرستاده!",
    placeholder: "پیامت رو اینجا بنویس...", sendBtn: "ارسال ناشناس 🤫", sending: "در حال ارسال...",
    ok: "✅ پیامت ارسال شد!", tip: "ساخته شده با ❤️ — ربات پیام ناشناس"
  } : {
    dir: "ltr", htmlLang: "en", title: "Anonymous Message 🤫",
    h2: "💬 Send an Anonymous Message", p: "Your message is sent completely anonymously — no one knows who sent it!",
    placeholder: "Write your message here...", sendBtn: "Send Anonymously 🤫", sending: "Sending...",
    ok: "✅ Your message was sent!", tip: "Made with ❤️ — Anonymous Message Bot"
  };

  const html = `<!DOCTYPE html>
<html dir="${webTxt.dir}" lang="${webTxt.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${webTxt.title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Tahoma,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea,#764ba2);padding:1rem}
.card{background:#fff;border-radius:20px;padding:2rem;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
h2{color:#764ba2;margin-bottom:.5rem;font-size:1.4rem}
p{color:#666;font-size:.9rem;margin-bottom:1.5rem}
textarea{width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:12px;font-size:1rem;resize:none;height:130px;font-family:inherit;transition:border .2s}
textarea:focus{outline:none;border-color:#764ba2}
.char{text-align:right;font-size:.8rem;color:#999;margin-top:4px}
button{width:100%;padding:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:12px;font-size:1rem;cursor:pointer;margin-top:1rem;font-family:inherit;transition:opacity .2s}
button:hover{opacity:.9}
button:disabled{opacity:.5;cursor:not-allowed}
#msg{margin-top:1rem;padding:12px;border-radius:10px;text-align:center;display:none;font-size:.95rem}
.ok{background:#d4edda;color:#155724}
.err{background:#f8d7da;color:#721c24}
.tip{margin-top:1.5rem;text-align:center;font-size:.8rem;color:#999}
</style>
</head>
<body>
<div class="card">
  <h2>${webTxt.h2}</h2>
  <p>${webTxt.p}</p>
  <textarea id="t" placeholder="${webTxt.placeholder}" maxlength="1000" oninput="updateChar()"></textarea>
  <div class="char"><span id="c">0</span>/1000</div>
  <button id="btn" onclick="send()">${webTxt.sendBtn}</button>
  <div id="msg"></div>
  <p class="tip">${webTxt.tip}</p>
</div>
<script>
function updateChar(){document.getElementById('c').textContent=document.getElementById('t').value.length}
async function send(){
  const t=document.getElementById('t').value.trim();
  if(!t){return;}
  const btn=document.getElementById('btn');
  btn.disabled=true;btn.textContent='${webTxt.sending}';
  const r=await fetch('/api/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({linkId:'${linkId}',text:t})});
  const d=await r.json();
  const m=document.getElementById('msg');
  m.style.display='block';
  if(d.ok){m.className='ok';m.textContent='${webTxt.ok}';document.getElementById('t').value='';updateChar();}
  else{m.className='err';m.textContent='❌ '+d.error;}
  btn.disabled=false;btn.textContent='${webTxt.sendBtn}';
}
</script>
</body>
</html>`;
  return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
}

// ─── Web form submission (anonymous message from the browser, no Telegram chatId) ──
async function handleApiSend(request, env) {
  let body;
  try { body = await request.json(); } catch (_) { return jsonResponse({ ok: false, error: "Bad request" }, 400); }

  const linkId = body && body.linkId;
  const text = body && typeof body.text === "string" ? body.text.trim() : "";
  if (!linkId || !text) return jsonResponse({ ok: false, error: "Invalid input" }, 400);

  let targetUser = await getUserByLink(env, linkId);
  if (!targetUser) targetUser = await getUserByVip(env, linkId);
  if (!targetUser) return jsonResponse({ ok: false, error: "Link not found" }, 404);

  const lang = targetUser.lang || "fa";
  const trimmed = text.slice(0, 1000);

  if (targetUser.dnd && Date.now() < targetUser.dndUntil) {
    return jsonResponse({ ok: false, error: lang === "fa" ? "این کاربر موقتاً پیام نمی‌گیره." : "This user isn't accepting messages right now." }, 403);
  }
  for (const word of targetUser.filterWords) {
    if (trimmed.toLowerCase().includes(word.toLowerCase())) {
      return jsonResponse({ ok: false, error: t(lang, "msg_filtered") }, 403);
    }
  }

  const msgId = makeId(8);
  targetUser.inbox.push({ id: msgId, type: "text", text: trimmed, fileId: null, date: Date.now(), blocked: false, favorite: false });
  targetUser.stats.messages = (targetUser.stats.messages || 0) + 1;
  await saveUser(env, targetUser);

  // Web-origin messages have no Telegram chatId behind them, so reply/block/react
  // (which need a real chat to route into) aren't offered here — only fav/report.
  const replyMarkup = {
    inline_keyboard: [[
      { text: lang === "fa" ? "⭐ ذخیره" : "⭐ Save", callback_data: `fav:${msgId}:${targetUser.chatId}` },
      { text: lang === "fa" ? "🚨 گزارش" : "🚨 Report", callback_data: `report:${msgId}:${targetUser.chatId}` }
    ]]
  };
  await sendMessage(env, targetUser.chatId, t(lang, "anon_msg_body", escHtml(trimmed), msgId), { reply_markup: replyMarkup });

  return jsonResponse({ ok: true });
}

// ─── Update handler ───────────────────────────────────────────────────────────
async function handleUpdate(update, env) {
  // Callback query (reaction buttons)
  if (update.callback_query) {
    await handleCallback(update.callback_query, env);
    return;
  }

  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const text = msg.text || "";
  const user = await getUser(env, chatId);
  const lang = user.lang || "fa";

  // ── /start
  if (text === "/start" || text === "/start@anonymousbot") {
    await handleStart(chatId, user, env);
    return;
  }

  // ── /start with linkId (came from someone's link)
  if (text.startsWith("/start ")) {
    await handleStartWithLink(chatId, text.split(" ")[1], user, env);
    return;
  }

  // ── Main menu buttons (match against either language)
  if (isBtn(text, "menu_link")) { await sendMyLink(chatId, user, env); return; }
  if (isBtn(text, "menu_inbox")) { await sendInbox(chatId, user, env); return; }
  if (isBtn(text, "menu_fav")) { await sendFavorites(chatId, user, env); return; }
  if (isBtn(text, "menu_stats")) { await sendStats(chatId, user, env); return; }
  if (isBtn(text, "menu_settings")) { await sendMessage(env, chatId, t(lang, "settings_title"), { reply_markup: settingsMenu(lang) }); return; }
  if (isBtn(text, "menu_help")) { await sendHelp(env, chatId, lang); return; }
  if (isBtn(text, "menu_back")) { await sendMessage(env, chatId, t(lang, "home_title"), { reply_markup: mainMenu(lang) }); return; }

  // ── Language switch
  if (text === LANG_FA_BTN) {
    user.lang = "fa";
    await saveUser(env, user);
    await sendMessage(env, chatId, t("fa", "lang_set"), { reply_markup: settingsMenu("fa") });
    return;
  }
  if (text === LANG_EN_BTN) {
    user.lang = "en";
    await saveUser(env, user);
    await sendMessage(env, chatId, t("en", "lang_set"), { reply_markup: settingsMenu("en") });
    return;
  }

  // ── Settings
  if (isBtn(text, "menu_dnd")) { await handleDnd(chatId, user, env); return; }
  if (isBtn(text, "menu_filter")) {
    const list = user.filterWords.length ? user.filterWords.join(", ") : t(lang, "filter_none");
    await sendMessage(env, chatId, t(lang, "filter_list", list));
    return;
  }
  if (isBtn(text, "menu_vip")) { await handleVip(chatId, user, env); return; }
  if (text.startsWith("/addfilter ")) { await addFilter(chatId, user, text.slice(11).trim(), env); return; }
  if (text.startsWith("/rmfilter ")) { await rmFilter(chatId, user, text.slice(10).trim(), env); return; }
  if (text.startsWith("/setvip ")) { await setVip(chatId, user, text.slice(8).trim(), env); return; }
  if (text.startsWith("/block ")) { await blockSender(chatId, user, text.slice(7).trim(), env); return; }
  if (text.startsWith("/fav ")) { await favMessage(chatId, user, text.slice(5).trim(), env); return; }
  if (text.startsWith("/report ")) { await reportMessage(chatId, text.slice(8).trim(), env, lang); return; }

  // ── User is in reply session (sending anonymous reply)
  if (user.replySession && Date.now() < user.replySessionExpiry) {
    await handleReply(msg, user, env);
    return;
  }

  // ── User is in send session (sending anon message to someone via bot)
  const session = await env.ANON_STORE.get(`sess:${chatId}`);
  if (session) {
    await handleSendSession(msg, chatId, session, user, env);
    return;
  }

  await sendMessage(env, chatId, t(lang, "start_hint"), { reply_markup: mainMenu(lang) });
}

// ─── /start ───────────────────────────────────────────────────────────────────
async function handleStart(chatId, user, env) {
  if (!user.linkId) {
    user.linkId = makeId();
    await env.ANON_STORE.put(`link:${user.linkId}`, String(chatId));
    await saveUser(env, user);
  }
  const lang = user.lang || "fa";
  const me = await tgApi(env, "getMe", {});
  const botUsername = me.result.username;
  const link = `https://t.me/${botUsername}?start=${user.linkId}`;
  const webLink = `${WEB_BASE_URL}/p/${user.linkId}`;
  await sendMessage(env, chatId, t(lang, "welcome", link, webLink), { reply_markup: mainMenu(lang) });
}

// ─── /start with link ─────────────────────────────────────────────────────────
async function handleStartWithLink(chatId, linkId, user, env) {
  const lang = user.lang || "fa";
  // check VIP link
  let targetUser = await getUserByLink(env, linkId);
  if (!targetUser) targetUser = await getUserByVip(env, linkId);

  if (!targetUser) { await sendMessage(env, chatId, t(lang, "link_invalid")); return; }
  if (String(chatId) === String(targetUser.chatId)) { await sendMessage(env, chatId, t(lang, "cant_msg_self"), { reply_markup: mainMenu(lang) }); return; }
  if (targetUser.blocked.includes(String(chatId))) { await sendMessage(env, chatId, t(lang, "cant_send")); return; }
  if (targetUser.dnd && Date.now() < targetUser.dndUntil) {
    const remaining = Math.ceil((targetUser.dndUntil - Date.now()) / 3600000);
    await sendMessage(env, chatId, t(lang, "dnd_wait", remaining));
    return;
  }

  await env.ANON_STORE.put(`sess:${chatId}`, JSON.stringify({ targetChatId: targetUser.chatId, targetLinkId: linkId }), { expirationTtl: 3600 });
  await sendMessage(env, chatId, t(lang, "ready_to_send"), { reply_markup: { keyboard: [[t(lang, "btn_cancel")]], resize_keyboard: true } });
}

// ─── Send session handler ─────────────────────────────────────────────────────
async function handleSendSession(msg, chatId, sessionRaw, senderUser, env) {
  const senderLang = senderUser.lang || "fa";
  const text = msg.text || "";
  if (isBtn(text, "btn_cancel")) {
    await env.ANON_STORE.delete(`sess:${chatId}`);
    await sendMessage(env, chatId, t(senderLang, "cancelled"), { reply_markup: mainMenu(senderLang) });
    return;
  }

  const session = JSON.parse(sessionRaw);
  const targetUser = await getUser(env, session.targetChatId);
  const targetLang = targetUser.lang || "fa";

  // filter check
  const msgText = msg.text || msg.caption || "";
  for (const word of targetUser.filterWords) {
    if (msgText.toLowerCase().includes(word.toLowerCase())) {
      await sendMessage(env, chatId, t(senderLang, "msg_filtered"));
      return;
    }
  }

  // generate message ID for actions
  const msgId = makeId(8);

  // opaque token that maps to the real sender chatId server-side only —
  // this never appears in callback_data, so it can't be decoded by anyone
  const senderToken = await makeSenderToken(env, chatId);

  // store in inbox
  const inboxItem = {
    id: msgId,
    type: msg.photo ? "photo" : msg.sticker ? "sticker" : msg.document ? "document" : msg.voice ? "voice" : msg.audio ? "audio" : msg.video ? "video" : "text",
    text: msg.text || msg.caption || "",
    fileId: msg.photo ? msg.photo[msg.photo.length-1].file_id : msg.sticker?.file_id || msg.document?.file_id || msg.voice?.file_id || msg.audio?.file_id || msg.video?.file_id || null,
    date: Date.now(),
    blocked: false,
    favorite: false
  };
  targetUser.inbox.push(inboxItem);
  targetUser.stats.messages = (targetUser.stats.messages || 0) + 1;
  await saveUser(env, targetUser);

  // action buttons — sender identity only ever travels as senderToken,
  // never as the raw chatId, so nothing decodable ever reaches Telegram.
  // The react buttons notify the SENDER (via senderToken), not the owner.
  const replyMarkup = {
    inline_keyboard: [[
      { text: "👍", callback_data: `react:${msgId}:👍:${senderToken}` },
      { text: "❤️", callback_data: `react:${msgId}:❤️:${senderToken}` },
      { text: "😂", callback_data: `react:${msgId}:😂:${senderToken}` },
      { text: "😮", callback_data: `react:${msgId}:😮:${senderToken}` },
    ],[
      { text: targetLang === "fa" ? "↩️ پاسخ ناشناس" : "↩️ Reply anonymously", callback_data: `reply:${msgId}:${senderToken}:${session.targetChatId}` },
      { text: targetLang === "fa" ? "⭐ ذخیره" : "⭐ Save", callback_data: `fav:${msgId}:${session.targetChatId}` },
      { text: targetLang === "fa" ? "🚫 بلاک" : "🚫 Block", callback_data: `block:${msgId}:${senderToken}:${session.targetChatId}` },
    ],[
      { text: targetLang === "fa" ? "🚨 گزارش" : "🚨 Report", callback_data: `report:${msgId}:${session.targetChatId}` }
    ]]
  };

  // send to target
  let sent = false;
  if (msg.photo || msg.sticker || msg.document || msg.voice || msg.audio || msg.video) {
    const fwd = await forwardFile(env, session.targetChatId, msg);
    if (fwd) {
      await tgApi(env, "sendMessage", { chat_id: session.targetChatId, text: t(targetLang, "anon_msg_label", msgId), parse_mode: "HTML", reply_markup: replyMarkup });
      sent = true;
    }
  }
  if (!sent) {
    await sendMessage(env, session.targetChatId, t(targetLang, "anon_msg_body", escHtml(msgText), msgId), { reply_markup: replyMarkup });
  }

  await sendMessage(env, chatId, t(senderLang, "sent_confirm"), { reply_markup: { keyboard: [[t(senderLang, "btn_cancel")]], resize_keyboard: true } });
}

// ─── Reply session ────────────────────────────────────────────────────────────
async function handleReply(msg, user, env) {
  const ownerLang = user.lang || "fa";
  const { targetChatId, originalMsgId } = user.replySession;
  const text = msg.text || "";

  if (isBtn(text, "btn_cancel_reply")) {
    user.replySession = null;
    user.replySessionExpiry = 0;
    await saveUser(env, user);
    await sendMessage(env, user.chatId, t(ownerLang, "cancelled"), { reply_markup: mainMenu(ownerLang) });
    return;
  }

  const senderRecipient = await getUser(env, targetChatId);
  const recipientLang = senderRecipient.lang || "fa";

  const replyId = makeId(8);

  // token that maps back to YOUR real chatId, so the sender's reaction
  // buttons can notify you without ever exposing your ID to them
  const ownerToken = await makeSenderToken(env, user.chatId);
  const reactMarkup = {
    inline_keyboard: [[
      { text: "👍", callback_data: `react:${replyId}:👍:${ownerToken}` },
      { text: "❤️", callback_data: `react:${replyId}:❤️:${ownerToken}` },
      { text: "😂", callback_data: `react:${replyId}:😂:${ownerToken}` },
      { text: "😮", callback_data: `react:${replyId}:😮:${ownerToken}` },
    ]]
  };

  let sent = false;
  if (msg.photo || msg.sticker || msg.document || msg.voice || msg.audio || msg.video) {
    await forwardFile(env, targetChatId, msg);
    await sendMessage(env, targetChatId, t(recipientLang, "reply_label_file", originalMsgId), { reply_markup: reactMarkup });
    sent = true;
  }
  if (!sent) {
    await sendMessage(env, targetChatId, t(recipientLang, "reply_label_text", originalMsgId, escHtml(text)), { reply_markup: reactMarkup });
  }

  user.replySession = null;
  user.replySessionExpiry = 0;
  await saveUser(env, user);
  await sendMessage(env, user.chatId, t(ownerLang, "reply_sent"), { reply_markup: mainMenu(ownerLang) });
}

// ─── Callbacks ────────────────────────────────────────────────────────────────
async function handleCallback(cb, env) {
  const chatId = cb.from.id;
  const data = cb.data;

  if (data.startsWith("react:")) {
    const [, msgId, emoji, notifyToken] = data.split(":");
    const notifyChatId = await resolveSenderToken(env, notifyToken);
    if (notifyChatId) {
      const notifyUser = await getUser(env, notifyChatId);
      const notifyLang = notifyUser.lang || "fa";
      await sendMessage(env, notifyChatId, t(notifyLang, "react_notify", emoji, msgId));
    }
    const clicker = await getUser(env, chatId);
    await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id, text: t(clicker.lang || "fa", "react_toast") });
    return;
  }

  if (data.startsWith("reply:")) {
    const [, msgId, senderToken, ownerChatId] = data.split(":");
    if (String(chatId) !== String(ownerChatId)) { await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id }); return; }
    const user = await getUser(env, ownerChatId);
    const lang = user.lang || "fa";
    const senderChatId = await resolveSenderToken(env, senderToken);
    if (!senderChatId) {
      await sendMessage(env, ownerChatId, t(lang, "reply_expired"));
      await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id });
      return;
    }
    user.replySession = { targetChatId: senderChatId, originalMsgId: msgId };
    user.replySessionExpiry = Date.now() + 1800000;
    await saveUser(env, user);
    await sendMessage(env, ownerChatId, t(lang, "reply_prompt"), { reply_markup: { keyboard: [[t(lang, "btn_cancel_reply")]], resize_keyboard: true } });
    await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id });
    return;
  }

  if (data.startsWith("fav:")) {
    const [, msgId, ownerChatId] = data.split(":");
    if (String(chatId) !== String(ownerChatId)) { await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id }); return; }
    const user = await getUser(env, ownerChatId);
    const lang = user.lang || "fa";
    if (!user.favorites.includes(msgId)) {
      user.favorites.push(msgId);
      await saveUser(env, user);
      await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id, text: t(lang, "fav_toast") });
    } else {
      await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id });
    }
    return;
  }

  if (data.startsWith("block:")) {
    const [, msgId, senderToken, ownerChatId] = data.split(":");
    if (String(chatId) !== String(ownerChatId)) { await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id }); return; }
    const user = await getUser(env, ownerChatId);
    const lang = user.lang || "fa";
    const senderChatId = await resolveSenderToken(env, senderToken);
    if (!senderChatId) {
      await sendMessage(env, ownerChatId, t(lang, "block_expired"));
      await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id });
      return;
    }
    if (!user.blocked.includes(senderChatId)) {
      user.blocked.push(senderChatId);
      await saveUser(env, user);
    }
    await sendMessage(env, ownerChatId, t(lang, "block_done_msg"));
    await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id, text: t(lang, "block_toast") });
    return;
  }

  if (data.startsWith("report:")) {
    const [, msgId, ownerChatId] = data.split(":");
    if (String(chatId) !== String(ownerChatId)) { await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id }); return; }
    const user = await getUser(env, ownerChatId);
    const lang = user.lang || "fa";
    await sendMessage(env, ownerChatId, t(lang, "report_msg", msgId));
    await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id, text: t(lang, "report_toast") });
    return;
  }

  await tgApi(env, "answerCallbackQuery", { callback_query_id: cb.id });
}

// ─── Feature handlers ─────────────────────────────────────────────────────────
async function sendMyLink(chatId, user, env) {
  const lang = user.lang || "fa";
  if (!user.linkId) { user.linkId = makeId(); await env.ANON_STORE.put(`link:${user.linkId}`, String(chatId)); await saveUser(env, user); }
  const me = await tgApi(env, "getMe", {});
  const botUsername = me.result.username;
  const link = `https://t.me/${botUsername}?start=${user.linkId}`;
  const webLink = `${WEB_BASE_URL}/p/${user.linkId}`;
  let vipLine = "";
  if (user.vipUsername) {
    const vipLink = `https://t.me/${botUsername}?start=${user.vipUsername}`;
    vipLine = t(lang, "vip_line", vipLink);
  }
  await sendMessage(env, chatId,
    t(lang, "mylink", link, webLink, vipLine, user.stats.views || 0, user.stats.messages || 0),
    { reply_markup: mainMenu(lang) }
  );
}

async function sendInbox(chatId, user, env) {
  const lang = user.lang || "fa";
  if (!user.inbox || user.inbox.length === 0) {
    await sendMessage(env, chatId, t(lang, "inbox_empty"), { reply_markup: mainMenu(lang) });
    return;
  }
  const last10 = [...user.inbox].reverse().slice(0, 10);
  let txt = t(lang, "inbox_title", user.inbox.length);
  for (const item of last10) {
    const d = new Date(item.date).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US");
    const fav = item.favorite ? "⭐" : "";
    const icon = item.type === "photo" ? "🖼" : item.type === "voice" ? "🎤" : item.type === "sticker" ? "🎭" : item.type === "document" ? "📎" : "💬";
    txt += `${icon} ${fav} <code>${item.id}</code> — ${d}\n${item.text ? escHtml(item.text.slice(0, 80)) + (item.text.length > 80 ? "..." : "") : t(lang, "file_label")}\n\n`;
  }
  await sendMessage(env, chatId, txt, { reply_markup: mainMenu(lang) });
}

async function sendFavorites(chatId, user, env) {
  const lang = user.lang || "fa";
  const favItems = (user.inbox || []).filter(i => user.favorites.includes(i.id));
  if (!favItems.length) { await sendMessage(env, chatId, t(lang, "fav_empty"), { reply_markup: mainMenu(lang) }); return; }
  let txt = t(lang, "fav_title", favItems.length);
  for (const item of favItems) {
    const d = new Date(item.date).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US");
    txt += `📌 <code>${item.id}</code> — ${d}\n${item.text ? escHtml(item.text.slice(0, 100)) : t(lang, "file_label")}\n\n`;
  }
  await sendMessage(env, chatId, txt, { reply_markup: mainMenu(lang) });
}

async function sendStats(chatId, user, env) {
  const lang = user.lang || "fa";
  const dndStatus = user.dnd && Date.now() < user.dndUntil ? t(lang, "dnd_on") : t(lang, "dnd_off");
  await sendMessage(env, chatId,
    t(lang, "stats", user.stats.views || 0, user.stats.messages || 0, user.favorites.length, user.blocked.length, dndStatus),
    { reply_markup: mainMenu(lang) }
  );
}

async function sendHelp(env, chatId, lang = "fa") {
  await sendMessage(env, chatId, t(lang, "help"));
}

async function handleDnd(chatId, user, env) {
  const lang = user.lang || "fa";
  if (user.dnd && Date.now() < user.dndUntil) {
    user.dnd = false;
    user.dndUntil = 0;
    await saveUser(env, user);
    await sendMessage(env, chatId, t(lang, "dnd_disabled"), { reply_markup: settingsMenu(lang) });
  } else {
    user.dnd = true;
    user.dndUntil = Date.now() + 8 * 3600000; // 8 hours
    await saveUser(env, user);
    await sendMessage(env, chatId, t(lang, "dnd_enabled"), { reply_markup: settingsMenu(lang) });
  }
}

async function handleVip(chatId, user, env) {
  const lang = user.lang || "fa";
  await sendMessage(env, chatId, t(lang, "vip_info"), { reply_markup: settingsMenu(lang) });
}

async function setVip(chatId, user, vipName, env) {
  const lang = user.lang || "fa";
  if (!/^[a-z0-9_]{3,20}$/.test(vipName)) {
    await sendMessage(env, chatId, t(lang, "vip_bad_format"));
    return;
  }
  const existing = await env.ANON_STORE.get(`vip:${vipName}`);
  if (existing && existing !== String(chatId)) {
    await sendMessage(env, chatId, t(lang, "vip_taken"));
    return;
  }
  if (user.vipUsername) await env.ANON_STORE.delete(`vip:${user.vipUsername}`);
  user.vipUsername = vipName;
  await env.ANON_STORE.put(`vip:${vipName}`, String(chatId));
  await saveUser(env, user);
  const me = await tgApi(env, "getMe", {});
  await sendMessage(env, chatId, t(lang, "vip_set", `https://t.me/${me.result.username}?start=${vipName}`));
}

async function addFilter(chatId, user, word, env) {
  const lang = user.lang || "fa";
  if (!word) { await sendMessage(env, chatId, t(lang, "filter_need_word")); return; }
  if (!user.filterWords.includes(word)) { user.filterWords.push(word); await saveUser(env, user); }
  await sendMessage(env, chatId, t(lang, "filter_added", word));
}

async function rmFilter(chatId, user, word, env) {
  const lang = user.lang || "fa";
  user.filterWords = user.filterWords.filter(w => w !== word);
  await saveUser(env, user);
  await sendMessage(env, chatId, t(lang, "filter_removed", word));
}

async function blockSender(chatId, user, senderId, env) {
  const lang = user.lang || "fa";
  if (!user.blocked.includes(senderId)) { user.blocked.push(senderId); await saveUser(env, user); }
  await sendMessage(env, chatId, t(lang, "sender_blocked"));
}

async function favMessage(chatId, user, msgId, env) {
  const lang = user.lang || "fa";
  if (!user.favorites.includes(msgId)) { user.favorites.push(msgId); await saveUser(env, user); }
  await sendMessage(env, chatId, t(lang, "msg_saved", msgId));
}

async function reportMessage(chatId, msgId, env, lang = "fa") {
  await sendMessage(env, chatId, t(lang, "report_submitted", msgId));
}
