import { rawToBinary } from '../public/helpers.js'

// ───────────────────────────────────────────────────────────
// Logger JSON structuré avec niveaux contrôlés par ENV
// ───────────────────────────────────────────────────────────
const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3, TRACE: 4 };

// Wrangler injecte LOG_LEVEL en globalThis.LOG_LEVEL
const rawLevel = typeof globalThis.LOG_LEVEL === 'string'
  ? globalThis.LOG_LEVEL.toUpperCase()
  : 'INFO';
const CURRENT_LEVEL = LOG_LEVELS[rawLevel] ?? LOG_LEVELS.INFO;

/**
 * log(level, message, meta?)
 * - level : "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE"
 * - message : texte descriptif
 * - meta    : objet supplémentaire (ex : { path, params, n })
 */
async function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] <= CURRENT_LEVEL) {
    const entry = {
      ts:      new Date().toISOString(),
      level,
      message,
      ...meta
    };
    // 1) Affiche en console (pour wrangler tail / dev)
    console[level.toLowerCase()](JSON.stringify(entry));
    // 2) Stocke ERROR et WARN en KV (conserver 7j)
    if (level === 'ERROR' || level === 'WARN') {
      const key = `${Date.now()}-${crypto.randomUUID()}`;
      await LOGS.put(key, JSON.stringify(entry), { expirationTtl: 7*24*3600 });
    }
  }
}

// =============================================================================
// index.js — ULID Worker (options timestamp & monotone, journaux intégrés)
// =============================================================================

import {
  ulid as randomULID,    // Générateur ULID standard
  decodeTime,            // Pour décoder t → ms depuis un ULID
  monotonicFactory       // Générateur monotone (incrémente l’aléa)
} from 'ulid';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// 🧠 Écouteur principal : log INFO + dispatch
addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // INFO à chaque entrée : méthode, chemin, params
  log("INFO", "Incoming request", {
    method: request.method,
    path:   url.pathname,
    params: Array.from(url.searchParams.entries())
  });

  event.respondWith(handleRequest(event));
});

