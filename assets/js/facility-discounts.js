(() => {
  const root = document.querySelector('[data-discounts]');
  if (!root) return;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const seed = [
    { id: 'discount-annual-screening', code: 'DISC-CLN-014', name: 'Preventive Screening Allowance', description: 'Coverage adjustment for approved preventive screening services.', category: 'Preventive Care', percentage: '12', applicableFor: 'Insurance', weight: '10', ruleTitle: 'Annual screening services', inclusion: 'Inclusion', serviceCategory: 'Laboratory', groups: 'Preventive Diagnostics', items: 'Annual wellness panel', chapter: 'Laboratory Services', block: 'Screening', costCenter: 'Outpatient Services', subCostCenter: 'Preventive Care', diagnosisChapter: 'Endocrine', diagnosisBlock: 'Metabolic screening', icd: 'Z13.1 — Screening for diabetes mellitus', encounter: 'Outpatient', department: 'Family Medicine', specialty: 'Family Medicine', payerType: 'Insurance', payer: 'Tawuniya Cooperative Insurance Company', policy: 'Preventive Plus', plan: 'Essential Network Plan', network: 'Standard', className: 'Class B', gender: 'All', ageUnit: 'Years', ageFrom: '18', ageTo: '64', rules: 1, active: true },
    { id: 'discount-maternity', code: 'DISC-MAT-008', name: 'Maternity Care Adjustment', description: 'Contracted adjustment for maternity consultations and diagnostics.', category: 'Maternity', percentage: '8', applicableFor: 'Insurance', weight: '8', ruleTitle: 'Maternity outpatient services', inclusion: 'Inclusion', serviceCategory: 'Obstetrics', groups: 'Maternity Care', items: 'Prenatal consultation', chapter: 'Clinical Services', block: 'Maternity', costCenter: 'Women’s Health', subCostCenter: 'Maternity Clinic', diagnosisChapter: 'Pregnancy', diagnosisBlock: 'Routine care', icd: 'Z34.0 — Supervision of normal first pregnancy', encounter: 'Outpatient', department: 'Obstetrics and Gynecology', specialty: 'Obstetrics and Gynecology', payerType: 'Insurance', payer: 'Bupa Arabia for Cooperative Insurance', policy: 'Maternity Network', plan: 'Family Care Plan', network: 'Gold', className: 'Class A', gender: 'Female', ageUnit: 'Years', ageFrom: '18', ageTo: '45', rules: 2, active: true },
    { id: 'discount-corporate-lab', code: 'DISC-COR-021', name: 'Corporate Diagnostics Rate', description: 'Negotiated diagnostics adjustment for corporate members.', category: 'Diagnostics', percentage: '15', applicableFor: 'Corporate', weight: '15', ruleTitle: 'Corporate laboratory panel', inclusion: 'Inclusion', serviceCategory: 'Laboratory', groups: 'Core Diagnostics', items: 'Complete blood count', chapter: 'Laboratory Services', block: 'Hematology', costCenter: 'Diagnostics', subCostCenter: 'Laboratory', diagnosisChapter: 'General', diagnosisBlock: 'Routine tests', icd: 'Z00.0 — General adult medical examination', encounter: 'Outpatient', department: 'Clinical Laboratory', specialty: 'Laboratory Medicine', payerType: 'Corporate', payer: 'Riyadh Industrial Group', policy: 'Corporate Wellness', plan: 'Employee Health Plan', network: 'Direct', className: 'Corporate', gender: 'All', ageUnit: 'Years', ageFrom: '0', ageTo: '120', rules: 1, active: true },
    { id: 'discount-pharmacy', code: 'DISC-PHR-006', name: 'Chronic Care Pharmacy Rate', description: 'Long-term therapy adjustment for eligible pharmacy items.', category: 'Pharmacy', percentage: '5', applicableFor: 'Insurance', weight: '6', ruleTitle: 'Chronic medication items', inclusion: 'Inclusion', serviceCategory: 'Pharmacy', groups: 'Chronic Therapy', items: 'Maintenance medication supply', chapter: 'Pharmacy Services', block: 'Medication', costCenter: 'Pharmacy', subCostCenter: 'Outpatient Pharmacy', diagnosisChapter: 'Circulatory', diagnosisBlock: 'Chronic conditions', icd: 'I10 — Essential (primary) hypertension', encounter: 'Outpatient', department: 'Outpatient Pharmacy', specialty: 'Pharmacy', payerType: 'Insurance', payer: 'Medgulf Cooperative Insurance', policy: 'Chronic Care', plan: 'Silver Network Plan', network: 'Silver', className: 'Class C', gender: 'All', ageUnit: 'Years', ageFrom: '18', ageTo: '120', rules: 3, active: false },
  ];
  let records = seed.map((item) => ({ ...item, alias: item.category, ruleRows: [{ ...item }] }));
  let query = '';
  const pageSize = 8;
  let mode = 'add';
  let currentRecord = null;
  let draft = null;
  let editingRuleIndex = null;
  let toastTimer;

  root.innerHTML = `
    <div class="discount-toolbar"><button class="button button-primary" type="button" data-discount-add>${icons.add}Add Discount</button></div>
    <div class="branches-filter-grid discount-filter-grid" aria-label="Filter discounts"><label class="facility-filter"><span>Name</span><input type="search" data-discount-filter placeholder="Filter by name"></label></div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table discount-list-table"><thead><tr><th>Name</th><th>Description</th><th>Alias</th><th>Status</th><th>Actions</th></tr></thead><tbody data-discount-rows></tbody></table></div><div class="facility-empty" data-discount-empty hidden>No discounts match this name.</div><footer class="facility-pagination"><span data-discount-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-discount-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-discount-page="previous" aria-label="Previous page">‹</button><span data-discount-page-label></span><button class="icon-button" type="button" data-discount-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-discount-page="last" aria-label="Last page">»</button></div></footer></div>
    <div class="patient-modal-backdrop discount-backdrop" data-discount-modal hidden><section class="patient-modal discount-modal" role="dialog" aria-modal="true" aria-labelledby="discount-modal-title"><header class="patient-modal-header"><div><p class="eyebrow">DISCOUNT RULE</p><h2 id="discount-modal-title">Add Discount</h2><p data-discount-modal-description>Configure the discount and its application rules.</p></div><button class="icon-button" type="button" data-discount-close aria-label="Close dialog">×</button></header><form data-discount-form><div class="patient-modal-body discount-modal-body">
      <fieldset class="patient-form-section"><legend class="sr-only">Basic Information</legend><div class="facility-form-section-heading">Basic Information</div><div class="patient-form-grid discount-fields">
        <label class="form-field"><span>Code <b>*</b></span><input name="code" maxlength="15" required></label><label class="form-field"><span>Name <b>*</b></span><input name="name" maxlength="150" required></label><label class="form-field"><span>Description <b>*</b></span><input name="description" maxlength="150" required></label><label class="form-field"><span>Alias</span><input name="alias" maxlength="150"></label><label class="form-field"><span>Category <b>*</b></span><input name="category" required></label><label class="form-field"><span>Percentage Value <b>*</b></span><input name="percentage" type="number" min="0" step="0.01" maxlength="5" required></label><label class="form-field"><span>Applicable For <b>*</b></span><input name="applicableFor" list="discount-applicable-options" required><datalist id="discount-applicable-options"><option>Insurance</option><option>Direct</option><option>Sponsor</option><option>Payroll</option><option>Corporate</option></datalist></label>
      </div></fieldset>
      <fieldset class="patient-form-section"><legend class="sr-only">Discount Specifications</legend><div class="facility-form-section-heading">Discount Specifications</div><div class="patient-form-grid discount-fields"><label class="form-field"><span>Weight</span><input name="weight" type="number" min="0" max="999" value="0"></label><label class="form-field"><span>Rule Title <b>*</b></span><input name="ruleTitle" maxlength="150" required></label><label class="form-field"><span>Inclusion Type</span><select name="inclusion"><option>Inclusion</option><option>Exclusion</option></select></label></div></fieldset>
      <fieldset class="patient-form-section"><legend class="sr-only">Service Catalogs</legend><div class="facility-form-section-heading">Service Catalogs</div><div class="patient-form-grid discount-fields"><label class="form-field"><span>Category</span><input name="serviceCategory"></label><label class="form-field"><span>Groups / Sub Groups</span><input name="groups"></label><label class="form-field"><span>Items</span><input name="items"></label><label class="form-field"><span>Chapter</span><input name="chapter"></label><label class="form-field"><span>Block</span><input name="block"></label><label class="form-field"><span>Cost Center</span><input name="costCenter"></label><label class="form-field"><span>Sub Cost Center</span><input name="subCostCenter"></label></div></fieldset>
      <fieldset class="patient-form-section"><legend class="sr-only">Diagnosis</legend><div class="facility-form-section-heading">Diagnosis</div><div class="patient-form-grid discount-fields"><label class="form-field"><span>Chapter</span><input name="diagnosisChapter"></label><label class="form-field"><span>Block</span><input name="diagnosisBlock"></label><label class="form-field"><span>ICD-10 Code / Description <b>*</b></span><input name="icd" required></label></div></fieldset>
      <fieldset class="patient-form-section"><legend class="sr-only">Medical Settings</legend><div class="facility-form-section-heading">Medical Settings</div><div class="patient-form-grid discount-fields"><label class="form-field"><span>Encounter Type</span><input name="encounter"></label><label class="form-field"><span>Department Name</span><input name="department"></label><label class="form-field"><span>Practitioner Specialty</span><input name="specialty"></label></div></fieldset>
      <fieldset class="patient-form-section"><legend class="sr-only">Payer</legend><div class="facility-form-section-heading">Payer</div><div class="patient-form-grid discount-fields"><label class="form-field"><span>Payer Type</span><select name="payerType"><option value="">Select payer type</option><option>Insurance</option><option>Direct</option><option>Sponsor</option><option>Payroll</option><option>Corporate</option></select></label><label class="form-field"><span>Payers</span><input name="payer"></label><label class="form-field"><span>Policies</span><input name="policy"></label><label class="form-field"><span>Plans</span><input name="plan"></label><label class="form-field"><span>Network</span><input name="network"></label><label class="form-field"><span>Class</span><input name="className"></label></div></fieldset>
      <fieldset class="patient-form-section"><legend class="sr-only">Patients and Age</legend><div class="facility-form-section-heading">Patients &amp; Age</div><div class="patient-form-grid discount-fields"><label class="form-field"><span>Gender</span><select name="gender"><option value="">All</option><option>Female</option><option>Male</option></select></label><label class="form-field"><span>Age Group Unit</span><select name="ageUnit"><option>Years</option><option>Month</option><option>Select</option></select></label><label class="form-field"><span>From</span><input name="ageFrom" type="number" min="0"></label><label class="form-field"><span>To</span><input name="ageTo" type="number" min="0"></label></div></fieldset>
      <section class="discount-rules-section"><div class="discount-rules-heading"><div><div class="facility-form-section-heading">Rules</div><p>Rules describe how this discount is applied.</p></div><button class="button button-secondary" type="button" data-discount-add-rule>${icons.add}Add Rule</button></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table discount-rules-table"><thead><tr><th>#</th><th>Rule Title</th><th>Applicable For</th><th>Category</th><th>Weight</th><th>Actions</th></tr></thead><tbody data-discount-rule-rows></tbody></table></div><div class="facility-empty" data-discount-no-rules hidden>No rules added yet.</div></div></section>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-discount-cancel>Cancel</button><button class="button button-primary" type="submit" data-discount-save>Create</button></div></footer></form></section></div>
    <div class="patient-modal-backdrop discount-spec-backdrop" data-discount-spec-modal hidden><section class="patient-modal discount-spec-modal" role="dialog" aria-modal="true" aria-labelledby="discount-spec-title"><header class="patient-modal-header"><div><p class="eyebrow">DISCOUNT RULE DETAILS</p><h2 id="discount-spec-title">View Specifications</h2><p data-discount-spec-subtitle></p></div><button class="icon-button" type="button" data-discount-spec-close aria-label="Close specifications">×</button></header><div class="patient-modal-body"><div class="discount-spec-grid" data-discount-spec-grid></div></div><footer class="patient-modal-footer"><span></span><button class="button button-secondary" type="button" data-discount-spec-close>Close</button></footer></section></div>
    <div class="facility-toast" data-discount-toast role="status" aria-live="polite"></div>`;

  const rows = root.querySelector('[data-discount-rows]');
  const modal = root.querySelector('[data-discount-modal]');
  const form = root.querySelector('[data-discount-form]');
  const specModal = root.querySelector('[data-discount-spec-modal]');
  let page = 1;

  const showToast = (message) => { const toast = root.querySelector('[data-discount-toast]'); toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400); };
  function filtered() { return records.filter((record) => `${record.name} ${record.description} ${record.code}`.toLowerCase().includes(query)); }
  function renderList() {
    const matching = filtered();
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((record) => `<tr><td><span class="facility-name-en">${esc(record.name)}</span></td><td><span class="discount-description">${esc(record.description)}</span></td><td>${esc(record.alias || '—')}</td><td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-discount-menu aria-label="Actions for ${esc(record.name)}" aria-haspopup="menu" aria-expanded="false" data-id="${esc(record.id)}">${icons.more}</button><div class="facility-row-menu discount-row-menu" role="menu" hidden><button type="button" role="menuitem" data-discount-action="view" data-id="${esc(record.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-discount-action="edit" data-id="${esc(record.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-discount-action="status" data-id="${esc(record.id)}">${icons.status}${record.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    root.querySelector('[data-discount-empty]').hidden = matching.length > 0;
    root.querySelector('[data-discount-count]').textContent = `Total Results: ${matching.length}`;
    root.querySelector('[data-discount-page-label]').textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-discount-page]').forEach((button) => { button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.discountPage) ? page === 1 : page === pages); });
  }
  function renderRuleRows() {
    const rules = draft.rules || [];
    root.querySelector('[data-discount-rule-rows]').innerHTML = rules.map((rule, index) => `<tr><td>${index + 1}</td><td>${esc(rule.ruleTitle || '—')}</td><td>${esc(rule.applicableFor || '—')}</td><td>${esc(rule.category || '—')}</td><td>${esc(rule.weight || '0')}</td><td>${mode === 'view' ? `<button class="button button-quiet discount-spec-action" type="button" data-discount-view-spec="${index}">View Specifications</button>` : `<div class="discount-rule-actions"><button class="button button-quiet discount-spec-action" type="button" data-discount-edit-rule="${index}">Edit</button><button class="button button-quiet discount-spec-action" type="button" data-discount-delete-rule="${index}">Delete</button></div>`}</td></tr>`).join('');
    root.querySelector('[data-discount-no-rules]').hidden = rules.length > 0;
  }
  const fieldNames = ['code','name','description','alias','category','percentage','applicableFor','weight','ruleTitle','inclusion','serviceCategory','groups','items','chapter','block','costCenter','subCostCenter','diagnosisChapter','diagnosisBlock','icd','encounter','department','specialty','payerType','payer','policy','plan','network','className','gender','ageUnit','ageFrom','ageTo'];
  function copyFormInto(target) { fieldNames.forEach((name) => { const field = form.elements.namedItem(name); if (field) target[name] = field.value; }); }
  function syncFormFromDraft() { fieldNames.forEach((name) => { const field = form.elements.namedItem(name); if (field) field.value = draft[name] ?? (name === 'weight' ? '0' : name === 'inclusion' ? 'Inclusion' : name === 'ageUnit' ? 'Years' : ''); }); }
  function openModal(nextMode, record = null) {
    mode = nextMode;
    currentRecord = record;
    draft = record ? { ...record, rules: (record.ruleRows || []).map((rule) => ({ ...rule })) } : { id: '', code: '', name: '', description: '', alias: '', category: '', percentage: '', applicableFor: '', weight: '0', ruleTitle: '', inclusion: 'Inclusion', serviceCategory: '', groups: '', items: '', chapter: '', block: '', costCenter: '', subCostCenter: '', diagnosisChapter: '', diagnosisBlock: '', icd: '', encounter: '', department: '', specialty: '', payerType: '', payer: '', policy: '', plan: '', network: '', className: '', gender: '', ageUnit: 'Years', ageFrom: '', ageTo: '', ruleRows: [] };
    draft.rules = draft.rules || [];
    editingRuleIndex = null;
    syncFormFromDraft();
    const readonly = mode === 'view';
    form.querySelectorAll('input, select, textarea').forEach((field) => { field.disabled = readonly; });
    root.querySelector('#discount-modal-title').textContent = mode === 'add' ? 'Add Discount' : mode === 'edit' ? 'Edit Discount' : 'View Discount';
    root.querySelector('[data-discount-modal-description]').textContent = readonly ? 'Review discount details and rule specifications.' : mode === 'edit' ? 'Update the discount information and specifications.' : 'Enter discount information and add its application rules.';
    root.querySelector('[data-discount-save]').hidden = readonly;
    root.querySelector('[data-discount-save]').textContent = mode === 'edit' ? 'Save Changes' : 'Create';
    root.querySelector('[data-discount-add-rule]').hidden = readonly;
    root.querySelector('[data-discount-add-rule]').innerHTML = `${icons.add}Add Rule`;
    root.querySelector('[data-discount-cancel]').textContent = readonly ? 'Close' : 'Cancel';
    renderRuleRows();
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('modal-open'); }
  function closeMenus() { root.querySelectorAll('.discount-row-menu').forEach((menu) => { menu.hidden = true; menu.parentElement.querySelector('[data-discount-menu]').setAttribute('aria-expanded', 'false'); }); }
  function showSpecifications(rule) {
    if (!rule) return;
    const names = [['Rule Title','ruleTitle'],['Applicable For','applicableFor'],['Category','category'],['Percentage Value','percentage'],['Weight','weight'],['Inclusion Type','inclusion'],['Service Category','serviceCategory'],['Groups / Sub Groups','groups'],['Items','items'],['Chapter','chapter'],['Block','block'],['Cost Center','costCenter'],['Sub Cost Center','subCostCenter'],['Diagnosis Chapter','diagnosisChapter'],['Diagnosis Block','diagnosisBlock'],['ICD-10 Code / Description','icd'],['Encounter Type','encounter'],['Department Name','department'],['Practitioner Specialty','specialty'],['Payer Type','payerType'],['Payers','payer'],['Policies','policy'],['Plans','plan'],['Network','network'],['Class','className'],['Gender','gender'],['Age Group Unit','ageUnit'],['From','ageFrom'],['To','ageTo']];
    root.querySelector('[data-discount-spec-subtitle]').textContent = rule.ruleTitle || 'Rule specifications';
    root.querySelector('[data-discount-spec-grid]').innerHTML = names.map(([label,key]) => `<div><span>${label}</span><strong>${esc(rule[key] || '—')}</strong></div>`).join('');
    specModal.hidden = false;
  }
  function closeSpec() { specModal.hidden = true; }

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-discount-filter]')) { query = event.target.value.toLowerCase().trim(); page = 1; renderList(); }
  });
  root.addEventListener('click', (event) => {
    const menuButton = event.target.closest('[data-discount-menu]');
    if (menuButton) { const menu = menuButton.nextElementSibling; const willOpen = menu.hidden; closeMenus(); menu.hidden = !willOpen; menuButton.setAttribute('aria-expanded', String(willOpen)); return; }
    const rowAction = event.target.closest('[data-discount-action]');
    if (rowAction) {
      const record = records.find((item) => item.id === rowAction.dataset.id); closeMenus();
      if (rowAction.dataset.discountAction === 'view') openModal('view', record);
      else if (rowAction.dataset.discountAction === 'edit') openModal('edit', record);
      else { record.active = !record.active; renderList(); showToast(`Discount ${record.active ? 'activated' : 'deactivated'} in this preview.`); }
      return;
    }
    if (event.target.closest('[data-discount-add]')) { openModal('add'); return; }
    if (event.target.closest('[data-discount-close], [data-discount-cancel]')) { closeModal(); return; }
    if (event.target.closest('[data-discount-spec-close]')) { closeSpec(); return; }
    if (event.target.closest('[data-discount-add-rule]')) {
      if (!form.reportValidity()) return;
      copyFormInto(draft);
      const rule = Object.fromEntries(fieldNames.map((name) => [name, draft[name] || '']));
      if (editingRuleIndex === null) draft.rules.push(rule);
      else draft.rules[editingRuleIndex] = rule;
      editingRuleIndex = null;
      root.querySelector('[data-discount-add-rule]').innerHTML = `${icons.add}Add Rule`;
      renderRuleRows();
      showToast('Rule updated in this discount preview.');
      return;
    }
    const editRule = event.target.closest('[data-discount-edit-rule]');
    if (editRule) {
      editingRuleIndex = Number(editRule.dataset.discountEditRule);
      const rule = draft.rules[editingRuleIndex];
      ['weight','ruleTitle','inclusion','serviceCategory','groups','items','chapter','block','costCenter','subCostCenter','diagnosisChapter','diagnosisBlock','icd','encounter','department','specialty','payerType','payer','policy','plan','network','className','gender','ageUnit','ageFrom','ageTo'].forEach((name) => { form.elements.namedItem(name).value = rule[name] || ''; });
      root.querySelector('[data-discount-add-rule]').innerHTML = `${icons.edit}Update Rule`;
      form.querySelector('[name="ruleTitle"]').focus();
      return;
    }
    const deleteRule = event.target.closest('[data-discount-delete-rule]');
    if (deleteRule) { draft.rules.splice(Number(deleteRule.dataset.discountDeleteRule), 1); renderRuleRows(); showToast('Rule removed from this preview.'); return; }
    const spec = event.target.closest('[data-discount-view-spec]');
    if (spec) { showSpecifications(draft.rules[Number(spec.dataset.discountViewSpec)]); return; }
    const pageButton = event.target.closest('[data-discount-page]');
    if (pageButton) { const pages = Math.max(1, Math.ceil(filtered().length / pageSize)); const next = { first: 1, previous: page - 1, next: page + 1, last: pages }[pageButton.dataset.discountPage]; page = Math.max(1, Math.min(pages, next)); renderList(); }
  });
  root.addEventListener('submit', (event) => {
    if (!event.target.matches('[data-discount-form]')) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    copyFormInto(draft);
    if (!draft.rules.length) draft.rules.push(Object.fromEntries(fieldNames.map((name) => [name, draft[name] || ''])));
    if (mode === 'edit') Object.assign(currentRecord, draft, { ruleRows: draft.rules.map((rule) => ({ ...rule })) });
    else records.unshift({ ...draft, id: `discount-${Date.now()}`, active: true, ruleRows: draft.rules.map((rule) => ({ ...rule })) });
    closeModal(); renderList(); showToast(mode === 'edit' ? 'Discount saved in this preview.' : 'Discount created in this preview.');
  });
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  specModal.addEventListener('click', (event) => { if (event.target === specModal) closeSpec(); });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) closeMenus(); });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (!specModal.hidden) closeSpec(); else if (!modal.hidden) closeModal(); } });
  renderList();
})();
