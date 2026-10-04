(() => {
  const icon = (name, cls = 'nav-icon') => {
    const paths = {
      home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-13a4 4 0 0 1 0 8m4 5v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
      wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18m-5 5h2"/><path d="M5 5V4a2 2 0 0 1 2-2h11"/>',
      chart: '<path d="M3 3v18h18M8 15l4-4 4 3 5-7"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      arrow: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
      launcher: '<path d="M15 3h6v6m-11 5 11-11M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
      clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1m-7 5h8m-8 4h8m-8 4h5"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6m-11 5h6m-6 4h6"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      code: '<path d="m8 17-5-5 5-5m8 10 5-5-5-5m-2-3-4 16"/>',
    };
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
  };
  const link = (item) => {
    const active = new URL(item.path, window.location.href).pathname === window.location.pathname;
    return `<a class="nav-link${active ? ' active' : ''}" href="${item.path}"${active ? ' aria-current="page"' : ''}>${icon(item.icon)}<span>${item.label}</span></a>`;
  };
  const groups = [
    { label: 'Patient Access', icon: 'users', items: [
      ['Patients', 'patients/', 'clipboard'], ['Direct Billing Enrollment', 'direct-billing.html', 'wallet'], ['Appointments', 'appointments.html', 'calendar'], ['Check-in & Arrival', 'check-in.html', 'check'], ['Eligibility Request', 'eligibility-request.html', 'file'], ['Eligibility History', 'eligibility-history.html', 'chart'],
    ] },
    { label: 'Clinical and Coding', icon: 'heart', items: [['Clinical Charting', 'charting.html', 'clipboard'], ['Medical Coding', 'medical-coding.html', 'code']], folder: 'clinical-coding' },
    { label: 'Financial and Billing', icon: 'wallet', items: [['Pre-Authorization', 'pre-authorization.html', 'check'], ['Encounter Billing', 'encounter-billing.html', 'file'], ['Patient Billing B2C', 'patient-billing.html', 'wallet'], ['Insurance Claims B2B', 'insurance-claims.html', 'file']], folder: 'rcm-billing' },
    { label: 'Reports', icon: 'chart', items: [['Operational Reports', 'operational.html', 'chart'], ['VAT Reporting', 'vat-reporting.html', 'file'], ['Employee Report', 'employee-report.html', 'users']], folder: 'reports' },
  ];
  const current = document.body.dataset.page;
  const title = document.body.dataset.title;
  const rootPath = document.body.dataset.root || '../';
  const currentFolder = document.body.dataset.folder || '';
  const facilityBase = document.body.dataset.facilityBase || './';
  const url = (folder, filename) => `${facilityBase}${folder ? `${folder}/` : ''}${filename}`;
  const directBillingKey = `rcm-facility-direct-billing:v1:${document.body.dataset.currentFacilityId || '1'}`;
  const isDirectBillingEnabled = () => {
    try { const saved = localStorage.getItem(directBillingKey); return saved === null ? true : saved === 'true'; }
    catch { return true; }
  };
  let directBillingEnabled = isDirectBillingEnabled();
  if (!directBillingEnabled && current === 'patient-access/direct-billing.html') window.location.replace(url('', 'home.html'));
  const topLink = (name, folder, filename, ico) => ({ label: name, icon: ico, path: url(folder, filename) });
  const home = topLink('Home', '', 'home.html', 'home');
  const dashboard = topLink('Dashboard', '', 'dashboard.html', 'grid');
  const setting = topLink('Settings', 'settings', 'index.html', 'settings');

  const sidebar = document.querySelector('#sidebar-container');
  const topbar = document.querySelector('#topbar-container');
  const childrenHtml = (group) => {
    const folder = group.folder || 'patient-access';
    const items = group.items.filter(([label]) => label !== 'Direct Billing Enrollment' || directBillingEnabled).map(([label, file, ico]) => link({ label, icon: ico, path: url(folder, file) })).join('');
    const open = folder === currentFolder || group.items.some(([, file]) => `${folder}/${file}` === current);
    return `<section class="nav-group"><button class="nav-group-button" type="button" aria-expanded="${open}" aria-controls="group-${folder}">${icon(group.icon)}<span>${group.label}</span>${icon('chevron', 'chevron')}</button><div id="group-${folder}" class="nav-children"${open ? '' : ' hidden'}>${items}</div></section>`;
  };
  const renderSidebar = () => {
    const oldSidebar = sidebar.querySelector('.sidebar');
    const wasCollapsed = oldSidebar?.classList.contains('collapsed') || false;
    sidebar.innerHTML = `<aside class="sidebar${wasCollapsed ? ' collapsed' : ''}" id="facility-sidebar" aria-label="Facility navigation" data-collapsible-sidebar data-sidebar-view="facility"><div class="sidebar-brand"><a class="brand" href="${rootPath}index.html"><span class="brand-mark">${icon('heart', '')}</span><span class="brand-name">RCM SMB Facility<small>Healthcare operations</small></span></a><button class="icon-button sidebar-collapse-toggle" type="button" data-sidebar-toggle aria-expanded="${wasCollapsed ? 'false' : 'true'}" aria-label="${wasCollapsed ? 'Expand' : 'Collapse'} sidebar" title="${wasCollapsed ? 'Expand' : 'Collapse'} sidebar"></button></div><nav class="side-scroll"><div class="nav-caption">Workspace</div>${link(home)}${link(dashboard)}<div class="nav-caption">Operations</div>${groups.map(childrenHtml).join('')}</nav><div class="sidebar-bottom">${link(setting)}</div></aside><div class="scrim" data-scrim></div>`;
    document.querySelector('.app-shell')?.classList.toggle('sidebar-collapsed', wasCollapsed);
  };
  renderSidebar();
  window.addEventListener('storage', (event) => {
    if (event.key !== directBillingKey) return;
    directBillingEnabled = isDirectBillingEnabled();
    if (!directBillingEnabled && current === 'patient-access/direct-billing.html') { window.location.replace(url('', 'home.html')); return; }
    renderSidebar();
  });
  topbar.innerHTML = `<header class="topbar"><div class="topbar-left"><button class="icon-button mobile-menu" type="button" data-menu-toggle aria-label="Open navigation">${icon('grid', '')}</button><a class="launcher-link" href="${rootPath}index.html">← Launcher</a><span class="topbar-divider"></span><span class="context-label">Health Facility View</span></div><div class="topbar-right"><label class="search-box">${icon('search', '')}<input type="search" aria-label="Search navigation" placeholder="Search navigation…"></label><button class="icon-button" type="button" data-theme-toggle aria-label="Toggle theme"></button></div></header>`;
  document.querySelector('[data-breadcrumb-current]').textContent = title;
  const folderLabel = groups.find((group) => group.folder === currentFolder)?.label || (currentFolder === 'patient-access' ? 'Patient Access' : 'Workspace');
  const breadcrumbParent = document.querySelector('[data-breadcrumb-parent]');
  if (currentFolder) {
    breadcrumbParent.textContent = folderLabel;
    breadcrumbParent.hidden = false;
    document.querySelector('[data-breadcrumb-parent-separator]').hidden = false;
  }

  document.addEventListener('click', (event) => {
    const groupButton = event.target.closest('.nav-group-button');
    if (groupButton) {
      const expanded = groupButton.getAttribute('aria-expanded') === 'true';
      groupButton.setAttribute('aria-expanded', String(!expanded));
      document.getElementById(groupButton.getAttribute('aria-controls')).hidden = expanded;
    }
    const menuButton = event.target.closest('[data-menu-toggle]');
    const side = document.querySelector('.sidebar');
    const scrim = document.querySelector('[data-scrim]');
    if (menuButton) { side.classList.add('open'); scrim.classList.add('visible'); }
    if (event.target.closest('[data-scrim]') || (event.target.closest('.nav-link') && window.innerWidth <= 850)) { side.classList.remove('open'); scrim.classList.remove('visible'); }
  });
  const search = document.querySelector('.search-box input');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    document.querySelectorAll('.nav-link').forEach((navLink) => { navLink.hidden = query && !navLink.textContent.toLowerCase().includes(query); });
    document.querySelectorAll('.nav-group').forEach((group) => {
      const children = group.querySelector('.nav-children');
      const match = [...group.querySelectorAll('.nav-link')].some((navLink) => !navLink.hidden);
      const button = group.querySelector('.nav-group-button');
      if (query) { children.hidden = !match; button.setAttribute('aria-expanded', String(match)); }
      else {
        const expanded = children.contains(document.querySelector('.nav-link.active'));
        children.hidden = !expanded;
        button.setAttribute('aria-expanded', String(expanded));
      }
    });
  });
})();
