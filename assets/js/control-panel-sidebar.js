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
  const organizations = [
    { en: 'Al Noor Healthcare Group', ar: 'مجموعة النور للرعاية الصحية', plan: 'Enterprise', status: 'Active' },
    { en: 'Riyadh Medical Network', ar: 'شبكة الرياض الطبية', plan: 'Growth', status: 'Active' },
    { en: 'Al Shifa Clinics', ar: 'عيادات الشفاء', plan: 'Standard', status: 'Onboarding' },
    { en: 'GulfCare Hospitals', ar: 'مستشفيات جلف كير', plan: 'Enterprise', status: 'Suspended' },
    { en: 'Amana Health Services', ar: 'خدمات أمانة الصحية', plan: 'Growth', status: 'Deleted' },
  ];
  const organizationsGrid = document.querySelector('[data-control-organizations-grid]');
  if (organizationsGrid) {
    organizationsGrid.innerHTML = `<div class="organization-grid-heading"><div><h2>Customer Organizations</h2><p>${organizations.length} organizations</p></div></div><div class="organization-grid-scroll"><table class="organization-table"><thead><tr><th scope="col">Organization Name (en)</th><th scope="col">Organization Name (ar)</th><th scope="col">Subscription Plan</th><th scope="col">Status</th></tr></thead><tbody>${organizations.map((organization) => `<tr><td class="organization-name-en">${organization.en}</td><td class="organization-name-ar" lang="ar" dir="rtl">${organization.ar}</td><td>${organization.plan}</td><td><span class="organization-status status-${organization.status.toLowerCase()}"><span aria-hidden="true"></span>${organization.status}</span></td></tr>`).join('')}</tbody></table></div>`;
  }

  const updateSelection = () => {
    const requested = window.location.hash.slice(1) || 'overview';
    const activeLink = links.find((item) => item.dataset.controlRoute === requested) || links.find((item) => item.dataset.controlRoute === 'overview');
    const route = activeLink.dataset.controlRoute;
    const label = activeLink.dataset.controlLabel;
    if (!window.location.hash || route !== requested) history.replaceState(null, '', `#${route}`);

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
    const showOrganizations = route === 'organizations';
    document.querySelector('[data-control-placeholder]').hidden = showOrganizations;
    organizationsGrid.hidden = !showOrganizations;
    document.querySelector('.workspace').classList.toggle('workspace-organizations', showOrganizations);
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
