(() => {
  const root = document.querySelector('[data-premium-pricing]');
  if (!root) return;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg>',
    export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>',
  };
  let records = [
    { id: 'premium-newborn', name: 'Newborn Essential Subscription', description: 'Daily subscription fees for newborn care services.', alias: 'Newborn Essential', active: true, isNewBorn: true, fees: [{ id: 'fee-nb-1', type: 'Day', isNewBorn: true, from: '0', to: '30', fees: '74.00', vat: '15', billingPeriod: 'Daily', updatedBy: 'admin' }] },
    { id: 'premium-family', name: 'Family Care Subscription', description: 'Monthly premium subscription for family outpatient services.', alias: 'Family Care', active: true, isNewBorn: false, fees: [{ id: 'fee-family-1', type: 'Year', from: '0', to: '17', fees: '115.00', vat: '15', billingPeriod: 'Monthly', updatedBy: 'admin' }, { id: 'fee-family-2', type: 'Year', from: '18', to: '64', fees: '148.00', vat: '15', billingPeriod: 'Monthly', updatedBy: 'admin' }] },
    { id: 'premium-senior', name: 'Senior Wellness Premium', description: 'Annual premium subscription for older adult wellness.', alias: 'Senior Wellness', active: true, isNewBorn: false, fees: [{ id: 'fee-senior-1', type: 'Year', from: '65', to: '110', fees: '790.00', vat: '15', billingPeriod: 'Annual', updatedBy: 'admin' }] },
    { id: 'premium-visit', name: 'Short Stay Care Subscription', description: 'Specific-period subscription for temporary care packages.', alias: 'Short Stay', active: false, isNewBorn: false, fees: [{ id: 'fee-stay-1', type: 'Day', from: '0', to: '90', fees: '210.00', vat: '15', billingPeriod: 'Specific Period', updatedBy: 'admin' }] },
  ];
  let query = '';
  let screenMode = 'list';
  let activeId = null;
  let draft = null;
  let editingFeeId = null;
  let deactivatingId = null;
  let toastTimer;

  root.innerHTML = `
    <section data-premium-list-screen>
      <div class="premium-toolbar"><div class="premium-toolbar-actions"><button class="button button-primary" type="button" data-premium-add>${icons.add}Add Premium Pricing</button><button class="button button-secondary" type="button" data-premium-export>${icons.export}Export</button><button class="button button-secondary" type="button" data-premium-sample>${icons.export}Download Sample</button><button class="button button-secondary" type="button" data-premium-upload>${icons.upload}Upload</button></div></div>
      <div class="branches-filter-grid premium-filter-grid" aria-label="Filter Premium Pricing"><label class="facility-filter"><span>Name</span><input type="search" data-premium-filter placeholder="Filter by name"></label></div>
      <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table premium-list-table"><thead><tr><th>Name</th><th>Description</th><th>Alias</th><th>Status</th><th>Actions</th></tr></thead><tbody data-premium-rows></tbody></table></div><div class="facility-empty" data-premium-empty hidden>No Premium Pricing records match this name.</div><footer class="facility-pagination"><span data-premium-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-premium-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-premium-page="previous" aria-label="Previous page">‹</button><span data-premium-page-label></span><button class="icon-button" type="button" data-premium-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-premium-page="last" aria-label="Last page">»</button></div></footer></div>
    </section>
    <section class="premium-form-screen" data-premium-form-screen hidden></section>
    <div class="patient-modal-backdrop premium-confirm-backdrop" data-premium-confirm hidden><section class="patient-modal premium-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="premium-confirm-title"><header class="patient-modal-header"><div><p class="eyebrow">STATUS CHANGE</p><h2 id="premium-confirm-title">Deactivate Premium Pricing</h2><p>Are you sure you want to deactivate this item?</p></div><button class="icon-button" type="button" data-premium-confirm-close aria-label="Close confirmation">${icons.close}</button></header><form data-premium-confirm-form><div class="patient-modal-body"><label class="form-field"><span>Reason <b>*</b></span><select name="reason" required><option value="">Select a reason</option><option>Based on management direction</option><option>Other</option></select></label></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required field</span><div><button class="button button-secondary" type="button" data-premium-confirm-close>Cancel</button><button class="button button-primary" type="submit">Deactivate</button></div></footer></form></section></div>
    <div class="facility-toast" data-premium-toast role="status" aria-live="polite"></div>`;

  const listScreen = root.querySelector('[data-premium-list-screen]');
  const formScreen = root.querySelector('[data-premium-form-screen]');
  const confirmModal = root.querySelector('[data-premium-confirm]');
  const confirmForm = root.querySelector('[data-premium-confirm-form]');
  let page = 1;
  const pageSize = 8;

  function totalWithVat(fee) { return (Number(fee.fees || 0) * (1 + Number(fee.vat || 0) / 100)).toFixed(2); }
  function showToast(message) { const toast = root.querySelector('[data-premium-toast]'); toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800); }
  function renderList() {
    const matching = records.filter((record) => `${record.name} ${record.alias}`.toLowerCase().includes(query));
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    root.querySelector('[data-premium-rows]').innerHTML = visible.map((record) => `<tr><td><span class="facility-name-en">${esc(record.name)}</span></td><td><span class="premium-description">${esc(record.description)}</span></td><td>${esc(record.alias)}</td><td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-premium-menu aria-label="Actions for ${esc(record.name)}" aria-haspopup="menu" aria-expanded="false" data-id="${esc(record.id)}">${icons.more}</button><div class="facility-row-menu premium-row-menu" role="menu" hidden><button type="button" role="menuitem" data-premium-action="edit" data-id="${esc(record.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-premium-action="status" data-id="${esc(record.id)}">${record.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    root.querySelector('[data-premium-empty]').hidden = matching.length > 0;
    root.querySelector('[data-premium-count]').textContent = `Total Results: ${matching.length}`;
    root.querySelector('[data-premium-page-label]').textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-premium-page]').forEach((button) => { button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.premiumPage) ? page === 1 : page === pages); });
  }
  function feeRows() {
    if (!draft.fees.length) return '<tr><td colspan="9" class="premium-no-fees">No subscription fees added.</td></tr>';
    return draft.fees.map((fee, index) => `<tr><td>${fee.isNewBorn ? 'Newborn' : `${esc(fee.type || 'Age')} group`}</td><td>${esc(fee.from || '—')}</td><td>${esc(fee.to || '—')}</td><td>${esc(fee.fees)}</td><td>${esc(fee.vat)}%</td><td>${totalWithVat(fee)}</td><td>${esc(fee.billingPeriod)}</td><td><div class="premium-fee-row-actions"><button class="icon-button" type="button" data-premium-fee-edit="${esc(fee.id)}" aria-label="Edit subscription fee row ${index + 1}">${icons.edit}</button><button class="icon-button premium-delete-fee" type="button" data-premium-fee-delete="${esc(fee.id)}" aria-label="Delete subscription fee row ${index + 1}">${icons.trash}</button></div></td><td>${esc(fee.updatedBy || 'admin')}</td></tr>`).join('');
  }
  function renderForm() {
    const record = draft;
    const isEdit = screenMode === 'edit';
    formScreen.innerHTML = `<div class="premium-form-heading"><div><button class="price-list-back" type="button" data-premium-back>← Premium Pricing</button><p class="eyebrow">PREMIUM SUBSCRIPTION</p><h2>${isEdit ? 'Edit Premium Pricing' : 'Add Premium Pricing'}</h2><p>${isEdit ? 'Update the premium pricing details and subscription fees.' : 'Set up premium pricing and its subscription fee bands.'}</p></div><button class="button button-secondary" type="button" data-premium-cancel>Cancel</button></div>
      <form data-premium-record-form><section class="premium-form-card"><div class="facility-form-section-heading">Pricing</div><div class="premium-record-fields"><label class="form-field"><span>Name <b>*</b></span><input name="name" required maxlength="100" value="${esc(record.name)}"></label><label class="form-field"><span>Description <b>*</b></span><input name="description" required maxlength="250" value="${esc(record.description)}"></label><label class="form-field"><span>Alias <b>*</b></span><input name="alias" required maxlength="100" value="${esc(record.alias)}"></label></div></section>
      <section class="premium-form-card"><div class="facility-form-section-heading">Subscription Fees</div><label class="premium-newborn-check"><input type="checkbox" name="isNewBorn" ${record.isNewBorn ? 'checked' : ''}><span>Is New Born</span></label><div class="premium-fee-editor"><label class="form-field"><span>Type</span><select name="feeType"><option>Day</option><option ${record.feeDraft.type === 'Year' ? 'selected' : ''}>Year</option></select></label><label class="form-field"><span>From</span><input name="feeFrom" type="number" min="0" value="${esc(record.feeDraft.from)}"></label><label class="form-field"><span>To</span><input name="feeTo" type="number" min="0" value="${esc(record.feeDraft.to)}"></label><label class="form-field"><span>Fees <b>*</b></span><input name="feeAmount" type="number" min="0" step="0.01" required value="${esc(record.feeDraft.fees)}" data-premium-fee-input="fees"></label><label class="form-field"><span>VAT% Applied <b>*</b></span><input name="feeVat" type="number" min="0" step="0.01" required value="${esc(record.feeDraft.vat)}" data-premium-fee-input="vat"></label><label class="form-field"><span>Total Fees</span><input name="feeTotal" readonly value="${esc(totalWithVat(record.feeDraft))}" data-premium-total></label><label class="form-field"><span>Billing Period</span><select name="billingPeriod"><option>Daily</option><option ${record.feeDraft.billingPeriod === 'Monthly' ? 'selected' : ''}>Monthly</option><option ${record.feeDraft.billingPeriod === 'Annual' ? 'selected' : ''}>Annual</option><option ${record.feeDraft.billingPeriod === 'Specific Period' ? 'selected' : ''}>Specific Period</option></select></label><button class="button button-secondary premium-add-fee" type="button" data-premium-fee-add>${icons.add}${editingFeeId ? 'Update Entry' : 'Add Entry'}</button></div>
        <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table premium-fees-table"><thead><tr><th>Age Group</th><th>From</th><th>To</th><th>Fees</th><th>Fees VAT</th><th>Total Fees</th><th>Billing Period</th><th>Actions</th><th>Updated By</th></tr></thead><tbody data-premium-fee-rows>${feeRows()}</tbody></table></div></div></section>
      <div class="premium-form-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-premium-cancel>Cancel</button><button class="button button-primary" type="submit">${isEdit ? 'Save' : 'Create'}</button></div></div></form>`;
    const currentAmount = formScreen.querySelector('[name="feeAmount"]');
    const currentVat = formScreen.querySelector('[name="feeVat"]');
    if (!record.feeDraft.fees && !isEdit && !editingFeeId) formScreen.querySelector('[data-premium-total]').value = '0.00';
    [currentAmount, currentVat].forEach((input) => input.addEventListener('input', () => {
      record.feeDraft.fees = currentAmount.value;
      record.feeDraft.vat = currentVat.value;
      formScreen.querySelector('[data-premium-total]').value = totalWithVat(record.feeDraft);
    }));
    formScreen.querySelector('[name="feeType"]').addEventListener('change', (event) => { record.feeDraft.type = event.target.value; });
    formScreen.querySelector('[name="feeFrom"]').addEventListener('input', (event) => { record.feeDraft.from = event.target.value; });
    formScreen.querySelector('[name="feeTo"]').addEventListener('input', (event) => { record.feeDraft.to = event.target.value; });
    formScreen.querySelector('[name="billingPeriod"]').addEventListener('change', (event) => { record.feeDraft.billingPeriod = event.target.value; });
    formScreen.querySelector('[name="isNewBorn"]').addEventListener('change', (event) => { record.isNewBorn = event.target.checked; });
  }
  function openForm(mode, id = null) {
    screenMode = mode;
    activeId = id;
    const record = records.find((item) => item.id === id);
    draft = mode === 'edit' ? { ...record, fees: record.fees.map((fee) => ({ ...fee })), feeDraft: { type: 'Day', from: '0', to: '', fees: '', vat: '15', billingPeriod: 'Monthly' } } : { id: '', name: '', description: '', alias: '', active: true, isNewBorn: false, fees: [], feeDraft: { type: 'Day', from: '0', to: '', fees: '', vat: '15', billingPeriod: 'Monthly' } };
    editingFeeId = null;
    listScreen.hidden = true;
    formScreen.hidden = false;
    renderForm();
  }
  function closeConfirmation() { confirmModal.hidden = true; document.body.classList.remove('modal-open'); deactivatingId = null; }
  function closeMenus() { root.querySelectorAll('.premium-row-menu').forEach((menu) => { menu.hidden = true; menu.parentElement.querySelector('[data-premium-menu]').setAttribute('aria-expanded', 'false'); }); }

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-premium-filter]')) { query = event.target.value.toLowerCase(); page = 1; renderList(); }
    else if (event.target.name && ['name', 'description', 'alias'].includes(event.target.name) && event.target.closest('[data-premium-record-form]')) draft[event.target.name] = event.target.value;
  });
  root.addEventListener('click', (event) => {
    const menuButton = event.target.closest('[data-premium-menu]');
    if (menuButton) { const menu = menuButton.nextElementSibling; const willOpen = menu.hidden; closeMenus(); menu.hidden = !willOpen; menuButton.setAttribute('aria-expanded', String(willOpen)); return; }
    const rowAction = event.target.closest('[data-premium-action]');
    if (rowAction) {
      const record = records.find((item) => item.id === rowAction.dataset.id);
      closeMenus();
      if (rowAction.dataset.premiumAction === 'edit') openForm('edit', record.id);
      else if (record.active) { deactivatingId = record.id; root.querySelector('[name="reason"]').value = ''; confirmModal.hidden = false; document.body.classList.add('modal-open'); }
      else { record.active = true; renderList(); showToast('Premium Pricing activated for this preview.'); }
      return;
    }
    if (event.target.closest('[data-premium-add]')) { openForm('add'); return; }
    if (event.target.closest('[data-premium-export], [data-premium-sample], [data-premium-upload]')) { showToast('This prototype control is for screen preview only.'); return; }
    if (event.target.closest('[data-premium-back], [data-premium-cancel]')) { formScreen.hidden = true; listScreen.hidden = false; renderList(); return; }
    if (event.target.closest('[data-premium-fee-add]')) {
      const feeAmount = formScreen.querySelector('[name="feeAmount"]');
      const feeVat = formScreen.querySelector('[name="feeVat"]');
      if (!feeAmount.reportValidity() || !feeVat.reportValidity()) return;
      const fee = { ...draft.feeDraft, isNewBorn: draft.isNewBorn, updatedBy: 'admin' };
      if (editingFeeId) draft.fees = draft.fees.map((item) => item.id === editingFeeId ? { ...item, ...fee } : item);
      else draft.fees.push({ ...fee, id: `draft-${Date.now()}` });
      draft.feeDraft = { type: 'Day', from: '0', to: '', fees: '', vat: '15', billingPeriod: 'Monthly' };
      editingFeeId = null;
      renderForm();
      showToast('Subscription fee updated in this preview.');
      return;
    }
    const editFee = event.target.closest('[data-premium-fee-edit]');
    if (editFee) {
      const fee = draft.fees.find((item) => item.id === editFee.dataset.premiumFeeEdit);
      if (fee) { draft.feeDraft = { ...fee }; draft.isNewBorn = Boolean(fee.isNewBorn || draft.isNewBorn); editingFeeId = fee.id; renderForm(); }
      return;
    }
    const deleteFee = event.target.closest('[data-premium-fee-delete]');
    if (deleteFee) { draft.fees = draft.fees.filter((fee) => fee.id !== deleteFee.dataset.premiumFeeDelete); renderForm(); showToast('Subscription fee removed from this preview.'); return; }
    if (event.target.closest('[data-premium-confirm-close]')) { closeConfirmation(); return; }
    const pageButton = event.target.closest('[data-premium-page]');
    if (pageButton) { const pages = Math.max(1, Math.ceil(records.filter((record) => `${record.name} ${record.alias}`.toLowerCase().includes(query)).length / pageSize)); const next = { first: 1, previous: page - 1, next: page + 1, last: pages }[pageButton.dataset.premiumPage]; page = Math.max(1, Math.min(pages, next)); renderList(); }
  });
  root.addEventListener('submit', (event) => {
    if (event.target.matches('[data-premium-record-form]')) { event.preventDefault(); if (event.target.reportValidity()) showToast('Screen preview only — Premium Pricing changes are not saved.'); }
    if (event.target.matches('[data-premium-confirm-form]')) {
      event.preventDefault();
      if (!event.target.reportValidity()) return;
      const record = records.find((item) => item.id === deactivatingId);
      if (record) record.active = false;
      closeConfirmation();
      renderList();
      showToast('Premium Pricing deactivated for this preview.');
    }
  });
  confirmModal.addEventListener('click', (event) => { if (event.target === confirmModal) closeConfirmation(); });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) closeMenus(); });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (!confirmModal.hidden) closeConfirmation(); else if (!formScreen.hidden) { formScreen.hidden = true; listScreen.hidden = false; } } });
  root.hidden = location.hash.slice(1) !== 'premium-pricing';
  renderList();
})();
