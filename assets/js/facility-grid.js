(() => {
  const grid = document.querySelector('[data-facility-grid]');
  if (!grid) return;

  const rows = grid.querySelector('[data-facility-rows]');
  const empty = grid.querySelector('[data-facility-empty]');
  const resultCount = grid.querySelector('[data-facility-result-count]');
  const pageLabel = grid.querySelector('[data-facility-page-label]');
  const advancedToggle = grid.querySelector('[data-advanced-toggle]');
  const advancedFilters = grid.querySelector('[data-advanced-filters]');
  const toast = document.querySelector('[data-facility-toast]');
  const pageSize = 5;
  let page = 1;
  let toastTimer;

  const facilities = [
    { id: 1, arabicName: 'مستشفى الملك عبدالله التخصصي بالقصيم', englishName: 'King Abdullah Specialized Hospital- Alqassim', unifiedId: '7001000001', licenseNumber: 'LIC-2024-001', phone: '+966 13 533 8080', country: 'Saudi Arabia', city: 'Riyadh', district: 'Al Olaya', active: true },
    { id: 2, arabicName: 'مستشفى الملك فهد', englishName: 'King Fahad Hospital', unifiedId: '7001000002', licenseNumber: 'LIC-2024-002', phone: '+966 14 844 4444', country: 'Saudi Arabia', city: 'Madinah', district: 'Al Jumuah', active: true },
    { id: 3, arabicName: 'مركز تبوك الطبي', englishName: 'Tabuk Medical Center', unifiedId: '7001000003', licenseNumber: 'LIC-2024-003', phone: '+966 14 422 1100', country: 'Saudi Arabia', city: 'Tabuk', district: 'Al Muruj', active: false },
    { id: 4, arabicName: 'مجمع الخبر الطبي', englishName: 'Al Khobar Medical Complex', unifiedId: '7001000004', licenseNumber: 'LIC-2024-004', phone: '+966 13 895 7000', country: 'Saudi Arabia', city: 'Al Khobar', district: 'Al Aqrabiyah', active: true },
    { id: 5, arabicName: 'مستشفى الدمام المركزي', englishName: 'Dammam Central Hospital', unifiedId: '7001000005', licenseNumber: 'LIC-2024-005', phone: '+966 13 815 5777', country: 'Saudi Arabia', city: 'Dammam', district: 'Al Shifa', active: true },
    { id: 6, arabicName: 'مستشفى جدة العام', englishName: 'Jeddah General Hospital', unifiedId: '7001000006', licenseNumber: 'LIC-2024-006', phone: '+966 12 647 5555', country: 'Saudi Arabia', city: 'Jeddah', district: 'Al Kandarah', active: false },
    { id: 7, arabicName: 'مركز الرياض التخصصي', englishName: 'Riyadh Specialty Center', unifiedId: '7001000007', licenseNumber: 'LIC-2024-007', phone: '+966 11 465 0000', country: 'Saudi Arabia', city: 'Riyadh', district: 'Al Malaz', active: true },
    { id: 8, arabicName: 'عيادات المدينة الطبية', englishName: 'Madinah Medical Clinics', unifiedId: '7001000008', licenseNumber: 'LIC-2024-008', phone: '+966 14 820 4000', country: 'Saudi Arabia', city: 'Madinah', district: 'Qurban', active: true },
    { id: 9, arabicName: 'مجمع تبوك الصحي', englishName: 'Tabuk Health Complex', unifiedId: '7001000009', licenseNumber: 'LIC-2024-009', phone: '+966 14 422 9090', country: 'Saudi Arabia', city: 'Tabuk', district: 'Al Faisaliyah', active: true },
    { id: 10, arabicName: 'مستشفى الخليج', englishName: 'Gulf Hospital', unifiedId: '7001000010', licenseNumber: 'LIC-2024-010', phone: '+966 13 859 9999', country: 'Saudi Arabia', city: 'Al Khobar', district: 'Al Thuqbah', active: true },
    { id: 11, arabicName: 'مركز النور الطبي', englishName: 'Al Noor Medical Center', unifiedId: '7001000011', licenseNumber: 'LIC-2024-011', phone: '+966 13 832 2323', country: 'Saudi Arabia', city: 'Dammam', district: 'Al Faisaliyah', active: false },
    { id: 12, arabicName: 'مستشفى السلام', englishName: 'Al Salam Hospital', unifiedId: '7001000012', licenseNumber: 'LIC-2024-012', phone: '+966 12 682 2222', country: 'Saudi Arabia', city: 'Jeddah', district: 'Al Sharafiyah', active: true },
  ];

  const icons = {
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300);
  }

  function filterValues() {
    return Object.fromEntries([...grid.querySelectorAll('[data-facility-filter]')].map((field) => [field.dataset.facilityFilter, field.value.trim().toLowerCase()]));
  }

  function filteredFacilities() {
    const filters = filterValues();
    return facilities.filter((facility) => {
      for (const key of ['arabicName', 'englishName', 'unifiedId', 'licenseNumber', 'phone']) {
        if (filters[key] && !facility[key].toLowerCase().includes(filters[key])) return false;
      }
      for (const key of ['country', 'city', 'district']) {
        if (filters[key] && facility[key].toLowerCase() !== filters[key]) return false;
      }
      if (filters.status && (facility.active ? 'active' : 'inactive') !== filters.status) return false;
      return true;
    });
  }

  function closeMenus(except) {
    rows.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) {
        menu.hidden = true;
        menu.parentElement.querySelector('[data-row-menu]').setAttribute('aria-expanded', 'false');
      }
    });
  }

  function render() {
    const matching = filteredFacilities();
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, totalPages);
    const start = (page - 1) * pageSize;
    const visible = matching.slice(start, start + pageSize);

    rows.innerHTML = visible.map((facility) => `<tr>
      <td><span class="facility-name-en">${escapeHtml(facility.englishName)}</span><span class="facility-name-ar" lang="ar" dir="rtl">${escapeHtml(facility.arabicName)}</span></td>
      <td>${escapeHtml(facility.unifiedId)}</td><td>${escapeHtml(facility.phone)}</td><td>${escapeHtml(facility.country)}</td><td>${escapeHtml(facility.city)}</td>
      <td><span class="facility-status ${facility.active ? 'is-active' : 'is-inactive'}"><span></span>${facility.active ? 'Active' : 'Inactive'}</span></td>
      <td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-row-menu aria-label="Actions for ${escapeHtml(facility.englishName)}" aria-haspopup="menu" aria-expanded="false" data-id="${facility.id}">${icons.more}</button>
        <div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" disabled>${icons.eye}View</button><button type="button" role="menuitem" disabled>${icons.edit}Edit</button><button type="button" role="menuitem" data-action="toggle-status" data-id="${facility.id}">${icons.status}${facility.active ? 'Deactivate' : 'Activate'}</button></div></div></td>
    </tr>`).join('');

    empty.hidden = matching.length > 0;
    resultCount.textContent = `Total Results: ${matching.length}`;
    pageLabel.textContent = `Page ${matching.length ? page : 0} of ${matching.length ? totalPages : 0}`;
    grid.querySelectorAll('[data-page]').forEach((button) => {
      button.disabled = matching.length === 0 || (['first', 'previous'].includes(button.dataset.page) ? page === 1 : page === totalPages);
    });
  }

  function fillOptions(fieldName, firstLabel, values) {
    const select = grid.querySelector(`[data-facility-filter="${fieldName}"]`);
    values.forEach((value) => select.add(new Option(value, value.toLowerCase())));
    select.options[0].textContent = firstLabel;
  }

  fillOptions('country', 'All countries', [...new Set(facilities.map((facility) => facility.country))]);
  fillOptions('city', 'All cities', [...new Set(facilities.map((facility) => facility.city))]);
  fillOptions('district', 'All districts', [...new Set(facilities.map((facility) => facility.district))]);

  advancedToggle.addEventListener('click', () => {
    const expanded = advancedToggle.getAttribute('aria-expanded') === 'true';
    advancedToggle.setAttribute('aria-expanded', String(!expanded));
    advancedFilters.hidden = expanded;
  });
  grid.querySelectorAll('[data-facility-filter]').forEach((field) => {
    field.addEventListener(field.matches('select') ? 'change' : 'input', () => { page = 1; render(); });
  });
  grid.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filteredFacilities().length / pageSize));
    if (button.dataset.page === 'first') page = 1;
    if (button.dataset.page === 'previous') page = Math.max(1, page - 1);
    if (button.dataset.page === 'next') page = Math.min(totalPages, page + 1);
    if (button.dataset.page === 'last') page = totalPages;
    closeMenus();
    render();
  }));

  rows.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-row-menu]');
    if (trigger) {
      const menu = trigger.parentElement.querySelector('.facility-row-menu');
      const opening = menu.hidden;
      closeMenus(menu);
      menu.hidden = !opening;
      trigger.setAttribute('aria-expanded', String(opening));
      return;
    }
    const action = event.target.closest('[data-action="toggle-status"]');
    if (action) {
      const facility = facilities.find((item) => String(item.id) === action.dataset.id);
      if (!facility) return;
      facility.active = !facility.active;
      render();
      showToast(`${facility.englishName} is now ${facility.active ? 'active' : 'inactive'}.`);
      return;
    }
    if (!event.target.closest('.facility-row-action')) closeMenus();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.facility-row-action')) closeMenus();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenus(); });

  render();
})();
