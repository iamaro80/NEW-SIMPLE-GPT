(() => {
  const grid = document.querySelector('[data-facility-grid]');
  const rows = grid?.querySelector('[data-facility-rows]');
  const empty = grid?.querySelector('[data-facility-empty]');
  const resultCount = grid?.querySelector('[data-facility-result-count]');
  const pageLabel = grid?.querySelector('[data-facility-page-label]');
  const advancedToggle = grid?.querySelector('[data-advanced-toggle]');
  const advancedFilters = grid?.querySelector('[data-advanced-filters]');
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

  let facilities = window.RcmFacilityStore.list();
  const hcpOptions = window.RcmFacilityStore.hcpOptions;

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
    if (!grid) return {};
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
      <td>${document.body.dataset.facilityContext === 'organization'
        ? `<a class="facility-name-en facility-focus-link" data-facility-open href="#facilities/${facility.id}/facility-profile">${escapeHtml(facility.englishName)}</a>`
        : `<span class="facility-name-en">${escapeHtml(facility.englishName)}</span>`}<span class="facility-name-ar" lang="ar" dir="rtl">${escapeHtml(facility.arabicName)}</span></td>
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
    if (!grid) return;
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
      window.RcmFacilityStore.save(facilities);
      closeFacilityModal();
      if (grid) {
        grid.querySelectorAll('[data-facility-filter]').forEach((field) => { field.value = ''; });
        page = Math.ceil(facilities.length / pageSize);
        syncAllFilterOptions();
        render();
        rows.querySelector(`[data-row-menu][data-id="${facility.id}"]`)?.focus();
      }
      showToast(`${values.englishName} was created successfully.`);
    } else {
      const facility = facilities.find((item) => item.id === activeFacilityId);
      if (!facility) return;
      Object.assign(facility, values, { phone });
      window.RcmFacilityStore.save(facilities);
      closeFacilityModal();
      if (grid) {
        syncAllFilterOptions();
        render();
        rows.querySelector(`[data-row-menu][data-id="${facility.id}"]`)?.focus();
      }
      showToast(`${facility.englishName} was updated successfully.`);
    }
  }

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

  document.addEventListener('rcm:facility-edit', (event) => {
    const facility = facilities.find((item) => String(item.id) === String(event.detail?.id));
    if (facility) openFacilityModal('edit', facility, event.detail?.trigger || document.activeElement);
  });
  window.addEventListener('rcm:facilities-changed', (event) => {
    if (Array.isArray(event.detail?.facilities)) facilities = event.detail.facilities;
    if (grid) {
      syncAllFilterOptions();
      render();
    }
  });

  if (!grid) return;

  syncAllFilterOptions();
  grid.querySelector('[data-add-facility]').addEventListener('click', (event) => openFacilityModal('new', null, event.currentTarget));
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
    const openFacility = event.target.closest('[data-facility-open]');
    if (openFacility) {
      event.preventDefault();
      window.location.hash = openFacility.getAttribute('href').slice(1);
      return;
    }
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
        if (recordAction.dataset.action === 'view' && document.body.dataset.facilityContext === 'organization') {
          window.location.hash = `facilities/${facility.id}/facility-profile`;
        } else {
          openFacilityModal(recordAction.dataset.action, facility, triggerButton);
        }
      }
      return;
    }
    const action = event.target.closest('[data-action="toggle-status"]');
    if (action) {
      const facility = facilities.find((item) => String(item.id) === action.dataset.id);
      if (!facility) return;
      facility.active = !facility.active;
      window.RcmFacilityStore.save(facilities);
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
