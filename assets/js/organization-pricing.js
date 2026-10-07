(() => {
  const facilities = (() => { try { const rows = JSON.parse(localStorage.getItem('rcm-facilities:v1') || '[]'); return Array.isArray(rows) ? rows.filter((row) => Number(row.id) <= 6) : []; } catch { return []; } })();
  if (!facilities.length) return;
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const priceKey = (id) => `rcm-facility-price-lists:v1:${id}`;
  const premiumKey = (id) => `rcm-facility-premium-pricing:v1:${id}`;
  const serviceItems = (id) => { try { const items = JSON.parse(localStorage.getItem(`rcm-facility-service-items:v1:${id}`) || '[]'); return Array.isArray(items) ? items : []; } catch { return []; } };
  const priceSeeds = [
    { id: 'pl-ambulatory', name: 'Price List 1', description: 'Outpatient service schedule', status: 'Active', discountRate: '0', startDate: '2026-09-01', endDate: '', versions: [{ version: 1, status: 'Active', startDate: '2026-09-01', endDate: '', entries: [] }] },
    { id: 'pl-diagnostics', name: 'Price List 2', description: 'Diagnostic service schedule', status: 'Active', discountRate: '0.03', startDate: '2026-07-01', endDate: '', versions: [{ version: 1, status: 'Active', startDate: '2026-07-01', endDate: '', entries: [] }] },
  ];
  const premiumSeeds = [
    { id: 'premium-newborn', name: 'Premium Pricing 1', description: 'Newborn subscription fees', alias: 'Newborn', active: true, isNewBorn: true, fees: [{ id: 'fee-nb-1', type: 'Day', isNewBorn: true, from: '0', to: '30', fees: '74.00', vat: '15', billingPeriod: 'Daily', updatedBy: 'admin' }] },
    { id: 'premium-family', name: 'Premium Pricing 2', description: 'Family subscription fees', alias: 'Family', active: true, isNewBorn: false, fees: [{ id: 'fee-family-1', type: 'Year', from: '0', to: '17', fees: '115.00', vat: '15', billingPeriod: 'Monthly', updatedBy: 'admin' }] },
  ];
  function priceSeedsFor(facilityId) {
    const available = new Map(serviceItems(facilityId).map((item) => [item.code, item]));
    const codes = [...available.keys()];
    return structuredClone(priceSeeds).map((record, index) => ({ ...record, versions: record.versions.map((version) => ({ ...version, entries: codes.slice(index, index + 4).map((code, entryIndex) => ({ code, discount: entryIndex === 1 ? '0.05' : '0', price: entryIndex === 2 ? '' : `${45 + entryIndex * 28}.00`, vat: 'Standard', approval: entryIndex === 2 ? '101' : '100' })) })) }));
  }
  function load(key, seed) {
    try { const value = localStorage.getItem(key); if (value !== null) { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed; } localStorage.setItem(key, JSON.stringify(seed)); } catch { /* best effort browser storage */ }
    return seed;
  }
  function save(key, rows) { try { localStorage.setItem(key, JSON.stringify(rows)); } catch { /* retain current view */ } }
  const facilityName = (id) => facilities.find((facility) => String(facility.id) === String(id))?.englishName || `Facility ${id}`;
  const allPrice = () => facilities.flatMap((facility) => load(priceKey(facility.id), priceSeedsFor(facility.id)).map((record) => ({ ...record, facilityId: String(facility.id) })));
  const allPremium = () => facilities.flatMap((facility) => load(premiumKey(facility.id), structuredClone(premiumSeeds)).map((record) => ({ ...record, facilityId: String(facility.id) })));
  const master = document.querySelector('[data-organization-pricing-route="master-price-list"]');
  if (master) {
    const select = master.querySelector('[data-org-master-facility]');
    const frame = master.querySelector('[data-org-master-frame]');
    select.innerHTML = facilities.map((item) => `<option value="${esc(item.id)}">${esc(item.englishName)}</option>`).join('');
    const openMaster = () => { const url = new URL('../facility/settings/index.html', location.href); url.searchParams.set('embed', 'organization'); url.searchParams.set('facilityId', select.value); url.hash = 'master-price-list'; frame.src = url.href; };
    select.addEventListener('change', openMaster); openMaster();
  }
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.data?.type !== 'rcm:facility-embed-size') return;
    const frame = [...document.querySelectorAll('.organization-pricing-frame')].find((item) => item.contentWindow === event.source);
    const height = Number(event.data.height);
    if (frame && Number.isFinite(height) && height > 0) frame.style.height = `${Math.min(Math.ceil(height), 20000)}px`;
  });
  function mountList(route, kind) {
    const root = document.querySelector(`[data-organization-pricing-route="${route}"]`); if (!root) return;
    const isPrice = kind === 'price';
    const label = isPrice ? 'Price List' : 'Premium Pricing';
    const rows = () => isPrice ? allPrice() : allPremium();
    let query = '', facilityFilter = '', statusFilter = '', page = 1;
    root.innerHTML = `<div data-org-list-ui><div class="facility-toolbar"><div class="facility-toolbar-primary"><button class="button button-primary" type="button" data-org-add>＋ Add ${label}</button>${isPrice ? '<button class="button button-secondary" type="button" disabled>Export</button><button class="button button-secondary" type="button" disabled>Download Sample</button><button class="button button-secondary" type="button" disabled>Upload</button>' : ''}</div></div>
      <div class="facility-filter-grid"><label class="facility-filter"><span>Name</span><input type="search" data-org-filter-name placeholder="Filter by name"></label><label class="facility-filter"><span>Facility</span><select data-org-filter-facility><option value="">All facilities</option>${facilities.map((item) => `<option value="${esc(item.id)}">${esc(item.englishName)}</option>`).join('')}</select></label><label class="facility-filter"><span>Status</span><select data-org-filter-status><option value="">All statuses</option><option>Active</option><option>Inactive</option></select></label></div>
      <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table"><thead><tr><th>Facility</th><th>Name</th><th>Description</th>${isPrice ? '' : '<th>Alias</th>'}<th>Status</th><th>Actions</th></tr></thead><tbody data-org-rows></tbody></table></div><div class="facility-empty" data-org-empty hidden>No ${label} records match these filters.</div><footer class="facility-pagination"><span data-org-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-org-page="first">«</button><button class="icon-button" type="button" data-org-page="previous">‹</button><span data-org-page-label></span><button class="icon-button" type="button" data-org-page="next">›</button><button class="icon-button" type="button" data-org-page="last">»</button></div></footer></div></div>
      <div class="patient-modal-backdrop" data-org-pricing-modal hidden><section class="patient-modal" role="dialog" aria-modal="true" aria-labelledby="org-pricing-title"><header class="patient-modal-header"><div><p class="eyebrow">ORGANIZATION PRICING</p><h2 id="org-pricing-title">Add ${label}</h2><p>Create an independent copy for each selected facility.</p></div><button class="icon-button" type="button" data-org-modal-close aria-label="Close">×</button></header><form data-org-pricing-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">${label} details</legend><div class="facility-form-section-heading">${label} Details</div><div class="patient-form-grid"><label class="form-field"><span>Name <b>*</b></span><input name="name" required maxlength="100"></label><label class="form-field"><span>Description <b>*</b></span><input name="description" required maxlength="250"></label>${isPrice ? '<label class="form-field"><span>Discount Rate</span><input name="discountRate" type="number" min="0" max="1" step="0.01" value="0"></label><label class="form-field"><span>Start Date <b>*</b></span><input name="startDate" type="date" required></label><label class="form-field"><span>End Date</span><input name="endDate" type="date"></label>' : '<label class="form-field"><span>Alias <b>*</b></span><input name="alias" required maxlength="100"></label>'}</div></fieldset><fieldset class="patient-form-section"><legend class="sr-only">Facility assignment</legend><div class="facility-form-section-heading">Facility Assignment</div><div class="facility-assignment-options">${facilities.map((item) => `<label class="form-check"><input type="checkbox" name="facilityIds" value="${esc(item.id)}"><span>${esc(item.englishName)}</span></label>`).join('')}</div></fieldset><div data-org-price-items hidden></div></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-org-modal-close>Cancel</button><button class="button button-primary" type="submit">Create</button></div></footer></form></section></div>
      <div class="patient-modal-backdrop" data-org-deactivate-modal hidden><section class="patient-modal" role="dialog" aria-modal="true"><header class="patient-modal-header"><div><p class="eyebrow">STATUS CHANGE</p><h2>Deactivate Premium Pricing</h2><p>Choose a reason to continue.</p></div><button class="icon-button" type="button" data-org-deactivate-cancel aria-label="Close">×</button></header><form data-org-deactivate-form><div class="patient-modal-body"><label class="form-field"><span>Reason <b>*</b></span><select name="reason" required><option value="">Select a reason</option><option>Based on management direction</option><option>Other</option></select></label></div><footer class="patient-modal-footer"><span></span><div><button class="button button-secondary" type="button" data-org-deactivate-cancel>Cancel</button><button class="button button-primary">Deactivate</button></div></footer></form></section></div><div class="facility-toast" data-org-toast role="status" aria-live="polite"></div>`;
    const modal = root.querySelector('[data-org-pricing-modal]'); let priceItemArea = root.querySelector('[data-org-price-items]'); const deactivateModal = root.querySelector('[data-org-deactivate-modal]'); const listUI = root.querySelector('[data-org-list-ui]'); const detailPane = document.createElement('div'); detailPane.className = 'organization-pricing-detail'; detailPane.hidden = true; root.appendChild(detailPane); let pendingDeactivate = null; let premiumFeeDrafts = []; let newbornDraft = false;
    if (!isPrice) {
      priceItemArea.outerHTML = `<fieldset class="patient-form-section" data-org-premium-fee-section><legend class="sr-only">Subscription fees</legend><div class="facility-form-section-heading">Subscription Fees</div><label class="form-check"><input type="checkbox" name="isNewBorn"><span>Is New Born</span></label><div class="patient-form-grid"><label class="form-field"><span>Type</span><select data-org-fee-type><option>Day</option><option>Year</option></select></label><label class="form-field"><span>From</span><input type="number" min="0" value="0" data-org-fee-from></label><label class="form-field"><span>To</span><input type="number" min="0" data-org-fee-to></label><label class="form-field"><span>Fees</span><input type="number" min="0" step="0.01" data-org-fee-amount></label><label class="form-field"><span>VAT% Applied</span><input type="number" min="0" step="0.01" value="15" data-org-fee-vat></label><label class="form-field"><span>Billing Period</span><select data-org-fee-period><option>Daily</option><option>Monthly</option><option>Annual</option><option>Specific Period</option></select></label><div class="form-field"><span>&nbsp;</span><button class="button button-secondary" type="button" data-org-fee-add>Add Fee Entry</button></div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table"><thead><tr><th>Age Group</th><th>From</th><th>To</th><th>Fees</th><th>Fees VAT</th><th>Total Fees</th><th>Billing Period</th><th>Actions</th></tr></thead><tbody data-org-fee-rows><tr><td colspan="8">No subscription fees added.</td></tr></tbody></table></div></div></fieldset>`;
    } else priceItemArea = root.querySelector('[data-org-price-items]');
    const premiumFeeRows = root.querySelector('[data-org-fee-rows]');
    const renderPremiumFees = () => { if (!premiumFeeRows) return; premiumFeeRows.innerHTML = premiumFeeDrafts.length ? premiumFeeDrafts.map((fee, index) => `<tr><td>${fee.isNewBorn ? 'Newborn' : `${esc(fee.type)} group`}</td><td>${esc(fee.from)}</td><td>${esc(fee.to || '—')}</td><td>${esc(fee.fees)}</td><td>${esc(fee.vat)}%</td><td>${(Number(fee.fees) * (1 + Number(fee.vat) / 100)).toFixed(2)}</td><td>${esc(fee.billingPeriod)}</td><td><button class="icon-button" type="button" data-org-fee-remove="${index}" aria-label="Remove fee">×</button></td></tr>`).join('') : '<tr><td colspan="8">No subscription fees added.</td></tr>'; };
    function render() {
      const filtered = rows().filter((item) => (!query || `${item.name} ${item.description} ${item.alias || ''}`.toLowerCase().includes(query)) && (!facilityFilter || item.facilityId === facilityFilter) && (!statusFilter || (isPrice ? item.status : item.active ? 'Active' : 'Inactive') === statusFilter));
      const pages = Math.max(1, Math.ceil(filtered.length / 8)); page = Math.min(page, pages); const visible = filtered.slice((page - 1) * 8, page * 8);
      root.querySelector('[data-org-rows]').innerHTML = visible.map((item) => { const status = isPrice ? item.status : item.active ? 'Active' : 'Inactive'; return `<tr><td>${esc(facilityName(item.facilityId))}</td><td><span class="facility-name-en">${esc(item.name)}</span></td><td>${esc(item.description)}</td>${isPrice ? '' : `<td>${esc(item.alias)}</td>`}<td><span class="facility-status ${status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${status}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-org-menu aria-label="Actions for ${esc(item.name)}">•••</button><div class="facility-row-menu" role="menu" hidden><button type="button" data-org-action="${isPrice ? 'view' : 'edit'}" data-id="${esc(item.id)}" data-facility="${esc(item.facilityId)}">${isPrice ? 'View' : 'Edit'}</button><button type="button" data-org-action="edit" data-id="${esc(item.id)}" data-facility="${esc(item.facilityId)}">Edit</button><button type="button" data-org-action="status" data-id="${esc(item.id)}" data-facility="${esc(item.facilityId)}">${status === 'Active' ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`; }).join('');
      root.querySelector('[data-org-empty]').hidden = filtered.length > 0; root.querySelector('[data-org-count]').textContent = `Total Results: ${filtered.length}`; root.querySelector('[data-org-page-label]').textContent = `Page ${filtered.length ? page : 0} of ${filtered.length ? pages : 0}`;
    }
    function createItemsPicker(selectedIds) {
      if (!isPrice) return;
      priceItemArea.hidden = false;
      priceItemArea.innerHTML = facilities.map((facility) => { const items = serviceItems(facility.id); return `<fieldset class="patient-form-section" data-org-item-facility="${esc(facility.id)}"><legend class="sr-only">${esc(facility.englishName)} service items</legend><div class="facility-form-section-heading">${esc(facility.englishName)} · Service Items</div><div class="facility-assignment-options">${items.length ? items.map((item) => `<label class="form-check"><input type="checkbox" name="items-${esc(facility.id)}" value="${esc(item.code)}" ${selectedIds?.[facility.id]?.includes(item.code) ? 'checked' : ''}><span>${esc(item.code)} · ${esc(item.shortDescription || item.longDescription || item.code)}</span></label>`).join('') : '<p class="muted">No saved service items for this facility.</p>'}</div></fieldset>`; }).join('');
    }
    root.addEventListener('input', (event) => { if (event.target.matches('[data-org-filter-name]')) { query = event.target.value.toLowerCase(); page = 1; render(); } });
    root.addEventListener('change', (event) => { if (event.target.matches('[data-org-filter-facility]')) facilityFilter = event.target.value; if (event.target.matches('[data-org-filter-status]')) statusFilter = event.target.value; if (event.target.matches('[data-org-filter-facility], [data-org-filter-status]')) { page = 1; render(); } });
    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-org-action]');
      if (action) {
        const { id, facility: fid } = action.dataset; const status = rows().find((item) => String(item.id) === id && item.facilityId === fid); if (!status) return;
        if (action.dataset.orgAction === 'status') {
          if (!isPrice && status.active) { pendingDeactivate = { id, fid }; deactivateModal.hidden = false; return; }
          const list = load(isPrice ? priceKey(fid) : premiumKey(fid), []); const target = list.find((row) => String(row.id) === id); if (target) { if (isPrice) target.status = target.status === 'Active' ? 'Inactive' : 'Active'; else target.active = !target.active; save(isPrice ? priceKey(fid) : premiumKey(fid), list); }
          render(); root.querySelector('[data-org-toast]').textContent = `${label} status updated.`; root.querySelector('[data-org-toast]').classList.add('is-visible'); return;
        }
        const url = new URL('../facility/settings/index.html', location.href); url.searchParams.set('embed', 'organization'); url.searchParams.set('facilityId', fid); url.searchParams.set('recordId', id); url.searchParams.set('mode', action.dataset.orgAction); url.hash = route;
        detailPane.innerHTML = `<div class="organization-pricing-embedded-heading"><button class="button button-secondary" type="button" data-org-embedded-back>← ${label}</button><span>${esc(facilityName(fid))}</span></div><iframe class="organization-pricing-frame" title="${label} details" src="${esc(url.href)}"></iframe>`; listUI.hidden = true; detailPane.hidden = false; return;
      }
      if (event.target.closest('[data-org-menu]')) { const menu = event.target.closest('[data-org-menu]').nextElementSibling; menu.hidden = !menu.hidden; return; }
      if (event.target.closest('[data-org-add]')) { premiumFeeDrafts = []; newbornDraft = false; renderPremiumFees(); modal.hidden = false; createItemsPicker(); document.body.classList.add('modal-open'); return; }
      if (event.target.closest('[data-org-fee-add]')) {
        const amount = root.querySelector('[data-org-fee-amount]'); const vat = root.querySelector('[data-org-fee-vat]');
        if (!amount.value || !vat.value || !amount.reportValidity() || !vat.reportValidity()) return;
        premiumFeeDrafts.push({ id: `fee-${Date.now()}-${premiumFeeDrafts.length}`, type: root.querySelector('[data-org-fee-type]').value, from: root.querySelector('[data-org-fee-from]').value || '0', to: root.querySelector('[data-org-fee-to]').value, fees: amount.value, vat: vat.value, billingPeriod: root.querySelector('[data-org-fee-period]').value, isNewBorn: Boolean(root.querySelector('[name="isNewBorn"]')?.checked), updatedBy: 'admin' }); renderPremiumFees(); return;
      }
      const removeFee = event.target.closest('[data-org-fee-remove]'); if (removeFee) { premiumFeeDrafts.splice(Number(removeFee.dataset.orgFeeRemove), 1); renderPremiumFees(); return; }
      if (event.target.closest('[data-org-modal-close]')) { modal.hidden = true; document.body.classList.remove('modal-open'); return; }
      if (event.target.closest('[data-org-embedded-back]')) { detailPane.hidden = true; detailPane.innerHTML = ''; listUI.hidden = false; return; }
      if (event.target.closest('[data-org-deactivate-cancel]')) { deactivateModal.hidden = true; pendingDeactivate = null; return; }
      const pageButton = event.target.closest('[data-org-page]'); if (pageButton) { const pages = Math.max(1, Math.ceil(rows().length / 8)); page = Math.max(1, Math.min(pages, { first: 1, previous: page - 1, next: page + 1, last: pages }[pageButton.dataset.orgPage])); render(); }
    });
    root.addEventListener('submit', (event) => {
      if (event.target.matches('[data-org-pricing-form]')) {
        event.preventDefault(); if (!event.target.reportValidity()) return; const data = new FormData(event.target); const ids = data.getAll('facilityIds').map(String); if (!ids.length) { alert('Select at least one facility.'); return; }
        newbornDraft = Boolean(data.get('isNewBorn'));
        ids.forEach((fid) => {
          if (isPrice) {
            const entries = data.getAll(`items-${fid}`).map((code) => ({ code: String(code), discount: '0', price: '', vat: 'Standard', approval: '100' }));
            const record = { id: `price-list-${fid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: data.get('name').trim(), description: data.get('description').trim(), discountRate: data.get('discountRate') || '0', startDate: data.get('startDate'), endDate: data.get('endDate') || '', status: 'Active', versions: [{ version: 1, status: 'Active', startDate: data.get('startDate'), endDate: data.get('endDate') || '', entries }] };
            const list = load(priceKey(fid), priceSeedsFor(fid)); list.unshift(record); save(priceKey(fid), list);
          } else {
            const fees = premiumFeeDrafts.map((fee) => ({ ...fee, id: `${fee.id}-${fid}` }));
            const record = { id: `premium-${fid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: data.get('name').trim(), description: data.get('description').trim(), alias: data.get('alias').trim(), active: true, isNewBorn: newbornDraft, fees };
            const list = load(premiumKey(fid), structuredClone(premiumSeeds)); list.unshift(record); save(premiumKey(fid), list);
          }
        });
        modal.hidden = true; document.body.classList.remove('modal-open'); render(); root.querySelector('[data-org-toast]').textContent = `${label} created for ${ids.length} ${ids.length === 1 ? 'facility' : 'facilities'}.`; root.querySelector('[data-org-toast]').classList.add('is-visible'); event.target.reset(); premiumFeeDrafts = []; newbornDraft = false; renderPremiumFees();
      }
      if (event.target.matches('[data-org-deactivate-form]')) {
        event.preventDefault(); if (!event.target.reportValidity() || !pendingDeactivate) return; const list = load(premiumKey(pendingDeactivate.fid), []); const target = list.find((item) => String(item.id) === pendingDeactivate.id); if (target) target.active = false; save(premiumKey(pendingDeactivate.fid), list); deactivateModal.hidden = true; pendingDeactivate = null; render(); root.querySelector('[data-org-toast]').textContent = 'Premium Pricing deactivated.'; root.querySelector('[data-org-toast]').classList.add('is-visible');
      }
    });
    root.querySelector('[data-org-add]')?.addEventListener('click', () => { premiumFeeDrafts = []; newbornDraft = false; renderPremiumFees(); modal.hidden = false; createItemsPicker(); document.body.classList.add('modal-open'); });
    root.querySelectorAll('[data-org-modal-close]').forEach((button) => button.addEventListener('click', () => { modal.hidden = true; document.body.classList.remove('modal-open'); }));
    render();
  }
  mountList('price-lists', 'price'); mountList('premium-pricing', 'premium');
})();
