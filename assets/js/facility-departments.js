(() => {
  const grid = document.querySelector('[data-departments-grid]');
  if (!grid) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-departments:v1:${facilityId}`;
  const branchStorageKey = `rcm-facility-branches:v1:${facilityId}`;
  const seed = [
    { name: 'Department 1', branchCodes: ['1'], type: 'Clinic', specialty: 'Family Medicine', category: 'Billing' },
    { name: 'Department 2', branchCodes: ['2'], type: 'Ward', specialty: 'Emergency Medicine', category: 'Billing' },
    { name: 'Department 3', branchCodes: ['3'], type: 'Ward', specialty: 'Internal Medicine', category: 'Billing' },
    { name: 'Department 4', branchCodes: ['4'], type: 'OP Pharmacy', specialty: 'Pharmacy', category: 'Billing' },
    { name: 'Department 5', branchCodes: ['5'], type: 'Laboratory', specialty: 'Laboratory Medicine', category: 'Billing' },
    { name: 'Department 6', branchCodes: ['6'], type: 'Imaging Location', specialty: 'Radiology', category: 'Billing' },
  ].map((record, index) => ({ code: `DPT-${String(index + 1).padStart(3, '0')}`, ...record, active: true }));

  function facilitySeed() {
    const activeCodes = activeBranches().map((branch) => String(branch.code));
    return seed.map((department, index) => {
      const assigned = (department.branchCodes || []).map(String).filter((code) => activeCodes.includes(code));
      return { ...department, branchCodes: assigned.length ? assigned : [activeCodes[index % activeCodes.length] || ''] };
    });
  }

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
  const specialtyCatalog = [...new Set(window.RcmDepartmentSpecialties || [])];
  const branchSearch = form.querySelector('[data-department-branch-search]');
  const branchOptions = form.querySelector('[data-department-branch-options]');
  const branchChips = form.querySelector('[data-department-branch-chips]');
  const branchToggle = form.querySelector('[data-department-branch-toggle]');
  const singleBranchNote = form.querySelector('[data-department-single-branch]');
  const specialtySearch = form.querySelector('[data-department-specialty-search]');
  const specialtyValue = form.elements.namedItem('specialty');
  const specialtyOptions = form.querySelector('[data-department-specialty-options]');
  const specialtyToggle = form.querySelector('[data-department-specialty-toggle]');
  const pageSize = 5;
  let page = 1;
  let mode = 'new';
  let activeCode = null;
  let returnFocus = null;
  let toastTimer;
  let appliedFilters = {};
  let branches = loadBranches();
  let departments = load();
  let selectedBranchCodes = [];
  let branchPickerOpen = false;
  let specialtyPickerOpen = false;
  let specialtyQuery = '';
  let selectedSpecialty = '';
  let legacySpecialty = '';
  refreshSpecialtyFilter();
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

  function loadBranches() {
    try {
      const saved = localStorage.getItem(branchStorageKey);
      const parsed = saved && JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        if (!parsed.some((branch) => branch.active !== false)) {
          const numericCodes = parsed.map((branch) => Number(branch.code)).filter(Number.isFinite);
          parsed.push({ code: String(Math.max(0, ...numericCodes) + 1), englishName: 'Branch 1', arabicName: 'الفرع 1', prefix: 'DEF', active: true, isDefault: true });
          localStorage.setItem(branchStorageKey, JSON.stringify(parsed));
        }
        return parsed;
      }
      if (Array.isArray(parsed) && !parsed.length) {
        const created = [{ code: '1', englishName: 'Branch 1', arabicName: 'الفرع 1', prefix: 'DEF', active: true, isDefault: true }];
        localStorage.setItem(branchStorageKey, JSON.stringify(created));
        return created;
      }
    } catch { /* Use the standard branch choices if stored data is unavailable. */ }
    const created = facilityId === '1'
      ? Array.from({ length: 7 }, (_, index) => ({ code: String(index + 1), englishName: `Branch ${index + 1}`, arabicName: `الفرع ${index + 1}`, prefix: `BR${index + 1}`, active: true }))
      : [{ code: '1', englishName: 'Branch 1', arabicName: 'الفرع 1', prefix: 'DEF', active: true, isDefault: true }];
    try { localStorage.setItem(branchStorageKey, JSON.stringify(created)); } catch { /* use memory */ }
    return created;
  }

  function activeBranches() { return branches.filter((branch) => branch.active !== false); }
  function branchName(code) {
    const branch = branches.find((item) => String(item.code) === String(code));
    return branch?.englishName || branch?.name || `Branch ${code}`;
  }
  function departmentBranches(department) {
    return (Array.isArray(department.branchCodes) ? department.branchCodes : department.parentBranch ? [department.parentBranch] : []).map(String);
  }

  function refreshSpecialtyFilter() {
    const select = grid.querySelector('[data-department-filter="specialty"]');
    const current = select.value;
    const values = [...new Set([...specialtyCatalog, ...departments.map((department) => String(department.specialty || '').trim()).filter(Boolean)])];
    select.innerHTML = '<option value="">All specialties</option>' + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    if (values.includes(current)) select.value = current;
  }

  function renderBranchChips() {
    const readOnly = mode === 'view';
    const selected = [...new Set(selectedBranchCodes.map(String))];
    branchChips.innerHTML = selected.map((code) => `<span class="practitioner-department-chip"><span>${escapeHtml(branchName(code))}</span>${readOnly ? '' : `<button type="button" data-department-branch-remove="${escapeHtml(code)}" aria-label="Remove ${escapeHtml(branchName(code))}">×</button>`}</span>`).join('') || '<span class="practitioner-department-placeholder">No branches selected</span>';
  }

  function drawBranchChoices() {
    const query = branchSearch.value.trim().toLocaleLowerCase();
    const available = activeBranches().filter((branch) => branchListName(branch).toLocaleLowerCase().includes(query));
    branchOptions.innerHTML = available.length ? available.map((branch) => {
      const code = String(branch.code);
      return `<label class="form-check practitioner-department-option"><input type="checkbox" data-department-branch-option value="${escapeHtml(code)}" ${selectedBranchCodes.includes(code) ? 'checked' : ''}><span>${escapeHtml(branchListName(branch))}</span></label>`;
    }).join('') : `<span class="practitioner-no-departments">${query ? 'No matching branches.' : 'No active branches are configured.'}</span>`;
    renderBranchChips();
    validateBranchSelection();
  }

  function branchListName(branch) { return branch.englishName || branch.name || `Branch ${branch.code}`; }

  function validateBranchSelection() {
    const required = activeBranches().length > 1;
    branchSearch.required = required;
    branchSearch.setCustomValidity(required && !selectedBranchCodes.length ? 'Select at least one branch.' : '');
    branchSearch.setAttribute('aria-required', String(required));
  }

  function setBranchPickerOpen(open) {
    branchPickerOpen = Boolean(open) && activeBranches().length > 1 && mode !== 'view';
    branchOptions.hidden = !branchPickerOpen;
    branchSearch.setAttribute('aria-expanded', String(branchPickerOpen));
    branchToggle.setAttribute('aria-expanded', String(branchPickerOpen));
    if (branchPickerOpen) drawBranchChoices();
  }

  function specialtyChoices() {
    return [...new Set([...specialtyCatalog, ...(legacySpecialty ? [legacySpecialty] : [])])];
  }

  function drawSpecialtyChoices() {
    const query = specialtyQuery.trim().toLocaleLowerCase();
    const choices = specialtyChoices().filter((value) => value.toLocaleLowerCase().includes(query));
    specialtyOptions.innerHTML = choices.length ? choices.map((value) => `<button type="button" role="option" aria-selected="${value === selectedSpecialty}" data-department-specialty-option="${escapeHtml(value)}">${escapeHtml(value)}${value === legacySpecialty && !specialtyCatalog.includes(value) ? ' <small>(existing value)</small>' : ''}</button>`).join('') : `<span class="department-specialty-empty">No matching specialties.</span>`;
  }

  function setSpecialtyPickerOpen(open) {
    specialtyPickerOpen = Boolean(open) && mode !== 'view';
    specialtyOptions.hidden = !specialtyPickerOpen;
    specialtySearch.setAttribute('aria-expanded', String(specialtyPickerOpen));
    specialtyToggle.setAttribute('aria-expanded', String(specialtyPickerOpen));
    if (specialtyPickerOpen) {
      specialtyQuery = '';
      specialtySearch.value = '';
      drawSpecialtyChoices();
    } else {
      specialtyQuery = '';
      specialtySearch.value = selectedSpecialty;
    }
  }

  function refreshBranchOptions() {
    const branchList = activeBranches();
    const selectableBranches = branchList.length <= 1 ? [] : branchList;
    const filterSelect = grid.querySelector('[data-department-filter="branchCode"]');
    const selectedFilter = filterSelect.value;
    filterSelect.innerHTML = '<option value="">All branches</option>' + selectableBranches.map((branch) =>
      `<option value="${escapeHtml(branch.code)}">${escapeHtml(branch.englishName || branch.name || `Branch ${branch.code}`)}</option>`,
    ).join('');
    if (selectableBranches.some((branch) => String(branch.code) === selectedFilter)) filterSelect.value = selectedFilter;
    const host = form.querySelector('[data-department-branch-picker]');
    const control = form.querySelector('[data-department-branch-control]');
    if (branchList.length <= 1) {
      singleBranchNote.hidden = false;
      singleBranchNote.textContent = `${branchListName(branchList[0] || { code: '1' })} is assigned automatically.`;
      host.hidden = true;
      control.hidden = true;
      branchSearch.hidden = true;
      branchToggle.hidden = true;
      selectedBranchCodes = branchList[0] ? [String(branchList[0].code)] : [];
      branchPickerOpen = false;
      branchOptions.hidden = true;
    } else {
      singleBranchNote.hidden = true;
      host.hidden = false;
      control.hidden = false;
      branchSearch.hidden = false;
      branchToggle.hidden = false;
      drawBranchChoices();
    }
    renderBranchChips();
    validateBranchSelection();
  }

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let migrated = false;
          const records = parsed.map((department, index) => {
            const sample = seed.find((item) => item.code === department.code && item.name === department.name);
            const next = { ...department };
            const oldCodes = Array.isArray(next.branchCodes) ? next.branchCodes.map(String) : next.parentBranch ? [String(next.parentBranch)] : [];
            const activeCodes = activeBranches().map((branch) => String(branch.code));
            const validCodes = oldCodes.filter((code) => activeCodes.includes(code));
            const sampleCodes = (sample?.branchCodes || []).map(String).filter((code) => activeCodes.includes(code));
            next.branchCodes = validCodes.length ? [...new Set(validCodes)] : sampleCodes.length ? [...new Set(sampleCodes)] : [activeCodes[index % activeCodes.length] || ''];
            delete next.parentBranch;
            if (JSON.stringify(next.branchCodes) !== JSON.stringify(oldCodes) || department.parentBranch !== undefined) migrated = true;
            return next;
          });
          if (migrated) localStorage.setItem(storageKey, JSON.stringify(records));
          return records;
        }
      } else {
        const initial = facilitySeed();
        localStorage.setItem(storageKey, JSON.stringify(initial));
        return initial;
      }
    } catch { /* Keep the prototype usable if browser storage is unavailable. */ }
    const initial = facilitySeed();
    try { localStorage.setItem(storageKey, JSON.stringify(initial)); } catch { /* Keep seeded rows available in memory. */ }
    return initial;
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
      !appliedFilters[key] || (key === 'specialty' ? String(department[key] || '').toLocaleLowerCase() === appliedFilters[key] : String(department[key] || '').toLocaleLowerCase().includes(appliedFilters[key])),
    ) && (!appliedFilters.branchCode || departmentBranches(department).includes(appliedFilters.branchCode)));
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
      <td>${escapeHtml(activeBranches().length <= 1 ? 'Single location' : departmentBranches(department).map((code) => activeBranches().find((branch) => String(branch.code) === code)?.englishName || code).join(', ') || '—')}</td>
      <td>${escapeHtml(department.type)}</td><td>${escapeHtml(department.specialty)}</td>
      <td>${escapeHtml(department.category)}</td><td><span class="facility-status ${department.active ? 'is-active' : 'is-inactive'}"><span></span>${department.active ? 'Active' : 'Inactive'}</span></td>
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
    ['name', 'type', 'specialty', 'category'].forEach((name) => { form.elements.namedItem(name).disabled = readOnly; });
    specialtySearch.disabled = readOnly;
    branchSearch.disabled = readOnly;
    branchToggle.disabled = readOnly;
    specialtyToggle.disabled = readOnly;
    if (readOnly) {
      setBranchPickerOpen(false);
      setSpecialtyPickerOpen(false);
    }
    renderBranchChips();
    saveButton.hidden = readOnly;
    modal.querySelector('[data-department-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }

  function openModal(nextMode, department = null, trigger = document.activeElement) {
    mode = nextMode;
    activeCode = department?.code ?? null;
    returnFocus = trigger;
    form.reset();
    refreshBranchOptions();
    setReadOnly(false);
    setBranchPickerOpen(false);
    setSpecialtyPickerOpen(false);
    const isNew = nextMode === 'new';
    modalTitle.textContent = isNew ? 'Add Department' : nextMode === 'view' ? 'Department Details' : 'Edit Department';
    modalDescription.textContent = isNew ? 'Enter the department details.' : nextMode === 'view' ? 'Review department details.' : 'Update the department details.';
    saveButton.textContent = isNew ? 'Create' : 'Save changes';
    const record = isNew ? { code: nextCode(), branchCodes: [], category: 'Billing' } : department;
    ['code', 'name', 'type', 'category'].forEach((name) => { form.elements.namedItem(name).value = record?.[name] || ''; });
    selectedSpecialty = String(record?.specialty || '');
    specialtyValue.value = selectedSpecialty;
    specialtySearch.value = selectedSpecialty;
    specialtySearch.setCustomValidity(selectedSpecialty ? '' : 'Select a specialty.');
    legacySpecialty = selectedSpecialty && !specialtyCatalog.includes(selectedSpecialty) ? selectedSpecialty : '';
    specialtyQuery = '';
    const selectedCodes = departmentBranches(record);
    const onlyBranch = activeBranches()[0];
    selectedBranchCodes = activeBranches().length <= 1 && onlyBranch ? [String(onlyBranch.code)] : selectedCodes;
    branchSearch.value = '';
    validateBranchSelection();
    drawBranchChoices();
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
    validateBranchSelection();
    specialtySearch.setCustomValidity(specialtyValue.value ? '' : 'Select a specialty from the list.');
    if (!form.reportValidity()) return;
    const branchCodes = activeBranches().length <= 1 ? [String(activeBranches()[0]?.code || '')].filter(Boolean) : [...new Set(selectedBranchCodes.map(String))];
    if (!branchCodes.length) { window.alert('Assign this department to at least one active branch.'); return; }
    const values = Object.fromEntries(['code', 'name', 'category'].map((name) => [name, form.elements.namedItem(name).value.trim()]));
    values.type = form.elements.namedItem('type').value.trim();
    values.specialty = specialtyValue.value.trim();
    values.branchCodes = branchCodes;
    if (mode === 'new') {
      const department = { ...values, active: true };
      departments.push(department);
      persist();
      grid.querySelectorAll('[data-department-filter]').forEach((field) => { field.value = ''; });
      refreshSpecialtyFilter();
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
      refreshSpecialtyFilter();
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

  branchSearch.addEventListener('focus', () => setBranchPickerOpen(true));
  branchSearch.addEventListener('click', () => setBranchPickerOpen(true));
  branchSearch.addEventListener('input', () => { if (!branchPickerOpen) setBranchPickerOpen(true); drawBranchChoices(); });
  branchToggle.addEventListener('click', () => setBranchPickerOpen(!branchPickerOpen));
  branchOptions.addEventListener('change', (event) => {
    const input = event.target.closest('[data-department-branch-option]');
    if (!input) return;
    const code = String(input.value);
    selectedBranchCodes = input.checked
      ? [...new Set([...selectedBranchCodes.map(String), code])]
      : selectedBranchCodes.filter((item) => String(item) !== code);
    renderBranchChips();
    validateBranchSelection();
  });
  branchChips.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-department-branch-remove]');
    if (!remove) return;
    selectedBranchCodes = selectedBranchCodes.filter((code) => String(code) !== remove.dataset.departmentBranchRemove);
    branchOptions.querySelectorAll('[data-department-branch-option]').forEach((input) => { input.checked = selectedBranchCodes.includes(String(input.value)); });
    renderBranchChips();
    validateBranchSelection();
    branchSearch.focus();
    setBranchPickerOpen(true);
  });

  specialtySearch.addEventListener('focus', () => setSpecialtyPickerOpen(true));
  specialtySearch.addEventListener('click', () => setSpecialtyPickerOpen(true));
  specialtySearch.addEventListener('input', () => {
    selectedSpecialty = '';
    specialtyValue.value = '';
    specialtyQuery = specialtySearch.value;
    specialtySearch.setCustomValidity('Select a specialty from the list.');
    if (!specialtyPickerOpen) specialtyPickerOpen = true;
    specialtyOptions.hidden = false;
    specialtySearch.setAttribute('aria-expanded', 'true');
    specialtyToggle.setAttribute('aria-expanded', 'true');
    drawSpecialtyChoices();
  });
  specialtyToggle.addEventListener('click', () => {
    if (specialtyPickerOpen) setSpecialtyPickerOpen(false);
    else { setSpecialtyPickerOpen(true); specialtySearch.focus(); }
  });
  specialtyOptions.addEventListener('click', (event) => {
    const option = event.target.closest('[data-department-specialty-option]');
    if (!option) return;
    selectedSpecialty = option.dataset.departmentSpecialtyOption;
    specialtyValue.value = selectedSpecialty;
    specialtySearch.value = selectedSpecialty;
    specialtySearch.setCustomValidity('');
    legacySpecialty = selectedSpecialty && !specialtyCatalog.includes(selectedSpecialty) ? selectedSpecialty : '';
    setSpecialtyPickerOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-department-branch-picker]')) setBranchPickerOpen(false);
    if (!event.target.closest('[data-department-specialty-picker]')) setSpecialtyPickerOpen(false);
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
    if (event.key === 'Escape') {
      if (!modal.hidden && (branchPickerOpen || specialtyPickerOpen)) {
        if (branchPickerOpen) setBranchPickerOpen(false);
        if (specialtyPickerOpen) setSpecialtyPickerOpen(false);
        event.stopPropagation();
        return;
      }
      if (!modal.hidden) closeModal(); else closeMenus();
    }
    if (modal.hidden || event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled), select:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('storage', (event) => {
    if (event.key === branchStorageKey && event.newValue) {
      try {
        const updatedBranches = JSON.parse(event.newValue);
        if (Array.isArray(updatedBranches)) { branches = updatedBranches; refreshBranchOptions(); render(); }
      } catch { /* Ignore invalid external updates. */ }
      return;
    }
    if (event.key !== storageKey || !event.newValue) return;
    try {
      const updated = JSON.parse(event.newValue);
      if (Array.isArray(updated)) { departments = updated; refreshSpecialtyFilter(); render(); }
    } catch { /* Ignore invalid external updates. */ }
  });

  window.addEventListener('rcm:branches-changed', (event) => {
    if (event.detail?.facilityId !== facilityId || !Array.isArray(event.detail.branches)) return;
    branches = event.detail.branches;
    refreshBranchOptions();
    render();
  });

  refreshBranchOptions();
  render();
})();
