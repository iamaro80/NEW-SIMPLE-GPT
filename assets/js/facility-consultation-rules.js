(() => {
  const grid = document.querySelector('[data-consultation-rules-grid]');
  if (!grid) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const storageKey = `rcm-facility-consultation-rules:v1:${facilityId}`;
  const departmentsKey = `rcm-facility-departments:v1:${facilityId}`;
  const practitionersKey = `rcm-facility-practitioners:v1:${facilityId}`;
  const pageSize = 5;
  const visitReasons = ['NEW', 'FOLLOW-UP'];
  const coverageOptions = ['Covered', 'Not Covered'];
  const yesNo = ['Yes', 'No'];
  const specialties = ['Anesthesiology Specialty', 'Ambulatory Anesthesia', 'Anesthesia Cardiology', 'Neuro-Anesthesia', 'Obstetrics Anesthesia', 'Pediatrics Anesthesia', 'Pediatrics Cardiac Anesthesia', 'Regional Anesthesia', 'Vascular / Thoracic Anesthesia', 'Community Medicine Specialty', 'Community Health', 'Dermatology Specialty', 'Dermatology Surgery', 'Hair Implant Dermatology', 'Pediatrics Dermatology', 'Emergency Medicine Specialty', 'Adult Emergency Medicine'];
  const scfhsCategories = ['Pharmacist-in-training', 'General', 'Technician', 'Senior Specialist', 'Pharmacist', 'Health Assistant', 'General Dentist', 'Senior Registrar', 'Specialist', 'Training Resident', 'Senior Pharmacist', 'Consultant', 'Fellow', 'Resident', 'Registrar', 'Nurse-in-training'];
  const items = ['(90487-002) ANTENATAL C.T.G. (30 MIN)', '(182519) MYELIN OLIGODENDROCYTE GLYCOPROTEIN ABS TO BIO', '(182476) CENTO ARRAY CYTO HD TO CENTOGENE', '(182453) MSI BY PCR (MICROSATELLITE INSTABILITY BY PCR)', '(182436) CASPR 2 AB', '(182411) MYELOPROLIFERATIVE NEOPLASM (CALR)', '(182407) BRAF (SEND OUT TO UNILABS)', '(182402) NRAS (SEND OUT TO UNILABS)', '(182343) ONCOTYPE DX TEST', '(182264) BRAF-PCR', '(181809) DNA EXTRACTION FOR BANKING', '(132137) KAPPA'];
  const icon = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>',
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const readArray = (key) => { try { const data = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } };
  const readOptions = (key, fallback = []) => { const saved = readArray(key); return saved.length ? saved : fallback; };
  const dateToday = () => new Date().toISOString().slice(0, 10);
  const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB') : '—';
  const itemCode = (value = '') => value.match(/^\(([^)]+)\)/)?.[1] || '—';
  const itemName = (value = '') => value.replace(/^\([^)]+\)\s*/, '') || '—';
  let departments = readOptions(departmentsKey, [
    { code: 'DPT-001', name: 'Ambulatory Care Clinic', type: 'Clinic', active: true },
    { code: 'DPT-002', name: 'Emergency Department', type: 'Ward', active: true },
    { code: 'DPT-003', name: 'Internal Medicine Ward', type: 'Ward', active: true },
    { code: 'DPT-004', name: 'Outpatient Pharmacy', type: 'OP Pharmacy', active: true },
    { code: 'DPT-005', name: 'Clinical Laboratory', type: 'Laboratory', active: true },
    { code: 'DPT-006', name: 'Diagnostic Imaging', type: 'Imaging Location', active: true },
  ]);
  let practitioners = readArray(practitionersKey);
  let clinics = [];
  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let returnFocus = null;
  let pairRows = [];
  let toastTimer;
  let records;
  const seed = [
    { id: 'consult-rule-001', virtual: 'No', ageIs18OrAbove: 'Yes', specialty: 'Emergency Medicine Specialty', visitReason: 'NEW', practitionerId: '', practitionerName: '', insurance: 'Covered', item: items[0], scfhsCategory: 'Consultant', pairs: [{ departmentCode: 'DPT-002', clinicCode: 'DPT-001' }], lastUpdateDate: '2026-09-18', updatedBy: 'System Administrator' },
    { id: 'consult-rule-002', virtual: 'No', ageIs18OrAbove: 'No', specialty: 'Community Health', visitReason: 'FOLLOW-UP', practitionerId: '', practitionerName: '', insurance: 'Covered', item: items[4], scfhsCategory: 'Specialist', pairs: [{ departmentCode: 'DPT-003', clinicCode: 'DPT-001' }], lastUpdateDate: '2026-09-22', updatedBy: 'System Administrator' },
    { id: 'consult-rule-003', virtual: 'Yes', ageIs18OrAbove: '', specialty: 'Radiology Specialty', visitReason: 'NEW', practitionerId: '', practitionerName: '', insurance: 'Not Covered', item: items[2], scfhsCategory: 'Senior Specialist', pairs: [{ departmentCode: 'DPT-006', clinicCode: 'DPT-001' }], lastUpdateDate: '2026-09-26', updatedBy: 'System Administrator' },
  ];
  try {
    const saved = localStorage.getItem(storageKey);
    records = saved === null ? JSON.parse(JSON.stringify(seed)) : JSON.parse(saved);
    if (!Array.isArray(records)) records = JSON.parse(JSON.stringify(seed));
    if (saved === null) localStorage.setItem(storageKey, JSON.stringify(records));
  } catch { records = JSON.parse(JSON.stringify(seed)); }

  const options = (values, placeholder, selected = '') => `<option value="">${esc(placeholder)}</option>${values.map((value) => `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(value)}</option>`).join('')}`;
  function departmentName(code) { const department = departments.find((item) => String(item.code) === String(code)); return department?.name || department?.englishName || `Department ${code}`; }
  function departmentCode(code) { return departments.find((item) => String(item.code) === String(code))?.code || code || ''; }
  function practitionerName(id) { return practitioners.find((item) => String(item.documentId) === String(id))?.englishName || ''; }
  function linkedDepartments(rule) { return (rule.pairs || []).map((pair) => departmentName(pair.departmentCode)); }
  function linkedClinics(rule) { return (rule.pairs || []).map((pair) => departmentName(pair.clinicCode)); }
  function joinValues(values) { return values.length ? values.map((value) => `<span class="consultation-value-chip">${esc(value)}</span>`).join('') : '—'; }
  function pairCell(rule, key) { return (rule.pairs || []).map((pair) => `<span class="consultation-pair-value">${esc(key === 'departmentCode' ? departmentCode(pair.departmentCode) : departmentCode(pair.clinicCode))}</span>`).join('') || '—'; }
  function pairNameCell(rule, key) { return (rule.pairs || []).map((pair) => `<span class="consultation-pair-value">${esc(departmentName(pair[key]))}</span>`).join('') || '—'; }
  function toast(message) { const el = document.querySelector('[data-facility-toast]'); if (!el) return; el.textContent = message; el.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2500); }
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep the page usable in memory if storage is unavailable. */ } }
  function fillLookups() {
    clinics = departments.filter((department) => department.type === 'Clinic' || department.type === 'Clinic Department');
    const deptFilter = grid.querySelector('[data-consult-filter="department"]');
    const previous = deptFilter.value;
    deptFilter.innerHTML = `<option value="">All departments</option>${departments.map((department) => `<option value="${esc(department.code)}">${esc(department.name || department.englishName || department.code)}</option>`).join('')}`;
    if (departments.some((department) => String(department.code) === previous)) deptFilter.value = previous;
    const departmentSelect = form.elements.departmentChoice;
    const clinicSelect = form.elements.clinicChoice;
    const departmentPrevious = departmentSelect.value;
    const clinicPrevious = clinicSelect.value;
    departmentSelect.innerHTML = options(departments.map((department) => `${department.code} — ${department.name || department.englishName}`), 'Select department');
    clinicSelect.innerHTML = options(clinics.map((clinic) => `${clinic.code} — ${clinic.name || clinic.englishName}`), 'Select clinic');
    if (departments.some((department) => `${department.code} — ${department.name || department.englishName}` === departmentPrevious)) departmentSelect.value = departmentPrevious;
    if (clinics.some((clinic) => `${clinic.code} — ${clinic.name || clinic.englishName}` === clinicPrevious)) clinicSelect.value = clinicPrevious;
    practitionerList.innerHTML = practitioners.filter((practitioner) => practitioner.active !== false).map((practitioner) => `<option value="${esc(practitioner.englishName)}" data-id="${esc(practitioner.documentId)}"></option>`).join('');
  }

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-consult-add>${icon.add}Add Consultation Rule</button></div>
    <div class="branches-filter-grid consultation-filter-grid" aria-label="Filter consultation rules">
      <label class="facility-filter"><span>Departments</span><select data-consult-filter="department"><option value="">All departments</option></select></label>
      <label class="facility-filter"><span>Is Virtual</span><select data-consult-filter="virtual">${options(yesNo, 'All')}</select></label>
      <label class="facility-filter"><span>Item</span><input type="search" data-consult-filter="item" placeholder="Search item or code"></label>
      <label class="facility-filter"><span>Insurance</span><select data-consult-filter="insurance">${options(coverageOptions, 'All')}</select></label>
      <label class="facility-filter"><span>Visit Reason</span><select data-consult-filter="visitReason">${options(visitReasons, 'All')}</select></label>
      <label class="facility-filter"><span>Age Is 18 Or Above</span><select data-consult-filter="ageIs18OrAbove">${options(yesNo, 'All')}</select></label>
    </div></div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table consultation-table"><thead><tr><th>Clinic Code</th><th>Clinic Name</th><th>Department Code</th><th>Department Name</th><th>Virtual</th><th>Item</th><th>Item Code</th><th>Age Is 18 Or Above</th><th>Insurance</th><th>Visit Reason</th><th>Last Update Date</th><th>Updated By</th><th>Actions</th></tr></thead><tbody data-consult-rows></tbody></table></div>
      <div class="facility-empty" data-consult-empty hidden>No consultation rules match your filters.</div><footer class="facility-pagination"><span data-consult-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-consult-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-consult-page="previous" aria-label="Previous page">‹</button><span data-consult-page-label></span><button class="icon-button" type="button" data-consult-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-consult-page="last" aria-label="Last page">»</button></div></footer>
    </div>`;

  const modal = document.createElement('div');
  modal.id = 'consultation-rule-modal'; modal.className = 'patient-modal-backdrop consultation-modal-backdrop'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal consultation-modal" role="dialog" aria-modal="true" aria-labelledby="consult-modal-title" aria-describedby="consult-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">BILLING RULE</p><h2 id="consult-modal-title">Add Consultation Rule</h2><p id="consult-modal-description">Configure consultation and department coverage.</p></div><button class="icon-button" type="button" data-consult-close aria-label="Close dialog">×</button></header>
    <form data-consult-form><div class="patient-modal-body consultation-modal-body">
      <fieldset class="patient-form-section consultation-section"><legend class="sr-only">Consultation Rule</legend><div class="facility-form-section-heading">Consultation Rule</div><div class="patient-form-grid consultation-form-grid">
        <label class="form-field"><span>Is Virtual <b>*</b></span><select name="virtual" required>${options(yesNo, 'Select Is Virtual')}</select></label>
        <label class="form-field"><span>Age Is 18 Or Above</span><select name="ageIs18OrAbove">${options(yesNo, 'Select Option')}</select></label>
        <label class="form-field"><span>Practitioner Specialty</span><select name="specialty">${options(specialties, 'Select Practitioner Specialty')}</select></label>
        <label class="form-field"><span>Visit Reason <b>*</b></span><select name="visitReason" required>${options(visitReasons, 'Select Visit Reason', 'NEW')}</select></label>
        <label class="form-field"><span>Practitioners</span><input name="practitionerName" list="consult-practitioner-options" placeholder="Search practitioners" autocomplete="off"><datalist id="consult-practitioner-options"></datalist></label>
        <label class="form-field"><span>Insurance</span><select name="insurance">${options(coverageOptions, 'Select Insurance')}</select></label>
        <label class="form-field"><span>Item <b>*</b></span><input name="item" list="consult-item-options" placeholder="Search or select item" required autocomplete="off"><datalist id="consult-item-options">${items.map((item) => `<option value="${esc(item)}"></option>`).join('')}</datalist></label>
        <label class="form-field"><span>SCFHS Practitioner Category</span><select name="scfhsCategory">${options(scfhsCategories, 'Select category')}</select></label>
      </div></fieldset>
      <fieldset class="patient-form-section consultation-section"><legend class="sr-only">Associated Departments and Clinics</legend><div class="facility-form-section-heading">Associated Departments &amp; Clinics</div>
        <div class="consultation-pair-editor"><label class="form-field"><span>Department <b>*</b></span><select name="departmentChoice" aria-label="Department for association"><option value="">Select department</option></select></label><label class="form-field"><span>Clinic <b>*</b></span><select name="clinicChoice" aria-label="Clinic for association"><option value="">Select clinic</option></select></label><button class="button button-secondary" type="button" data-consult-pair-add>${icon.add}Add</button></div>
        <div class="facility-table-scroll consultation-pairs-scroll"><table class="facility-table consultation-pairs-table"><thead><tr><th>Department Name</th><th>Department Code</th><th>Clinic Name</th><th>Clinic Code</th><th>Actions</th></tr></thead><tbody data-consult-pairs></tbody></table></div><div class="facility-empty consultation-pairs-empty" data-consult-pairs-empty>No department and clinic pairs added.</div>
      </fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-consult-cancel>Cancel</button><button type="submit" class="button button-primary" data-consult-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-consult-form]');
  const rowContainer = grid.querySelector('[data-consult-rows]');
  const practitionerList = modal.querySelector('#consult-practitioner-options');
  const pairsContainer = modal.querySelector('[data-consult-pairs]');

  function renderPairs(readOnly = false) {
    pairsContainer.innerHTML = pairRows.map((pair, index) => `<tr><td>${esc(departmentName(pair.departmentCode))}</td><td>${esc(departmentCode(pair.departmentCode))}</td><td>${esc(departmentName(pair.clinicCode))}</td><td>${esc(departmentCode(pair.clinicCode))}</td><td>${readOnly ? '—' : `<button class="button button-ghost consultation-pair-remove" type="button" data-consult-pair-remove="${index}">Remove</button>`}</td></tr>`).join('');
    modal.querySelector('[data-consult-pairs-empty]').hidden = pairRows.length > 0;
    modal.querySelector('[data-consult-pair-add]').hidden = readOnly;
  }
  function closeMenus() { grid.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; }); grid.querySelectorAll('[data-consult-row-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false')); }
  function matches(rule) {
    return Object.entries(filters).every(([key, query]) => {
      if (!query) return true;
      if (key === 'department') return (rule.pairs || []).some((pair) => String(pair.departmentCode).toLocaleLowerCase() === query);
      if (key === 'item') return `${rule.item || ''} ${itemCode(rule.item || '')} ${itemName(rule.item || '')}`.toLocaleLowerCase().includes(query);
      return String(rule[key] || '').toLocaleLowerCase() === query;
    });
  }
  function renderGrid() {
    const filtered = records.filter(matches); const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); page = Math.min(page, pages);
    rowContainer.innerHTML = filtered.slice((page - 1) * pageSize, page * pageSize).map((rule) => `<tr>
      <td>${pairCell(rule, 'clinicCode')}</td><td>${pairNameCell(rule, 'clinicCode')}</td><td>${pairCell(rule, 'departmentCode')}</td><td>${pairNameCell(rule, 'departmentCode')}</td>
      <td>${esc(rule.virtual || '—')}</td><td><span class="facility-name-en">${esc(itemName(rule.item))}</span></td><td>${esc(itemCode(rule.item))}</td><td>${esc(rule.ageIs18OrAbove || '—')}</td><td>${esc(rule.insurance || '—')}</td><td>${esc(rule.visitReason)}</td><td>${esc(dateLabel(rule.lastUpdateDate))}</td><td>${esc(rule.updatedBy || '—')}</td>
      <td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-consult-row-menu aria-label="Actions for ${esc(itemName(rule.item))}" aria-haspopup="menu" aria-expanded="false" data-consult-id="${esc(rule.id)}">${icon.more}</button><div class="facility-row-menu consultation-row-menu" role="menu" hidden><button type="button" role="menuitem" data-consult-action="view" data-consult-id="${esc(rule.id)}">${icon.eye}View</button><button type="button" role="menuitem" data-consult-action="edit" data-consult-id="${esc(rule.id)}">${icon.edit}Edit</button><button type="button" role="menuitem" data-consult-action="delete" data-consult-id="${esc(rule.id)}">${icon.trash}Delete</button></div></div></td>
    </tr>`).join('');
    grid.querySelector('[data-consult-empty]').hidden = filtered.length > 0;
    grid.querySelector('[data-consult-count]').textContent = `Total Results: ${filtered.length}`;
    grid.querySelector('[data-consult-page-label]').textContent = `Page ${filtered.length ? page : 0} of ${filtered.length ? pages : 0}`;
    grid.querySelectorAll('[data-consult-page]').forEach((button) => { button.disabled = !filtered.length || (['first', 'previous'].includes(button.dataset.consultPage) ? page === 1 : page === pages); });
  }
  function readPractitionerValue() {
    const name = form.elements.practitionerName.value.trim();
    return practitioners.find((item) => String(item.englishName || '').toLocaleLowerCase() === name.toLocaleLowerCase()) || practitioners.find((item) => item.documentId === name) || null;
  }
  function setReadOnly(readOnly) {
    form.querySelectorAll('input:not([type="hidden"]),select').forEach((field) => { field.disabled = readOnly; });
    modal.querySelector('[data-consult-pair-add]').hidden = readOnly;
    modal.querySelectorAll('[data-consult-pair-remove]').forEach((button) => { button.hidden = readOnly; });
    modal.querySelector('[data-consult-save]').hidden = readOnly;
    modal.querySelector('[data-consult-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
  }
  function openModal(nextMode, rule = null, trigger = document.activeElement) {
    mode = nextMode; activeId = rule?.id || null; returnFocus = trigger; form.reset(); pairRows = JSON.parse(JSON.stringify(rule?.pairs || []));
    modal.querySelector('#consult-modal-title').textContent = nextMode === 'new' ? 'Add Consultation Rule' : nextMode === 'view' ? 'Consultation Rule Details' : 'Edit Consultation Rule';
    modal.querySelector('#consult-modal-description').textContent = nextMode === 'new' ? 'Configure consultation and department coverage.' : nextMode === 'view' ? 'Review the consultation rule and its department assignments.' : 'Update the consultation rule.';
    modal.querySelector('[data-consult-save]').textContent = nextMode === 'new' ? 'Create' : 'Save changes';
    form.elements.visitReason.value = rule?.visitReason || 'NEW';
    form.elements.virtual.value = rule?.virtual || '';
    form.elements.ageIs18OrAbove.value = rule?.ageIs18OrAbove || '';
    form.elements.specialty.value = rule?.specialty || '';
    form.elements.practitionerName.value = rule?.practitionerName || '';
    form.elements.insurance.value = rule?.insurance || '';
    form.elements.namedItem('item').value = rule?.item || '';
    form.elements.scfhsCategory.value = rule?.scfhsCategory || '';
    fillLookups(); renderPairs(nextMode === 'view'); setReadOnly(nextMode === 'view');
    modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-consult-close]').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); if (returnFocus?.isConnected) returnFocus.focus(); }
  function addPair() {
    const department = form.elements.departmentChoice.value;
    const clinic = form.elements.clinicChoice.value;
    if (!department || !clinic) {
      if (!department) { form.elements.departmentChoice.setCustomValidity('Select a department.'); form.elements.departmentChoice.reportValidity(); form.elements.departmentChoice.setCustomValidity(''); }
      else { form.elements.clinicChoice.setCustomValidity('Select a clinic.'); form.elements.clinicChoice.reportValidity(); form.elements.clinicChoice.setCustomValidity(''); }
      return;
    }
    const departmentCodeValue = department.split(' — ')[0];
    const clinicCodeValue = clinic.split(' — ')[0];
    if (pairRows.some((pair) => pair.departmentCode === departmentCodeValue && pair.clinicCode === clinicCodeValue)) { toast('This Department–Clinic pair is already added.'); return; }
    pairRows.push({ departmentCode: departmentCodeValue, clinicCode: clinicCodeValue });
    form.elements.departmentChoice.value = ''; form.elements.clinicChoice.value = ''; renderPairs(mode === 'view');
  }
  function formRecord() {
    const practitioner = readPractitionerValue();
    return { virtual: form.elements.virtual.value, ageIs18OrAbove: form.elements.ageIs18OrAbove.value, specialty: form.elements.specialty.value, visitReason: form.elements.visitReason.value, practitionerId: practitioner?.documentId || '', practitionerName: practitioner?.englishName || form.elements.practitionerName.value.trim(), insurance: form.elements.insurance.value, item: form.elements.namedItem('item').value.trim(), scfhsCategory: form.elements.scfhsCategory.value, pairs: JSON.parse(JSON.stringify(pairRows)), lastUpdateDate: dateToday(), updatedBy: 'Admin' };
  }
  function save(event) {
    event.preventDefault();
    if (!pairRows.length) { form.elements.departmentChoice.setCustomValidity('Add at least one Department and Clinic pair.'); form.elements.departmentChoice.reportValidity(); form.elements.departmentChoice.setCustomValidity(''); return; }
    if (!form.reportValidity()) return;
    const itemControl = form.elements.namedItem('item');
    if (!items.includes(itemControl.value.trim())) { itemControl.setCustomValidity('Choose an item from the available lookup.'); itemControl.reportValidity(); itemControl.setCustomValidity(''); return; }
    if (form.elements.practitionerName.value.trim() && !readPractitionerValue()) { form.elements.practitionerName.setCustomValidity('Choose a saved practitioner from the lookup.'); form.elements.practitionerName.reportValidity(); form.elements.practitionerName.setCustomValidity(''); return; }
    const values = formRecord();
    if (mode === 'new') {
      records.push({ ...values, id: `consult-rule-${crypto.randomUUID()}` }); persist(); closeModal(); renderGrid(); toast('Consultation rule was created successfully.'); return;
    }
    const record = records.find((item) => item.id === activeId); if (!record) return;
    Object.assign(record, values); persist(); closeModal(); renderGrid(); toast('Consultation rule was updated successfully.');
  }
  function confirmDelete(rule) {
    const dialog = document.createElement('div'); dialog.className = 'patient-modal-backdrop consultation-confirm-backdrop';
    dialog.innerHTML = `<section class="patient-modal consultation-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="consult-delete-title"><header class="patient-modal-header"><div><p class="eyebrow">DELETE RULE</p><h2 id="consult-delete-title">Delete Consultation Rule?</h2><p>This removes the rule for ${esc(itemName(rule.item))} and its Department–Clinic assignments.</p></div><button class="icon-button" type="button" data-consult-delete-close aria-label="Close dialog">×</button></header><footer class="patient-modal-footer"><span></span><div><button class="button button-secondary" type="button" data-consult-delete-cancel>Cancel</button><button class="button button-destructive" type="button" data-consult-delete-confirm>Delete</button></div></footer></section>`;
    document.body.append(dialog); document.body.classList.add('patient-modal-open');
    const close = () => { dialog.remove(); if (modal.hidden) document.body.classList.remove('patient-modal-open'); };
    dialog.querySelector('[data-consult-delete-cancel]').addEventListener('click', close); dialog.querySelector('[data-consult-delete-close]').addEventListener('click', close); dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    dialog.querySelector('[data-consult-delete-confirm]').addEventListener('click', () => { records = records.filter((record) => record.id !== rule.id); persist(); close(); renderGrid(); toast('Consultation rule was deleted successfully.'); });
    dialog.querySelector('[data-consult-delete-cancel]').focus();
  }

  grid.querySelector('[data-consult-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.querySelectorAll('[data-consult-filter]').forEach((field) => field.addEventListener(field.matches('select') ? 'change' : 'input', () => { filters[field.dataset.consultFilter] = field.value.trim().toLocaleLowerCase(); page = 1; closeMenus(); renderGrid(); }));
  grid.querySelectorAll('[data-consult-page]').forEach((button) => button.addEventListener('click', () => { const pages = Math.max(1, Math.ceil(records.filter(matches).length / pageSize)); if (button.dataset.consultPage === 'first') page = 1; if (button.dataset.consultPage === 'previous') page = Math.max(1, page - 1); if (button.dataset.consultPage === 'next') page = Math.min(pages, page + 1); if (button.dataset.consultPage === 'last') page = pages; renderGrid(); }));
  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-consult-row-menu]');
    if (trigger) { const menu = trigger.nextElementSibling; const opened = !menu.hidden; closeMenus(); menu.hidden = opened; trigger.setAttribute('aria-expanded', String(!opened)); return; }
    const action = event.target.closest('[data-consult-action]'); if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const rule = records.find((record) => record.id === action.dataset.consultId); if (!rule) return;
    const actionTrigger = action.closest('.facility-row-action').querySelector('[data-consult-row-menu]'); closeMenus();
    if (action.dataset.consultAction === 'delete') confirmDelete(rule); else openModal(action.dataset.consultAction, rule, actionTrigger);
  });
  modal.querySelector('[data-consult-pair-add]').addEventListener('click', addPair);
  modal.addEventListener('click', (event) => { const remove = event.target.closest('[data-consult-pair-remove]'); if (!remove) return; pairRows.splice(Number(remove.dataset.consultPairRemove), 1); renderPairs(mode === 'view'); });
  form.addEventListener('submit', save);
  modal.querySelector('[data-consult-close]').addEventListener('click', closeModal); modal.querySelector('[data-consult-cancel]').addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  window.addEventListener('storage', (event) => {
    if (event.key === departmentsKey && event.newValue) { try { const updated = JSON.parse(event.newValue); if (Array.isArray(updated)) { departments = updated; fillLookups(); renderGrid(); } } catch { /* Ignore invalid storage updates. */ } }
    if (event.key === practitionersKey && event.newValue) { try { const updated = JSON.parse(event.newValue); if (Array.isArray(updated)) { practitioners = updated; fillLookups(); } } catch { /* Ignore invalid storage updates. */ } }
    if (event.key === storageKey && event.newValue) { try { const updated = JSON.parse(event.newValue); if (Array.isArray(updated)) { records = updated; renderGrid(); } } catch { /* Ignore invalid storage updates. */ } }
  });
  window.addEventListener('rcm:departments-changed', (event) => { if (String(event.detail?.facilityId) !== facilityId || !Array.isArray(event.detail.departments)) return; departments = event.detail.departments; fillLookups(); renderGrid(); });
  fillLookups(); renderGrid();
})();
