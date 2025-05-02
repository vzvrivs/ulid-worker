<!-- markdownlint-disable MD024 -->

# Changelog

Toutes les modifications notables du projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
et le projet respecte [Semantic Versioning](https://semver.org/lang/fr/).

---

## [0.4.0] – 2025-05-02

### Ajouté

- **Thème**
  - Rétablissement du toggle clair/sombre.
  - Suppression du stockage local du thème → détection dynamique du thème de l’environnement.
  - Prise en charge des changements de thème en temps réel.

- **Logs**
  - Rétablissement des logs.
  - `/logs` : page HTML minimaliste ou JSON brut selon l’en-tête `Accept`.
  - `/debug/logs` : dashboard HTML interactif avec tri inverse par défaut et tri par colonne.

- **Navbar**
  - Rétablissement de la navbar avec effet de transparence, sticky, logo animé discrètement.
  - Adaptation mobile avec burger menu et affichage vertical des éléments.

### Modifié

- Amélioration globale de l’interface et de l’expérience utilisateur.

---

## [0.3.0] – 2025-04-28

### Ajouté

- Finalisation du Playground : toutes les fonctionnalités souhaitées sont intégrées.
- Sélection du format de timestamp personnalisé (ISO 8601, UNIX, Crockford) avec aperçu humanisé.
- Génération de données avec choix et ordre des types (`t`, `ts`, `ulid`, `bin`).
- Génération d'objets ou de primitives selon les types sélectionnés.
- Boutons pour minifier ou beautifier les sorties (Générateur et Autofill).
- Téléchargement respectant l'état beautifié/minifié sélectionné.
- Refonte de l'interface des boutons dans le Playground.
- Helpers JavaScript centralisés dans `helpers.js`.

### Modifié

- Correction du bug de génération d'ULID monotone (premier ULID désormais correctement monotone).
- Téléchargement par type de valeur dans les formats autres que JSON.
- Le Vérificateur ULID affiche désormais la date humanisée si valide.

### Supprimé

- Suppression des champs "Préfixe" et "Suffixe" inutiles dans le Playground.
- Suppression de la case "Beautify" au profit des boutons séparés.
- Suppression de la sélection de type de fichier dans Autofill (JSON uniquement).

---

## [0.2.0] – 2025-04-20

### Ajouté

- Mise en place du premier Playground interactif : générateur de timestamp commun, ULID monotone, Autofill JSON.

---

## [0.1.0] – 2025-04-12

### Ajouté

- Déploiement initial du Worker ULID simple avec génération d'ULID standards via API.
- Première documentation basique en ligne.
