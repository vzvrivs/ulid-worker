# ULID Worker

✨ Un projet personnel autour des ULID, propulsé par Cloudflare Workers.

---

## 📦 Présentation

Ce projet a deux objectifs principaux :

1. **Générer des ULID** (Universally Unique Lexicographically Sortable Identifiers)
2. **Analyser, documenter et expérimenter avec leur structure et leurs usages**

Il est né dans le cadre d’un autre projet nommé [PlayPal](#), avant de devenir une entité indépendante dédiée à la compréhension et à la manipulation des ULID.

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
> _“Where data meets drama.”_ – *Emotive Protocols*

---

## 📝 Licence

À définir.
