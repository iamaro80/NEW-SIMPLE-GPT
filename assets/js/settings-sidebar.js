(() => {
  const icon = (name, cls = 'nav-icon') => {
    const paths = {
      home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
      building: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 20V8h8v12M3 10h18M10 12h1m2 0h1m-4 3h1m2 0h1"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-13a4 4 0 0 1 0 8m4 5v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
      payer: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18m-5 5h2M7 5V3h10v2"/>',
      shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
      contract: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6m-11 5h6m-6 4h6"/>',
      rules: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
      services: '<path d="M12 3v18m9-9H3"/><circle cx="12" cy="12" r="9"/>',
      his: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 8v8m-4-4h8"/>',
      reference: '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="10" cy="19" r="1"/>',
      audit: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    };
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.reference}</svg>`;
  };
  const sections = [
    { label: 'Facility Setup', icon: 'building', items: ['Facility Profile', 'Branches', 'Departments', 'Divisions', 'Locations', 'Rooms', 'Billing Period', 'Cost Centers'] },
    { label: 'Staff & Access', icon: 'users', items: ['Practitioners', 'Users', 'Roles'] },
    { label: 'Payers Setup', icon: 'payer', items: ['Payers', 'TPAs'] },
    { label: 'Insurance Setup', icon: 'shield', items: ['Policies', 'Plans', 'Benefits'] },
    { label: 'Payer Contracts', icon: 'contract', items: ['Contracts', 'Direct Billing Toggle'] },
    { label: 'Billing Rules', icon: 'rules', items: ['TAT Management', 'Consultation Rules'] },
    { label: 'Services and Pricing', icon: 'services', items: ['Service Items', 'Categories', 'Groups', 'Service Catalog', 'Master Price List', 'Price Lists', 'Premium Pricing', 'Discounts'] },
    { label: 'HIS Management', icon: 'his', items: [] },
    { label: 'Reference Data', icon: 'reference', items: ['Global Dictionary'] },
    { label: 'Audit Log', icon: 'audit', items: [] },
  ];
  const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const routeFor = slug;
  const legacyRoutes = {
    'categories-and-groups': 'categories',
    'master-price-lists': 'master-price-list',
    facility: 'facility-profile',
    'billing-periods': 'billing-period',
  };
  const getSelected = () => decodeURIComponent(location.hash.slice(1));
  const sidebar = document.querySelector('#sidebar-container');
  const topbar = document.querySelector('#topbar-container');
  const rootPath = document.body.dataset.root || '../../';
  const groupMarkup = sections.map((section, index) => {
    if (!section.items.length) {
      return `<a class="nav-link settings-leaf" href="#${routeFor(section.label)}" data-label="${section.label}" data-route="${routeFor(section.label)}">${icon(section.icon)}<span>${section.label}</span></a>`;
    }
    const children = section.items.map((item) => `<a class="nav-link settings-leaf" href="#${routeFor(item)}" data-label="${item}" data-route="${routeFor(item)}"><span class="nav-icon" aria-hidden="true"></span><span>${item}</span></a>`).join('');
    return `<section class="nav-group"><button class="nav-group-button" type="button" aria-expanded="${index === 0}" aria-controls="settings-group-${index}">${icon(section.icon)}<span>${section.label}</span>${icon('chevron', 'chevron')}</button><div id="settings-group-${index}" class="nav-children"${index === 0 ? '' : ' hidden'}>${children}</div></section>`;
  }).join('');

  sidebar.innerHTML = `<aside class="sidebar" id="settings-sidebar" aria-label="Facility settings navigation" data-collapsible-sidebar data-sidebar-view="facility"><div class="sidebar-brand"><a class="brand" href="${rootPath}index.html"><span class="brand-mark">${icon('building', '')}</span><span class="brand-name">Facility Settings<small>Administration</small></span></a><button class="icon-button sidebar-collapse-toggle" type="button" data-sidebar-toggle aria-expanded="true" aria-label="Collapse sidebar" title="Collapse sidebar"></button></div><nav class="side-scroll"><div class="nav-caption">Configuration</div><a class="nav-link settings-leaf" href="#settings" data-label="Settings">${icon('reference')}<span>Settings overview</span></a><div class="settings-divider"></div>${groupMarkup}</nav><div class="sidebar-bottom"><a class="nav-link" href="${rootPath}facility/home.html">${icon('home')}<span>Back to Facility</span></a></div></aside><div class="scrim" data-scrim></div>`;
  topbar.innerHTML = `<header class="topbar"><div class="topbar-left"><button class="icon-button mobile-menu" type="button" data-menu-toggle aria-label="Open settings navigation">${icon('reference', '')}</button><a class="launcher-link" href="${rootPath}facility/home.html">← Facility</a><span class="topbar-divider"></span><span class="context-label">Facility Settings</span></div><div class="topbar-right"><label class="search-box">${icon('search', '')}<input type="search" aria-label="Search settings" placeholder="Search settings…"></label><button class="icon-button" type="button" data-theme-toggle aria-label="Toggle theme"></button></div></header>`;

  const updateSelection = () => {
    const selectedHash = getSelected();
    if (legacyRoutes[selectedHash]) window.history.replaceState(null, '', `#${legacyRoutes[selectedHash]}`);
    const selected = getSelected() || 'settings';
    const matching = [...document.querySelectorAll('.settings-leaf')].find((item) => (item.dataset.route || slug(item.dataset.label)) === selected);
    const label = matching?.dataset.label || 'Settings';
    const showFacilityProfile = matching?.dataset.route === 'facility-profile';
    const showBranches = matching?.dataset.route === 'branches';
    const showDepartments = matching?.dataset.route === 'departments';
    const showFacilityStructure = ['divisions', 'locations', 'rooms', 'billing-period', 'cost-centers'].includes(matching?.dataset.route);
    document.querySelector('[data-current-facility-profile]')?.toggleAttribute('hidden', !showFacilityProfile);
    document.querySelector('[data-branches-grid]')?.toggleAttribute('hidden', !showBranches);
    document.querySelector('[data-departments-grid]')?.toggleAttribute('hidden', !showDepartments);
    document.querySelector('[data-structure-workspace]')?.toggleAttribute('hidden', !showFacilityStructure);
    document.querySelector('[data-settings-overview]')?.toggleAttribute('hidden', showFacilityProfile || showBranches || showDepartments || showFacilityStructure);
    document.querySelectorAll('.settings-leaf').forEach((item) => {
      const active = item === matching;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    document.querySelector('[data-breadcrumb-current]').textContent = label;
    document.querySelector('[data-breadcrumb-current]').hidden = label === 'Settings';
    document.querySelector('[data-breadcrumb-last-separator]').hidden = label === 'Settings';
    document.querySelector('[data-page-title]').textContent = label === 'Settings' ? 'Facility Settings' : label;
    document.querySelector('[data-page-subtitle]').textContent = label === 'Settings'
      ? 'Manage administrative configuration for your facility.'
      : `Configure ${label.toLowerCase()} for your facility.`;
    document.querySelector('[data-workspace-title]').textContent = label === 'Settings' ? 'Settings workspace' : `${label} workspace`;
    const activeGroup = matching?.closest('.nav-children');
    document.querySelectorAll('.nav-children').forEach((group) => {
      const open = group === activeGroup || (!location.hash && group.id === 'settings-group-0');
      group.hidden = !open;
      group.previousElementSibling.setAttribute('aria-expanded', String(open));
    });
  };
  updateSelection();
  window.addEventListener('hashchange', updateSelection);

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-group-button');
    if (button) {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      document.getElementById(button.getAttribute('aria-controls')).hidden = expanded;
    }
    const side = document.querySelector('.sidebar');
    const scrim = document.querySelector('[data-scrim]');
    if (event.target.closest('[data-menu-toggle]')) { side.classList.add('open'); scrim.classList.add('visible'); }
    if (event.target.closest('[data-scrim]') || (event.target.closest('.nav-link') && window.innerWidth <= 850)) {
      side.classList.remove('open');
      scrim.classList.remove('visible');
    }
  });

  const search = document.querySelector('.search-box input');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    document.querySelectorAll('.settings-leaf').forEach((item) => { item.hidden = Boolean(query) && !item.dataset.label.toLowerCase().includes(query); });
    document.querySelectorAll('.nav-group').forEach((group) => {
      const children = group.querySelector('.nav-children');
      const button = group.querySelector('.nav-group-button');
      const matches = [...group.querySelectorAll('.settings-leaf')].some((item) => !item.hidden);
      if (query) { children.hidden = !matches; button.setAttribute('aria-expanded', String(matches)); }
      else updateSelection();
    });
  });
})();
