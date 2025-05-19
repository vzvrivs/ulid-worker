# ULID Worker

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
![Cloudflare Workers](https://img.shields.io/badge/Powered%20by-Cloudflare%20Workers-orange?logo=cloudflare)
![Built with JavaScript](https://img.shields.io/badge/Built%20with-JavaScript-yellow?logo=javascript)
![Vanilla JS](https://img.shields.io/badge/code-vanilla%20JS-ff69b4?logo=javascript&logoColor=white)
![Made with ChatGPT](https://img.shields.io/badge/made%20with-ChatGPT-10a37f?logo=openai&logoColor=white)
![Status: experimental](https://img.shields.io/badge/status-experimental-blueviolet)
![PRs: welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![Made with 💻 & ☕ (chicorée inside)](https://img.shields.io/badge/Made%20with-%F0%9F%92%BB%20%26%20%E2%98%95%20(chicor%C3%A9e%20inside)-blue)
![Visitors](https://visitor-badge.laobi.icu/badge?page_id=vzvrivs.ulid-worker)

✨ A personal project centered around ULIDs, powered by Cloudflare Workers.

- [ULID Worker](#ulid-worker)
  - [📦 Overview](#-overview)
  - [🚀 Features](#-features)
  - [🛠️ Technologies](#️-technologies)
  - [🧑‍💻 Local Development](#-local-development)
  - [🔗 Main Endpoints](#-main-endpoints)
  - [🔒 Security & Log Management](#-security--log-management)
  - [🗂️ Additional Pages](#️-additional-pages)
  - [🧠 Author](#-author)
  - [📝 License](#-license)


> ℹ️ **Accessibilité / a11y**  
> Tous les formulaires, inputs, selects, checkboxes, et boutons sont systématiquement dotés de labels explicites (`<label for=...>`), `title` et/ou `aria-label` pour une accessibilité maximale et la compatibilité avec les linters ou outils comme axe, VSCode, etc.


---

---

## Table of Contents

- [ULID Worker](#ulid-worker)
  - [📦 Overview](#-overview)
  - [ℹ️ Accessibilité / a11y](#ℹ️-accessibilité--a11y)
  - [🧑‍💻 Local Development](#-local-development)
  - [🚀 Features](#-features)
  - [🔗 Main Endpoints](#-main-endpoints)
  - [🗂️ Additional Pages](#️-additional-pages)
  - [🎨 Gestion des thèmes (light/dark/custom) & FOUC](#-gestion-des-thèmes-lightdarkcustom--fouc)
  - [🎨 Thèmes prêts à l’emploi](#-thèmes-prêts-à-lemploi)
  - [💡 Astuce](#-astuce)
  - [🚩 Known Issues / Limitations](#-known-issues--limitations)
  - [🧠 Author](#-author)
  - [Assistant IA & aide à l’optimisation](#assistant-ia--aide-à-loptimisation)
  - [📝 License](#-license)

---

## 📦 Overview

This project serves two main purposes:

1. **Generate ULIDs** (Universally Unique Lexicographically Sortable Identifiers)
2. **Analyze, document, and experiment with their structure and use cases**

It originated as a subproject of **PlayPal**, but has since grown into an independent playground for working with ULIDs.

---

## 🧑‍💻 Local Development

```bash
wrangler dev
```

> Requires [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) (official Cloudflare CLI)

---

## 🚀 Features

- 🎲 Generate ULIDs via HTTP API (with options: batch, format, prefix/suffix…)
- 🧪 Validate a ULID’s format and timestamp
- 🧬 Automatically fill `_uid: null` fields in any provided JSON
- 🧰 Interactive web interface at the root (`/`)

---

## 🔗 Main Endpoints

| Route               | Description                                      |
|---------------------|--------------------------------------------------|
| `/`                 | Interactive web interface                        |
| `/ulid`             | Generate ULID(s)                                 |
| `/ulid?check=...`   | Validate a ULID                                  |
| `/autofill` (POST)  | Autofill all `_uid:null` fields in a JSON        |

**Accepted parameters for /ulid:**

| Parameter | Type    | Description                                              |
|-----------|---------|----------------------------------------------------------|
| check     | string  | ULID to validate                                         |
| n         | number  | Number of ULIDs to generate (max 1000)                   |
| pretty    | boolean | Pretty-print the JSON                                    |
| prefix    | string  | Add a prefix to each generated ULID                      |
| suffix    | string  | Add a suffix to each generated ULID                      |
| base      | string  | Output base (currently: crockford or hex)                |
| bin       | boolean | Also output the ULID as binary if true                   |
| format    | string  | Output format: json, csv, tsv, text, joined              |

---

## 🗂️ Additional Pages

This project also includes a set of supporting interfaces and documentation:

| URL           | Description                                                            |
|---------------|------------------------------------------------------------------------|
| `/`           | 🏠 Main interface (generation, validation, autofill)                   |
| `/help`       | 🆘 Quick help and example URLs                                         |
| `/docs`       | 📚 Full documentation for endpoints, parameters, and responses         |
| `/playground` | 🕹️ Interactive scripts for feature exploration                        |
| `/music`      | 🎶 ULID-based music generator with multiple sound styles               |
| `/matrix`     | 🧬 Interactive "Matrix ULID" visual animation                          |

---

## 🎨 Gestion des thèmes (light/dark/custom) & FOUC
---

## 🎨 Thèmes prêts à l’emploi

Le projet inclut désormais **plusieurs thèmes personnalisés** inspirés de la pop culture, de l’esthétique vintage ou de la fantaisie :

- CRT (terminal vert)
- Matrix
- Neon
- Halloween
- Stormtrooper Light
- Stormtrooper Dark
- Jungle
- Jardin fleuri
- Militaire
- Candy
- Luxury Gold

Chaque thème définit **toutes les variables CSS** du projet : couleurs, fonds, boutons, champs, code, navbar, etc.
Ils peuvent être ajoutés/importés dans `/themes` via un simple fichier CSS (voir exemple ci-dessus).

> Voir le fichier [`themes-custom.css`](./themes-custom.css) pour une collection complète à importer, ou copie-colle un bloc dans l’UI.

---


ULID Worker supporte un système de thème avancé :
  - Sélection automatique clair/sombre (“auto” selon le système)
  - Personnalisation avec thèmes custom téléchargeables/importables
  - Persistance du thème choisi entre toutes les pages
  - **Zéro flash blanc (FOUC) :** le thème est appliqué dès le tout premier pixel, même avec navigation dynamique

**Mise en œuvre technique :**
  - Un mini-script est injecté au tout début du `<head>` de chaque page HTML.  
    Il lit les préférences (`localStorage`) et applique le bon `data-theme` avant tout chargement du CSS.
  - Si un thème custom est utilisé, la page est temporairement masquée (`visibility:hidden`) jusqu’à ce que le JS injecte le bon style (plus de FOUC).
  - Le bouton de la navbar permet de basculer entre les thèmes “clair” et “sombre” choisis dans la page Thèmes, qu’ils soient natifs ou custom.

**Pour ajouter un thème custom :**
1. Va sur la page `/themes`
2. Uploade un ou plusieurs fichiers `.css` contenant des blocs de la forme :  
   ```css
   [data-theme="mon-theme"] {
     --bg: #222;
     --text: #eee;
     /* ... */
   }
   ```
3. Sélectionne-le comme thème clair ou sombre.
4. Le thème s’applique immédiatement sur tout le site.

### Exemple de structure d’un thème custom


> 💡 **Astuce**  
> Pour créer un thème custom à partir d’un thème existant, tu peux simplement :
> 1. Copier un bloc `[data-theme="..."]` du fichier CSS
> 2. Modifier les couleurs selon tes envies
> 3. Importer le fichier CSS dans `/themes` !


```css
[data-theme="solarized-dark"] {
  --bg: #002b36;
  --text: #93a1a1;
  --heading: #b58900;
  /* ... */
}
```
Le nom (`data-theme="..."`) est ce que tu sélectionnes comme “clair” ou “sombre” dans la page Thèmes.

> ⚠️ Après toute modification des thèmes ou de la page Thèmes,  
> pense à recharger toutes les pages du site pour appliquer les nouveaux styles.

---

## 🚩 Known Issues / Limitations

- La gestion avancée des thèmes custom est expérimentale.
- Certains effets visuels peuvent varier selon le navigateur.
- L’interface `/themes` est optimisée pour Chrome, Firefox et Edge récents.

---

> **Assistant IA & aide à l’optimisation :**  
> Ce projet a été continuellement amélioré et optimisé avec l’aide de ChatGPT (OpenAI) pour l’architecture, le refactoring, l’accessibilité, l’audit de thème, et le support utilisateur avancé.

---

## 🧠 Author

Project crafted with passion by **Raphaël**

---

> **Assistant IA & aide à l’optimisation :**  
> Ce projet a été continuellement amélioré et optimisé avec l’aide de ChatGPT (OpenAI) pour l’architecture, le refactoring, l’accessibilité, l’audit de thème, et le support utilisateur avancé.

## 📝 License

This project is distributed under  
**[Creative Commons Attribution – NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)**

> You are free to:
>
> - 📤 use, modify, and redistribute this project,
> - as long as you credit the author clearly,
> - **and do not use it commercially**.

For any commercial usage requests, please contact the author directly.

---

## 📝 License

This project is distributed under  
**[Creative Commons Attribution – NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)**

> You are free to:
>
> - 📤 use, modify, and redistribute this project,
> - as long as you credit the author clearly,
> - **and do not use it commercially**.

For any commercial usage requests, please contact the author directly.

---
