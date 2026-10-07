(() => {
  const grid = document.querySelector('[data-tat-grid]');
  if (!grid) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const key = `rcm-facility-tat-rules:v1:${facilityId}`;
  const contractsKey = `rcm-facility-contracts:v1:${facilityId}`;
  const payersKey = `rcm-facility-payers:v2:${facilityId}`;
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
  const read = (storageKey) => { try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const contracts = read(contractsKey);
  const payers = read(payersKey);
  const payerForContract = (contract) => payers.find((payer) => payer.id === contract.payerId);
  const payerNameForContract = (contract) => payerForContract(contract)?.englishName || contract.payerLabel || '';
  const payerCategoryForContract = (contract) => payerForContract(contract)?.payerType || '';
  const eligibleContracts = (payerType) => {
    if (!payerType || payerType === 'Cash') return [];
    const expected = payerType === 'Insurance' ? 'Insurance Company' : 'Corporate';
    return contracts.filter((contract) => contract.status === 'Active' && payerCategoryForContract(contract) === expected);
  };
  const seed = [
    { id: 'tat-rule-001', codingType: 'ICD-10', payerType: 'Insurance', contractId: 'contract-001', contractLabel: 'Contract 1', visitReason: 'Emergency', authorizationType: 'Required', day: 0, hours: 4.5 },
    { id: 'tat-rule-002', codingType: 'CPT', payerType: 'Corporate', contractId: '', contractLabel: '—', visitReason: 'Outpatient', authorizationType: 'Not Required', day: 1, hours: 2 },
    { id: 'tat-rule-003', codingType: 'TransportationSrca', payerType: 'Cash', contractId: '', contractLabel: '—', visitReason: 'All', authorizationType: 'All', day: 0, hours: 1 },
  ];
  let records;
  try {
    const saved = localStorage.getItem(key);
    records = saved === null ? clone(seed) : JSON.parse(saved);
    if (!Array.isArray(records)) records = clone(seed);
    if (saved === null) localStorage.setItem(key, JSON.stringify(records));
  } catch { records = clone(seed); }

  let filters = {};
  let page = 1;
  let activeId = null;
  let returnFocus = null;
  let toastTimer;

  const optionList = (items, placeholder, selected = '') => `<option value="">${esc(placeholder)}</option>${items.map((item) => `<option value="${esc(item)}"${item === selected ? ' selected' : ''}>${esc(item)}</option>`).join('')}`;
  grid.innerHTML = `<div class="branches-toolbar">
    <div class="branches-add-row"><button class="button button-primary" type="button" data-tat-add>${icon.add}Add TAT Rule</button></div>
    <div class="branches-filter-grid tat-filter-grid" role="search" aria-label="Filter TAT rules">
      <label class="facility-filter"><span>Coding Type</span><select data-tat-filter="codingType">${optionList(codingTypes, 'All coding types')}</select></label>
      <label class="facility-filter"><span>TAT</span><input type="search" data-tat-filter="tat" placeholder="Search days or hours"></label>
      <label class="facility-filter"><span>Visit Reason</span><select data-tat-filter="visitReason">${optionList(visitReasons, 'All visit reasons')}</select></label>
      <label class="facility-filter"><span>Contract</span><input type="search" data-tat-filter="contract" placeholder="Search contract"></label>
      <label class="facility-filter"><span>Payer Type</span><select data-tat-filter="payerType">${optionList(payerTypes, 'All payer types')}</select></label>
      <label class="facility-filter"><span>Authorization</span><select data-tat-filter="authorizationType">${optionList(authorizations, 'All authorization types')}</select></label>
    </div>
  </div>
  <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table tat-table"><thead><tr><th>Coding Type</th><th>TAT</th><th>Visit Reason</th><th>Contract</th><th>Payer Type</th><th>Authorization</th><th>Actions</th></tr></thead><tbody data-tat-rows></tbody></table></div>
    <div class="facility-empty" data-tat-empty hidden>No TAT rules match your filters.</div>
    <footer class="facility-pagination"><span data-tat-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-tat-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-tat-page="previous" aria-label="Previous page">‹</button><span data-tat-page-label></span><button class="icon-button" type="button" data-tat-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-tat-page="last" aria-label="Last page">»</button></div></footer>
  </div>`;

  const modal = document.createElement('div');
  modal.className = 'patient-modal-backdrop tat-modal-backdrop'; modal.id = 'tat-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal tat-modal" role="dialog" aria-modal="true" aria-labelledby="tat-modal-title" aria-describedby="tat-modal-description">
    <header class="patient-modal-header"><div><p class="eyebrow">BILLING RULE</p><h2 id="tat-modal-title">Add TAT Rule</h2><p id="tat-modal-description">Configure turnaround time requirements.</p></div><button type="button" class="icon-button" data-tat-close aria-label="Close dialog">×</button></header>
    <form data-tat-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">TAT Rule Information</legend><div class="facility-form-section-heading">TAT Rule Information</div><div class="patient-form-grid tat-form-grid">
      <label class="form-field"><span>Coding Type <b>*</b></span><select name="codingType" required>${optionList(codingTypes, 'Select Coding Type')}</select></label>
      <label class="form-field"><span>Payer Type <b>*</b></span><select name="payerType" required>${optionList(payerTypes, 'Select Payer Type')}</select></label>
      <label class="form-field"><span>Contract</span><select name="contractId" disabled><option value="">Select Contract</option></select><small class="tat-contract-hint" data-tat-contract-hint>Select a payer type to see available contracts.</small></label>
      <label class="form-field"><span>Visit Reason <b>*</b></span><select name="visitReason" required>${optionList(visitReasons, 'Select Visit Reason')}</select></label>
      <label class="form-field"><span>Authorization Type <b>*</b></span><select name="authorizationType" required>${optionList(authorizations, 'Select Authorization')}</select></label>
      <label class="form-field"><span>Day <b>*</b></span><input name="day" type="number" min="0" step="1" value="0" required></label>
      <label class="form-field"><span>Hours <b>*</b></span><input name="hours" type="number" min="0" max="23.59" step="0.01" value="1" required></label>
    </div></fieldset></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-tat-cancel>Cancel</button><button type="submit" class="button button-primary" data-tat-save>Create</button></div></footer></form>
  </section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-tat-form]');
  const toast = document.querySelector('[data-facility-toast]');
  const rowContainer = grid.querySelector('[data-tat-rows]');

  function persist() { try { localStorage.setItem(key, JSON.stringify(records)); } catch { /* Keep data available in the current page session. */ } }
  function notify(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); }
  function ruleTat(rule) {
    const days = Number(rule.day) || 0; const hours = Number(rule.hours) || 0;
    return `${days} ${days === 1 ? 'Day' : 'Days'} and ${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
  }
  function contractLabel(rule) {
    const contract = contracts.find((item) => item.id === rule.contractId);
    return contract ? contract.name : (rule.contractLabel || '—');
  }
  function closeMenus() { grid.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; }); grid.querySelectorAll('[data-tat-row-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false')); }
  function filtered() {
    return records.filter((rule) => Object.entries(filters).every(([field, value]) => {
      if (!value) return true;
      if (field === 'tat') return ruleTat(rule).toLocaleLowerCase().includes(value);
      if (field === 'contract') return contractLabel(rule).toLocaleLowerCase().includes(value);
      return String(rule[field] || '').toLocaleLowerCase().includes(value);
    }));
  }
  function renderGrid() {
    const matched = filtered(); const pages = Math.max(1, Math.ceil(matched.length / pageSize)); page = Math.min(page, pages);
    rowContainer.innerHTML = matched.slice((page - 1) * pageSize, page * pageSize).map((rule) => `<tr><td>${esc(rule.codingType)}</td><td>${esc(ruleTat(rule))}</td><td>${esc(rule.visitReason)}</td><td>${esc(contractLabel(rule))}</td><td>${esc(rule.payerType)}</td><td>${esc(rule.authorizationType)}</td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-tat-row-menu aria-label="Actions for ${esc(rule.codingType)} rule" aria-haspopup="menu" aria-expanded="false" data-tat-id="${esc(rule.id)}">${icon.more}</button><div class="facility-row-menu tat-row-menu" role="menu" hidden><button type="button" role="menuitem" data-tat-action="edit" data-tat-id="${esc(rule.id)}">${icon.edit}Edit</button><button type="button" role="menuitem" data-tat-action="delete" data-tat-id="${esc(rule.id)}">${icon.trash}Delete</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-tat-empty]').hidden = matched.length > 0;
    grid.querySelector('[data-tat-count]').textContent = `Total Results: ${matched.length}`;
    grid.querySelector('[data-tat-page-label]').textContent = `Page ${matched.length ? page : 0} of ${matched.length ? pages : 0}`;
    grid.querySelectorAll('[data-tat-page]').forEach((button) => { button.disabled = !matched.length || (['first', 'previous'].includes(button.dataset.tatPage) ? page === 1 : page === pages); });
  }
  function refreshContractOptions(selected = '') {
    const type = form.elements.payerType.value;
    const select = form.elements.contractId;
    const available = eligibleContracts(type);
    select.innerHTML = `<option value="">${type === 'Cash' ? 'Not applicable for Cash' : type ? (available.length ? 'Select Contract (optional)' : 'No matching contracts available') : 'Select payer type first'}</option>${available.map((contract) => `<option value="${esc(contract.id)}">${esc(contract.name)} — ${esc(payerNameForContract(contract))}</option>`).join('')}`;
    select.disabled = !type || type === 'Cash' || !available.length;
    if (available.some((contract) => contract.id === selected)) select.value = selected;
    modal.querySelector('[data-tat-contract-hint]').textContent = type === 'Cash'
      ? 'Cash rules do not use a contract.'
      : !type ? 'Select a payer type to see available contracts.'
        : available.length ? 'Optional: choose an active contract for a matching payer.'
          : 'No active contracts match this payer type; a contract is optional.';
  }
  function openModal(mode, record = null, trigger = document.activeElement) {
    activeId = record?.id || null; returnFocus = trigger; form.reset();
    modal.querySelector('#tat-modal-title').textContent = mode === 'new' ? 'Add TAT Rule' : 'Edit TAT Rule';
    modal.querySelector('#tat-modal-description').textContent = mode === 'new' ? 'Configure turnaround time requirements.' : 'Update turnaround time requirements.';
    modal.querySelector('[data-tat-save]').textContent = mode === 'new' ? 'Create' : 'Save changes';
    form.elements.day.value = record?.day ?? 0; form.elements.hours.value = record?.hours ?? 1;
    if (record) {
      form.elements.codingType.value = record.codingType || '';
      form.elements.payerType.value = record.payerType || '';
      form.elements.visitReason.value = record.visitReason || '';
      form.elements.authorizationType.value = record.authorizationType || '';
    }
    refreshContractOptions(record?.contractId || ''); modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-tat-close]').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); returnFocus?.focus?.(); }
  function save(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = { codingType: form.elements.codingType.value, payerType: form.elements.payerType.value, contractId: form.elements.contractId.value, contractLabel: form.elements.contractId.value ? (contracts.find((item) => item.id === form.elements.contractId.value)?.name || '') : '—', visitReason: form.elements.visitReason.value, authorizationType: form.elements.authorizationType.value, day: Number(form.elements.day.value), hours: Number(form.elements.hours.value) };
    if (values.hours < 0 || values.hours > 23.59) { form.elements.hours.setCustomValidity('Hours must be between 0 and 23.59.'); form.elements.hours.reportValidity(); form.elements.hours.setCustomValidity(''); return; }
    if (activeId) {
      const record = records.find((item) => item.id === activeId); if (!record) return;
      Object.assign(record, values); persist(); closeModal(); renderGrid(); notify('TAT rule was updated successfully.');
    } else {
      records.push({ ...values, id: `tat-rule-${crypto.randomUUID()}` }); persist(); closeModal(); renderGrid(); notify('TAT rule was created successfully.');
    }
  }
  function askDelete(record) {
    const confirmModal = document.createElement('div'); confirmModal.className = 'patient-modal-backdrop tat-confirm-backdrop';
    confirmModal.innerHTML = `<section class="patient-modal tat-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="tat-confirm-title"><header class="patient-modal-header"><div><p class="eyebrow">DELETE RULE</p><h2 id="tat-confirm-title">Delete TAT Rule?</h2><p>This will permanently remove the rule for ${esc(record.codingType)} (${esc(ruleTat(record))}).</p></div><button type="button" class="icon-button" data-tat-confirm-close aria-label="Close dialog">×</button></header><footer class="patient-modal-footer"><span></span><div><button type="button" class="button button-secondary" data-tat-delete-cancel>Cancel</button><button type="button" class="button button-destructive" data-tat-delete-confirm>Delete</button></div></footer></section>`;
    document.body.append(confirmModal); document.body.classList.add('patient-modal-open');
    const close = () => { confirmModal.remove(); if (modal.hidden) document.body.classList.remove('patient-modal-open'); };
    confirmModal.querySelector('[data-tat-delete-cancel]').addEventListener('click', close);
    confirmModal.querySelector('[data-tat-confirm-close]').addEventListener('click', close);
    confirmModal.addEventListener('click', (event) => { if (event.target === confirmModal) close(); });
    confirmModal.querySelector('[data-tat-delete-confirm]').addEventListener('click', () => {
      records = records.filter((item) => item.id !== record.id); persist(); close(); renderGrid(); notify('TAT rule was deleted successfully.');
    });
    confirmModal.querySelector('[data-tat-delete-cancel]').focus();
  }

  grid.querySelectorAll('[data-tat-filter]').forEach((control) => control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', () => { filters[control.dataset.tatFilter] = control.value.trim().toLocaleLowerCase(); page = 1; closeMenus(); renderGrid(); }));
  grid.querySelectorAll('[data-tat-page]').forEach((button) => button.addEventListener('click', () => {
    const pages = Math.max(1, Math.ceil(filtered().length / pageSize));
    if (button.dataset.tatPage === 'first') page = 1; if (button.dataset.tatPage === 'previous') page = Math.max(1, page - 1); if (button.dataset.tatPage === 'next') page = Math.min(pages, page + 1); if (button.dataset.tatPage === 'last') page = pages; renderGrid();
  }));
  grid.querySelector('[data-tat-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-tat-row-menu]');
    if (trigger) { const menu = trigger.nextElementSibling; const wasOpen = !menu.hidden; closeMenus(); menu.hidden = wasOpen; trigger.setAttribute('aria-expanded', String(!wasOpen)); return; }
    const action = event.target.closest('[data-tat-action]'); if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const record = records.find((item) => item.id === action.dataset.tatId); if (!record) return;
    const actionTrigger = action.closest('.facility-row-action').querySelector('[data-tat-row-menu]'); closeMenus();
    if (action.dataset.tatAction === 'edit') openModal('edit', record, actionTrigger); else askDelete(record);
  });
  form.elements.payerType.addEventListener('change', () => { form.elements.contractId.value = ''; refreshContractOptions(); });
  form.addEventListener('submit', save);
  modal.querySelector('[data-tat-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-tat-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  renderGrid();
})();
