// ==== Toast simple ====
function showToast(msg, duration = 3000) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), duration);
}
// style minimal pour le toast
const toastStyle = document.createElement("style");
toastStyle.textContent = `
.toast {
  position: fixed;
  bottom: 1rem; left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: #fff; padding: 0.5rem 1rem;
  border-radius: 4px; z-index: 9999;
  font-family: sans-serif;
}
`;
document.head.append(toastStyle);

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

// charge Flatpickr pour un vrai date-time picker (avec ms)
const fpScript = document.createElement("script");
fpScript.src = "https://cdn.jsdelivr.net/npm/flatpickr";
document.head.append(fpScript);
const fpCss = document.createElement("link");
fpCss.rel = "stylesheet";
fpCss.href = "https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css";
document.head.append(fpCss);

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

// ─── Beautify / Minify JSON ───
function beautifyJSON() {
  const input = $("json-input");
  try {
    const obj = JSON.parse(input.value);
    input.value = JSON.stringify(obj, null, 2);
    updateJsonValidity();
  } catch {
    showToast("❌ JSON invalide !");
  }
}

function minifyJSON() {
  const input = $("json-input");
  try {
    const obj = JSON.parse(input.value);
    input.value = JSON.stringify(obj);
    updateJsonValidity();
  } catch {
    showToast("❌ JSON invalide !");
  }
}


/* --- Crockford <-> ms helpers --- */
const CF_ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function encodeTime(ms,len=10){
  let s="";while(len--){s=CF_ALPH[ms%32]+s;ms=Math.floor(ms/32);}return s;
}
function decodeCrock(str){       // 10 car. => ms
  if(!/^[0-9A-HJKMNP-TV-Z]{10}$/i.test(str)) return NaN;
  let v=0;for(const c of str.toUpperCase()){
    const i=CF_ALPH.indexOf(c); if(i<0) return NaN;
    v=v*32+i;
  }
  return v;                      // ms
}
function humanize(ms){
  return new Date(ms).toLocaleString("fr-FR",{
    weekday:"long",day:"2-digit",month:"long",year:"numeric",
    hour:"2-digit",minute:"2-digit",second:"2-digit",
    hour12:false,timeZone:"UTC"
  })+" UTC";
}

function setValid(el, ok){
  el.textContent = ok ? "✅ Valide" : "❌ Invalide";
  el.className   = "ts-valid " + (ok ? "ok" : "bad");
}
function clearValid(...els){
  els.forEach(e=>{ e.textContent=""; e.className="ts-valid"; });
}


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


/* ---- Timestamp commun ---- */
let tsParam="";
const tsBoxVal=document.querySelector("#gen-ts-common-selectbox .selected").dataset.value;
if(tsBoxVal==="now") tsParam=`&timestamp=${Date.now()}`;
else if(tsBoxVal==="custom"){
  const ms =   $("ts-type-iso").checked   ? Date.parse($("ts-input-iso").value.trim())
            : $("ts-type-unix").checked  ? Number($("ts-input-unix").value.trim())
            : decodeCrock($("ts-input-crock").value.trim());
  if(!ms || Number.isNaN(ms)){
    showToast("❌ Timestamp custom invalide !");
    return;
  }
  tsParam=`&timestamp=${ms}`;
}
/* --------------------------- */

  

  const monoParam= $("gen-monotonic-ulid").checked   ? `&monotonic=true`         : "";

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

  // Nouveau : boutons Beautify / Minify
  $("beautify-btn")?.addEventListener("click", beautifyJSON);
  $("minify-btn")?.addEventListener("click",  minifyJSON);

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

/* ---------- Outils horodatage ---------- */
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function encodeTime(ms, len = 10) {
  let str = "";
  while (len-- > 0) {
    str = alphabet[ms % 32] + str;
    ms = Math.floor(ms / 32);
  }
  return str;
}
function humanize(ms){
  return new Date(ms).toLocaleString("fr-FR", {
    weekday:"long", day:"2-digit", month:"long", year:"numeric",
    hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false, timeZone:"UTC"
  })+" UTC";
}

