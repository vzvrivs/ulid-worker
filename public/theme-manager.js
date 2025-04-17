/**
 * Fichier : theme-manager.js
 * 
 * Ce script gère la définition du thème de l'application.
 * Il offre deux fonctionnalités :
 * 1. toggleDarkMode() – bascule entre les thèmes "light" et "dark".
 * 2. setTheme(themeName) – applique un thème spécifique (light, dark, blue, etc.).
 *
 * Les thèmes sont appliqués en définissant l'attribut data-theme sur l'élément body,
 * et en gérant également la classe "light-mode" pour assurer la compatibilité avec le CSS existant.
 * La valeur du thème est enregistrée dans le localStorage.
 */

// Fonction pour basculer entre les thèmes light et dark
function toggleDarkMode() {
  const body = document.body;
  // Basculer en fonction de la classe existante
  if (body.getAttribute('data-theme') === 'light') {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

// Fonction pour appliquer un thème spécifique
function setTheme(themeName) {
  const body = document.body;
  body.setAttribute('data-theme', themeName);
  localStorage.setItem('ulidTheme', themeName);
  
  // Synchroniser la classe light-mode pour conserver la compatibilité avec le CSS actuel
  if (themeName === 'light') {
    body.classList.add('light-mode');
  } else {
    body.classList.remove('light-mode');
  }
}

// Au chargement, appliquer le thème sauvegardé ou celui par défaut en fonction des préférences système
(function() {
  const savedTheme = localStorage.getItem('ulidTheme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }
})();
