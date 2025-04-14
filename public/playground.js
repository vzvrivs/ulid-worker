// 🔧 Utilitaire DOM
const $ = id => document.getElementById(id);

// ⏳ Debounce
const debounce = (fn, delay = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

// ✅ JSON validator
const validateJSON = str => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// 📋 Copier texte
window.copyText = (id, event) => {
  const el = $(id);
  if (!el) return;
  const text = el.value || el.textContent || el.innerText;
  const btn = event.currentTarget;
  const original = btn.innerText;

  navigator.clipboard.writeText(text)
    .then(() => btn.innerText = "✔️ Copié !")
    .catch(() => btn.innerText = "❌ Échec")
    .finally(() => {
      btn.disabled = true;
      setTimeout(() => {
        btn.innerText = original;
        btn.disabled = false;
      }, 3000);
    });
};

// 📥 Coller le contenu du presse-papier dans un champ (input, textarea)
window.pasteTo = async (targetId, callback) => {
  try {
    const text = await navigator.clipboard.readText();
    const el = $(targetId);
    if (!text || !el) return;
    el.value = text;
    if (typeof callback === "function") callback(text);
  } catch (err) {
    alert("❌ Impossible de coller depuis le presse-papier : " + err.message);
  }
};

// 🧼 Beautify / Restore
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

// ✅ Validation JSON en temps réel (avec debounce)
const updateJsonValidity = debounce(() => {
  const textarea = $("json-input");
  const validityEl = $("json-conformity");
  const isValid = validateJSON(textarea.value);
  validityEl.textContent = isValid ? "✅ JSON conforme" : "❌ JSON inconforme";
  validityEl.style.color = isValid ? "#33ff33" : "#ff4444";
}, 300);

// 🧠 Valide JSON et complète les champs *_uid:null via l’API /autofill
window.autofillJSON = async () => {
  try {
    const input = $("json-input").value;
    const parsed = JSON.parse(input);
    $("req-autofill-full").textContent = `POST /autofill\nContent-Type: application/json\n\n${JSON.stringify(parsed, null, 2)}`;

    const res = await fetch("/autofill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: input
    });

    const data = await res.json();
    $("json-output").textContent = JSON.stringify(data, null, 2);
  } catch {
    $("req-autofill-full").textContent = "// JSON inconforme ❌";
    $("json-output").textContent = "// JSON inconforme ❌";
  }
};

// 💾 Télécharger le résultat autofill dans le format choisi
window.downloadAutofill = () => {
  const format = $("autofill-export-format").value;
  const raw = $("json-output").textContent.trim();
  if (!raw || raw === "// En attente") {
    alert("Aucune donnée à exporter !");
    return;
  }

  let result = raw;
  try {
    const parsed = JSON.parse(raw);
    result = (format === "json")
      ? JSON.stringify(parsed, null, 2)
      : Object.entries(parsed).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n");
  } catch {}

  const blob = new Blob([result], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `autofill_export.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 🎲 Génération ULID
window.generateULID = async () => {
  const n = +$("gen-count").value || 1;
  const prefix = encodeURIComponent($("gen-prefix").value);
  const suffix = encodeURIComponent($("gen-suffix").value);
  const base = $("gen-base").value;
  const bin = $("gen-bin").checked ? "&bin=true" : "";
  const format = $("gen-format").value;

  const url = `/ulid?n=${n}&prefix=${prefix}&suffix=${suffix}&base=${base}${bin}&format=${format}&pretty=true`;
  $("req-gen").textContent = url;

  const res = await fetch(url);
  const isText = ["csv", "tsv", "joined", "text"].includes(format);
  const data = isText ? await res.text() : await res.json();
  $("gen-output").textContent = isText ? data : JSON.stringify(data, null, 2);
  $("gen-output").scrollTop = 0;
};

// 💾 Télécharger ULID
window.downloadConverted = () => {
  const format = $("gen-export-format").value;
  const raw = $("gen-output").textContent.trim();
  if (!raw || raw === "// Résultat ici") {
    alert("Aucun contenu à exporter !");
    return;
  }

  let result = raw;
  try {
    const parsed = JSON.parse(raw);
    switch (format) {
      case "json": result = JSON.stringify(parsed, null, 2); break;
      case "csv": result = parsed.map(e => e.ulid).join("\n"); break;
      case "tsv": result = parsed.map(e => e.ulid).join("\t"); break;
      case "text": result = parsed.map(e => e.ulid).join("\n\n"); break;
      case "joined": result = parsed.map(e => e.ulid).join(""); break;
    }
  } catch {
    alert("Impossible de convertir : le contenu n'est pas du JSON structuré.");
    return;
  }

  const blob = new Blob([result], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ulid_export.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 🔎 Vérification ULID
window.checkULID = async () => {
  const ulid = $("check-input").value.trim();
  const output = $("check-output");
  const reqDisplay = $("req-check");

  if (!ulid) {
    output.textContent = "// 🟡 Aucun ULID fourni";
    return;
  }

  const url = `/ulid?check=${encodeURIComponent(ulid)}`;
  reqDisplay.textContent = `GET ${url}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    output.textContent = JSON.stringify({
      ...(data.error && { error: data.error }),
      ulid: data.ulid || ulid,
      conform: data.conform ?? false,
      ...(data.conform && { t: data.t, ts: data.ts })
    }, null, 2);
  } catch (err) {
    output.textContent = JSON.stringify({
      ulid,
      conform: false,
      error: "Erreur de requête ou réponse non conforme"
    }, null, 2);
    console.debug("Erreur ULID :", err.message);
  }

  output.scrollTop = 0;
};

