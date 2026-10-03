(() => {
  const shell = document.querySelector('.app-shell');
  const sidebar = document.querySelector('[data-collapsible-sidebar]');
  const toggle = document.querySelector('[data-sidebar-toggle]');
  if (!shell || !sidebar || !toggle) return;

  const view = sidebar.dataset.sidebarView || 'facility';
  const storageKey = `rcm-sidebar:${view}:collapsed`;
  const panelIcon = (collapsed) => {
    const action = collapsed
      ? '<path d="m13 9 3 3-3 3"/>'
      : '<path d="m16 9-3 3 3 3"/>';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="1.8"/><path d="M9 4.5v15"/>${action}</svg>`;
  };
  const closePopovers = () => {
    sidebar.querySelectorAll('.nav-children.is-popover').forEach((menu) => {
      menu.classList.remove('is-popover');
      menu.hidden = true;
      const button = menu.previousElementSibling;
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  };
  const setCollapsed = (collapsed, persist = true) => {
    shell.classList.toggle('sidebar-collapsed', collapsed);
    sidebar.classList.toggle('collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    toggle.innerHTML = panelIcon(collapsed);
    if (!collapsed) closePopovers();
    if (persist) {
      try { localStorage.setItem(storageKey, String(collapsed)); } catch { /* Keep the current page usable without storage. */ }
    }
  };

  window.rcmSidebarControls = window.rcmSidebarControls || {};
  window.rcmSidebarControls[view] = {
    setCollapsed: (collapsed) => setCollapsed(Boolean(collapsed)),
    isCollapsed: () => sidebar.classList.contains('collapsed'),
  };

  let initiallyCollapsed = false;
  try { initiallyCollapsed = localStorage.getItem(storageKey) === 'true'; } catch { /* Storage is optional. */ }
  setCollapsed(initiallyCollapsed, false);
  sidebar.querySelectorAll('.nav-link, .nav-group-button').forEach((item) => {
    const label = item.querySelector('span:not(.nav-icon)')?.textContent?.trim() || item.getAttribute('aria-label');
    if (label) item.setAttribute('title', label);
  });

  toggle.addEventListener('click', () => setCollapsed(!sidebar.classList.contains('collapsed')));
  // Capture collapsed group clicks before the page's normal accordion handler.
  document.addEventListener('click', (event) => {
    const groupButton = event.target.closest('.nav-group-button');
    if (groupButton && sidebar.contains(groupButton) && sidebar.classList.contains('collapsed')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const menu = document.getElementById(groupButton.getAttribute('aria-controls'));
      const wasOpen = menu.classList.contains('is-popover');
      closePopovers();
      if (!wasOpen) {
        const rect = groupButton.getBoundingClientRect();
        menu.hidden = false;
        menu.classList.add('is-popover');
        menu.style.top = `${Math.max(8, Math.min(rect.top, window.innerHeight - 360))}px`;
        groupButton.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    if (sidebar.classList.contains('collapsed')) {
      if (event.target.closest('.nav-children.is-popover .nav-link')) closePopovers();
      else if (!event.target.closest('.nav-children.is-popover')) closePopovers();
    }
  }, true);

  document.addEventListener('click', (event) => {
    const scrim = document.querySelector('[data-scrim]');
    if (event.target.closest('[data-menu-toggle]')) {
      sidebar.classList.add('open');
      scrim?.classList.add('visible');
    }
    if (event.target.closest('[data-scrim]') || (event.target.closest('.nav-link') && window.innerWidth <= 850)) {
      sidebar.classList.remove('open');
      scrim?.classList.remove('visible');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePopovers();
  });
})();
