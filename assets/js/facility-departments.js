(() => {
  const grid = document.querySelector('[data-departments-grid]');
  if (!grid) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-departments:v1:${facilityId}`;
  const seed = [
    { name: 'Ambulatory Care Clinic', type: 'Clinic', specialty: 'Family Medicine', profile: 'Clinic', category: 'Billing' },
    { name: 'Emergency Department', type: 'Ward', specialty: 'Emergency Medicine', profile: 'Hospital', category: 'Billing' },
    { name: 'Internal Medicine Ward', type: 'Ward', specialty: 'Internal Medicine', profile: 'Hospital', category: 'Billing' },
    { name: 'Outpatient Pharmacy', type: 'OP Pharmacy', specialty: 'Pharmacy', profile: 'Pharmacy', category: 'Billing' },
    { name: 'Clinical Laboratory', type: 'Laboratory', specialty: 'Laboratory Medicine', profile: 'Laboratory', category: 'Billing' },
    { name: 'Diagnostic Imaging', type: 'Imaging Location', specialty: 'Radiology', profile: 'Diagnostic Center', category: 'Billing' },
  ].map((record, index) => ({ code: `DPT-${String(index + 1).padStart(3, '0')}`, ...record, active: true }));

  const rows = grid.querySelector('[data-department-rows]');
  const empty = grid.querySelector('[data-department-empty]');
  const resultCount = grid.querySelector('[data-department-result-count]');
  const pageLabel = grid.querySelector('[data-department-page-label]');
  const modal = document.querySelector('#department-modal');
  const form = document.querySelector('#department-form');
  const modalTitle = document.querySelector('#department-modal-title');
  const modalDescription = document.querySelector('#department-modal-description');
  const saveButton = document.querySelector('[data-department-save]');
  const toast = document.querySelector('[data-facility-toast]');
  const pageSize = 5;
  let page = 1;
  let mode = 'new';
  let activeCode = null;
  let returnFocus = null;
  let toastTimer;
  let appliedFilters = {};
  let departments = load();
  appliedFilters = readFilters();

  const icons = {
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let migrated = false;
          const records = parsed.map((department) => {
            const sample = seed.find((item) => item.code === department.code && item.name === department.name);
            if (!sample || department.category !== 'Medical') return department;
            migrated = true;
            return { ...department, category: 'Billing' };
          });
          if (migrated) localStorage.setItem(storageKey, JSON.stringify(records));
          return records;
        }
      } else localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep the prototype usable if browser storage is unavailable. */ }
    return seed.map((department) => ({ ...department }));
  }

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(departments)); } catch { /* Session state remains available in memory. */ }
    window.dispatchEvent(new CustomEvent('rcm:departments-changed', { detail: { facilityId, departments } }));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300);
  }

  function readFilters() {
    return Object.fromEntries([...grid.querySelectorAll('[data-department-filter]')].map((field) => [
      field.dataset.departmentFilter,
      field.value.trim().toLocaleLowerCase(),
    ]));
  }

  function filteredDepartments() {
    return departments.filter((department) => ['code', 'name', 'type', 'specialty', 'category'].every((key) =>
      !appliedFilters[key] || String(department[key] || '').toLocaleLowerCase().includes(appliedFilters[key]),
    ));
  }

  function closeMenus(except) {
    rows.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) {
        menu.hidden = true;
        menu.parentElement.querySelector('[data-department-row-menu]').setAttribute('aria-expanded', 'false');
      }
    });
  }

  function render() {
    const matching = filteredDepartments();
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, totalPages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((department) => `<tr>
      <td class="branch-code">${escapeHtml(department.code)}</td>
      <td><span class="facility-name-en">${escapeHtml(department.name)}</span></td>
      <td>${escapeHtml(department.type)}</td><td>${escapeHtml(department.specialty)}</td>
      <td>${escapeHtml(department.profile || '—')}</td><td>${escapeHtml(department.category)}</td>
      <td><span class="facility-status ${department.active ? 'is-active' : 'is-inactive'}"><span></span>${department.active ? 'Active' : 'Inactive'}</span></td>
      <td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-department-row-menu aria-label="Actions for ${escapeHtml(department.name)}" aria-haspopup="menu" aria-expanded="false" data-code="${escapeHtml(department.code)}">${icons.more}</button>
        <div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-department-action="view" data-code="${escapeHtml(department.code)}">${icons.eye}View</button><button type="button" role="menuitem" data-department-action="edit" data-code="${escapeHtml(department.code)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-department-action="toggle-status" data-code="${escapeHtml(department.code)}">${icons.status}${department.active ? 'Deactivate' : 'Activate'}</button></div></div></td>
    </tr>`).join('');
    empty.hidden = matching.length > 0;
    resultCount.textContent = `Total Results: ${matching.length}`;
    pageLabel.textContent = `Page ${matching.length ? page : 0} of ${matching.length ? totalPages : 0}`;
    grid.querySelectorAll('[data-department-page]').forEach((button) => {
      button.disabled = matching.length === 0 || (['first', 'previous'].includes(button.dataset.departmentPage) ? page === 1 : page === totalPages);
    });
  }

  function nextCode() {
    const sequence = Math.max(0, ...departments.map((department) => Number(String(department.code).match(/(\d+)$/)?.[1]) || 0)) + 1;
    return `DPT-${String(sequence).padStart(3, '0')}`;
  }

  function setReadOnly(readOnly) {
    ['name', 'type', 'specialty', 'profile', 'category'].forEach((name) => { form.elements.namedItem(name).disabled = readOnly; });
    saveButton.hidden = readOnly;
    modal.querySelector('[data-department-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }

  function openModal(nextMode, department = null, trigger = document.activeElement) {
    mode = nextMode;
    activeCode = department?.code ?? null;
    returnFocus = trigger;
    form.reset();
    setReadOnly(false);
    const isNew = nextMode === 'new';
    modalTitle.textContent = isNew ? 'Add Department' : nextMode === 'view' ? 'Department Details' : 'Edit Department';
    modalDescription.textContent = isNew ? 'Enter the department details.' : nextMode === 'view' ? 'Review department details.' : 'Update the department details.';
    saveButton.textContent = isNew ? 'Create' : 'Save changes';
    const record = isNew ? { code: nextCode() } : department;
    ['code', 'name', 'type', 'specialty', 'profile', 'category'].forEach((name) => { form.elements.namedItem(name).value = record?.[name] || ''; });
    if (nextMode === 'view') setReadOnly(true);
    modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    modal.querySelector('[data-department-close]').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(['code', 'name', 'type', 'specialty', 'profile', 'category'].map((name) => [name, form.elements.namedItem(name).value.trim()]));
    if (mode === 'new') {
      const department = { ...values, active: true };
      departments.push(department);
      persist();
      grid.querySelectorAll('[data-department-filter]').forEach((field) => { field.value = ''; });
      appliedFilters = {};
      page = Math.ceil(departments.length / pageSize);
      closeModal();
      render();
      rows.querySelector(`[data-department-row-menu][data-code="${CSS.escape(department.code)}"]`)?.focus();
      showToast(`${department.name} was created successfully.`);
    } else {
      const department = departments.find((item) => item.code === activeCode);
      if (!department) return;
      Object.assign(department, values);
      persist();
      closeModal();
      render();
      rows.querySelector(`[data-department-row-menu][data-code="${CSS.escape(department.code)}"]`)?.focus();
      showToast(`${department.name} was updated successfully.`);
    }
  });

  grid.querySelector('[data-department-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.querySelectorAll('[data-department-filter]').forEach((field) => {
    field.addEventListener(field.matches('select') ? 'change' : 'input', () => {
      appliedFilters = readFilters();
      page = 1;
      closeMenus();
      render();
    });
  });
  grid.querySelectorAll('[data-department-page]').forEach((button) => button.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filteredDepartments().length / pageSize));
    if (button.dataset.departmentPage === 'first') page = 1;
    if (button.dataset.departmentPage === 'previous') page = Math.max(1, page - 1);
    if (button.dataset.departmentPage === 'next') page = Math.min(totalPages, page + 1);
    if (button.dataset.departmentPage === 'last') page = totalPages;
    closeMenus();
    render();
  }));

  rows.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-department-row-menu]');
    if (trigger) {
      const menu = trigger.parentElement.querySelector('.facility-row-menu');
      const opening = menu.hidden;
      closeMenus(menu);
      menu.hidden = !opening;
      trigger.setAttribute('aria-expanded', String(opening));
      return;
    }
    const action = event.target.closest('[data-department-action]');
    if (!action) {
      if (!event.target.closest('.facility-row-action')) closeMenus();
      return;
    }
    const department = departments.find((item) => item.code === action.dataset.code);
    if (!department) return;
    const rowTrigger = action.closest('.facility-row-action').querySelector('[data-department-row-menu]');
    if (action.dataset.departmentAction === 'view' || action.dataset.departmentAction === 'edit') {
      closeMenus();
      openModal(action.dataset.departmentAction, department, rowTrigger);
      return;
    }
    department.active = !department.active;
    persist();
    render();
    showToast(`${department.name} is now ${department.active ? 'active' : 'inactive'}.`);
  });

  modal.querySelector('[data-department-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-department-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.facility-row-action')) closeMenus(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { if (!modal.hidden) closeModal(); else closeMenus(); }
    if (modal.hidden || event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled), select:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey || !event.newValue) return;
    try {
      const updated = JSON.parse(event.newValue);
      if (Array.isArray(updated)) { departments = updated; render(); }
    } catch { /* Ignore invalid external updates. */ }
  });

  render();
})();
