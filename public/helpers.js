// Module ULID officiel du Worker (chargement dynamique)
let ulidModulePromise = null;

function dynamicImportUlid() {
  return Function("return import('/module/ulid')")();
}

export async function getUlidModule() {
  if (!ulidModulePromise) {
    if (typeof window !== "undefined" && typeof window.document !== "undefined") {
      ulidModulePromise = dynamicImportUlid();
    } else {
      ulidModulePromise = Promise.resolve(null);
    }
  }
  return ulidModulePromise;
}

// Génération officielle (module du Worker) — Fallback maison si offline
export async function generateUlidOfficial(ts) {
  try {
    const mod = await getUlidModule();
    if (mod && typeof mod.ulid === 'function') {
      if (typeof ts === 'number') return mod.ulid(ts);
      return mod.ulid();
    }
  } catch(e) {}
  // fallback si import échoue
  return makeUlid(ts);
}

// Optionnel : expose aussi une version "un caractère" pour le binaire si besoin ailleurs
export function crockCharToBinary(c) {
  return alphabet.indexOf(c).toString(2).padStart(5, '0');
}

// Constantes ULID
export const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// Convertit timestamp (ms) en base32 Crockford
export function encodeTime(ms, len = 10) {
  let str = "";
  while (len-- > 0) {
    str = alphabet[ms % 32] + str;
    ms = Math.floor(ms / 32);
  }
  return str;
}

// Décode une string Crockford vers timestamp (ms)
export function decodeCrock(str) {
  if (!/^[0-9A-HJKMNP-TV-Z]{10}$/i.test(str)) return NaN;
  let v = 0;
  for (const c of str.toUpperCase()) {
    const i = alphabet.indexOf(c);
    if (i < 0) return NaN;
    v = v * 32 + i;
  }
  return v;
}

// Convertit ULID -> binaire sur 128 bits, cf. spécif officielle ULID
export function rawToBinary(str) {
  return [...str]
    .map(c => alphabet.indexOf(c).toString(2).padStart(5, '0'))
    .join('')
    .slice(0, 128); // On ne garde que les 128 bits valides
}

// Formatage date en version lisible
export function formatFullDate(isoString) {
  const d = new Date(isoString);
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin",
                  "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const dayName = days[d.getUTCDay()];
  const day     = d.getUTCDate().toString().padStart(2, "0");
  const month   = months[d.getUTCMonth()];
  const year    = d.getUTCFullYear();
  const hour    = d.getUTCHours().toString().padStart(2, "0");
  const minute  = d.getUTCMinutes().toString().padStart(2, "0");
  const second  = d.getUTCSeconds().toString().padStart(2, "0");
  const ms      = d.getUTCMilliseconds().toString().padStart(3, "0");
  return `${dayName} ${day} ${month} ${year} à ${hour}:${minute}:${second}.${ms} UTC`;
}

// Validation JSON rapide
export function validateJSON(str) {
  try { JSON.parse(str); return true; }
  catch { return false; }
}

// Toast simple au centre bas
export function showToast(msg, duration = 3000) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), duration);
}

// Debounce universel
export function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Helpers UI pour validation champs
export function setValid(el, ok) {
  el.textContent = ok ? "✅ Valide" : "❌ Invalide";
  el.className = "ts-valid " + (ok ? "ok" : "bad");
}

export function clearValid(...els) {
  els.forEach(e => { e.textContent = ""; e.className = "ts-valid"; });
}

// Génération ULID JS côté client (horodatage courant ou aléatoire)
export function makeUlid(ts) {
  let ts48;
  if (ts === 'random') {
    ts48 = BigInt(0);
    for (let i = 0; i < 6; i++) {
      ts48 = (ts48 << 8n) | BigInt(Math.floor(Math.random() * 256));
    }
  } else {
    let tsVal;
    if (typeof ts === "number" && isFinite(ts)) {
      tsVal = Math.floor(ts);
    } else if (typeof ts === "string" && /^\d+$/.test(ts)) {
      tsVal = Math.floor(Number(ts));
    } else if (ts === undefined || ts === null) {
      tsVal = Date.now();
    } else {
      tsVal = Date.now();
    }
    ts48 = BigInt(tsVal) & 0xFFFFFFFFFFFFn;
  }
  let tsBase32 = "";
  let v = ts48;
  for (let i = 0; i < 10; i++) {
    tsBase32 = alphabet[Number(v % 32n)] + tsBase32;
    v = v / 32n;
  }
  let rand = BigInt(0);
  for (let i = 0; i < 10; i++) {
    rand = (rand << 8n) | BigInt(Math.floor(Math.random() * 256));
  }
  let randBase32 = "";
  v = rand;
  for (let i = 0; i < 16; i++) {
    randBase32 = alphabet[Number(v % 32n)] + randBase32;
    v = v / 32n;
  }
  return tsBase32 + randBase32;
}

export function makeUlidNow()    { return makeUlid(Date.now()); }
export function makeUlidRandom() { return makeUlid(); }