/* ---------- Sélecteur custom “Timestamp commun” ---------- */
function initTimestampUI(){
  const box   = $("gen-ts-common-selectbox");
  const opts  = box.querySelectorAll(".option");

  const isoRad=$("ts-type-iso"),   unixRad=$("ts-type-unix"),   crockRad=$("ts-type-crock");
  const isoIn = $("ts-input-iso"), unixIn = $("ts-input-unix"), crockIn = $("ts-input-crock");
  const preview=$("ts-preview"),   nowBtn=$("ts-now-btn");

  const vIso=$("ts-valid-iso"), vUnix=$("ts-valid-unix"), vCrock=$("ts-valid-crock");

  let mode="no"; let type="iso";

  const updatePreview = () => {
    // 1) On efface d’abord tous les indicateurs
    clearValid(vIso, vUnix, vCrock);
  
    let raw, ms, ok;
  
    if (type === "iso") {
      raw = isoIn.value.trim();
      // Si le champ est vide, on ne fait rien
      if (!raw) {
        preview.textContent = "📆 Date : —";
        return;
      }
      ms = Date.parse(raw);
      ok = !Number.isNaN(ms);
      setValid(vIso, ok);
    }
    else if (type === "unix") {
      raw = unixIn.value.trim();
      if (!raw) {
        preview.textContent = "📆 Date : —";
        return;
      }
      ms = Number(raw);
      ok = Number.isFinite(ms) && ms > 0;
      setValid(vUnix, ok);
    }
    else { // crockford
      raw = crockIn.value.trim();
      if (!raw) {
        preview.textContent = "📆 Date : —";
        return;
      }
      ms = decodeCrock(raw);
      ok = !Number.isNaN(ms);
      setValid(vCrock, ok);
    }
  
    // Si invalide, on arrête là
    if (!ok) {
      preview.textContent = "📆 Date : —";
      return;
    }
  
    // 2) Si valide, on synchronise et on affiche la date
    isoIn.value   = new Date(ms).toISOString();
    unixIn.value  = String(ms);
    crockIn.value = encodeTime(ms);
    preview.textContent = "📆 Date : " + humanize(ms);
  };
  

  /* ----- State helpers ----- */
  const setMode = m => {
    mode = m;
    opts.forEach(o => o.classList.toggle("selected", o.dataset.value === m));
    const custom = m === "custom";

    [isoRad, unixRad, crockRad].forEach(r => r.disabled = !custom);
    // Si on n'est PAS en custom, on désactive et vide tous les inputs
    if (!custom) {
       [isoIn, unixIn, crockIn].forEach(i => {
         i.readOnly = true;
         i.value = "";
       });
       preview.textContent = "📆 Date : —";
     } else {
       // En mode custom, on laisse la radio ISO cochée par défaut
       // et on active directement son input via handleTypeChange
       handleTypeChange();
     }

    // Mets à jour l’aperçu si une valeur valide existe déjà
    updatePreview();
  };

  const handleTypeChange = () => {
    type = isoRad.checked ? "iso" : unixRad.checked ? "unix" : "crock";

    [isoIn, unixIn, crockIn].forEach(i => i.readOnly = true);
    if (type === "iso")   isoIn.readOnly = false;
    if (type === "unix")  unixIn.readOnly = false;
    if (type === "crock") crockIn.readOnly = false;

    // Vider les anciens indicateurs
    clearValid(vIso, vUnix, vCrock);
    // Mettre à jour l’aperçu si la nouvelle valeur est valide (ou le vider)
    updatePreview();
  };

  /* --- listeners de saisie --- */
  [isoIn, unixIn, crockIn].forEach(input => {
    input.addEventListener("input", () => {
      // on nettoie les anciens messages sous *tous* les inputs
      clearValid(vIso, vUnix, vCrock);
      // et on affiche l’aperçu si valide
      updatePreview();
    });
  });

  nowBtn.addEventListener("click", ()=>{
    const ms=Date.now();
    isoIn.value=new Date(ms).toISOString();
    unixIn.value=String(ms);
    crockIn.value=encodeTime(ms);
    clearValid(vIso,vUnix,vCrock);
    isoRad.checked=true; handleTypeChange();
    setValid(vIso,true);
    preview.textContent="📆 Date : " + humanize(ms);
  });


  /* --- listeners --- */
  opts.forEach(o=>o.addEventListener("click",()=>setMode(o.dataset.value)));
  [isoRad,unixRad,crockRad].forEach(r=>r.addEventListener("change",handleTypeChange));
  [isoIn,unixIn,crockIn].forEach(i=>i.addEventListener("input",updatePreview));

  setMode("no");
}
document.addEventListener("DOMContentLoaded", initTimestampUI);

