(() => {
  const navigation = document.querySelector('#organization-navigation');
  if (!navigation) return;

  const menu = [
    { label: 'Overview', icon: 'overview' },
    { label: 'Dashboard', icon: 'dashboard' },
    { label: 'Analytics & Reports', icon: 'analytics' },
    { label: 'Organization Account', icon: 'organization', items: ['Organization Profile', 'Subscription & Plans', 'Modules & Add-Ons', 'Billing'] },
    { label: 'Facilities', icon: 'facilities' },
    { label: 'Cost Centers', icon: 'cost-centers' },
    { label: 'Staff & Access', icon: 'staff', items: ['Practitioners Roster', 'Users', 'Roles'] },
    { label: 'Payers Setup', icon: 'payers', items: ['Payers', 'TPAs'] },
    { label: 'Insurance Setup', icon: 'insurance', items: ['Policies', 'Plans', 'Benefits'] },
    { label: 'Payer Contracts', icon: 'contracts', items: ['Contracts', 'Direct Billing'] },
    { label: 'Billing Rules', icon: 'billing-rules', items: ['TAT Management', 'Consultation Rules'] },
    { label: 'Services and Pricing', icon: 'services', items: ['Service Items', 'Categories', 'Groups', 'Service Catalog', 'Master Price List', 'Price Lists', 'Premium Pricing', { label: 'Discounts', route: 'services-discounts' }] },
    { label: 'HIS Management', icon: 'his' },
    { label: 'Reference Data', icon: 'reference', items: [{ label: 'Discounts', route: 'reference-discounts' }] },
    { label: 'Audit Log', icon: 'audit' },
  ];

  const icons = {
    overview: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    dashboard: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    analytics: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>',
    organization: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-5h6v5M8 7h2m4 0h2M8 11h2m4 0h2"/>',
    facilities: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M8 9h.01M12 9h.01M16 9h.01"/>',
    'cost-centers': '<circle cx="12" cy="12" r="9"/><path d="M16 8.5c-.8-.8-1.8-1.2-3.1-1.2-1.7 0-2.9.9-2.9 2.2 0 3.2 6 1.2 6 4.5 0 1.4-1.3 2.4-3.2 2.4-1.4 0-2.6-.5-3.5-1.5M12.8 5.5v13"/>',
    staff: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.5a4 4 0 0 1 0 7.8M20 21v-2a4 4 0 0 0-3-3.9"/>',
    payers: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    insurance: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    contracts: '<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M8 3v4h4M8 3l8 0 5 5v2M8 12h5m-5 4h5m4-5 3 3-4 4-3-3z"/>',
    'billing-rules': '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="19" r="2"/>',
    services: '<path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/>',
    his: '<path d="M3 5h18v14H3zM7 9h4v4H7zM14 9h4M14 13h4M7 16h11"/>',
    reference: '<path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4"/>',
    audit: '<path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/><path d="M16 2v4"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
  };
  const icon = (name, extraClass = '') => `<svg class="nav-icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
  const slug = (label) => label.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const link = (label, route, iconName = '') => `<a class="nav-link" data-org-route="${route}" data-org-label="${label}" href="#${route}"${iconName ? '' : ' title="' + label + '"'}>${iconName ? icon(iconName) : '<span class="nav-icon" aria-hidden="true"></span>'}<span>${label}</span></a>`;

  navigation.innerHTML = '<div class="nav-caption">Organization</div>' + menu.map((entry, index) => {
    if (!entry.items) return link(entry.label, slug(entry.label), entry.icon);
    const groupId = `organization-group-${index}`;
    const children = entry.items.map((item) => {
      const label = typeof item === 'string' ? item : item.label;
      const route = typeof item === 'string' ? slug(label) : item.route;
      return link(label, route);
    }).join('');
    return `<section class="nav-group"><button class="nav-group-button" type="button" aria-expanded="false" aria-controls="${groupId}">${icon(entry.icon)}<span>${entry.label}</span><svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons.chevron}</svg></button><div class="nav-children" id="${groupId}" hidden>${children}</div></section>`;
  }).join('');

  const links = [...navigation.querySelectorAll('[data-org-route]')];
  const updateSelection = () => {
    const requestedRoute = window.location.hash.slice(1) || 'overview';
    const activeLink = links.find((item) => item.dataset.orgRoute === requestedRoute) || links.find((item) => item.dataset.orgRoute === 'overview');
    const route = activeLink.dataset.orgRoute;
    if (!window.location.hash || route !== requestedRoute) history.replaceState(null, '', '#overview');

    links.forEach((item) => {
      const active = item === activeLink;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    navigation.querySelectorAll('.nav-group').forEach((group) => {
      const button = group.querySelector('.nav-group-button');
      const children = group.querySelector('.nav-children');
      const containsActive = children.contains(activeLink);
      button.setAttribute('aria-expanded', String(containsActive));
      children.hidden = !containsActive;
    });

    const label = activeLink.dataset.orgLabel;
    document.querySelector('[data-org-title]').textContent = label;
    document.querySelector('[data-org-breadcrumb]').textContent = label;
    document.querySelector('[data-org-subtitle]').textContent = `${label} for your organization.`;
    document.querySelector('[data-org-workspace-title]').textContent = `${label} workspace`;
  };

  navigation.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-group-button');
    if (!button || !navigation.contains(button)) return;
    const children = document.getElementById(button.getAttribute('aria-controls'));
    const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
    navigation.querySelectorAll('.nav-group-button').forEach((otherButton) => {
      const otherChildren = document.getElementById(otherButton.getAttribute('aria-controls'));
      if (otherButton !== button) {
        otherButton.setAttribute('aria-expanded', 'false');
        otherChildren.hidden = true;
      }
    });
    button.setAttribute('aria-expanded', String(shouldOpen));
    children.hidden = !shouldOpen;
  });

  window.addEventListener('hashchange', updateSelection);
  updateSelection();
})();
