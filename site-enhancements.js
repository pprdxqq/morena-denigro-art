/* Shared responsive interactions for Morena Denigro's portfolio. */
(function() {
const localePairs = window.morenaPhrasePairs || {};
const locales = { en: {}, lb: {} };
Object.keys(localePairs).forEach(function(key) { locales.en[key] = localePairs[key][0]; locales.lb[key] = localePairs[key][1]; });
let activeLanguage = "de";
try { const stored = localStorage.getItem("morena-language"); if (["de", "en", "lb"].includes(stored)) activeLanguage = stored; } catch (_) {}
window.morenaLanguage = activeLanguage;
document.documentElement.lang = activeLanguage;
const textSources = new WeakMap();
const attrSources = new WeakMap();
function translatePhrase(value) {
  const source = String(value == null ? "" : value), key = source.trim();
  if (activeLanguage === "de") return source;
  const dict = locales[activeLanguage] || {};
  const phraseKey = Object.keys(dict).find(function(candidate) { return candidate.trim() === key; });
  if (dict[key] || phraseKey) return source.replace(key, dict[key] || dict[phraseKey]);
  const prefix = "Printgröße für ";
  if (key.indexOf(prefix) === 0 && dict["Printgröße für"]) return source.replace(key, dict["Printgröße für"] + key.slice(prefix.length - 1));
  return source;
}
window.morenaT = translatePhrase;
function applyTranslations(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,noscript,svg,[data-no-translate]")) continue;
    if (!textSources.has(node)) textSources.set(node, node.nodeValue);
    const source = textSources.get(node);
    if (!source.trim()) { node.nodeValue = source; continue; }
    const leading = (source.match(/^\s*/) || [""])[0];
    const trailing = (source.match(/\s*$/) || [""])[0];
    const core = source.slice(leading.length, source.length - trailing.length);
    node.nodeValue = leading + translatePhrase(core) + trailing;
  }
  const elements = root.querySelectorAll ? root.querySelectorAll("[aria-label],[placeholder],[title],[alt]") : [];
  elements.forEach(function(el) {
    let originals = attrSources.get(el);
    if (!originals) { originals = {}; attrSources.set(el, originals); }
    ["aria-label", "placeholder", "title", "alt"].forEach(function(name) {
      if (!el.hasAttribute(name)) return;
      if (!(name in originals)) originals[name] = el.getAttribute(name);
      el.setAttribute(name, translatePhrase(originals[name]));
    });
  });
}
function installLoader() {
  const loader = document.createElement("div");
  loader.className = "site-loader is-visible"; loader.id = "site-loader"; loader.setAttribute("aria-hidden", "false");
  loader.innerHTML = '<div class="loader-lockup"><svg class="pencil-loader" viewBox="0 0 100 100" aria-hidden="true"><circle class="loader-track" cx="50" cy="50" r="34"/><circle class="loader-progress" cx="50" cy="50" r="34"/><g class="loader-pencil"><path class="pencil-body" d="M28 46h42v8H28z"/><path class="pencil-shaft" d="M28 46h28v8H28z"/><path class="pencil-tip" d="m20 50 8-4v8z"/><path class="pencil-eraser" d="M70 46h7a4 4 0 0 1 0 8h-7z"/><path class="pencil-detail" d="M64 46v8M68 46v8"/></g></svg><span class="loader-wordmark">MORENA <i>DENIGRO</i></span><span class="loader-caption">EIN AUGENBLICK BITTE</span></div>';
  document.body.prepend(loader); return loader;
}
const loader = installLoader();
function hideLoader() { loader.classList.remove("is-visible"); loader.setAttribute("aria-hidden", "true"); }
function showLoader() { loader.classList.add("is-visible"); loader.setAttribute("aria-hidden", "false"); clearTimeout(loader.hideTimer); loader.hideTimer = setTimeout(hideLoader, 720); }
function makeLanguageGate() {
  const gate = document.createElement("div"); gate.className = "language-gate"; gate.id = "language-gate"; gate.setAttribute("role", "dialog"); gate.setAttribute("aria-modal", "true"); gate.setAttribute("aria-hidden", "true"); gate.setAttribute("aria-labelledby", "language-title");
  gate.innerHTML = '<div class="language-panel glass"><span class="language-kicker">WILLKOMMEN IM ATELIER</span><span class="language-spark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2m0-14.2L4.9 19.1"/></svg></span><h2 id="language-title">Welche Sprache passt für dich?</h2><p class="language-intro">Du kannst die Sprache später jederzeit oben ändern.</p><form class="language-form" aria-label="Sprache wählen"><button class="language-choice" type="submit" name="language" value="de"><span class="language-code">DE</span><span>Deutsch</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button><button class="language-choice" type="submit" name="language" value="en"><span class="language-code">EN</span><span>English</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button><button class="language-choice" type="submit" name="language" value="lb"><span class="language-code">LB</span><span>Lëtzebuergesch</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></form><span class="language-footnote">MORENA DENIGRO · LUXEMBOURG</span></div>';
  document.body.append(gate); return gate;
}
const gate = makeLanguageGate();
const pageElements = Array.from(document.body.children).filter(function(el) { return el !== gate; });
let gateIsOpen = false;
function openGate() { gateIsOpen = true; gate.classList.add("is-open"); gate.setAttribute("aria-hidden", "false"); pageElements.forEach(function(el) { el.inert = true; }); setTimeout(function() { gate.querySelector(".language-choice")?.focus(); }, 80); }
function closeGate() { gateIsOpen = false; gate.classList.remove("is-open"); gate.setAttribute("aria-hidden", "true"); pageElements.forEach(function(el) { el.inert = false; }); }
function updateThemeSwitch() {
  const toggle = document.querySelector(".appearance-toggle"); if (!toggle) return;
  const dark = document.documentElement.dataset.theme === "dark";
  const label = toggle.querySelector(".theme-label"); if (label) label.textContent = dark ? "Hell" : "Dunkel";
  toggle.setAttribute("aria-label", translatePhrase(dark ? "Dunkel" : "Hell")); toggle.setAttribute("aria-pressed", String(dark));
}
function setLanguage(code, persist) {
  if (!["de", "en", "lb"].includes(code)) return;
  activeLanguage = code; window.morenaLanguage = code; document.documentElement.lang = code;
  try { if (persist !== false) localStorage.setItem("morena-language", code); } catch (_) {}
  applyTranslations(document.documentElement);
  const label = document.querySelector(".language-open-label"); if (label) label.textContent = code.toUpperCase();
  if (typeof renderGrids === "function") renderGrids();
  if (typeof renderCart === "function") renderCart();
  closeGate(); updateThemeSwitch();
}
gate.addEventListener("submit", function(e) { e.preventDefault(); setLanguage(e.submitter && e.submitter.value, true); });
const themeToggle = document.querySelector(".appearance-toggle");
if (themeToggle) {
  themeToggle.innerHTML = '<span class="theme-switch-shell"><svg class="theme-sun" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19m0-14-1.5 1.5m-11 11L5 19"/></svg><svg class="theme-moon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/></svg><span class="theme-switch-thumb"></span></span><span class="theme-label sr-only"></span>';
  themeToggle.addEventListener("click", function() { requestAnimationFrame(updateThemeSwitch); });
}
const actions = document.querySelector(".header-actions");
if (actions) {
  const languageButton = document.createElement("button"); languageButton.className = "language-open glass-button"; languageButton.type = "button"; languageButton.setAttribute("aria-label", "Sprache ändern");
  languageButton.innerHTML = '<svg class="language-globe" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><span class="language-open-label">' + activeLanguage.toUpperCase() + '</span>';
  const theme = actions.querySelector(".appearance-toggle"); if (theme) actions.insertBefore(languageButton, theme.nextSibling); else actions.prepend(languageButton);
  languageButton.addEventListener("click", openGate);
}
const makeGermanCard = makeCard;
makeCard = function(w, mode) {
  const html = makeGermanCard(w, mode), start = html.indexOf('<a class="art-image"'), end = start < 0 ? -1 : html.indexOf("</a>", start) + 4;
  if (start < 0 || end < 4) return html;
  const id = "art-story-" + w.id, story = (window.morenaStories || {})[w.id] || "Die Farben der Website verbinden sich mit einem Augenblick voller Spiegelungen und Ruhe.";
  const image = html.slice(start, end);
  const front = '<div class="art-face art-face-front" aria-hidden="false">' + image + '<button class="art-flip-trigger" type="button" data-art-flip aria-expanded="false" aria-controls="' + id + '"><span>Geschichte</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5A7 7 0 0 0 18.4 15"/></svg></button></div>';
  const back = '<div class="art-face art-face-back" id="' + id + '" aria-hidden="true"><div class="art-story-copy"><span class="art-story-kicker">HINTER DEM WERK</span><h3>' + w.title + '</h3><p>' + story + '</p><span class="art-story-series">' + w.series.toUpperCase() + ' · ' + (w.year || "2026") + '</span></div><button class="art-flip-trigger art-flip-return" type="button" data-art-flip aria-expanded="true" aria-controls="' + id + '"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 12H5m6 6-6-6 6-6"/></svg><span>Zurück zum Bild</span></button></div>';
  return html.slice(0, start) + '<div class="art-flip-card" data-flip-card><div class="art-flip-inner">' + front + back + '</div></div>' + html.slice(end);
};

// Tinder-inspired artwork browsing: swipe to browse only, never to vote.
let swipeGrid = null, swipeCards = [], swipeIndex = 0, swipeCurrentTitle = "";
let swipeAnimating = false, swipeDrag = null, suppressImageClickUntil = 0;
function resetArtworkFlip(card) {
  if (!card) return;
  card.classList.remove("is-flipped");
  card.querySelector(".art-face-front")?.setAttribute("aria-hidden", "false");
  card.querySelector(".art-face-back")?.setAttribute("aria-hidden", "true");
  card.querySelectorAll("[data-art-flip]").forEach(function(button) {
    button.setAttribute("aria-expanded", "false");
  });
}
function paintArtworkDeck() {
  if (!swipeGrid) return;
  swipeCards = Array.from(swipeGrid.querySelectorAll(".art-card"));
  const count = swipeCards.length;
  swipeCards.forEach(function(card, index) {
    card.classList.remove("is-swipe-active", "is-swipe-next", "is-swipe-next-two", "is-swipe-hidden", "is-swipe-away-left", "is-swipe-away-right", "is-swipe-dragging");
    card.style.removeProperty("--swipe-x");
    card.style.removeProperty("--swipe-rotation");
    const distance = count ? (index - swipeIndex + count) % count : 0;
    if (distance === 0) {
      card.classList.add("is-swipe-active");
      card.setAttribute("aria-hidden", "false");
      card.inert = false;
      swipeCurrentTitle = card.querySelector(".art-info h3")?.textContent || "";
    } else {
      card.setAttribute("aria-hidden", "true");
      card.inert = true;
      if (distance === 1) card.classList.add("is-swipe-next");
      else if (distance === 2) card.classList.add("is-swipe-next-two");
      else card.classList.add("is-swipe-hidden");
    }
  });
  const status = document.querySelector("[data-swipe-status]");
  if (status) status.textContent = count ? String(swipeIndex + 1).padStart(2, "0") + " / " + String(count).padStart(2, "0") : "00 / 00";
  document.querySelectorAll("[data-swipe-prev], [data-swipe-next]").forEach(function(button) { button.disabled = count < 2; });
}
function moveArtworkDeck(direction) {
  const count = swipeCards.length;
  if (!count || count < 2 || swipeAnimating) return;
  const outgoing = swipeCards[swipeIndex];
  const nextIndex = (swipeIndex + direction + count) % count;
  resetArtworkFlip(outgoing);
  resetArtworkFlip(swipeCards[nextIndex]);
  outgoing.style.removeProperty("--swipe-x");
  outgoing.style.removeProperty("--swipe-rotation");
  outgoing.classList.remove("is-swipe-dragging");
  outgoing.classList.add(direction > 0 ? "is-swipe-away-left" : "is-swipe-away-right");
  swipeAnimating = true;
  window.setTimeout(function() {
    outgoing.classList.remove("is-swipe-away-left", "is-swipe-away-right");
    swipeIndex = nextIndex;
    swipeAnimating = false;
    paintArtworkDeck();
  }, 360);
}
function setupArtworkSwiper() {
  const grid = document.querySelector(".gallery-grid[data-art-grid='all']");
  if (!grid) return;
  const previousTitle = swipeCurrentTitle;
  swipeGrid = grid;
  grid.dataset.swipeDeck = "true";
  grid.setAttribute("aria-label", "Swipe-Galerie der Kunstwerke. Ziehe auf einem Bild nach links oder rechts.");
  swipeCards = Array.from(grid.querySelectorAll(".art-card"));
  if (!grid.dataset.swipeBound) {
    grid.dataset.swipeBound = "true";
    grid.addEventListener("pointerdown", function(event) {
      const face = event.target.closest(".art-flip-card");
      if (!face || !grid.contains(face) || !face.closest(".art-card")?.classList.contains("is-swipe-active")) return;
      if (event.target.closest("button, input, select, textarea, [data-art-flip]")) return;
      if (swipeAnimating) return;
      swipeDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, card: face.closest(".art-card"), grid: grid, moved: false };
    });
    grid.addEventListener("keydown", function(event) {
      if (event.target.closest("button, a, input, select, textarea")) return;
      if (event.key === "ArrowRight") { event.preventDefault(); moveArtworkDeck(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); moveArtworkDeck(-1); }
    });
  }
  if (swipeCards.length) {
    const preserved = previousTitle ? swipeCards.findIndex(function(card) { return card.querySelector(".art-info h3")?.textContent === previousTitle; }) : -1;
    swipeIndex = preserved >= 0 ? preserved : 0;
  } else swipeIndex = 0;
  paintArtworkDeck();
}
document.addEventListener("pointermove", function(event) {
  if (!swipeDrag || event.pointerId !== swipeDrag.pointerId) return;
  const dx = event.clientX - swipeDrag.x, dy = event.clientY - swipeDrag.y;
  if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.15) return;
  if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy) * 1.05) {
    swipeDrag.moved = true;
    swipeDrag.card.classList.add("is-swipe-dragging");
    swipeDrag.card.style.setProperty("--swipe-x", dx + "px");
    const width = swipeDrag.grid.clientWidth || 1;
    swipeDrag.card.style.setProperty("--swipe-rotation", Math.max(-12, Math.min(12, dx / width * 12)) + "deg");
    event.preventDefault();
  }
}, { passive: false });
document.addEventListener("pointerup", function(event) {
  if (!swipeDrag || event.pointerId !== swipeDrag.pointerId) return;
  const drag = swipeDrag;
  swipeDrag = null;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  drag.card.classList.remove("is-swipe-dragging");
  if (drag.moved && Math.abs(dx) > Math.max(58, drag.grid.clientWidth * 0.16) && Math.abs(dx) > Math.abs(dy) * 1.2) {
    suppressImageClickUntil = performance.now() + 500;
    drag.card.style.removeProperty("--swipe-x");
    drag.card.style.removeProperty("--swipe-rotation");
    moveArtworkDeck(dx < 0 ? 1 : -1);
  } else {
    drag.card.style.removeProperty("--swipe-x");
    drag.card.style.removeProperty("--swipe-rotation");
  }
});
document.addEventListener("pointercancel", function() {
  if (!swipeDrag) return;
  swipeDrag.card.classList.remove("is-swipe-dragging");
  swipeDrag.card.style.removeProperty("--swipe-x");
  swipeDrag.card.style.removeProperty("--swipe-rotation");
  swipeDrag = null;
});
document.addEventListener("click", function(event) {
  if (performance.now() > suppressImageClickUntil) return;
  if (event.target.closest(".gallery-grid[data-swipe-deck='true'] .art-image")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressImageClickUntil = 0;
  }
}, true);