/**
 * Remplit récursivement un objet/JSON selon une logique d'autofill ULID.
 * @param {object} input   Le JSON à cloner/remplir (profond)
 * @param {object} opts    Options :
 *   - keySuffix    : string (ex "_uid")
 *   - matchValueFn : fonction(val) => boolean (ex: val => val===null)
 *   - fields       : array de clés à injecter (t, ts, ulid)
 *   - mono         : booléen (monotone)
 *   - forcedTs     : nombre|null (timestamp custom)
 *   - bin          : booléen (ajouter binaire)
 * @returns {Promise<object>}  Le JSON rempli (nouveau)
 */
export async function autofillJsonStructure(input, opts) {
  const {
    keySuffix = "_uid",
    matchValueFn = (val) => val === null,
    fields = ["ulid"],
    mono = false,
    forcedTs = null,
    bin = false
  } = opts || {};

  // Compte combien de remplacements il faudra faire pour préparer les timestamps
  function countTargets(obj) {
    let cnt = 0;
    if (obj && typeof obj === "object") {
      const isArr = Array.isArray(obj);
      const keys = isArr ? obj.keys() : Object.keys(obj);
      for (const k of keys) {
        const val = obj[k];
        if (!isArr && k.endsWith(keySuffix) && matchValueFn(val)) {
          cnt++;
        }
        if (val && typeof val === "object") {
          cnt += countTargets(val);
        }
      }
    }
    return cnt;
  }
  const total = countTargets(input);

  // Prépare la liste des timestamps pour le mode monotone/custom
  let tsList = [];
  if (mono && forcedTs !== null) {
    for (let i = 0; i < total; ++i) tsList.push(forcedTs + i);
  } else if (mono) {
    const now = Date.now();
    for (let i = 0; i < total; ++i) tsList.push(now + i);
  } else if (forcedTs !== null) {
    for (let i = 0; i < total; ++i) tsList.push(forcedTs);
  } else {
    for (let i = 0; i < total; ++i) tsList.push(null);
  }

  let tsIdx = 0;
  // Clone profond
  const out = JSON.parse(JSON.stringify(input));

  // Injection récursive asynchrone
  async function inject(obj) {
    if (obj && typeof obj === "object") {
      const isArr = Array.isArray(obj);
      const keys = isArr ? obj.keys() : Object.keys(obj);
      for (const k of keys) {
        const val = obj[k];
        if (!isArr && k.endsWith(keySuffix) && matchValueFn(val)) {
          const ulid = await generateUlidOfficial(tsList[tsIdx++] ?? undefined);
          const t = decodeCrock(ulid.slice(0, 10));
          const ts = new Date(t).toISOString();
          const binVal = rawToBinary(ulid);

          let fillVal;
          if (fields.length === 1) {
            if (fields[0] === "t") fillVal = t;
            else if (fields[0] === "ts") fillVal = ts;
            else if (fields[0] === "ulid" && bin) fillVal = { ulid, bin: binVal };
            else if (fields[0] === "ulid") fillVal = ulid;
            else fillVal = { t, ts, ulid };
          } else {
            fillVal = {};
            for (const key of fields) {
              if (key === "t") fillVal.t = t;
              else if (key === "ts") fillVal.ts = ts;
              else if (key === "ulid") fillVal.ulid = ulid;
            }
            if (bin && fields.includes("ulid")) fillVal.bin = binVal;
          }
          obj[k] = fillVal;
        }
        if (val && typeof val === "object") {
          await inject(val);
        }
      }
    }
  }
  await inject(out);
  return { result: out, count: total };
}

/**
 * Synchronise champ timestamp (ISO ou ms) et aperçu humanisé.
 * @param {HTMLInputElement} input  - Champ à synchroniser
 * @param {HTMLElement}      preview- Élément où afficher l’aperçu (pré)
 * @param {'iso'|'ms'}       mode   - 'iso' pour string ISO, 'ms' pour timestamp ms
 */
export function syncTimestampInput(input, preview, mode = 'iso') {
  function update() {
    let val = input.value.trim();
    let d;
    if (mode === 'iso') {
      d = new Date(val);
    } else {
      d = new Date(Number(val));
    }
    if (!val || isNaN(d.getTime())) {
      preview.textContent = '📆 Date : —';
    } else {
      preview.textContent = '📆 Date : ' + formatFullDate(d);
    }
  }
  input.addEventListener('input', update);
  update(); // Init à l’affichage
}

/**
 * Vérifie qu'une chaîne est bien un ULID conforme.
 * @param {string} v 
 * @returns {object} { ok: boolean, error: string|null, ...infos optionnelles }
 */
export function checkUlid(v) {
  if (typeof v !== "string" || v.length !== 26) {
    return { ok: false, error: "ULID : longueur incorrecte (26 caractères attendus)" };
  }
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  if (![...v].every(c => alphabet.includes(c))) {
    return { ok: false, error: "ULID : caractères invalides (base32 Crockford)" };
  }
  // Décode timestamp (10 premiers caractères)
  let t = 0;
  for (let i = 0; i < 10; i++) {
    t = t * 32 + alphabet.indexOf(v[i]);
  }
  // Optionnel : autres checks (timestamp plausible, bits random, etc.)
  return { ok: true, error: null, t, ts: new Date(t).toISOString() };
}
