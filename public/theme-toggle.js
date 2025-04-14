function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('ulidDarkMode', isLight ? 'light' : 'dark');
  }
  
  // Appliquer le mode au chargement
  const saved = localStorage.getItem('ulidDarkMode');
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (saved === 'light' || (!saved && !prefersDark)) {
    document.body.classList.add('light-mode');
  }
  