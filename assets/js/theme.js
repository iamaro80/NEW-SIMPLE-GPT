(() => {
  const root = document.documentElement;
  const view = document.currentScript?.dataset.themeView || 'launcher';
  const storageKey = `rcm-prototype-theme:${view}`;
  const icon = (name) => name === 'sun'
    ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
    : '<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>';
  let theme;
  try {
    theme = localStorage.getItem(storageKey);
    // Preserve the previous shared preference as the initial Facility setting.
    if (!theme && view === 'facility') theme = localStorage.getItem('rcm-prototype-theme');
  } catch { /* Storage may be unavailable in restricted contexts. */ }
  if (!theme) theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const apply = (next) => {
    theme = next;
    root.classList.toggle('dark', theme === 'dark');
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
      button.setAttribute('title', `Switch to ${nextTheme} mode`);
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon(theme === 'dark' ? 'sun' : 'moon')}</svg>`;
    });
    try { localStorage.setItem(storageKey, theme); } catch { /* Theme still applies for this page. */ }
  };
  apply(theme);
  document.addEventListener('DOMContentLoaded', () => apply(theme), { once: true });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-theme-toggle]');
    if (button) apply(theme === 'dark' ? 'light' : 'dark');
  });
})();
