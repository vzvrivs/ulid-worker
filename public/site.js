
// ------------------------------------------------------------------
//  NAVBAR loader  (CSS  ➜  HTML  ➜  JS module)
// ------------------------------------------------------------------
async function loadNavbar() {
  const container = document.getElementById("nav-container");
  if (!container) return;

  try {
    /* 1) charge le CSS avant d'injecter le HTML */
    //await loadCSS("./navbar.css");

    /* 2) injecte le HTML */
    const html = await fetch("/navbar.html").then(r => r.text());
    container.innerHTML = html;

    /* 3) importe le module et initialise */
    const { initNavbar } = await import("/navbar.js");
    initNavbar();
    container.classList.add("js-ready");
  }
  catch (e) {
    console.error("navbar:", e);
    container.innerHTML = "<p style='color:red'>⚠️ Navbar KO</p>";
  }
}

// Utilitaire pour injecter un CSS
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    l.onload  = () => resolve();
    l.onerror = () => reject();
    document.head.append(l);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadNavbar);
} else {
  /* Chargement dynamique de la navbar */
  loadNavbar();
}



// --- début du bloc PJAX ---
/**
 * Charge en AJAX la nouvelle page, extrait son contenu principal,
 * met à jour l'historique sans recharger la navbar.
 */
/*async function pjaxNavigate(url, addToHistory = true) {
  try {
    const res = await fetch(url, { headers: { 'X-PJAX': 'true' } });
    if (!res.ok) throw new Error(res.statusText);
    const text = await res.text();
    const tmp = document.createElement('div');
    tmp.innerHTML = text;

    // 1. Remplace le contenu de <main class="page-wrapper">
    const newMain = tmp.querySelector('main.page-wrapper');
    if (newMain) {
      document.querySelector('main.page-wrapper').replaceWith(newMain);
    }

    // 2. Met à jour le <title>
    const newTitle = tmp.querySelector('title')?.innerText;
    if (newTitle) document.title = newTitle;

    // 3. Ré-initialise les scripts spécifiques à la page
    //    (timestamp UI, move buttons, etc.)
    initTimestampUI && (window.getGenTsParam = initTimestampUI("gen"));
    initTimestampUI && (window.getAutofillTsParam = initTimestampUI("autofill"));
    updateMoveButtons && updateMoveButtons("gen-keys");
    updateMoveButtons && updateMoveButtons("autofill-keys");
    // ... et toutes tes autres initXxx() …

    // 4. Met à jour l'historique
    if (addToHistory) {
      history.pushState(null, newTitle || '', url);
    }
  } catch (err) {
    console.error("PJAX navigation failed:", err);
    window.location.href = url; // fallback : rechargement normal
  }
}

// Intercepte les clicks sur les liens internes
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a || a.target === "_blank" || a.hasAttribute('download')) return;
  const origin = window.location.origin;
  if (a.href.startsWith(origin)) {
    e.preventDefault();
    pjaxNavigate(a.href);
  }
});

// Gère le back/forward
window.addEventListener('popstate', () => {
  pjaxNavigate(window.location.href, false);
});*/
// --- fin du bloc PJAX ---
