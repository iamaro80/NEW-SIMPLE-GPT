(() => {
  const grid = document.querySelector('[data-policies-grid]');
  const detailView = document.querySelector('[data-policy-details]');
  if (!grid || !detailView) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const policiesKey = `rcm-facility-policies:v1:${facilityId}`;
  const payersKey = `rcm-facility-payers:v2:${facilityId}`;
  const tpasKey = `rcm-facility-tpas:v1:${facilityId}`;
  const plansKey = `rcm-facility-plans:v1:${facilityId}`;
  const benefitsKey = `rcm-facility-benefits:v1:${facilityId}`;
  const pageSize = 6;
  const seed = [
    { id: 'policy-001', policyHolderName: 'Layan Al-Mutairi', payerId: 'payer-001', tpaId: 'TPA-001', policyNo: 'HZN-2026-1042', issueDate: '2025-12-15', startDate: '2026-01-01', endDate: '2026-12-31', planId: 'PLAN-2026-001', isIndependent: false, remarks: 'Comprehensive inpatient and specialist coverage.', status: 'Active' },
    { id: 'policy-002', policyHolderName: 'Omar Al-Qahtani', payerId: 'payer-002', tpaId: 'TPA-002', policyNo: 'HZN-2026-2087', issueDate: '2026-02-01', startDate: '2026-03-01', endDate: '2027-02-28', planId: 'PLAN-2026-002', isIndependent: false, remarks: 'Regional outpatient plan for employee dependants.', status: 'Draft' },
    { id: 'policy-003', policyHolderName: 'Maha Al-Dosari', payerId: 'payer-003', tpaId: '', policyNo: 'PEHF-2026-3116', issueDate: '2025-11-20', startDate: '2026-01-01', endDate: '2026-12-31', planId: 'PLAN-2026-003', isIndependent: true, remarks: 'Annual family plan.', status: 'Inactive' },
  ];
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 18-6-6 6-6M9 12h12"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const readArray = (key, fallback = []) => { try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(parsed) ? parsed : clone(fallback); } catch { return clone(fallback); } };
  let payers = readArray(payersKey);
  let tpas = readArray(tpasKey);
  let plans = readArray(plansKey);
  let benefits = readArray(benefitsKey);
  let policies;
  try {
    const saved = localStorage.getItem(policiesKey);
    policies = saved === null ? clone(seed) : JSON.parse(saved);
    if (!Array.isArray(policies)) policies = clone(seed);
    if (saved === null) localStorage.setItem(policiesKey, JSON.stringify(policies));
  } catch { policies = clone(seed); }

  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let returnFocus = null;
  let currentDetailId = null;
  let toastTimer;

  const payerById = (id) => payers.find((item) => item.id === id);
  const tpaById = (id) => tpas.find((item) => item.id === id);
  const planById = (id) => plans.find((item) => item.planId === id);
  const payerName = (id) => payerById(id)?.englishName || '—';
  const tpaName = (id) => { const tpa = tpaById(id); return tpa?.englishName || tpa?.provider || '—'; };
  const planName = (id) => planById(id)?.name || '—';
  const selectOptions = (items, valueFn, labelFn, prompt) => `<option value="">${esc(prompt)}</option>${items.map((item) => `<option value="${esc(valueFn(item))}">${esc(labelFn(item))}</option>`).join('')}`;
  const dateLabel = (value) => {
    if (!value) return '—';
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : esc(value);
  };
  const textField = (name, label, required = false, type = 'text', extra = '') => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><input name="${name}" type="${type}"${required ? ' required' : ''} ${extra}></label>`;
  const selectField = (name, label, prompt, required = false) => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><select name="${name}"${required ? ' required' : ''}><option value="">${esc(prompt)}</option></select></label>`;

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-policy-add>${icons.add}Add Policy</button></div><div class="branches-filter-grid policy-filter-grid" role="search" aria-label="Filter policies">
    <label class="facility-filter"><span>Plans</span><select data-policy-filter="planId"><option value="">All plans</option></select></label>
    <label class="facility-filter"><span>Payers</span><select data-policy-filter="payerId"><option value="">All payers</option></select></label>
    <label class="facility-filter"><span>Policy No</span><input type="search" data-policy-filter="policyNo" placeholder="Policy number"></label>
    <button class="button button-secondary policy-advanced-toggle" type="button" data-policy-advanced aria-expanded="false">Advanced Search <span aria-hidden="true">+</span></button>
    <div class="policy-advanced-fields" data-policy-advanced-fields hidden><label class="facility-filter"><span>TPA Name</span><select data-policy-filter="tpaId"><option value="">All TPAs</option></select></label><label class="facility-filter"><span>Policy Holder Name</span><input type="search" data-policy-filter="policyHolderName" placeholder="Policy holder name"></label></div>
    </div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table policies-table"><thead><tr><th>Payer</th><th>Policy No</th><th>Policy Holder Name</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead><tbody data-policy-rows></tbody></table></div><div class="facility-empty" data-policy-empty hidden>No policies match your filters.</div><footer class="facility-pagination"><span data-policy-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-policy-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-policy-page="previous" aria-label="Previous page">‹</button><span data-policy-page-label></span><button class="icon-button" type="button" data-policy-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-policy-page="last" aria-label="Last page">»</button></div></footer></div>`;

  const modal = document.createElement('div');
  modal.className = 'patient-modal-backdrop'; modal.id = 'policy-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal policy-modal" role="dialog" aria-modal="true" aria-labelledby="policy-modal-title" aria-describedby="policy-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">POLICY RECORD</p><h2 id="policy-modal-title">Add Policy</h2><p id="policy-modal-description">Enter policy details.</p></div><button type="button" class="icon-button" data-policy-close aria-label="Close dialog">×</button></header><form data-policy-form><div class="patient-modal-body policy-modal-body"><fieldset class="patient-form-section policy-section"><legend class="sr-only">Policy Information</legend><div class="facility-form-section-heading">Policy Information</div><div class="patient-form-grid policy-form-grid">
    ${textField('policyHolderName', 'Policy Holder Name', true)}${selectField('payerId', 'Payers', 'Select payer', true)}${selectField('tpaId', 'TPA Name', 'Select TPA')}${textField('policyNo', 'Policy No', true)}${textField('issueDate', 'Issue Date', false, 'date')}${textField('startDate', 'Start Date', true, 'date')}${textField('endDate', 'End Date', true, 'date')}${selectField('planId', 'Plans', 'Select plan', true)}<label class="form-check policy-checkbox"><input type="checkbox" name="isIndependent"><span>Is Independent</span></label><label class="form-field policy-remarks"><span>Remarks</span><textarea name="remarks" rows="3"></textarea></label>
    </div></fieldset></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-policy-cancel>Cancel</button><button type="button" class="button button-secondary" data-policy-draft>Create as Draft</button><button type="submit" class="button button-primary" data-policy-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);
  const termsModal = document.createElement('div');
  termsModal.className = 'patient-modal-backdrop'; termsModal.id = 'policy-terms-modal'; termsModal.hidden = true;
  termsModal.innerHTML = `<section class="patient-modal policy-terms-modal" role="dialog" aria-modal="true" aria-labelledby="policy-terms-title"><header class="patient-modal-header"><div><p class="eyebrow">BENEFIT COVERAGE</p><h2 id="policy-terms-title">Benefit Terms</h2><p data-policy-terms-description></p></div><button type="button" class="icon-button" data-policy-terms-close aria-label="Close dialog">×</button></header><div class="patient-modal-body policy-terms-body"><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table policy-terms-table"><thead><tr><th>Type</th><th>Network Category</th><th>Unit</th><th>Term</th><th>Value Type</th><th>Value</th></tr></thead><tbody data-policy-terms-rows></tbody></table></div><div class="facility-empty" data-policy-terms-empty hidden>No benefit terms available.</div></div></div><footer class="patient-modal-footer"><span></span><div><button type="button" class="button button-secondary" data-policy-terms-close>Close</button></div></footer></section>`;
  document.body.append(termsModal);

  const form = modal.querySelector('[data-policy-form]');
  const rows = grid.querySelector('[data-policy-rows]');
  const toast = document.querySelector('[data-facility-toast]');

  function persist() { try { localStorage.setItem(policiesKey, JSON.stringify(policies)); } catch { /* Continue with in-memory records if storage is unavailable. */ } }
  function notify(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); }
  function updateFilterOptions() {
    const planFilter = grid.querySelector('[data-policy-filter="planId"]'); const chosenPlan = planFilter.value;
    planFilter.innerHTML = selectOptions(plans, (item) => item.planId, (item) => `${item.planId} · ${item.name}`, 'All plans'); planFilter.value = chosenPlan;
    const payerFilter = grid.querySelector('[data-policy-filter="payerId"]'); const chosenPayer = payerFilter.value;
    payerFilter.innerHTML = selectOptions(payers, (item) => item.id, (item) => item.englishName, 'All payers'); payerFilter.value = chosenPayer;
    const tpaFilter = grid.querySelector('[data-policy-filter="tpaId"]'); const chosenTpa = tpaFilter.value;
    tpaFilter.innerHTML = selectOptions(tpas, (item) => item.id, (item) => item.englishName || item.provider, 'All TPAs'); tpaFilter.value = chosenTpa;
  }
  function updateFormOptions() {
    const selectedPayer = form.elements.payerId.value;
    const selectedTpa = form.elements.tpaId.value;
    const selectedPlan = form.elements.planId.value;
    form.elements.payerId.innerHTML = selectOptions(payers, (item) => item.id, (item) => item.englishName, 'Select payer');
    form.elements.tpaId.innerHTML = selectOptions(tpas, (item) => item.id, (item) => item.englishName || item.provider, 'Select TPA');
    form.elements.planId.innerHTML = selectOptions(plans, (item) => item.planId, (item) => `${item.planId} · ${item.name}`, 'Select plan');
    form.elements.payerId.value = selectedPayer; form.elements.tpaId.value = selectedTpa; form.elements.planId.value = selectedPlan;
  }
  function filteredRecords() {
    return policies.filter((policy) => Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (['planId', 'payerId', 'tpaId'].includes(key)) return policy[key] === value;
      return String(policy[key] || '').toLocaleLowerCase().includes(value);
    }));
  }
  function closeMenus() { grid.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; }); grid.querySelectorAll('[data-policy-row-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false')); }
  function renderGrid() {
    updateFilterOptions();
    const matched = filteredRecords();
    const pages = Math.max(1, Math.ceil(matched.length / pageSize)); page = Math.min(page, pages);
    const items = matched.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = items.map((policy) => `<tr><td>${esc(payerName(policy.payerId))}</td><td class="policy-number">${esc(policy.policyNo)}</td><td>${esc(policy.policyHolderName)}</td><td>${dateLabel(policy.startDate)}</td><td>${dateLabel(policy.endDate)}</td><td><span class="facility-status ${policy.status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${esc(policy.status)}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-policy-row-menu aria-label="Actions for ${esc(policy.policyNo)}" aria-haspopup="menu" aria-expanded="false" data-policy-id="${esc(policy.id)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-policy-action="view" data-policy-id="${esc(policy.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-policy-action="edit" data-policy-id="${esc(policy.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-policy-action="status" data-policy-id="${esc(policy.id)}">${icons.status}${policy.status === 'Active' ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-policy-empty]').hidden = matched.length > 0;
    grid.querySelector('[data-policy-count]').textContent = `Total Results: ${matched.length}`;
    grid.querySelector('[data-policy-page-label]').textContent = `Page ${matched.length ? page : 0} of ${matched.length ? pages : 0}`;
    grid.querySelectorAll('[data-policy-page]').forEach((button) => { button.disabled = !matched.length || (['first', 'previous'].includes(button.dataset.policyPage) ? page === 1 : page === pages); });
  }
  function setReadOnly(readOnly) {
    form.querySelectorAll('input, select, textarea').forEach((control) => { control.disabled = readOnly; });
    modal.querySelector('[data-policy-save]').hidden = readOnly;
    modal.querySelector('[data-policy-draft]').hidden = readOnly || mode !== 'new';
    modal.querySelector('[data-policy-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
  }
  function openModal(nextMode, policy = null, trigger = document.activeElement) {
    mode = nextMode; activeId = policy?.id || null; returnFocus = trigger; form.reset(); updateFormOptions();
    modal.querySelector('#policy-modal-title').textContent = nextMode === 'new' ? 'Add Policy' : nextMode === 'view' ? 'Policy Details' : 'Edit Policy';
    modal.querySelector('#policy-modal-description').textContent = nextMode === 'new' ? 'Enter policy details.' : nextMode === 'view' ? 'Review policy information.' : 'Update policy information.';
    modal.querySelector('[data-policy-save]').textContent = nextMode === 'new' ? 'Create' : 'Save changes';
    if (policy) {
      for (const [name, value] of Object.entries(policy)) {
        const control = form.elements.namedItem(name);
        if (control) { if (control.type === 'checkbox') control.checked = Boolean(value); else control.value = value ?? ''; }
      }
    }
    setReadOnly(nextMode === 'view'); modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-policy-close]').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); returnFocus?.focus?.(); }
  function createRecord(status) {
    const values = Object.fromEntries(['policyHolderName', 'payerId', 'tpaId', 'policyNo', 'issueDate', 'startDate', 'endDate', 'planId', 'remarks'].map((name) => [name, String(form.elements.namedItem(name).value ?? '').trim()]));
    values.isIndependent = form.elements.isIndependent.checked;
    if (values.endDate < values.startDate) { form.elements.endDate.setCustomValidity('End Date must be on or after Start Date.'); form.reportValidity(); form.elements.endDate.setCustomValidity(''); return; }
    if (mode === 'new') {
      const record = { ...values, id: `policy-${crypto.randomUUID()}`, status };
      policies.push(record); persist();
      grid.querySelectorAll('[data-policy-filter]').forEach((control) => { control.value = ''; }); filters = {}; page = Math.ceil(policies.length / pageSize);
      closeModal(); renderGrid(); notify(`${record.policyNo} was created ${status === 'Draft' ? 'as a draft' : 'successfully'}.`);
      return;
    }
    const record = policies.find((item) => item.id === activeId); if (!record) return;
    Object.assign(record, values); persist(); closeModal(); renderGrid();
    if (currentDetailId === record.id) renderPolicyDetails(record);
    notify(`${record.policyNo} was updated successfully.`);
  }
  function attachmentBenefitData(attachment) {
    if (attachment.source === 'catalog') return benefits.find((item) => (item.id || item.code) === attachment.benefitId) || attachment;
    return attachment;
  }
  function renderPolicyDetails(policy) {
    currentDetailId = policy.id;
    const plan = planById(policy.planId);
    const attachments = (plan?.attachedBenefits || []).map(attachmentBenefitData);
    detailView.innerHTML = `<div class="policy-detail-toolbar"><button class="button button-secondary" type="button" data-policy-back>${icons.back}Back</button><button class="button button-secondary" type="button" data-policy-detail-edit>${icons.edit}Edit Policy</button></div>
      <section class="policy-detail-card"><div class="policy-detail-card-heading"><h2>${esc(policy.policyNo)} · ${esc(policy.policyHolderName)}</h2><span class="facility-status ${policy.status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${esc(policy.status)}</span></div><dl class="policy-meta-grid">
      <div><dt>Payer</dt><dd>${esc(payerName(policy.payerId))}</dd></div><div><dt>TPA Name</dt><dd>${esc(policy.tpaId ? tpaName(policy.tpaId) : '—')}</dd></div><div><dt>Policy No</dt><dd>${esc(policy.policyNo)}</dd></div><div><dt>Policy Holder Name</dt><dd>${esc(policy.policyHolderName)}</dd></div><div><dt>Issue Date</dt><dd>${dateLabel(policy.issueDate)}</dd></div><div><dt>Start Date</dt><dd>${dateLabel(policy.startDate)}</dd></div><div><dt>End Date</dt><dd>${dateLabel(policy.endDate)}</dd></div><div><dt>Status</dt><dd>${esc(policy.status)}</dd></div></dl></section>
      <details class="policy-plan-accordion" open><summary><span>Plan Coverage · ${esc(plan?.name || 'Plan unavailable')}</span>${icons.chevron}</summary>${plan ? `<div class="policy-plan-content"><div class="policy-plan-meta"><div><span>Name</span><strong>${esc(plan.name)}</strong></div><div><span>Class</span><strong>${esc(plan.planClass || '—')}</strong></div><div><span>Network</span><strong>${esc(plan.network || '—')}</strong></div></div><h3>Plan Coverage</h3><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table policy-detail-table"><thead><tr><th>Type</th><th>Network Category</th><th>Unit</th><th>Term</th><th>Value Type</th><th>Value</th></tr></thead><tbody>${plan.coverageType || plan.networkCategory || plan.unit || plan.term || plan.valueType || plan.value ? `<tr><td>${esc(plan.coverageType || '—')}</td><td>${esc(plan.networkCategory || '—')}</td><td>${esc(plan.unit || '—')}</td><td>${esc(plan.term || '—')}</td><td>${esc(plan.valueType || '—')}</td><td>${esc(plan.value || '—')}</td></tr>` : '<tr><td class="policy-no-data" colspan="6">No Data</td></tr>'}</tbody></table></div></div><h3>Benefit Coverage</h3><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table policy-detail-table"><thead><tr><th>Benefits</th><th>Category</th><th>Exclusions</th><th>Benefit Terms</th></tr></thead><tbody>${attachments.length ? attachments.map((benefit, index) => `<tr><td>${esc(benefit.name || benefit.benefits || '—')}</td><td>${esc(benefit.category || '—')}</td><td>${String(benefit.inclusionType || '').toLocaleLowerCase().includes('exclusion') ? 'Yes' : 'No'}</td><td><button class="button button-ghost policy-term-trigger" type="button" data-policy-benefit-index="${index}">View Details</button></td></tr>`).join('') : '<tr><td class="policy-no-data" colspan="4">No Data</td></tr>'}</tbody></table></div></div></div>` : '<div class="facility-empty policy-plan-unavailable">The selected Plan could not be found.</div>'}</details>
      <section class="policy-detail-card policy-remarks-card"><h3>Remarks</h3><p>${esc(policy.remarks || '—')}</p></section>`;
    grid.hidden = true; detailView.hidden = false;
  }
  function openTerms(benefit, trigger) {
    termsModal._returnFocus = trigger;
    termsModal.querySelector('[data-policy-terms-description]').textContent = benefit.name || benefit.benefits || 'Benefit terms';
    const hasTerms = ['type', 'networkCategory', 'unit', 'term', 'valueType', 'value'].some((key) => benefit[key]);
    termsModal.querySelector('[data-policy-terms-rows]').innerHTML = hasTerms ? `<tr><td>${esc(benefit.type || '—')}</td><td>${esc(benefit.networkCategory || '—')}</td><td>${esc(benefit.unit || '—')}</td><td>${esc(benefit.term || '—')}</td><td>${esc(benefit.valueType || '—')}</td><td>${esc(benefit.value || '—')}</td></tr>` : '';
    termsModal.querySelector('[data-policy-terms-empty]').hidden = hasTerms;
    termsModal.hidden = false; document.body.classList.add('patient-modal-open'); termsModal.querySelector('[data-policy-terms-close]').focus();
  }
  function closeTerms() { termsModal.hidden = true; if (modal.hidden) document.body.classList.remove('patient-modal-open'); termsModal._returnFocus?.focus?.(); }
  function backToGrid() { currentDetailId = null; detailView.hidden = true; grid.hidden = false; }

  grid.querySelector('[data-policy-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.querySelector('[data-policy-advanced]').addEventListener('click', (event) => {
    const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
    event.currentTarget.setAttribute('aria-expanded', String(!expanded)); event.currentTarget.querySelector('span').textContent = expanded ? '+' : '−';
    grid.querySelector('[data-policy-advanced-fields]').hidden = expanded;
  });
  grid.querySelectorAll('[data-policy-filter]').forEach((control) => control.addEventListener(control.matches('select') ? 'change' : 'input', () => { filters[control.dataset.policyFilter] = control.matches('select') ? control.value : control.value.trim().toLocaleLowerCase(); page = 1; closeMenus(); renderGrid(); }));
  grid.querySelectorAll('[data-policy-page]').forEach((button) => button.addEventListener('click', () => {
    const matched = filteredRecords(); const pages = Math.max(1, Math.ceil(matched.length / pageSize));
    if (button.dataset.policyPage === 'first') page = 1; if (button.dataset.policyPage === 'previous') page = Math.max(1, page - 1); if (button.dataset.policyPage === 'next') page = Math.min(pages, page + 1); if (button.dataset.policyPage === 'last') page = pages; renderGrid();
  }));
  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-policy-row-menu]');
    if (trigger) { const menu = trigger.nextElementSibling; const open = !menu.hidden; closeMenus(); menu.hidden = open; trigger.setAttribute('aria-expanded', String(!open)); return; }
    const action = event.target.closest('[data-policy-action]'); if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const policy = policies.find((item) => item.id === action.dataset.policyId); if (!policy) return;
    const triggerButton = action.closest('.facility-row-action').querySelector('[data-policy-row-menu]'); closeMenus();
    if (action.dataset.policyAction === 'view') { renderPolicyDetails(policy); return; }
    if (action.dataset.policyAction === 'edit') { openModal('edit', policy, triggerButton); return; }
    policy.status = policy.status === 'Active' ? 'Inactive' : 'Active'; persist(); renderGrid(); notify(`${policy.policyNo} is now ${policy.status.toLocaleLowerCase()}.`);
  });
  form.elements.startDate.addEventListener('change', () => { form.elements.endDate.setCustomValidity(''); });
  form.elements.endDate.addEventListener('change', () => { form.elements.endDate.setCustomValidity(''); });
  form.addEventListener('submit', (event) => { event.preventDefault(); if (!form.reportValidity()) return; createRecord('Active'); });
  modal.querySelector('[data-policy-draft]').addEventListener('click', () => { if (!form.reportValidity()) return; createRecord('Draft'); });
  modal.querySelector('[data-policy-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-policy-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  detailView.addEventListener('click', (event) => {
    if (event.target.closest('[data-policy-back]')) { backToGrid(); return; }
    if (event.target.closest('[data-policy-detail-edit]')) { const record = policies.find((item) => item.id === currentDetailId); if (record) openModal('edit', record, event.target.closest('[data-policy-detail-edit]')); return; }
    const trigger = event.target.closest('[data-policy-benefit-index]'); if (!trigger) return;
    const record = policies.find((item) => item.id === currentDetailId); const plan = record && planById(record.planId); const attachment = plan?.attachedBenefits?.[Number(trigger.dataset.policyBenefitIndex)]; if (attachment) openTerms(attachmentBenefitData(attachment), trigger);
  });
  termsModal.querySelectorAll('[data-policy-terms-close]').forEach((button) => button.addEventListener('click', closeTerms));
  termsModal.addEventListener('click', (event) => { if (event.target === termsModal) closeTerms(); });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!termsModal.hidden) closeTerms(); else if (!modal.hidden) closeModal(); else if (!detailView.hidden) backToGrid();
  });
  renderGrid();
})();
