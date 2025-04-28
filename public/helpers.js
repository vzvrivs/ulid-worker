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

// Convertit ULID -> binaire sur 130 bits
export function rawToBinary(str) {
  return [...str]
    .map(c => alphabet.indexOf(c).toString(2).padStart(5,'0'))
    .join('');
}

// Formatage date en version lisible
export function humanize(ms) {
  return new Date(ms).toLocaleString("fr-FR",{
    weekday:"long",day:"2-digit",month:"long",year:"numeric",
    hour:"2-digit",minute:"2-digit",second:"2-digit",
    hour12:false,timeZone:"UTC"
  }) + " UTC";
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
