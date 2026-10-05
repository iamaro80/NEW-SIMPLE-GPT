(() => {
  const grid = document.querySelector('[data-roles-grid]');
  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const storageKey = `rcm-facility-roles:v1:${facilityId}`;
  const permissionCatalog = [
    { id: 'PERM-001', name: 'Patient Info Sync', module: 'Patient' },
    { id: 'PERM-002', name: 'Synchronization', module: 'Patient' },
    { id: 'PERM-003', name: 'Change Patient Status', module: 'Patient' },
    { id: 'PERM-004', name: 'View Patient', module: 'Patient' },
    { id: 'PERM-005', name: 'Search Patient', module: 'Patient' },
    { id: 'PERM-006', name: 'Edit Patient', module: 'Patient' },
    { id: 'PERM-007', name: 'Add New Patient', module: 'Patient' },
    { id: 'PERM-008', name: 'Incentive Order Report', module: 'Reports' },
    { id: 'PERM-009', name: 'Access Global Dictionaries Application', module: 'Reference Data' },
    { id: 'PERM-010', name: 'Access X4Security Application', module: 'Security' },
  ];
  const seed = [
    { id: 'role-001', arabicName: 'مدير المنشأة', englishName: 'Facility Administrator', permissionIds: permissionCatalog.map((item) => item.id), active: true },
    { id: 'role-002', arabicName: 'منسق وصول المرضى', englishName: 'Patient Access Coordinator', permissionIds: ['PERM-001', 'PERM-002', 'PERM-003', 'PERM-004', 'PERM-005', 'PERM-006', 'PERM-007'], active: true },
    { id: 'role-003', arabicName: 'أخصائي الفوترة', englishName: 'Billing Specialist', permissionIds: ['PERM-004', 'PERM-008'], active: true },
    { id: 'role-004', arabicName: 'مدقق سريري', englishName: 'Clinical Auditor', permissionIds: ['PERM-004', 'PERM-005', 'PERM-008'], active: true },
  ];
  if (!grid) {
    window.RcmFacilityRoles = { list: () => load().map((role) => ({ ...role })), permissionCatalog, storageKey };
    return;
  }

  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  let roles = load();
  let page = 1;
  let query = '';
  let mode = 'new';
  let activeId = null;
  let selectedPermissionSet = new Set();
  let returnFocus = null;
  let toastTimer;

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-role-add>${icons.add}Add Role</button></div><div class="branches-filter-grid role-filter-grid"><label class="facility-filter"><span>Name</span><input type="search" data-role-filter placeholder="Name"></label></div></div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table roles-table"><thead><tr><th>English Name</th><th>Arabic Name</th><th>Status</th><th>Actions</th></tr></thead><tbody data-role-rows></tbody></table></div><div class="facility-empty" data-role-empty hidden>No roles match your filter.</div><footer class="facility-pagination"><span data-role-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-role-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-role-page="previous" aria-label="Previous page">‹</button><span data-role-page-label></span><button class="icon-button" type="button" data-role-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-role-page="last" aria-label="Last page">»</button></div></footer></div>`;
  const modal = document.createElement('div');
  modal.className = 'patient-modal-backdrop'; modal.id = 'role-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal role-modal" role="dialog" aria-modal="true" aria-labelledby="role-modal-title" aria-describedby="role-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">ROLE RECORD</p><h2 id="role-modal-title">Add Role</h2><p id="role-modal-description">Enter role details and select permissions.</p></div><button class="icon-button" type="button" data-role-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><form data-role-form><div class="patient-modal-body role-modal-body">
      <fieldset class="patient-form-section role-section"><legend class="sr-only">Role Info</legend><div class="facility-form-section-heading">Role Info</div><div class="patient-form-grid role-info-grid"><label class="form-field"><span>Arabic Name <b>*</b></span><input name="arabicName" dir="rtl" required autocomplete="off"></label><label class="form-field"><span>English Name <b>*</b></span><input name="englishName" required autocomplete="off"></label></div></fieldset>
      <fieldset class="patient-form-section role-section"><legend class="sr-only">Role Permissions</legend><div class="facility-form-section-heading">Role Permissions</div><div class="role-permission-tools"><label class="facility-filter"><span>Search</span><input type="search" data-role-permission-search placeholder="Search"></label><label class="form-check role-select-all"><input type="checkbox" data-role-select-all><span>Select All</span></label></div><div class="facility-table-scroll role-permission-scroll"><table class="facility-table role-permission-table"><thead><tr><th>Select</th><th>ID</th><th>Name</th><th>Module</th></tr></thead><tbody data-role-permission-rows></tbody></table></div><div class="facility-empty role-no-permissions" data-role-no-permissions hidden>No permissions match your search.</div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-role-cancel>Cancel</button><button type="submit" class="button button-primary" data-role-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-role-form]');
  const permissionRows = modal.querySelector('[data-role-permission-rows]');
  const rows = grid.querySelector('[data-role-rows]');
  const toast = document.querySelector('[data-facility-toast]');
  const pageSize = 8;

  function load() {
    const shared = window.RcmOrganizationStaffStore?.forFacility('roles', facilityId);
    if (shared?.length) return shared;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let migrated = false;
          const records = parsed.map((role) => {
            const { level, ...facilityRole } = role;
            if (level !== undefined) migrated = true;
            return { ...facilityRole, permissionIds: Array.isArray(role.permissionIds) ? role.permissionIds : [] };
          });
          if (migrated) localStorage.setItem(storageKey, JSON.stringify(records));
          return records;
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
      window.RcmOrganizationStaffStore?.saveFacility('roles', facilityId, seed);
    } catch { /* Seed remains available in memory when storage is unavailable. */ }
    return seed.map((role) => ({ ...role, permissionIds: [...role.permissionIds] }));
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(roles)); } catch { /* Keep the workflow available in memory. */ }
    window.RcmOrganizationStaffStore?.saveFacility('roles', facilityId, roles);
    window.dispatchEvent(new CustomEvent('rcm:roles-changed', { detail: { facilityId, roles: list() } }));
  }
  function list() { return roles.map((role) => ({ ...role, permissionIds: [...role.permissionIds] })); }
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }
  function matchedRoles() {
    return roles.filter((role) => `${role.arabicName} ${role.englishName}`.toLocaleLowerCase().includes(query));
  }
  function closeMenus(except) {
    rows.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) { menu.hidden = true; menu.parentElement.querySelector('[data-role-row-menu]')?.setAttribute('aria-expanded', 'false'); }
    });
  }
  function render() {
    const matches = matchedRoles();
    const pages = Math.max(1, Math.ceil(matches.length / pageSize)); page = Math.min(page, pages);
    const visible = matches.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((role) => `<tr><td><span class="facility-name-en">${escapeHtml(role.englishName)}</span></td><td lang="ar" dir="rtl">${escapeHtml(role.arabicName)}</td><td><span class="facility-status ${role.active ? 'is-active' : 'is-inactive'}"><span></span>${role.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-role-row-menu aria-label="Actions for ${escapeHtml(role.englishName)}" aria-haspopup="menu" aria-expanded="false" data-role-id="${escapeHtml(role.id)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-role-action="view" data-role-id="${escapeHtml(role.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-role-action="edit" data-role-id="${escapeHtml(role.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-role-action="status" data-role-id="${escapeHtml(role.id)}">${icons.status}${role.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-role-empty]').hidden = matches.length > 0;
    grid.querySelector('[data-role-count]').textContent = `Total Results: ${matches.length}`;
    grid.querySelector('[data-role-page-label]').textContent = `Page ${matches.length ? page : 0} of ${matches.length ? pages : 0}`;
    grid.querySelectorAll('[data-role-page]').forEach((button) => { button.disabled = !matches.length || (['first', 'previous'].includes(button.dataset.rolePage) ? page === 1 : page === pages); });
  }
  function renderPermissionRows(search = modal.querySelector('[data-role-permission-search]').value) {
    const normalized = search.trim().toLocaleLowerCase();
    const filtered = permissionCatalog.filter((permission) => (mode !== 'view' || selectedPermissionSet.has(permission.id)) && `${permission.id} ${permission.name} ${permission.module}`.toLocaleLowerCase().includes(normalized));
    permissionRows.innerHTML = filtered.map((permission) => `<tr><td><input type="checkbox" name="permissionIds" value="${escapeHtml(permission.id)}" aria-label="Select ${escapeHtml(permission.name)}" ${selectedPermissionSet.has(permission.id) ? 'checked' : ''} ${mode === 'view' ? 'disabled' : ''}></td><td class="branch-code">${escapeHtml(permission.id)}</td><td>${escapeHtml(permission.name)}</td><td>${escapeHtml(permission.module)}</td></tr>`).join('');
    const noPermissions = modal.querySelector('[data-role-no-permissions]');
    noPermissions.textContent = mode === 'view' && !selectedPermissionSet.size ? 'No permissions are assigned to this role.' : 'No permissions match your search.';
    noPermissions.hidden = filtered.length > 0;
    syncSelectAll();
  }
  function selectedPermissionIds() { return [...selectedPermissionSet]; }
  function syncSelectAll() {
    const selectAll = modal.querySelector('[data-role-select-all]');
    const inputs = [...permissionRows.querySelectorAll('[name="permissionIds"]')];
    const checked = inputs.filter((input) => input.checked).length;
    selectAll.checked = inputs.length > 0 && checked === inputs.length;
    selectAll.indeterminate = checked > 0 && checked < inputs.length;
    selectAll.disabled = inputs.length === 0 || mode === 'view';
  }
  function setReadOnly(readOnly) {
    for (const field of form.elements) {
      if (field.name || field.type === 'checkbox') field.disabled = readOnly;
    }
    modal.querySelector('[data-role-save]').hidden = readOnly;
    modal.querySelector('[data-role-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }
  function openModal(nextMode, role = null, trigger = document.activeElement) {
    mode = nextMode; activeId = role?.id || null; returnFocus = trigger;
    form.reset(); setReadOnly(false);
    const isNew = nextMode === 'new';
    modal.querySelector('#role-modal-title').textContent = isNew ? 'Add Role' : nextMode === 'view' ? 'Role Details' : 'Edit Role';
    modal.querySelector('#role-modal-description').textContent = isNew ? 'Enter role details and select permissions.' : nextMode === 'view' ? 'Review role details and assigned permissions.' : 'Update role details and permissions.';
    modal.querySelector('[data-role-save]').textContent = isNew ? 'Create' : 'Save changes';
    selectedPermissionSet = new Set(role?.permissionIds || []);
    if (role) {
      form.elements.namedItem('arabicName').value = role.arabicName;
      form.elements.namedItem('englishName').value = role.englishName;
    }
    modal.querySelector('[data-role-permission-search]').value = '';
    renderPermissionRows();
    if (nextMode === 'view') setReadOnly(true);
    modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-role-close]').focus();
  }
  function closeModal() {
    modal.hidden = true; document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  modal.querySelector('[data-role-permission-search]').addEventListener('input', () => renderPermissionRows());
  permissionRows.addEventListener('change', (event) => {
    const input = event.target.closest('[name="permissionIds"]');
    if (input) { if (input.checked) selectedPermissionSet.add(input.value); else selectedPermissionSet.delete(input.value); }
    syncSelectAll();
  });
  modal.querySelector('[data-role-select-all]').addEventListener('change', (event) => {
    permissionRows.querySelectorAll('[name="permissionIds"]').forEach((input) => {
      input.checked = event.currentTarget.checked;
      if (input.checked) selectedPermissionSet.add(input.value); else selectedPermissionSet.delete(input.value);
    });
    syncSelectAll();
  });
  grid.querySelector('[data-role-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.querySelector('[data-role-filter]').addEventListener('input', (event) => { query = event.currentTarget.value.trim().toLocaleLowerCase(); page = 1; closeMenus(); render(); });
  grid.querySelectorAll('[data-role-page]').forEach((button) => button.addEventListener('click', () => {
    const pages = Math.max(1, Math.ceil(matchedRoles().length / pageSize));
    if (button.dataset.rolePage === 'first') page = 1;
    if (button.dataset.rolePage === 'previous') page = Math.max(1, page - 1);
    if (button.dataset.rolePage === 'next') page = Math.min(pages, page + 1);
    if (button.dataset.rolePage === 'last') page = pages;
    closeMenus(); render();
  }));
  rows.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-role-row-menu]');
    if (trigger) { const menu = trigger.parentElement.querySelector('.facility-row-menu'); const opening = menu.hidden; closeMenus(menu); menu.hidden = !opening; trigger.setAttribute('aria-expanded', String(opening)); return; }
    const action = event.target.closest('[data-role-action]');
    if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const role = roles.find((item) => item.id === action.dataset.roleId); if (!role) return;
    const rowTrigger = action.closest('.facility-row-action').querySelector('[data-role-row-menu]'); closeMenus();
    if (action.dataset.roleAction === 'view' || action.dataset.roleAction === 'edit') { openModal(action.dataset.roleAction, role, rowTrigger); return; }
    role.active = !role.active; persist(); render(); showToast(`${role.englishName} is now ${role.active ? 'active' : 'inactive'}.`);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault(); if (!form.reportValidity()) return;
    const values = { arabicName: form.elements.namedItem('arabicName').value.trim(), englishName: form.elements.namedItem('englishName').value.trim(), permissionIds: selectedPermissionIds() };
    if (roles.some((role) => role.id !== activeId && role.englishName.toLocaleLowerCase() === values.englishName.toLocaleLowerCase())) {
      form.elements.namedItem('englishName').setCustomValidity('A role with this English Name already exists.'); form.elements.namedItem('englishName').reportValidity(); return;
    }
    if (mode === 'new') {
      const role = { ...values, id: `role-${crypto.randomUUID()}`, active: true }; roles.push(role); persist();
      grid.querySelector('[data-role-filter]').value = ''; query = ''; page = Math.ceil(roles.length / pageSize); closeModal(); render(); showToast(`${role.englishName} was created successfully.`);
    } else {
      const role = roles.find((item) => item.id === activeId); if (!role) return;
      Object.assign(role, values); persist(); closeModal(); render(); showToast(`${role.englishName} was updated successfully.`);
    }
  });
  form.elements.namedItem('englishName').addEventListener('input', (event) => event.currentTarget.setCustomValidity(''));
  modal.querySelector('[data-role-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-role-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.facility-row-action')) closeMenus(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { if (!modal.hidden) closeModal(); else closeMenus(); }
    if (modal.hidden || event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled), select:not(:disabled)')];
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey && event.newValue) { try { const updated = JSON.parse(event.newValue); if (Array.isArray(updated)) { roles = updated; render(); window.dispatchEvent(new CustomEvent('rcm:roles-changed', { detail: { facilityId, roles: list() } })); } } catch { /* Ignore malformed storage updates. */ } }
  });
  window.RcmFacilityRoles = { list, permissionCatalog, storageKey };
  render();
})();
