import {
  encodeTime, decodeCrock, humanize,
  validateJSON, showToast, debounce,
  setValid, clearValid
} from '/helpers.js';

// ╭──────────────────────────────────────────────────────────────╮
// │  🔔  TOAST STYLES                                           │
// ╰──────────────────────────────────────────────────────────────╯
const toastStyle = document.createElement('style');
toastStyle.textContent = `
.toast {
  position: fixed;
  bottom: 1rem; left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.85);
  color: #fff; padding: .5rem 1rem;
  border-radius: 4px; z-index: 9999;
  font-family: sans-serif;
}`;
document.head.append(toastStyle);

// ╭──────────────────────────────────────────────────────────────╮
// │  🧰  DOM HELPERS                                            │
// ╰──────────────────────────────────────────────────────────────╯
const $ = (id) => document.getElementById(id);

  /* Détection des clés sélectionnées et de leur ordre */
  function getSelectedKeys(containerId) {
    const container = document.getElementById(containerId)?.querySelector('.sortable-list');
    if (!container) return [];

    const keys = [];
    container.querySelectorAll('.list-item').forEach(item => {
      const input = item.querySelector('input[type="checkbox"]');
      const label = item.querySelector('label');
      if (input?.checked && label) {
        const text = label.textContent.trim();
        if (text.includes('UNIX')) keys.push('t');
        else if (text.includes('ISO')) keys.push('ts');
        else if (text.includes('ulid')) keys.push('ulid');
        else console.warn('clé inconnue', text);
      }
    });

    return keys;
  }
  /* Fin de Détection des clés sélectionnées et de leur ordre */

// ─── Beautify / Minify JSON ───
function beautifyGenOutput() {
  const pre = $("gen-output");
  try {
    const obj = JSON.parse(pre.textContent);
    pre.textContent = JSON.stringify(obj, null, 2);
    updateJsonValidity();
  } catch {
    showToast("❌ JSON invalide !");
  }
}

function minifyGenOutput() {
  const pre = $("gen-output");
  try {
    const obj = JSON.parse(pre.textContent);
    pre.textContent = JSON.stringify(obj);
    updateJsonValidity();
  } catch {
    showToast("❌ JSON invalide !");
  }
}

function beautifyAutofillInput() {
  const input = $("json-input");
  try {
    const obj = JSON.parse(input.value);
    input.value = JSON.stringify(obj, null, 2);
    updateJsonValidity();
  } catch {
    showToast("❌ JSON invalide !");
  }
}

function minifyAutofillInput() {
  const input = $("json-input");
  try {
    const obj = JSON.parse(input.value);
    input.value = JSON.stringify(obj);
    updateJsonValidity();
  } catch {
    showToast("❌ JSON invalide !");
  }
}

function beautifyAutofillOutput() {
  const pre = $("json-output");
  try {
    const obj = JSON.parse(pre.textContent);
    pre.textContent = JSON.stringify(obj, null, 2);
    updateJsonValidity();
  } catch {
    showToast("❌ JSON invalide !");
  }
}

function minifyAutofillOutput() {
  const pre = $("json-output");
  try {
    const obj = JSON.parse(pre.textContent);
    pre.textContent = JSON.stringify(obj);
    updateJsonValidity();
  } catch {
    showToast("❌ JSON invalide !");
  }
}

// === 📋 Copier texte (2 spans btn-icon / btn-label) ===
// -----------------------------------------------
// Copie le contenu de l'élément (#id) et met à jour
// l'icône et le texte du bouton pour indiquer succès/échec.
window.copyText = (id, event) => {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.value || el.textContent || el.innerText;
  const btn = event.currentTarget;

  const iconSpan  = btn.querySelector('.btn-icon');
  const labelSpan = btn.querySelector('.btn-label');

  const origIcon  = iconSpan  ? iconSpan.textContent  : '';
  const origLabel = labelSpan ? labelSpan.textContent : btn.innerText;

  navigator.clipboard.writeText(text)
    .then(() => {
      if (iconSpan && labelSpan) {
        iconSpan.textContent  = '✔️';
        labelSpan.textContent = 'Copié !';
      } else {
        btn.innerText = '✔️ Copié !';
      }
    })
    .catch(() => {
      if (iconSpan && labelSpan) {
        iconSpan.textContent  = '❌';
        labelSpan.textContent = 'Échec';
      } else {
        btn.innerText = '❌ Échec';
      }
    })
    .finally(() => {
      btn.disabled = true;
      setTimeout(() => {
        if (iconSpan && labelSpan) {
          iconSpan.textContent  = origIcon;
          labelSpan.textContent = origLabel;
        } else {
          btn.innerText = origIcon + ' ' + origLabel;
        }
        btn.disabled = false;
      }, 3000);
    });
};