const oldRenderGrids = renderGrids;
renderGrids = function() { oldRenderGrids(); document.querySelectorAll("[data-art-grid]").forEach(applyTranslations); setupArtworkSwiper(); };
const oldRenderCart = renderCart;
renderCart = function() { oldRenderCart(); applyTranslations(document.querySelector(".cart-content")); };
const oldToast = toast;
toast = function(message) { oldToast(translatePhrase(message)); };
document.addEventListener("click", function(e) {
  const swipePrev = e.target.closest("[data-swipe-prev]");
  if (swipePrev) { e.preventDefault(); moveArtworkDeck(-1); return; }
  const swipeNext = e.target.closest("[data-swipe-next]");
  if (swipeNext) { e.preventDefault(); moveArtworkDeck(1); return; }
  const flip = e.target.closest("[data-art-flip]");
  if (flip) { const card = flip.closest("[data-flip-card]"); if (card) { const open = card.classList.toggle("is-flipped"); card.querySelector(".art-face-front")?.setAttribute("aria-hidden", String(open)); card.querySelector(".art-face-back")?.setAttribute("aria-hidden", String(!open)); card.querySelectorAll("[data-art-flip]").forEach(function(b) { b.setAttribute("aria-expanded", String(open)); }); } }
  const menu = e.target.closest(".menu-toggle"); if (menu) setTimeout(function() { const open = document.querySelector(".site-header nav")?.classList.contains("open"); menu.setAttribute("aria-expanded", String(!!open)); menu.setAttribute("aria-label", translatePhrase(open ? "Menü schließen" : "Menü öffnen")); }, 0);
  const toggle = e.target.closest("[data-contact-toggle]"); if (toggle) { const card = toggle.closest(".direct-contact"), open = card.classList.toggle("is-open"); toggle.setAttribute("aria-expanded", String(open)); card.querySelector(".direct-contact-panel").hidden = !open; }
  const close = e.target.closest("[data-contact-close]"); if (close) { const card = close.closest(".direct-contact"); card.classList.remove("is-open"); card.querySelector("[data-contact-toggle]").setAttribute("aria-expanded", "false"); card.querySelector(".direct-contact-panel").hidden = true; }
  if (!e.target.closest(".direct-contact")) { const card = document.querySelector(".direct-contact.is-open"); if (card) { card.classList.remove("is-open"); card.querySelector("[data-contact-toggle]").setAttribute("aria-expanded", "false"); card.querySelector(".direct-contact-panel").hidden = true; } }
}, true);
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && gateIsOpen) { let saved = false; try { saved = !!localStorage.getItem("morena-language"); } catch (_) {} if (saved) closeGate(); }
  if (e.key === "Escape") { const card = document.querySelector(".direct-contact.is-open"); if (card) { card.classList.remove("is-open"); card.querySelector("[data-contact-toggle]").setAttribute("aria-expanded", "false"); card.querySelector(".direct-contact-panel").hidden = true; } }
});
function addContactCard() {
  const card = document.createElement("aside"); card.className = "direct-contact";
  card.innerHTML = '<button class="direct-contact-pill glass" type="button" data-contact-toggle aria-expanded="false" aria-controls="direct-contact-panel"><span class="contact-status-dot"></span><span>Kontakt</span><svg class="contact-card-chevron" aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></button><div class="direct-contact-panel glass" id="direct-contact-panel" hidden><div class="direct-contact-heading"><img src="bilder/portrait.jpg" alt="Morena Denigro" loading="lazy"><div><span class="direct-contact-eyebrow">MORENA / DIREKT</span><h2>Morena Denigro</h2><p>Künstlerin · Luxemburg</p></div><button class="contact-panel-close" type="button" data-contact-close aria-label="Kontaktkarte schließen"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="direct-contact-note"><span class="contact-status-dot"></span><span>Jetzt erreichbar</span></div><a class="direct-contact-link" href="tel:+352621540469"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4h4l2 5-3 2a14 14 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2C10 20 4 14 3 6a2 2 0 0 1 2-2Z"/></svg><span>+352 621 540 469</span><svg class="contact-card-arrow" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg></a><a class="direct-contact-link" href="mailto:morenadenigro@gmail.com"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg><span>morenadenigro@gmail.com</span><svg class="contact-card-arrow" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg></a><span class="direct-contact-signature">MORENA DENIGRO · LUXEMBOURG</span></div>';
  document.body.append(card); applyTranslations(card);
}
addContactCard();
if (location.pathname.endsWith("shop.html")) { if (location.hash === "#originals") shopTab = "originals"; if (location.hash === "#prints") shopTab = "prints"; document.querySelectorAll("[data-shop-tab]").forEach(function(b) { b.classList.toggle("active", b.dataset.shopTab === shopTab); }); }
if (new URLSearchParams(location.search).get("topic") === "custom") { const custom = document.querySelector("[data-custom-topic]"); if (custom) custom.selected = true; }
renderGrids(); renderCart(); applyTranslations(document.documentElement); updateThemeSwitch();
const startTime = performance.now();
function promptForLanguage() { let saved = false; try { saved = !!localStorage.getItem("morena-language"); } catch (_) {} hideLoader(); if (!saved) openGate(); }
window.addEventListener("load", function() { setTimeout(promptForLanguage, Math.max(0, 650 - (performance.now() - startTime))); }, { once: true });
setTimeout(promptForLanguage, 2200);
window.addEventListener("pageshow", function(e) { if (e.persisted) hideLoader(); });
document.addEventListener("click", function(e) { const link = e.target.closest("a[href]"); if (!link || e.defaultPrevented || link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; try { const target = new URL(link.href, location.href); if (target.origin === location.origin && target.pathname !== location.pathname && /\.html?$/.test(target.pathname)) showLoader(); } catch (_) {} }, true);
document.querySelectorAll(".newsletter-form,.contact-form").forEach(function(form) { form.addEventListener("submit", function() { setTimeout(function() { applyTranslations(form); }, 0); }); });
})();
