(() => {
  const root = document.querySelector('[data-discounts]');
  if (!root) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const storageKey = `rcm-facility-discounts:v1:${facilityId}`;
  const keys = {
    categories: `rcm-facility-categories:v1:${facilityId}`,
    groups: `rcm-facility-groups:v1:${facilityId}`,
    items: `rcm-facility-service-items:v1:${facilityId}`,
    costCenters: `rcm-facility-cost-centers:v1:${facilityId}`,
    departments: `rcm-facility-departments:v1:${facilityId}`,
    practitioners: `rcm-facility-practitioners:v1:${facilityId}`,
    payers: `rcm-facility-payers:v2:${facilityId}`,
    policies: `rcm-facility-policies:v1:${facilityId}`,
    plans: `rcm-facility-plans:v1:${facilityId}`,
    contracts: `rcm-facility-contracts:v1:${facilityId}`,
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const parseArray = (key) => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const unique = (values) => [...new Set(values.filter((value) => value != null && String(value).trim()).map(String))];
  const valuesFrom = (key, ...fields) => parseArray(key).map((item) => fields.map((field) => item?.[field]).find((value) => value != null && value !== '')).filter(Boolean);
  const savedCategories = valuesFrom(keys.categories, 'description', 'name', 'code');
  const savedGroups = valuesFrom(keys.groups, 'description', 'name', 'code');
  const serviceRecords = parseArray(keys.items);
  const costRecords = parseArray(keys.costCenters);
  const departmentRecords = parseArray(keys.departments);
  const practitionerRecords = parseArray(keys.practitioners);
  const payerRecords = parseArray(keys.payers);
  const policyRecords = parseArray(keys.policies);
  const planRecords = parseArray(keys.plans);
  const contractRecords = parseArray(keys.contracts);
  const serviceCategoryOptions = unique([...savedCategories, 'Laboratory', 'Radiology', 'Pharmacy', 'Consultation', 'Diagnostic Imaging', 'Clinical Procedures']);
  const groupOptions = unique([...savedGroups, 'Hematology', 'Biochemistry', 'X-Ray Imaging', 'MRI Scanning', 'General Medicine']);
  const itemOptions = unique([...serviceRecords.map((item) => [item.code, item.shortDescription || item.longDescription].filter(Boolean).join(' — ')), 'LAB-CBC — Complete blood count (CBC)', 'LAB-LIPID — Lipid profile', 'RAD-CTH — CT scan head', 'RAD-MRI — MRI brain', 'CAR-ECG — ECG 12-lead']);
  const chapterOptions = unique([...serviceRecords.map((item) => item.chapter), 'Chapter 01 — Nervous system procedures', 'Chapter 03 — Eye and adnexa procedures', 'Chapter 08 — Cardiovascular system']);
  const blockOptions = unique([...serviceRecords.map((item) => item.block), 'Block 300 — Diagnostic examination', 'Block 3400 — Fertility medicine', 'BLK-100 — Diagnostic services']);
  const centerNames = costRecords.map((item) => item.name || item.description || item.code);
  const subCenterNames = costRecords.flatMap((item) => item.children || item.subCostCenters || []).map((item) => item.name || item.description || item.code);
  const costCenterOptions = unique([...centerNames, 'Ambulatory Care', 'Emergency Services', 'Diagnostics', 'Pharmacy Services']);
  const subCostCenterOptions = unique([...subCenterNames, 'Outpatient Clinics', 'Emergency Triage', 'Core Laboratory', 'Outpatient Pharmacy']);
  const diagnosisChapterOptions = ['Chapter I — Certain infectious diseases', 'Chapter II — Neoplasms', 'Chapter IX — Circulatory system', 'Chapter IV — Endocrine and metabolic diseases'];
  const diagnosisBlockOptions = ['I10–I15 — Hypertensive diseases', 'E10–E14 — Diabetes mellitus', 'J00–J06 — Acute respiratory infections'];
  const icdOptions = ['I10 — Essential hypertension', 'E11.9 — Type 2 diabetes mellitus', 'J45.9 — Asthma, unspecified', 'Z00.0 — General adult medical examination'];
  const encounters = ['Inpatient', 'Outpatient', 'Emergency', 'Daycare', 'Observation'];
  const departmentOptions = unique([...departmentRecords.map((item) => item.name), 'Family Medicine', 'Emergency Department', 'Clinical Laboratory', 'Radiology']);
  const specialtyOptions = unique([...practitionerRecords.map((item) => item.specialty), 'General Practitioner', 'Cardiology', 'Radiology', 'Anesthesiology']);
  const payerNames = unique([...payerRecords.map((item) => item.englishName || item.name), 'Bupa Arabia', 'Tawuniya', 'MedGulf', 'MedNet']);
  const policyNames = unique([...policyRecords.map((item) => item.policyNo || item.policyNumber || item.name), 'Policy VIP-01', 'Policy Standard-02', 'Corporate Health 2026']);
  const planNames = unique([...planRecords.map((item) => item.name), 'Gold Plan 2026', 'Silver Plan 2026', 'Prime Co-pay 20%']);
  const networks = unique([...planRecords.map((item) => item.network), 'Network Tier 1', 'Network Tier 2']);
  const classes = unique([...planRecords.map((item) => item.planClass || item.class), 'Class A', 'Class B']);
  const contractTypes = unique([...contractRecords.map((item) => item.contractType), 'Insurance Contract', 'Direct Billing Contract', 'Corporate Agreement', 'Business Development', 'Government Contract', 'Preferred Provider Agreement', 'Corporate Network Agreement', 'Managed Care Contract', 'Self-Pay Agreement', 'National Coverage Contract', 'International Payer Agreement', 'Business Development']);
  const loyaltyPrograms = ['Silver Member Points', 'Gold Health Circle', 'Platinum Care'];
  const financialClasses = ['Commercial Insured', 'Government Subsidized', 'Self-Pay Standard'];
  const basicLookups = {
    category: unique(['Item Discount','Service Discount','Package Discount','Global Discount','Clinical Diagnostics','Surgical Procedures','Pharmacy Retail','Radiology Screening', ...savedCategories]),
    applicableFor: ['Payer','Patient','Contract','Sponsor','All Outpatients & Daycare','Inpatients Only','ER Emergency Visits','International Patients'],
  };
  const lookups = {
    serviceCategory: serviceCategoryOptions,
    groups: groupOptions,
    items: itemOptions,
    serviceChapter: chapterOptions,
    serviceBlock: blockOptions,
    costCenter: costCenterOptions,
    subCostCenter: subCostCenterOptions,
    diagnosisChapter: diagnosisChapterOptions,
    diagnosisBlock: diagnosisBlockOptions,
    icd: icdOptions,
    encounters,
    departments: departmentOptions,
    specialties: specialtyOptions,
    payers: payerNames,
    policies: policyNames,
    plans: planNames,
    networks,
    classes,
  };
  const multiFields = new Set(['encounters', 'departments', 'specialties', 'policies', 'plans']);
  const labelFor = {
    serviceCategory: 'Service Catalog Category', groups: 'Groups / Sub Groups', items: 'Items', serviceChapter: 'Service Chapter', serviceBlock: 'Service Block', costCenter: 'Cost Center', subCostCenter: 'Sub Cost Center',
    diagnosisChapter: 'Diagnosis Chapter', diagnosisBlock: 'Diagnosis Block', icd: 'ICD-10 Code / Description', encounters: 'Encounter Type', departments: 'Department Name', specialties: 'Practitioner Specialty',
    payers: 'Payers', policies: 'Policies', plans: 'Plans', networks: 'Network', classes: 'Class',
  };
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    delete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  };
  const makeRule = (values = {}) => ({
    weight: '0', ruleTitle: '', serviceCategory: '', groups: '', items: '', serviceChapter: '', serviceBlock: '', costCenter: '', subCostCenter: '',
    diagnosisChapter: '', diagnosisBlock: '', icd: '', encounters: [], departments: [], specialties: [], payerType: '', payers: '', policies: [], plans: [], networks: '', classes: '', contractType: '', gender: '', loyaltyPrograms: '', financialClassType: '', ageUnit: 'Years', ageFrom: '18', ageTo: '65', ...values,
  });
  const seed = [
    { id: 'DISC-2026-001', code: 'DISC-2026-001', name: 'Ambulatory Wellness Adjustment', description: 'Contracted allowance for eligible preventive outpatient services.', category: 'Clinical Diagnostics', percentage: '10', applicableFor: 'Payer', rules: [makeRule({ weight: '5', ruleTitle: 'Preventive diagnostic services', serviceCategory: 'Laboratory', groups: 'Core Laboratory Testing', icd: 'Z00.0 — General adult medical examination', encounters: ['Outpatient'], departments: ['Family Medicine'], specialties: ['General Practitioner'], payerType: 'Insurance', payers: payerNames[0], ageFrom: '18', ageTo: '65' })] },
    { id: 'DISC-2026-002', code: 'DISC-2026-002', name: 'Maternity Care Allowance', description: 'Negotiated allowance for outpatient maternity care and diagnostics.', category: 'Service Discount', percentage: '8', applicableFor: 'Contract', rules: [makeRule({ weight: '8', ruleTitle: 'Maternity outpatient visits', serviceCategory: 'Consultation', groups: 'Maternity Care', icd: 'Z34.0 — Supervision of normal pregnancy', encounters: ['Outpatient'], departments: ['Obstetrics and Gynecology'], specialties: ['Obstetrics and Gynecology'], payerType: 'Insurance', payers: payerNames[1], ageUnit: 'Years', ageFrom: '18', ageTo: '45' })] },
    { id: 'DISC-2026-003', code: 'DISC-2026-003', name: 'Employee Diagnostics Schedule', description: 'Corporate adjustment for diagnostic services provided to employees.', category: 'Clinical Diagnostics', percentage: '15', applicableFor: 'Sponsor', rules: [makeRule({ weight: '10', ruleTitle: 'Corporate diagnostic panel', serviceCategory: 'Laboratory', groups: 'Core Diagnostics', icd: 'I10 — Essential hypertension', encounters: ['Outpatient', 'Daycare'], departments: ['Clinical Laboratory'], specialties: ['Laboratory Medicine'], payerType: 'Corporate', payers: payerNames[payerNames.length - 1], ageFrom: '18', ageTo: '65' })] },
  ];
  const readRecords = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map((record) => ({ ...record, rules: Array.isArray(record.rules) ? record.rules.map((rule) => makeRule(rule)) : [] }));
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep the mock records available in memory if storage is unavailable. */ }
    return JSON.parse(JSON.stringify(seed));
  };
  let records = readRecords();
  let filters = { code: '', name: '', description: '', category: '' };
  let page = 1;
  const pageSize = 8;
  let mode = 'add';
  let activeId = null;
  let draft = null;
  let ruleDraft = null;
  let editingRuleIndex = null;
  let toastTimer;

  const persist = () => { try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep this page session usable. */ } };
  const notify = (message) => { const toast = root.querySelector('[data-discount-toast]'); toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); };
  const readFilters = () => Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value || '').trim().toLowerCase()]));
  const filtered = () => { const applied = readFilters(); return records.filter((record) => Object.entries(applied).every(([key, value]) => !value || String(record[key] || '').toLowerCase().includes(value))); };
  const basicFields = ['code', 'name', 'description', 'category', 'percentage', 'applicableFor'];
  const ruleTextFields = ['weight', 'ruleTitle', 'payerType', 'contractType', 'gender', 'loyaltyPrograms', 'financialClassType', 'ageUnit', 'ageFrom', 'ageTo'];
  function renderGrid() {
    const matching = filtered(); const pages = Math.max(1, Math.ceil(matching.length / pageSize)); page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    root.querySelector('[data-discount-rows]').innerHTML = visible.map((record) => `<tr><td class="branch-code">${esc(record.code)}</td><td><span class="facility-name-en">${esc(record.name)}</span></td><td><span class="discount-description">${esc(record.description)}</span></td><td>${esc(record.category)}</td><td><div class="discount-inline-actions"><button class="icon-button" type="button" data-discount-action="view" data-id="${esc(record.id)}" aria-label="View ${esc(record.name)}" title="View">${icons.view}</button><button class="icon-button" type="button" data-discount-action="edit" data-id="${esc(record.id)}" aria-label="Edit ${esc(record.name)}" title="Edit">${icons.edit}</button><button class="icon-button discount-delete-action" type="button" data-discount-action="delete" data-id="${esc(record.id)}" aria-label="Delete ${esc(record.name)}" title="Delete">${icons.delete}</button></div></td></tr>`).join('');
    root.querySelector('[data-discount-empty]').hidden = matching.length > 0;
    root.querySelector('[data-discount-count]').textContent = `Total Results: ${matching.length}`;
    root.querySelector('[data-discount-page-label]').textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-discount-page]').forEach((button) => { button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.discountPage) ? page === 1 : page === pages); });
  }

  root.innerHTML = `
    <div class="branches-toolbar discount-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-discount-add>${icons.add}Add Discount</button></div><div class="branches-filter-grid discount-filter-grid" aria-label="Filter discounts"><label class="facility-filter"><span>Code</span><input type="search" data-discount-filter="code" placeholder="Search code"></label><label class="facility-filter"><span>Name</span><input type="search" data-discount-filter="name" placeholder="Search name"></label><label class="facility-filter"><span>Description</span><input type="search" data-discount-filter="description" placeholder="Search description"></label><label class="facility-filter"><span>Category</span><select data-discount-filter="category"><option value="">All categories</option>${unique([...savedCategories,'Item Discount','Service Discount','Package Discount','Global Discount','Clinical Diagnostics','Surgical Procedures','Pharmacy Retail','Radiology Screening']).map((item) => `<option>${esc(item)}</option>`).join('')}</select></label></div></div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table discount-grid-table"><thead><tr><th>Code</th><th>Name</th><th>Description</th><th>Category</th><th>Actions</th></tr></thead><tbody data-discount-rows></tbody></table></div><div class="facility-empty" data-discount-empty hidden>No discounts match the selected filters.</div><footer class="facility-pagination"><span data-discount-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-discount-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-discount-page="previous" aria-label="Previous page">‹</button><span data-discount-page-label></span><button class="icon-button" type="button" data-discount-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-discount-page="last" aria-label="Last page">»</button></div></footer></div>
    <div class="patient-modal-backdrop discount-modal-backdrop" data-discount-modal hidden><section class="patient-modal discount-modal" role="dialog" aria-modal="true" aria-labelledby="discount-modal-title"><header class="patient-modal-header"><div><p class="eyebrow">DISCOUNT CONFIGURATION</p><h2 id="discount-modal-title">Add Discount</h2><p>Configure discount information and rules for this facility.</p></div><button class="icon-button" type="button" data-discount-close aria-label="Close dialog">${icons.close}</button></header><form data-discount-form><div class="patient-modal-body discount-modal-body">
      <fieldset class="patient-form-section discount-section"><legend class="sr-only">Basic Information</legend><div class="facility-form-section-heading">Basic Information</div><div class="patient-form-grid discount-fields"><label class="form-field"><span>Code <b>*</b></span><input data-basic="code" maxlength="15" required></label><label class="form-field"><span>Name <b>*</b></span><input data-basic="name" maxlength="150" required></label><label class="form-field"><span>Description <b>*</b></span><input data-basic="description" maxlength="150" required></label><label class="form-field"><span>Category <b>*</b></span><select data-basic="category" required><option value="">Select category</option>${basicLookups.category.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label><label class="form-field"><span>Percentage Value (%) <b>*</b></span><input data-basic="percentage" type="number" min="0" max="100" step="0.01" maxlength="5" required></label><label class="form-field"><span>Applicable For <b>*</b></span><select data-basic="applicableFor" required><option value="">Select applicability</option>${basicLookups.applicableFor.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label></div></fieldset>
      <fieldset class="patient-form-section discount-section"><legend class="sr-only">Discount Specifications</legend><div class="facility-form-section-heading">Discount Specifications</div>
      <section class="discount-rule-editor" data-discount-rule-editor><div class="discount-rule-editor-heading"><div><h3 data-discount-rule-editor-title>Add Rule</h3><p>Rule Title and ICD-10 Code / Description are required for each rule.</p></div><button class="button button-secondary" type="button" data-discount-rule-cancel hidden>Cancel Rule</button></div><div class="patient-form-grid discount-fields"><label class="form-field"><span>Rule Title <b>*</b></span><input data-rule="ruleTitle" maxlength="150"></label><label class="form-field"><span>Weight</span><input data-rule="weight" type="number" min="0" max="999"></label></div>
      <div class="discount-subsection"><h3>Service Catalogs</h3><div class="discount-lookup-grid" data-discount-lookup-group="service"></div></div><div class="discount-subsection"><h3>Diagnosis</h3><div class="discount-lookup-grid" data-discount-lookup-group="diagnosis"></div></div><div class="discount-subsection"><h3>Medical Settings</h3><div class="discount-lookup-grid" data-discount-lookup-group="medical"></div></div>
      <div class="discount-subsection"><h3>Payer and Contracts</h3><div class="patient-form-grid discount-fields"><label class="form-field"><span>Payer Type</span><select data-rule="payerType"><option value="">Select</option><option>Insurance</option><option>Direct</option><option>Sponsor</option><option>Payroll</option><option>Corporate</option></select></label><label class="form-field"><span>Contract Type</span><select data-rule="contractType"><option value="">Select contract type</option>${contractTypes.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label></div><div class="discount-lookup-grid" data-discount-lookup-group="payer"></div></div>
      <div class="discount-subsection"><h3>Patients and Age Group</h3><div class="patient-form-grid discount-fields"><label class="form-field"><span>Gender</span><select data-rule="gender"><option value="">All</option><option>Male</option><option>Female</option></select></label><label class="form-field"><span>Loyalty Programs</span><select data-rule="loyaltyPrograms"><option value="">Select loyalty program</option>${loyaltyPrograms.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label><label class="form-field"><span>Financial Class Type</span><select data-rule="financialClassType"><option value="">Select financial class</option>${financialClasses.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label><label class="form-field"><span>Age Group Unit</span><select data-rule="ageUnit"><option>Select</option><option>Month</option><option>Years</option></select></label><label class="form-field"><span>From</span><input data-rule="ageFrom" type="number" min="0"></label><label class="form-field"><span>To</span><input data-rule="ageTo" type="number" min="0"></label></div></div><div class="discount-rule-editor-actions"><button class="button button-primary" type="button" data-discount-rule-save>${icons.add}Add Rule</button></div></section>
      <section class="discount-rules-section"><div class="facility-form-section-heading">Discount Rules</div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table discount-rules-table"><thead><tr><th>#</th><th>Rule Title</th><th>Applicable For</th><th>Category</th><th>Weight</th><th>Actions</th></tr></thead><tbody data-discount-rule-rows></tbody></table></div><div class="facility-empty" data-discount-no-rules hidden>No Data</div></div></section></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-discount-cancel>Cancel</button><button class="button button-primary" type="submit" data-discount-save>Create</button></div></footer></form></section></div>
    <div class="patient-modal-backdrop discount-modal-backdrop discount-spec-backdrop" data-discount-spec-modal hidden><section class="patient-modal discount-spec-modal" role="dialog" aria-modal="true" aria-labelledby="discount-spec-heading"><header class="patient-modal-header"><div><p class="eyebrow">DISCOUNT RULE DETAILS</p><h2 id="discount-spec-heading">View Specifications</h2></div><button class="icon-button" type="button" data-discount-spec-close aria-label="Close specifications">${icons.close}</button></header><div class="patient-modal-body"><div class="discount-spec-grid" data-discount-spec-grid></div></div><footer class="patient-modal-footer"><span></span><button class="button button-secondary" type="button" data-discount-spec-close>Close</button></footer></section></div>
    <div class="facility-toast" data-discount-toast role="status" aria-live="polite"></div>`;

  const lookupGroups = { service: ['serviceCategory','groups','items','serviceChapter','serviceBlock','costCenter','subCostCenter'], diagnosis: ['diagnosisChapter','diagnosisBlock','icd'], medical: ['encounters','departments','specialties'], payer: ['payers','policies','plans','networks','classes'] };
  function buildLookupControls() { Object.entries(lookupGroups).forEach(([group, fields]) => { root.querySelector(`[data-discount-lookup-group="${group}"]`).innerHTML = fields.map((field) => lookupControlMarkup(field)).join(''); }); }
  function lookupControlMarkup(field) { const isMulti = multiFields.has(field); return `<label class="form-field discount-lookup" data-lookup-field="${field}"><span>${esc(labelFor[field])}</span><select data-rule-select="${field}"${isMulti ? ` multiple size="1" aria-describedby="discount-multi-select-hint-${field}"` : ''}>${isMulti ? '' : `<option value="">Select ${esc(labelFor[field].toLowerCase())}</option>`}${(lookups[field] || []).map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select>${isMulti ? `<small id="discount-multi-select-hint-${field}">Use Ctrl or Command to select multiple values.</small>` : ''}</label>`; }
  buildLookupControls();
  const ruleEditor = root.querySelector('[data-discount-rule-editor]');
  function fillBasicForm() {
    basicFields.forEach((name) => { const field = root.querySelector(`[data-basic="${name}"]`); field.value = draft[name] ?? ''; });
  }
  function fillRuleForm() {
    ruleTextFields.forEach((name) => { const field = root.querySelector(`[data-rule="${name}"]`); if (field) field.value = ruleDraft[name] ?? ''; });
    Object.keys(lookups).forEach((field) => {
      const select = root.querySelector(`[data-rule-select="${field}"]`); if (!select) return;
      const current = ruleDraft[field]; const selected = multiFields.has(field) ? (Array.isArray(current) ? current : []) : (current ? [current] : []);
      const options = unique([...(lookups[field] || []), ...selected]);
      select.innerHTML = `${multiFields.has(field) ? '' : `<option value="">Select ${esc(labelFor[field].toLowerCase())}</option>`}${options.map((item) => `<option value="${esc(item)}"${selected.includes(item) ? ' selected' : ''}>${esc(item)}</option>`).join('')}`;
    });
  }
  function renderRuleRows() {
    root.querySelector('[data-discount-rule-rows]').innerHTML = draft.rules.map((rule, index) => `<tr><td>${index + 1}</td><td>${esc(rule.ruleTitle)}</td><td>${esc(rule.payerType || draft.applicableFor || '—')}</td><td>${esc(rule.serviceCategory || draft.category || '—')}</td><td>${esc(rule.weight || '0')}</td><td><div class="discount-rule-actions">${mode === 'view' ? `<button class="button button-quiet" type="button" data-discount-spec="${index}">View Specifications</button>` : `<button class="button button-quiet" type="button" data-discount-edit-rule="${index}">Edit</button><button class="button button-quiet discount-delete-action" type="button" data-discount-remove-rule="${index}">Delete</button>`}</div></td></tr>`).join('');
    root.querySelector('[data-discount-no-rules]').hidden = draft.rules.length > 0;
  }
  function renderModal() {
    const readOnly = mode === 'view';
    root.querySelector('#discount-modal-title').textContent = mode === 'add' ? 'Add Discount' : mode === 'edit' ? 'Edit Discount' : 'View Discount';
    root.querySelector('[data-discount-save]').textContent = mode === 'edit' ? 'Save Changes' : 'Create'; root.querySelector('[data-discount-save]').hidden = readOnly;
    root.querySelector('[data-discount-form]').querySelectorAll('[data-basic]').forEach((field) => { field.disabled = readOnly; });
    root.querySelector('[data-discount-cancel]').textContent = readOnly ? 'Close' : 'Cancel'; ruleEditor.hidden = readOnly;
    fillBasicForm(); fillRuleForm(); renderRuleRows();
  }
  function openModal(nextMode, record = null) { mode = nextMode; activeId = record?.id || null; editingRuleIndex = null; draft = record ? { ...record, rules: (record.rules || []).map((rule) => makeRule(rule)) } : { id: '', code: '', name: '', description: '', category: '', percentage: '0', applicableFor: '', rules: [] }; ruleDraft = makeRule(); renderModal(); root.querySelector('[data-discount-modal]').hidden = false; document.body.classList.add('modal-open'); }
  function closeModal() { root.querySelector('[data-discount-modal]').hidden = true; root.querySelector('[data-discount-spec-modal]').hidden = true; document.body.classList.remove('modal-open'); }
  function readBasicForm() { const result = {}; basicFields.forEach((name) => { result[name] = root.querySelector(`[data-basic="${name}"]`).value.trim(); }); result.id = activeId || `discount-${Date.now()}`; return result; }
  function readRuleForm() { const result = makeRule(); ruleTextFields.forEach((name) => { const field = root.querySelector(`[data-rule="${name}"]`); if (field) result[name] = field.value.trim(); }); Object.keys(lookups).forEach((field) => { const select = root.querySelector(`[data-rule-select="${field}"]`); if (!select) return; result[field] = multiFields.has(field) ? [...select.selectedOptions].map((option) => option.value) : select.value; }); return result; }
  function saveRule() {
    const rule = readRuleForm();
    if (!rule.ruleTitle) { notify('Rule Title is required.'); root.querySelector('[data-rule="ruleTitle"]').focus(); return; }
    if (!rule.icd) { notify('Select an ICD-10 Code / Description.'); root.querySelector('[data-rule-select="icd"]').focus(); return; }
    if (editingRuleIndex === null) draft.rules.push(rule); else draft.rules[editingRuleIndex] = rule;
    editingRuleIndex = null; ruleDraft = makeRule(); root.querySelector('[data-discount-rule-editor-title]').textContent = 'Add Rule'; root.querySelector('[data-discount-rule-cancel]').hidden = true;
    fillRuleForm(); renderRuleRows(); notify('Rule added to this discount.');
  }
  function editRule(index) { editingRuleIndex = index; ruleDraft = makeRule(draft.rules[index]); root.querySelector('[data-discount-rule-editor-title]').textContent = 'Edit Rule'; root.querySelector('[data-discount-rule-cancel]').hidden = false; fillRuleForm(); root.querySelector('[data-rule="ruleTitle"]').focus(); }
  function showSpec(rule) { const entries = [['Weight',rule.weight],['Rule Title',rule.ruleTitle],['Service Catalog Category',rule.serviceCategory],['Groups / Sub Groups',rule.groups],['Items',rule.items],['Service Chapter',rule.serviceChapter],['Service Block',rule.serviceBlock],['Cost Center',rule.costCenter],['Sub Cost Center',rule.subCostCenter],['Diagnosis Chapter',rule.diagnosisChapter],['Diagnosis Block',rule.diagnosisBlock],['ICD-10 Code / Description',rule.icd],['Encounter Type',rule.encounters],['Department Name',rule.departments],['Practitioner Specialty',rule.specialties],['Payer Type',rule.payerType],['Payers',rule.payers],['Policies',rule.policies],['Plans',rule.plans],['Network',rule.networks],['Class',rule.classes],['Contract Type',rule.contractType],['Gender',rule.gender],['Loyalty Programs',rule.loyaltyPrograms],['Financial Class Type',rule.financialClassType],['Age Group Unit',rule.ageUnit],['Age Group From',rule.ageFrom],['Age Group To',rule.ageTo]]; root.querySelector('[data-discount-spec-grid]').innerHTML = entries.map(([label,value]) => `<div><span>${esc(label)}</span><strong>${esc(Array.isArray(value) ? value.join(', ') : value || '—')}</strong></div>`).join(''); root.querySelector('[data-discount-spec-modal]').hidden = false; }
  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-basic="percentage"]') && event.target.value.length > 5) event.target.value = event.target.value.slice(0, 5);
    const filter = event.target.closest('[data-discount-filter]');
    if (filter) { filters[filter.dataset.discountFilter] = filter.value; page = 1; renderGrid(); }
  });
  root.addEventListener('change', (event) => {
    const filter = event.target.closest('[data-discount-filter]'); if (filter) { filters[filter.dataset.discountFilter] = filter.value; page = 1; renderGrid(); }
    const ruleSelect = event.target.closest('[data-rule-select]');
    if (ruleSelect) { const field = ruleSelect.dataset.ruleSelect; ruleDraft[field] = multiFields.has(field) ? [...ruleSelect.selectedOptions].map((option) => option.value) : ruleSelect.value; }
  });
  root.addEventListener('click', (event) => {
    const action = event.target.closest('[data-discount-action]');
    if (action) {
      const record = records.find((item) => item.id === action.dataset.id); if (!record) return;
      if (action.dataset.discountAction === 'view') openModal('view', record);
      else if (action.dataset.discountAction === 'edit') openModal('edit', record);
      else if (window.confirm(`Delete discount “${record.name}”? This also removes its rules.`)) { records = records.filter((item) => item.id !== record.id); persist(); renderGrid(); notify('Discount deleted.'); }
      return;
    }
    if (event.target.closest('[data-discount-add]')) { openModal('add'); return; }
    if (event.target.closest('[data-discount-close], [data-discount-cancel]')) { closeModal(); return; }
    const spec = event.target.closest('[data-discount-spec]'); if (spec) { showSpec(draft.rules[Number(spec.dataset.discountSpec)]); return; }
    const editRuleButton = event.target.closest('[data-discount-edit-rule]'); if (editRuleButton) { editRule(Number(editRuleButton.dataset.discountEditRule)); return; }
    const removeRule = event.target.closest('[data-discount-remove-rule]');
    if (removeRule) { const index = Number(removeRule.dataset.discountRemoveRule); if (window.confirm(`Remove rule “${draft.rules[index]?.ruleTitle || ''}”?`)) { draft.rules.splice(index,1); if (editingRuleIndex === index) { editingRuleIndex = null; ruleDraft = makeRule(); fillRuleForm(); } renderRuleRows(); } return; }
    if (event.target.closest('[data-discount-rule-save]')) { saveRule(); return; }
    if (event.target.closest('[data-discount-rule-cancel]')) { editingRuleIndex = null; ruleDraft = makeRule(); root.querySelector('[data-discount-rule-editor-title]').textContent = 'Add Rule'; root.querySelector('[data-discount-rule-cancel]').hidden = true; fillRuleForm(); return; }
    if (event.target.closest('[data-discount-spec-close]')) { root.querySelector('[data-discount-spec-modal]').hidden = true; return; }
    const pageButton = event.target.closest('[data-discount-page]'); if (pageButton) { const pages = Math.max(1, Math.ceil(filtered().length / pageSize)); const next = { first:1, previous:page - 1, next:page + 1, last:pages }[pageButton.dataset.discountPage]; page = Math.max(1,Math.min(pages,next)); renderGrid(); }
  });
  root.addEventListener('submit', (event) => {
    if (!event.target.matches('[data-discount-form]')) return;
    event.preventDefault(); const form = event.target;
    if (!form.reportValidity()) return;
    const values = readBasicForm();
    const duplicate = records.some((record) => record.code.toLowerCase() === values.code.toLowerCase() && record.id !== activeId);
    if (duplicate) { const code = root.querySelector('[data-basic="code"]'); code.setCustomValidity('Code must be unique within this facility.'); code.reportValidity(); code.addEventListener('input', () => code.setCustomValidity(''), { once: true }); return; }
    if (mode === 'edit') { const record = records.find((item) => item.id === activeId); Object.assign(record, values, { rules: draft.rules.map((rule) => makeRule(rule)) }); }
    else records.unshift({ ...values, rules: draft.rules.map((rule) => makeRule(rule)) });
    persist(); closeModal(); renderGrid(); notify(mode === 'edit' ? 'Discount saved.' : 'Discount created.');
  });
  root.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (!root.querySelector('[data-discount-spec-modal]').hidden) root.querySelector('[data-discount-spec-modal]').hidden = true; else if (!root.querySelector('[data-discount-modal]').hidden) closeModal(); } });
  renderGrid();
})();
