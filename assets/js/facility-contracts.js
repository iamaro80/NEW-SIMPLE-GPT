(() => {
  const grid = document.querySelector('[data-contracts-grid]');
  const detailView = document.querySelector('[data-contract-details]');
  if (!grid || !detailView) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const key = `rcm-facility-contracts:v1:${facilityId}`;
  const payerKey = `rcm-facility-payers:v2:${facilityId}`;
  const planKey = `rcm-facility-plans:v1:${facilityId}`;
  const policyKey = `rcm-facility-policies:v1:${facilityId}`;
  const pageSize = 6;
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 18-6-6 6-6M9 12h12"/></svg>',
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const readArray = (storageKey) => { try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const payers = readArray(payerKey);
  const plans = readArray(planKey);
  const policies = readArray(policyKey);
  const payerName = (id) => payers.find((payer) => payer.id === id)?.englishName || '';
  const contractTypeFor = (id) => { const payer = payers.find((item) => item.id === id); return payer ? (payer.allowedContract ? 'Insurance Contract' : 'No Contract') : ''; };
  const linkedLabels = (records, field, payerId) => records.filter((item) => item.payerId === payerId).map((item) => item[field]).filter(Boolean).join(', ');
  const seed = [
    { id: 'contract-001', name: 'Contract 1', code: 'OAS-INS-01', payerId: 'payer-001', payerLabel: 'Payer 1', contractType: 'Insurance Contract', startDate: '2026-01-01', endDate: '2026-12-31', premiumBillingFrequency: 'Monthly', encounterType: 'Inpatient', nationality: 'Saudi', referralDiscount: false, masterPricingFallback: true, dedicatedAccount: true, priceLists: [{ id: 'pl-001', name: 'Price List 1', startDate: '2026-01-01', endDate: '' }], discounts: [{ id: 'dc-001', name: 'Discount 1', startDate: '2026-01-01', endDate: '' }], status: 'Active' },
    { id: 'contract-002', name: 'Contract 2', code: 'HCT-OP-02', payerId: 'payer-002', payerLabel: 'Payer 2', contractType: 'Insurance Contract', startDate: '2026-03-01', endDate: '2027-02-28', premiumBillingFrequency: 'Monthly', encounterType: 'Outpatient', nationality: 'Non Saudi', referralDiscount: true, masterPricingFallback: false, dedicatedAccount: false, priceLists: [{ id: 'pl-002', name: 'Price List 2', startDate: '2026-03-01', endDate: '' }], discounts: [], status: 'Active' },
    { id: 'contract-003', name: 'Contract 3', code: 'SIG-EH-03', payerId: 'payer-005', payerLabel: 'Payer 5', contractType: 'Insurance Contract', startDate: '2026-01-01', endDate: '2026-12-31', premiumBillingFrequency: 'Monthly', encounterType: 'Inpatient and Outpatient', nationality: '', referralDiscount: false, masterPricingFallback: true, dedicatedAccount: false, priceLists: [], discounts: [{ id: 'dc-002', name: 'Discount 2', startDate: '2026-01-01', endDate: '' }], status: 'Inactive' },
  ];
  let contracts;
  try {
    const saved = localStorage.getItem(key);
    contracts = saved === null ? clone(seed) : JSON.parse(saved);
    if (!Array.isArray(contracts)) contracts = clone(seed);
    if (saved === null) localStorage.setItem(key, JSON.stringify(contracts));
  } catch { contracts = clone(seed); }
  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let currentDetailId = null;
  let returnFocus = null;
  let priceRows = [];
  let discountRows = [];
  let toastTimer;

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-contract-add>${icons.add}Add Contract</button></div><div class="branches-filter-grid contract-filter-grid" role="search" aria-label="Filter contracts">
    <label class="facility-filter"><span>Name</span><input type="search" data-contract-filter="name" placeholder="Enter contract name..."></label>
    <label class="facility-filter"><span>Code</span><input type="search" data-contract-filter="code" placeholder="Enter code..."></label>
    <label class="facility-filter"><span>Start Date</span><input type="date" data-contract-filter="startDate"></label>
    <label class="facility-filter"><span>End Date</span><input type="date" data-contract-filter="endDate"></label>
    </div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table contracts-table"><thead><tr><th>Name</th><th>Code</th><th>Start Date</th><th>End Date</th><th>Payer</th><th>Contract Type</th><th>Status</th><th>Actions</th></tr></thead><tbody data-contract-rows></tbody></table></div><div class="facility-empty" data-contract-empty hidden>No contracts match your filters.</div><footer class="facility-pagination"><span data-contract-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-contract-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-contract-page="previous" aria-label="Previous page">‹</button><span data-contract-page-label></span><button class="icon-button" type="button" data-contract-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-contract-page="last" aria-label="Last page">»</button></div></footer></div>`;

  const modal = document.createElement('div');
  modal.className = 'patient-modal-backdrop'; modal.id = 'contract-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal contract-modal" role="dialog" aria-modal="true" aria-labelledby="contract-modal-title" aria-describedby="contract-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">CONTRACT RECORD</p><h2 id="contract-modal-title">Add Contract</h2><p id="contract-modal-description">Enter contract information.</p></div><button type="button" class="icon-button" data-contract-close aria-label="Close dialog">×</button></header><form data-contract-form><div class="patient-modal-body contract-modal-body">
    <fieldset class="patient-form-section contract-section"><legend class="sr-only">General Information</legend><div class="facility-form-section-heading">General Information</div><div class="patient-form-grid contract-form-grid">
      <label class="form-field"><span>Payers <b>*</b></span><select name="payerId" required><option value="">Select payer</option>${payers.map((payer) => `<option value="${esc(payer.id)}">${esc(payer.englishName)}</option>`).join('')}</select></label>
      <label class="form-field"><span>Contract Type <b>*</b></span><input name="contractType" readonly disabled required></label>
      <label class="form-field"><span>Name <b>*</b></span><input name="name" required maxlength="100"></label>
      <label class="form-field"><span>Code</span><input name="code" maxlength="15"></label>
      <label class="form-field"><span>Start Date</span><input name="startDate" type="date"></label>
      <label class="form-field"><span>End Date</span><input name="endDate" type="date" disabled></label>
      <label class="form-field"><span>Policies</span><input name="policiesLabel" readonly disabled></label>
      <label class="form-field"><span>Plans</span><input name="plansLabel" readonly disabled></label>
      <label class="form-field"><span>Network</span><input name="networkLabel" readonly disabled></label>
      <label class="form-field"><span>Class</span><input name="classLabel" readonly disabled></label>
      <label class="form-field"><span>Premium Billing Frequency</span><input name="premiumBillingFrequency" value="Monthly" readonly disabled></label>
      <label class="form-field"><span>Encounter Type</span><input name="encounterType"></label>
      <label class="form-field"><span>Nationality</span><select name="nationality"><option value="">Select</option><option>Saudi</option><option>Non Saudi</option></select></label>
      <label class="form-check contract-check"><input type="checkbox" name="referralDiscount"><span>Apply discount for referral cases</span></label>
      <label class="form-check contract-check"><input type="checkbox" name="masterPricingFallback"><span>Apply Master Pricing Fallback</span></label>
      <label class="form-check contract-check"><input type="checkbox" name="dedicatedAccount"><span>Create dedicated account for this contract</span></label>
    </div></fieldset>
    <fieldset class="patient-form-section contract-section"><legend class="sr-only">Price List</legend><div class="facility-form-section-heading">Price List</div><div class="contract-association-editor"><label class="form-field"><span>Price List <b>*</b></span><input data-contract-association-name="price" placeholder="Enter price list name"></label><label class="form-field"><span>Start Date</span><input type="date" data-contract-association-start="price"></label><label class="form-field"><span>End Date</span><input type="date" data-contract-association-end="price"></label><button class="button button-secondary" type="button" data-contract-association-add="price" aria-label="Add price list">${icons.add}Add</button></div><div class="facility-table-scroll contract-association-table-wrap"><table class="facility-table contract-association-table"><thead><tr><th>Price List</th><th>Start Date</th><th>End Date</th><th>Actions</th></tr></thead><tbody data-contract-association-rows="price"></tbody></table></div><div class="facility-empty contract-association-empty" data-contract-association-empty="price" hidden>No price lists added.</div></fieldset>
    <fieldset class="patient-form-section contract-section"><legend class="sr-only">Discounts</legend><div class="facility-form-section-heading">Discounts</div><div class="contract-association-editor"><label class="form-field"><span>Discount <b>*</b></span><input data-contract-association-name="discount" placeholder="Enter discount name"></label><label class="form-field"><span>Start Date</span><input type="date" data-contract-association-start="discount"></label><label class="form-field"><span>End Date</span><input type="date" data-contract-association-end="discount"></label><button class="button button-secondary" type="button" data-contract-association-add="discount" aria-label="Add discount">${icons.add}Add</button></div><div class="facility-table-scroll contract-association-table-wrap"><table class="facility-table contract-association-table"><thead><tr><th>ID</th><th>Discount</th><th>Start Date</th><th>End Date</th><th>Actions</th></tr></thead><tbody data-contract-association-rows="discount"></tbody></table></div><div class="facility-empty contract-association-empty" data-contract-association-empty="discount" hidden>No discounts added.</div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-contract-cancel>Cancel</button><button type="submit" class="button button-primary" data-contract-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-contract-form]');
  const toast = document.querySelector('[data-facility-toast]');
  const rowContainer = grid.querySelector('[data-contract-rows]');

  function persist() { try { localStorage.setItem(key, JSON.stringify(contracts)); } catch { /* Keep changes available in memory for this page session. */ } }
  function notify(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); }
  function dateLabel(value) { if (!value) return '—'; const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/); return match ? `${match[3]}/${match[2]}/${match[1]}` : esc(value); }
  function getFiltered() {
    return contracts.filter((contract) => Object.entries(filters).every(([field, value]) => {
      if (!value) return true;
      if (field === 'startDate' || field === 'endDate') return contract[field] === value;
      return String(contract[field] || '').toLocaleLowerCase().includes(value);
    }));
  }
  function closeMenus() { grid.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; }); grid.querySelectorAll('[data-contract-row-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false')); }
  function renderGrid() {
    const matched = getFiltered(); const pages = Math.max(1, Math.ceil(matched.length / pageSize)); page = Math.min(page, pages);
    rowContainer.innerHTML = matched.slice((page - 1) * pageSize, page * pageSize).map((contract) => `<tr><td>${esc(contract.name)}</td><td>${esc(contract.code || '—')}</td><td>${dateLabel(contract.startDate)}</td><td>${dateLabel(contract.endDate)}</td><td>${esc(payerName(contract.payerId) || contract.payerLabel || '—')}</td><td>${esc(contract.contractType || contractTypeFor(contract.payerId) || '—')}</td><td><span class="facility-status ${contract.status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${esc(contract.status)}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-contract-row-menu aria-label="Actions for ${esc(contract.name)}" aria-haspopup="menu" aria-expanded="false" data-contract-id="${esc(contract.id)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-contract-action="view" data-contract-id="${esc(contract.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-contract-action="edit" data-contract-id="${esc(contract.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-contract-action="status" data-contract-id="${esc(contract.id)}">${icons.status}${contract.status === 'Active' ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-contract-empty]').hidden = matched.length > 0;
    grid.querySelector('[data-contract-count]').textContent = `Total Results: ${matched.length}`;
    grid.querySelector('[data-contract-page-label]').textContent = `Page ${matched.length ? page : 0} of ${matched.length ? pages : 0}`;
    grid.querySelectorAll('[data-contract-page]').forEach((button) => { button.disabled = !matched.length || (['first', 'previous'].includes(button.dataset.contractPage) ? page === 1 : page === pages); });
  }
  function fillDerived(payerId, contract = {}) {
    const linkedPlans = plans.filter((plan) => plan.payerId === payerId);
    const linkedPolicies = policies.filter((policy) => policy.payerId === payerId);
    form.elements.contractType.value = contractTypeFor(payerId) || contract.contractType || '';
    form.elements.policiesLabel.value = linkedPolicies.map((policy) => policy.policyNo).join(', ') || contract.policiesLabel || '';
    form.elements.plansLabel.value = linkedPlans.map((plan) => plan.name).join(', ') || contract.plansLabel || '';
    form.elements.networkLabel.value = [...new Set(linkedPlans.map((plan) => plan.network).filter(Boolean))].join(', ') || contract.networkLabel || '';
    form.elements.classLabel.value = [...new Set(linkedPlans.map((plan) => plan.planClass).filter(Boolean))].join(', ') || contract.classLabel || '';
    form.elements.endDate.value = contract.endDate || '';
  }
  function renderAssociationRows(kind) {
    const entries = kind === 'price' ? priceRows : discountRows;
    const body = form.querySelector(`[data-contract-association-rows="${kind}"]`);
    body.innerHTML = entries.map((entry, index) => kind === 'price'
      ? `<tr><td>${esc(entry.name)}</td><td>${dateLabel(entry.startDate)}</td><td>${dateLabel(entry.endDate)}</td><td><button type="button" class="button button-ghost contract-remove-association" data-contract-association-remove="${kind}" data-contract-association-index="${index}">Remove</button></td></tr>`
      : `<tr><td>${esc(entry.id)}</td><td>${esc(entry.name)}</td><td>${dateLabel(entry.startDate)}</td><td>${dateLabel(entry.endDate)}</td><td><button type="button" class="button button-ghost contract-remove-association" data-contract-association-remove="${kind}" data-contract-association-index="${index}">Remove</button></td></tr>`).join('');
    form.querySelector(`[data-contract-association-empty="${kind}"]`).hidden = entries.length > 0;
  }
  function setReadOnly(readOnly) {
    form.querySelectorAll('input:not([disabled]),select:not([disabled])').forEach((control) => { control.disabled = readOnly; });
    form.querySelectorAll('[data-contract-association-add], [data-contract-association-remove]').forEach((control) => { control.hidden = readOnly; });
    modal.querySelector('[data-contract-save]').hidden = readOnly;
    modal.querySelector('[data-contract-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
  }
  function openModal(nextMode, contract = null, trigger = document.activeElement) {
    mode = nextMode; activeId = contract?.id || null; returnFocus = trigger; form.reset();
    priceRows = clone(contract?.priceLists || []); discountRows = clone(contract?.discounts || []);
    modal.querySelector('#contract-modal-title').textContent = nextMode === 'new' ? 'Add Contract' : nextMode === 'view' ? 'Contract Details' : 'Edit Contract';
    modal.querySelector('#contract-modal-description').textContent = nextMode === 'new' ? 'Enter contract information.' : nextMode === 'view' ? 'Review contract information.' : 'Update contract information.';
    modal.querySelector('[data-contract-save]').textContent = nextMode === 'new' ? 'Create' : 'Save changes';
    if (contract) {
      for (const [name, value] of Object.entries(contract)) {
        const control = form.elements.namedItem(name);
        if (!control || ['policiesLabel', 'plansLabel', 'networkLabel', 'classLabel', 'contractType', 'premiumBillingFrequency'].includes(name)) continue;
        if (control.type === 'checkbox') control.checked = Boolean(value); else control.value = value ?? '';
      }
    }
    form.elements.premiumBillingFrequency.value = contract?.premiumBillingFrequency || 'Monthly';
    fillDerived(form.elements.payerId.value, contract || {});
    renderAssociationRows('price'); renderAssociationRows('discount');
    setReadOnly(nextMode === 'view'); modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-contract-close]').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); returnFocus?.focus?.(); }
  function formRecord() {
    const payerId = form.elements.payerId.value;
    return {
      name: form.elements.name.value.trim(), code: form.elements.code.value.trim(), payerId,
      payerLabel: payerName(payerId), contractType: contractTypeFor(payerId),
      startDate: form.elements.startDate.value, endDate: form.elements.endDate.value,
      policiesLabel: form.elements.policiesLabel.value, plansLabel: form.elements.plansLabel.value,
      networkLabel: form.elements.networkLabel.value, classLabel: form.elements.classLabel.value,
      premiumBillingFrequency: 'Monthly', encounterType: form.elements.encounterType.value.trim(),
      nationality: form.elements.nationality.value, referralDiscount: form.elements.referralDiscount.checked,
      masterPricingFallback: form.elements.masterPricingFallback.checked, dedicatedAccount: form.elements.dedicatedAccount.checked,
      priceLists: clone(priceRows), discounts: clone(discountRows),
    };
  }
  function save(event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    const values = formRecord();
    if (mode === 'new') {
      const record = { ...values, id: `contract-${crypto.randomUUID()}`, status: 'Active' };
      contracts.push(record); persist(); grid.querySelectorAll('[data-contract-filter]').forEach((control) => { control.value = ''; }); filters = {}; page = Math.ceil(contracts.length / pageSize); closeModal(); renderGrid(); notify(`${record.name} was created successfully.`); return;
    }
    const record = contracts.find((item) => item.id === activeId); if (!record) return;
    Object.assign(record, values); persist(); closeModal(); renderGrid();
    if (currentDetailId === record.id) renderDetails(record);
    notify(`${record.name} was updated successfully.`);
  }
  function renderAssociationTable(entries, kind) {
    if (!entries?.length) return `<div class="facility-table-card"><div class="facility-empty contract-detail-empty">No ${kind === 'price' ? 'price lists' : 'discounts'} associated.</div></div>`;
    return `<div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table contract-detail-table"><thead><tr>${kind === 'price' ? '<th>Price List</th><th>Start Date</th><th>End Date</th>' : '<th>ID</th><th>Discount</th><th>Start Date</th><th>End Date</th>'}</tr></thead><tbody>${entries.map((entry) => `<tr>${kind === 'discount' ? `<td>${esc(entry.id)}</td>` : ''}<td>${esc(entry.name)}</td><td>${dateLabel(entry.startDate)}</td><td>${dateLabel(entry.endDate)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function renderDetails(contract) {
    currentDetailId = contract.id;
    const relatedPlans = plans.filter((plan) => plan.payerId === contract.payerId);
    const network = contract.networkLabel || [...new Set(relatedPlans.map((plan) => plan.network).filter(Boolean))].join(', ');
    const planClass = contract.classLabel || [...new Set(relatedPlans.map((plan) => plan.planClass).filter(Boolean))].join(', ');
    detailView.innerHTML = `<div class="contract-detail-toolbar"><button class="button button-secondary" type="button" data-contract-back>${icons.back}Back</button><button class="button button-secondary" type="button" data-contract-detail-edit>${icons.edit}Edit Contract</button></div><section class="contract-detail-card"><div class="contract-detail-heading"><h2>${esc(contract.name)}</h2><span class="facility-status ${contract.status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${esc(contract.status)}</span></div><dl class="contract-meta-grid"><div><dt>Code</dt><dd>${esc(contract.code || '—')}</dd></div><div><dt>Payer</dt><dd>${esc(payerName(contract.payerId) || contract.payerLabel || '—')}</dd></div><div><dt>Contract Type</dt><dd>${esc(contract.contractType || contractTypeFor(contract.payerId) || '—')}</dd></div><div><dt>Start Date</dt><dd>${dateLabel(contract.startDate)}</dd></div><div><dt>End Date</dt><dd>${dateLabel(contract.endDate)}</dd></div><div><dt>Premium Billing Frequency</dt><dd>${esc(contract.premiumBillingFrequency || 'Monthly')}</dd></div><div><dt>Encounter Type</dt><dd>${esc(contract.encounterType || '—')}</dd></div><div><dt>Nationality</dt><dd>${esc(contract.nationality || '—')}</dd></div><div><dt>Policies</dt><dd>${esc(contract.policiesLabel || linkedLabels(policies, 'policyNo', contract.payerId) || '—')}</dd></div><div><dt>Plans</dt><dd>${esc(contract.plansLabel || linkedLabels(plans, 'name', contract.payerId) || '—')}</dd></div><div><dt>Network</dt><dd>${esc(network || '—')}</dd></div><div><dt>Class</dt><dd>${esc(planClass || '—')}</dd></div><div><dt>Apply discount for referral cases</dt><dd>${contract.referralDiscount ? 'Yes' : 'No'}</dd></div><div><dt>Apply Master Pricing Fallback</dt><dd>${contract.masterPricingFallback ? 'Yes' : 'No'}</dd></div><div><dt>Create dedicated account for this contract</dt><dd>${contract.dedicatedAccount ? 'Yes' : 'No'}</dd></div></dl></section><section class="contract-detail-card"><h3>Price List</h3>${renderAssociationTable(contract.priceLists, 'price')}</section><section class="contract-detail-card"><h3>Discounts</h3>${renderAssociationTable(contract.discounts, 'discount')}</section>`;
    grid.hidden = true; detailView.hidden = false;
  }
  function backToGrid() { currentDetailId = null; detailView.hidden = true; grid.hidden = false; }

  grid.querySelectorAll('[data-contract-filter]').forEach((control) => control.addEventListener('input', () => { const value = control.value; filters[control.dataset.contractFilter] = control.type === 'date' ? value : value.trim().toLocaleLowerCase(); page = 1; closeMenus(); renderGrid(); }));
  grid.querySelectorAll('[data-contract-page]').forEach((button) => button.addEventListener('click', () => {
    const pages = Math.max(1, Math.ceil(getFiltered().length / pageSize));
    if (button.dataset.contractPage === 'first') page = 1; if (button.dataset.contractPage === 'previous') page = Math.max(1, page - 1); if (button.dataset.contractPage === 'next') page = Math.min(pages, page + 1); if (button.dataset.contractPage === 'last') page = pages; renderGrid();
  }));
  grid.querySelector('[data-contract-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.addEventListener('click', (event) => {
    const menuButton = event.target.closest('[data-contract-row-menu]');
    if (menuButton) { const menu = menuButton.nextElementSibling; const wasOpen = !menu.hidden; closeMenus(); menu.hidden = wasOpen; menuButton.setAttribute('aria-expanded', String(!wasOpen)); return; }
    const action = event.target.closest('[data-contract-action]'); if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const contract = contracts.find((item) => item.id === action.dataset.contractId); if (!contract) return;
    const trigger = action.closest('.facility-row-action').querySelector('[data-contract-row-menu]'); closeMenus();
    if (action.dataset.contractAction === 'view') { renderDetails(contract); return; }
    if (action.dataset.contractAction === 'edit') { openModal('edit', contract, trigger); return; }
    contract.status = contract.status === 'Active' ? 'Inactive' : 'Active'; persist(); renderGrid(); notify(`${contract.name} is now ${contract.status.toLocaleLowerCase()}.`);
  });
  form.elements.payerId.addEventListener('change', () => fillDerived(form.elements.payerId.value));
  form.querySelectorAll('[data-contract-association-add]').forEach((button) => button.addEventListener('click', () => {
    const kind = button.dataset.contractAssociationAdd;
    const nameControl = form.querySelector(`[data-contract-association-name="${kind}"]`);
    if (!nameControl.value.trim()) { nameControl.setCustomValidity('Enter a name before adding this item.'); nameControl.reportValidity(); nameControl.setCustomValidity(''); return; }
    const startDate = form.querySelector(`[data-contract-association-start="${kind}"]`).value;
    const endDate = form.querySelector(`[data-contract-association-end="${kind}"]`).value;
    if (startDate && endDate && endDate < startDate) { form.querySelector(`[data-contract-association-end="${kind}"]`).setCustomValidity('End Date must be on or after Start Date.'); form.querySelector(`[data-contract-association-end="${kind}"]`).reportValidity(); form.querySelector(`[data-contract-association-end="${kind}"]`).setCustomValidity(''); return; }
    const entries = kind === 'price' ? priceRows : discountRows;
    entries.push({ id: `${kind === 'price' ? 'PL' : 'DS'}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, name: nameControl.value.trim(), startDate, endDate });
    nameControl.value = ''; form.querySelector(`[data-contract-association-start="${kind}"]`).value = ''; renderAssociationRows(kind);
  }));
  form.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-contract-association-remove]'); if (!remove) return;
    const entries = remove.dataset.contractAssociationRemove === 'price' ? priceRows : discountRows;
    entries.splice(Number(remove.dataset.contractAssociationIndex), 1); renderAssociationRows(remove.dataset.contractAssociationRemove);
  });
  form.addEventListener('submit', save);
  modal.querySelector('[data-contract-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-contract-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  detailView.addEventListener('click', (event) => {
    if (event.target.closest('[data-contract-back]')) { backToGrid(); return; }
    if (event.target.closest('[data-contract-detail-edit]')) { const record = contracts.find((item) => item.id === currentDetailId); if (record) openModal('edit', record, event.target.closest('[data-contract-detail-edit]')); }
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); else if (event.key === 'Escape' && !detailView.hidden) backToGrid(); });
  renderGrid();
})();
