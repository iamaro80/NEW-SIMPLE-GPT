(() => {
  const grid = document.querySelector('[data-organization-contracts-grid]');
  const detailView = document.querySelector('[data-organization-contract-details]');
  if (!grid || !detailView) return;
  const facilities = (window.RcmFacilityStore?.list?.() || []).map((facility) => ({ ...facility, id: String(facility.id) }));
  const keyFor = (id) => `rcm-facility-contracts:v1:${id}`;
  const pageSize = 6;
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 18-6-6 6-6M9 12h12"/></svg>',
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const readArray = (key) => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const facilityName = (id) => facilities.find((facility) => facility.id === String(id))?.englishName || `Facility ${id}`;
  const seed = [
    { id: 'contract-001', name: 'Contract 1', code: 'CTR-INS-01', payerId: 'payer-001', payerLabel: 'Payer 1', contractType: 'Insurance Contract', startDate: '2026-01-01', endDate: '2026-12-31', premiumBillingFrequency: 'Monthly', encounterType: 'Inpatient', nationality: 'Saudi', referralDiscount: false, masterPricingFallback: true, dedicatedAccount: true, priceLists: [{ id: 'PL-001', name: 'Price List 1', startDate: '2026-01-01', endDate: '' }], discounts: [{ id: 'DS-001', name: 'Discount 1', startDate: '2026-01-01', endDate: '' }], status: 'Active' },
    { id: 'contract-002', name: 'Contract 2', code: 'CTR-OP-02', payerId: 'payer-002', payerLabel: 'Payer 2', contractType: 'Insurance Contract', startDate: '2026-03-01', endDate: '2027-02-28', premiumBillingFrequency: 'Monthly', encounterType: 'Outpatient', nationality: 'Non Saudi', referralDiscount: true, masterPricingFallback: false, dedicatedAccount: false, priceLists: [{ id: 'PL-002', name: 'Price List 2', startDate: '2026-03-01', endDate: '' }], discounts: [], status: 'Active' },
    { id: 'contract-003', name: 'Contract 3', code: 'CTR-COR-03', payerId: 'payer-005', payerLabel: 'Payer 5', contractType: 'Insurance Contract', startDate: '2026-01-01', endDate: '2026-12-31', premiumBillingFrequency: 'Monthly', encounterType: 'Inpatient and Outpatient', nationality: '', referralDiscount: false, masterPricingFallback: true, dedicatedAccount: false, priceLists: [], discounts: [{ id: 'DS-002', name: 'Discount 2', startDate: '2026-01-01', endDate: '' }], status: 'Inactive' },
  ];
  function readFacility(id) {
    const key = keyFor(id);
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return parsed; }
      localStorage.setItem(key, JSON.stringify(seed));
    } catch { /* Use the seed in memory if browser storage is unavailable. */ }
    return clone(seed);
  }
  let contracts = facilities.flatMap((facility) => readFacility(facility.id).map((contract) => ({ ...contract, __facilityId: facility.id })));
  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let activeFacilityId = null;
  let currentDetail = null;
  let returnFocus = null;
  let priceRows = [];
  let discountRows = [];
  let toastTimer;

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-contract-add>${icons.add}Add Contract</button></div><div class="branches-filter-grid contract-filter-grid" role="search" aria-label="Filter contracts"><label class="facility-filter"><span>Facility</span><select data-contract-filter="facilityId"><option value="">All facilities</option>${facilities.map((item) => `<option value="${esc(item.id)}">${esc(item.englishName)}</option>`).join('')}</select></label><label class="facility-filter"><span>Name</span><input type="search" data-contract-filter="name" placeholder="Enter contract name..."></label><label class="facility-filter"><span>Code</span><input type="search" data-contract-filter="code" placeholder="Enter code..."></label><label class="facility-filter"><span>Start Date</span><input type="date" data-contract-filter="startDate"></label><label class="facility-filter"><span>End Date</span><input type="date" data-contract-filter="endDate"></label></div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table contracts-table"><thead><tr><th>Facility</th><th>Name</th><th>Code</th><th>Start Date</th><th>End Date</th><th>Payer</th><th>Contract Type</th><th>Status</th><th>Actions</th></tr></thead><tbody data-contract-rows></tbody></table></div><div class="facility-empty" data-contract-empty hidden>No contracts match your filters.</div><footer class="facility-pagination"><span data-contract-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-contract-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-contract-page="previous" aria-label="Previous page">‹</button><span data-contract-page-label></span><button class="icon-button" type="button" data-contract-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-contract-page="last" aria-label="Last page">»</button></div></footer></div>`;
  const modal = document.createElement('div'); modal.className = 'patient-modal-backdrop'; modal.id = 'organization-contract-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal contract-modal" role="dialog" aria-modal="true" aria-labelledby="contract-modal-title" aria-describedby="contract-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">CONTRACT RECORD</p><h2 id="contract-modal-title">Add Contract</h2><p id="contract-modal-description">Enter contract information.</p></div><button type="button" class="icon-button" data-contract-close aria-label="Close dialog">×</button></header><form data-contract-form><div class="patient-modal-body contract-modal-body">
    <fieldset class="patient-form-section contract-section" data-contract-facility-assignment><legend class="sr-only">Facility Assignment</legend><div class="facility-form-section-heading">Facility Assignment</div><div class="organization-assignment-facility-list" data-contract-facilities>${facilities.map((item) => `<label class="form-check"><input type="checkbox" value="${esc(item.id)}"><span>${esc(item.englishName)}</span></label>`).join('')}</div><p class="muted-text" data-contract-facility-note>Select facilities and choose a payer separately for each one.</p><div class="patient-form-grid contract-form-grid" data-contract-payer-assignments></div></fieldset>
    <fieldset class="patient-form-section contract-section"><legend class="sr-only">General Information</legend><div class="facility-form-section-heading">General Information</div><div class="patient-form-grid contract-form-grid">
      <label class="form-field"><span>Name <b>*</b></span><input name="name" required maxlength="100"></label><label class="form-field"><span>Code</span><input name="code" maxlength="15"></label><label class="form-field"><span>Start Date</span><input name="startDate" type="date"></label><label class="form-field"><span>End Date</span><input name="endDate" type="date" disabled></label>
      <label class="form-field"><span>Premium Billing Frequency</span><input name="premiumBillingFrequency" value="Monthly" readonly disabled></label><label class="form-field"><span>Encounter Type</span><input name="encounterType"></label><label class="form-field"><span>Nationality</span><select name="nationality"><option value="">Select</option><option>Saudi</option><option>Non Saudi</option></select></label>
      <label class="form-check contract-check"><input type="checkbox" name="referralDiscount"><span>Apply discount for referral cases</span></label><label class="form-check contract-check"><input type="checkbox" name="masterPricingFallback"><span>Apply Master Pricing Fallback</span></label><label class="form-check contract-check"><input type="checkbox" name="dedicatedAccount"><span>Create dedicated account for this contract</span></label>
    </div></fieldset>
    <fieldset class="patient-form-section contract-section"><legend class="sr-only">Price List</legend><div class="facility-form-section-heading">Price List</div><div class="contract-association-editor"><label class="form-field"><span>Price List <b>*</b></span><input data-association-name="price" placeholder="Enter price list name"></label><label class="form-field"><span>Start Date</span><input type="date" data-association-start="price"></label><label class="form-field"><span>End Date</span><input type="date" data-association-end="price"></label><button class="button button-secondary" type="button" data-association-add="price" aria-label="Add price list">${icons.add}Add</button></div><div class="facility-table-scroll contract-association-table-wrap"><table class="facility-table contract-association-table"><thead><tr><th>Price List</th><th>Start Date</th><th>End Date</th><th>Actions</th></tr></thead><tbody data-association-rows="price"></tbody></table></div><div class="facility-empty contract-association-empty" data-association-empty="price" hidden>No price lists added.</div></fieldset>
    <fieldset class="patient-form-section contract-section"><legend class="sr-only">Discounts</legend><div class="facility-form-section-heading">Discounts</div><div class="contract-association-editor"><label class="form-field"><span>Discount <b>*</b></span><input data-association-name="discount" placeholder="Enter discount name"></label><label class="form-field"><span>Start Date</span><input type="date" data-association-start="discount"></label><label class="form-field"><span>End Date</span><input type="date" data-association-end="discount"></label><button class="button button-secondary" type="button" data-association-add="discount" aria-label="Add discount">${icons.add}Add</button></div><div class="facility-table-scroll contract-association-table-wrap"><table class="facility-table contract-association-table"><thead><tr><th>ID</th><th>Discount</th><th>Start Date</th><th>End Date</th><th>Actions</th></tr></thead><tbody data-association-rows="discount"></tbody></table></div><div class="facility-empty contract-association-empty" data-association-empty="discount" hidden>No discounts added.</div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-contract-cancel>Cancel</button><button type="submit" class="button button-primary" data-contract-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-contract-form]');
  const rowContainer = grid.querySelector('[data-contract-rows]');
  const toast = document.querySelector('[data-facility-toast]');
  function payerRecords(fid) { return readArray(`rcm-facility-payers:v2:${fid}`); }
  function planRecords(fid) { return readArray(`rcm-facility-plans:v1:${fid}`); }
  function policyRecords(fid) { return readArray(`rcm-facility-policies:v1:${fid}`); }
  function payerFor(fid, id) { return payerRecords(fid).find((payer) => payer.id === id); }
  function payerName(fid, id) { return payerFor(fid, id)?.englishName || ''; }
  function contractTypeFor(fid, id) { const payer = payerFor(fid, id); return payer ? payer.allowedContract ? 'Insurance Contract' : 'No Contract' : ''; }
  function persist() {
    try { facilities.forEach((facility) => localStorage.setItem(keyFor(facility.id), JSON.stringify(contracts.filter((contract) => contract.__facilityId === facility.id).map(({ __facilityId, ...contract }) => contract)))); } catch { /* Keep changes in memory for this page session. */ }
  }
  function notify(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); }
  function dateLabel(value) { if (!value) return '—'; const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/); return match ? `${match[3]}/${match[2]}/${match[1]}` : esc(value); }
  function getFiltered() { return contracts.filter((contract) => Object.entries(filters).every(([field, value]) => {
    if (!value) return true;
    if (field === 'facilityId') return contract.__facilityId === value;
    if (field === 'startDate' || field === 'endDate') return contract[field] === value;
    return String(contract[field] || '').toLocaleLowerCase().includes(value);
  })); }
  function closeMenus() { grid.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; }); grid.querySelectorAll('[data-contract-row-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false')); }
  function renderGrid() {
    const matched = getFiltered(); const pages = Math.max(1, Math.ceil(matched.length / pageSize)); page = Math.min(page, pages);
    rowContainer.innerHTML = matched.slice((page - 1) * pageSize, page * pageSize).map((contract) => `<tr><td>${esc(facilityName(contract.__facilityId))}</td><td>${esc(contract.name)}</td><td>${esc(contract.code || '—')}</td><td>${dateLabel(contract.startDate)}</td><td>${dateLabel(contract.endDate)}</td><td>${esc(payerName(contract.__facilityId, contract.payerId) || contract.payerLabel || '—')}</td><td>${esc(contract.contractType || contractTypeFor(contract.__facilityId, contract.payerId) || '—')}</td><td><span class="facility-status ${contract.status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${esc(contract.status)}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-contract-row-menu aria-label="Actions for ${esc(contract.name)} at ${esc(facilityName(contract.__facilityId))}" aria-haspopup="menu" aria-expanded="false" data-contract-id="${esc(contract.id)}" data-facility-id="${esc(contract.__facilityId)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-contract-action="view" data-contract-id="${esc(contract.id)}" data-facility-id="${esc(contract.__facilityId)}">${icons.eye}View</button><button type="button" role="menuitem" data-contract-action="edit" data-contract-id="${esc(contract.id)}" data-facility-id="${esc(contract.__facilityId)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-contract-action="status" data-contract-id="${esc(contract.id)}" data-facility-id="${esc(contract.__facilityId)}">${icons.status}${contract.status === 'Active' ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-contract-empty]').hidden = matched.length > 0; grid.querySelector('[data-contract-count]').textContent = `Total Results: ${matched.length}`; grid.querySelector('[data-contract-page-label]').textContent = `Page ${matched.length ? page : 0} of ${matched.length ? pages : 0}`;
    grid.querySelectorAll('[data-contract-page]').forEach((button) => { button.disabled = !matched.length || (['first', 'previous'].includes(button.dataset.contractPage) ? page === 1 : page === pages); });
  }
  function assignedFacilityIds() {
    return mode === 'new' ? [...modal.querySelectorAll('[data-contract-facilities] input:checked')].map((checkbox) => checkbox.value) : [activeFacilityId].filter(Boolean);
  }
  function derivedFor(fid, payerId) {
    const plans = planRecords(fid).filter((plan) => plan.payerId === payerId);
    const policies = policyRecords(fid).filter((policy) => policy.payerId === payerId);
    return {
      contractType: contractTypeFor(fid, payerId),
      policiesLabel: policies.map((policy) => policy.policyNo).filter(Boolean).join(', '),
      plansLabel: plans.map((plan) => plan.name).filter(Boolean).join(', '),
      networkLabel: [...new Set(plans.map((plan) => plan.network).filter(Boolean))].join(', '),
      classLabel: [...new Set(plans.map((plan) => plan.planClass).filter(Boolean))].join(', '),
      endDate: '',
    };
  }
  function renderPayerAssignments(selected = {}) {
    const container = modal.querySelector('[data-contract-payer-assignments]');
    const ids = assignedFacilityIds();
    container.innerHTML = ids.map((fid) => {
      const payers = payerRecords(fid);
      const chosen = selected[fid] || '';
      const derived = derivedFor(fid, chosen);
      return `<fieldset class="patient-form-section contract-section contract-facility-payer-card" data-payer-card="${esc(fid)}"><legend class="sr-only">${esc(facilityName(fid))} payer</legend><div class="facility-form-section-heading">${esc(facilityName(fid))} Payer Assignment</div><div class="patient-form-grid contract-form-grid"><label class="form-field"><span>Payers <b>*</b></span><select data-payer-for="${esc(fid)}" required><option value="">Select payer</option>${payers.map((payer) => `<option value="${esc(payer.id)}"${payer.id === chosen ? ' selected' : ''}>${esc(payer.englishName || payer.payerCode || payer.id)}</option>`).join('')}</select></label><label class="form-field"><span>Contract Type</span><input data-derived="contractType" value="${esc(derived.contractType)}" readonly disabled></label><label class="form-field"><span>Policies</span><input data-derived="policiesLabel" value="${esc(derived.policiesLabel)}" readonly disabled></label><label class="form-field"><span>Plans</span><input data-derived="plansLabel" value="${esc(derived.plansLabel)}" readonly disabled></label><label class="form-field"><span>Network</span><input data-derived="networkLabel" value="${esc(derived.networkLabel)}" readonly disabled></label><label class="form-field"><span>Class</span><input data-derived="classLabel" value="${esc(derived.classLabel)}" readonly disabled></label></div></fieldset>`;
    }).join('') || '<p class="muted-text">Select one or more facilities to choose payers.</p>';
  }
  function refreshPayerCard(card) {
    const fid = card.dataset.payerCard; const derived = derivedFor(fid, card.querySelector('[data-payer-for]').value);
    card.querySelectorAll('[data-derived]').forEach((field) => { field.value = derived[field.dataset.derived] || ''; });
  }
  function renderAssociationRows(kind) {
    const entries = kind === 'price' ? priceRows : discountRows;
    const body = form.querySelector(`[data-association-rows="${kind}"]`);
    body.innerHTML = entries.map((entry, index) => kind === 'price'
      ? `<tr><td>${esc(entry.name)}</td><td>${dateLabel(entry.startDate)}</td><td>${dateLabel(entry.endDate)}</td><td><button type="button" class="button button-ghost contract-remove-association" data-association-remove="${kind}" data-index="${index}">Remove</button></td></tr>`
      : `<tr><td>${esc(entry.id)}</td><td>${esc(entry.name)}</td><td>${dateLabel(entry.startDate)}</td><td>${dateLabel(entry.endDate)}</td><td><button type="button" class="button button-ghost contract-remove-association" data-association-remove="${kind}" data-index="${index}">Remove</button></td></tr>`).join('');
    form.querySelector(`[data-association-empty="${kind}"]`).hidden = entries.length > 0;
  }
  function setReadOnly(readOnly) {
    form.querySelectorAll('input:not([disabled]), select:not([disabled])').forEach((control) => { control.disabled = readOnly; });
    form.querySelectorAll('[data-association-add], [data-association-remove]').forEach((control) => { control.hidden = readOnly; });
    modal.querySelector('[data-contract-save]').hidden = readOnly; modal.querySelector('[data-contract-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
  }
  function openModal(nextMode, contract = null, trigger = document.activeElement) {
    mode = nextMode; activeId = contract?.id || null; activeFacilityId = contract?.__facilityId || null; returnFocus = trigger; form.reset();
    priceRows = clone(contract?.priceLists || []); discountRows = clone(contract?.discounts || []);
    modal.querySelector('#contract-modal-title').textContent = nextMode === 'new' ? 'Add Contract' : nextMode === 'view' ? 'Contract Details' : 'Edit Contract';
    modal.querySelector('#contract-modal-description').textContent = nextMode === 'new' ? 'Create independent contracts for selected facilities.' : nextMode === 'view' ? 'Review contract information.' : `Update the contract for ${facilityName(activeFacilityId)}.`;
    modal.querySelector('[data-contract-save]').textContent = nextMode === 'new' ? 'Create' : 'Save changes';
    const assignmentSection = modal.querySelector('[data-contract-facility-assignment]'); assignmentSection.hidden = nextMode !== 'new';
    modal.querySelectorAll('[data-contract-facilities] input').forEach((checkbox) => { checkbox.checked = false; checkbox.disabled = false; });
    modal.querySelector('[data-contract-facility-note]').textContent = nextMode === 'new' ? 'Select facilities and choose a payer separately for each one.' : `This copy belongs to ${facilityName(activeFacilityId)}. Its facility assignment is fixed.`;
    if (contract) {
      for (const [name, value] of Object.entries(contract)) {
        const control = form.elements.namedItem(name);
        if (!control || ['payerId', 'payerLabel', 'contractType', 'policiesLabel', 'plansLabel', 'networkLabel', 'classLabel', 'premiumBillingFrequency', 'endDate'].includes(name)) continue;
        if (control.type === 'checkbox') control.checked = Boolean(value); else control.value = value ?? '';
      }
    }
    form.elements.premiumBillingFrequency.value = contract?.premiumBillingFrequency || 'Monthly'; form.elements.endDate.value = contract?.endDate || '';
    renderPayerAssignments(contract ? { [activeFacilityId]: contract.payerId } : {});
    if (nextMode === 'view') setReadOnly(true);
    modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-contract-close]').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); returnFocus?.focus?.(); }
  function commonFormRecord() {
    return { name: form.elements.name.value.trim(), code: form.elements.code.value.trim(), startDate: form.elements.startDate.value, endDate: form.elements.endDate.value, premiumBillingFrequency: 'Monthly', encounterType: form.elements.encounterType.value.trim(), nationality: form.elements.nationality.value, referralDiscount: form.elements.referralDiscount.checked, masterPricingFallback: form.elements.masterPricingFallback.checked, dedicatedAccount: form.elements.dedicatedAccount.checked, priceLists: clone(priceRows), discounts: clone(discountRows) };
  }
  function save(event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    const common = commonFormRecord();
    if (common.startDate && common.endDate && common.endDate < common.startDate) { form.elements.endDate.setCustomValidity('End Date must be on or after Start Date.'); form.elements.endDate.reportValidity(); form.elements.endDate.setCustomValidity(''); return; }
    const payerIds = Object.fromEntries([...modal.querySelectorAll('[data-payer-for]')].map((select) => [select.dataset.payerFor, select.value]));
    if (mode === 'new') {
      const assigned = assignedFacilityIds();
      if (!assigned.length) { window.alert('Assign this contract to at least one facility.'); return; }
      if (assigned.some((fid) => !payerIds[fid])) { window.alert('Select a payer for every assigned facility.'); return; }
      assigned.forEach((fid) => {
        const payerId = payerIds[fid]; const payer = payerFor(fid, payerId); const derived = derivedFor(fid, payerId);
        contracts.push({ ...clone(common), ...derived, id: `contract-${crypto.randomUUID()}`, payerId, payerLabel: payer?.englishName || '', __facilityId: fid, status: 'Active' });
      });
      persist(); closeModal(); grid.querySelectorAll('[data-contract-filter]').forEach((control) => { control.value = ''; }); filters = {}; page = Math.ceil(contracts.length / pageSize); renderGrid(); notify(`Contract created for ${assigned.length} ${assigned.length === 1 ? 'facility' : 'facilities'}.`); return;
    }
    const contract = contracts.find((item) => item.id === activeId && item.__facilityId === activeFacilityId); if (!contract) return;
    const payerId = payerIds[activeFacilityId]; const payer = payerFor(activeFacilityId, payerId); const derived = derivedFor(activeFacilityId, payerId);
    Object.assign(contract, common, derived, { payerId, payerLabel: payer?.englishName || '' });
    persist(); closeModal(); renderGrid(); if (currentDetail?.id === contract.id && currentDetail?.facilityId === activeFacilityId) renderDetails(contract); notify(`${contract.name} was updated successfully.`);
  }
  function renderAssociationTable(entries, kind) {
    if (!entries?.length) return `<div class="facility-table-card"><div class="facility-empty contract-detail-empty">No ${kind === 'price' ? 'price lists' : 'discounts'} associated.</div></div>`;
    return `<div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table contract-detail-table"><thead><tr>${kind === 'price' ? '<th>Price List</th><th>Start Date</th><th>End Date</th>' : '<th>ID</th><th>Discount</th><th>Start Date</th><th>End Date</th>'}</tr></thead><tbody>${entries.map((entry) => `<tr>${kind === 'discount' ? `<td>${esc(entry.id)}</td>` : ''}<td>${esc(entry.name)}</td><td>${dateLabel(entry.startDate)}</td><td>${dateLabel(entry.endDate)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function renderDetails(contract) {
    currentDetail = { id: contract.id, facilityId: contract.__facilityId };
    const plans = planRecords(contract.__facilityId).filter((plan) => plan.payerId === contract.payerId);
    const policies = policyRecords(contract.__facilityId).filter((policy) => policy.payerId === contract.payerId);
    const network = contract.networkLabel || [...new Set(plans.map((plan) => plan.network).filter(Boolean))].join(', ');
    const planClass = contract.classLabel || [...new Set(plans.map((plan) => plan.planClass).filter(Boolean))].join(', ');
    detailView.innerHTML = `<div class="contract-detail-toolbar"><button class="button button-secondary" type="button" data-contract-back>${icons.back}Back</button><button class="button button-secondary" type="button" data-contract-detail-edit>${icons.edit}Edit Contract</button></div><section class="contract-detail-card"><div class="contract-detail-heading"><div><p class="eyebrow">${esc(facilityName(contract.__facilityId))}</p><h2>${esc(contract.name)}</h2></div><span class="facility-status ${contract.status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${esc(contract.status)}</span></div><dl class="contract-meta-grid"><div><dt>Code</dt><dd>${esc(contract.code || '—')}</dd></div><div><dt>Payer</dt><dd>${esc(payerName(contract.__facilityId, contract.payerId) || contract.payerLabel || '—')}</dd></div><div><dt>Contract Type</dt><dd>${esc(contract.contractType || contractTypeFor(contract.__facilityId, contract.payerId) || '—')}</dd></div><div><dt>Start Date</dt><dd>${dateLabel(contract.startDate)}</dd></div><div><dt>End Date</dt><dd>${dateLabel(contract.endDate)}</dd></div><div><dt>Premium Billing Frequency</dt><dd>${esc(contract.premiumBillingFrequency || 'Monthly')}</dd></div><div><dt>Encounter Type</dt><dd>${esc(contract.encounterType || '—')}</dd></div><div><dt>Nationality</dt><dd>${esc(contract.nationality || '—')}</dd></div><div><dt>Policies</dt><dd>${esc(contract.policiesLabel || policies.map((policy) => policy.policyNo).filter(Boolean).join(', ') || '—')}</dd></div><div><dt>Plans</dt><dd>${esc(contract.plansLabel || plans.map((plan) => plan.name).filter(Boolean).join(', ') || '—')}</dd></div><div><dt>Network</dt><dd>${esc(network || '—')}</dd></div><div><dt>Class</dt><dd>${esc(planClass || '—')}</dd></div><div><dt>Apply discount for referral cases</dt><dd>${contract.referralDiscount ? 'Yes' : 'No'}</dd></div><div><dt>Apply Master Pricing Fallback</dt><dd>${contract.masterPricingFallback ? 'Yes' : 'No'}</dd></div><div><dt>Create dedicated account for this contract</dt><dd>${contract.dedicatedAccount ? 'Yes' : 'No'}</dd></div></dl></section><section class="contract-detail-card"><h3>Price List</h3>${renderAssociationTable(contract.priceLists, 'price')}</section><section class="contract-detail-card"><h3>Discounts</h3>${renderAssociationTable(contract.discounts, 'discount')}</section>`;
    grid.hidden = true; detailView.hidden = false;
  }
  function backToGrid() { currentDetail = null; detailView.hidden = true; grid.hidden = false; }
  grid.querySelectorAll('[data-contract-filter]').forEach((control) => control.addEventListener('input', () => { const value = control.value; filters[control.dataset.contractFilter] = control.type === 'date' ? value : value.trim().toLocaleLowerCase(); page = 1; closeMenus(); renderGrid(); }));
  grid.querySelectorAll('[data-contract-page]').forEach((button) => button.addEventListener('click', () => { const pages = Math.max(1, Math.ceil(getFiltered().length / pageSize)); if (button.dataset.contractPage === 'first') page = 1; if (button.dataset.contractPage === 'previous') page = Math.max(1, page - 1); if (button.dataset.contractPage === 'next') page = Math.min(pages, page + 1); if (button.dataset.contractPage === 'last') page = pages; renderGrid(); }));
  grid.querySelector('[data-contract-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-contract-row-menu]'); if (trigger) { const menu = trigger.nextElementSibling; const opening = menu.hidden; closeMenus(); menu.hidden = !opening; trigger.setAttribute('aria-expanded', String(opening)); return; }
    const action = event.target.closest('[data-contract-action]'); if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const contract = contracts.find((item) => item.id === action.dataset.contractId && item.__facilityId === action.dataset.facilityId); if (!contract) return; const actionTrigger = action.closest('.facility-row-action').querySelector('[data-contract-row-menu]'); closeMenus();
    if (action.dataset.contractAction === 'view') { renderDetails(contract); return; }
    if (action.dataset.contractAction === 'edit') { openModal('edit', contract, actionTrigger); return; }
    contract.status = contract.status === 'Active' ? 'Inactive' : 'Active'; persist(); renderGrid(); notify(`${contract.name} is now ${contract.status.toLocaleLowerCase()}.`);
  });
  modal.querySelector('[data-contract-facilities]').addEventListener('change', () => renderPayerAssignments());
  modal.querySelector('[data-contract-payer-assignments]').addEventListener('change', (event) => { const card = event.target.closest('[data-payer-card]'); if (card) refreshPayerCard(card); });
  form.querySelectorAll('[data-association-add]').forEach((button) => button.addEventListener('click', () => {
    const kind = button.dataset.associationAdd; const nameControl = form.querySelector(`[data-association-name="${kind}"]`);
    if (!nameControl.value.trim()) { nameControl.setCustomValidity('Enter a name before adding this item.'); nameControl.reportValidity(); nameControl.setCustomValidity(''); return; }
    const start = form.querySelector(`[data-association-start="${kind}"]`).value, end = form.querySelector(`[data-association-end="${kind}"]`).value;
    if (start && end && end < start) { const endControl = form.querySelector(`[data-association-end="${kind}"]`); endControl.setCustomValidity('End Date must be on or after Start Date.'); endControl.reportValidity(); endControl.setCustomValidity(''); return; }
    const entries = kind === 'price' ? priceRows : discountRows; entries.push({ id: `${kind === 'price' ? 'PL' : 'DS'}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, name: nameControl.value.trim(), startDate: start, endDate: end });
    nameControl.value = ''; form.querySelector(`[data-association-start="${kind}"]`).value = ''; form.querySelector(`[data-association-end="${kind}"]`).value = ''; renderAssociationRows(kind);
  }));
  form.addEventListener('click', (event) => { const button = event.target.closest('[data-association-remove]'); if (!button) return; const entries = button.dataset.associationRemove === 'price' ? priceRows : discountRows; entries.splice(Number(button.dataset.index), 1); renderAssociationRows(button.dataset.associationRemove); });
  form.addEventListener('submit', save);
  modal.querySelector('[data-contract-close]').addEventListener('click', closeModal); modal.querySelector('[data-contract-cancel]').addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  detailView.addEventListener('click', (event) => { if (event.target.closest('[data-contract-back]')) { backToGrid(); return; } if (event.target.closest('[data-contract-detail-edit]')) { const contract = contracts.find((item) => item.id === currentDetail?.id && item.__facilityId === currentDetail?.facilityId); if (contract) openModal('edit', contract, event.target.closest('[data-contract-detail-edit]')); } });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); else if (event.key === 'Escape' && !detailView.hidden) backToGrid(); });
  renderGrid();
})();
