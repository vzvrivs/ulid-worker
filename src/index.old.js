import { ulid, decodeTime } from 'ulid';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// 🧠 Serveur principal
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

//
// 🧠 ROUTEUR PRINCIPAL
//
async function handleRequest(event) {
  const { request } = event;
  const url = new URL(request.url);

  // ⚙️ API ULID : génération / validation
  if (url.pathname === "/ulid" && request.method === "GET") {
    return handleUlid(event);
  }

  // 🧪 Complétion JSON
  if (url.pathname === "/autofill" && request.method === "POST") {
    return handleAutofill(event);
  }

  // 📦 Module JavaScript importable (à la Skypack)
  if (url.pathname === "/module/ulid") {
    return new Response(MODULE_ULID_JS, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8"
      }
    });
  }

  // 🖼️ Fichiers statiques (HTML, CSS, PNG…)
  try {
    return await getAssetFromKV(event);
  } catch (_) {
    return new Response("404 – Page non trouvée", { status: 404 });
  }
}

//
// 🔧 FONCTION CENTRALE DE GÉNÉRATION ULID
//
function generateULID({ prefix = "", suffix = "", base = "crockford", bin = false } = {}) {
  const raw = ulid();
  const t = decodeTime(raw);
  const ts = new Date(t).toISOString();

  let formatted = raw;

  if (base === "hex") {
    const binStr = rawToBinary(raw);
    const asBigInt = BigInt("0x" + BigInt("0b" + binStr).toString(16));
    formatted = asBigInt.toString(16).padStart(26, "0");
  }

  const result = {
    t,
    ts,
    ulid: prefix + formatted + suffix
  };

  if (bin) result.bin = rawToBinary(raw);
  return result;
}

//
// 🔁 CONVERSION ULID BASE32 → BINAIRE
//
function rawToBinary(str) {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  return [...str]
    .map(char => alphabet.indexOf(char).toString(2).padStart(5, "0"))
    .join("");
}

//
// ⚙️ API GET /ulid
//
async function handleUlid(event) {
  const url = new URL(event.request.url);
  const validate = url.searchParams.get("validate");

  // 🔍 VALIDATION ULID
  if (validate) {
    const isValid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(validate);
    const response = {
      ulid: validate,
      valid: isValid
    };

    if (isValid) {
      const decoded = decodeTime(validate);
      response.t = decoded;
      response.ts = new Date(decoded).toISOString();
    }

    return new Response(JSON.stringify(response, null, 2), {
      headers: { "Content-Type": "application/json" },
      status: isValid ? 200 : 400
    });
  }

  // 🛠️ GÉNÉRATION ULID(S)
  const n = Math.min(parseInt(url.searchParams.get("n")) || 1, 1000);
  const pretty = url.searchParams.get("pretty") === "true";
  const prefix = url.searchParams.get("prefix") || "";
  const suffix = url.searchParams.get("suffix") || "";
  const base = url.searchParams.get("base") || "crockford";
  const bin = url.searchParams.get("bin") === "true";
  const format = url.searchParams.get("format") || "json";

  const ulids = [];
  for (let i = 0; i < n; i++) {
    ulids.push(generateULID({ prefix, suffix, base, bin }));
  }

  // 📄 FORMATS NON JSON
  if (["csv", "tsv", "text", "joined"].includes(format)) {
    const delimiter = {
      csv: ",",
      tsv: "\t",
      text: "\n\n",
      joined: ""
    }[format];

    // Pour CSV/TSV on garde toutes les colonnes
    if (format === "csv" || format === "tsv") {
      const headers = Object.keys(ulids[0]);
      const rows = ulids.map(obj => headers.map(h => obj[h]).join(delimiter));
      const output = [headers.join(delimiter), ...rows].join("\n");

      return new Response(output, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `inline; filename="ulid-${n}.${format}"`
        }
      });
    }

    // Pour text/joined, on ne prend que les ULID
    const joinedOutput = ulids.map(obj => obj.ulid).join(delimiter);

    return new Response(joinedOutput, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }


  // 📦 FORMAT JSON
  return new Response(JSON.stringify(ulids, null, pretty ? 2 : 0), {
    headers: { "Content-Type": "application/json" }
  });
}

//
// 🧪 API POST /autofill : remplissage automatique des *_uid:null
//
async function handleAutofill(event) {
  const request = event.request;
  let body;

  try {
    body = await request.json();
  } catch {
    return new Response("Corps JSON invalide", { status: 400 });
  }

  const jsonSize = JSON.stringify(body).length;
  if (jsonSize > 1_000_000) {
    return new Response("Payload trop volumineux", { status: 413 });
  }

  const inject = (obj) => {
    for (const key in obj) {
      const value = obj[key];
      if (value === null && key.endsWith("_uid")) {
        const uid = ulid();
        const t = decodeTime(uid);
        const ts = new Date(t).toISOString();
        obj[key] = { uid, t, ts };
      } else if (Array.isArray(value)) {
        value.forEach(inject);
      } else if (typeof value === "object" && value !== null) {
        inject(value);
      }
    }
  };

  inject(body);

  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}

//
// 📦 MODULE ES6 AUTO-SERVI : /module/ulid
//
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
