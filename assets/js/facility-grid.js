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
  const modal = document.querySelector('#facility-modal');
  const form = document.querySelector('#facility-form');
  const modalTitle = document.querySelector('#facility-modal-title');
  const modalDescription = document.querySelector('#facility-modal-description');
  const saveButton = document.querySelector('[data-facility-save]');
  const pageSize = 5;
  let page = 1;
  let toastTimer;
  let modalMode = 'new';
  let activeFacilityId = null;
  let returnFocus = null;

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

  const hcpOptions = [
    '(10000300091434) Al Ansari Specialist Hospital - Yanbu',
    'King Abdullah Specialized Hospital- Alqassim',
    'King Fahad Hospital',
    'Tabuk Medical Center',
  ];
  facilities.forEach((facility, index) => Object.assign(facility, {
    facilityIdentifier: String(47 + index),
    hcp: hcpOptions[index % hcpOptions.length],
    contactName: ['Sara Alotaibi', 'Faisal Alharbi', 'Noura Aldosari'][index % 3],
    email: `contact${index + 1}@example.com`,
    phoneCountryCode: '+966',
    phoneLocal: facility.phone.replace(/^\+966\s*/, ''),
    extension: '',
    mobileCountryCode: '+966',
    mobileLocal: `5${String(10000000 + index * 17321).slice(0, 8)}`,
    licenseStart: '',
    licenseEnd: '',
    chiId: ['1000000000', '111', '1060'][index % 3],
    vatNumber: `310${String(100000000 + index).padStart(9, '0')}03`,
    crNumber: `1010${String(1000000 + index)}`,
    nhicNumber: `NHIC-${String(index + 1).padStart(4, '0')}`,
    category: ['Hospital', 'Clinic', 'General Medical Complex'][index % 3],
    buildingNumber: '',
    streetName: '',
    postalCode: '',
    additionalNumber: '',
    episodeExpiry: 'Two Weeks',
    autoAuthorization: false,
    invoiceConfigEnglish: '',
    invoiceConfigArabic: '',
    backgroundColor: '#1e76b5',
    foregroundColor: '#ffffff',
    zatcaOrganizationId: '',
    zatcaInvoiceBook: '',
  }));

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
        <div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-action="view" data-id="${facility.id}">${icons.eye}View</button><button type="button" role="menuitem" data-action="edit" data-id="${facility.id}">${icons.edit}Edit</button><button type="button" role="menuitem" data-action="toggle-status" data-id="${facility.id}">${icons.status}${facility.active ? 'Deactivate' : 'Activate'}</button></div></div></td>
    </tr>`).join('');

    empty.hidden = matching.length > 0;
    resultCount.textContent = `Total Results: ${matching.length}`;
    pageLabel.textContent = `Page ${matching.length ? page : 0} of ${matching.length ? totalPages : 0}`;
    grid.querySelectorAll('[data-page]').forEach((button) => {
      button.disabled = matching.length === 0 || (['first', 'previous'].includes(button.dataset.page) ? page === 1 : page === totalPages);
    });
  }

  function syncFilterOptions(fieldName, firstLabel, values) {
    const select = grid.querySelector(`[data-facility-filter="${fieldName}"]`);
    const selected = select.value;
    select.replaceChildren(new Option(firstLabel, ''));
    values.forEach((value) => select.add(new Option(value, value.toLowerCase())));
    select.value = selected;
  }

  function syncAllFilterOptions() {
    syncFilterOptions('country', 'All countries', [...new Set(facilities.map((facility) => facility.country).filter(Boolean))]);
    syncFilterOptions('city', 'All cities', [...new Set(facilities.map((facility) => facility.city).filter(Boolean))]);
    syncFilterOptions('district', 'All districts', [...new Set(facilities.map((facility) => facility.district).filter(Boolean))]);
  }

  function nextFacilityIdentifier() {
    return String(Math.max(0, ...facilities.map((facility) => Number(facility.facilityIdentifier) || 0)) + 1);
  }

  function setReadOnly(readOnly) {
    [...form.elements].forEach((field) => {
      if (field.name) field.disabled = readOnly;
    });
    saveButton.hidden = readOnly;
    modal.querySelector('[data-facility-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }

  function openFacilityModal(mode, facility = null, trigger = document.activeElement) {
    modalMode = mode;
    activeFacilityId = facility?.id ?? null;
    returnFocus = trigger;
    form.reset();
    setReadOnly(false);
    const isNew = mode === 'new';
    modalTitle.textContent = isNew ? 'Add Facility' : mode === 'view' ? 'Facility Details' : 'Edit Facility';
    modalDescription.textContent = isNew
      ? 'Enter facility information and configuration details.'
      : mode === 'view' ? 'Review facility information and configuration details.' : 'Update facility information and configuration details.';
    saveButton.textContent = isNew ? 'Create' : 'Save changes';
    if (isNew) {
      form.elements.namedItem('facilityIdentifier').value = nextFacilityIdentifier();
      form.elements.namedItem('hcp').value = hcpOptions[0];
    } else {
      Object.entries(facility).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (!field) return;
        if (field.type === 'checkbox') field.checked = Boolean(value);
        else field.value = value ?? '';
      });
    }
    if (mode === 'view') setReadOnly(true);
    modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    modal.querySelector('[data-facility-close]').focus();
  }

  function closeFacilityModal() {
    modal.hidden = true;
    document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  function readFacilityForm() {
    return Object.fromEntries([...form.elements].filter((field) => field.name).map((field) => [
      field.name,
      field.type === 'checkbox' ? field.checked : field.value.trim(),
    ]));
  }

  function saveFacility(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = readFacilityForm();
    const phone = values.phoneLocal
      ? `${values.phoneCountryCode} ${values.phoneLocal}`
      : `${values.mobileCountryCode} ${values.mobileLocal}`;
    if (modalMode === 'new') {
      const nextId = Math.max(0, ...facilities.map((facility) => facility.id)) + 1;
      const facility = { ...values, id: nextId, phone, active: true };
      facilities.push(facility);
      grid.querySelectorAll('[data-facility-filter]').forEach((field) => { field.value = ''; });
      page = Math.ceil(facilities.length / pageSize);
      syncAllFilterOptions();
      closeFacilityModal();
      render();
      rows.querySelector(`[data-row-menu][data-id="${facility.id}"]`)?.focus();
      showToast(`${values.englishName} was created successfully.`);
    } else {
      const facility = facilities.find((item) => item.id === activeFacilityId);
      if (!facility) return;
      Object.assign(facility, values, { phone });
      closeFacilityModal();
      syncAllFilterOptions();
      render();
      rows.querySelector(`[data-row-menu][data-id="${facility.id}"]`)?.focus();
      showToast(`${facility.englishName} was updated successfully.`);
    }
  }

  syncAllFilterOptions();
  grid.querySelector('[data-add-facility]').addEventListener('click', (event) => openFacilityModal('new', null, event.currentTarget));
  form.addEventListener('submit', saveFacility);
  modal.querySelector('[data-facility-close]').addEventListener('click', closeFacilityModal);
  modal.querySelector('[data-facility-cancel]').addEventListener('click', closeFacilityModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeFacilityModal(); });
  document.addEventListener('keydown', (event) => {
    if (modal.hidden) return;
    if (event.key === 'Escape') closeFacilityModal();
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

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
    const recordAction = event.target.closest('[data-action="view"], [data-action="edit"]');
    if (recordAction) {
      const facility = facilities.find((item) => String(item.id) === recordAction.dataset.id);
      if (facility) {
        const triggerButton = recordAction.closest('.facility-row-action').querySelector('[data-row-menu]');
        closeMenus();
        openFacilityModal(recordAction.dataset.action, facility, triggerButton);
      }
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
