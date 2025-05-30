# Changelog

Toutes les modifications notables du projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
et le projet respecte [Semantic Versioning](https://semver.org/lang/fr/).

---

## [0.5.2] – À venir (2025-05-31)

### Modifié
- Nettoyage du code HTML/JS de plusieurs pages.
- Corrections mineures sur l’accueil, la page d’aide et la documentation.

---

## [0.5.1] - 2025-05-19

### Ajouté

- Nouvelle page pour ajouter et gérer des thèmes personnalisés :
  - Upload local avec stockage via `localStorage`.
  - Collection de thèmes prêts à l’emploi.

### Modifié

- Réactivation complète et enrichie du système de logs :
  - Espaces KV différenciés dev/prod.
  - Recherche par terme ou date.
  - Affichage du nombre total de logs.
  - Navigation entre pages de logs.
  - Export JSON de la page courante.
  - Suppression complète avec sécurité.
- Mutualisation des fonctions ULID (génération et vérification) entre Playground et Music via `helpers.js`.
- Unification des boutons "Maintenant" et de l’affichage humanisé des dates.
- Réorganisation technique :
  - Intégration directe du JS du Playground dans son HTML.
  - Suppression du fichier `navbar.css`, CSS intégré.
  - `/debug/logs` est désormais servi en statique.
  - Ajout de la navbar aux pages `/help`, `/docs` et `/debug/logs`.
- Optimisation et finalisation de la page Music après la version 0.5.0 (détails devaient venir, mais flemme).

---

## [0.5.0] – 2025-05-12

### Ajouté

#### Page Music

- Refonte complète de la page.
- Sélection d’un ULID pour la génération musicale :
  - aléatoire, "maintenant" (par défaut), ou saisi manuellement.
- Vérification automatique de la conformité de l’ULID.
- Génération de rythmes et de notes pseudo-aléatoires à partir de l’ULID.
- Affichage du processus de calcul rythmique.
- Affichage du tableau de lecture des notes.
- Génération de partitions musicales avec surlignage de la note en cours.
- Section explicative décrivant toute la démarche de génération.

#### Page Matrix

- Intégration de la page Matrix dans le design global du site avec navbar.
- Réécriture du moteur d’affichage :
  - Élimination des résidus gris après les traînées.
  - Réduction de la consommation CPU.
- Ajout de contrôles interactifs (boutons discrets sous la navbar) :
  - Plein écran (P), Pause (Espace), Mode (M), Vitesse max (S), Aide (H).
- Intégration des raccourcis clavier pour tous les contrôles.
- Optimisations finales du moteur Matrix : meilleure fluidité, corrections graphiques mineures.

---

## [0.4.0] – 2025-05-02

### Ajouté

- Rétablissement du toggle clair/sombre avec détection dynamique du thème de l’environnement.
- Prise en charge du changement de thème système en temps réel.
- Rétablissement des logs :
  - `/logs` : page HTML ou JSON brut selon l’en-tête `Accept`.
  - `/debug/logs` : dashboard HTML interactif avec tri par colonne.
- Refonte de la navbar :
  - sticky, effet de transparence, logo animé, burger menu responsive.

---

## [0.3.0] – 2025-04-28

### Ajouté

- Finalisation du Playground avec toutes les fonctionnalités prévues.
- Sélection du format de timestamp personnalisé avec aperçu humanisé.
- Génération avec choix et ordre des types de valeurs.
- Boutons minify/beautify pour Générateur et Autofill.
- Téléchargement respectant l’état beautifié/minifié.

### Modifié

- Correction du bug du premier ULID monotone.
- Téléchargement avec regroupement par type.
- Vérificateur déplacé et amélioré (affiche la date humanisée).

### Supprimé

- Champs "Préfixe" et "Suffixe".
- Sélection du type de fichier dans Autofill (JSON uniquement).

---

## [0.2.0] – 2025-04-20

### Ajouté

- Mise en place du Playground interactif.
- Générateur de timestamp commun, ULID monotone, Autofill JSON.

---

## [0.1.0] – 2025-04-12

### Ajouté

- Déploiement initial du Worker ULID simple avec génération via API.
- Première documentation en ligne.
