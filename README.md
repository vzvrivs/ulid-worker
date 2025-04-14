# ULID Worker

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

✨ Un projet personnel autour des ULID, propulsé par Cloudflare Workers.

---

## 📦 Présentation

Ce projet a deux objectifs principaux :

1. **Générer des ULID** (Universally Unique Lexicographically Sortable Identifiers)
2. **Analyser, documenter et expérimenter avec leur structure et leurs usages**

Il est né dans le cadre d’un autre projet nommé PlayPal(#), avant de devenir une entité indépendante dédiée à la compréhension et à la manipulation des ULID.

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
| `/ulid`             | Génération ULID                          |
| `/ulid?conform=...` | Analyse de conformité                    |
| `/autofill` (POST)  | Remplit tous les champs `_uid:null`      |
| `/`                 | Interface web interactive                |

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