// ───────────────────────────────────────────────────────────
// ROUTEUR PRINCIPAL
// ───────────────────────────────────────────────────────────
async function handleRequest(event) {
  try {
    const { request } = event;
    const url = new URL(request.url);

    // 1) Endpoint logs : renvoie les WARN/ERROR stockés
    if (url.pathname === '/logs' && request.method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit')||'100',10), 500);
      const allKeys = await LOGS.list({ limit: 1000 });
      const recent = allKeys.keys
        .map(k => k.name)
        .sort()
        .slice(-limit);
      const values = await Promise.all(recent.map(key => LOGS.get(key)));
      const entries = values.map(v => JSON.parse(v));
      return new Response(JSON.stringify(entries, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2) Routes core
    if (url.pathname === '/ulid' && request.method === 'GET') {
      return handleUlid(request);
    }
    if (url.pathname === '/autofill' && request.method === 'POST') {
      return handleAutofill(request);
    }
    if (url.pathname === '/module/ulid') {
      return new Response(MODULE_ULID_JS, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      });
    }
    if (url.pathname === '/auto-doc') {
      return handleAutoDoc(request);
    }

    // ──────────────────────────────────────────────
    // Mini‑dashboard HTML pour consulter /logs
    // ──────────────────────────────────────────────
    if (url.pathname === '/debug/logs' && request.method === 'GET') {
      return handleDebugLogs();
    }

    // 3) Fallback fichiers statiques
    try {
      return await getAssetFromKV(event);
    } catch {
      return new Response('404 – Page non trouvée', { status: 404 });
    }

  } catch (err) {
    // ERROR sur exception inattendue
    await log("ERROR", "Unhandled exception in handleRequest", {
      error: err.message,
      stack: err.stack
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ───────────────────────────────────────────────────────────
// Helper : construit objet ULID { t, ts, ulid, [bin] }
// ───────────────────────────────────────────────────────────
function buildULIDObject(rawId, { base='crockford', bin=false } = {}) {
  const t  = decodeTime(rawId);
  const ts = new Date(t).toISOString();

  let formatted = rawId;
  if (base === 'hex') {
    const binStr   = rawToBinary(rawId);
    const asBigInt = BigInt('0b'+binStr);
    formatted      = asBigInt.toString(16).padStart(26,'0');
  }

  const res = { t, ts, ulid: formatted };
  if (bin) res.bin = rawToBinary(rawId);
  return res;
}

// ───────────────────────────────────────────────────────────
// Handler GET /ulid
// ───────────────────────────────────────────────────────────
async function handleUlid(request) {
  const url = new URL(request.url);

  // A) Validation des params autorisés
  const allowed = ["check","n","pretty","base","bin","format","timestamp","monotonic","fields"];
  const invalid = [...url.searchParams.keys()].filter(k=>!allowed.includes(k));
  if (invalid.length) {
    await log("WARN", "Unsupported query parameter(s)", { invalid });
    return new Response(JSON.stringify({
      error: `Unsupported query parameter(s): ${invalid.join(", ")}`
    }, null, 2), {
      headers: { 'Content-Type':'application/json' },
      status: 400
    });
  }

  // B) Mode “check” (validation seule)
  const check = url.searchParams.get('check');
  if (check) {
    const resp = { ulid: check, conform: false };
    if (check.length !== 26) {
      resp.error = 'ULID must be exactly 26 characters';
      return new Response(JSON.stringify(resp, null,2), { status:400, headers:{'Content-Type':'application/json'} });
    }
    if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(check)) {
      resp.error = 'ULID contains invalid characters';
      return new Response(JSON.stringify(resp, null,2), { status:400, headers:{'Content-Type':'application/json'} });
    }
    const t = decodeTime(check);
    resp.conform = true;
    resp.t       = t;
    resp.ts      = new Date(t).toISOString();
    return new Response(JSON.stringify(resp, null,2), { status:200, headers:{'Content-Type':'application/json'} });
  }

  // C) Mode “generate” (lot) – lecture des options
  const n         = Math.min(parseInt(url.searchParams.get('n'))||1, 1000);
  const pretty    = url.searchParams.get('pretty') === 'true';
  const base      = url.searchParams.get('base')   || 'crockford';
  const bin       = url.searchParams.get('bin') === 'true';
  const format    = url.searchParams.get('format')|| 'json';
  const monotonic = url.searchParams.get('monotonic') === 'true';
  const forcedTs  = url.searchParams.has('timestamp')
                    ? parseInt(url.searchParams.get('timestamp'),10)
                    : (monotonic ? Date.now() : null);
  

  
  // DEBUG sur les paramètres de génération
  await log("DEBUG", "Generating ULID batch", {
    n, pretty, base, bin, format,
    forcedTs: forcedTs===null?'auto':forcedTs,
    monotonic
  });

  // D) Génération des ULID
  const list = [];
const fields = (url.searchParams.get('fields') || 't,ts,ulid')
  .split(',')
  .map(f => f.trim())
  .filter(Boolean);

const forceBin = fields.includes('ulid') && bin;

if (monotonic) {
  const m = monotonicFactory();
  for (let i=0; i<n; i++) {
    const raw = forcedTs !== null ? m(forcedTs) : m();
    const built = buildULIDObject(raw, { base, bin: forceBin });

    if (fields.length === 1 && fields[0] === 'ulid') {
      if (bin) {
        list.push({ ulid: built.ulid, bin: built.bin });
      } else {
        list.push(built.ulid);
      }
    } else if (fields.length === 1 && fields[0] === 't') {
      list.push(built.t);
    } else if (fields.length === 1 && fields[0] === 'ts') {
      list.push(built.ts);
    } else {
      const selected = {};
      for (const field of fields) {
        if (field === 't') selected.t = built.t;
        else if (field === 'ts') selected.ts = built.ts;
        else if (field === 'ulid') selected.ulid = built.ulid;
      }
      if (forceBin) selected.bin = built.bin;
      list.push(selected);
    }
  }
} else {
  for (let i=0; i<n; i++) {
    const raw = forcedTs !== null ? randomULID(forcedTs) : randomULID();
    const built = buildULIDObject(raw, { base, bin: forceBin });

    if (fields.length === 1 && fields[0] === 'ulid') {
      if (bin) {
        list.push({ ulid: built.ulid, bin: built.bin });
      } else {
        list.push(built.ulid);
      }
    } else if (fields.length === 1 && fields[0] === 't') {
      list.push(built.t);
    } else if (fields.length === 1 && fields[0] === 'ts') {
      list.push(built.ts);
    } else {
      const selected = {};
      for (const field of fields) {
        if (field === 't') selected.t = built.t;
        else if (field === 'ts') selected.ts = built.ts;
        else if (field === 'ulid') selected.ulid = built.ulid;
      }
      if (forceBin) selected.bin = built.bin;
      list.push(selected);
    }
  }
}


  // E) Formats texte (csv, tsv, text, joined)
  if (['csv','tsv','text','joined'].includes(format)) {
    const delim = format==='csv'?',':
                  format==='tsv'?'\t':
                  format==='text'?'\n\n':'';
    if (format==='csv'||format==='tsv') {
      const headers = Object.keys(list[0]);
      const rows    = list.map(o=>headers.map(h=>o[h]).join(delim));
      const out     = [headers.join(delim),...rows].join('\n');
      return new Response(out, {
        headers:{
          'Content-Type':'text/plain; charset=utf-8',
          'Content-Disposition':`inline; filename="ulid-${n}.${format}"`
        }
      });
    }
    const joined = list.map(o=>o.ulid).join(delim);
    return new Response(joined, {
      headers:{ 'Content-Type':'text/plain; charset=utf-8' }
    });
  }

  // F) Format JSON
  return new Response(JSON.stringify(list, null, pretty?2:0), {
    headers:{ 'Content-Type':'application/json' }
  });
}

// ───────────────────────────────────────────────────────────
// Handler POST /autofill
// ───────────────────────────────────────────────────────────
async function handleAutofill(request) {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    await log("WARN", "Invalid JSON payload for /autofill", { error: err.message });
    return new Response('Corps JSON invalide', { status: 400 });
  }
  const size = JSON.stringify(body).length;
  if (size > 1_000_000) {
    await log("WARN", "Payload too large for /autofill", { size });
    return new Response('Payload trop volumineux', { status: 413 });
  }

  await log("INFO", "Handling /autofill request", { size });

  // ── 1. Lecture des query-params ─────────────────────────
  const url        = new URL(request.url);
  const keySuffix  = url.searchParams.get('key')   || '_uid';
  const rawVal     = url.searchParams.get('value') ?? 'null';
  // On essaie de parser rawVal comme JSON (null, nombre, chaîne entre guillemets, booléen…)
  let matchValue;
  if (rawVal === "*" || rawVal === "") {
    matchValue = () => true;
  } else {
    try {
      const parsed = JSON.parse(rawVal);
      matchValue = v => v === parsed;
    } catch {
      // sinon on compare en string
      matchValue = v => String(v) === rawVal;
    }
  }

  const fields = (url.searchParams.get('fields') || 't,ts,ulid')
        .split(',').map(f => f.trim()).filter(Boolean);

  const base   = url.searchParams.get('base')   || 'crockford';
  const bin    = url.searchParams.get('bin') === 'true';
  const mono   = url.searchParams.get('monotonic') === 'true';
  // Si on demande du monotone ET qu’on n’a pas de timestamp custom,
  // on force tous les ULID à utiliser Date.now() commun
  const forced = url.searchParams.has('timestamp')
                 ? Number(url.searchParams.get('timestamp'))
                 : (mono ? Date.now() : null);

  const gen = mono ? monotonicFactory() : randomULID;

  // Fabrique le remplacement selon les « fields »
  const makeRepl = () => {
    const raw   = forced !== null ? gen(forced) : gen();
    const built = buildULIDObject(raw, { base, bin: fields.includes('ulid') && bin });
  
    if (fields.length === 1 && fields[0] === 'ulid') {
      if (bin) {
        return { ulid: built.ulid, bin: built.bin };
      } else {
        return built.ulid;
      }
    }
    if (fields.length === 1 && fields[0] === 't') return built.t;
    if (fields.length === 1 && fields[0] === 'ts') return built.ts;
    if (fields.length === 1 && fields[0] === 'bin') return built.bin;
  
    const o = {};
    for (const field of fields) {
      if (field === 't')      o.t = built.t;
      else if (field === 'ts')o.ts = built.ts;
      else if (field === 'ulid') o.ulid = built.ulid;
    }
  
    // 🔥 Ajout spécial bin si ulid sélectionné ET binaire activé
    if (fields.includes('ulid') && bin) {
      o.bin = built.bin;
    }
  
    return o;
  };
  
  
  

  // ── 2. Parcours récursif & injection ────────────────────
  let filled = 0;
  const inject = obj => {
    for (const k in obj) {
      const v = obj[k];
      if (k.endsWith(keySuffix) && matchValue(v)) {
        obj[k] = makeRepl(); filled++;
      } else if (Array.isArray(v)) v.forEach(inject);
      else if (v && typeof v === 'object') inject(v);
    }
  };
  inject(body);

  await log("DEBUG", "Autofill injection complete", { filled });

  const pretty = url.searchParams.get('pretty') === 'true';

  return new Response(JSON.stringify(body, null, pretty ? 2 : 0), {
    headers: { 'Content-Type':'application/json' }
  });

}
  
// ───────────────────────────────────────────────────────────
// Handler GET /auto-doc
// ───────────────────────────────────────────────────────────
/**
 * Documentation automatique GET /auto-doc
 * Reproduit à l’identique ton objet autoDoc
 */
function handleAutoDoc(request) {
	const url    = new URL(request.url);
	const pretty = url.searchParams.get("pretty") === "true";
  
	const autoDoc = {
	  info: {
		title:       "ULID Worker API",
		description: "Documentation auto-générée des routes disponibles dans ce Worker.",
		version:     "1.0",
	  },
	  endpoints: [
		{
		  path:        "/ulid",
		  method:      "GET",
		  description: "Génère ou valide un ou plusieurs ULID.",
		  params: {
			check:   "ULID à analyser pour vérifier sa validité",
			n:       "Nombre de ULID à générer (max 1000)",
			pretty:  "Format JSON lisible (indenté)",
			base:    "Base de sortie : crockford (par défaut) ou hex",
			bin:     "Ajoute le ULID en binaire (true/false)",
			format:  "Format de sortie : json, csv, tsv, text, joined",
			timestamp: "Timestamp unique (ms) à appliquer à tous les ULID",
			monotonic: "ULID monotones (true/false)"
		  }
		},
		{
		  path:        "/autofill",
		  method:      "POST",
		  description: "Remplit tous les champs *_uid:null d’un JSON avec des ULID structurés.",
		  body:        "JSON à analyser et enrichir"
		},
		{
		  path:        "/module/ulid",
		  method:      "GET",
		  description: "Renvoie un module JavaScript ES6 exportant ulid() et decodeTime()."
		},
		{
		  path:        "/auto-doc",
		  method:      "GET",
		  description: "Documentation automatique (cette route).",
		  params: { pretty: "Affiche le JSON avec indentation" }
		}
	  ]
	};
  
	return new Response(JSON.stringify(autoDoc, null, pretty ? 2 : 0), {
	  headers: { 'Content-Type': 'application/json; charset=utf-8' }
	});
  }
  
// ───────────────────────────────────────────────────────────
// Module ES6 servi sur /module/ulid
// ───────────────────────────────────────────────────────────
const MODULE_ULID_JS = `
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(ms, len = 10) {
  let str = "";
  while (len-- > 0) {
    str = alphabet[ms % 32] + str;
    ms = Math.floor(ms / 32);
  }
  return str;
}

function encodeRandom(len = 16) {
  let str = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) {
    str += alphabet[bytes[i] % 32];
  }
  return str;
}

export function ulid() {
  const now = Date.now();
  return encodeTime(now) + encodeRandom();
}

export function decodeTime(ulidStr) {
  let value = 0;
  for (let i = 0; i < 10; i++) {
    value = value * 32 + alphabet.indexOf(ulidStr[i]);
  }
  return value;
}
`.trim();
  

// ───────────────────────────────────────────────────────────
// Dashboard logs
// ───────────────────────────────────────────────────────────
async function handleDebugLogs() {
  // Vous pouvez ajuster le CSS et le markup
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>🔎 Logs ULID‑Worker</title>
  <style>
    body { font-family: sans-serif; padding: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.5rem; border: 1px solid #ccc; text-align: left; }
    th { background: #f0f0f0; }
    .controls { margin-bottom: 1rem; }
    .controls input { width: 4ch; }
    .controls select { margin-left: 1rem; }
  </style>
</head>
<body>
  <h1>🔎 Logs ULID‑Worker</h1>
  <div class="controls">
    <label>
      Nombre d’entrées : 
      <input id="limit" type="number" value="50" min="1" max="500">
    </label>
    <label>
      Niveau :
      <select id="levelFilter">
        <option value="">Tous</option>
        <option value="ERROR">ERROR</option>
        <option value="WARN">WARN</option>
        <option value="INFO">INFO</option>
        <option value="DEBUG">DEBUG</option>
      </select>
    </label>
    <button id="reload">↻ Recharger</button>
  </div>
  <table>
    <thead>
      <tr><th>ts</th><th>niveau</th><th>message</th><th>meta</th></tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>

  <script>
    async function loadLogs() {
      const limit = document.getElementById('limit').value;
      const level = document.getElementById('levelFilter').value;
      let url = '/logs?limit=' + limit;
      const res = await fetch(url);
      const logs = await res.json();
      const rows = logs
        .filter(l => !level || l.level === level)
        .map(l => 
          '<tr>'
          + '<td>' + l.ts        + '</td>'
          + '<td>' + l.level     + '</td>'
          + '<td>' + l.message   + '</td>'
          + '<td><pre>' + JSON.stringify(
              Object.assign({}, l, { ts: undefined, level: undefined, message: undefined }),
              null, 2
            ) + '</pre></td>'
          + '</tr>'
        ).join('');
      document.getElementById('tbody').innerHTML = rows;
    }
    document.getElementById('reload').addEventListener('click', loadLogs);
    window.addEventListener('load', loadLogs);
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