// === 📥 Coller depuis le presse-papier ===
// -----------------------------------------------
// Lit le texte du clipboard et le colle dans #targetId.
// Si `callback` est fourni, on l'appelle avec le texte.
window.pasteTo = async (targetId, callback) => {
  try {
    const text = await navigator.clipboard.readText();
    const el = $(targetId);
    if (!text || !el) return;
    el.value = text;
    if (typeof callback === "function") callback(text);
  } catch (err) {
    alert("❌ Impossible de coller : " + err.message);
  }
};

// === ✅ Validation JSON en temps réel ===
// -----------------------------------------------
// Affiche "✅ JSON valide" ou "❌ JSON invalide" sous
// la textarea, avec debounce pour ne pas spammer.
const updateJsonValidity = debounce(() => {
  const textarea  = $("json-input");
  const validityEl= $("json-validity");
  const isValid   = validateJSON(textarea.value);
  validityEl.textContent = isValid ? "✅ JSON valide" : "❌ JSON invalide";
  validityEl.style.color   = isValid ? "#33ff33" : "#ff4444";
}, 300);

/* ---------------------------------------------------------------
   🧪 Autofill JSON — nouvelle version
   ---------------------------------------------------------------
   - Lit les trois check-boxes d'insertion (Unix / ISO / ULID)
   - Construit un paramètre  fields=t,ts,ulid  passé au Worker
   - Vérifie qu'au moins une case est cochée
   - Affiche la requête, appelle /autofill, affiche le résultat
   - Met à jour le compteur de remplacements
---------------------------------------------------------------- */
window.autofillJSON = async () => {
  const btn = $("autofill-btn");
  btn.disabled = true;
  btn.classList.add("pending");

  /* 0️⃣  Lecture / validation du JSON source ------------------ */
  const rawInput = $("json-input").value;
  let jsonInput;
  try { jsonInput = JSON.parse(rawInput); }
  catch {
    showToast("❌ JSON invalide !");
    btn.disabled = false;
    btn.classList.remove("pending");
    return;
  }

  /* 1️⃣  Paramètres « clé / valeur » à remplacer -------------- */
  //   ce sont les SUFFIXE et VALEUR d'origine que l'on va remplacer
  const keySuffixParam  = encodeURIComponent($("autofill-key").value.trim()   || "_uid");
  const valueMatchParam = encodeURIComponent($("autofill-value").value.trim() || "null");

  /* 2️⃣  Options ULID classiques ------------------------------ */
  //const prefix   = encodeURIComponent($("autofill-prefix").value);
  //const suffix   = encodeURIComponent($("autofill-suffix").value);
  const base     = $("autofill-base").value;
  const bin      = $("autofill-bin").checked                     ? "&bin=true"       : "";
  const mono     = $("autofill-gen-monotonic-ulid").checked      ? "&monotonic=true" : "";
  const tsParam  = getAutofillTsParam(); // ⏲️ timestamp commun (déjà implémenté)

  /* 3️⃣  ✨ Sélection dynamique dans autofill-keys --------------------- */
  const fields = getSelectedKeys('autofill-keys');
  if (!fields.length) {
    showToast("⚠️ Choisis au moins un champ à insérer !");
    btn.disabled = false;
    btn.classList.remove("pending");
    return;
  }
  const fieldsParam = "&fields=" + fields.join(",");

  const jsonInputOriginal = JSON.parse(JSON.stringify(jsonInput)); // copie profonde

  /* 4️⃣  Construction de l'URL finale ------------------------- */
  const url = `/autofill`
  + `?key=${keySuffixParam}&value=${valueMatchParam}`
  // + `&prefix=${prefix}&suffix=${suffix}
  + `&base=${base}`
  + bin + mono + tsParam + fieldsParam;


  /* 5️⃣  Affichage de la requête simulée ---------------------- */
  $("req-autofill-full").textContent =
    `POST ${url}\nContent-Type: application/json\n\n`
    + JSON.stringify(jsonInput, null, 2);

  /* 6️⃣  Appel réseau ---------------------------------------- */
  const res  = await fetch(url, {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify(jsonInput)
  });
  if (!res.ok) {
    showToast(`❌ Erreur ${res.status} : ${res.statusText}`);
    $("json-output").textContent = "// ⚠️ Échec de la requête";
    btn.disabled = false;
    btn.classList.remove("pending");
    return;
  }
  const data = await res.json();
  if (data.error) {
    showToast("❌ " + data.error);
    $("json-output").textContent = JSON.stringify(data, null, 2);
    return;
  }
  $("json-output").textContent = JSON.stringify(data, null, 2);

  /* 7️⃣  Comptage des remplacements --------------------------- */
  //   On compte chaque fois qu'une clé se termine par keySuffix
  //   et que sa valeur AVANT correspondait à valueMatch.
  // Lecture des paramètres choisis
  const keySuffixClean  = $("autofill-key").value.trim()   || "_uid";
  const rawValueMatch   = $("autofill-value").value.trim() || "null";

  // Détermine la fonction de comparaison exacte comme côté serveur
  let matchValueFn;
  if (rawValueMatch === "*" || rawValueMatch === "") {
    matchValueFn = () => true;
  } else {
    let parsedValue;
    try {
      parsedValue = JSON.parse(rawValueMatch);
      matchValueFn = (val) => val === parsedValue;
    } catch {
      matchValueFn = (val) => String(val) === rawValueMatch;
    }
  }

  // Fonction corrigée pour compter précisément les remplacements
function countRepl(orig) { // ← un seul paramètre !
  let cnt = 0;
  if (orig && typeof orig === "object") {
    const isArr = Array.isArray(orig);
    const keys  = isArr ? orig.keys() : Object.keys(orig);
    for (const k of keys) {
      const oVal = orig[k];

      if (!isArr && k.endsWith(keySuffixClean) && matchValueFn(oVal)) {
        cnt++;
      }

      if (oVal && typeof oVal === "object") {
        cnt += countRepl(oVal); // appel récursif avec un seul paramètre
      }
    }
  }
  return cnt;
}



  const replaced = countRepl(jsonInputOriginal);
  $("autofill-count").textContent =
    replaced
      ? `🔄 ${replaced} remplacement(s) effectué(s)`
      : `ℹ️ Aucun remplacement`;

  btn.disabled = false;
  btn.classList.remove("pending");
}; // ← fin de AutofillJSON()

