(() => {
  const root = document.querySelector('[data-organization-staff-workspace]');
  const store = window.RcmOrganizationStaffStore;
  if (!root || !store) return;
  const facilities = store.facilities();
  const names = { practitioners: 'Practitioners', users: 'Users', roles: 'Roles' };
  const roles = ['Doctor', 'Nurse', 'Pharmacist', 'Researcher', 'Teacher/educator', 'Dentist', 'Physiotherapist', 'Speechtherapist', 'ICT professional'];
  const documentTypes = ['National ID', 'Permanent Resident Card Number', 'Passport number', 'Visitor Permit', 'Medical record number', 'Border Number', 'Displaced person'];
  const specialties = ['Anesthesiology Specialty', 'Ambulatory Anesthesia', 'Anesthesia Cardiology', 'Neuro-Anesthesia', 'Obstetrics Anesthesia', 'Pediatrics Anesthesia', 'Pediatrics Cardiac Anesthesia', 'Regional Anesthesia', 'Vascular / Thoracic Anesthesia', 'Community Medicine Specialty', 'Community Health', 'Dermatology Specialty', 'Dermatology Surgery', 'Hair Implant Dermatology', 'Pediatrics Dermatology', 'Emergency Medicine Specialty', 'Adult Emergency Medicine'];
  const designations = ['Assistant Consultant', 'Assistant Family Therapist II', 'Assistant Psychologist', 'Associate Consultant', 'Board Certified Physician', 'Chairman Medical Imaging', 'Chairman Pediatrics', 'Chief of Medical Staff', 'Clinical Psychologist I', 'Clinical Psychologist II', 'Clinical Scientist', 'Consultant', 'Cytologist', 'PhD', 'IAC', 'Dental Hygienist', 'Dentist', 'Division Head', 'Emergency Consultant'];
  const userTypes = ['Business Center', 'Overtimer', 'System Administrator', 'Employee'];
  const esc = (v = '') => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const getRows = (kind) => store.list(kind);
  const facilityName = (id) => store.facilityName(id);
  const facilityNames = (ids = []) => ids.map(facilityName).join(', ') || '—';
  const getLookup = (kind, id) => {
    try { const value = JSON.parse(localStorage.getItem(`rcm-facility-${kind}:v1:${id}`) || 'null'); return Array.isArray(value) ? value : []; } catch { return []; }
  };
  const departments = (id) => {
    const saved = getLookup('departments', id).map((x) => ({ code: x.code, name: x.name || x.englishName || x.departmentName })).filter((x) => x.code && x.name);
    return saved.length ? saved : [
      ['DPT-001', 'Ambulatory Care Clinic'], ['DPT-002', 'Emergency Department'], ['DPT-003', 'Internal Medicine Ward'],
      ['DPT-004', 'Outpatient Pharmacy'], ['DPT-005', 'Clinical Laboratory'], ['DPT-006', 'Diagnostic Imaging'],
    ].map(([code, name]) => ({ code, name }));
  };
  const branches = (id) => {
    const saved = getLookup('branches', id).map((x) => ({ code: x.code, name: x.englishName || x.name })).filter((x) => x.code && x.name);
    return saved.length ? saved : Array.from({ length: 7 }, (_, i) => ({ code: String(i + 1), name: `Branch ${i + 1}` }));
  };
  const roleChoices = (selectedIds = []) => getRows('roles').filter((role) => role.active || selectedIds.map(String).includes(String(role.id)));
  const assignmentOptions = (kind, id, selectedIds = []) => {
    if (kind === 'department') return departments(id).map((item) => ({ value: String(item.code), label: item.name }));
    if (kind === 'branch') return branches(id).map((item) => ({ value: String(item.code), label: item.name }));
    return roleChoices(selectedIds).map((role) => ({ value: String(role.id), label: role.englishName, detail: role.arabicName, inactive: !role.active }));
  };
  const assignmentPickerState = {};
  const assignmentLabel = { department: 'Departments', branch: 'Branches', role: 'Roles' };
  function renderAssignmentPicker(kind, id, selectedIds, readOnly) {
    const key = `${kind}:${id}`, state = assignmentPickerState[key] || { open: false, query: '' };
    const options = assignmentOptions(kind, id, selectedIds), selected = new Set(selectedIds.map(String));
    const chosen = options.filter((option) => selected.has(option.value));
    const chips = chosen.length
      ? chosen.map((option) => `<span class="organization-assignment-chip">${esc(option.label)}${option.inactive ? ' · Inactive' : ''}${readOnly || option.inactive ? '' : `<button type="button" data-assignment-remove="${esc(option.value)}" data-facility-id="${esc(id)}" data-assignment-kind="${kind}" aria-label="Remove ${esc(option.label)}">×</button>`}</span>`).join('')
      : `<span class="organization-assignment-placeholder">No ${assignmentLabel[kind].toLocaleLowerCase()} selected</span>`;
    const query = state.query.toLocaleLowerCase();
    const list = options.length ? options.map((option) => {
      const isSelected = selected.has(option.value), searchable = `${option.label} ${option.detail || ''} ${option.value}`.toLocaleLowerCase();
      const locked = option.inactive && isSelected;
      return `<label class="organization-assignment-option"${query && !searchable.includes(query) ? ' hidden' : ''}><input type="checkbox" data-assignment-kind="${kind}" data-facility-id="${esc(id)}" data-assignment-option value="${esc(option.value)}" ${isSelected ? 'checked' : ''} ${readOnly || locked ? 'disabled' : ''}><span>${esc(option.label)}${option.inactive ? ' · Inactive' : ''}${option.detail ? `<small lang="ar" dir="rtl">${esc(option.detail)}</small>` : ''}</span></label>`;
    }).join('') : `<span class="organization-assignment-empty">No ${assignmentLabel[kind].toLocaleLowerCase()} are available for this facility.</span>`;
    return `<div class="organization-assignment-picker" data-assignment-picker="${kind}:${esc(id)}"><div class="organization-assignment-control ${readOnly ? 'is-readonly' : ''}"><div class="organization-assignment-chips">${chips}</div>${readOnly ? '' : `<input type="search" data-assignment-search="${kind}" data-facility-id="${esc(id)}" placeholder="Select ${assignmentLabel[kind].toLocaleLowerCase()}..." aria-label="Search ${assignmentLabel[kind].toLocaleLowerCase()}" aria-haspopup="listbox" aria-expanded="${state.open}" value="${esc(state.query)}"><button class="organization-assignment-toggle" type="button" data-assignment-toggle="${kind}" data-facility-id="${esc(id)}" aria-label="Show ${assignmentLabel[kind].toLocaleLowerCase()}" aria-expanded="${state.open}">⌄</button>`}</div><div class="organization-assignment-options" role="group" aria-label="${assignmentLabel[kind]} available to ${esc(facilityName(id))}"${state.open && !readOnly ? '' : ' hidden'}>${list}</div></div>`;
  }
  const field = (label, name, type = 'text', required = false, options = [], value = '') => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span>${type === 'textarea' ? `<textarea name="${name}" ${required ? 'required' : ''}>${esc(value)}</textarea>` : type === 'select' ? `<select name="${name}" ${required ? 'required' : ''}><option value="">Select ${label.toLowerCase()}</option>${options.map((o) => `<option value="${esc(o)}"${o === value ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''}>`}</label>`;
  const section = (title, content) => `<fieldset class="patient-form-section facility-modal-section"><legend class="sr-only">${title}</legend><div class="facility-form-section-heading">${title}</div><div class="patient-form-grid">${content}</div></fieldset>`;
  let activeKind = 'practitioners', page = 1, query = '', facilityFilter = '', statusFilter = '', filters = {}, modalRecordId = null, mode = 'new';
  const pageSize = 8;
  const modal = document.createElement('div'); modal.className = 'patient-modal-backdrop'; modal.hidden = true; modal.innerHTML = '<section class="patient-modal facility-modal" role="dialog" aria-modal="true"></section>'; document.body.append(modal);
  const dialog = modal.firstElementChild;
  let dialogEventsController = null;
  const toast = document.createElement('div'); toast.className = 'facility-toast'; toast.setAttribute('role', 'status'); toast.hidden = true; document.body.append(toast);
  let toastTimer;
  const showToast = (message) => { toast.textContent = message; toast.hidden = false; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; toast.classList.remove('is-visible'); }, 2800); };
  function getActiveRecord() { return getRows(activeKind).find((row) => row.id === modalRecordId); }
  function assignmentState(record) {
    if (activeKind === 'roles') return {};
    const result = {};
    (record?.facilityIds || []).forEach((id) => {
      const key = String(id);
      result[key] = activeKind === 'practitioners'
        ? { departmentCodes: [...(record.departmentsByFacility?.[key] || [])] }
        : activeKind === 'users'
          ? { branchCodes: (Array.isArray(record.assignmentsByFacility?.[key]?.branchCodes) ? record.assignmentsByFacility[key].branchCodes : record.assignmentsByFacility?.[key]?.branchCode ? [record.assignmentsByFacility[key].branchCode] : []).map(String), roleIds: [...(record.assignmentsByFacility?.[key]?.roleIds || [])] }
          : {};
    });
    return result;
  }
  function renderAssignments(selected, readOnly) {
    const ids = Object.keys(selected);
    const selector = `<div class="facility-assignment-picks">${facilities.map((f) => `<label class="form-check"><input type="checkbox" data-org-facility="${esc(f.id)}" ${ids.includes(String(f.id)) ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><span>${esc(f.englishName)}</span></label>`).join('')}</div>`;
    const panels = ids.map((id) => {
      const name = facilityName(id);
      if (activeKind === 'practitioners') {
        const list = departments(id), chosen = selected[id]?.departmentCodes || [];
        return `<div class="organization-assignment-panel"><strong>${esc(name)} · Departments <b>*</b></strong>${renderAssignmentPicker('department', id, chosen, readOnly)}<small class="organization-assignment-help">Select at least one department for this facility.</small></div>`;
      }
      if (activeKind === 'users') {
        const branchCodes = selected[id]?.branchCodes || [], roleIds = selected[id]?.roleIds || [];
        return `<div class="organization-assignment-panel"><strong>${esc(name)}</strong><div class="organization-assignment-subfield"><span>Branches <small>(optional)</small></span>${renderAssignmentPicker('branch', id, branchCodes, readOnly)}</div><div class="organization-assignment-subfield"><span>Roles <small>(optional)</small></span>${renderAssignmentPicker('role', id, roleIds, readOnly)}</div></div>`;
      }
      return '';
    }).join('');
    return `${selector}${panels}`;
  }
  function formMarkup(record) {
    const selected = assignmentState(record), readOnly = mode === 'view';
    if (activeKind === 'practitioners') {
      return section('Practitioner Data', field('Document ID', 'documentId', 'text', true, [], record?.documentId) + field('English Name', 'englishName', 'text', true, [], record?.englishName) + field('Arabic Name', 'arabicName', 'text', false, [], record?.arabicName) + field('Email', 'email', 'email', false, [], record?.email) + `<label class="form-field"><span>Mobile Number</span><span class="phone-control"><select name="mobileCode">${['+966', '+962', '+20', '+1', '+44'].map((c) => `<option ${c === (record?.mobileCode || '+966') ? 'selected' : ''}>${c}</option>`).join('')}</select><input name="mobile" type="tel" value="${esc(record?.mobile || '')}"></span></label>` + `<label class="form-field"><span>Phone Number</span><span class="phone-control"><select name="phoneCode">${['+966', '+962', '+20', '+1', '+44'].map((c) => `<option ${c === (record?.phoneCode || '+966') ? 'selected' : ''}>${c}</option>`).join('')}</select><input name="phone" type="tel" value="${esc(record?.phone || '')}"></span></label>` + field('Ext.', 'extension', 'text', false, [], record?.extension) + field('Practitioner Role', 'role', 'select', true, roles, record?.role) + field('Document Type', 'documentType', 'select', true, documentTypes, record?.documentType) + field('Prefix', 'prefix', 'text', false, [], record?.prefix) + field('Degree', 'degree', 'text', false, [], record?.degree) + field('License Number', 'licenseNumber', 'text', false, [], record?.licenseNumber) + field('License Start', 'licenseStart', 'date', false, [], record?.licenseStart) + field('License End', 'licenseEnd', 'date', false, [], record?.licenseEnd) + field('User', 'user', 'select', false, ['admin', 'test22', 'service-account-realm-admin'], record?.user) + field('Consultation Item', 'consultationItem', 'select', false, ['(90487-002) ANTENATAL C.T.G. (30 MIN)', '(182519) MYELIN OLIGODENDROCYTE GLYCOPROTEIN ABS TO BIO', '(182476) CENTO ARRAY CYTO HD TO CENTOGENE', '(182453) MSI BY PCR (MICROSATELLITE INSTABILITY BY PCR)', '(182436) CASPR 2 AB', '(182411) MYELOPROLIFERATIVE NEOPLASM (CALR)', '(182407) BRAF (SEND OUT TO UNILABS)', '(182402) NRAS (SEND OUT TO UNILABS)', '(182343) ONCOTYPE DX TEST', '(182264) BRAF-PCR', '(181809) DNA EXTRACTION FOR BANKING', '(132137) KAPPA'], record?.consultationItem) + field('Follow Up', 'followUp', 'select', false, ['(90487-002) ANTENATAL C.T.G. (30 MIN)', '(182519) MYELIN OLIGODENDROCYTE GLYCOPROTEIN ABS TO BIO', '(182476) CENTO ARRAY CYTO HD TO CENTOGENE', '(182453) MSI BY PCR (MICROSATELLITE INSTABILITY BY PCR)', '(182436) CASPR 2 AB', '(182411) MYELOPROLIFERATIVE NEOPLASM (CALR)'], record?.followUp) + field('Last Designation Update On', 'lastDesignationUpdate', 'text', false, [], record?.lastDesignationUpdate || '—')) +
        section('Practitioner Role Details', field('Practitioner Specialty', 'specialty', 'select', true, specialties, record?.specialty) + field('Designation', 'designation', 'select', true, designations, record?.designation)) +
        section('SCFHS Details', ['categoryCode', 'categoryNameEn', 'specialityCode', 'specialityNameEn', 'categoryNameAr', 'specialityNameAr'].map((key) => field(key.replace(/([A-Z])/g, ' $1'), key, 'text', false, [], record?.[key] || '—')).join('')) +
        section('Facility Assignment', `<div class="form-field organization-assignment-field"><span>Facilities <b>*</b></span><div data-org-assignment-root>${renderAssignments(selected, readOnly)}</div></div>`);
    }
    if (activeKind === 'users') {
      return section('User Information', field('Arabic Name', 'arabicName', 'text', true, [], record?.arabicName) + field('English Name', 'englishName', 'text', true, [], record?.englishName) + field('User Name', 'username', 'text', true, [], record?.username) + field('Email', 'email', 'email', true, [], record?.email) + `<label class="form-field"><span>Mobile Number <b>*</b></span><span class="phone-control"><select name="mobileCode">${['+966', '+962', '+20', '+1', '+44'].map((c) => `<option ${c === (record?.mobileCode || '+966') ? 'selected' : ''}>${c}</option>`).join('')}</select><input name="mobile" type="tel" required value="${esc(record?.mobile || '')}"></span></label>` + field('User Type', 'userType', 'select', true, userTypes, record?.userType) + field('Notes', 'notes', 'textarea', false, [], record?.notes)) + section('Facility Assignment', `<div class="form-field organization-assignment-field"><span>Facilities <b>*</b></span><div data-org-assignment-root>${renderAssignments(selected, readOnly)}</div></div>`);
    }
    const permissions = store.permissions;
    return section('Role Information', field('Arabic Name', 'arabicName', 'text', true, [], record?.arabicName) + field('English Name', 'englishName', 'text', true, [], record?.englishName)) +
      section('Role Permissions', `<label class="facility-filter"><span>Search permissions</span><input type="search" data-permission-search placeholder="Search permissions" ${readOnly ? 'disabled' : ''}></label><label class="form-check"><input type="checkbox" data-permission-all ${record?.permissionIds?.length === permissions.length ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><span>Select all permissions</span></label><div class="organization-permission-list" data-permission-list>${permissions.map((item) => `<label class="form-check" data-permission-row><input type="checkbox" name="permissionIds" value="${esc(item.id)}" ${record?.permissionIds?.includes(item.id) ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><span>${esc(item.name)} <small>· ${esc(item.module)} · ${esc(item.id)}</small></span></label>`).join('')}</div>`);
  }
  function showModal(nextMode, record = null) {
    dialogEventsController?.abort();
    dialogEventsController = new AbortController();
    const eventOptions = { signal: dialogEventsController.signal };
    mode = nextMode; modalRecordId = record?.id || null;
    Object.keys(assignmentPickerState).forEach((key) => { delete assignmentPickerState[key]; });
    const title = `${mode === 'new' ? 'Add' : mode === 'edit' ? 'Edit' : 'View'} ${activeKind === 'roles' ? 'Role' : activeKind === 'users' ? 'User' : 'Practitioner'}`;
    dialog.className = 'patient-modal facility-modal organization-staff-modal';
    const description = mode === 'view' ? 'Read-only record details.' : activeKind === 'roles' ? 'Manage this organization-wide role and its permissions.' : 'Manage this record and its facility assignments.';
    dialog.innerHTML = `<header class="patient-modal-header"><div><p class="eyebrow">ORGANIZATION STAFF & ACCESS</p><h2>${title}</h2><p>${description}</p></div><button class="icon-button" type="button" data-close aria-label="Close dialog">×</button></header><form><div class="patient-modal-body">${formMarkup(record)}</div><footer class="patient-modal-footer"><span><small><b>*</b> Required fields</small></span><div><button type="button" class="button button-secondary" data-cancel>Cancel</button><button type="submit" class="button button-primary" ${mode === 'view' ? 'hidden' : ''}>${mode === 'new' ? 'Create' : 'Save changes'}</button></div></footer></form>`;
    modal.hidden = false; document.body.classList.add('patient-modal-open');
    const form = dialog.querySelector('form');
    if (mode === 'view') form.querySelectorAll('input, select, textarea').forEach((control) => { control.disabled = true; });
    ['categoryCode', 'categoryNameEn', 'specialityCode', 'specialityNameEn', 'categoryNameAr', 'specialityNameAr', 'lastDesignationUpdate'].forEach((name) => { const control = form.elements.namedItem(name); if (control) control.readOnly = true; });
    const selected = assignmentState(record);
    function refreshAssignments() {
      const root = dialog.querySelector('[data-org-assignment-root]');
      if (!root) return;
      root.innerHTML = renderAssignments(selected, mode === 'view');
    }
    dialog.addEventListener('change', (event) => {
      const checkbox = event.target.closest('[data-org-facility]');
      if (checkbox) {
      const id = String(checkbox.dataset.orgFacility);
      if (checkbox.checked) selected[id] ||= activeKind === 'practitioners' ? { departmentCodes: [] } : { branchCodes: [], roleIds: [] };
      else {
        delete selected[id];
        Object.keys(assignmentPickerState).filter((key) => key.endsWith(`:${id}`)).forEach((key) => { delete assignmentPickerState[key]; });
      }
      refreshAssignments();
        return;
      }
      const option = event.target.closest('[data-assignment-option]');
      if (!option) return;
      const id = String(option.dataset.facilityId), kind = option.dataset.assignmentKind;
      const prop = kind === 'department' ? 'departmentCodes' : kind === 'branch' ? 'branchCodes' : 'roleIds';
      const values = new Set((selected[id]?.[prop] || []).map(String));
      if (option.checked) values.add(String(option.value)); else values.delete(String(option.value));
      selected[id] ||= activeKind === 'practitioners' ? { departmentCodes: [] } : { branchCodes: [], roleIds: [] };
      selected[id][prop] = [...values];
      if (kind === 'branch') selected[id].branchCode = selected[id].branchCodes[0] || '';
      refreshAssignments();
    }, eventOptions);
    dialog.addEventListener('input', (event) => {
      const input = event.target.closest('[data-assignment-search]');
      if (!input) return;
      const kind = input.dataset.assignmentSearch, id = String(input.dataset.facilityId), key = `${kind}:${id}`;
      assignmentPickerState[key] = { open: true, query: input.value };
      const cursor = input.selectionStart;
      refreshAssignments();
      const next = dialog.querySelector(`[data-assignment-search="${CSS.escape(kind)}"][data-facility-id="${CSS.escape(id)}"]`);
      next?.focus(); next?.setSelectionRange(cursor, cursor);
    }, eventOptions);
    dialog.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-assignment-remove]');
      if (remove) {
        const id = String(remove.dataset.facilityId), kind = remove.dataset.assignmentKind;
        const prop = kind === 'department' ? 'departmentCodes' : kind === 'branch' ? 'branchCodes' : 'roleIds';
        selected[id][prop] = (selected[id][prop] || []).filter((value) => String(value) !== String(remove.dataset.assignmentRemove));
        if (kind === 'branch') selected[id].branchCode = selected[id].branchCodes[0] || '';
        refreshAssignments();
        dialog.querySelector(`[data-assignment-search="${CSS.escape(kind)}"][data-facility-id="${CSS.escape(id)}"]`)?.focus();
        return;
      }
      const toggle = event.target.closest('[data-assignment-toggle]');
      const control = event.target.closest('.organization-assignment-control');
      const picker = event.target.closest('[data-assignment-picker]');
      if (!picker) return;
      const [kind, id] = picker.dataset.assignmentPicker.split(':');
      const key = `${kind}:${id}`;
      if (!toggle && event.target.closest('[data-assignment-search]')) return;
      const opening = toggle ? assignmentPickerState[key]?.open !== true : true;
      Object.keys(assignmentPickerState).forEach((stateKey) => { if (stateKey !== key) assignmentPickerState[stateKey].open = false; });
      assignmentPickerState[key] = { ...(assignmentPickerState[key] || { query: '' }), open: opening };
      if (control || toggle) {
        refreshAssignments();
        if (opening && !toggle) dialog.querySelector(`[data-assignment-search="${CSS.escape(kind)}"][data-facility-id="${CSS.escape(id)}"]`)?.focus();
      }
    }, eventOptions);
    dialog.addEventListener('focusin', (event) => {
      const input = event.target.closest('[data-assignment-search]');
      if (!input) return;
      const kind = input.dataset.assignmentSearch, id = String(input.dataset.facilityId), key = `${kind}:${id}`;
      if (assignmentPickerState[key]?.open) return;
      Object.keys(assignmentPickerState).forEach((stateKey) => { if (stateKey !== key) assignmentPickerState[stateKey].open = false; });
      assignmentPickerState[key] = { ...(assignmentPickerState[key] || { query: input.value }), open: true };
      refreshAssignments();
      dialog.querySelector(`[data-assignment-search="${CSS.escape(kind)}"][data-facility-id="${CSS.escape(id)}"]`)?.focus();
    }, eventOptions);
    dialog.querySelector('[data-permission-search]')?.addEventListener('input', (event) => {
      const q = event.currentTarget.value.toLocaleLowerCase();
      dialog.querySelectorAll('[data-permission-row]').forEach((row) => { row.hidden = !row.textContent.toLocaleLowerCase().includes(q); });
    });
    dialog.querySelector('[data-permission-all]')?.addEventListener('change', (event) => dialog.querySelectorAll('[name="permissionIds"]').forEach((box) => { box.checked = event.currentTarget.checked; }));
    dialog.querySelectorAll('[data-close], [data-cancel]').forEach((button) => button.addEventListener('click', closeModal));
    modal.onclick = (event) => { if (event.target === modal) closeModal(); };
    form.addEventListener('submit', (event) => {
      event.preventDefault(); if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const assignedIds = Object.keys(selected);
      if (activeKind !== 'roles' && !assignedIds.length) { window.alert('Assign this record to at least one facility.'); return; }
      if (activeKind === 'practitioners' && assignedIds.some((id) => !(selected[id]?.departmentCodes || []).length)) { window.alert('Select at least one department for every assigned facility.'); return; }
      let rows = getRows(activeKind), current = rows.find((row) => row.id === modalRecordId);
      if (activeKind === 'practitioners') {
        if (rows.some((row) => row.documentId === data.documentId && row.id !== modalRecordId)) { form.elements.documentId.setCustomValidity('Document ID already exists in the organization.'); form.reportValidity(); form.elements.documentId.setCustomValidity(''); return; }
        const departmentsByFacility = Object.fromEntries(assignedIds.map((id) => [id, [...(selected[id]?.departmentCodes || [])]]));
        const result = { ...(current || {}), ...data, facilityIds: assignedIds, departmentsByFacility, active: current?.active ?? true, id: current?.id || store.nextId('practitioner') };
        rows = current ? rows.map((row) => row.id === current.id ? result : row) : [...rows, result];
      } else if (activeKind === 'users') {
        if (rows.some((row) => row.username === data.username && row.id !== modalRecordId)) { form.elements.username.setCustomValidity('User Name already exists in the organization.'); form.reportValidity(); form.elements.username.setCustomValidity(''); return; }
        const assignmentsByFacility = Object.fromEntries(assignedIds.map((id) => [id, {
          branchCode: selected[id]?.branchCodes?.[0] || '', branchCodes: [...(selected[id]?.branchCodes || [])],
          roleIds: [...(selected[id]?.roleIds || [])],
        }]));
        const result = { ...(current || {}), ...data, facilityIds: assignedIds, assignmentsByFacility, active: current?.active ?? true, id: current?.id || store.nextId('user') };
        rows = current ? rows.map((row) => row.id === current.id ? result : row) : [...rows, result];
      } else {
        const permissionIds = [...dialog.querySelectorAll('[name="permissionIds"]:checked')].map((box) => box.value);
        const result = { ...(current || {}), id: current?.id || store.nextId('role'), arabicName: data.arabicName, englishName: data.englishName, facilityIds: facilities.map((facility) => String(facility.id)), organizationWide: true, permissionIds, active: current?.active ?? true };
        rows = current ? rows.map((row) => row.id === current.id ? result : row) : [...rows, result];
      }
      store.save(activeKind, rows); closeModal(); showToast(`${title} ${mode === 'new' ? 'created' : 'saved'}.`); render();
    });
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); dialogEventsController?.abort(); dialogEventsController = null; }
  function openRoleAssignment(user) {
    dialogEventsController?.abort();
    dialogEventsController = new AbortController();
    const eventOptions = { signal: dialogEventsController.signal };
    const assignedFacilityIds = (user.facilityIds || []).map(String);
    let selectedFacilityId = assignedFacilityIds[0] || '';
    const roleIdsByFacility = Object.fromEntries(assignedFacilityIds.map((id) => [id, [...(user.assignmentsByFacility?.[id]?.roleIds || [])].map(String)]));
    const selectedRoleIds = () => roleIdsByFacility[selectedFacilityId] || [];
    const renderRoleOptions = () => {
      const selected = selectedRoleIds().map(String), available = roleChoices(selected);
      return `<label class="facility-filter"><span>Facility</span><select data-role-assignment-facility>${assignedFacilityIds.map((id) => `<option value="${esc(id)}" ${id === selectedFacilityId ? 'selected' : ''}>${esc(facilityName(id))}</option>`).join('')}</select></label><label class="facility-filter"><span>Search roles</span><input type="search" data-user-role-search placeholder="Search roles"></label><div class="organization-permission-list" data-user-role-list>${available.map((role) => `<label class="form-check" data-user-role-row><input type="checkbox" data-user-role-choice value="${esc(role.id)}" ${selected.includes(String(role.id)) ? 'checked' : ''} ${!role.active ? 'disabled' : ''}><span>${esc(role.englishName)}${role.active ? '' : ' · Inactive'} <small>${esc(role.arabicName || '')}</small></span></label>`).join('') || '<small>No active roles are available.</small>'}</div>`;
    };
    dialog.className = 'patient-modal facility-modal organization-staff-modal';
    dialog.innerHTML = `<header class="patient-modal-header"><div><p class="eyebrow">USER ACCESS</p><h2>Assign Roles · ${esc(user.englishName)}</h2><p>Choose roles separately for each facility.</p></div><button class="icon-button" type="button" data-close aria-label="Close dialog">×</button></header><form><div class="patient-modal-body" data-user-role-assignment-body>${renderRoleOptions()}</div><footer class="patient-modal-footer"><span></span><div><button type="button" class="button button-secondary" data-cancel>Cancel</button><button type="submit" class="button button-primary">Save assignments</button></div></footer></form>`;
    modal.hidden = false; document.body.classList.add('patient-modal-open');
    dialog.querySelectorAll('[data-close], [data-cancel]').forEach((button) => button.addEventListener('click', closeModal));
    dialog.addEventListener('change', (event) => {
      if (event.target.matches('[data-role-assignment-facility]')) {
        selectedFacilityId = event.target.value;
        dialog.querySelector('[data-user-role-assignment-body]').innerHTML = renderRoleOptions();
      } else if (event.target.matches('[data-user-role-choice]')) {
        const selected = new Set(selectedRoleIds().map(String));
        if (event.target.checked) selected.add(String(event.target.value)); else selected.delete(String(event.target.value));
        roleIdsByFacility[selectedFacilityId] = [...selected];
      }
    }, eventOptions);
    dialog.addEventListener('input', (event) => {
      if (!event.target.matches('[data-user-role-search]')) return;
      const q = event.target.value.toLocaleLowerCase();
      dialog.querySelectorAll('[data-user-role-row]').forEach((row) => { row.hidden = !row.textContent.toLocaleLowerCase().includes(q); });
    }, eventOptions);
    dialog.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault(); const latest = getRows('users').find((item) => item.id === user.id); if (!latest) return;
      latest.assignmentsByFacility ||= {};
      assignedFacilityIds.forEach((fid) => {
        const currentAssignment = latest.assignmentsByFacility[fid] || {};
        const selected = roleIdsByFacility[fid] || [];
        latest.assignmentsByFacility[fid] = { ...currentAssignment, roleIds: [...new Set([...selected, ...(currentAssignment.roleIds || []).filter((id) => !getRows('roles').some((role) => String(role.id) === String(id) && role.active))])] };
      });
      store.save('users', getRows('users').map((item) => item.id === latest.id ? latest : item)); closeModal(); showToast(`Roles updated for ${latest.englishName}.`); render();
    });
  }
  function openPasswordModal(user) {
    dialog.className = 'patient-modal facility-modal organization-staff-modal';
    dialog.innerHTML = `<header class="patient-modal-header"><div><p class="eyebrow">USER ACCESS</p><h2>Set Password · ${esc(user.englishName)}</h2><p>Password is checked for this prototype but is not stored.</p></div><button class="icon-button" type="button" data-close aria-label="Close dialog">×</button></header><form><div class="patient-modal-body"><div class="patient-form-grid">${field('Password', 'password', 'password', true)}${field('Confirm Password', 'confirmPassword', 'password', true)}</div></div><footer class="patient-modal-footer"><span></span><div><button type="button" class="button button-secondary" data-cancel>Cancel</button><button type="submit" class="button button-primary">Set Password</button></div></footer></form>`;
    modal.hidden = false; document.body.classList.add('patient-modal-open');
    dialog.querySelectorAll('[data-close], [data-cancel]').forEach((button) => button.addEventListener('click', closeModal));
    dialog.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault(); const form = event.currentTarget; const password = form.elements.password; const confirm = form.elements.confirmPassword;
      if (!form.reportValidity()) return;
      if (password.value !== confirm.value) { confirm.setCustomValidity('Passwords must match.'); confirm.reportValidity(); confirm.setCustomValidity(''); return; }
      closeModal(); showToast(`Password set for ${user.englishName}.`);
    });
  }
  function display(row, kind) {
    const status = `<span class="facility-status ${row.active ? 'is-active' : 'is-inactive'}"><span></span>${row.active ? 'Active' : 'Inactive'}</span>`;
    const actions = `<div class="facility-row-action"><button class="facility-menu-trigger" type="button" aria-label="Actions for ${esc(row.englishName || row.username)}" data-row-menu="${esc(row.id)}">•••</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-action="view" data-id="${esc(row.id)}">View</button><button type="button" role="menuitem" data-action="edit" data-id="${esc(row.id)}">Edit</button>${kind === 'users' ? `<button type="button" role="menuitem" data-action="password" data-id="${esc(row.id)}">Set Password</button><button type="button" role="menuitem" data-action="assign" data-id="${esc(row.id)}">Assign Roles</button>` : ''}<button type="button" role="menuitem" data-action="status" data-id="${esc(row.id)}">${row.active ? 'Deactivate' : 'Activate'}</button></div></div>`;
    const facilityCell = `<td>${esc(facilityNames(row.facilityIds))}</td>`;
    if (kind === 'practitioners') return `<tr><td>${esc(row.documentId)}</td><td>${esc(row.englishName)}<small dir="rtl">${esc(row.arabicName || '')}</small></td>${facilityCell}<td>${esc(row.facilityIds.map((id) => (row.departmentsByFacility?.[id] || []).map((code) => departments(id).find((dep) => dep.code === code)?.name || code).join(', ')).filter(Boolean).join(' · ') || '—')}</td><td>${esc(row.role || '—')}</td><td>${esc(row.specialty || '—')}</td><td>${esc(row.designation || '—')}</td><td>${status}</td><td>${actions}</td></tr>`;
    if (kind === 'users') return `<tr><td>${esc(row.username)}</td><td>${esc(row.englishName)}<small dir="rtl">${esc(row.arabicName || '')}</small></td><td>${esc(row.email)}</td><td>${esc([row.mobileCode, row.mobile].filter(Boolean).join(' ') || '—')}</td>${facilityCell}<td>${esc(row.facilityIds.map((id) => { const assignment = row.assignmentsByFacility?.[id] || {}; const codes = (Array.isArray(assignment.branchCodes) ? assignment.branchCodes : assignment.branchCode ? [assignment.branchCode] : []).map(String); return codes.map((code) => branches(id).find((branch) => String(branch.code) === code)?.name || code).join(', ') || '—'; }).join(' · '))}</td><td>${esc(row.userType)}</td><td>${status}</td><td>${actions}</td></tr>`;
    return `<tr><td>${esc(row.englishName)}</td><td>${esc(row.arabicName)}</td><td>${status}</td><td>${actions}</td></tr>`;
  }
  function rowsForView() {
    const q = query.trim().toLocaleLowerCase();
    return getRows(activeKind).filter((row) => {
      const facilityMatch = activeKind === 'roles' || !facilityFilter || row.facilityIds.map(String).includes(facilityFilter);
      const statusMatch = !statusFilter || (statusFilter === 'active') === Boolean(row.active);
      const text = activeKind === 'users' ? `${row.username} ${row.englishName} ${row.arabicName} ${row.email}` : activeKind === 'roles' ? `${row.englishName} ${row.arabicName}` : `${row.documentId || ''} ${row.englishName} ${row.arabicName || ''} ${row.specialty || ''} ${row.role || ''} ${row.designation || ''}`;
      const norm = (v) => String(v || '').toLocaleLowerCase();
      const departmentMatch = !filters.department || row.facilityIds.some((fid) => (row.departmentsByFacility?.[fid] || []).some((code) => `${fid}|${code}` === filters.department));
      const branchMatch = !filters.branch || row.facilityIds.some((fid) => {
        const assignment = row.assignmentsByFacility?.[fid] || {}, codes = (Array.isArray(assignment.branchCodes) ? assignment.branchCodes : assignment.branchCode ? [assignment.branchCode] : []).map(String);
        return codes.some((code) => `${fid}|${code}` === filters.branch);
      });
      const valueMatches = (key, value) => !filters[key] || norm(value).includes(norm(filters[key]));
      return facilityMatch && statusMatch && norm(text).includes(q) && departmentMatch && branchMatch
        && valueMatches('documentId', row.documentId) && valueMatches('englishName', row.englishName)
        && valueMatches('arabicName', row.arabicName) && valueMatches('email', row.email)
        && valueMatches('username', row.username) && valueMatches('userType', row.userType)
        && valueMatches('role', row.role) && valueMatches('specialty', row.specialty)
        && valueMatches('designation', row.designation);
    });
  }
  function closeMenus() { root.querySelectorAll('.facility-row-menu').forEach((item) => { item.hidden = true; }); }
  function render() {
    const filtered = rowsForView(), pages = Math.max(1, Math.ceil(filtered.length / pageSize)); page = Math.min(page, pages);
    const slice = filtered.slice((page - 1) * pageSize, page * pageSize);
    const title = names[activeKind];
    const columns = activeKind === 'practitioners' ? ['Document ID', 'English Name', 'Facility', 'Department(s)', 'Practitioner Role', 'Specialty', 'Designation', 'Status', 'Actions'] : activeKind === 'users' ? ['User Name', 'English Name', 'Email', 'Mobile Number', 'Facility', 'Branch', 'User Type', 'Status', 'Actions'] : ['English Name', 'Arabic Name', 'Status', 'Actions'];
    const orgFilter = (label, key, placeholder) => `<label class="facility-filter"><span>${label}</span><input type="search" data-extra-filter="${key}" placeholder="${placeholder}" value="${esc(filters[key] || '')}"></label>`;
    const orgSelect = (label, key, options, allLabel) => `<label class="facility-filter"><span>${label}</span><select data-extra-filter="${key}"><option value="">${allLabel}</option>${options.map((o) => `<option value="${esc(o.value)}" ${filters[key] === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>`;
    let extraFilters = '';
    if (activeKind === 'practitioners') extraFilters = orgFilter('Document ID', 'documentId', 'Search document ID') + orgFilter('English Name', 'englishName', 'Search name') + orgSelect('Department', 'department', facilities.flatMap((f) => departments(f.id).map((d) => ({ value: `${f.id}|${d.code}`, label: `${f.englishName} · ${d.name}` }))), 'All departments') + orgSelect('Practitioner Role', 'role', roles.map((x) => ({ value: x, label: x })), 'All roles') + orgFilter('Specialty', 'specialty', 'Search specialty') + orgFilter('Designation', 'designation', 'Search designation');
    if (activeKind === 'users') extraFilters = orgFilter('User Name', 'username', 'Search user name') + orgFilter('English Name', 'englishName', 'Search name') + orgFilter('Arabic Name', 'arabicName', 'Search Arabic name') + orgFilter('Email', 'email', 'Search email') + orgSelect('User Type', 'userType', userTypes.map((x) => ({ value: x, label: x })), 'All user types') + orgSelect('Branch', 'branch', facilities.flatMap((f) => branches(f.id).map((b) => ({ value: `${f.id}|${b.code}`, label: `${f.englishName} · ${b.name}` }))), 'All branches');
    const roleNameFilter = activeKind === 'roles' ? `<label class="facility-filter"><span>Name</span><input type="search" data-query placeholder="Name" value="${esc(query)}"></label>` : extraFilters;
    root.innerHTML = `<div class="facility-grid organization-staff-grid"><div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-add>+ Add ${title.slice(0, -1)}</button></div><div class="branches-filter-grid">${roleNameFilter}${activeKind === 'roles' ? '' : `<label class="facility-filter"><span>Facility</span><select data-facility-filter><option value="">All facilities</option>${facilities.map((facility) => `<option value="${esc(facility.id)}" ${facilityFilter === String(facility.id) ? 'selected' : ''}>${esc(facility.englishName)}</option>`).join('')}</select></label>`}<label class="facility-filter"><span>Status</span><select data-status-filter><option value="">All statuses</option><option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${statusFilter === 'inactive' ? 'selected' : ''}>Inactive</option></select></div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table"><thead><tr>${columns.map((col) => `<th>${col}</th>`).join('')}</tr></thead><tbody>${slice.map((row) => display(row, activeKind)).join('')}</tbody></table></div>${filtered.length ? '' : '<div class="facility-empty">No records match these filters.</div>'}<footer class="facility-pagination"><span>Total Results: ${filtered.length}</span><div class="facility-page-controls"><button class="icon-button" data-page="first" aria-label="First page">«</button><button class="icon-button" data-page="prev" aria-label="Previous page">‹</button><span>Page ${page} of ${pages}</span><button class="icon-button" data-page="next" aria-label="Next page">›</button><button class="icon-button" data-page="last" aria-label="Last page">»</button></div></footer></div></div>`;
    root.querySelector('[data-add]').addEventListener('click', () => showModal('new'));
    const rerenderFilter = (key, value) => { if (key === 'query') query = value; else filters[key] = value; page = 1; render(); const next = root.querySelector(key === 'query' ? '[data-query]' : `[data-extra-filter="${CSS.escape(key)}"]`); next?.focus(); if (next?.setSelectionRange && next.type === 'search') next.setSelectionRange(value.length, value.length); };
    root.querySelector('[data-query]')?.addEventListener('input', (event) => rerenderFilter('query', event.currentTarget.value));
    root.querySelectorAll('[data-extra-filter]').forEach((input) => input.addEventListener(input.matches('select') ? 'change' : 'input', (event) => {
      if (event.currentTarget.matches('select')) { filters[event.currentTarget.dataset.extraFilter] = event.currentTarget.value; page = 1; render(); }
      else rerenderFilter(event.currentTarget.dataset.extraFilter, event.currentTarget.value);
    }));
    root.querySelector('[data-facility-filter]')?.addEventListener('change', (event) => { facilityFilter = event.currentTarget.value; page = 1; render(); });
    root.querySelector('[data-status-filter]').addEventListener('change', (event) => { statusFilter = event.currentTarget.value; page = 1; render(); });
    root.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => { const pages = Math.max(1, Math.ceil(rowsForView().length / pageSize)); if (button.dataset.page === 'first') page = 1; if (button.dataset.page === 'prev') page = Math.max(1, page - 1); if (button.dataset.page === 'next') page = Math.min(pages, page + 1); if (button.dataset.page === 'last') page = pages; render(); }));
    root.querySelectorAll('[data-row-menu]').forEach((button) => button.addEventListener('click', () => { const menu = button.nextElementSibling; const wasOpen = !menu.hidden; closeMenus(); menu.hidden = wasOpen; }));
    root.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
      const row = getRows(activeKind).find((item) => item.id === button.dataset.id); if (!row) return;
      if (button.dataset.action === 'view' || button.dataset.action === 'edit') showModal(button.dataset.action, row);
      if (button.dataset.action === 'assign') openRoleAssignment(row);
      if (button.dataset.action === 'password') openPasswordModal(row);
      if (button.dataset.action === 'status') { store.save(activeKind, getRows(activeKind).map((item) => item.id === row.id ? { ...item, active: !item.active } : item)); showToast(`${row.englishName || row.username} is now ${row.active ? 'Inactive' : 'Active'}.`); render(); }
    }));
  }
  function routeChange() {
    const route = location.hash.slice(1);
    if (!names[route]) return;
    activeKind = route; page = 1; query = ''; facilityFilter = ''; statusFilter = ''; filters = {}; render();
  }
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.facility-row-action')) closeMenus();
    if (modal.hidden || event.target.closest('.organization-assignment-picker')) return;
    Object.keys(assignmentPickerState).forEach((key) => { assignmentPickerState[key].open = false; });
    dialog.querySelectorAll('.organization-assignment-options').forEach((list) => { list.hidden = true; });
    dialog.querySelectorAll('[data-assignment-search], [data-assignment-toggle]').forEach((control) => control.setAttribute('aria-expanded', 'false'));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || modal.hidden) return;
    const openKey = Object.keys(assignmentPickerState).find((key) => assignmentPickerState[key].open);
    if (openKey) {
      assignmentPickerState[openKey].open = false;
      const picker = dialog.querySelector(`[data-assignment-picker="${CSS.escape(openKey)}"]`);
      if (picker) {
        picker.querySelector('.organization-assignment-options').hidden = true;
        picker.querySelector('[data-assignment-search]')?.setAttribute('aria-expanded', 'false');
        picker.querySelector('[data-assignment-toggle]')?.setAttribute('aria-expanded', 'false');
      }
      event.preventDefault(); event.stopPropagation(); return;
    }
    closeModal();
  });
  window.addEventListener('hashchange', routeChange);
  window.addEventListener('rcm:organization-staff-changed', () => { if (!modal.hidden) return; render(); });
  routeChange();
})();
