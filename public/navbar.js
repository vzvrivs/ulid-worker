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

  // icône selon OS
  const osDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  html.setAttribute("data-theme", osDark ? "dark" : "light");

  // ➤ Fonction utilitaire pour mettre à jour l'icône de chaque toggle
  function updateIcons(theme) {
    toggles.forEach(el => {
      const icon = el.querySelector(".nav-icon");
      const label = el.querySelector(".nav-label");
      if (!icon || !label) return;
  
      if (theme === "dark") {
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
      const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      updateIcons(next);
    })
  );

    // 🔔 **NOU: mise à jour si le thème OS change en cours de session
    window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", evt => {
      const sysTheme = evt.matches ? "dark" : "light";
      html.setAttribute("data-theme", sysTheme);
      updateIcons(sysTheme);
    });
}
