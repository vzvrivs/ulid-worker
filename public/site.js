// 🔄 Appliquer le thème enregistré dès le chargement
// -----------------------------------------------
// On lit `ulid-theme` dans localStorage et on applique
// le data-theme ("dark" ou "light") sur <html>.
(() => {
  const stored = localStorage.getItem("ulid-theme");
  if (stored === "dark" || stored === "light") {
    document.documentElement.setAttribute("data-theme", stored);
  }
})();

// === 🍔 Script burger menu ===
// -----------------------------------------------
// Lorsque l'on clique sur le bouton hamburger,
// on bascule la classe 'show' sur la nav pour
// afficher/masquer le menu mobile.
document.querySelector('.burger-btn')?.addEventListener('click', () => {
  document.querySelector('.ulid-nav')?.classList.toggle('show');
});

// === 🌓 Gestion du thème ===
// -----------------------------------------------
// Fonction toggle pour changer le thème et le
// réenregistrer en localStorage.
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  const newTheme = isDark ? "light" : "dark";
  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("ulid-theme", newTheme);
}

// === 🧪 Playground.js — utilitaires DOM ===
// -----------------------------------------------
// Raccourci pour document.getElementById
const $ = id => document.getElementById(id);

// Debounce : exécute fn(...args) uniquement après
// `delay` ms sans nouvel appel.
const debounce = (fn, delay = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

// === ✅ Validation JSON ===
// -----------------------------------------------
// Renvoie true si `str` est un JSON valide.
const validateJSON = str => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

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
        labelSpan.textContent = 'Copié !';
      } else {
        btn.innerText = '✔️ Copié !';
      }
    })
    .catch(() => {
      if (iconSpan && labelSpan) {
        iconSpan.textContent  = '❌';
        labelSpan.textContent = 'Échec';
      } else {
        btn.innerText = '❌ Échec';
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

// === 🧼 Beautify / Restore JSON ===
// -----------------------------------------------
// Si `checked`, formate le JSON en pretty-print,
// sinon restaure la valeur brute stockée dans data-raw.
function beautifyJSON(checked) {
  const input = $("json-input");
  if (!input) return;
  if (checked) {
    try {
      input.setAttribute("data-raw", input.value);
      const parsed = JSON.parse(input.value);
      input.value = JSON.stringify(parsed, null, 2);
    } catch {}
  } else {
    const raw = input.getAttribute("data-raw");
    if (raw) input.value = raw;
  }
  updateJsonValidity();
}

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

// === 🧠 Autofill JSON ===
// -----------------------------------------------
// Envoie le JSON à l'API /autofill et affiche la requête,
// puis met à jour json-output et req-autofill-full.
window.autofillJSON = async () => {
  try {
    const input = $("json-input").value;
    $("req-autofill-full").textContent =
      `POST /autofill\nContent-Type: application/json\n\n` +
      JSON.stringify(JSON.parse(input), null, 2);

    const res = await fetch("/autofill", {
      method: "POST",
      headers:{ "Content-Type":"application/json" },
      body: input
    });
    const data = await res.json();
    $("json-output").textContent = JSON.stringify(data, null, 2);
  } catch {
    $("req-autofill-full").textContent = "// JSON invalide ❌";
    $("json-output").textContent   = "// JSON invalide ❌";
  }
};

// === 💾 Télécharger Autofill ===
// -----------------------------------------------
// Génère un nom de fichier horodaté + ULID, crée un Blob
// et déclenche le téléchargement.
window.downloadAutofill = async () => {
  const format = $("autofill-export-format").value;
  const raw    = $("json-output").textContent.trim();
  if (!raw || raw === "// En attente") {
    alert("Aucune donnée à exporter !");
    return;
  }

  // 1️⃣ Date/heure format YYYY-MM-DD_HH-MM-SS
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const datePart = [
    now.getFullYear(),
    pad(now.getMonth()+1),
    pad(now.getDate())
  ].join("-") + "_" +
  [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join("-");

  // 2️⃣ Récupération d’un ULID unique pour le nom de fichier
  let fileUlid = "noid";
  try {
    fileUlid = await (await fetch("/ulid?n=1&format=text")).text();
  } catch {
    console.warn("Impossible de récupérer un ULID pour le filename.");
  }

  // 3️⃣ Nom du fichier
  const filename = `${datePart}_${fileUlid}.${format}`;

  // 4️⃣ Construction du contenu et download
  let result = raw;
  try {
    const parsed = JSON.parse(raw);
    result = format === "json"
      ? JSON.stringify(parsed, null, 2)
      : JSON.stringify(parsed, null, 2);
  } catch {}
  const blob = new Blob([result], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// === 🎲 Génération ULID ===
// -----------------------------------------------
// Construit l’URL /ulid avec tes options (n, prefix…)
// + flags timestamp et monotonic, affiche la requête,
// puis met à jour gen-output.
window.generateULID = async () => {
  const n        = +$("gen-count").value || 1;
  const prefix   = encodeURIComponent($("gen-prefix").value);
  const suffix   = encodeURIComponent($("gen-suffix").value);
  const base     = $("gen-base").value;
  const bin      = $("gen-bin").checked   ? "&bin=true"    : "";
  const format   = $("gen-format").value;
  const tsParam  = $("common-timestamp").checked  ? `&timestamp=${Date.now()}` : "";
  const monoParam= $("monotonic-ulid").checked   ? `&monotonic=true`         : "";

  const url = `/ulid`
    + `?n=${n}` + tsParam + monoParam
    + `&prefix=${prefix}`
    + `&suffix=${suffix}`
    + `&base=${base}` + bin
    + `&format=${format}`
    + `&pretty=true`;

  $("req-gen").textContent = `GET ${url}`;
  const res    = await fetch(url);
  const isText = ["csv","tsv","joined","text"].includes(format);
  const data   = isText ? await res.text() : await res.json();
  $("gen-output").textContent = isText
    ? data
    : JSON.stringify(data, null, 2);
  $("gen-output").scrollTop = 0;
};

// === 💾 Télécharger ULID ===
// -----------------------------------------------
// Même principe que downloadAutofill, mais pour ULID
window.downloadConverted = async () => {
  const format = $("gen-export-format").value;
  const raw    = $("gen-output").textContent.trim();
  if (!raw || raw === "// Résultat ici") {
    alert("Aucun contenu à exporter !");
    return;
  }

  // Préparation du contenu selon le format
  let result = raw;
  try {
    const parsed = JSON.parse(raw);
    switch (format) {
      case "json":   result = JSON.stringify(parsed, null, 2); break;
      case "csv":    result = parsed.map(e=>e.ulid).join("\n"); break;
      case "tsv":    result = parsed.map(e=>e.ulid).join("\t"); break;
      case "text":   result = parsed.map(e=>e.ulid).join("\n\n"); break;
      case "joined": result = parsed.map(e=>e.ulid).join(""); break;
    }
  } catch {}

  // Timestamp + ULID pour le nom
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const datePart = [
    now.getFullYear(),
    pad(now.getMonth()+1),
    pad(now.getDate())
  ].join("-") + "_" +
  [pad(now.getHours()),pad(now.getMinutes()),pad(now.getSeconds())].join("-");
  let fileUlid = "noid";
  try {
    fileUlid = await (await fetch("/ulid?n=1&format=text")).text();
  } catch {
    console.warn("Impossible de récupérer un ULID pour le filename.");
  }
  const filename = `${datePart}_${fileUlid}.${format}`;

  const blob = new Blob([result], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// === 🔎 Vérification ULID ===
// -----------------------------------------------
// Lit le champ, appelle /ulid?check=… et affiche
// la réponse formattée ou une erreur en console.
window.checkULID = async () => {
  const ulid       = $("check-input").value.trim();
  const output     = $("check-output");
  const reqDisplay = $("req-check");

  if (!ulid) {
    output.textContent = "// 🟡 Aucun ULID fourni";
    return;
  }

  const url = `/ulid?check=${encodeURIComponent(ulid)}`;
  reqDisplay.textContent = `GET ${url}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();
    output.textContent = JSON.stringify({
      ...(data.error   && { error: data.error }),
      ulid: data.ulid || ulid,
      conform: data.conform ?? false,
      ...(data.conform && { t: data.t, ts: data.ts })
    }, null, 2);
  } catch (err) {
    console.debug("Erreur ULID :", err.message);
    output.textContent = JSON.stringify({
      ulid,
      conform: false,
      error: "Erreur de requête ou réponse non conforme"
    }, null, 2);
  }

  output.scrollTop = 0;
};

// === 🚀 Init DOMContentLoaded — liaison des handlers ===
document.addEventListener("DOMContentLoaded", () => {
  // Beautifier JSON au changement de checkbox
  $("beautify-toggle")?.addEventListener("change", () => beautifyJSON($("beautify-toggle").checked));

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

  // Boutons clear
  [
    {id:"clear-json-btn",      tgt:"json-input",       callback:updateJsonValidity},
    {id:"clear-ulid-btn",      tgt:"check-input"},
    {id:"clear-gen-output-btn",tgt:"gen-output"},
    {id:"clear-check-output-btn",tgt:"check-output"},
    {id:"clear-json-output-btn",tgt:"json-output"},
    {id:"clear-req-gen-btn",   tgt:"req-gen"},
    {id:"clear-req-check-btn", tgt:"req-check"},
    {id:"clear-req-autofill-btn",tgt:"req-autofill-full"},
  ].forEach(({id,tgt,callback}) => {
    $(id)?.addEventListener("click", () => {
      const el = $(tgt); 
      if (!el) return;
      if ('value' in el) el.value=""; else el.textContent="// En attente";
      if (callback) callback();
    });
  });

  // Actions principales
  [
    {id:"generate-btn",       fn:generateULID},
    {id:"check-btn",          fn:checkULID},
    {id:"autofill-btn",       fn:autofillJSON},
    {id:"download-gen-btn",   fn:downloadConverted},
    {id:"download-autofill-btn",fn:downloadAutofill},
  ].forEach(({id,fn}) => {
    $(id)?.addEventListener("click", fn);
  });
});
