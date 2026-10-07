(() => {
  const grid = document.querySelector('[data-tat-grid]');
  if (!grid) return;
  const facilities = (window.RcmFacilityStore?.list?.() || []).map((item) => ({ ...item, id: String(item.id) }));
  const keyFor = (id) => `rcm-facility-tat-rules:v1:${id}`;
  const pageSize = 6;
  const codingTypes = ['TransportationSrca', 'ICD-10', 'CPT'];
  const payerTypes = ['Insurance', 'Cash', 'Corporate'];
  const visitReasons = ['All', 'Emergency', 'Outpatient'];
  const authorizations = ['All', 'Required', 'Not Required'];
  const icon = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>',
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const read = (key, fallback = []) => { try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(parsed) ? parsed : fallback; } catch { return fallback; } };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const seed = [
    { id: 'tat-rule-001', codingType: 'ICD-10', payerType: 'Insurance', contractId: '', contractLabel: '—', visitReason: 'Emergency', authorizationType: 'Required', day: 0, hours: 4.5 },
    { id: 'tat-rule-002', codingType: 'CPT', payerType: 'Corporate', contractId: '', contractLabel: '—', visitReason: 'Outpatient', authorizationType: 'Not Required', day: 1, hours: 2 },
    { id: 'tat-rule-003', codingType: 'TransportationSrca', payerType: 'Cash', contractId: '', contractLabel: '—', visitReason: 'All', authorizationType: 'All', day: 0, hours: 1 },
  ];
  const facilityName = (id) => facilities.find((facility) => facility.id === String(id))?.englishName || `Facility ${id}`;
  function readFacility(id) {
    const key = keyFor(id);
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) { const parsed = JSON.parse(stored); if (Array.isArray(parsed)) return parsed; }
      localStorage.setItem(key, JSON.stringify(seed));
    } catch { /* In-memory seed remains available. */ }
    return clone(seed);
  }
  let records = facilities.flatMap((facility) => readFacility(facility.id).map((rule) => ({ ...rule, __facilityId: facility.id })));
  let filters = {};
  let page = 1;
  let activeId = null;
  let activeFacilityId = null;
  let mode = 'new';
  let returnFocus = null;
  let toastTimer;

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-tat-add>${icon.add}Add TAT Rule</button></div><div class="branches-filter-grid tat-filter-grid" role="search" aria-label="Filter TAT rules">
    <label class="facility-filter"><span>Facility</span><select data-tat-filter="facilityId"><option value="">All facilities</option>${facilities.map((facility) => `<option value="${esc(facility.id)}">${esc(facility.englishName)}</option>`).join('')}</select></label>
    <label class="facility-filter"><span>Coding Type</span><select data-tat-filter="codingType"><option value="">All coding types</option>${codingTypes.map((value) => `<option>${esc(value)}</option>`).join('')}</select></label>
    <label class="facility-filter"><span>TAT</span><input type="search" data-tat-filter="tat" placeholder="Search days or hours"></label>
    <label class="facility-filter"><span>Visit Reason</span><select data-tat-filter="visitReason"><option value="">All visit reasons</option>${visitReasons.map((value) => `<option>${esc(value)}</option>`).join('')}</select></label>
    <label class="facility-filter"><span>Contract</span><input type="search" data-tat-filter="contract" placeholder="Search contract"></label>
    <label class="facility-filter"><span>Payer Type</span><select data-tat-filter="payerType"><option value="">All payer types</option>${payerTypes.map((value) => `<option>${esc(value)}</option>`).join('')}</select></label>
    <label class="facility-filter"><span>Authorization</span><select data-tat-filter="authorizationType"><option value="">All authorization types</option>${authorizations.map((value) => `<option>${esc(value)}</option>`).join('')}</select></label>
  </div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table tat-table"><thead><tr><th>Facility</th><th>Coding Type</th><th>TAT</th><th>Visit Reason</th><th>Contract</th><th>Payer Type</th><th>Authorization</th><th>Actions</th></tr></thead><tbody data-tat-rows></tbody></table></div><div class="facility-empty" data-tat-empty hidden>No TAT rules match your filters.</div><footer class="facility-pagination"><span data-tat-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-tat-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-tat-page="previous" aria-label="Previous page">‹</button><span data-tat-page-label></span><button class="icon-button" type="button" data-tat-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-tat-page="last" aria-label="Last page">»</button></div></footer></div>`;
  const modal = document.createElement('div'); modal.className = 'patient-modal-backdrop tat-modal-backdrop'; modal.id = 'org-tat-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal tat-modal" role="dialog" aria-modal="true" aria-labelledby="tat-modal-title"><header class="patient-modal-header"><div><p class="eyebrow">BILLING RULE</p><h2 id="tat-modal-title">Add TAT Rule</h2><p data-tat-description>Configure turnaround time requirements.</p></div><button type="button" class="icon-button" data-tat-close aria-label="Close dialog">×</button></header><form data-tat-form><div class="patient-modal-body">
    <fieldset class="patient-form-section" data-tat-assignment-section><legend class="sr-only">Facility Assignment</legend><div class="facility-form-section-heading">Facility Assignment</div><div class="organization-assignment-facility-list" data-tat-facilities>${facilities.map((facility) => `<label class="form-check"><input type="checkbox" value="${esc(facility.id)}"><span>${esc(facility.englishName)}</span></label>`).join('')}</div><p class="muted-text" data-tat-facility-note>Select one or more facilities. Each facility receives an independent rule.</p></fieldset>
    <fieldset class="patient-form-section"><legend class="sr-only">TAT Rule Information</legend><div class="facility-form-section-heading">TAT Rule Information</div><div class="patient-form-grid tat-form-grid">
      <label class="form-field"><span>Coding Type <b>*</b></span><select name="codingType" required><option value="">Select Coding Type</option>${codingTypes.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label>
      <label class="form-field"><span>Payer Type <b>*</b></span><select name="payerType" required><option value="">Select Payer Type</option>${payerTypes.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label>
      <div class="form-field"><span>Contract</span><div data-tat-contract-selects></div><small data-tat-contract-hint>Optional. Choose a payer type to see matching active contracts.</small></div>
      <label class="form-field"><span>Visit Reason <b>*</b></span><select name="visitReason" required><option value="">Select Visit Reason</option>${visitReasons.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label>
      <label class="form-field"><span>Authorization Type <b>*</b></span><select name="authorizationType" required><option value="">Select Authorization</option>${authorizations.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label>
      <label class="form-field"><span>Day <b>*</b></span><input name="day" type="number" min="0" step="1" value="0" required></label><label class="form-field"><span>Hours <b>*</b></span><input name="hours" type="number" min="0" max="23.59" step="0.01" value="1" required></label>
    </div></fieldset></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-tat-cancel>Cancel</button><button type="submit" class="button button-primary" data-tat-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-tat-form]');
  const toast = document.querySelector('[data-facility-toast]');
  const rowContainer = grid.querySelector('[data-tat-rows]');
  function persist() {
    try { facilities.forEach((facility) => localStorage.setItem(keyFor(facility.id), JSON.stringify(records.filter((rule) => rule.__facilityId === facility.id).map(({ __facilityId, ...rule }) => rule)))); } catch { /* Keep edits available in memory. */ }
  }
  function notify(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500); }
  function ruleTat(rule) { const days = Number(rule.day) || 0, hours = Number(rule.hours) || 0; return `${days} ${days === 1 ? 'Day' : 'Days'} and ${hours} ${hours === 1 ? 'Hour' : 'Hours'}`; }
  function getContracts(fid, type) {
    if (!type || type === 'Cash') return [];
    const contracts = read(`rcm-facility-contracts:v1:${fid}`);
    const payers = read(`rcm-facility-payers:v2:${fid}`);
    const expected = type === 'Insurance' ? 'Insurance Company' : 'Corporate';
    return contracts.filter((contract) => (contract.status === 'Active' || contract.active === true) && payers.find((payer) => payer.id === contract.payerId)?.payerType === expected);
  }
  function contractLabel(rule) {
    const contracts = read(`rcm-facility-contracts:v1:${rule.__facilityId}`);
    return contracts.find((item) => item.id === rule.contractId)?.name || rule.contractLabel || '—';
  }
  function closeMenus() { grid.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; }); grid.querySelectorAll('[data-tat-row-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false')); }
  function filtered() { return records.filter((rule) => Object.entries(filters).every(([field, value]) => {
    if (!value) return true;
    if (field === 'facilityId') return rule.__facilityId === value;
    if (field === 'tat') return ruleTat(rule).toLocaleLowerCase().includes(value);
    if (field === 'contract') return contractLabel(rule).toLocaleLowerCase().includes(value);
    return String(rule[field] || '').toLocaleLowerCase().includes(value);
  })); }
  function render() {
    const matched = filtered(), pages = Math.max(1, Math.ceil(matched.length / pageSize)); page = Math.min(page, pages);
    rowContainer.innerHTML = matched.slice((page - 1) * pageSize, page * pageSize).map((rule) => `<tr><td>${esc(facilityName(rule.__facilityId))}</td><td>${esc(rule.codingType)}</td><td>${esc(ruleTat(rule))}</td><td>${esc(rule.visitReason)}</td><td>${esc(contractLabel(rule))}</td><td>${esc(rule.payerType)}</td><td>${esc(rule.authorizationType)}</td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-tat-row-menu aria-label="Actions for ${esc(rule.codingType)} rule" aria-haspopup="menu" aria-expanded="false" data-id="${esc(rule.id)}" data-facility-id="${esc(rule.__facilityId)}">${icon.more}</button><div class="facility-row-menu tat-row-menu" role="menu" hidden><button type="button" role="menuitem" data-tat-action="edit" data-id="${esc(rule.id)}" data-facility-id="${esc(rule.__facilityId)}">${icon.edit}Edit</button><button type="button" role="menuitem" data-tat-action="delete" data-id="${esc(rule.id)}" data-facility-id="${esc(rule.__facilityId)}">${icon.trash}Delete</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-tat-empty]').hidden = matched.length > 0; grid.querySelector('[data-tat-count]').textContent = `Total Results: ${matched.length}`; grid.querySelector('[data-tat-page-label]').textContent = `Page ${matched.length ? page : 0} of ${matched.length ? pages : 0}`;
    grid.querySelectorAll('[data-tat-page]').forEach((button) => { button.disabled = !matched.length || (['first', 'previous'].includes(button.dataset.tatPage) ? page === 1 : page === pages); });
  }
  function renderContractSelectors(selectedByFacility = {}) {
    const type = form.elements.payerType.value, target = modal.querySelector('[data-tat-contract-selects]');
    const assigned = mode === 'new' ? [...modal.querySelectorAll('[data-tat-facilities] input:checked')].map((input) => input.value) : [activeFacilityId].filter(Boolean);
    target.innerHTML = assigned.map((fid) => {
      const options = getContracts(fid, type);
      const label = mode === 'new' && assigned.length > 1 ? `<span class="muted-text">${esc(facilityName(fid))}</span>` : '';
      return `${label}<select data-contract-facility="${esc(fid)}" ${!type || type === 'Cash' || !options.length ? 'disabled' : ''}><option value="">${type === 'Cash' ? 'Not applicable for Cash' : !type ? 'Select payer type first' : options.length ? 'Select Contract (optional)' : 'No matching contracts available'}</option>${options.map((item) => `<option value="${esc(item.id)}"${item.id === selectedByFacility[fid] ? ' selected' : ''}>${esc(item.name)}${item.payerLabel ? ` — ${esc(item.payerLabel)}` : ''}</option>`).join('')}</select>`;
    }).join('') || '<span class="muted-text">Select at least one facility to choose a contract.</span>';
    modal.querySelector('[data-tat-contract-hint]').textContent = type === 'Cash' ? 'Cash rules do not use contracts.' : !type ? 'Optional. Choose a payer type to see matching active contracts.' : 'Contract is optional and scoped to each selected facility.';
  }
  function selectedContracts() { return Object.fromEntries([...modal.querySelectorAll('[data-contract-facility]')].map((select) => [select.dataset.contractFacility, select.value])); }
  function openModal(nextMode, rule = null, trigger = document.activeElement) {
    mode = nextMode; activeId = rule?.id || null; activeFacilityId = rule?.__facilityId || null; returnFocus = trigger; form.reset();
    modal.querySelector('#tat-modal-title').textContent = nextMode === 'new' ? 'Add TAT Rule' : 'Edit TAT Rule';
    modal.querySelector('[data-tat-description]').textContent = nextMode === 'new' ? 'Configure turnaround time requirements across selected facilities.' : `Update the rule for ${facilityName(activeFacilityId)}.`;
    modal.querySelector('[data-tat-save]').textContent = nextMode === 'new' ? 'Create' : 'Save changes';
    modal.querySelector('[data-tat-assignment-section]').hidden = nextMode !== 'new';
    modal.querySelectorAll('[data-tat-facilities] input').forEach((checkbox) => { checkbox.checked = false; checkbox.disabled = false; });
    form.elements.day.value = rule?.day ?? 0; form.elements.hours.value = rule?.hours ?? 1;
    if (rule) { form.elements.codingType.value = rule.codingType || ''; form.elements.payerType.value = rule.payerType || ''; form.elements.visitReason.value = rule.visitReason || ''; form.elements.authorizationType.value = rule.authorizationType || ''; }
    if (nextMode === 'edit') modal.querySelector(`[data-tat-facilities] input[value="${CSS.escape(activeFacilityId)}"]`)?.setAttribute('checked', '');
    renderContractSelectors(rule ? { [activeFacilityId]: rule.contractId || '' } : {});
    modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-tat-close]').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); returnFocus?.focus?.(); }
  function ruleFor(id, fid) { return records.find((rule) => rule.id === id && rule.__facilityId === fid); }
  function save(event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    const values = { codingType: form.elements.codingType.value, payerType: form.elements.payerType.value, visitReason: form.elements.visitReason.value, authorizationType: form.elements.authorizationType.value, day: Number(form.elements.day.value), hours: Number(form.elements.hours.value) };
    if (values.hours < 0 || values.hours > 23.59) { form.elements.hours.setCustomValidity('Hours must be between 0 and 23.59.'); form.elements.hours.reportValidity(); form.elements.hours.setCustomValidity(''); return; }
    const contracts = selectedContracts();
    if (mode === 'edit') {
      const record = ruleFor(activeId, activeFacilityId); if (!record) return;
      const contractId = contracts[activeFacilityId] || '';
      const contract = getContracts(activeFacilityId, values.payerType).find((item) => item.id === contractId);
      Object.assign(record, values, { contractId, contractLabel: contract?.name || '—' });
      persist(); closeModal(); render(); notify('TAT rule was updated successfully.'); return;
    }
    const assigned = [...modal.querySelectorAll('[data-tat-facilities] input:checked')].map((checkbox) => checkbox.value);
    if (!assigned.length) { window.alert('Assign this TAT rule to at least one facility.'); return; }
    assigned.forEach((fid) => {
      const contractId = contracts[fid] || '';
      const contract = getContracts(fid, values.payerType).find((item) => item.id === contractId);
      records.push({ ...values, contractId, contractLabel: contract?.name || '—', id: `tat-rule-${crypto.randomUUID()}`, __facilityId: fid });
    });
    persist(); closeModal(); grid.querySelectorAll('[data-tat-filter]').forEach((field) => { field.value = ''; }); filters = {}; page = Math.ceil(records.length / pageSize); render(); notify(`TAT rule created for ${assigned.length} ${assigned.length === 1 ? 'facility' : 'facilities'}.`);
  }
  function askDelete(rule) {
    const confirmModal = document.createElement('div'); confirmModal.className = 'patient-modal-backdrop tat-confirm-backdrop';
    confirmModal.innerHTML = `<section class="patient-modal tat-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="tat-confirm-title"><header class="patient-modal-header"><div><p class="eyebrow">DELETE RULE</p><h2 id="tat-confirm-title">Delete TAT Rule?</h2><p>This will permanently remove the rule for ${esc(facilityName(rule.__facilityId))} (${esc(rule.codingType)}, ${esc(ruleTat(rule))}).</p></div><button type="button" class="icon-button" data-tat-confirm-close aria-label="Close dialog">×</button></header><footer class="patient-modal-footer"><span></span><div><button type="button" class="button button-secondary" data-tat-delete-cancel>Cancel</button><button type="button" class="button button-destructive" data-tat-delete-confirm>Delete</button></div></footer></section>`;
    document.body.append(confirmModal); document.body.classList.add('patient-modal-open');
    const close = () => { confirmModal.remove(); document.body.classList.remove('patient-modal-open'); };
    confirmModal.querySelectorAll('[data-tat-delete-cancel], [data-tat-confirm-close]').forEach((button) => button.addEventListener('click', close)); confirmModal.addEventListener('click', (event) => { if (event.target === confirmModal) close(); });
    confirmModal.querySelector('[data-tat-delete-confirm]').addEventListener('click', () => { records = records.filter((item) => item !== rule); persist(); close(); render(); notify('TAT rule was deleted successfully.'); });
    confirmModal.querySelector('[data-tat-delete-cancel]').focus();
  }
  grid.querySelectorAll('[data-tat-filter]').forEach((field) => field.addEventListener(field.matches('select') ? 'change' : 'input', () => { filters[field.dataset.tatFilter] = field.matches('select') ? field.value : field.value.trim().toLocaleLowerCase(); page = 1; closeMenus(); render(); }));
  grid.querySelectorAll('[data-tat-page]').forEach((button) => button.addEventListener('click', () => { const pages = Math.max(1, Math.ceil(filtered().length / pageSize)); if (button.dataset.tatPage === 'first') page = 1; if (button.dataset.tatPage === 'previous') page = Math.max(1, page - 1); if (button.dataset.tatPage === 'next') page = Math.min(pages, page + 1); if (button.dataset.tatPage === 'last') page = pages; render(); }));
  grid.querySelector('[data-tat-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-tat-row-menu]'); if (trigger) { const menu = trigger.nextElementSibling, opening = menu.hidden; closeMenus(); menu.hidden = !opening; trigger.setAttribute('aria-expanded', String(opening)); return; }
    const action = event.target.closest('[data-tat-action]'); if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const rule = ruleFor(action.dataset.id, action.dataset.facilityId); if (!rule) return; closeMenus();
    if (action.dataset.tatAction === 'edit') openModal('edit', rule, action.closest('.facility-row-action').querySelector('[data-tat-row-menu]')); else askDelete(rule);
  });
  modal.querySelector('[data-tat-facilities]').addEventListener('change', () => renderContractSelectors());
  form.elements.payerType.addEventListener('change', () => renderContractSelectors());
  form.addEventListener('submit', save);
  modal.querySelector('[data-tat-close]').addEventListener('click', closeModal); modal.querySelector('[data-tat-cancel]').addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  render();
})();
