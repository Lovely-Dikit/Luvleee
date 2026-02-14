// /script.js
/**
 * Valentine Card Garden
 * - 7 flip cards
 * - clicking a card opens a centered modal: bigger flower + full message
 * - theme toggle, WebAudio ambient toggle
 */
(() => {
  const $ = (sel) => document.querySelector(sel);

  const grid = $("#grid");
  const btnTheme = $("#btnTheme");
  const btnAudio = $("#btnAudio");
  const btnReset = $("#btnReset");

  const modal = $("#modal");
  const modalBackdrop = $("#modalBackdrop");
  const btnClose = $("#btnClose");
  const btnAgain = $("#btnAgain");
  const modalCardLabel = $("#modalCardLabel");
  const modalReveal = $("#modalReveal");
  const modalMsg = $("#modalMsg");

  const STORAGE_THEME = "cg_theme";
  const STORAGE_AUDIO = "cg_audio";

  const state = {
    theme: "pastel",
    audioOn: false,
    audio: null,
    lastFocusEl: null,
  };

const MESSAGES = [
  "In this lifetime and the next 12 reincarnations, I would still choose you as my best friend. No refunds. 💖",
  "If anyone hurts you, I will become the dramatic background music in their downfall arc. 🎻✨",
  "You are not just a friend. You are a whole emotionally significant subplot. 📖💞",
  "When historians study greatness, they will find you. And I’ll be in the footnotes screaming ‘THAT’S MY FRIEND.’ 🫶",
  "Your existence alone has raised the global serotonin average. You’re welcome, world. 🌍💗",
  "If life was a dramatic slow-motion scene, you’d be walking in with wind in your hair and sparkles behind you. ✨",
  "You deserve love, loyalty, good lighting, and unlimited snacks. In that order. 💅🍿",
  "If being iconic was a crime, you’d be serving a life sentence. 💖🚨",
  "Even on your worst day, you’re still someone’s favorite person. (Spoiler: it’s me.) 💞",
  "You don’t just glow. You radiate ‘main character who wins in the final episode’ energy. 🌸🔥",
  "I would write a 200-chapter epic about how cool you are. And yes, it would have fan art. 🎨💘",
  "If friendship had a leaderboard, you’d be permanently pinned at #1. No competition. 🏆✨",
  "You are the plot twist that made my life better. 💗",
  "Should the world ever doubt you, I will appear dramatically and object. LOUDLY. 🎤💥",
  "In case no one told you today: you are dangerously lovable and I fully support it. 💞"
];

  const CARD_META = [
    { label: "Card 1", icon: "💌", flowerId: "peony" },
    { label: "Card 2", icon: "🎀", flowerId: "tulip" },
    { label: "Card 3", icon: "✨", flowerId: "daisy" },
    { label: "Card 4", icon: "🍓", flowerId: "rose" },
    { label: "Card 5", icon: "🌙", flowerId: "lavender" },
    { label: "Card 6", icon: "🫧", flowerId: "sunflower" },
    { label: "Card 7", icon: "💗", flowerId: "lotus" },
  ];

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function safeText(s) {
    return String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
  }

  function loadPrefs() {
    const savedTheme = localStorage.getItem(STORAGE_THEME);
    if (savedTheme === "dark" || savedTheme === "pastel") state.theme = savedTheme;

    const savedAudio = localStorage.getItem(STORAGE_AUDIO);
    state.audioOn = savedAudio === "on";
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme === "dark" ? "dark" : "pastel";
    btnTheme.querySelector(".btn__icon").textContent = state.theme === "dark" ? "🌸" : "🌙";
  }

  function setAudioButton() {
    btnAudio.querySelector(".btn__icon").textContent = state.audioOn ? "🔊" : "🔈";
  }

  function renderCards() {
    grid.innerHTML = "";
    for (let i = 0; i < CARD_META.length; i++) {
      const meta = CARD_META[i];
      const el = document.createElement("div");
      el.className = "card3d";
      el.innerHTML = `
        <div class="card" role="button" tabindex="0" aria-label="${safeText(meta.label)}">
          <div class="face front">
            <div class="front__inner">
              <div class="front__badge">${safeText(meta.label)}</div>
              <div class="front__icon" aria-hidden="true">${safeText(meta.icon)}</div>
              <div class="front__hint">tap to reveal</div>
            </div>
          </div>
          <div class="face back">
            <div class="reveal" data-flower="${safeText(meta.flowerId)}"></div>
            <div class="msg">—</div>
          </div>
        </div>
      `;
      grid.appendChild(el);
    }
  }

  function flowerSvg(type) {
    const commonSparkles = `
      <g class="spark" style="--d: 0ms"><circle cx="20" cy="26" r="2.6" fill="rgba(255,255,255,0.9)"/></g>
      <g class="spark" style="--d: 220ms"><circle cx="92" cy="32" r="2.2" fill="rgba(255,255,255,0.8)"/></g>
      <g class="spark" style="--d: 460ms"><circle cx="30" cy="88" r="2.4" fill="rgba(255,255,255,0.75)"/></g>
    `;

    const stem = `
      <path d="M56 98 C56 84, 58 76, 60 68" stroke="rgba(60,150,110,0.95)" stroke-width="6" stroke-linecap="round"/>
      <path d="M58 80 C48 76, 42 70, 40 64" stroke="rgba(60,150,110,0.85)" stroke-width="5" stroke-linecap="round"/>
      <path d="M56 82 C67 80, 74 74, 78 66" stroke="rgba(60,150,110,0.78)" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="43" cy="64" rx="10" ry="6" fill="rgba(120,220,170,0.65)"/>
      <ellipse cx="79" cy="66" rx="10" ry="6" fill="rgba(120,220,170,0.58)"/>
    `;

    const wrap = (inner, bgA, bgB) => `
      <svg class="flowerSvg" viewBox="0 0 112 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="g" cx="35%" cy="28%">
            <stop offset="0%" stop-color="${bgA}"/>
            <stop offset="100%" stop-color="${bgB}"/>
          </radialGradient>
        </defs>
        <circle cx="56" cy="56" r="52" fill="url(#g)" opacity="0.8"/>
        ${commonSparkles}
        <g class="fWrap">
          ${stem}
          <g class="fBloom">${inner}</g>
        </g>
      </svg>
    `;

    switch (type) {
      case "peony":
        return wrap(
          `
          <g transform="translate(0,2)">
            <circle cx="56" cy="52" r="10" fill="#ffd7ea"/>
            <g opacity="0.98">
              <ellipse cx="56" cy="40" rx="14" ry="10" fill="#ff8fc5"/>
              <ellipse cx="44" cy="48" rx="14" ry="10" fill="#ff9fd0"/>
              <ellipse cx="68" cy="48" rx="14" ry="10" fill="#ff9fd0"/>
              <ellipse cx="48" cy="62" rx="14" ry="10" fill="#ff7fbe"/>
              <ellipse cx="64" cy="62" rx="14" ry="10" fill="#ff7fbe"/>
              <ellipse cx="56" cy="68" rx="14" ry="10" fill="#ff67b3"/>
            </g>
            <circle cx="56" cy="52" r="7" fill="#fff2a8" opacity="0.95"/>
          </g>
          `,
          "rgba(255,210,230,0.9)",
          "rgba(255,160,200,0.35)"
        );
      case "tulip":
        return wrap(
          `
          <g transform="translate(0,2)">
            <path d="M56 30 C46 38, 42 50, 46 62 C52 72, 60 72, 66 62 C70 50, 66 38, 56 30Z" fill="#ff7fb5"/>
            <path d="M56 30 C52 40, 52 50, 56 60 C60 50, 60 40, 56 30Z" fill="#ff5fa2" opacity="0.85"/>
            <path d="M46 62 C54 56, 58 56, 66 62" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round"/>
          </g>
          `,
          "rgba(255,225,242,0.9)",
          "rgba(170,220,255,0.35)"
        );
      case "daisy":
        return wrap(
          `
          <g transform="translate(0,0)">
            <g>
              ${Array.from({ length: 10 }).map((_, i) => {
                const a = (i * 360) / 10;
                return `<ellipse cx="56" cy="46" rx="7" ry="16" fill="#ffffff" opacity="0.95" transform="rotate(${a} 56 56) translate(0 8)"/>`;
              }).join("")}
            </g>
            <circle cx="56" cy="56" r="12" fill="#ffe27a"/>
            <circle cx="56" cy="56" r="6" fill="#ffbf3f" opacity="0.9"/>
          </g>
          `,
          "rgba(255,250,220,0.9)",
          "rgba(190,170,255,0.35)"
        );
      case "rose":
        return wrap(
          `
          <g transform="translate(0,2)">
            <path d="M56 34 C44 36, 40 48, 46 58 C52 68, 64 68, 70 58 C76 48, 68 36, 56 34Z" fill="#ff4b7d"/>
            <path d="M56 38 C50 42, 50 50, 56 54 C62 50, 62 42, 56 38Z" fill="#ff87b0" opacity="0.9"/>
            <path d="M56 54 C50 56, 48 62, 52 66 C56 70, 64 68, 66 62 C68 56, 62 52, 56 54Z" fill="#ff2f6f" opacity="0.9"/>
            <circle cx="56" cy="52" r="5.5" fill="#fff2a8" opacity="0.95"/>
          </g>
          `,
          "rgba(255,200,220,0.85)",
          "rgba(255,120,160,0.3)"
        );
      case "lavender":
        return wrap(
          `
          <g transform="translate(0,2)">
            ${Array.from({ length: 7 }).map((_, i) => {
              const y = 30 + i * 6;
              const x = 56 + (i % 2 === 0 ? -2 : 2);
              return `<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="rgba(190,130,255,0.92)"/>`;
            }).join("")}
            <ellipse cx="56" cy="72" rx="7" ry="4" fill="rgba(190,130,255,0.72)"/>
          </g>
          `,
          "rgba(230,210,255,0.85)",
          "rgba(150,210,255,0.28)"
        );
      case "sunflower":
        return wrap(
          `
          <g transform="translate(0,2)">
            ${Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 360) / 12;
              return `<ellipse cx="56" cy="44" rx="6" ry="18" fill="#ffd15a" opacity="0.95" transform="rotate(${a} 56 56) translate(0 10)"/>`;
            }).join("")}
            <circle cx="56" cy="56" r="14" fill="#6b3d2a" opacity="0.9"/>
            <circle cx="56" cy="56" r="9" fill="#8a4b32" opacity="0.9"/>
            <circle cx="56" cy="56" r="4.5" fill="#ffd15a" opacity="0.9"/>
          </g>
          `,
          "rgba(255,240,190,0.9)",
          "rgba(255,170,90,0.26)"
        );
      case "lotus":
      default:
        return wrap(
          `
          <g transform="translate(0,2)">
            <ellipse cx="56" cy="60" rx="14" ry="10" fill="rgba(255,170,215,0.92)"/>
            <path d="M56 30 C48 42, 48 52, 56 62 C64 52, 64 42, 56 30Z" fill="rgba(255,120,190,0.95)"/>
            <path d="M40 44 C42 56, 48 64, 56 68 C48 62, 42 54, 40 44Z" fill="rgba(255,160,220,0.9)"/>
            <path d="M72 44 C70 56, 64 64, 56 68 C64 62, 70 54, 72 44Z" fill="rgba(255,160,220,0.9)"/>
            <circle cx="56" cy="56" r="5.5" fill="#fff2a8" opacity="0.95"/>
          </g>
          `,
          "rgba(210,240,255,0.85)",
          "rgba(255,170,230,0.28)"
        );
    }
  }

  function openModal({ cardLabel, flowerType, message }) {
    state.lastFocusEl = document.activeElement;

    modalCardLabel.textContent = cardLabel;
    modalReveal.innerHTML = flowerSvg(flowerType);
    modalMsg.textContent = message;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    btnClose.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (state.lastFocusEl && typeof state.lastFocusEl.focus === "function") {
      state.lastFocusEl.focus();
    }
  }

  function revealIntoCard(cardEl, flowerType, message) {
    const reveal = cardEl.querySelector(".reveal");
    const msg = cardEl.querySelector(".msg");
    reveal.innerHTML = flowerSvg(flowerType);
    msg.textContent = message;
  }

  function flipAndShow(cardEl, meta) {
    if (cardEl.classList.contains("is-flipped")) return;

    cardEl.classList.add("is-flipped");

    const message = pickRandom(MESSAGES);
    const flowerType = meta.flowerId;

    revealIntoCard(cardEl, flowerType, message);

    // Let the flip feel “real”, then show centered reveal.
    window.setTimeout(() => {
      openModal({ cardLabel: meta.label, flowerType, message });
    }, 420);
  }

  function wireCardEvents() {
    const cards = Array.from(document.querySelectorAll(".card"));
    cards.forEach((c, idx) => {
      const meta = CARD_META[idx];
      c.addEventListener("click", () => flipAndShow(c, meta));
      c.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          flipAndShow(c, meta);
        }
      });
    });
  }

  function resetAll() {
    const cards = Array.from(document.querySelectorAll(".card"));
    cards.forEach((c) => {
      c.classList.remove("is-flipped");
      const reveal = c.querySelector(".reveal");
      const msg = c.querySelector(".msg");
      reveal.innerHTML = "";
      msg.textContent = "—";
    });
    closeModal();
  }

  // ---- WebAudio ambient (soft pad) ----
  function createAmbientAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();

    const master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;
    filter.connect(master);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "triangle";

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g1.gain.value = 0.22;
    g2.gain.value = 0.16;

    osc1.frequency.value = 196; // G3
    osc2.frequency.value = 196.7;

    osc1.connect(g1); g1.connect(filter);
    osc2.connect(g2); g2.connect(filter);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.18;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.06;

    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);

    const lfo2 = ctx.createOscillator();
    lfo2.type = "sine";
    lfo2.frequency.value = 0.07;

    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 140;

    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(filter.frequency);

    osc1.start();
    osc2.start();
    lfo.start();
    lfo2.start();

    return {
      ctx,
      master,
      setOn(on) {
        const t = ctx.currentTime;
        if (on) {
          master.gain.cancelScheduledValues(t);
          master.gain.setValueAtTime(master.gain.value, t);
          master.gain.linearRampToValueAtTime(0.22, t + 0.35);
        } else {
          master.gain.cancelScheduledValues(t);
          master.gain.setValueAtTime(master.gain.value, t);
          master.gain.linearRampToValueAtTime(0.0, t + 0.25);
        }
      },
      async ensureRunning() {
        if (ctx.state !== "running") await ctx.resume();
      },
    };
  }

  async function toggleAudio() {
    state.audioOn = !state.audioOn;
    localStorage.setItem(STORAGE_AUDIO, state.audioOn ? "on" : "off");
    setAudioButton();

    if (!state.audio) state.audio = createAmbientAudio();
    await state.audio.ensureRunning();
    state.audio.setOn(state.audioOn);
  }

  function toggleTheme() {
    state.theme = state.theme === "dark" ? "pastel" : "dark";
    localStorage.setItem(STORAGE_THEME, state.theme);
    applyTheme();
  }

  function wireModalEvents() {
    btnClose.addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", closeModal);
    btnAgain.addEventListener("click", resetAll);

    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeModal();
    });
  }

  async function init() {
    loadPrefs();
    applyTheme();
    setAudioButton();
    renderCards();
    wireCardEvents();
    wireModalEvents();

    btnTheme.addEventListener("click", toggleTheme);
    btnReset.addEventListener("click", resetAll);
    btnAudio.addEventListener("click", toggleAudio);

    if (state.audioOn) setAudioButton();
  }

  init();
})();
