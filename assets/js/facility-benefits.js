(() => {
  const grid = document.querySelector('[data-benefits-grid]');
  if (!grid) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const storageKey = `rcm-facility-benefits:v1:${facilityId}`;
  const lookups = {
    categories: ['Inpatient Services', 'Outpatient Services', 'Pharmacy Benefits', 'Emergency & Critical', 'Dental & Optical'],
    selectionBehaviors: ['Exclusive Group Tier', 'Cumulative Stackable', 'First Applicable Matches', 'Mandatory Minimum'],
    scopes: ['Both', 'Inpatient Only', 'Outpatient Only'],
    inclusionTypes: ['Inclusion', 'Inclusion Plus', 'Exclusion'],
    serviceCategories: ['Room & Board', 'Surgical Procedures', 'Laboratory Tests', 'Radiology', 'Pharmacy Medicines'],
    serviceGroups: ['Maternity Ward Stay', 'Labor Delivery Suite', 'Neonatal Intensive Unit', 'Standard Inpatient Routine'],
    serviceItems: ['Normal Vaginal Delivery Care', 'Cesarean Section Procedure', 'Newborn Nursery Package', 'Fetal Heart Rate Monitoring'],
    serviceChapters: ['Chapter 01 - Routine Clinical', 'Chapter 03 - Obstetric Procedures', 'Chapter 07 - Operative Surgery'],
    serviceBlocks: ['BLK-100 Inpatient Care', 'BLK-200 Critical Surgical', 'BLK-400 Day Admission'],
    costCenters: ['CC-Inpatient-Ward', 'CC-Maternity-Suite', 'CC-Surgery-Theater'],
    subCostCenters: ['SUB-Floor-3-Maternity', 'SUB-Delivery-Room-A', 'SUB-Nursery-Postnatal'],
    diagnosisChapters: ['Chapter XV - Pregnancy, childbirth', 'Chapter XXI - Factors influencing health status', 'Chapter IV - Endocrine and nutritional'],
    diagnosisBlocks: ['O80-O84 Delivery', 'O00-O08 Pregnancy with abortive outcome', 'Z32-Z39 Persons encountering health services in reproduction'],
    icd10Codes: ['O80 - Single spontaneous delivery', 'O82 - Single delivery by cesarean section', 'Z38.0 - Single liveborn infant', 'O60.0 - Preterm labor without delivery'],
    encounterTypes: ['InPatient', 'OutPatient', 'Daycare', 'Emergency'],
    departments: ['Obstetrics & Gynaecology [KAH] (OGH)', 'Department 1', 'Department 2'],
    specialties: ['Obstetrics Anesthesia', 'Maternal-Fetal Medicine', 'General Gynecologist'],
    payerTypes: ['Insurance', 'Direct', 'Sponsor', 'Payroll', 'Corporate'],
    payers: ['Bupa Arabia / MedNet', 'Tawuniya Cooperative', 'AXA Insurance', 'MedGulf'],
    policies: ['DB-512', 'DB-507', 'POL-Maternity-Comprehensive'],
    plans: ['60441-DB-512-DB-512-DB-512', '60436-DB-507-DB-507-DB-507', 'Maternity Standard Plan'],
    networks: ['Primary Network Tier 1', 'VIP Executive Network', 'Standard Network C'],
    classes: ['Class A (Private Room)', 'Class B (Double Room)', 'VIP Suite Deluxe'],
    genders: ['Female', 'Male', 'All'],
    ageUnits: ['Month', 'Years'],
  };
  const seed = [
    {
      id: 'BEN-2026-001', name: 'Benefit 1', description: 'Benefit description 1', category: 'Emergency & Critical', code: 'BEN-2026-001', selectionBehavior: 'First Applicable Matches', scope: 'Outpatient Only', weight: '0', ruleTitle: 'Benefit rule 1', inclusionType: 'Inclusion', serviceCategory: 'Radiology', serviceGroup: '', serviceItem: '', serviceChapter: '', serviceBlock: '', costCenter: '', subCostCenter: '', diagnosisChapter: 'Chapter XXI - Factors influencing health status', diagnosisBlock: '', icd10: 'Z38.0 - Single liveborn infant', encounterType: 'Emergency', departmentName: 'Department 1', practitionerSpecialty: 'Maternal-Fetal Medicine', payerType: 'Insurance', payer: 'Tawuniya Cooperative', policy: 'DB-507', plan: 'Maternity Standard Plan', network: 'Standard Network C', class: 'Class B (Double Room)', gender: 'All', ageUnit: 'Years', ageFrom: '', ageTo: '', active: true,
    },
    {
      id: 'BEN-2026-002', name: 'Benefit 2', description: 'Benefit description 2', category: 'Pharmacy Benefits', code: 'BEN-2026-002', selectionBehavior: 'Cumulative Stackable', scope: 'Outpatient Only', weight: '0', ruleTitle: 'Benefit rule 2', inclusionType: 'Inclusion', serviceCategory: 'Pharmacy Medicines', serviceGroup: '', serviceItem: '', serviceChapter: '', serviceBlock: '', costCenter: '', subCostCenter: '', diagnosisChapter: '', diagnosisBlock: '', icd10: 'O60.0 - Preterm labor without delivery', encounterType: 'OutPatient', departmentName: '', practitionerSpecialty: '', payerType: 'Insurance', payer: 'MedGulf', policy: 'DB-512', plan: 'Maternity Standard Plan', network: 'Primary Network Tier 1', class: 'Class B (Double Room)', gender: 'All', ageUnit: 'Years', ageFrom: '', ageTo: '', active: true,
    },
    {
      id: 'BEN-2026-003', name: 'Benefit 3', description: 'Benefit description 3', category: 'Inpatient Services', code: 'BEN-2026-003', selectionBehavior: 'Exclusive Group Tier', scope: 'Both', weight: '0', ruleTitle: 'Benefit rule 3', inclusionType: 'Inclusion Plus', serviceCategory: 'Room & Board', serviceGroup: 'Standard Inpatient Routine', serviceItem: '', serviceChapter: 'Chapter 01 - Routine Clinical', serviceBlock: 'BLK-100 Inpatient Care', costCenter: 'CC-Inpatient-Ward', subCostCenter: '', diagnosisChapter: '', diagnosisBlock: '', icd10: 'O82 - Single delivery by cesarean section', encounterType: 'InPatient', departmentName: 'Department 2', practitionerSpecialty: 'General Gynecologist', payerType: 'Insurance', payer: 'AXA Insurance', policy: 'POL-Maternity-Comprehensive', plan: 'Maternity Standard Plan', network: 'Primary Network Tier 1', class: 'Class A (Private Room)', gender: 'All', ageUnit: 'Years', ageFrom: '', ageTo: '', active: false,
    },
  ];
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const optionMarkup = (values, prompt, selected = '') => `<option value="">${escapeHtml(prompt)}</option>${values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}`;
  const select = (name, label, values, required = false, defaultValue = '') => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><select name="${name}"${required ? ' required' : ''}>${optionMarkup(values, 'Select', defaultValue)}</select></label>`;
  const input = (name, label, type = 'text', required = false, extra = '') => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><input name="${name}" type="${type}"${required ? ' required' : ''} ${extra}></label>`;
  const lookupDefinitions = [
    ['category', 'Category', 'categories', true], ['selectionBehavior', 'Benefit Selection Behavior', 'selectionBehaviors', true], ['scope', 'Scope', 'scopes', true],
    ['inclusionType', 'Inclusion Type', 'inclusionTypes', false], ['serviceCategory', 'Service Catalog Category', 'serviceCategories', false], ['serviceGroup', 'Groups / Sub Groups', 'serviceGroups', false],
    ['serviceItem', 'Items', 'serviceItems', false], ['serviceChapter', 'Chapter', 'serviceChapters', false], ['serviceBlock', 'Block', 'serviceBlocks', false],
    ['costCenter', 'Cost Center', 'costCenters', false], ['subCostCenter', 'Sub Cost Center', 'subCostCenters', false], ['diagnosisChapter', 'Chapter', 'diagnosisChapters', false],
    ['diagnosisBlock', 'Block', 'diagnosisBlocks', false], ['icd10', 'ICD-10 Code/Description', 'icd10Codes', true], ['encounterType', 'Encounter Type', 'encounterTypes', false],
    ['departmentName', 'Department Name', 'departments', false], ['practitionerSpecialty', 'Practitioner Specialty', 'specialties', false], ['payerType', 'Payer Type', 'payerTypes', false],
    ['payer', 'Payers', 'payers', false], ['policy', 'Policies', 'policies', false], ['plan', 'Plans', 'plans', false], ['network', 'Network', 'networks', false], ['class', 'Class', 'classes', false], ['gender', 'Gender', 'genders', false],
  ];
  const lookupField = (definition) => {
    const [name, label, optionsKey, required] = definition;
    const listId = `benefit-options-${name}`;
    const defaultValue = ({ inclusionType: 'Inclusion', payerType: 'Insurance' })[name] || '';
    const listOptions = lookups[optionsKey].map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
    return `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><input name="${name}" list="${listId}" data-benefit-lookup${required ? ' required' : ''} value="${escapeHtml(defaultValue)}" placeholder="Search or select" autocomplete="off"><datalist id="${listId}">${listOptions}</datalist></label>`;
  };

  grid.innerHTML = `<div class="branches-toolbar">
    <div class="branches-add-row"><button class="button button-primary" type="button" data-benefit-add>${icons.add}Add Benefit</button></div>
    <div class="branches-filter-grid benefit-filter-grid" role="search" aria-label="Filter benefits">
      <label class="facility-filter"><span>Name</span><input type="search" data-benefit-filter="name" placeholder="Search benefit name"></label>
      <label class="facility-filter"><span>Code</span><input type="search" data-benefit-filter="code" placeholder="Search code"></label>
      <label class="facility-filter"><span>Category</span><select data-benefit-filter="category">${optionMarkup(lookups.categories, 'All categories')}</select></label>
      <label class="facility-filter"><span>Scope</span><select data-benefit-filter="scope">${optionMarkup(lookups.scopes, 'All scopes')}</select></label>
      <label class="facility-filter"><span>Payer</span><select data-benefit-filter="payer">${optionMarkup(lookups.payers, 'All payers')}</select></label>
      <label class="facility-filter"><span>Status</span><select data-benefit-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div>
  </div>
  <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table benefit-table"><thead><tr><th scope="col">Name</th><th scope="col">Code</th><th scope="col">Category</th><th scope="col">Scope</th><th scope="col">Payer</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody data-benefit-rows></tbody></table></div><div class="facility-empty" data-benefit-empty hidden>No benefits match your filters.</div><footer class="facility-pagination"><span data-benefit-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-benefit-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-benefit-page="previous" aria-label="Previous page">‹</button><span data-benefit-page-label></span><button class="icon-button" type="button" data-benefit-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-benefit-page="last" aria-label="Last page">»</button></div></footer></div>`;

  const modal = document.querySelector('#benefit-modal');
  modal.innerHTML = `<section class="patient-modal benefit-modal" role="dialog" aria-modal="true" aria-labelledby="benefit-modal-title" aria-describedby="benefit-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">BENEFIT RULE</p><h2 id="benefit-modal-title">Add Benefit</h2><p id="benefit-modal-description">Define benefit coverage and rule criteria.</p></div><button type="button" class="icon-button" data-benefit-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><form data-benefit-form><div class="patient-modal-body benefit-modal-body">
    <fieldset class="patient-form-section benefit-section"><legend class="sr-only">Basic Information</legend><div class="facility-form-section-heading">Basic Information</div><div class="patient-form-grid benefit-form-grid">
      ${input('name', 'Name', 'text', true)}${input('description', 'Description', 'text', true)}${lookupField(lookupDefinitions[0])}<label class="form-field"><span>Code <b>*</b></span><input name="code" readonly required aria-describedby="benefit-code-help"><small id="benefit-code-help">Generated automatically.</small></label>${lookupField(lookupDefinitions[1])}${lookupField(lookupDefinitions[2])}
    </div></fieldset>
    <fieldset class="patient-form-section benefit-section"><legend class="sr-only">Benefit Specifications</legend><div class="facility-form-section-heading">Benefit Specifications</div><div class="patient-form-grid benefit-form-grid">
      ${input('weight', 'Weight', 'number', false, 'step="any" value="0"')}<div class="benefit-subsection-title">Rule Info</div>${input('ruleTitle', 'Rule Title', 'text', true)}${lookupField(lookupDefinitions[3])}<div class="benefit-subsection-title">Service Catalogs</div>${lookupField(lookupDefinitions[4])}${lookupField(lookupDefinitions[5])}${lookupField(lookupDefinitions[6])}${lookupField(lookupDefinitions[7])}${lookupField(lookupDefinitions[8])}${lookupField(lookupDefinitions[9])}${lookupField(lookupDefinitions[10])}
    </div></fieldset>
    <fieldset class="patient-form-section benefit-section"><legend class="sr-only">Diagnosis</legend><div class="facility-form-section-heading">Diagnosis</div><div class="patient-form-grid benefit-form-grid">${lookupField(lookupDefinitions[11])}${lookupField(lookupDefinitions[12])}${lookupField(lookupDefinitions[13])}</div></fieldset>
    <fieldset class="patient-form-section benefit-section"><legend class="sr-only">Medical Settings</legend><div class="facility-form-section-heading">Medical Settings</div><div class="patient-form-grid benefit-form-grid">${lookupField(lookupDefinitions[14])}${lookupField(lookupDefinitions[15])}${lookupField(lookupDefinitions[16])}</div></fieldset>
    <fieldset class="patient-form-section benefit-section"><legend class="sr-only">Payer</legend><div class="facility-form-section-heading">Payer</div><div class="patient-form-grid benefit-form-grid">${lookupField(lookupDefinitions[17])}${lookupField(lookupDefinitions[18])}${lookupField(lookupDefinitions[19])}${lookupField(lookupDefinitions[20])}${lookupField(lookupDefinitions[21])}${lookupField(lookupDefinitions[22])}</div></fieldset>
    <fieldset class="patient-form-section benefit-section"><legend class="sr-only">Patients and Age Group</legend><div class="facility-form-section-heading">Patients and Age Group</div><div class="patient-form-grid benefit-form-grid">${lookupField(lookupDefinitions[23])}${select('ageUnit', 'Unit', lookups.ageUnits, false, 'Years')}${input('ageFrom', 'From', 'number', false, 'min="0" step="any"')}${input('ageTo', 'To', 'number', false, 'min="0" step="any"')}</div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-benefit-cancel>Cancel</button><button type="submit" class="button button-primary" data-benefit-save>Create</button></div></footer></form></section>`;

  const rows = grid.querySelector('[data-benefit-rows]');
  const form = modal.querySelector('[data-benefit-form]');
  const toast = document.querySelector('[data-facility-toast]');
  const recordFields = ['name', 'description', 'category', 'code', 'selectionBehavior', 'scope', 'weight', 'ruleTitle', 'inclusionType', 'serviceCategory', 'serviceGroup', 'serviceItem', 'serviceChapter', 'serviceBlock', 'costCenter', 'subCostCenter', 'diagnosisChapter', 'diagnosisBlock', 'icd10', 'encounterType', 'departmentName', 'practitionerSpecialty', 'payerType', 'payer', 'policy', 'plan', 'network', 'class', 'gender', 'ageUnit', 'ageFrom', 'ageTo'];
  const pageSize = 5;
  let records = load();
  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let returnFocus = null;
  let toastTimer;

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep the prototype usable if browser storage is unavailable. */ }
    return JSON.parse(JSON.stringify(seed));
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep changes available for this page session. */ }
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300);
  }
  function filtered() {
    return records.filter((record) => Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'status') return (record.active ? 'active' : 'inactive') === value;
      return String(record[key] || '').toLocaleLowerCase().includes(value.toLocaleLowerCase());
    }));
  }
  function closeMenus(except) {
    rows.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) {
        menu.hidden = true;
        menu.parentElement.querySelector('[data-benefit-row-menu]').setAttribute('aria-expanded', 'false');
      }
    });
  }
  function render() {
    const matches = filtered();
    const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, totalPages);
    const visible = matches.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((record) => `<tr>
      <td><span class="facility-name-en">${escapeHtml(record.name)}</span></td><td class="branch-code">${escapeHtml(record.code)}</td><td>${escapeHtml(record.category)}</td><td>${escapeHtml(record.scope)}</td><td>${escapeHtml(record.payer || '—')}</td><td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td>
      <td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-benefit-row-menu aria-label="Actions for ${escapeHtml(record.name)}" aria-haspopup="menu" aria-expanded="false" data-id="${escapeHtml(record.id)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-benefit-action="view" data-id="${escapeHtml(record.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-benefit-action="edit" data-id="${escapeHtml(record.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-benefit-action="toggle-status" data-id="${escapeHtml(record.id)}">${icons.status}${record.active ? 'Deactivate' : 'Activate'}</button></div></div></td>
    </tr>`).join('');
    grid.querySelector('[data-benefit-empty]').hidden = matches.length > 0;
    grid.querySelector('[data-benefit-count]').textContent = `Total Results: ${matches.length}`;
    grid.querySelector('[data-benefit-page-label]').textContent = `Page ${matches.length ? page : 0} of ${matches.length ? totalPages : 0}`;
    grid.querySelectorAll('[data-benefit-page]').forEach((button) => {
      button.disabled = matches.length === 0 || (['first', 'previous'].includes(button.dataset.benefitPage) ? page === 1 : page === totalPages);
    });
  }
  function nextCode() {
    const next = Math.max(0, ...records.map((record) => Number(String(record.code).match(/(\d+)$/)?.[1]) || 0)) + 1;
    return `BEN-2026-${String(next).padStart(3, '0')}`;
  }
  function setReadOnly(readOnly) {
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      if (field.name !== 'code') field.disabled = readOnly;
    });
    modal.querySelector('[data-benefit-save]').hidden = readOnly;
    modal.querySelector('[data-benefit-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }
  function openModal(nextMode, record = null, trigger = document.activeElement) {
    mode = nextMode;
    activeId = record?.id || null;
    returnFocus = trigger;
    form.reset();
    setReadOnly(false);
    const isNew = nextMode === 'new';
    modal.querySelector('#benefit-modal-title').textContent = isNew ? 'Add Benefit' : nextMode === 'view' ? 'Benefit Details' : 'Edit Benefit';
    modal.querySelector('#benefit-modal-description').textContent = isNew ? 'Define benefit coverage and rule criteria.' : nextMode === 'view' ? 'Review benefit and rule details.' : 'Update benefit coverage and rule criteria.';
    modal.querySelector('[data-benefit-save]').textContent = isNew ? 'Create' : 'Save changes';
    const values = isNew ? { code: nextCode(), weight: '0', inclusionType: 'Inclusion', payerType: 'Insurance', ageUnit: 'Years' } : record;
    recordFields.forEach((name) => {
      const field = form.elements.namedItem(name);
      if (field) field.value = values?.[name] ?? '';
    });
    form.elements.namedItem('code').value = values?.code || nextCode();
    form.querySelectorAll('[data-benefit-lookup]').forEach(validateLookup);
    if (nextMode === 'view') setReadOnly(true);
    modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    modal.querySelector('[data-benefit-close]').focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  function applyFilters() {
    filters = Object.fromEntries([...grid.querySelectorAll('[data-benefit-filter]')].map((field) => [field.dataset.benefitFilter, field.value.trim()]));
    page = 1;
    render();
  }
  function validateLookup(field) {
    const list = document.getElementById(field.getAttribute('list'));
    const allowedValues = [...(list?.options || [])].map((option) => option.value);
    field.setCustomValidity(field.value && !allowedValues.includes(field.value) ? 'Choose one of the listed options.' : '');
  }

  form.querySelectorAll('[data-benefit-lookup]').forEach((field) => {
    field.addEventListener('input', () => validateLookup(field));
    field.addEventListener('change', () => validateLookup(field));
  });

  grid.querySelectorAll('[data-benefit-filter]').forEach((field) => {
    field.addEventListener('input', applyFilters);
    field.addEventListener('change', applyFilters);
  });
  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-benefit-row-menu]');
    if (trigger) {
      const menu = trigger.nextElementSibling;
      const willOpen = menu.hidden;
      closeMenus(menu);
      menu.hidden = !willOpen;
      trigger.setAttribute('aria-expanded', String(willOpen));
      return;
    }
    const action = event.target.closest('[data-benefit-action]');
    if (action) {
      const record = records.find((item) => item.id === action.dataset.id);
      if (!record) return;
      closeMenus();
      if (action.dataset.benefitAction === 'toggle-status') {
        record.active = !record.active;
        persist(); render();
        showToast(`${record.name} was ${record.active ? 'activated' : 'deactivated'}.`);
      } else openModal(action.dataset.benefitAction, record, grid.querySelector(`[data-benefit-row-menu][data-id="${CSS.escape(record.id)}"]`));
      return;
    }
    if (!event.target.closest('.facility-row-action')) closeMenus();
  });
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-benefit-page]');
    if (!button) return;
    const totalPages = Math.max(1, Math.ceil(filtered().length / pageSize));
    if (button.dataset.benefitPage === 'first') page = 1;
    if (button.dataset.benefitPage === 'previous') page = Math.max(1, page - 1);
    if (button.dataset.benefitPage === 'next') page = Math.min(totalPages, page + 1);
    if (button.dataset.benefitPage === 'last') page = totalPages;
    render();
  });
  grid.querySelector('[data-benefit-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  modal.querySelector('[data-benefit-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-benefit-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(recordFields.map((name) => [name, String(form.elements.namedItem(name).value ?? '').trim()]));
    if (mode === 'new') {
      const record = { ...values, code: nextCode(), id: nextCode(), active: true };
      records.push(record);
      persist();
      grid.querySelectorAll('[data-benefit-filter]').forEach((field) => { field.value = ''; });
      filters = {};
      page = Math.ceil(records.length / pageSize);
      closeModal(); render();
      showToast(`${record.name} was created successfully.`);
    } else {
      const record = records.find((item) => item.id === activeId);
      if (!record) return;
      Object.assign(record, values);
      persist(); closeModal(); render();
      showToast(`${record.name} was updated successfully.`);
    }
  });
  render();
})();
