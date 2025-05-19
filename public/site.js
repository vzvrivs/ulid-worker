// ------------------------------------------------------------------
//  Gestion dynamique des thèmes (clair/sombre/auto + multi-thèmes)
// ------------------------------------------------------------------

  // 1. Lis les préférences stockées par la page de choix de thème
  function getThemeOptions() {
    return {
      mode:       localStorage.getItem("ulidw-theme-mode"),
      themeLight: localStorage.getItem("ulidw-theme-light"),
      themeDark:  localStorage.getItem("ulidw-theme-dark")
    };
    console.log('[DEBUG] getThemeOptions:', getThemeOptions());
  }

  // 2. Détermine le thème à appliquer
  function getSelectedTheme(themeOpts) {
    if (!themeOpts.mode || !themeOpts.themeLight || !themeOpts.themeDark) {
      return null;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let mode;
    if (themeOpts.mode === "auto") {
      mode = prefersDark ? "dark" : "light";
    } else if (themeOpts.mode === "manual") {
      // "manual" = on utilise TOUJOURS la valeur de ulidw-theme-last
      mode = localStorage.getItem("ulidw-theme-last") || themeOpts.themeDark;
    } else {
      mode = themeOpts.mode;
    }
    if (mode === themeOpts.themeDark) return themeOpts.themeDark;
    if (mode === themeOpts.themeLight) return themeOpts.themeLight;
    return mode === "light" ? themeOpts.themeLight : themeOpts.themeDark;
  }


  function injectCustomThemeCss(cssText) {
    // Supprime tout CSS custom déjà injecté
    let custom = document.getElementById("user-themes-css");
    if (custom) custom.remove();

    // Crée et ajoute le bloc <style> tout à la fin du <head>
    let style = document.createElement("style");
    style.id = "user-themes-css";
    style.textContent = cssText;
    document.head.appendChild(style);
    // Dès que le thème est en place, on remet visible
    document.documentElement.style.visibility = "";
  }
  
  // 3. Applique le thème (attribut data-theme sur <html> et CSS externe ou custom) + 4 
  function applyTheme() {
    console.log('[THEME] Appel de applyTheme avec:', getThemeOptions());
    const themeOpts = getThemeOptions();
    const selectedTheme = getSelectedTheme(themeOpts);
    document.documentElement.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('ulidw-theme-last', selectedTheme);

    // Cherche un thème custom dans localStorage
    let userThemes = [];
    try {
      userThemes = JSON.parse(localStorage.getItem("ulidw-user-themes") || "[]");
    } catch { userThemes = []; }

    const themeObj = userThemes.find(t => t.name === selectedTheme);
    let link = document.getElementById("theme-css");

    if (themeObj) {
      // Si un CSS classique est chargé, l’enlever complètement
      if (link) link.remove();
      // Injecte le CSS custom en tout dernier
      injectCustomThemeCss(themeObj.css);
    } else {
      // Avant de charger un CSS classique, s'assurer d'enlever l'ancien custom
      let custom = document.getElementById("user-themes-css");
      if (custom) custom.remove();
      // Charge le CSS externe si thème "classique"
      if (!link) {
        link = document.createElement("link");
        link.id = "theme-css";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      link.href = `/themes/theme-${selectedTheme}.css`;
    }
    // On rend la page visible si un thème custom vient d'être injecté
    if (window.__ulidw_theme_pending) {
      document.documentElement.style.visibility = "";
      window.__ulidw_theme_pending = false;
    }
  }
  window.applyTheme = applyTheme;

  // 5. Applique au chargement
  applyTheme();

  // 6. Si préférence système change ET mode "auto" : adapte en direct
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemeOptions().mode === "auto") {
      applyTheme();
    }
  });

// Gestion upload thème custom
document.addEventListener("DOMContentLoaded", function() {
  // Bouton refresh (optionnel, page Thèmes)
  const btnRefresh = document.getElementById("btn-refresh-theme");
  if (btnRefresh) btnRefresh.onclick = () => window.applyTheme();

  // Gestion upload thème custom
  function extractThemes(cssText) {
    const re = /\[data-theme\s*=\s*["']([^"']+)["']\]\s*\{[^}]+\}/g;
    let match, found = [];
    while ((match = re.exec(cssText))) {
      found.push({
        name: match[1],
        css: match[0]
      });
    }
    return found;
  }
  const input = document.getElementById("file-upload");
  if (input) {
    input.addEventListener("change", function(e) {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      let allThemes = JSON.parse(localStorage.getItem("ulidw-user-themes") || "[]");
      Promise.all(files.map(file => file.text()))
        .then(contents => {
          contents.forEach(cssText => {
            const found = extractThemes(cssText);
            found.forEach(theme => {
              if (!allThemes.find(t => t.name === theme.name)) {
                allThemes.push(theme);
              }
            });
          });
          localStorage.setItem("ulidw-user-themes", JSON.stringify(allThemes));
          if (window.applyTheme) window.applyTheme();
          alert(`Thème(s) ajouté(s) !`);
        });
    });
  }
});


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

// -------- PJAX navigation --------
/*
function extractMainAndTitle(html) {
  // Crée un DOM parser pour extraire <main> et <title> de la page cible
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const main = doc.querySelector("main");
  const title = doc.querySelector("title")?.textContent || document.title;
  return { main, title };
}

async function pjaxNavigate(url, addToHistory = true) {
  try {
    const res = await fetch(url, { headers: { "X-PJAX": "true" } });
    if (!res.ok) throw new Error(res.statusText);

    const html = await res.text();
    const { main, title } = extractMainAndTitle(html);

    if (main) {
      document.querySelector("main").replaceWith(main);
    }
    if (title) {
      document.title = title;
    }
    if (addToHistory) {
      history.pushState(null, title, url);
    }

    // --- (Ré)initialise les scripts spécifiques à la page, si besoin ---
    // Exemple : window.initPage && window.initPage();
    // (ajoute ici des appels d'init de pages spécifiques si tu en utilises)
  } catch (err) {
    console.error("PJAX navigation failed:", err);
    window.location.href = url; // fallback : rechargement normal
  }
}

// Interception des clicks sur liens internes (hors liens externes, download, _blank, etc.)
document.addEventListener("click", function(e) {
  const a = e.target.closest("a");
  if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
  // Uniquement les liens internes (host identique)
  if (a.href.startsWith(window.location.origin)) {
    e.preventDefault();
    pjaxNavigate(a.href);
  }
});

// Gestion du back/forward navigateur
window.addEventListener("popstate", function() {
  pjaxNavigate(window.location.href, false);
});
*/
