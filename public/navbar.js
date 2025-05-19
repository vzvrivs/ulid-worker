// Applique le thème sélectionné dans localStorage (light/dark custom)
function switchTheme() {
  let themeLight = localStorage.getItem("ulidw-theme-light") || "light";
  let themeDark  = localStorage.getItem("ulidw-theme-dark")  || "dark";
  let current = document.documentElement.getAttribute("data-theme");
  let next = (current === themeDark) ? themeLight : themeDark;
  localStorage.setItem("ulidw-theme-mode", "manual");
  localStorage.setItem("ulidw-theme-last", next);
  document.documentElement.setAttribute("data-theme", next);
  // On relance bien applyTheme pour que le style soit réappliqué
  if (typeof window.applyTheme === "function") window.applyTheme();
}

export function initNavbar() {
  console.log("✅ initNavbar()");

  // 1) Burger toggle
  const btn  = document.getElementById("navbar-toggle");
  const menu = document.getElementById("navbar-mobile");
  btn.addEventListener("click", () => {
    // toggle la classe et récupère l'état
    const isOpen = btn.classList.toggle("open");
    // applique la même valeur au menu
    menu.classList.toggle("open", isOpen);
    // informe l'attribut aria-expanded
    btn.setAttribute("aria-expanded", isOpen);
    // met à jour aria-hidden du menu
    menu.setAttribute("aria-hidden", !isOpen);
  });
  
  // 2) Theme toggle au démarrage + clic
  const html = document.documentElement;
  const toggles = Array.from(
    document.querySelectorAll("#themeToggle, #themeToggleMobile")
  );
  if (!toggles.length) return;    // ✳️ guard clause

  // ➤ Fonction utilitaire pour mettre à jour l'icône de chaque toggle
  function updateIcons(theme) {
    const themeDark = localStorage.getItem("ulidw-theme-dark") || "dark";
    toggles.forEach(el => {
      const icon = el.querySelector(".nav-icon");
      const label = el.querySelector(".nav-label");
      if (!icon || !label) return;
      if (theme === themeDark) {
        icon.textContent  = "☀️";
        label.textContent = "Clair";
      } else {
        icon.textContent  = "🌙";
        label.textContent = "Sombre";
      }
    });
  }
  updateIcons(html.getAttribute("data-theme"));

  // ➤ Au clic, on inverse simplement le data-theme en mémoire
  toggles.forEach(el =>
    el.addEventListener("click", e => {
      e.preventDefault();
      switchTheme();
      // Mets à jour les icônes selon le nouveau thème actif
      const newTheme = document.documentElement.getAttribute("data-theme");
      updateIcons(newTheme);
    })
  );

}
