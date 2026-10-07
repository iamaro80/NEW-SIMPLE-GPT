(() => {
  const shell = document.querySelector('.app-shell');
  const organizationSidebar = document.querySelector('[data-sidebar-view="organization"]');
  const contextSidebar = document.querySelector('#facility-context-sidebar');
  const backLink = document.querySelector('[data-organization-context-back]');
  const detail = document.querySelector('[data-organization-facility-detail]');
  const placeholder = document.querySelector('[data-facility-section-placeholder]');
  const title = document.querySelector('[data-org-title]');
  const subtitle = document.querySelector('[data-org-subtitle]');
  const breadcrumb = document.querySelector('[data-org-breadcrumb]');
  const contextCrumb = document.querySelector('[data-facility-context-crumb]');
  const contextCrumbSeparator = document.querySelector('[data-facility-context-crumb-separator]');
  const profileContent = document.querySelector('[data-facility-profile-content]');
  const frameWrap = document.querySelector('[data-facility-entity-frame-wrap]');
  const facilityFrame = document.querySelector('[data-facility-entity-frame]');
  if (!shell || !organizationSidebar || !contextSidebar || !detail || !window.RcmFacilityStore) return;

  const sections = [
    { label: 'Facility Profile', route: 'facility-profile' },
    { label: 'Branches', route: 'branches' },
    { label: 'Departments', route: 'departments' },
    { label: 'Locations', route: 'locations' },
    { label: 'Rooms', route: 'rooms' },
    { label: 'Billing Period', route: 'billing-period' },
    { label: 'Cost Centers', route: 'cost-centers' },
    { label: 'Consultation Rules', route: 'consultation-rules' },
  ];
  let inFacilityFocus = false;
  let embeddedPageKey = '';
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icon = '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M8 9h.01M12 9h.01M16 9h.01"/></svg>';
  const separator = '<svg class="breadcrumb-sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  function setOrganizationSidebarCollapsed(collapsed) {
    const controls = window.rcmSidebarControls?.organization;
    if (controls) {
      controls.setCollapsed(collapsed);
      return;
    }
    const currentlyCollapsed = organizationSidebar.classList.contains('collapsed');
    if (currentlyCollapsed !== collapsed) organizationSidebar.querySelector('[data-sidebar-toggle]')?.click();
  }
  const groups = [
    { title: 'Facilities Information', fields: [
      ['Facility Identifier', 'facilityIdentifier'], ['HCP', 'hcp'], ['Arabic Name', 'arabicName', 'rtl'], ['English Name', 'englishName'],
      ['Contact Name', 'contactName'], ['Email', 'email'], ['Phone Number', 'phone'], ['Ext.', 'extension'], ['Mobile Number', 'mobile'],
      ['License Number', 'licenseNumber'], ['License Start', 'licenseStart'], ['License End', 'licenseEnd'], ['CHI ID', 'chiId'],
      ['Unified ID', 'unifiedId'], ['VAT Number', 'vatNumber'], ['CR Number', 'crNumber'], ['NHIC Number', 'nhicNumber'], ['Facility Category', 'category'],
    ] },
    { title: 'Address', fields: [
      ['Country', 'country'], ['City', 'city'], ['District', 'district'], ['Building Number', 'buildingNumber'],
      ['Street Name', 'streetName'], ['Postal Code', 'postalCode'], ['Additional Number', 'additionalNumber'],
    ] },
    { title: 'Facility Configurations', fields: [
      ['Episode Expiry Time', 'episodeExpiry'], ['Is Auto Authorization Process', 'autoAuthorization'],
      ['Invoice Configurations English', 'invoiceConfigEnglish'], ['Invoice Configurations Arabic', 'invoiceConfigArabic', 'rtl'],
      ['Background Color', 'backgroundColor'], ['Foreground Color', 'foregroundColor'],
    ] },
    { title: 'ZATCA Details', fields: [['Organization Id', 'zatcaOrganizationId'], ['Invoice Book', 'zatcaInvoiceBook']] },
  ];

  function displayValue(facility, field) {
    if (field === 'phone') return facility.phone || '—';
    if (field === 'mobile') return facility.mobileLocal ? `${facility.mobileCountryCode || '+966'} ${facility.mobileLocal}` : '—';
    if (field === 'autoAuthorization') return facility.autoAuthorization ? 'Yes' : 'No';
    const value = facility[field];
    return value === undefined || value === null || value === '' ? '—' : value;
  }

  function renderProfile(facility) {
    document.querySelector('[data-facility-profile-name]').textContent = facility.englishName;
    document.querySelector('[data-facility-profile-id]').textContent = `Facility Identifier ${facility.facilityIdentifier} · ${facility.active ? 'Active' : 'Inactive'}`;
    profileContent.innerHTML = groups.map((group) => `<section class="facility-profile-data-section"><h3>${escapeHtml(group.title)}</h3><dl>${group.fields.map(([label, key, direction]) => {
      const value = displayValue(facility, key);
      const color = key === 'backgroundColor' || key === 'foregroundColor';
      const output = color && value !== '—' ? `<span class="facility-color-swatch" style="--facility-swatch:${escapeHtml(value)}"></span>${escapeHtml(value)}` : escapeHtml(value);
      return `<div><dt>${escapeHtml(label)}</dt><dd${direction ? ' dir="rtl"' : ''}>${output}</dd></div>`;
    }).join('')}</dl></section>`).join('');
  }

  function setSectionContent(facility, section) {
    const isProfile = section.route === 'facility-profile';
    const embeddedRoutes = new Set(['branches', 'departments', 'locations', 'rooms', 'billing-period', 'cost-centers', 'consultation-rules']);
    const useEmbeddedPage = embeddedRoutes.has(section.route);
    detail.hidden = !isProfile;
    placeholder.hidden = isProfile || useEmbeddedPage;
    frameWrap.hidden = !useEmbeddedPage;
    if (isProfile) {
      embeddedPageKey = '';
      facilityFrame.src = 'about:blank';
      renderProfile(facility);
      return;
    }
    if (useEmbeddedPage) {
      const key = `${facility.id}:${section.route}`;
      facilityFrame.title = `${section.label} for ${facility.englishName}`;
      frameWrap.setAttribute('aria-label', `${section.label} for ${facility.englishName}`);
      if (key !== embeddedPageKey) {
        embeddedPageKey = key;
        const url = new URL('../facility/settings/index.html', window.location.href);
        url.searchParams.set('embed', 'organization');
        url.searchParams.set('facilityId', String(facility.id));
        url.hash = section.route;
        facilityFrame.src = url.href;
      }
      syncEmbeddedTheme();
      return;
    }
    embeddedPageKey = '';
    facilityFrame.src = 'about:blank';
    document.querySelector('[data-facility-placeholder-title]').textContent = `${section.label} workspace`;
    document.querySelector('[data-facility-placeholder-description]').textContent = `${section.label} setup for ${facility.englishName} is ready for buildout.`;
  }

  function syncEmbeddedTheme() {
    if (!facilityFrame?.contentWindow || facilityFrame.hidden) return;
    facilityFrame.contentWindow.postMessage({
      type: 'rcm:theme',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    }, window.location.origin);
  }

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== facilityFrame.contentWindow) return;
    if (event.data?.type !== 'rcm:facility-embed-size') return;
    const height = Number(event.data.height);
    if (!Number.isFinite(height) || height < 1) return;
    facilityFrame.style.height = `${Math.min(Math.max(Math.ceil(height), 1), 20000)}px`;
  });

  function renderContextSidebar(facility, activeRoute) {
    contextSidebar.innerHTML = `<div class="facility-context-brand">${icon}<div><strong>${escapeHtml(facility.englishName)}</strong><small>Facility Setup</small></div></div><nav class="side-scroll" aria-label="Facility setup menu"><div class="nav-caption">Facility Setup</div>${sections.map((section) => `<a class="nav-link${section.route === activeRoute ? ' active' : ''}" href="#facilities/${facility.id}/${section.route}"${section.route === activeRoute ? ' aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true"></span><span>${section.label}</span></a>`).join('')}</nav>`;
    contextSidebar.hidden = false;
  }

  function clearFocus() {
    shell.classList.remove('facility-context-open');
    contextSidebar.hidden = true;
    contextSidebar.replaceChildren();
    backLink.hidden = true;
    detail.hidden = true;
    placeholder.hidden = true;
    frameWrap.hidden = true;
    facilityFrame.src = 'about:blank';
    embeddedPageKey = '';
    contextCrumb.hidden = true;
    contextCrumbSeparator.hidden = true;
    if (inFacilityFocus) setOrganizationSidebarCollapsed(false);
    inFacilityFocus = false;
  }

  function updateRoute() {
    const match = window.location.hash.slice(1).match(/^facilities\/(\d+)\/([a-z0-9-]+)$/);
    if (!match) {
      clearFocus();
      return;
    }
    const [, id, route] = match;
    const facility = window.RcmFacilityStore.list().find((item) => String(item.id) === id);
    const section = sections.find((item) => item.route === route);
    if (!facility || !section) {
      window.location.hash = '#facilities';
      return;
    }

    shell.classList.add('facility-context-open');
    setOrganizationSidebarCollapsed(true);
    inFacilityFocus = true;
    backLink.href = '#facilities';
    backLink.hidden = false;
    contextCrumb.textContent = facility.englishName;
    contextCrumb.hidden = false;
    contextCrumbSeparator.hidden = false;
    title.textContent = section.label;
    subtitle.textContent = `${facility.englishName} · Facility Setup`;
    breadcrumb.textContent = section.label;
    renderContextSidebar(facility, section.route);
    setSectionContent(facility, section);
  }

  backLink.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.hash = '#facilities';
  });
  document.querySelector('[data-facility-profile-edit]').addEventListener('click', (event) => {
    const id = window.location.hash.slice(1).match(/^facilities\/(\d+)\//)?.[1];
    if (id) document.dispatchEvent(new CustomEvent('rcm:facility-edit', { detail: { id, trigger: event.currentTarget } }));
  });
  window.addEventListener('hashchange', updateRoute);
  window.addEventListener('rcm:facilities-changed', updateRoute);
  facilityFrame.addEventListener('load', syncEmbeddedTheme);
  new MutationObserver(syncEmbeddedTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  updateRoute();
})();