// 🚀 Init DOM
document.addEventListener("DOMContentLoaded", () => {
  // 🔄 Beautifier JSON
  const checkbox = $("beautify-toggle");
  if (checkbox) {
    checkbox.addEventListener("change", () => beautifyJSON(checkbox.checked));
  }


  // 🎯 Déclenche la vérification JSON à chaque modification du textarea
  const textarea = $("json-input");
  if (textarea) {
    textarea.addEventListener("input", updateJsonValidity);
  }

  // Appuyer sur Entrée dans le champ "Nombre d'ULID" déclenche la génération
  const inputCount = $("gen-count");
  if (inputCount) {
    inputCount.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault(); // empêche le submit implicite
        window.generateULID();  // déclenche la génération
      }
    });
  }

  // Appuyer sur Entrée dans le champ "ULID à vérifier" déclenche la vérification
  const inputCheck = $("check-input");
  if (inputCheck) {
    inputCheck.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault(); // empêche le submit implicite
        window.checkULID();  // déclenche la vérification
      }
    });
  }

  // Boutons de collage : target + callback associé
  const pasteActions = [
    { id: "paste-json-btn", target: "json-input", callback: updateJsonValidity },
    { id: "paste-ulid-btn",  target: "check-input" }
  ];

  pasteActions.forEach(({ id, target, callback }) => {
    const btn = $(id);
    if (btn) {
      btn.addEventListener("click", () => pasteTo(target, callback));
    }
  });

  // Boutons "Effacer" : cible + callback optionnel
  const clearActions = [
    // Champs d'entrée
    { id: "clear-json-btn", target: "json-input", callback: updateJsonValidity },
    { id: "clear-ulid-btn", target: "check-input" },
  
    // Champs de sortie
    { id: "clear-gen-output-btn", target: "gen-output" },
    { id: "clear-check-output-btn", target: "check-output" },
    { id: "clear-json-output-btn", target: "json-output" },
    { id: "clear-req-gen-btn", target: "req-gen" },
    { id: "clear-req-check-btn", target: "req-check" },
    { id: "clear-req-autofill-btn", target: "req-autofill-full" }
  ];  

  // 🧼 Effacer un champ input, textarea ou <pre>
  window.clearContent = (targetId, callback) => {
    const el = $(targetId);
    if (!el) return;

    if ('value' in el) {
      el.value = "";
    } else {
      // Champs de sortie : remettre le placeholder
      el.textContent = "// En attente";
    }

    if (typeof callback === "function") callback();
  };

  // Ajout des événements de clic pour chaque bouton "Effacer"
  clearActions.forEach(({ id, target, callback }) => {
    const btn = $(id);
    if (btn) {
      btn.addEventListener("click", () => window.clearContent(target, callback));
    }
  });

  const actionButtons = [
    { id: "generate-btn", handler: generateULID },
    { id: "check-btn", handler: checkULID },
    { id: "autofill-btn", handler: autofillJSON },
    { id: "download-gen-btn", handler: downloadConverted },
    { id: "download-autofill-btn", handler: downloadAutofill }
  ];
  
  actionButtons.forEach(({ id, handler }) => {
    const btn = $(id);
    if (btn) {
      btn.addEventListener("click", handler);
    }
  });
  

});
