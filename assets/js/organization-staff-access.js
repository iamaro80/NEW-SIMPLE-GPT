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
    const storageKey = `rcm-facility-branches:v1:${id}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        const records = JSON.parse(raw);
        return (Array.isArray(records) ? records : []).map((x) => ({ code: x.code, name: x.englishName || x.name })).filter((x) => x.code && x.name);
      }
    } catch { /* Fall back to the prototype branch choices when storage is unavailable. */ }
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
  const practitionerAssignmentView = { facilityQuery: '', activeFacilityId: '', departmentQueries: {}, mobileStep: 'facilities' };
  const userAssignmentView = { facilityQuery: '', activeFacilityId: '', mobileStep: 'facilities' };
  const assignmentLabel = { department: 'Departments', branch: 'Branches', role: 'Roles' };
  function renderAssignmentChecklist(kind, id, selectedIds, readOnly) {
    const key = `${kind}:${id}`, query = (assignmentPickerState[key]?.query || '').trim().toLocaleLowerCase();
    const options = assignmentOptions(kind, id, selectedIds), selected = new Set(selectedIds.map(String));
    const list = options.length ? options.map((option) => {
      const isSelected = selected.has(option.value), searchable = `${option.label} ${option.detail || ''} ${option.value}`.toLocaleLowerCase();
      const locked = option.inactive && isSelected;
      return `<label class="organization-assignment-option"${query && !searchable.includes(query) ? ' hidden' : ''}><input type="checkbox" data-assignment-kind="${kind}" data-facility-id="${esc(id)}" data-assignment-option value="${esc(option.value)}" ${isSelected ? 'checked' : ''} ${readOnly || locked ? 'disabled' : ''}><span>${esc(option.label)}${option.inactive ? ' · Inactive' : ''}${option.detail ? `<small lang="ar" dir="rtl">${esc(option.detail)}</small>` : ''}</span></label>`;
    }).join('') : `<span class="organization-assignment-empty">No ${assignmentLabel[kind].toLocaleLowerCase()} are available for this facility.</span>`;
    const noMatches = options.length && query && !options.some((option) => `${option.label} ${option.detail || ''} ${option.value}`.toLocaleLowerCase().includes(query));
    return `<div class="organization-assignment-checklist" data-assignment-picker="${kind}:${esc(id)}">${readOnly ? '' : `<label class="organization-assignment-search"><span class="sr-only">Search ${assignmentLabel[kind].toLocaleLowerCase()}</span><input type="search" data-assignment-search="${kind}" data-facility-id="${esc(id)}" placeholder="Search ${assignmentLabel[kind].toLocaleLowerCase()}..." value="${esc(assignmentPickerState[key]?.query || '')}"></label>`}<div class="organization-assignment-options" role="group" aria-label="${assignmentLabel[kind]} available to ${esc(facilityName(id))}">${list}${noMatches ? '<span class="organization-assignment-empty">No matches.</span>' : ''}</div></div>`;
  }
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
    if (activeKind === 'practitioners' && mode === 'new') {
      const focused = document.body.dataset.organizationFacilityId || window.location.hash.match(/^#facilities\/(\d+)\//)?.[1];
      if (focused && facilities.some((facility) => String(facility.id) === String(focused))) result[String(focused)] ||= { departmentCodes: [] };
    }
    if (activeKind === 'users' && mode === 'new') {
      const focused = document.body.dataset.organizationFacilityId || window.location.hash.match(/^#facilities\/(\d+)\//)?.[1];
      if (focused && facilities.some((facility) => String(facility.id) === String(focused))) result[String(focused)] ||= { branchCodes: [], roleIds: [] };
    }
    return result;
  }
  function renderAssignments(selected, readOnly) {
    if (activeKind === 'practitioners') return renderPractitionerAssignments(selected, readOnly);
    if (activeKind === 'users') return renderUserAssignments(selected, readOnly);
    const ids = Object.keys(selected);
    const selector = `<div class="facility-assignment-picks">${facilities.map((f) => `<label class="form-check"><input type="checkbox" data-org-facility="${esc(f.id)}" ${ids.includes(String(f.id)) ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><span>${esc(f.englishName)}</span></label>`).join('')}</div>`;
    const panels = ids.map((id) => {
      const name = facilityName(id);
      return '';
    }).join('');
    return `${selector}${panels}`;
  }
  function userFacilityChoices() {
    const match = window.location.hash.match(/^#facilities\/(\d+)\//);
    const focusedId = document.body.dataset.organizationFacilityId || match?.[1];
    return focusedId ? facilities.filter((facility) => String(facility.id) === String(focusedId)) : facilities;
  }
  function renderUserAssignments(selected, readOnly) {
    const choices = userFacilityChoices();
    const ids = Object.keys(selected).map(String);
    const activeId = choices.some((facility) => String(facility.id) === String(userAssignmentView.activeFacilityId))
      ? String(userAssignmentView.activeFacilityId)
      : choices.find((facility) => ids.includes(String(facility.id)))?.id?.toString() || String(choices[0]?.id || '');
    userAssignmentView.activeFacilityId = activeId;
    const activeFacility = choices.find((facility) => String(facility.id) === activeId);
    const chosen = selected[activeId]?.branchCodes || [];
    const facilityNeedle = userAssignmentView.facilityQuery.trim().toLocaleLowerCase();
    const facilityRows = choices.filter((facility) => facility.englishName.toLocaleLowerCase().includes(facilityNeedle)).map((facility) => {
      const id = String(facility.id), assignment = selected[id] || {}, assignedCodes = assignment.branchCodes || [], assignedRoleCount = (assignment.roleIds || []).length, isActive = id === activeId;
      return `<div class="organization-facility-choice ${isActive ? 'is-inspected' : ''}" role="listitem"><input type="checkbox" data-org-facility="${esc(id)}" aria-label="Assign ${esc(facility.englishName)}" ${ids.includes(id) ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><button type="button" class="organization-facility-inspect" data-inspect-user-facility="${esc(id)}" aria-current="${isActive ? 'true' : 'false'}"><span class="organization-facility-choice-name">${esc(facility.englishName)}</span><span class="organization-facility-choice-meta">${assignedCodes.length} ${assignedCodes.length === 1 ? 'branch' : 'branches'} · ${assignedRoleCount} ${assignedRoleCount === 1 ? 'role' : 'roles'}</span><span class="organization-facility-choice-chevron" aria-hidden="true">›</span></button></div>`;
    }).join('') || '<div class="organization-assignment-empty">No facilities match your search.</div>';
    const selectedCount = Object.values(selected).reduce((total, assignment) => total + (assignment.branchCodes || []).length, 0);
    const selectedRoleCount = Object.values(selected).reduce((total, assignment) => total + (assignment.roleIds || []).length, 0);
    const facilityAssigned = ids.includes(activeId);
    const branchPicker = activeFacility && facilityAssigned
      ? renderAssignmentChecklist('branch', activeId, chosen, readOnly)
      : `<div class="organization-assignment-empty">${activeFacility ? 'Assign this facility to choose branches.' : 'Select a facility to see its branches.'}</div>`;
    const rolePicker = activeFacility && facilityAssigned
      ? renderAssignmentChecklist('role', activeId, selected[activeId]?.roleIds || [], readOnly)
      : `<div class="organization-assignment-empty">${activeFacility ? 'Assign this facility to choose roles.' : 'Select a facility to see its roles.'}</div>`;
    return `<div class="organization-practitioner-picker organization-user-picker is-mobile-${userAssignmentView.mobileStep}" data-user-picker>
      <div class="organization-facility-pane" aria-label="Facilities">
        <div class="organization-assignment-pane-heading"><strong>Facilities</strong><span>${ids.length} assigned</span></div>
        ${readOnly ? '' : `<label class="organization-assignment-search"><span class="sr-only">Search facilities</span><input type="search" data-user-facility-search placeholder="Search facilities..." value="${esc(userAssignmentView.facilityQuery)}"></label>`}
        <div class="organization-facility-list" role="list">${facilityRows}</div>
      </div>
      <section class="organization-department-pane organization-user-branch-pane" aria-label="Branches for ${esc(activeFacility?.englishName || 'selected facility')}" data-user-branch-detail>
        <button type="button" class="organization-assignment-back" data-user-assignment-back>‹ Back to facilities</button>
        ${activeFacility ? `<div class="organization-assignment-pane-heading organization-department-heading"><div><span class="organization-department-context">Branches · ${esc(activeFacility.englishName)}</span><strong>${chosen.length} selected</strong></div></div>` : '<div class="organization-assignment-empty">Select a facility to see its branches.</div>'}
        ${branchPicker}
        <button type="button" class="organization-assignment-next" data-user-assignment-next>Continue to roles ›</button>
      </section>
      <section class="organization-user-role-pane" aria-label="Roles for ${esc(activeFacility?.englishName || 'selected facility')}" data-user-role-detail>
        <button type="button" class="organization-assignment-back" data-user-role-back>‹ Back to branches</button>
        <div class="organization-assignment-pane-heading"><div><span class="organization-department-context">Role Assignment</span><strong>${esc(activeFacility?.englishName || 'Select a facility')}</strong></div><span>${(selected[activeId]?.roleIds || []).length} selected</span></div>
        ${rolePicker}
        ${activeFacility ? `<small class="organization-user-role-help">Roles are optional and assigned for this facility.</small>` : ''}
      </section>
      <footer class="organization-assignment-summary"><span><strong>${ids.length}</strong> ${ids.length === 1 ? 'facility' : 'facilities'} · <strong>${selectedCount}</strong> ${selectedCount === 1 ? 'branch' : 'branches'} · <strong>${selectedRoleCount}</strong> ${selectedRoleCount === 1 ? 'role' : 'roles'}</span><small>Branches and roles are optional for each assigned facility.</small></footer>
    </div>`;
  }
  function linkedRecordOptions(kind, currentRecord, assignments) {
    const facilityIds = Object.keys(assignments || {}).map(String);
    const rows = getRows(kind === 'user' ? 'users' : 'practitioners');
    const currentId = currentRecord?.id;
    return rows.filter((row) => {
      const assigned = (row.facilityIds || []).map(String);
      if (facilityIds.length && !facilityIds.some((id) => assigned.includes(id))) return false;
      const linkedId = kind === 'user' ? row.practitionerId : row.userId;
      return !linkedId || String(linkedId) === String(currentId || '');
    }).sort((a, b) => String(a.englishName || a.username).localeCompare(String(b.englishName || b.username)));
  }
  function linkedRecordField(kind, record, assignments) {
    const currentId = kind === 'user' ? (record?.userId || '') : (record?.practitionerId || '');
    const choices = linkedRecordOptions(kind, record, assignments);
    const selectedValue = choices.some((row) => String(row.id) === String(currentId)) ? currentId : '';
    const options = choices.map((row) => {
      const name = row.englishName || row.username || 'Unnamed record';
      const detail = row.username ? ` · ${row.username}` : row.documentId ? ` · ${row.documentId}` : '';
      const facilityDetail = (row.facilityIds || []).map(facilityName).join(', ');
      return `<option value="${esc(row.id)}"${String(row.id) === String(selectedValue) ? ' selected' : ''}>${esc(name + detail)}${facilityDetail ? ` · ${esc(facilityDetail)}` : ''}</option>`;
    }).join('');
    const label = kind === 'user' ? 'User' : 'Practitioner';
    const createLabel = kind === 'user' ? 'Create New User' : 'Create New Practitioner';
    return `<label class="form-field organization-linked-record-field"><span>${label}</span><select name="${kind === 'user' ? 'userId' : 'practitionerId'}" data-linked-record-select="${kind}"><option value="">No ${label.toLocaleLowerCase()} linked</option>${options}<option value="__create__">+ ${createLabel}</option></select><small>Link one ${label.toLocaleLowerCase()} record to this ${kind === 'user' ? 'practitioner' : 'user'}.</small></label>`;
  }
  function refreshLinkedRecordField(form, kind, record, assignments) {
    const old = form.querySelector(`[data-linked-record-select="${kind}"]`);
    if (!old) return;
    const selectedId = old.value;
    const holder = document.createElement('div'); holder.innerHTML = linkedRecordField(kind, record, assignments);
    const next = holder.firstElementChild, select = next.querySelector('select');
    if ([...select.options].some((option) => option.value === selectedId)) select.value = selectedId;
    old.closest('label').replaceWith(next);
  }
  function practitionerFacilityChoices() {
    const match = window.location.hash.match(/^#facilities\/(\d+)\//);
    const focusedId = document.body.dataset.organizationFacilityId || match?.[1];
    return focusedId ? facilities.filter((facility) => String(facility.id) === String(focusedId)) : facilities;
  }
  function renderPractitionerAssignments(selected, readOnly) {
    const choices = practitionerFacilityChoices();
    const ids = Object.keys(selected).map(String);
    const activeId = choices.some((facility) => String(facility.id) === String(practitionerAssignmentView.activeFacilityId))
      ? String(practitionerAssignmentView.activeFacilityId)
      : choices.find((facility) => ids.includes(String(facility.id)))?.id?.toString() || String(choices[0]?.id || '');
    practitionerAssignmentView.activeFacilityId = activeId;
    const activeFacility = choices.find((facility) => String(facility.id) === activeId);
    const activeDepartments = activeFacility ? departments(activeId) : [];
    const chosen = selected[activeId]?.departmentCodes || [];
    const departmentQuery = practitionerAssignmentView.departmentQueries[activeId] || '';
    const departmentNeedle = departmentQuery.trim().toLocaleLowerCase();
    const filteredDepartments = activeDepartments.filter((department) => `${department.name} ${department.code}`.toLocaleLowerCase().includes(departmentNeedle));
    const facilityNeedle = practitionerAssignmentView.facilityQuery.trim().toLocaleLowerCase();
    const facilityRows = choices.filter((facility) => facility.englishName.toLocaleLowerCase().includes(facilityNeedle)).map((facility) => {
      const id = String(facility.id), assignedCodes = selected[id]?.departmentCodes || [], isActive = id === activeId;
      return `<div class="organization-facility-choice ${isActive ? 'is-inspected' : ''}" role="listitem"><input type="checkbox" data-org-facility="${esc(id)}" aria-label="Assign ${esc(facility.englishName)}" ${ids.includes(id) ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><button type="button" class="organization-facility-inspect" data-inspect-facility="${esc(id)}" aria-current="${isActive ? 'true' : 'false'}"><span class="organization-facility-choice-name">${esc(facility.englishName)}</span><span class="organization-facility-choice-meta">${assignedCodes.length} ${assignedCodes.length === 1 ? 'department' : 'departments'} selected</span><span class="organization-facility-choice-chevron" aria-hidden="true">›</span></button></div>`;
    }).join('') || '<div class="organization-assignment-empty">No facilities match your search.</div>';
    const departmentRows = filteredDepartments.map((department) => {
      const isSelected = chosen.map(String).includes(String(department.code));
      return `<label class="organization-department-choice"><input type="checkbox" data-practitioner-department value="${esc(department.code)}" ${isSelected ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><span>${esc(department.name)}</span><small>${esc(department.code)}</small></label>`;
    }).join('') || `<div class="organization-assignment-empty">${activeDepartments.length ? 'No departments match your search.' : 'No departments are available for this facility. Add departments in Facility Setup first.'}</div>`;
    const selectedFacilityCount = ids.length;
    const selectedDepartmentCount = Object.values(selected).reduce((total, assignment) => total + (assignment.departmentCodes || []).length, 0);
    const visibleCodes = filteredDepartments.map((department) => String(department.code));
    const selectedVisible = visibleCodes.filter((code) => chosen.map(String).includes(code)).length;
    const selectAllLabel = departmentNeedle ? 'Select all results' : 'Select all';
    const controls = readOnly ? '' : `<div class="organization-department-actions"><button type="button" data-departments-select-all ${filteredDepartments.length ? '' : 'disabled'}>${selectAllLabel}</button><button type="button" data-departments-clear ${selectedVisible ? '' : 'disabled'}>Clear all</button></div>`;
    const backButton = `<button type="button" class="organization-assignment-back" data-assignment-back>‹ Back to facilities</button>`;
    return `<div class="organization-practitioner-picker ${practitionerAssignmentView.mobileStep === 'departments' ? 'is-mobile-detail' : ''}" data-practitioner-picker>
      <div class="organization-facility-pane" aria-label="Facilities">
        <div class="organization-assignment-pane-heading"><strong>Facilities</strong><span>${selectedFacilityCount} assigned</span></div>
        ${readOnly ? '' : `<label class="organization-assignment-search"><span class="sr-only">Search facilities</span><input type="search" data-facility-assignment-search placeholder="Search facilities..." value="${esc(practitionerAssignmentView.facilityQuery)}"></label>`}
        <div class="organization-facility-list" role="list">${facilityRows}</div>
      </div>
      <section class="organization-department-pane" aria-label="Departments for ${esc(activeFacility?.englishName || 'selected facility')}">
        ${backButton}
        ${activeFacility ? `<div class="organization-assignment-pane-heading organization-department-heading"><div><span class="organization-department-context">Current facility</span><strong>${esc(activeFacility.englishName)}</strong></div><span>${chosen.length} selected</span></div>` : '<div class="organization-assignment-empty">Select a facility to see its departments.</div>'}
        ${activeFacility ? `<label class="organization-assignment-search"><span class="sr-only">Search departments</span><input type="search" data-department-assignment-search="${esc(activeId)}" placeholder="Search departments..." value="${esc(departmentQuery)}" ${readOnly ? 'disabled' : ''}></label>${controls}<div class="organization-department-list" role="group" aria-label="Departments in ${esc(activeFacility.englishName)}">${departmentRows}</div>` : ''}
      </section>
      <footer class="organization-assignment-summary"><span><strong>${selectedFacilityCount}</strong> ${selectedFacilityCount === 1 ? 'facility' : 'facilities'} · <strong>${selectedDepartmentCount}</strong> ${selectedDepartmentCount === 1 ? 'department' : 'departments'} selected</span><small>At least one department is required for each assigned facility.</small></footer>
    </div>`;
  }
  function formMarkup(record) {
    const selected = assignmentState(record), readOnly = mode === 'view';
    if (activeKind === 'practitioners') {
      return section('Practitioner Data', field('Document ID', 'documentId', 'text', true, [], record?.documentId) + field('English Name', 'englishName', 'text', true, [], record?.englishName) + field('Arabic Name', 'arabicName', 'text', false, [], record?.arabicName) + field('Email', 'email', 'email', false, [], record?.email) + `<label class="form-field"><span>Mobile Number</span><span class="phone-control"><select name="mobileCode">${['+966', '+962', '+20', '+1', '+44'].map((c) => `<option ${c === (record?.mobileCode || '+966') ? 'selected' : ''}>${c}</option>`).join('')}</select><input name="mobile" type="tel" value="${esc(record?.mobile || '')}"></span></label>` + `<label class="form-field"><span>Phone Number</span><span class="phone-control"><select name="phoneCode">${['+966', '+962', '+20', '+1', '+44'].map((c) => `<option ${c === (record?.phoneCode || '+966') ? 'selected' : ''}>${c}</option>`).join('')}</select><input name="phone" type="tel" value="${esc(record?.phone || '')}"></span></label>` + field('Ext.', 'extension', 'text', false, [], record?.extension) + field('Practitioner Role', 'role', 'select', true, roles, record?.role) + field('Document Type', 'documentType', 'select', true, documentTypes, record?.documentType) + field('Prefix', 'prefix', 'text', false, [], record?.prefix) + field('Degree', 'degree', 'text', false, [], record?.degree) + field('License Number', 'licenseNumber', 'text', false, [], record?.licenseNumber) + field('License Start', 'licenseStart', 'date', false, [], record?.licenseStart) + field('License End', 'licenseEnd', 'date', false, [], record?.licenseEnd) + linkedRecordField('user', record, selected) + field('Consultation Item', 'consultationItem', 'select', false, ['(90487-002) ANTENATAL C.T.G. (30 MIN)', '(182519) MYELIN OLIGODENDROCYTE GLYCOPROTEIN ABS TO BIO', '(182476) CENTO ARRAY CYTO HD TO CENTOGENE', '(182453) MSI BY PCR (MICROSATELLITE INSTABILITY BY PCR)', '(182436) CASPR 2 AB', '(182411) MYELOPROLIFERATIVE NEOPLASM (CALR)', '(182407) BRAF (SEND OUT TO UNILABS)', '(182402) NRAS (SEND OUT TO UNILABS)', '(182343) ONCOTYPE DX TEST', '(182264) BRAF-PCR', '(181809) DNA EXTRACTION FOR BANKING', '(132137) KAPPA'], record?.consultationItem) + field('Follow Up', 'followUp', 'select', false, ['(90487-002) ANTENATAL C.T.G. (30 MIN)', '(182519) MYELIN OLIGODENDROCYTE GLYCOPROTEIN ABS TO BIO', '(182476) CENTO ARRAY CYTO HD TO CENTOGENE', '(182453) MSI BY PCR (MICROSATELLITE INSTABILITY BY PCR)', '(182436) CASPR 2 AB', '(182411) MYELOPROLIFERATIVE NEOPLASM (CALR)'], record?.followUp) + field('Last Designation Update On', 'lastDesignationUpdate', 'text', false, [], record?.lastDesignationUpdate || '—')) +
        section('Practitioner Role Details', field('Practitioner Specialty', 'specialty', 'select', true, specialties, record?.specialty) + field('Designation', 'designation', 'select', true, designations, record?.designation)) +
        section('SCFHS Details', ['categoryCode', 'categoryNameEn', 'specialityCode', 'specialityNameEn', 'categoryNameAr', 'specialityNameAr'].map((key) => field(key.replace(/([A-Z])/g, ' $1'), key, 'text', false, [], record?.[key] || '—')).join('')) +
        section('Facility Assignment', `<div class="form-field organization-assignment-field"><span>Facilities <b>*</b></span><div data-org-assignment-root>${renderAssignments(selected, readOnly)}</div></div>`);
    }
    if (activeKind === 'users') {
      return section('User Information', field('Arabic Name', 'arabicName', 'text', true, [], record?.arabicName) + field('English Name', 'englishName', 'text', true, [], record?.englishName) + field('User Name', 'username', 'text', true, [], record?.username) + field('Email', 'email', 'email', true, [], record?.email) + `<label class="form-field"><span>Mobile Number <b>*</b></span><span class="phone-control"><select name="mobileCode">${['+966', '+962', '+20', '+1', '+44'].map((c) => `<option ${c === (record?.mobileCode || '+966') ? 'selected' : ''}>${c}</option>`).join('')}</select><input name="mobile" type="tel" required value="${esc(record?.mobile || '')}"></span></label>` + field('User Type', 'userType', 'select', true, userTypes, record?.userType) + field('Notes', 'notes', 'textarea', false, [], record?.notes) + linkedRecordField('practitioner', record, selected)) + section('Facility, Branch & Role Assignment', `<div class="form-field organization-assignment-field"><span>Assign facilities, then choose optional branches and roles for each facility <b>*</b></span><div data-org-assignment-root>${renderAssignments(selected, readOnly)}</div></div>`);
    }
    const permissions = store.permissions;
    return section('Role Information', field('Arabic Name', 'arabicName', 'text', true, [], record?.arabicName) + field('English Name', 'englishName', 'text', true, [], record?.englishName)) +
      section('Role Permissions', `<label class="facility-filter"><span>Search permissions</span><input type="search" data-permission-search placeholder="Search permissions" ${readOnly ? 'disabled' : ''}></label><label class="form-check"><input type="checkbox" data-permission-all ${record?.permissionIds?.length === permissions.length ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><span>Select all permissions</span></label><div class="organization-permission-list" data-permission-list>${permissions.map((item) => `<label class="form-check" data-permission-row><input type="checkbox" name="permissionIds" value="${esc(item.id)}" ${record?.permissionIds?.includes(item.id) ? 'checked' : ''} ${readOnly ? 'disabled' : ''}><span>${esc(item.name)} <small>· ${esc(item.module)} · ${esc(item.id)}</small></span></label>`).join('')}</div>`);
  }
  function openOrganizationChild(kind, parentForm, parentRecord, assignments, onCreated) {
    const focusedId = document.body.dataset.organizationFacilityId || window.location.hash.match(/^#facilities\/(\d+)\//)?.[1];
    const choices = focusedId ? facilities.filter((facility) => String(facility.id) === String(focusedId)) : facilities;
    const parentValues = Object.fromEntries([...new FormData(parentForm).entries()]);
    const defaultIds = Object.keys(assignments || {});
    const child = document.createElement('div'); child.className = 'patient-modal-backdrop organization-linked-child-backdrop';
    const facilityAssignments = kind === 'user'
      ? choices.map((facility) => {
        const id = String(facility.id), assigned = defaultIds.includes(id), branchChoices = branches(id), availableRoles = roleChoices();
        return `<fieldset class="organization-linked-child-facility"><legend><label class="form-check"><input type="checkbox" data-child-facility="${esc(id)}" ${assigned ? 'checked' : ''}><span>${esc(facility.englishName)}</span></label></legend><div class="organization-linked-child-columns"><div><strong>Branches</strong>${branchChoices.map((item) => `<label class="form-check"><input type="checkbox" data-child-assignment="branch" data-facility-id="${esc(id)}" value="${esc(item.value)}" ${assigned && (assignments[id]?.branchCodes || []).map(String).includes(String(item.value)) ? 'checked' : ''} ${assigned ? '' : 'disabled'}><span>${esc(item.label)}</span></label>`).join('') || '<small>No branches are available.</small>'}</div><div><strong>Roles</strong>${availableRoles.map((item) => `<label class="form-check"><input type="checkbox" data-child-assignment="role" data-facility-id="${esc(id)}" value="${esc(item.id)}" ${assigned && (assignments[id]?.roleIds || []).map(String).includes(String(item.id)) ? 'checked' : ''} ${assigned ? '' : 'disabled'}><span>${esc(item.englishName)}</span></label>`).join('') || '<small>No active roles are available.</small>'}</div></div></fieldset>`;
      }).join('')
      : choices.map((facility) => {
        const id = String(facility.id), assigned = defaultIds.includes(id), deptChoices = departments(id);
        const selectedCodes = assignments[id]?.departmentCodes || [];
        return `<fieldset class="organization-linked-child-facility"><legend><label class="form-check"><input type="checkbox" data-child-facility="${esc(id)}" ${assigned ? 'checked' : ''}><span>${esc(facility.englishName)}</span></label></legend><div class="organization-linked-child-departments">${deptChoices.map((item) => `<label class="form-check"><input type="checkbox" data-child-assignment="department" data-facility-id="${esc(id)}" value="${esc(item.code)}" ${selectedCodes.map(String).includes(String(item.code)) ? 'checked' : ''} ${assigned ? '' : 'disabled'}><span>${esc(item.name)}</span></label>`).join('') || '<small>No departments are configured.</small>'}</div></fieldset>`;
      }).join('');
    const infoFields = kind === 'user'
      ? `<label class="form-field"><span>Arabic Name <b>*</b></span><input name="arabicName" required dir="rtl" value="${esc(parentValues.arabicName || '')}"></label><label class="form-field"><span>English Name <b>*</b></span><input name="englishName" required value="${esc(parentValues.englishName || '')}"></label><label class="form-field"><span>User Name <b>*</b></span><input name="username" required></label><label class="form-field"><span>Email <b>*</b></span><input name="email" type="email" required value="${esc(parentValues.email || '')}"></label><label class="form-field"><span>Mobile Number <b>*</b></span><span class="phone-control"><select name="mobileCode"><option ${parentValues.mobileCode === '+966' || !parentValues.mobileCode ? 'selected' : ''}>+966</option><option>+962</option><option>+20</option><option>+1</option><option>+44</option></select><input name="mobile" required type="tel" value="${esc(parentValues.mobile || '')}"></span></label><label class="form-field"><span>User Type <b>*</b></span><select name="userType" required><option>Employee</option><option>Business Center</option><option>Overtimer</option><option>System Administrator</option></select></label><label class="form-field"><span>Notes</span><textarea name="notes" rows="3"></textarea></label>`
      : `<label class="form-field"><span>Document ID <b>*</b></span><input name="documentId" required></label><label class="form-field"><span>English Name <b>*</b></span><input name="englishName" required value="${esc(parentValues.englishName || '')}"></label><label class="form-field"><span>Arabic Name</span><input name="arabicName" dir="rtl" value="${esc(parentValues.arabicName || '')}"></label><label class="form-field"><span>Email</span><input name="email" type="email" value="${esc(parentValues.email || '')}"></label><label class="form-field"><span>Mobile Number</span><span class="phone-control"><select name="mobileCode"><option ${parentValues.mobileCode === '+966' || !parentValues.mobileCode ? 'selected' : ''}>+966</option><option>+962</option><option>+20</option><option>+1</option><option>+44</option></select><input name="mobile" type="tel" value="${esc(parentValues.mobile || '')}"></span></label><label class="form-field"><span>Practitioner Role <b>*</b></span><select name="role" required><option value="">Select role</option>${roles.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label><label class="form-field"><span>Document Type <b>*</b></span><select name="documentType" required><option value="">Select document type</option>${documentTypes.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label><label class="form-field"><span>Practitioner Specialty <b>*</b></span><select name="specialty" required><option value="">Select specialty</option>${specialties.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label><label class="form-field"><span>Designation <b>*</b></span><select name="designation" required><option value="">Select designation</option>${designations.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label>`;
    const consultationItems = ['(90487-002) ANTENATAL C.T.G. (30 MIN)', '(182519) MYELIN OLIGODENDROCYTE GLYCOPROTEIN ABS TO BIO', '(182476) CENTO ARRAY CYTO HD TO CENTOGENE', '(182453) MSI BY PCR (MICROSATELLITE INSTABILITY BY PCR)', '(182436) CASPR 2 AB', '(182411) MYELOPROLIFERATIVE NEOPLASM (CALR)', '(182407) BRAF (SEND OUT TO UNILABS)', '(182402) NRAS (SEND OUT TO UNILABS)', '(182343) ONCOTYPE DX TEST', '(182264) BRAF-PCR', '(181809) DNA EXTRACTION FOR BANKING', '(132137) KAPPA'];
    const practitionerExtras = kind === 'practitioner' ? `<label class="form-field"><span>Phone Number</span><span class="phone-control"><select name="phoneCode"><option selected>+966</option><option>+962</option><option>+20</option><option>+1</option><option>+44</option></select><input name="phone" type="tel"></span></label><label class="form-field"><span>Ext.</span><input name="extension"></label><label class="form-field"><span>Prefix</span><input name="prefix"></label><label class="form-field"><span>Degree</span><input name="degree"></label><label class="form-field"><span>License Number</span><input name="licenseNumber"></label><label class="form-field"><span>License Start</span><input name="licenseStart" type="date"></label><label class="form-field"><span>License End</span><input name="licenseEnd" type="date"></label><label class="form-field"><span>Consultation Item</span><select name="consultationItem"><option value="">Select consultation item</option>${consultationItems.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label><label class="form-field"><span>Follow Up</span><select name="followUp"><option value="">Select follow up</option>${consultationItems.slice(0, 6).map((item) => `<option>${esc(item)}</option>`).join('')}</select></label><label class="form-field"><span>Last Designation Update On</span><input readonly value="—"></label>` : '';
    child.innerHTML = `<section class="patient-modal organization-linked-child-modal" role="dialog" aria-modal="true"><header class="patient-modal-header"><div><p class="eyebrow">${kind === 'user' ? 'USER RECORD' : 'PRACTITIONER RECORD'}</p><h2>Create ${kind === 'user' ? 'User' : 'Practitioner'}</h2><p>Saved immediately; it links when you save this ${kind === 'user' ? 'practitioner' : 'user'}.</p></div><button class="icon-button" type="button" data-child-close aria-label="Close dialog">×</button></header><form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">${kind === 'user' ? 'User Information' : 'Practitioner Information'}</legend><div class="facility-form-section-heading">${kind === 'user' ? 'User Information' : 'Practitioner Information'}</div><div class="patient-form-grid">${infoFields}${practitionerExtras}</div></fieldset><fieldset class="patient-form-section"><legend class="sr-only">Facility Assignment</legend><div class="facility-form-section-heading">Facility Assignment</div><p class="muted">${kind === 'user' ? 'Choose facilities, optional branches, and optional roles.' : 'Choose facilities and at least one department for each.'}</p>${facilityAssignments}</fieldset></div><footer class="patient-modal-footer"><span><small><b>*</b> Required fields</small></span><div><button type="button" class="button button-secondary" data-child-cancel>Cancel</button><button type="submit" class="button button-primary">Create ${kind === 'user' ? 'User' : 'Practitioner'}</button></div></footer></form></section>`;
    document.body.append(child);
    const close = () => child.remove();
    child.querySelectorAll('[data-child-close], [data-child-cancel]').forEach((button) => button.addEventListener('click', close));
    child.addEventListener('click', (event) => { if (event.target === child) close(); });
    child.addEventListener('change', (event) => {
      const facilityInput = event.target.closest('[data-child-facility]'); if (!facilityInput) return;
      child.querySelectorAll(`[data-facility-id="${CSS.escape(facilityInput.dataset.childFacility)}"]`).forEach((input) => { input.disabled = !facilityInput.checked; if (!facilityInput.checked) input.checked = false; });
    });
    child.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
      const assignedIds = [...child.querySelectorAll('[data-child-facility]:checked')].map((input) => String(input.dataset.childFacility));
      if (!assignedIds.length) { window.alert('Assign this record to at least one facility.'); return; }
      const assignmentsByFacility = {}, departmentsByFacility = {};
      assignedIds.forEach((id) => {
        if (kind === 'user') {
          const branchCodes = [...child.querySelectorAll(`[data-child-assignment="branch"][data-facility-id="${CSS.escape(id)}"]:checked`)].map((input) => input.value);
          assignmentsByFacility[id] = { branchCode: branchCodes[0] || '', branchCodes, roleIds: [...child.querySelectorAll(`[data-child-assignment="role"][data-facility-id="${CSS.escape(id)}"]:checked`)].map((input) => input.value) };
        } else departmentsByFacility[id] = [...child.querySelectorAll(`[data-child-assignment="department"][data-facility-id="${CSS.escape(id)}"]:checked`)].map((input) => input.value);
      });
      if (kind === 'practitioner' && assignedIds.some((id) => !departmentsByFacility[id]?.length)) { window.alert('Select at least one department for each assigned facility.'); return; }
      const rows = getRows(kind === 'user' ? 'users' : 'practitioners');
      const result = kind === 'user'
        ? { id: store.nextId('user'), arabicName: form.elements.arabicName.value.trim(), englishName: form.elements.englishName.value.trim(), username: form.elements.username.value.trim(), email: form.elements.email.value.trim(), mobileCode: form.elements.mobileCode.value, mobile: form.elements.mobile.value.trim(), userType: form.elements.userType.value, notes: form.elements.notes.value.trim(), facilityIds: assignedIds, assignmentsByFacility, active: true }
        : { id: store.nextId('practitioner'), documentId: form.elements.documentId.value.trim(), englishName: form.elements.englishName.value.trim(), arabicName: form.elements.arabicName.value.trim(), email: form.elements.email.value.trim(), mobileCode: form.elements.mobileCode.value, mobile: form.elements.mobile.value.trim(), phoneCode: form.elements.phoneCode.value, phone: form.elements.phone.value.trim(), extension: form.elements.extension.value.trim(), role: form.elements.role.value, documentType: form.elements.documentType.value, prefix: form.elements.prefix.value.trim(), degree: form.elements.degree.value.trim(), licenseNumber: form.elements.licenseNumber.value.trim(), licenseStart: form.elements.licenseStart.value, licenseEnd: form.elements.licenseEnd.value, consultationItem: form.elements.consultationItem.value, followUp: form.elements.followUp.value, lastDesignationUpdate: '—', specialty: form.elements.specialty.value, designation: form.elements.designation.value, facilityIds: assignedIds, departmentsByFacility, active: true };
      const duplicate = rows.some((row) => kind === 'user' ? row.username?.toLocaleLowerCase() === result.username.toLocaleLowerCase() : String(row.documentId) === result.documentId);
      if (duplicate) { window.alert(kind === 'user' ? 'User Name already exists.' : 'Document ID already exists.'); return; }
      store.save(kind === 'user' ? 'users' : 'practitioners', [...rows, result]);
      onCreated(result); close(); showToast(`${kind === 'user' ? result.englishName : result.englishName} was created. Save the current record to link it.`);
    });
  }
  function showModal(nextMode, record = null) {
    dialogEventsController?.abort();
    dialogEventsController = new AbortController();
    const eventOptions = { signal: dialogEventsController.signal };
    mode = nextMode; modalRecordId = record?.id || null;
    Object.keys(assignmentPickerState).forEach((key) => { delete assignmentPickerState[key]; });
    practitionerAssignmentView.facilityQuery = '';
    practitionerAssignmentView.departmentQueries = {};
    practitionerAssignmentView.activeFacilityId = '';
    practitionerAssignmentView.mobileStep = 'facilities';
    userAssignmentView.facilityQuery = '';
    userAssignmentView.activeFacilityId = '';
    userAssignmentView.mobileStep = 'facilities';
    const title = `${mode === 'new' ? 'Add' : mode === 'edit' ? 'Edit' : 'View'} ${activeKind === 'roles' ? 'Role' : activeKind === 'users' ? 'User' : 'Practitioner'}`;
    dialog.className = 'patient-modal facility-modal organization-staff-modal';
    const description = mode === 'view' ? 'Read-only record details.' : activeKind === 'roles' ? 'Manage this organization-wide role and its permissions.' : activeKind === 'users' ? 'Manage this user and facility-specific branch and role assignments.' : 'Manage this record and its facility assignments.';
    dialog.innerHTML = `<header class="patient-modal-header"><div><p class="eyebrow">ORGANIZATION STAFF & ACCESS</p><h2>${title}</h2><p>${description}</p></div><button class="icon-button" type="button" data-close aria-label="Close dialog">×</button></header><form><div class="patient-modal-body">${formMarkup(record)}</div><footer class="patient-modal-footer"><span><small><b>*</b> Required fields</small></span><div><button type="button" class="button button-secondary" data-cancel>Cancel</button><button type="submit" class="button button-primary" ${mode === 'view' ? 'hidden' : ''}>${mode === 'new' ? 'Create' : 'Save changes'}</button></div></footer></form>`;
    modal.hidden = false; document.body.classList.add('patient-modal-open');
    const form = dialog.querySelector('form');
    if (mode === 'view') form.querySelectorAll('input, select, textarea').forEach((control) => { control.disabled = true; });
    ['categoryCode', 'categoryNameEn', 'specialityCode', 'specialityNameEn', 'categoryNameAr', 'specialityNameAr', 'lastDesignationUpdate'].forEach((name) => { const control = form.elements.namedItem(name); if (control) control.readOnly = true; });
    const selected = assignmentState(record);
    function refreshAssignments() {
      const root = dialog.querySelector('[data-org-assignment-root]');
      if (root) root.innerHTML = renderAssignments(selected, mode === 'view');
    }
    dialog.addEventListener('change', (event) => {
      const checkbox = event.target.closest('[data-org-facility]');
      if (checkbox) {
        const id = String(checkbox.dataset.orgFacility);
        if (checkbox.checked) selected[id] ||= activeKind === 'practitioners' ? { departmentCodes: [] } : { branchCodes: [], roleIds: [] };
        else {
          const assignedDepartments = selected[id]?.departmentCodes || [];
          const userAssignment = selected[id] || {};
          const assignedBranches = userAssignment.branchCodes || (userAssignment.branchCode ? [userAssignment.branchCode] : []);
          const assignedRoles = userAssignment.roleIds || [];
          if (activeKind === 'practitioners' && assignedDepartments.length && !window.confirm(`Unassigning ${facilityName(id)} will remove its ${assignedDepartments.length} department ${assignedDepartments.length === 1 ? 'assignment' : 'assignments'}. Continue?`)) {
            refreshAssignments();
            return;
          }
          if (activeKind === 'users' && (assignedBranches.length || assignedRoles.length) && !window.confirm(`Unassigning ${facilityName(id)} will remove its branch and role assignments. Continue?`)) {
            refreshAssignments();
            return;
          }
          delete selected[id];
          Object.keys(assignmentPickerState).filter((key) => key.endsWith(`:${id}`)).forEach((key) => { delete assignmentPickerState[key]; });
        }
        refreshAssignments();
        if (activeKind !== 'roles') refreshLinkedRecordField(form, activeKind === 'practitioners' ? 'user' : 'practitioner', record, selected);
        return;
      }
      const department = event.target.closest('[data-practitioner-department]');
      if (department) {
        const id = String(practitionerAssignmentView.activeFacilityId), codes = new Set((selected[id]?.departmentCodes || []).map(String));
        if (department.checked) {
          selected[id] ||= { departmentCodes: [] };
          codes.add(String(department.value));
        } else codes.delete(String(department.value));
        selected[id] ||= { departmentCodes: [] };
        selected[id].departmentCodes = [...codes];
        refreshAssignments();
        refreshLinkedRecordField(form, 'user', record, selected);
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
      if (activeKind !== 'roles') refreshLinkedRecordField(form, activeKind === 'practitioners' ? 'user' : 'practitioner', record, selected);
    }, eventOptions);
    dialog.addEventListener('change', (event) => {
      const select = event.target.closest('[data-linked-record-select]');
      if (!select || select.value !== '__create__') return;
      const kind = select.dataset.linkedRecordSelect;
      select.value = '';
      openOrganizationChild(kind, form, record, selected, (created) => {
        refreshLinkedRecordField(form, kind, record, selected);
        const updated = form.querySelector(`[data-linked-record-select="${kind}"]`);
        if (updated && [...updated.options].some((option) => option.value === String(created.id))) updated.value = created.id;
      });
    }, eventOptions);
    dialog.addEventListener('input', (event) => {
      const facilitySearch = event.target.closest('[data-facility-assignment-search]');
      if (facilitySearch) {
        practitionerAssignmentView.facilityQuery = facilitySearch.value;
        const cursor = facilitySearch.selectionStart;
        refreshAssignments();
        const next = dialog.querySelector('[data-facility-assignment-search]');
        next?.focus(); next?.setSelectionRange(cursor, cursor);
        return;
      }
      const userFacilitySearch = event.target.closest('[data-user-facility-search]');
      if (userFacilitySearch) {
        userAssignmentView.facilityQuery = userFacilitySearch.value;
        const cursor = userFacilitySearch.selectionStart;
        refreshAssignments();
        const next = dialog.querySelector('[data-user-facility-search]');
        next?.focus(); next?.setSelectionRange(cursor, cursor);
        return;
      }
      const departmentSearch = event.target.closest('[data-department-assignment-search]');
      if (departmentSearch) {
        const id = String(departmentSearch.dataset.departmentAssignmentSearch);
        practitionerAssignmentView.departmentQueries[id] = departmentSearch.value;
        const cursor = departmentSearch.selectionStart;
        refreshAssignments();
        const next = dialog.querySelector(`[data-department-assignment-search="${CSS.escape(id)}"]`);
        next?.focus(); next?.setSelectionRange(cursor, cursor);
        return;
      }
      const input = event.target.closest('[data-assignment-search]');
      if (!input) return;
      const kind = input.dataset.assignmentSearch, id = String(input.dataset.facilityId), key = `${kind}:${id}`;
      assignmentPickerState[key] = { ...(assignmentPickerState[key] || {}), open: kind === 'department', query: input.value };
      const cursor = input.selectionStart;
      refreshAssignments();
      const next = dialog.querySelector(`[data-assignment-search="${CSS.escape(kind)}"][data-facility-id="${CSS.escape(id)}"]`);
      next?.focus(); next?.setSelectionRange(cursor, cursor);
    }, eventOptions);
    dialog.addEventListener('click', (event) => {
      const inspector = event.target.closest('[data-inspect-facility]');
      if (inspector) {
        practitionerAssignmentView.activeFacilityId = String(inspector.dataset.inspectFacility);
        practitionerAssignmentView.mobileStep = 'departments';
        refreshAssignments();
        return;
      }
      const userInspector = event.target.closest('[data-inspect-user-facility]');
      if (userInspector) {
        userAssignmentView.activeFacilityId = String(userInspector.dataset.inspectUserFacility);
        userAssignmentView.mobileStep = 'branches';
        refreshAssignments();
        return;
      }
      if (event.target.closest('[data-user-assignment-next]')) {
        userAssignmentView.mobileStep = 'roles';
        refreshAssignments();
        return;
      }
      if (event.target.closest('[data-user-role-back]')) {
        userAssignmentView.mobileStep = 'branches';
        refreshAssignments();
        return;
      }
      if (event.target.closest('[data-assignment-back]')) {
        practitionerAssignmentView.mobileStep = 'facilities';
        refreshAssignments();
        dialog.querySelector('[data-facility-assignment-search]')?.focus();
        return;
      }
      if (event.target.closest('[data-user-assignment-back]')) {
        userAssignmentView.mobileStep = 'facilities';
        refreshAssignments();
        dialog.querySelector('[data-user-facility-search]')?.focus();
        return;
      }
      if (event.target.closest('[data-departments-select-all]')) {
        const id = String(practitionerAssignmentView.activeFacilityId), query = practitionerAssignmentView.departmentQueries[id] || '';
        const visibleCodes = departments(id).filter((department) => `${department.name} ${department.code}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).map((department) => String(department.code));
        if (visibleCodes.length) {
          selected[id] ||= { departmentCodes: [] };
          selected[id].departmentCodes = [...new Set([...(selected[id].departmentCodes || []).map(String), ...visibleCodes])];
        }
        refreshAssignments();
        return;
      }
      if (event.target.closest('[data-departments-clear]')) {
        const id = String(practitionerAssignmentView.activeFacilityId), query = (practitionerAssignmentView.departmentQueries[id] || '').trim().toLocaleLowerCase();
        const visibleCodes = departments(id).filter((department) => `${department.name} ${department.code}`.toLocaleLowerCase().includes(query)).map((department) => String(department.code));
        const selectedCodes = selected[id]?.departmentCodes || [];
        const remaining = selectedCodes.filter((code) => !visibleCodes.includes(String(code)));
        if (!remaining.length && selectedCodes.length && !window.confirm(`Clearing these departments will unassign ${facilityName(id)}. Continue?`)) return;
        if (remaining.length) selected[id].departmentCodes = remaining;
        else delete selected[id];
        refreshAssignments();
        refreshLinkedRecordField(form, 'user', record, selected);
        return;
      }
      const remove = event.target.closest('[data-assignment-remove]');
      if (remove) {
        const id = String(remove.dataset.facilityId), kind = remove.dataset.assignmentKind;
        const prop = kind === 'department' ? 'departmentCodes' : kind === 'branch' ? 'branchCodes' : 'roleIds';
        selected[id][prop] = (selected[id][prop] || []).filter((value) => String(value) !== String(remove.dataset.assignmentRemove));
        if (kind === 'branch') selected[id].branchCode = selected[id].branchCodes[0] || '';
        refreshAssignments();
        if (kind === 'department') refreshLinkedRecordField(form, 'user', record, selected);
        dialog.querySelector(`[data-assignment-search="${CSS.escape(kind)}"][data-facility-id="${CSS.escape(id)}"]`)?.focus();
        return;
      }
      const toggle = event.target.closest('[data-assignment-toggle]');
      const control = event.target.closest('.organization-assignment-control');
      const picker = event.target.closest('[data-assignment-picker]');
      if (!picker) return;
      if (picker.classList.contains('organization-assignment-checklist')) return;
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
      if (input.dataset.assignmentSearch !== 'department') return;
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
        const linkedUser = data.userId ? getRows('users').find((row) => String(row.id) === String(data.userId)) : null;
        if (data.userId && (!linkedUser || !assignedIds.some((id) => (linkedUser.facilityIds || []).map(String).includes(String(id))))) { window.alert('The linked user must share at least one assigned facility.'); return; }
        if (linkedUser?.practitionerId && String(linkedUser.practitionerId) !== String(result.id)) { window.alert('This user is already linked to another practitioner. Clear that link first.'); return; }
        rows = current ? rows.map((row) => row.id === current.id ? result : row) : [...rows, result];
      } else if (activeKind === 'users') {
        if (rows.some((row) => row.username === data.username && row.id !== modalRecordId)) { form.elements.username.setCustomValidity('User Name already exists in the organization.'); form.reportValidity(); form.elements.username.setCustomValidity(''); return; }
        const assignmentsByFacility = Object.fromEntries(assignedIds.map((id) => [id, {
          branchCode: selected[id]?.branchCodes?.[0] || '', branchCodes: [...(selected[id]?.branchCodes || [])],
          roleIds: [...(selected[id]?.roleIds || [])],
        }]));
        const result = { ...(current || {}), ...data, facilityIds: assignedIds, assignmentsByFacility, active: current?.active ?? true, id: current?.id || store.nextId('user') };
        const linkedPractitioner = data.practitionerId ? getRows('practitioners').find((row) => String(row.id) === String(data.practitionerId)) : null;
        if (data.practitionerId && (!linkedPractitioner || !assignedIds.some((id) => (linkedPractitioner.facilityIds || []).map(String).includes(String(id))))) { window.alert('The linked practitioner must share at least one assigned facility.'); return; }
        if (linkedPractitioner?.userId && String(linkedPractitioner.userId) !== String(result.id)) { window.alert('This practitioner is already linked to another user. Clear that link first.'); return; }
        rows = current ? rows.map((row) => row.id === current.id ? result : row) : [...rows, result];
      } else {
        const permissionIds = [...dialog.querySelectorAll('[name="permissionIds"]:checked')].map((box) => box.value);
        const result = { ...(current || {}), id: current?.id || store.nextId('role'), arabicName: data.arabicName, englishName: data.englishName, facilityIds: facilities.map((facility) => String(facility.id)), organizationWide: true, permissionIds, active: current?.active ?? true };
        rows = current ? rows.map((row) => row.id === current.id ? result : row) : [...rows, result];
      }
      store.save(activeKind, rows);
      if (activeKind === 'practitioners') {
        const saved = rows.find((row) => row.documentId === data.documentId);
        const linked = store.link('practitioners', saved?.id, data.userId || '');
        if (!linked.ok) { window.alert(linked.reason === 'facility-mismatch' ? 'The linked records must share a facility.' : 'The selected user is already linked elsewhere.'); return; }
      }
      if (activeKind === 'users') {
        const saved = rows.find((row) => row.username === data.username);
        const linked = store.link('users', saved?.id, data.practitionerId || '');
        if (!linked.ok) { window.alert(linked.reason === 'facility-mismatch' ? 'The linked records must share a facility.' : 'The selected practitioner is already linked elsewhere.'); return; }
      }
      closeModal(); showToast(`${title} ${mode === 'new' ? 'created' : 'saved'}.`); render();
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
    if (kind === 'practitioners') return `<tr><td>${esc(row.documentId)}</td><td>${esc(row.englishName)}<small class="practitioner-arabic-name" dir="rtl">${esc(row.arabicName || '')}</small></td>${facilityCell}<td>${esc(row.role || '—')}</td><td>${esc(row.specialty || '—')}</td><td>${esc(row.designation || '—')}</td><td>${status}</td><td>${actions}</td></tr>`;
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
    const columns = activeKind === 'practitioners' ? ['Document ID', 'Name', 'Facility', 'Practitioner Role', 'Specialty', 'Designation', 'Status', 'Actions'] : activeKind === 'users' ? ['User Name', 'English Name', 'Email', 'Mobile Number', 'Facility', 'Branch', 'User Type', 'Status', 'Actions'] : ['English Name', 'Arabic Name', 'Status', 'Actions'];
    const orgFilter = (label, key, placeholder) => `<label class="facility-filter"><span>${label}</span><input type="search" data-extra-filter="${key}" placeholder="${placeholder}" value="${esc(filters[key] || '')}"></label>`;
    const orgSelect = (label, key, options, allLabel) => `<label class="facility-filter"><span>${label}</span><select data-extra-filter="${key}"><option value="">${allLabel}</option>${options.map((o) => `<option value="${esc(o.value)}" ${filters[key] === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>`;
    let extraFilters = '';
    if (activeKind === 'practitioners') extraFilters = orgFilter('Document ID', 'documentId', 'Search document ID') + orgFilter('English Name', 'englishName', 'Search name') + orgSelect('Department', 'department', facilities.flatMap((f) => departments(f.id).map((d) => ({ value: `${f.id}|${d.code}`, label: `${f.englishName} · ${d.name}` }))), 'All departments') + orgSelect('Practitioner Role', 'role', roles.map((x) => ({ value: x, label: x })), 'All roles') + orgFilter('Specialty', 'specialty', 'Search specialty') + orgFilter('Designation', 'designation', 'Search designation');
    if (activeKind === 'users') extraFilters = orgFilter('User Name', 'username', 'Search user name') + orgFilter('English Name', 'englishName', 'Search name') + orgFilter('Arabic Name', 'arabicName', 'Search Arabic name') + orgFilter('Email', 'email', 'Search email') + orgSelect('User Type', 'userType', userTypes.map((x) => ({ value: x, label: x })), 'All user types') + orgSelect('Branch', 'branch', facilities.flatMap((f) => branches(f.id).map((b) => ({ value: `${f.id}|${b.code}`, label: `${f.englishName} · ${b.name}` }))), 'All branches');
    const roleNameFilter = activeKind === 'roles' ? `<label class="facility-filter"><span>Name</span><input type="search" data-query placeholder="Name" value="${esc(query)}"></label>` : extraFilters;
    root.innerHTML = `<div class="facility-grid organization-staff-grid"><div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-add>+ Add ${title.slice(0, -1)}</button></div><div class="branches-filter-grid">${roleNameFilter}${activeKind === 'roles' ? '' : `<label class="facility-filter"><span>Facility</span><select data-facility-filter><option value="">All facilities</option>${facilities.map((facility) => `<option value="${esc(facility.id)}" ${facilityFilter === String(facility.id) ? 'selected' : ''}>${esc(facility.englishName)}</option>`).join('')}</select></label>`}<label class="facility-filter"><span>Status</span><select data-status-filter><option value="">All statuses</option><option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${statusFilter === 'inactive' ? 'selected' : ''}>Inactive</option></select></div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table ${activeKind === 'practitioners' ? 'practitioners-table' : ''}"><thead><tr>${columns.map((col) => `<th>${col}</th>`).join('')}</tr></thead><tbody>${slice.map((row) => display(row, activeKind)).join('')}</tbody></table></div>${filtered.length ? '' : '<div class="facility-empty">No records match these filters.</div>'}<footer class="facility-pagination"><span>Total Results: ${filtered.length}</span><div class="facility-page-controls"><button class="icon-button" data-page="first" aria-label="First page">«</button><button class="icon-button" data-page="prev" aria-label="Previous page">‹</button><span>Page ${page} of ${pages}</span><button class="icon-button" data-page="next" aria-label="Next page">›</button><button class="icon-button" data-page="last" aria-label="Last page">»</button></div></footer></div></div>`;
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
    Object.keys(assignmentPickerState).forEach((key) => { if (key.startsWith('department:')) assignmentPickerState[key].open = false; });
    dialog.querySelectorAll('.organization-assignment-picker .organization-assignment-options').forEach((list) => { list.hidden = true; });
    dialog.querySelectorAll('.organization-assignment-picker [data-assignment-search], .organization-assignment-picker [data-assignment-toggle]').forEach((control) => control.setAttribute('aria-expanded', 'false'));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || modal.hidden) return;
    const openKey = Object.keys(assignmentPickerState).find((key) => key.startsWith('department:') && assignmentPickerState[key].open);
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
