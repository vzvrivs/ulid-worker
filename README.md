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

✨ Un projet personnel autour des ULID, propulsé par Cloudflare Workers.

- [ULID Worker](#ulid-worker)
  - [📦 Présentation](#-présentation)
  - [🚀 Fonctionnalités](#-fonctionnalités)
  - [🛠️ Technologies](#️-technologies)
  - [🧑‍💻 Pour développer localement](#-pour-développer-localement)
  - [🔗 Routes principales](#-routes-principales)
  - [🗂️ Pages annexes](#️-pages-annexes)
  - [🧠 Auteur](#-auteur)
  - [📝 Licence](#-licence)
  - [🔮 À venir](#-à-venir)

---

## 📦 Présentation

Ce projet a deux objectifs principaux :

1. **Générer des ULID** (Universally Unique Lexicographically Sortable Identifiers)
2. **Analyser, documenter et expérimenter avec leur structure et leurs usages**

Il est né dans le cadre d’un autre projet nommé **PlayPal**, avant de devenir une entité indépendante dédiée à la compréhension et à la manipulation des ULID.

---

## 🚀 Fonctionnalités

- 🎲 Génération d'ULID via API HTTP avec options (quantité, format, préfixe/suffixe…)
- 🧪 Analyse de conformité d’un ULID (forme, timestamp)
- 🧬 Complétion automatique de champs `_uid: null` dans un JSON fourni
- 🧰 Interface web interactive à la racine (`/`)

---

## 🛠️ Technologies

- Cloudflare Workers (backend serverless)
- HTML/CSS/JS vanilla (frontend statique)
- Git + GitHub pour le versionnement

---

## 🧑‍💻 Pour développer localement

```bash
wrangler dev
```

> Nécessite l’outil [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) (CLI officielle Cloudflare)

---

## 🔗 Routes principales

| Route               | Description                              |
|---------------------|------------------------------------------|
| `/`                 | Interface web interactive                |
| `/ulid`             | Génération ULID                          |
| `/ulid?check=...`   | Analyse de conformité                    |
| `/autofill` (POST)  | Remplit tous les champs `_uid:null`      |

✅ Paramètres acceptés dans /ulid

| Paramètre | Type    | Description                                             |
|-----------|---------|---------------------------------------------------------|
| check     | string  | ULID à analyser pour en vérifier la conformité          |
| n         | number  | Nombre de ULID à générer (max 1000)                     |
| pretty    | boolean | Si true, formatte le JSON avec indentation              |
| prefix    | string  | Ajoute un préfixe aux ULID générés                      |
| suffix    | string  | Ajoute un suffixe aux ULID générés                      |
| base      | string  | Base de sortie (actuellement : crockford ou hex)        |
| bin       | boolean | Si true, ajoute aussi l’ULID en binaire                 |
| format    | string  | Type de format de sortie : json, csv, tsv, text, joined |

---

## 🗂️ Pages annexes

Le projet comprend également des interfaces ou contenus complémentaires :

| URL           | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `/`           | 🏠 Interface principale (génération, vérification, autofill)               |
| `/help`       | 🆘 Aide rapide avec exemples d'URL préconfigurées                          |
| `/docs`       | 📚 Documentation complète des endpoints, paramètres et réponses            |
| `/playground` | 🕹️ Scripts interractifs pour tester les fonctionnalités principales        |
| `/music`      | 🎶 Générateur de musique basé sur les ULID, avec différents styles sonores |
| `/matrix`     | 🧬 Animation visuelle "Matrix ULID" interactive                            |

---

## 🧠 Auteur

Projet conçu avec passion par **Raphaël**

---

## 📝 Licence

Ce projet est distribué sous la licence  
**[Creative Commons Attribution – NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)**

> Cela signifie que vous êtes libre de :
>
> - 📤 utiliser, modifier et redistribuer ce projet,
> - à condition de me créditer clairement,
> - **et de ne pas en faire un usage commercial**.

Pour toute demande d’usage commercial, merci de me contacter directement.

---

## 🔮 À venir

- [ ] Compression ULID (base64, zlib ?)
- [ ] ULID en UUIDv7 (option `as_uuid`)
- [ ] Séquences monotones
- [ ] Seed personnalisés
- [ ] Quotas d’utilisation ou API keys
- [ ] Mini dashboard personnel
