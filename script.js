// ============================================================
// Language toggle: every translatable node carries data-en / data-yo.
// Switching writes the right copy into the node and remembers the
// choice (per browser) so it holds across pages.
// ============================================================
(function () {
  const STORAGE_KEY = "site-lang";

  function applyLang(lang) {
    document.querySelectorAll("[data-en]").forEach((el) => {
      const text = lang === "yo" ? (el.getAttribute("data-yo") || el.getAttribute("data-en")) : el.getAttribute("data-en");
      el.textContent = text;
    });
    document.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
    document.documentElement.setAttribute("lang", lang === "yo" ? "yo" : "en");
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    window.__currentLang = lang;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.querySelectorAll(".speak-btn").forEach((b) => b.classList.remove("speaking"));
  }

  function initLangToggle() {
    let saved = "en";
    try { saved = localStorage.getItem(STORAGE_KEY) || "en"; } catch (e) {}
    document.querySelectorAll(".lang-toggle").forEach((toggle) => {
      toggle.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => applyLang(btn.dataset.lang));
      });
    });
    applyLang(saved);
  }

  // ---------- Read-aloud (Web Speech API) ----------
  // Yoruba voices are rare in most browsers; we still set the
  // utterance language so a browser that has one will use it,
  // and fall back gracefully otherwise.
  function pickVoice(lang) {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (!voices.length) return null;
    const wanted = lang === "yo" ? "yo" : "en";
    return voices.find((v) => v.lang.toLowerCase().startsWith(wanted)) ||
           (wanted === "yo" ? voices.find((v) => v.lang.toLowerCase().startsWith("en")) : null);
  }

  function initSpeakButtons() {
    if (!("speechSynthesis" in window)) {
      document.querySelectorAll(".speak-btn").forEach((b) => (b.style.display = "none"));
      return;
    }
    document.querySelectorAll(".speak-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetSel = btn.getAttribute("data-target");
        const scope = targetSel ? document.querySelector(targetSel) : document.body;
        if (!scope) return;

        if (btn.classList.contains("speaking")) {
          window.speechSynthesis.cancel();
          btn.classList.remove("speaking");
          return;
        }
        window.speechSynthesis.cancel();

        const lang = window.__currentLang || "en";
        const nodes = scope.querySelectorAll("[data-en]");
        const parts = [];
        nodes.forEach((n) => {
          const t = n.textContent.trim();
          if (t) parts.push(t);
        });
        const text = parts.length ? parts.join(". ") : scope.textContent.trim();
        if (!text) return;

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang === "yo" ? "yo-NG" : "en-US";
        const voice = pickVoice(lang);
        if (voice) utter.voice = voice;
        utter.rate = 0.95;

        utter.onend = () => btn.classList.remove("speaking");
        utter.onerror = () => btn.classList.remove("speaking");
        btn.classList.add("speaking");
        window.speechSynthesis.speak(utter);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLangToggle();
    initSpeakButtons();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  });
})();