// === 💾 Utilitaire générique pour télécharger un résultat ===
// -----------------------------------------------
// Génère un nom de fichier horodaté + ULID, crée un Blob
// et déclenche le téléchargement.

// === sécurise les champs CSV/TSV ===
function escapeField(field, delim) {
  if (typeof field !== 'string') field = String(field ?? '');
  if (field.includes(delim) || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

// === downloadResult v2 ===
async function downloadResult(outputId, formatId) {
  const format = formatId ? (document.getElementById(formatId)?.value || 'json') : 'json';
  const raw = document.getElementById(outputId).textContent.trim();
  if (!raw || raw.startsWith("//")) {
    alert("Aucune donnée à exporter !");
    return;
  }

  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  let fileUlid = "noid";
  try {
    const ulidRes = await fetch("/ulid?n=1&format=text");
    if (ulidRes.ok) fileUlid = (await ulidRes.text()).trim();
  } catch {}

  const filename = `${datePart}_${fileUlid}.${format}`;

  let result = raw;
  try {
    const parsed = JSON.parse(raw);
    const isArray = Array.isArray(parsed);

    if ((format === "csv" || format === "tsv" || format === "text" || format === "joined") && isArray) {
      const delim = format === "csv" ? "," : format === "tsv" ? "\t" : "\n";
      const fields = getSelectedKeys('gen-keys'); // ⬅️ très important : ordre sortable-list

      const allValues = [];
      for (const field of fields) {
        for (const obj of parsed) {
          if (typeof obj === "object" && obj[field] !== undefined) {
            allValues.push(String(obj[field]));
          } else if (typeof obj !== "object" && field === "ulid") {
            allValues.push(String(obj)); // cas primitif (ulid seul)
          }
        }
      }

      if (format === "csv" || format === "tsv") {
        result = allValues.map(val => escapeField(val, delim)).join(delim);
      } else if (format === "text") {
        result = allValues.join("\n\n");
      } else if (format === "joined") {
        result = allValues.join("");
      }
    }

    else if (format === "json") {
      result = raw; // 🎯 Réplique directe du contenu affiché
    }


  } catch {
    // si JSON.parse échoue => on garde raw
  }

  const blob = new Blob([result], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



// === 💾 Raccourcis pour Playground ===
window.downloadConverted = () =>
  downloadResult("gen-output", "gen-export-format");

window.downloadAutofill  = () =>
  downloadResult("json-output", "autofill-export-format");

// === 🎲 Génération ULID ===
// -----------------------------------------------
// Construit l'URL /ulid avec tes options (n, prefix…)
// + flags timestamp et monotonic, affiche la requête,
// puis met à jour gen-output.
window.generateULID = async () => {
  const btn = $("generate-btn");
  btn.disabled = true;
  btn.classList.add("pending");

  const n         = +$("gen-count").value || 1;
  // const prefix    = encodeURIComponent($("gen-prefix").value);
  // const suffix    = encodeURIComponent($("gen-suffix").value);
  const base      = $("gen-base").value;
  const bin       = $("gen-bin").checked   ? "&bin=true"    : "";
  const format    = $("gen-format").value;
  const tsParam   = getGenTsParam();
  const monoParam = $("gen-monotonic-ulid").checked   ? `&monotonic=true` : "";

  const fields = getSelectedKeys('gen-keys');
  if (!fields.length) {
    showToast("⚠️ Choisis au moins un champ à générer !");
    btn.disabled = false;
    btn.classList.remove("pending");
    return;
  }
  const fieldsParam = `&fields=${fields.join(",")}`;

  const url = `/ulid`
    + `?n=${n}` + tsParam + monoParam
    // + `&prefix=${prefix}`
    // + `&suffix=${suffix}`
    + `&base=${base}` + bin
    + `&format=${format}`
    + fieldsParam
    + `&pretty=true`;

  $("req-gen").textContent = `GET ${url}`;

  const res = await fetch(url);
  if (!res.ok) {
    showToast(`❌ Erreur ${res.status} : ${res.statusText}`);
    $("gen-output").textContent = "// ⚠️ Échec de la requête";
    btn.disabled = false;
    btn.classList.remove("pending");
    return;
  }

  const isText = ["csv","tsv","joined","text"].includes(format);
  const data   = isText ? await res.text() : await res.json();
  if (!isText && data.error) {
    showToast("❌ " + data.error);
    $("gen-output").textContent = JSON.stringify(data, null, 2);
    btn.disabled = false;
    btn.classList.remove("pending");
    return;
  }

  $("gen-output").textContent = isText
    ? data
    : JSON.stringify(data, null, 2);

  $("gen-output").scrollTop = 0;

  btn.disabled = false;
  btn.classList.remove("pending");
};


// === 🔎 Vérification ULID ===
// -----------------------------------------------
// Lit le champ, appelle /ulid?check=… et affiche
// la réponse formattée ou une erreur en console.
window.checkULID = async () => {
  const btn = $("check-btn");
  btn.disabled = true;
  btn.classList.add("pending");

  try {
    const input = $("check-input").value.trim();
    if (!input) {
      showToast("⚠️ Entrez un ULID à vérifier.");
      return;
    }

    const url = `/ulid?check=${encodeURIComponent(input)}`;
    $("req-check").textContent = `GET ${url}`;
    const res = await fetch(url);

    let data;
    try {
      data = await res.json();
    } catch {
      showToast("❌ Impossible de lire la réponse serveur !");
      $("check-output").textContent = "// ⚠️ Erreur de parsing JSON";
      $("check-ts-preview").textContent = "📆 Date : —";
      return;
    }

    $("check-output").textContent = JSON.stringify(data, null, 2);
    $("check-output").scrollTop = 0;

    if (data.error) {
      showToast("❌ " + data.error);
      $("check-ts-preview").textContent = "📆 Date : —";
    } else if (typeof data.t === "number") {
      $("check-ts-preview").textContent = "📆 Date : " + humanize(data.t);
    } else {
      $("check-ts-preview").textContent = "📆 Date : —";
    }
  }
  finally {
    btn.disabled = false;
    btn.classList.remove("pending");
  }
};



/**
 * Disable / enable a "bin" checkbox depending on the current
 * value of an adjacent <select> that offers "crockford" | "hex".
 * @param {HTMLSelectElement} select  e.g. #gen-base
 * @param {HTMLInputElement}  chk     e.g. #gen-bin
 */
function syncBinCheckbox(select, chk) {
  const isHex = select.value === 'hex';
  chk.disabled = isHex;
  if (isHex) chk.checked = false;        // uncheck when locked
}

// ------------------------------------------------------------------
//  NAVBAR loader  (CSS  ➜  HTML  ➜  JS module)
// ------------------------------------------------------------------
async function loadNavbar() {
  const container = document.getElementById("nav-container");
  if (!container) return;

  try {
    /* 1) charge le CSS avant d'injecter le HTML */
    await loadCSS("./navbar.css");

    /* 2) injecte le HTML */
    const html = await fetch("./navbar.html").then(r => r.text());
    container.innerHTML = html;

    /* 3) importe le module et initialise */
    const { initNavbar } = await import("./navbar.js");
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

// === 🚀 Init DOMContentLoaded — liaison des handlers ===
document.addEventListener("DOMContentLoaded", () => {

  /* Chargement dynamique de la navbar */
  loadNavbar();

  /* Mise à jour dynamique des flèches après chaque mouvement */
  function updateMoveButtons(containerId) {
    const container = document.getElementById(containerId);
    // si on n'a pas ce bloc sur la page, on ne fait rien
    if (!container) return;
    const items = container.querySelectorAll('.list-item');

    items.forEach((item, index) => {
      const upBtn = item.querySelector('.up-btn');
      const downBtn = item.querySelector('.down-btn');

      if (upBtn) upBtn.disabled = (index === 0);
      if (downBtn) downBtn.disabled = (index === items.length - 1);
    });
  }
  /* Fin de Mise à jour dynamique des flèches après chaque mouvement */

  /* Animation fluide des boutons */
   const containers = ['gen-keys', 'autofill-keys'];

  containers.forEach(id => {
    const wrapper = document.getElementById(id);
    if (!wrapper) return;

    const container = wrapper.querySelector('.sortable-list');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const item = btn.closest('.list-item');
      if (!item || !container.contains(item)) return;

      const list = Array.from(container.querySelectorAll('.list-item'));
      const firstRects = new Map();
      list.forEach(el => firstRects.set(el, el.getBoundingClientRect()));

      if (btn.classList.contains('up-btn') && item.previousElementSibling?.classList.contains('list-item')) {
        container.insertBefore(item, item.previousElementSibling);
        updateMoveButtons('gen-keys');
        updateMoveButtons('autofill-keys');
      }
      if (btn.classList.contains('down-btn') && item.nextElementSibling?.classList.contains('list-item')) {
        container.insertBefore(item.nextElementSibling, item);
        updateMoveButtons('gen-keys');
        updateMoveButtons('autofill-keys');
      }

      animateListItems(container, firstRects);
    });
  });

  function animateListItems(container, firstRects) {
    container.querySelectorAll('.list-item').forEach(el => {
      const lastRect = el.getBoundingClientRect();
      const firstRect = firstRects.get(el);
      const deltaY = firstRect.top - lastRect.top;
      if (deltaY !== 0) {
        el.animate([
          { transform: `translateY(${deltaY}px)` },
          { transform: 'translateY(0)' }
        ], {
          duration: 300,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
      }
    });
  }
  /* Fin de l'Animation fluide des boutons */


  /* ⏲️ Initialise les deux widgets Timestamp */
  window.getGenTsParam      = initTimestampUI("gen");
  window.getAutofillTsParam = initTimestampUI("autofill");

  // Nouveau : boutons Beautify / Minify
  $("beautify-gen-output-btn")?.addEventListener("click", beautifyGenOutput);
  $("minify-gen-output-btn")?.addEventListener("click",  minifyGenOutput);
  $("beautify-autofill-input-btn")?.addEventListener("click", beautifyAutofillInput);
  $("minify-autofill-input-btn")?.addEventListener("click",  minifyAutofillInput);
  $("beautify-autofill-output-btn")?.addEventListener("click", beautifyAutofillOutput);
  $("minify-autofill-output-btn")?.addEventListener("click",  minifyAutofillOutput);

  // Validation JSON à chaque frappe
  $("json-input")?.addEventListener("input", updateJsonValidity);

  // Touches Entrée pour déclencher generate/check
  $("gen-count")?.addEventListener("keydown", e => {
    if (e.key==="Enter") { e.preventDefault(); generateULID(); }
  });
  $("check-input")?.addEventListener("keydown", e => {
    if (e.key==="Enter") { e.preventDefault(); checkULID(); }
  });


  // Boutons paste
  [
    { id:"paste-json-btn",  tgt:"json-input", callback:updateJsonValidity },
    { id:"paste-ulid-btn",  tgt:"check-input" }
  ].forEach(({id,tgt,callback}) => {
    $(id)?.addEventListener("click", () => pasteTo(tgt, callback));
  });

  // Actions principales
  [
    {id:"generate-btn",         fn:generateULID},
    {id:"check-btn",            fn:checkULID},
    {id:"autofill-btn",         fn:autofillJSON},
  ].forEach(({id, fn}) => {
    document.getElementById(id)?.addEventListener("click", fn);
  });

  // === 🎛️ Gestion unifiée des boutons copy / clear / download ===
  document.body.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const { action, target, formatId } = btn.dataset;
    if (!target) return;

    // Clear le champ cible
    if (action === "clear") {
      const el = $(target);
      if (!el) return;
      if ("value" in el) el.value = "";
      else el.textContent = "// En attente";

      // Appel optionnel de updateJsonValidity
      if (target === "json-input") updateJsonValidity();

       // 🎯 Ajout spécial pour effacer aussi la date du Vérificateur
      if (target === "check-output") {
        const tsEl = document.getElementById("check-ts-preview");
        if (tsEl) tsEl.textContent = "📆 Date : —";
      }
    }

    // Copier le champ cible
    if (action === "copy") {
      copyText(target, e);
    }

    // Télécharger le champ cible avec le format précisé
    if (action === "download") {
      downloadResult(target, formatId);
    }
  });

  // Désactive les flèches haut et bas inutiles
  updateMoveButtons('gen-keys');
  updateMoveButtons('autofill-keys');

});

/* ---------- Outils horodatage ---------- */

/** Genère toutes les fonctions / listeners du mini-UI Timestamp
 *  @param {string} prefix  "gen"  ou "autofill"
 *  @returns {()=>string}   fonction qui renvoie "&timestamp=…" ou ""
 */
function initTimestampUI(prefix) {
  // IDs dynamiques
  const selBox = $(`${prefix}-ts-common-selectbox`);
  // ↪ si on n'a pas ce widget sur la page, on sort en renvoyant une no-op
  if (!selBox) {
    return () => "";
  }
  const isoRad = $(`${prefix}-ts-type-iso`);
  const unixRad= $(`${prefix}-ts-type-unix`);
  const crockRad=$(`${prefix}-ts-type-crock`);
  const isoIn  = $(`${prefix}-ts-input-iso`);
  const unixIn = $(`${prefix}-ts-input-unix`);
  const crockIn= $(`${prefix}-ts-input-crock`);
  const vIso   = $(`${prefix}-ts-valid-iso`);
  const vUnix  = $(`${prefix}-ts-valid-unix`);
  const vCrock = $(`${prefix}-ts-valid-crock`);
  const preview= $(`${prefix}-ts-preview`);
  const nowBtn = $(`${prefix}-ts-now-btn`);
  const options= selBox.querySelectorAll(".option");

  let mode="no";         // no | now | custom
  let type="iso";        // iso | unix | crock

  /* ---------- helpers UI ---------- */
  const clearIndicators = () => clearValid(vIso,vUnix,vCrock);

  const syncAndPreview = () => {
    clearIndicators();
    let raw, ms, ok=false;

    if (type==="iso") {
      raw = isoIn.value.trim();
      if (!raw) { preview.textContent="📆 Date : —"; return; }
      ms = Date.parse(raw);           ok=!isNaN(ms); setValid(vIso,ok);
    } else if (type==="unix") {
      raw = unixIn.value.trim();
      if (!raw) { preview.textContent="📆 Date : —"; return; }
      ms = Number(raw);               ok=Number.isFinite(ms)&&ms>0; setValid(vUnix,ok);
    } else {
      raw = crockIn.value.trim();
      if (!raw) { preview.textContent="📆 Date : —"; return; }
      ms = decodeCrock(raw);          ok=!isNaN(ms); setValid(vCrock,ok);
    }

    if (!ok) { preview.textContent="📆 Date : —"; return; }

    // synchro des trois champs
    isoIn.value   = new Date(ms).toISOString();
    unixIn.value  = String(ms);
    crockIn.value = encodeTime(ms);
    preview.textContent = "📆 Date : "+humanize(ms);
  };

  const applyType = () => {
    [isoIn,unixIn,crockIn].forEach(i=>i.readOnly=true);
    if (type==="iso") isoIn.readOnly=false;
    if (type==="unix")unixIn.readOnly=false;
    if (type==="crock")crockIn.readOnly=false;
    clearIndicators();  preview.textContent="📆 Date : —";
  };

  const setMode = m =>{
    mode=m; options.forEach(o=>o.classList.toggle("selected",o.dataset.value===m));
    const custom = m==="custom";
    [isoRad,unixRad,crockRad].forEach(r=>r.disabled=!custom);
    if (!custom){
      [isoIn,unixIn,crockIn].forEach(i=>{i.readOnly=true;i.value="";});
      preview.textContent="📆 Date : —";
    } else {
      // ISO par défaut
      isoRad.checked=true; type="iso"; applyType();
    }
  };

  /* ---------- listeners ---------- */
  options.forEach(o=>o.addEventListener("click",()=>setMode(o.dataset.value)));
  [isoRad,unixRad,crockRad].forEach(r=>{
    r.addEventListener("change",()=>{
      type = isoRad.checked?"iso":unixRad.checked?"unix":"crock";
      applyType(); syncAndPreview();
    });
  });
  [isoIn,unixIn,crockIn].forEach(i=>i.addEventListener("input",syncAndPreview));

  nowBtn?.addEventListener("click",()=>{
    const ms=Date.now();
    isoIn.value=new Date(ms).toISOString();
    unixIn.value=String(ms);
    crockIn.value=encodeTime(ms);
    isoRad.checked=true; type="iso"; applyType();
    setValid(vIso,true);
    preview.textContent="📆 Date : "+humanize(ms);
  });

  // init
  setMode("no");

  /* ---------- fonction utilitaire renvoyée ---------- */
  return () => {
    if (mode==="now")         return `&timestamp=${Date.now()}`;
    if (mode!=="custom")      return "";
    // custom
    const ms = type==="iso"   ? Date.parse(isoIn.value.trim())
              : type==="unix" ? Number(unixIn.value.trim())
              : decodeCrock(crockIn.value.trim());
    return (!ms||isNaN(ms)) ? "" : `&timestamp=${ms}`;
  };
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
