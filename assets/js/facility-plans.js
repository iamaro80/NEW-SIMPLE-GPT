(() => {
  const grid = document.querySelector('[data-plans-grid]');
  if (!grid) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const plansKey = `rcm-facility-plans:v1:${facilityId}`;
  const payersKey = `rcm-facility-payers:v2:${facilityId}`;
  const benefitsKey = `rcm-facility-benefits:v1:${facilityId}`;
  const pageSize = 6;
  const fields = ['planId', 'name', 'planClass', 'network', 'policyNumber', 'isGeneral', 'generalPlanInclusionType', 'payerId', 'contractType', 'coverageType', 'networkCategory', 'unit', 'valueType', 'value', 'term'];
  const benefitFields = ['inclusionType', 'benefits', 'category', 'code', 'name', 'description', 'type', 'networkCategory', 'unit', 'valueType', 'value', 'term', 'weight', 'ruleTitle', 'serviceCategory', 'serviceGroups', 'items', 'serviceChapter', 'serviceBlock', 'costCenter', 'subCostCenter', 'diagnosisChapter', 'diagnosisBlock', 'icd10', 'encounterType', 'departmentName', 'practitionerSpecialty', 'gender', 'ageUnit', 'ageFrom', 'ageTo'];
  const seed = [
    { planId: 'PLAN-2026-001', name: 'Plan 1', planClass: 'Class A', network: 'Network 1', policyNumber: 'POL-2026-041', isGeneral: true, generalPlanInclusionType: 'Type A', payerId: 'payer-001', contractType: 'Insurance Contract', coverageType: 'Inpatient', networkCategory: 'Premier', unit: 'Per admission', valueType: 'Annual limit', value: '150000', term: 'Plan coverage terms 1', attachedBenefits: [], active: true },
    { planId: 'PLAN-2026-002', name: 'Plan 2', planClass: 'Class B', network: 'Network 2', policyNumber: 'POL-2026-052', isGeneral: false, generalPlanInclusionType: '', payerId: 'payer-002', contractType: 'Insurance Contract', coverageType: 'Outpatient', networkCategory: 'Standard', unit: 'Per visit', valueType: 'Visit limit', value: '24', term: 'Plan coverage terms 2', attachedBenefits: [], active: true },
    { planId: 'PLAN-2026-003', name: 'Plan 3', planClass: 'Class C', network: 'Network 3', policyNumber: 'POL-2026-063', isGeneral: true, generalPlanInclusionType: 'Type B', payerId: 'payer-003', contractType: 'No Contract', coverageType: 'Inpatient and Outpatient', networkCategory: 'National', unit: 'Per member', valueType: 'Annual limit', value: '85000', term: 'Plan coverage terms 3', attachedBenefits: [], active: false },
  ];
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const readArray = (key, fallback = []) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(value) ? value : fallback; } catch { return fallback; } };
  let payers = readArray(payersKey);
  let catalogBenefits = readArray(benefitsKey);
  let plans;
  try {
    const saved = localStorage.getItem(plansKey);
    plans = saved === null ? clone(seed) : JSON.parse(saved);
    if (!Array.isArray(plans)) plans = clone(seed);
    if (saved === null) localStorage.setItem(plansKey, JSON.stringify(plans));
  } catch { plans = clone(seed); }
  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let returnFocus = null;
  let toastTimer;

  const payerById = (id) => payers.find((payer) => payer.id === id);
  const payerName = (id) => payerById(id)?.englishName || '—';
  const optionMarkup = (values, prompt, selected = '') => `<option value="">${esc(prompt)}</option>${values.map((value) => `<option value="${esc(value)}"${String(value) === String(selected) ? ' selected' : ''}>${esc(value)}</option>`).join('')}`;
  const field = (name, label, required = false, type = 'text', attrs = '') => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><input name="${name}" type="${type}"${required ? ' required' : ''} ${attrs}></label>`;
  const selectField = (name, label, options, required = false, prompt = 'Select') => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><select name="${name}"${required ? ' required' : ''}>${optionMarkup(options, prompt)}</select></label>`;
  const filterInput = (name, label, placeholder) => `<label class="facility-filter"><span>${label}</span><input type="search" data-plan-filter="${name}" placeholder="${placeholder}"></label>`;

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-plan-add>${icons.add}Add Plan</button></div><div class="branches-filter-grid plan-filter-grid" role="search" aria-label="Filter plans">
    ${filterInput('name', 'Name', 'Filter by name')}${filterInput('planClass', 'Class', 'Filter by class')}${filterInput('network', 'Network', 'Filter network')}${filterInput('planId', 'Plan ID', 'Search plan ID')}${filterInput('policyNumber', 'Policy Number', 'Search policy number')}<label class="facility-filter"><span>Payer</span><select data-plan-filter="payerId"><option value="">All payers</option></select></label>
    </div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table plans-table"><thead><tr><th>Plan ID</th><th>Name</th><th>Class</th><th>Network</th><th>Policy Number</th><th>Payer</th><th>Status</th><th>Actions</th></tr></thead><tbody data-plan-rows></tbody></table></div><div class="facility-empty" data-plan-empty hidden>No plans match your filters.</div><footer class="facility-pagination"><span data-plan-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-plan-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-plan-page="previous" aria-label="Previous page">‹</button><span data-plan-page-label></span><button class="icon-button" type="button" data-plan-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-plan-page="last" aria-label="Last page">»</button></div></footer></div>`;
  const modal = document.createElement('div');
  modal.className = 'patient-modal-backdrop'; modal.id = 'plan-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal plan-modal" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title" aria-describedby="plan-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">INSURANCE PLAN</p><h2 id="plan-modal-title">Add Plan</h2><p id="plan-modal-description">Enter plan details and coverage terms.</p></div><button type="button" class="icon-button" data-plan-close aria-label="Close dialog">×</button></header><form data-plan-form><div class="patient-modal-body plan-modal-body">
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Plan Information</legend><div class="facility-form-section-heading">Plan Information</div><div class="patient-form-grid plan-form-grid">
      <label class="form-field"><span>Plan ID</span><input name="planId" readonly required></label>${field('name', 'Name', true, 'text', 'maxlength="100"')}${field('planClass', 'Class', true, 'text', 'maxlength="100"')}${field('network', 'Network', true, 'text', 'maxlength="100"')}${field('policyNumber', 'Policy Number')}<label class="form-field"><span>Payer</span><select name="payerId"><option value="">Select payer</option></select></label><label class="form-field"><span>Contract Type <b>*</b></span><input name="contractType" readonly required></label><label class="form-check plan-checkbox"><input type="checkbox" name="isGeneral"><span>Is General</span></label>${selectField('generalPlanInclusionType', 'General Plan Inclusion Type', ['Type A', 'Type B'], false, 'Select inclusion type')}
    </div></fieldset>
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Plan Coverage</legend><div class="facility-form-section-heading">Plan Coverage</div><div class="patient-form-grid plan-form-grid">${field('coverageType', 'Type', true)}${field('networkCategory', 'Network Category')}${field('unit', 'Unit', true)}${field('valueType', 'Value Type', true)}${field('value', 'Value', true)}${field('term', 'Term')}</div></fieldset>
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Benefit Coverage</legend><div class="facility-form-section-heading">Benefit Coverage</div><div class="plan-benefit-tools"><label class="facility-filter"><span>Attach Existing Benefit</span><select data-plan-existing-benefit><option value="">Select active benefit</option></select></label><button type="button" class="button button-secondary" data-plan-attach-existing>Attach Benefit</button><button type="button" class="button button-primary" data-plan-add-benefit>${icons.add}Add New Benefit</button></div><div class="facility-table-scroll plan-benefit-scroll"><table class="facility-table plan-benefit-table"><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Source</th><th>Action</th></tr></thead><tbody data-plan-benefit-rows></tbody></table></div><div class="facility-empty plan-benefit-empty" data-plan-benefit-empty>No benefits attached.</div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-plan-cancel>Cancel</button><button type="submit" class="button button-primary" data-plan-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);
  const benefitModal = document.createElement('div');
  benefitModal.className = 'patient-modal-backdrop'; benefitModal.id = 'plan-benefit-modal'; benefitModal.hidden = true;
  benefitModal.innerHTML = `<section class="patient-modal plan-benefit-modal" role="dialog" aria-modal="true" aria-labelledby="plan-benefit-title"><header class="patient-modal-header"><div><p class="eyebrow">PLAN BENEFIT</p><h2 id="plan-benefit-title">Add Benefit</h2><p>Create a benefit rule attached to this plan.</p></div><button type="button" class="icon-button" data-plan-benefit-close aria-label="Close dialog">×</button></header><form data-plan-benefit-form><div class="patient-modal-body plan-benefit-modal-body">
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Basic Information</legend><div class="facility-form-section-heading">Basic Information</div><div class="patient-form-grid plan-form-grid">${field('inclusionType', 'Inclusion Type', true)}${field('benefits', 'Benefits')}${field('category', 'Category', true)}<label class="form-field"><span>Code <b>*</b></span><input name="code" readonly required></label>${field('name', 'Name', true)}${field('description', 'Description', true)}</div></fieldset>
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Terms</legend><div class="facility-form-section-heading">Terms</div><div class="patient-form-grid plan-form-grid">${field('type', 'Type', true)}${field('networkCategory', 'Network Category')}${field('unit', 'Unit', true)}${field('valueType', 'Value Type', true)}${field('value', 'Value', true)}${field('term', 'Term')}</div></fieldset>
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Benefit Specifications</legend><div class="facility-form-section-heading">Benefit Specifications</div><div class="patient-form-grid plan-form-grid"><label class="form-field"><span>Weight</span><input name="weight" type="number" value="0" step="any"></label>${field('ruleTitle', 'Rule Title', true)}</div></fieldset>
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Service Catalogs</legend><div class="facility-form-section-heading">Service Catalogs</div><div class="patient-form-grid plan-form-grid">${field('serviceCategory', 'Category')}${field('serviceGroups', 'Groups / Sub Groups')}${field('items', 'Items')}${field('serviceChapter', 'Chapter')}${field('serviceBlock', 'Block')}${field('costCenter', 'Cost Center')}${field('subCostCenter', 'Sub Cost Center')}</div></fieldset>
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Diagnosis</legend><div class="facility-form-section-heading">Diagnosis</div><div class="patient-form-grid plan-form-grid">${field('diagnosisChapter', 'Chapter')}${field('diagnosisBlock', 'Block')}${field('icd10', 'ICD-10 Code/Description', true)}</div></fieldset>
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Medical Settings</legend><div class="facility-form-section-heading">Medical Settings</div><div class="patient-form-grid plan-form-grid">${field('encounterType', 'Encounter Type')}${field('departmentName', 'Department Name')}${field('practitionerSpecialty', 'Practitioner Specialty')}</div></fieldset>
    <fieldset class="patient-form-section plan-section"><legend class="sr-only">Patients &amp; Age Group</legend><div class="facility-form-section-heading">Patients &amp; Age Group</div><div class="patient-form-grid plan-form-grid">${field('gender', 'Gender')}${selectField('ageUnit', 'Unit', ['Month', 'Years'], false, 'Select unit')}<label class="form-field"><span>From</span><input name="ageFrom" type="number" min="0"></label><label class="form-field"><span>To</span><input name="ageTo" type="number" min="0"></label></div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-plan-benefit-cancel>Cancel</button><button type="submit" class="button button-primary">Add Benefit</button></div></footer></form></section>`;
  document.body.append(benefitModal);

  const form = modal.querySelector('[data-plan-form]');
  const benefitForm = benefitModal.querySelector('[data-plan-benefit-form]');
  const rows = grid.querySelector('[data-plan-rows]');
  const toast = document.querySelector('[data-facility-toast]');
  let draftBenefits = [];

  function persist() { try { localStorage.setItem(plansKey, JSON.stringify(plans)); } catch { /* The page remains usable for this session. */ } }
  function toastMessage(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); }
  function allBenefitCodes() {
    const catalog = catalogBenefits.map((benefit) => benefit.code || benefit.id || '');
    const attached = [...plans.flatMap((plan) => (plan.attachedBenefits || []).map((benefit) => benefit.code || '')), ...draftBenefits.map((benefit) => benefit.code || '')];
    return [...catalog, ...attached];
  }
  function nextSequence(prefix, used) {
    const max = used.reduce((number, value) => {
      const suffix = String(value || '').startsWith(prefix) ? String(value).slice(prefix.length) : '';
      return /^\d+$/.test(suffix) ? Math.max(number, Number(suffix)) : number;
    }, 0);
    return max + 1;
  }
  function nextPlanId() { return `PLAN-2026-${String(nextSequence('PLAN-2026-', plans.map((plan) => plan.planId))).padStart(3, '0')}`; }
  function nextBenefitCode() { return `BEN-2026-${String(nextSequence('BEN-2026-', allBenefitCodes())).padStart(3, '0')}`; }
  function updatePayerSelects() {
    const activePayers = payers;
    const filter = grid.querySelector('[data-plan-filter="payerId"]'); const selectedFilter = filter.value;
    filter.innerHTML = `<option value="">All payers</option>${activePayers.map((payer) => `<option value="${esc(payer.id)}">${esc(payer.englishName)}</option>`).join('')}`; filter.value = selectedFilter;
    const payerSelect = form.elements.payerId; const selected = payerSelect.value;
    payerSelect.innerHTML = `<option value="">Select payer</option>${activePayers.map((payer) => `<option value="${esc(payer.id)}">${esc(payer.englishName)}</option>`).join('')}`; payerSelect.value = selected;
  }
  function updateExistingBenefitOptions() {
    catalogBenefits = readArray(benefitsKey);
    const select = modal.querySelector('[data-plan-existing-benefit]');
    const selected = select.value;
    const attachedIds = new Set(draftBenefits.filter((item) => item.source === 'catalog').map((item) => item.benefitId));
    const options = catalogBenefits.filter((benefit) => benefit.active && !attachedIds.has(benefit.id || benefit.code));
    select.innerHTML = `<option value="">Select active benefit</option>${options.map((benefit) => `<option value="${esc(benefit.id || benefit.code)}">${esc(benefit.code || benefit.id)} · ${esc(benefit.name)}</option>`).join('')}`;
    if (options.some((item) => (item.id || item.code) === selected)) select.value = selected;
  }
  function filteredPlans() {
    return plans.filter((plan) => Object.entries(filters).every(([key, query]) => {
      if (!query) return true;
      if (key === 'payerId') return plan.payerId === query;
      const value = key === 'name' ? plan.name : key === 'planClass' ? plan.planClass : key === 'network' ? plan.network : key === 'planId' ? plan.planId : plan.policyNumber;
      return String(value || '').toLocaleLowerCase().includes(query);
    }));
  }
  function renderAttachedBenefits() {
    const tbody = modal.querySelector('[data-plan-benefit-rows]');
    tbody.innerHTML = draftBenefits.map((item, index) => `<tr><td>${esc(item.code || '—')}</td><td>${esc(item.name || '—')}</td><td>${esc(item.category || '—')}</td><td>${item.source === 'catalog' ? 'Benefits catalog' : 'Plan benefit'}</td><td><button class="button button-ghost plan-unlink" type="button" data-plan-unlink="${index}">Remove</button></td></tr>`).join('');
    modal.querySelector('[data-plan-benefit-empty]').hidden = draftBenefits.length > 0;
    updateExistingBenefitOptions();
  }
  function closeMenus() { grid.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; }); grid.querySelectorAll('[data-plan-row-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false')); }
  function render() {
    updatePayerSelects();
    const matched = filteredPlans();
    const pages = Math.max(1, Math.ceil(matched.length / pageSize)); page = Math.min(page, pages);
    const items = matched.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = items.map((plan) => `<tr><td class="plan-id">${esc(plan.planId)}</td><td><span class="facility-name-en">${esc(plan.name)}</span></td><td>${esc(plan.planClass)}</td><td>${esc(plan.network)}</td><td>${esc(plan.policyNumber || '—')}</td><td>${esc(payerName(plan.payerId))}</td><td><span class="facility-status ${plan.active ? 'is-active' : 'is-inactive'}"><span></span>${plan.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-plan-row-menu aria-label="Actions for ${esc(plan.name)}" aria-haspopup="menu" aria-expanded="false" data-plan-id="${esc(plan.planId)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-plan-action="view" data-plan-id="${esc(plan.planId)}">${icons.eye}View</button><button type="button" role="menuitem" data-plan-action="edit" data-plan-id="${esc(plan.planId)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-plan-action="status" data-plan-id="${esc(plan.planId)}">${icons.status}${plan.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-plan-empty]').hidden = matched.length > 0;
    grid.querySelector('[data-plan-count]').textContent = `Total Results: ${matched.length}`;
    grid.querySelector('[data-plan-page-label]').textContent = `Page ${matched.length ? page : 0} of ${matched.length ? pages : 0}`;
    grid.querySelectorAll('[data-plan-page]').forEach((button) => { button.disabled = !matched.length || (['first', 'previous'].includes(button.dataset.planPage) ? page === 1 : page === pages); });
  }
  function setReadOnly(readOnly) {
    form.querySelectorAll('input, select, textarea').forEach((control) => {
      if (control.name === 'planId' || control.name === 'contractType') return;
      control.disabled = readOnly;
    });
    modal.querySelectorAll('[data-plan-existing-benefit], [data-plan-attach-existing], [data-plan-add-benefit], [data-plan-benefit-rows] button').forEach((control) => { control.disabled = readOnly; });
    modal.querySelector('[data-plan-save]').hidden = readOnly;
    modal.querySelector('[data-plan-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
  }
  function openModal(nextMode, plan = null, trigger = document.activeElement) {
    mode = nextMode; activeId = plan?.planId || null; returnFocus = trigger; form.reset(); setReadOnly(false);
    draftBenefits = clone(plan?.attachedBenefits || []);
    modal.querySelector('#plan-modal-title').textContent = nextMode === 'new' ? 'Add Plan' : nextMode === 'view' ? 'Plan Details' : 'Edit Plan';
    modal.querySelector('#plan-modal-description').textContent = nextMode === 'new' ? 'Enter plan details and coverage terms.' : nextMode === 'view' ? 'Review plan details and attached benefits.' : 'Update plan details and coverage terms.';
    modal.querySelector('[data-plan-save]').textContent = nextMode === 'new' ? 'Create' : 'Save changes';
    updatePayerSelects();
    if (plan) fields.forEach((name) => { const control = form.elements.namedItem(name); if (control) { if (control.type === 'checkbox') control.checked = Boolean(plan[name]); else control.value = plan[name] ?? ''; } });
    else { form.elements.planId.value = nextPlanId(); form.elements.contractType.value = 'Insurance Contract'; }
    renderAttachedBenefits(); setReadOnly(nextMode === 'view');
    modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-plan-close]').focus();
  }
  function closeModal() { modal.hidden = true; if (benefitModal && !benefitModal.hidden) closeBenefitModal(); document.body.classList.remove('patient-modal-open'); returnFocus?.focus?.(); }
  function openBenefitModal() {
    benefitForm.reset(); benefitForm.elements.code.value = nextBenefitCode();
    benefitForm.elements.inclusionType.value = 'Inclusion'; benefitForm.elements.weight.value = '0'; benefitForm.elements.ageUnit.value = 'Years';
    benefitModal.hidden = false; benefitModal.querySelector('[data-plan-benefit-close]').focus();
  }
  function closeBenefitModal() { benefitModal.hidden = true; modal.querySelector('[data-plan-add-benefit]').focus(); }
  function readBenefit() {
    const values = Object.fromEntries(benefitFields.map((name) => [name, String(benefitForm.elements.namedItem(name)?.value ?? '').trim()]));
    return { ...values, id: values.code, source: 'plan' };
  }
  function getPlanValues() {
    const values = Object.fromEntries(fields.map((name) => [name, name === 'isGeneral' ? form.elements[name].checked : String(form.elements[name].value ?? '').trim()]));
    return { ...values, attachedBenefits: clone(draftBenefits) };
  }
  function selectedPayerContract() {
    const payer = payerById(form.elements.payerId.value);
    form.elements.contractType.value = payer ? (payer.allowedContract ? 'Insurance Contract' : 'No Contract') : 'Insurance Contract';
  }

  grid.querySelector('[data-plan-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.querySelectorAll('[data-plan-filter]').forEach((control) => control.addEventListener(control.matches('select') ? 'change' : 'input', () => { filters[control.dataset.planFilter] = control.matches('select') ? control.value : control.value.trim().toLocaleLowerCase(); page = 1; closeMenus(); render(); }));
  grid.querySelectorAll('[data-plan-page]').forEach((button) => button.addEventListener('click', () => {
    const matched = filteredPlans();
    const pages = Math.max(1, Math.ceil(matched.length / pageSize));
    if (button.dataset.planPage === 'first') page = 1; if (button.dataset.planPage === 'previous') page = Math.max(1, page - 1); if (button.dataset.planPage === 'next') page = Math.min(pages, page + 1); if (button.dataset.planPage === 'last') page = pages; render();
  }));
  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-plan-row-menu]');
    if (trigger) { const menu = trigger.nextElementSibling; const open = !menu.hidden; closeMenus(); menu.hidden = open; trigger.setAttribute('aria-expanded', String(!open)); return; }
    const action = event.target.closest('[data-plan-action]'); if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const plan = plans.find((item) => item.planId === action.dataset.planId); if (!plan) return;
    const triggerButton = action.closest('.facility-row-action').querySelector('[data-plan-row-menu]'); closeMenus();
    if (action.dataset.planAction === 'view' || action.dataset.planAction === 'edit') { openModal(action.dataset.planAction, plan, triggerButton); return; }
    plan.active = !plan.active; persist(); render(); toastMessage(`${plan.name} is now ${plan.active ? 'active' : 'inactive'}.`);
  });
  modal.querySelector('[data-plan-existing-benefit]').addEventListener('change', () => {});
  modal.querySelector('[data-plan-attach-existing]').addEventListener('click', () => {
    const id = modal.querySelector('[data-plan-existing-benefit]').value; const benefit = catalogBenefits.find((item) => (item.id || item.code) === id);
    if (!benefit) return;
    draftBenefits.push({ source: 'catalog', benefitId: benefit.id || benefit.code, code: benefit.code || benefit.id, name: benefit.name, category: benefit.category || '' }); renderAttachedBenefits();
  });
  modal.querySelector('[data-plan-benefit-rows]').addEventListener('click', (event) => { const button = event.target.closest('[data-plan-unlink]'); if (!button) return; draftBenefits.splice(Number(button.dataset.planUnlink), 1); renderAttachedBenefits(); });
  modal.querySelector('[data-plan-add-benefit]').addEventListener('click', openBenefitModal);
  form.elements.payerId.addEventListener('change', selectedPayerContract);
  benefitForm.addEventListener('submit', (event) => {
    event.preventDefault(); if (!benefitForm.reportValidity()) return;
    const benefit = readBenefit(); draftBenefits.push(benefit); renderAttachedBenefits(); closeBenefitModal();
  });
  benefitModal.querySelector('[data-plan-benefit-close]').addEventListener('click', closeBenefitModal);
  benefitModal.querySelector('[data-plan-benefit-cancel]').addEventListener('click', closeBenefitModal);
  modal.querySelector('[data-plan-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-plan-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  benefitModal.addEventListener('click', (event) => { if (event.target === benefitModal) closeBenefitModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !benefitModal.hidden) closeBenefitModal(); else if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault(); if (!form.reportValidity()) return;
    const values = getPlanValues();
    if (mode === 'new') { plans.push({ ...values, active: true }); persist(); grid.querySelectorAll('[data-plan-filter]').forEach((control) => { control.value = ''; }); filters = {}; page = Math.ceil(plans.length / pageSize); closeModal(); render(); toastMessage(`${values.name} was created successfully.`); }
    else { const plan = plans.find((item) => item.planId === activeId); if (!plan) return; Object.assign(plan, values); persist(); closeModal(); render(); toastMessage(`${plan.name} was updated successfully.`); }
  });
  render();
})();
