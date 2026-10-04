(() => {
  const navigation = document.querySelector('#control-panel-navigation');
  if (!navigation) return;

  const menu = [
    { label: 'Overview', icon: 'overview' },
    { label: 'Customers', icon: 'customers', items: ['Organizations', 'Onboarding'] },
    { label: 'Plans & Packages', icon: 'packages', items: ['Packages', 'Features Catalog', 'Add-on'] },
    { label: 'Billing', icon: 'billing', items: ['Subscriptions', 'Invoices'] },
    { label: 'Platform', icon: 'platform' },
  ];
  const iconPaths = {
    overview: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    customers: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-13a4 4 0 0 1 0 8m4 5v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
    packages: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5M12 8v5"/>',
    billing: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18m-13 5h4M7 3h10"/>',
    platform: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="5"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
  };
  const icon = (name, extraClass = '') => `<svg class="nav-icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ''}</svg>`;
  const slug = (label) => label.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const link = (label, route, iconName = '') => `<a class="nav-link" data-control-route="${route}" data-control-label="${label}" href="#${route}" aria-label="${label}" title="${label}">${iconName ? icon(iconName) : '<span class="nav-icon" aria-hidden="true"></span>'}<span>${label}</span></a>`;

  navigation.innerHTML = '<div class="nav-caption">Control Panel</div>' + menu.map((entry, index) => {
    if (!entry.items) return link(entry.label, slug(entry.label), entry.icon);
    const groupId = `control-panel-group-${index}`;
    const children = entry.items.map((label) => link(label, slug(label))).join('');
    return `<section class="nav-group"><button class="nav-group-button" type="button" aria-label="${entry.label}" title="${entry.label}" aria-expanded="false" aria-controls="${groupId}">${icon(entry.icon)}<span>${entry.label}</span><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths.chevron}</svg></button><div class="nav-children" id="${groupId}" hidden>${children}</div></section>`;
  }).join('');

  const links = [...navigation.querySelectorAll('[data-control-route]')];
  const seedOrganizations = [
    { id: 'org-1', en: 'Al Noor Healthcare Group', ar: 'مجموعة النور للرعاية الصحية', plan: 'Enterprise', status: 'Active' },
    { id: 'org-2', en: 'Riyadh Medical Network', ar: 'شبكة الرياض الطبية', plan: 'Growth', status: 'Active' },
    { id: 'org-3', en: 'Al Shifa Clinics', ar: 'عيادات الشفاء', plan: 'Standard', status: 'Onboarding' },
    { id: 'org-4', en: 'GulfCare Hospitals', ar: 'مستشفيات جلف كير', plan: 'Enterprise', status: 'Suspended' },
    { id: 'org-5', en: 'Amana Health Services', ar: 'خدمات أمانة الصحية', plan: 'Growth', status: 'Deleted' },
  ];
  let organizations = seedOrganizations;
  try {
    const savedOrganizations = JSON.parse(localStorage.getItem('xocialive-control-panel-organizations') || 'null');
    if (Array.isArray(savedOrganizations)) organizations = savedOrganizations;
  } catch { /* Keep the seeded organizations if browser storage is unavailable. */ }
  const organizationSections = [
    { label: 'Profile', route: 'profile' },
    { label: 'Subscription & Billing', route: 'subscription-billing' },
    { label: 'Entitlements & Features', route: 'entitlements-features' },
    { label: 'Integrations', route: 'integrations' },
    { label: 'Facilities', route: 'facilities' },
    { label: 'Admin Users', route: 'admin-users' },
  ];
  const operationsSections = [
    { label: 'Usage', route: 'usage' },
    { label: 'Audit', route: 'audit' },
  ];
  const contextSidebar = document.querySelector('#organization-focus-sidebar');
  const focusBack = document.querySelector('[data-control-focus-back]');
  const shell = document.querySelector('.app-shell');
  const sidebarControls = window.rcmSidebarControls?.['control-panel'];
  let wasCollapsedBeforeFocus = false;
  let inOrganizationFocus = false;
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const persistOrganizations = () => {
    try { localStorage.setItem('xocialive-control-panel-organizations', JSON.stringify(organizations)); } catch { /* Keep the current session usable without browser storage. */ }
  };
  const organizationsGrid = document.querySelector('[data-control-organizations-grid]');
  let organizationRows;
  let organizationCount;
  const renderOrganizationRows = () => {
    const values = Object.fromEntries([...organizationsGrid.querySelectorAll('[data-control-org-filter]')].map((field) => [field.dataset.controlOrgFilter, field.value.trim().toLocaleLowerCase()]));
    const filtered = organizations.filter((organization) => {
      return (!values.en || organization.en.toLocaleLowerCase().includes(values.en))
        && (!values.ar || organization.ar.toLocaleLowerCase().includes(values.ar))
        && (!values.plan || organization.plan.toLocaleLowerCase() === values.plan)
        && (!values.status || organization.status.toLocaleLowerCase() === values.status);
    });
    organizationRows.innerHTML = filtered.map((organization) => `<tr><td class="organization-name-en"><a class="organization-focus-link" href="#organizations/${encodeURIComponent(organization.id)}/profile">${escapeHtml(organization.en)}</a></td><td class="organization-name-ar" lang="ar" dir="rtl">${escapeHtml(organization.ar || '—')}</td><td>${escapeHtml(organization.plan || '—')}</td><td><span class="organization-status status-${escapeHtml(organization.status.toLowerCase())}"><span aria-hidden="true"></span>${escapeHtml(organization.status)}</span></td></tr>`).join('');
    organizationsGrid.querySelector('[data-control-org-empty]').hidden = filtered.length > 0;
    organizationCount.textContent = `${filtered.length} of ${organizations.length} organizations`;
  };
  if (organizationsGrid) {
    organizationsGrid.innerHTML = `<div class="organization-toolbar"><button class="button button-primary" type="button" data-control-add-organization><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add Organization</button></div><div class="facility-filter-grid organization-filter-grid" aria-label="Organization filters"><label class="facility-filter"><span>Organization Name (en)</span><input type="search" data-control-org-filter="en" placeholder="Search English name"></label><label class="facility-filter"><span>Organization Name (ar)</span><input type="search" data-control-org-filter="ar" placeholder="Search Arabic name"></label><label class="facility-filter"><span>Subscription Plan</span><select data-control-org-filter="plan"><option value="">All plans</option>${[...new Set(organizations.map((item) => item.plan).filter(Boolean))].map((plan) => `<option value="${escapeHtml(plan.toLowerCase())}">${escapeHtml(plan)}</option>`).join('')}</select></label><label class="facility-filter"><span>Status</span><select data-control-org-filter="status"><option value="">All statuses</option><option>Active</option><option>Onboarding</option><option>Suspended</option><option>Deleted</option></select></label></div><div class="organization-grid-card"><div class="organization-grid-heading"><p data-control-org-count></p></div><div class="organization-grid-scroll"><table class="organization-table"><thead><tr><th scope="col">Organization Name (en)</th><th scope="col">Organization Name (ar)</th><th scope="col">Subscription Plan</th><th scope="col">Status</th></tr></thead><tbody data-control-org-rows></tbody></table><div class="organization-grid-empty" data-control-org-empty hidden>No organizations match these filters.</div></div></div>`;
    organizationRows = organizationsGrid.querySelector('[data-control-org-rows]');
    organizationCount = organizationsGrid.querySelector('[data-control-org-count]');
    organizationsGrid.addEventListener('input', (event) => { if (event.target.matches('[data-control-org-filter]')) renderOrganizationRows(); });
    organizationsGrid.addEventListener('change', (event) => { if (event.target.matches('[data-control-org-filter]')) renderOrganizationRows(); });
    organizationsGrid.addEventListener('click', (event) => {
      if (!event.target.closest('[data-control-add-organization]')) return;
      organizationModal.hidden = false;
      document.body.classList.add('organization-modal-open');
      organizationForm.reset();
      organizationForm.elements.status.value = 'Onboarding';
      organizationForm.elements.en.focus();
    });
    renderOrganizationRows();
  }

  const organizationModal = document.querySelector('[data-control-organization-modal]');
  const organizationForm = document.querySelector('[data-control-organization-form]');
  const organizationToast = document.querySelector('[data-control-organization-toast]');
  let toastTimer;
  const closeOrganizationModal = () => {
    organizationModal.hidden = true;
    document.body.classList.remove('organization-modal-open');
    organizationsGrid.querySelector('[data-control-add-organization]')?.focus();
  };
  const showOrganizationToast = (message) => {
    organizationToast.textContent = message;
    organizationToast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => organizationToast.classList.remove('is-visible'), 2600);
  };
  organizationModal.querySelector('[data-control-organization-close]').addEventListener('click', closeOrganizationModal);
  organizationModal.querySelector('[data-control-organization-cancel]').addEventListener('click', closeOrganizationModal);
  organizationModal.addEventListener('click', (event) => { if (event.target === organizationModal) closeOrganizationModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !organizationModal.hidden) closeOrganizationModal(); });
  organizationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(organizationForm);
    const sequence = organizations.reduce((max, item) => Math.max(max, Number(item.id.match(/\d+$/)?.[0]) || 0), 0) + 1;
    organizations.push({ id: `org-${sequence}`, en: String(data.get('en') || '').trim(), ar: String(data.get('ar') || '').trim(), plan: String(data.get('plan') || ''), status: String(data.get('status') || 'Onboarding') });
    persistOrganizations();
    for (const filter of organizationsGrid.querySelectorAll('[data-control-org-filter]')) filter.value = '';
    renderOrganizationRows();
    closeOrganizationModal();
    showOrganizationToast('Organization added successfully.');
  });

  function renderOrganizationSidebar(organization, activeRoute) {
    const organizationIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths.customers}</svg>`;
    const itemLink = (item) => `<a class="nav-link${item.route === activeRoute ? ' active' : ''}" href="#organizations/${organization.id}/${item.route}"${item.route === activeRoute ? ' aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true"></span><span>${item.label}</span></a>`;
    const operationIsActive = operationsSections.some((item) => item.route === activeRoute);
    contextSidebar.innerHTML = `<div class="facility-context-brand">${organizationIcon}<div><strong>${escapeHtml(organization.en)}</strong><small>Organization workspace</small></div></div><nav class="side-scroll" aria-label="Organization workspace menu"><div class="nav-caption">Organization</div>${organizationSections.map(itemLink).join('')}<section class="nav-group"><button class="nav-group-button" type="button" aria-expanded="${operationIsActive}" aria-controls="organization-operations-menu"><span class="nav-icon" aria-hidden="true"></span><span>Operations</span><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths.chevron}</svg></button><div class="nav-children" id="organization-operations-menu"${operationIsActive ? '' : ' hidden'}>${operationsSections.map(itemLink).join('')}</div></section></nav>`;
    contextSidebar.hidden = false;
  }

  contextSidebar?.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-group-button');
    if (!button || !contextSidebar.contains(button)) return;
    const children = document.getElementById(button.getAttribute('aria-controls'));
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    children.hidden = !expanded;
  });

  const updateSelection = () => {
    const hashRoute = window.location.hash.slice(1) || 'overview';
    const focusMatch = hashRoute.match(/^organizations\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
    const focusedOrganization = focusMatch ? organizations.find((item) => item.id === focusMatch[1]) : null;
    const focusSection = focusMatch ? [...organizationSections, ...operationsSections].find((item) => item.route === focusMatch[2]) : null;
    const isOrganizationFocus = Boolean(focusedOrganization && focusSection);
    const requested = focusMatch ? 'organizations' : hashRoute;
    const activeLink = links.find((item) => item.dataset.controlRoute === requested) || links.find((item) => item.dataset.controlRoute === 'overview');
    const route = activeLink.dataset.controlRoute;
    const label = activeLink.dataset.controlLabel;
    if (!window.location.hash) history.replaceState(null, '', '#overview');
    else if (focusMatch && !isOrganizationFocus) history.replaceState(null, '', '#organizations');
    else if (!focusMatch && route !== requested) history.replaceState(null, '', `#${route}`);

    links.forEach((item) => {
      const active = item === activeLink;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    navigation.querySelectorAll('.nav-group').forEach((group) => {
      const children = group.querySelector('.nav-children');
      const open = children.contains(activeLink);
      children.hidden = !open;
      group.querySelector('.nav-group-button').setAttribute('aria-expanded', String(open));
    });

    document.querySelector('[data-control-title]').textContent = label;
    document.querySelector('[data-control-breadcrumb]').textContent = label;
    document.querySelector('[data-control-breadcrumb-separator]').hidden = label === 'Overview';
    document.querySelector('[data-control-breadcrumb]').hidden = label === 'Overview';
    document.querySelector('[data-control-subtitle]').textContent = `${label} in the Xocialive Control Panel.`;
    document.querySelector('[data-control-workspace-title]').textContent = `${label} workspace`;
    const showOrganizations = route === 'organizations' && !isOrganizationFocus;
    document.querySelector('[data-control-placeholder]').hidden = showOrganizations;
    organizationsGrid.hidden = !showOrganizations;
    document.querySelector('.workspace').classList.toggle('workspace-organizations', showOrganizations);
    document.querySelector('.minimal-view').classList.toggle('organization-page', showOrganizations);

    const focusCrumb = document.querySelector('[data-control-focus-organization]');
    const focusSectionCrumb = document.querySelector('[data-control-focus-section]');
    const focusSeparator = document.querySelector('[data-control-focus-separator]');
    const focusSectionSeparator = document.querySelector('[data-control-focus-section-separator]');
    if (isOrganizationFocus) {
      if (!inOrganizationFocus) wasCollapsedBeforeFocus = sidebarControls?.isCollapsed() || false;
      inOrganizationFocus = true;
      shell.classList.add('facility-context-open');
      sidebarControls?.setCollapsed(true);
      focusBack.hidden = false;
      focusBack.setAttribute('aria-label', `Return to organizations from ${focusedOrganization.en}`);
      focusCrumb.textContent = focusedOrganization.en;
      focusSectionCrumb.textContent = focusSection.label;
      focusCrumb.hidden = false;
      focusSectionCrumb.hidden = false;
      focusSeparator.hidden = false;
      focusSectionSeparator.hidden = false;
      document.querySelector('[data-control-breadcrumb]').textContent = 'Organizations';
      document.querySelector('[data-control-breadcrumb]').removeAttribute('aria-current');
      focusSectionCrumb.setAttribute('aria-current', 'page');
      document.querySelector('[data-control-title]').textContent = focusSection.label;
      document.querySelector('[data-control-subtitle]').textContent = `${focusedOrganization.en} · Organization`;
      document.querySelector('[data-control-workspace-title]').textContent = `${focusSection.label} workspace`;
      renderOrganizationSidebar(focusedOrganization, focusSection.route);
    } else {
      if (inOrganizationFocus) sidebarControls?.setCollapsed(wasCollapsedBeforeFocus);
      inOrganizationFocus = false;
      shell.classList.remove('facility-context-open');
      contextSidebar.hidden = true;
      contextSidebar.replaceChildren();
      focusBack.hidden = true;
      focusCrumb.hidden = true;
      focusSectionCrumb.hidden = true;
      focusSeparator.hidden = true;
      focusSectionSeparator.hidden = true;
      focusCrumb.textContent = '';
      focusSectionCrumb.textContent = '';
      focusSectionCrumb.removeAttribute('aria-current');
      document.querySelector('[data-control-breadcrumb]').setAttribute('aria-current', 'page');
    }
  };

  navigation.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-group-button');
    if (!button || !navigation.contains(button)) return;
    const children = document.getElementById(button.getAttribute('aria-controls'));
    const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
    navigation.querySelectorAll('.nav-group-button').forEach((other) => {
      const otherChildren = document.getElementById(other.getAttribute('aria-controls'));
      if (other !== button) {
        other.setAttribute('aria-expanded', 'false');
        otherChildren.hidden = true;
      }
    });
    button.setAttribute('aria-expanded', String(shouldOpen));
    children.hidden = !shouldOpen;
  });

  window.addEventListener('hashchange', updateSelection);
  updateSelection();
})();
