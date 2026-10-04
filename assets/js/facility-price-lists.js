(() => {
  const root = document.querySelector('[data-price-lists]');
  if (!root) return;

  const pageSize = 6;
  const itemPageSize = 6;
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  };
  const items = [
    { code: 'SV-1001', hospitalCode: 'HSP-OP-001', hospitalDescription: 'Outpatient Consultation', description: 'Primary care consultation', chapter: 'Consultation Services', block: 'Primary Care' },
    { code: 'SV-1002', hospitalCode: 'HSP-OP-002', hospitalDescription: 'Follow-up Visit', description: 'Follow-up consultation', chapter: 'Consultation Services', block: 'Primary Care' },
    { code: 'SV-2001', hospitalCode: 'HSP-LAB-001', hospitalDescription: 'Core Laboratory', description: 'Complete blood count', chapter: 'Laboratory Services', block: 'Hematology' },
    { code: 'SV-2011', hospitalCode: 'HSP-LAB-004', hospitalDescription: 'Microbiology Laboratory', description: 'Urine culture and sensitivity', chapter: 'Laboratory Services', block: 'Microbiology' },
    { code: 'SV-3001', hospitalCode: 'HSP-RAD-001', hospitalDescription: 'General Radiology', description: 'Chest radiograph, two views', chapter: 'Imaging Services', block: 'Diagnostic Radiology' },
    { code: 'SV-4001', hospitalCode: 'HSP-PT-001', hospitalDescription: 'Rehabilitation Services', description: 'Physiotherapy session', chapter: 'Rehabilitation Services', block: 'Therapeutic Services' },
    { code: 'SV-5001', hospitalCode: 'HSP-PH-003', hospitalDescription: 'Outpatient Pharmacy', description: 'Medication dispensing service', chapter: 'Pharmacy Services', block: 'Dispensing' },
  ];
  const itemByCode = new Map(items.map((item) => [item.code, item]));
  const chapters = [...new Set(items.map((item) => item.chapter))];
  const entries = (codes, prices) => codes.map((code, index) => ({ code, discount: index === 1 ? '0.05' : '0', price: prices[index] ?? '', vat: 'Standard', approval: index === 2 ? '101' : '100' }));
  const records = [
    { id: 'pl-ambulatory', name: 'Ambulatory Care Rates', description: 'Professional fees for outpatient and follow-up services.', status: 'Active', discountRate: '0', startDate: '2026-09-01', endDate: '', versions: [{ version: 2, status: 'Active', startDate: '2026-09-01', endDate: '', entries: entries(['SV-1001', 'SV-1002', 'SV-2001'], ['165.00', '95.00', '42.00']) }, { version: 1, status: 'Inactive', startDate: '2026-08-01', endDate: '2026-08-31', entries: entries(['SV-1001', 'SV-1002'], ['155.00', '90.00']) }] },
    { id: 'pl-diagnostics', name: 'Diagnostic Services Schedule', description: 'Contracted pricing for laboratory and imaging services.', status: 'Active', discountRate: '0.03', startDate: '2026-07-01', endDate: '', versions: [{ version: 1, status: 'Active', startDate: '2026-07-01', endDate: '', entries: entries(['SV-2001', 'SV-2011', 'SV-3001'], ['40.00', '88.00', '135.00']) }] },
    { id: 'pl-rehabilitation', name: 'Rehabilitation Package Rates', description: 'Physiotherapy and rehabilitation service pricing.', status: 'Inactive', discountRate: '0', startDate: '2026-03-01', endDate: '2026-08-31', versions: [{ version: 1, status: 'Inactive', startDate: '2026-03-01', endDate: '2026-08-31', entries: entries(['SV-4001'], ['120.00']) }] },
    { id: 'pl-pharmacy', name: 'Pharmacy Service Fees', description: 'Outpatient medication dispensing fees and approvals.', status: 'Active', discountRate: '0', startDate: '2026-06-01', endDate: '', versions: [{ version: 1, status: 'Active', startDate: '2026-06-01', endDate: '', entries: entries(['SV-5001', 'SV-1001'], ['18.00', '150.00']) }] },
  ];
  let filters = { name: '', startDate: '', endDate: '', status: '' };
  let page = 1;
  let itemPage = 1;
  let pickerPage = 1;
  let mode = 'list';
  let activeId = null;
  let formValues = {};
  let selectedVersion = 0;
  let itemQuery = '';
  let itemChapter = '';
  let pickerQuery = '';
  let selectedCodes = new Set();
  let toastTimer;

  root.innerHTML = `
    <div class="price-list-list-screen" data-price-list-list-screen>
      <div class="price-list-toolbar"><div class="price-list-primary-actions"><button class="button button-primary" type="button" data-price-add>${icons.add}Add Price List</button><button class="button button-secondary" type="button" data-price-export>${icons.download}Export</button><button class="button button-secondary" type="button" data-price-sample>${icons.download}Download Sample</button><button class="button button-secondary" type="button" data-price-upload>${icons.upload}Upload</button></div></div>
      <div class="branches-filter-grid price-list-filters" aria-label="Filter price lists">
        <label class="facility-filter"><span>Name</span><input type="search" data-price-filter="name" placeholder="Filter by name"></label>
        <label class="facility-filter"><span>Start Date</span><input type="date" data-price-filter="startDate"></label>
        <label class="facility-filter"><span>End Date</span><input type="date" data-price-filter="endDate"></label>
        <label class="facility-filter"><span>Status</span><select data-price-filter="status"><option value="">All statuses</option><option>Active</option><option>Inactive</option></select></label>
      </div>
      <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table price-list-grid"><thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody data-price-list-rows></tbody></table></div><div class="facility-empty" data-price-list-empty hidden>No price lists match your filters.</div><footer class="facility-pagination"><span data-price-list-count></span><div class="facility-page-controls"><button class="icon-button" data-price-page="first" aria-label="First page">«</button><button class="icon-button" data-price-page="previous" aria-label="Previous page">‹</button><span data-price-page-label></span><button class="icon-button" data-price-page="next" aria-label="Next page">›</button><button class="icon-button" data-price-page="last" aria-label="Last page">»</button></div></footer></div>
    </div>
    <section class="price-list-detail-screen" data-price-list-detail hidden></section>
    <div class="patient-modal-backdrop price-list-modal-backdrop" data-price-history-modal hidden><section class="patient-modal price-list-history-modal" role="dialog" aria-modal="true" aria-labelledby="price-history-title"><header class="patient-modal-header"><div><p class="eyebrow">PRICE LIST VERSIONS</p><h2 id="price-history-title">Version History</h2><p data-price-history-caption></p></div><button class="icon-button" data-price-history-close aria-label="Close version history">${icons.close}</button></header><div class="patient-modal-body"><ol class="master-history-list" data-price-history-list></ol></div><footer class="patient-modal-footer"><span></span><div><button class="button button-secondary" data-price-history-close>Close</button></div></footer></section></div>
    <div class="patient-modal-backdrop price-list-modal-backdrop" data-price-items-modal hidden><section class="patient-modal price-list-picker-modal" role="dialog" aria-modal="true" aria-labelledby="price-picker-title"><header class="patient-modal-header"><div><p class="eyebrow">SERVICE ITEM SELECTION</p><h2 id="price-picker-title">Items</h2><p>Select the services to show in this price list.</p></div><button class="icon-button" data-price-picker-close aria-label="Close items picker">${icons.close}</button></header><div class="patient-modal-body"><div class="price-picker-filters"><label class="facility-filter"><span>Search items</span><input type="search" data-price-picker-search placeholder="Search code or description"></label><label class="facility-filter"><span>Chapter</span><select data-price-picker-chapter><option value="">All chapters</option>${chapters.map((chapter) => `<option>${esc(chapter)}</option>`).join('')}</select></label></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table price-picker-table"><thead><tr><th class="price-list-check"><input type="checkbox" data-price-picker-all aria-label="Select all visible items"></th><th>Hospital Code</th><th>Hospital Description</th><th>Code</th><th>Description</th><th>Block</th><th>Chapter</th></tr></thead><tbody data-price-picker-rows></tbody></table></div><div class="facility-empty" data-price-picker-empty hidden>No items match your search.</div></div><footer class="facility-pagination"><span data-price-picker-count></span><div class="facility-page-controls"><button class="icon-button" data-price-picker-page="previous" aria-label="Previous items">‹</button><span data-price-picker-page-label></span><button class="icon-button" data-price-picker-page="next" aria-label="Next items">›</button></div></footer></div><footer class="patient-modal-footer"><span data-price-picker-selected>0 items selected</span><div><button class="button button-secondary" data-price-picker-cancel>Cancel</button><button class="button button-primary" data-price-picker-add>Add Selected</button></div></footer></section></div>
    <div class="facility-toast" data-price-toast role="status" aria-live="polite"></div>`;

  const listScreen = root.querySelector('[data-price-list-list-screen]');
  const detailScreen = root.querySelector('[data-price-list-detail]');
  const historyModal = root.querySelector('[data-price-history-modal]');
  const itemsModal = root.querySelector('[data-price-items-modal]');

  function currentRecord() { return records.find((record) => record.id === activeId); }
  function currentVersion(record = currentRecord()) { return record?.versions?.[selectedVersion] || record?.versions?.[0] || { version: 1, status: 'Active', entries: [] }; }
  function showToast(message) { const toast = root.querySelector('[data-price-toast]'); toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800); }
  function filteredRecords() {
    return records.filter((record) => (!filters.name || `${record.name} ${record.description}`.toLowerCase().includes(filters.name))
      && (!filters.startDate || record.startDate >= filters.startDate)
      && (!filters.endDate || (record.endDate && record.endDate <= filters.endDate))
      && (!filters.status || record.status.toLowerCase() === filters.status));
  }
  function rowMenu(record) {
    return `<div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-price-row-menu aria-label="Actions for ${esc(record.name)}" aria-haspopup="menu" aria-expanded="false" data-id="${esc(record.id)}">${icons.more}</button><div class="facility-row-menu price-list-row-menu" role="menu" hidden><button type="button" role="menuitem" data-price-action="view" data-id="${esc(record.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-price-action="history" data-id="${esc(record.id)}">${icons.history}Version History</button><button type="button" role="menuitem" data-price-action="edit" data-id="${esc(record.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-price-action="download-sample" data-id="${esc(record.id)}">${icons.download}Download Sample</button><button type="button" role="menuitem" data-price-action="download-excel" data-id="${esc(record.id)}">${icons.download}Download Excel</button><button type="button" role="menuitem" data-price-action="upload" data-id="${esc(record.id)}">${icons.upload}Upload</button></div></div>`;
  }
  function renderList() {
    const matching = filteredRecords();
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    root.querySelector('[data-price-list-rows]').innerHTML = visible.map((record) => `<tr><td><span class="facility-name-en">${esc(record.name)}</span></td><td><span class="price-list-description">${esc(record.description)}</span></td><td><span class="facility-status ${record.status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${esc(record.status)}</span></td><td>${rowMenu(record)}</td></tr>`).join('');
    root.querySelector('[data-price-list-empty]').hidden = matching.length > 0;
    root.querySelector('[data-price-list-count]').textContent = `Total Results: ${matching.length}`;
    root.querySelector('[data-price-page-label]').textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-price-page]').forEach((button) => {
      button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.pricePage) ? page === 1 : page === pages);
    });
  }
  function screen(modeName, id = null) {
    mode = modeName;
    activeId = id;
    listScreen.hidden = modeName !== 'list';
    detailScreen.hidden = modeName === 'list';
    selectedVersion = 0;
    itemQuery = '';
    itemChapter = '';
    itemPage = 1;
    if (modeName === 'new') formValues = { name: '', description: '', discountRate: '0', startDate: '', endDate: '', versions: [{ version: 1, status: 'Active', startDate: '', endDate: '', entries: [] }] };
    else formValues = { ...currentRecord() };
    renderDetail();
  }
  function renderDetail() {
    const record = formValues;
    const version = record.versions?.[selectedVersion] || record.versions?.[0] || { version: 1, status: 'Active', entries: [] };
    const readOnly = mode === 'view' || version.status === 'Inactive';
    const title = mode === 'new' ? 'Add Price List' : mode === 'edit' ? 'Edit Price List' : 'View Price List';
    const visibleEntries = (version.entries || []).filter((entry) => {
      const item = itemByCode.get(entry.code);
      if (!item) return false;
      const searchable = `${item.code} ${item.hospitalCode} ${item.hospitalDescription} ${item.description} ${item.chapter} ${item.block}`.toLowerCase();
      return (!itemQuery || searchable.includes(itemQuery)) && (!itemChapter || item.chapter === itemChapter);
    });
    const pageCount = Math.max(1, Math.ceil(visibleEntries.length / itemPageSize));
    itemPage = Math.min(itemPage, pageCount);
    const shown = visibleEntries.slice((itemPage - 1) * itemPageSize, itemPage * itemPageSize);
    const entryRows = shown.length ? shown.map((entry) => {
      const item = itemByCode.get(entry.code);
      return `<tr><td class="price-list-code">${esc(item.code)}</td><td>${esc(item.hospitalCode)}</td><td>${esc(item.hospitalDescription)}</td><td>${esc(item.description)}</td><td>${esc(item.chapter)}</td><td>${esc(item.block)}</td><td><input class="price-list-cell-input" type="number" min="0" max="1" step="0.01" value="${esc(entry.discount)}" aria-label="Discount for ${esc(item.code)}" ${readOnly ? 'disabled' : ''}></td><td><input class="price-list-cell-input" type="number" min="0" step="0.01" value="${esc(entry.price)}" placeholder="Unpriced" aria-label="Price for ${esc(item.code)}" ${readOnly ? 'disabled' : ''}></td><td><select class="price-list-cell-select" aria-label="VAT category for ${esc(item.code)}" ${readOnly ? 'disabled' : ''}>${['Standard','Zero','Tax Exempt','Out of Tax'].map((value) => `<option ${entry.vat === value ? 'selected' : ''}>${value}</option>`).join('')}</select></td><td><select class="price-list-cell-select" aria-label="Approvals status for ${esc(item.code)}" ${readOnly ? 'disabled' : ''}>${[['100','No Need'],['101','Need Approval'],['104','Not Covered']].map(([value,label]) => `<option value="${value}" ${String(entry.approval) === value ? 'selected' : ''}>${label}</option>`).join('')}</select></td><td><button class="icon-button price-list-row-undo" type="button" aria-label="Reset row ${esc(item.code)}" ${readOnly ? 'disabled' : ''}>↶</button></td></tr>`;
    }).join('') : `<tr><td colspan="11" class="price-list-no-items">${mode === 'new' ? 'No items selected yet.' : 'No items match these filters.'}</td></tr>`;
    detailScreen.innerHTML = `<div class="price-list-detail-heading"><div><button class="price-list-back" type="button" data-price-back>← Price Lists</button><p class="eyebrow">FACILITY PRICING</p><h2>${title}</h2><p>${mode === 'view' ? 'Review the selected price list and its service pricing.' : 'Configure list details and included service pricing.'}</p></div><div class="price-list-detail-actions">${mode !== 'view' ? '<button class="button button-primary" type="button" data-price-save>Save</button>' : ''}<button class="button button-secondary" type="button" data-price-cancel>${mode === 'view' ? 'Back' : 'Cancel'}</button></div></div>
      <section class="price-list-form-card" aria-label="Price list details"><div class="price-list-form-heading"><div><h3>${esc(record.name || 'New Price List')}</h3><p>${mode === 'new' ? 'New purpose-specific pricing schedule' : esc(record.description)}</p></div>${mode !== 'new' ? `<button class="button button-secondary" type="button" data-price-detail-history>${icons.history}Version History</button>` : ''}</div>
        <div class="price-list-form-grid"><label class="form-field"><span>Name <b>*</b></span><input data-price-field="name" value="${esc(record.name || '')}" required maxlength="100" ${mode === 'view' ? 'disabled' : ''}></label><label class="form-field"><span>Description <b>*</b></span><input data-price-field="description" value="${esc(record.description || '')}" required maxlength="250" ${mode === 'view' ? 'disabled' : ''}></label><label class="form-field"><span>Discount Rate</span><input data-price-field="discountRate" type="number" min="0" max="1" step="0.01" value="${esc(record.discountRate || '0')}" ${mode === 'view' ? 'disabled' : ''}></label><label class="form-field"><span>Start Date <b>*</b></span><input data-price-field="startDate" type="date" value="${esc(record.startDate || '')}" required ${mode === 'view' ? 'disabled' : ''}></label><label class="form-field"><span>End Date</span><input data-price-field="endDate" type="date" value="${esc(record.endDate || '')}" ${mode === 'view' ? 'disabled' : ''}></label></div>
        <div class="price-list-form-utilities"><div class="price-list-inline-tools"><button type="button" class="icon-button" aria-label="Undo" title="Undo">↶</button><button type="button" class="icon-button" aria-label="Redo" title="Redo">↷</button><button type="button" class="icon-button" aria-label="Refresh" title="Refresh">⟳</button></div><span class="facility-status ${version.status === 'Active' ? 'is-active' : 'is-inactive'}"><span></span>${esc(version.status)} · v${version.version}</span></div></section>
      <section class="price-list-items-card" aria-label="Price list items"><div class="price-list-items-toolbar"><div><h3>Price List Items</h3><p>Item-specific pricing and approval details for this schedule.</p></div><div class="price-list-version-control"><label class="facility-filter"><span>Select Version</span><select data-price-version>${record.versions.map((itemVersion, index) => `<option value="${index}" ${index === selectedVersion ? 'selected' : ''}>v${itemVersion.version} — ${itemVersion.status} (${itemVersion.startDate || 'Draft'} → ${itemVersion.status === 'Active' ? 'Present' : itemVersion.endDate || '—'})</option>`).join('')}</select></label><button class="button button-secondary" type="button" data-price-add-multiple ${readOnly ? 'disabled' : ''}>${icons.add}Add Multiple Items</button></div></div>
        <div class="price-list-item-filters"><label class="facility-filter"><span>Search items</span><input type="search" data-price-item-search value="${esc(itemQuery)}" placeholder="Search code or description"></label><label class="facility-filter"><span>Chapter</span><select data-price-item-chapter><option value="">All chapters</option>${chapters.map((chapter) => `<option ${itemChapter === chapter ? 'selected' : ''}>${esc(chapter)}</option>`).join('')}</select></label></div>
        <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table price-list-items-table"><thead><tr><th>Code</th><th>Hospital Code</th><th>Hospital Description</th><th>Description</th><th>Chapter</th><th>Block</th><th>Discount</th><th>Price</th><th>VAT Category</th><th>Approvals Status</th><th>Actions</th></tr></thead><tbody>${entryRows}</tbody></table></div><div class="facility-empty" data-price-detail-empty ${shown.length ? 'hidden' : ''}>${mode === 'new' ? 'No items selected yet.' : 'No items match these filters.'}</div><footer class="facility-pagination"><span>Total Items: ${visibleEntries.length}</span><div class="facility-page-controls"><button class="icon-button" data-price-item-page="first" aria-label="First item page" ${itemPage <= 1 ? 'disabled' : ''}>«</button><button class="icon-button" data-price-item-page="previous" aria-label="Previous item page" ${itemPage <= 1 ? 'disabled' : ''}>‹</button><span>Page ${visibleEntries.length ? itemPage : 0} of ${visibleEntries.length ? pageCount : 0}</span><button class="icon-button" data-price-item-page="next" aria-label="Next item page" ${itemPage >= pageCount ? 'disabled' : ''}>›</button><button class="icon-button" data-price-item-page="last" aria-label="Last item page" ${itemPage >= pageCount ? 'disabled' : ''}>»</button></div></footer></div></section>`;
  }
  function openHistory(record) {
    root.querySelector('[data-price-history-caption]').textContent = record.name;
    root.querySelector('[data-price-history-list]').innerHTML = record.versions.map((version) => `<li class="master-history-item ${version.status === 'Active' ? 'is-selected' : ''}"><button type="button"><span class="master-history-dot ${version.status === 'Active' ? 'is-active' : ''}"></span><span class="master-history-info"><strong>v${version.version} · ${version.status}</strong><small>${version.startDate || '—'} → ${version.status === 'Active' ? 'Present' : version.endDate || '—'}</small></span><span class="master-history-open">${version.status === 'Active' ? 'Current' : 'Previous'}</span></button></li>`).join('');
    historyModal.hidden = false;
    document.body.classList.add('modal-open');
  }
  function closeModal(modal) { modal.hidden = true; if (historyModal.hidden && itemsModal.hidden) document.body.classList.remove('modal-open'); }
  function renderPicker() {
    const chapter = root.querySelector('[data-price-picker-chapter]').value;
    const query = pickerQuery.toLowerCase();
    const filtered = items.filter((item) => (!chapter || item.chapter === chapter) && (!query || `${item.code} ${item.hospitalCode} ${item.hospitalDescription} ${item.description} ${item.chapter} ${item.block}`.toLowerCase().includes(query)));
    const pages = Math.max(1, Math.ceil(filtered.length / itemPageSize));
    pickerPage = Math.min(pickerPage, pages);
    const visible = filtered.slice((pickerPage - 1) * itemPageSize, pickerPage * itemPageSize);
    root.querySelector('[data-price-picker-rows]').innerHTML = visible.map((item) => `<tr><td class="price-list-check"><input type="checkbox" data-price-select-code="${esc(item.code)}" ${selectedCodes.has(item.code) ? 'checked' : ''} aria-label="Select ${esc(item.code)}"></td><td>${esc(item.hospitalCode)}</td><td>${esc(item.hospitalDescription)}</td><td class="price-list-code">${esc(item.code)}</td><td>${esc(item.description)}</td><td>${esc(item.block)}</td><td>${esc(item.chapter)}</td></tr>`).join('');
    root.querySelector('[data-price-picker-empty]').hidden = filtered.length > 0;
    root.querySelector('[data-price-picker-count]').textContent = `Total Results: ${filtered.length}`;
    root.querySelector('[data-price-picker-selected]').textContent = `${selectedCodes.size} item${selectedCodes.size === 1 ? '' : 's'} selected`;
    root.querySelector('[data-price-picker-page-label]').textContent = `Page ${filtered.length ? pickerPage : 0} of ${filtered.length ? pages : 0}`;
    root.querySelector('[data-price-picker-page="previous"]').disabled = !filtered.length || pickerPage === 1;
    root.querySelector('[data-price-picker-page="next"]').disabled = !filtered.length || pickerPage === pages;
    const selectAll = root.querySelector('[data-price-picker-all]');
    selectAll.checked = visible.length > 0 && visible.every((item) => selectedCodes.has(item.code));
    selectAll.indeterminate = visible.some((item) => selectedCodes.has(item.code)) && !selectAll.checked;
  }
  function closeMenus() { root.querySelectorAll('.price-list-row-menu').forEach((menu) => { menu.hidden = true; menu.parentElement.querySelector('[data-price-row-menu]').setAttribute('aria-expanded', 'false'); }); }

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-price-filter]')) { filters[event.target.dataset.priceFilter] = event.target.value.toLowerCase(); page = 1; renderList(); }
    else if (event.target.matches('[data-price-field]')) formValues[event.target.dataset.priceField] = event.target.value;
    else if (event.target.matches('[data-price-item-search]')) {
      const cursor = event.target.selectionStart;
      itemQuery = event.target.value.toLowerCase();
      itemPage = 1;
      renderDetail();
      const search = detailScreen.querySelector('[data-price-item-search]');
      search?.focus();
      if (typeof cursor === 'number') search?.setSelectionRange(cursor, cursor);
    }
    else if (event.target.matches('[data-price-picker-search]')) { pickerQuery = event.target.value; pickerPage = 1; renderPicker(); }
  });
  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-price-filter]')) { filters[event.target.dataset.priceFilter] = event.target.value.toLowerCase(); page = 1; renderList(); }
    else if (event.target.matches('[data-price-item-chapter]')) { itemChapter = event.target.value; itemPage = 1; renderDetail(); }
    else if (event.target.matches('[data-price-version]')) { selectedVersion = Number(event.target.value); itemPage = 1; renderDetail(); }
    else if (event.target.matches('[data-price-picker-chapter]')) { pickerPage = 1; renderPicker(); }
    else if (event.target.matches('[data-price-select-code]')) { if (event.target.checked) selectedCodes.add(event.target.dataset.priceSelectCode); else selectedCodes.delete(event.target.dataset.priceSelectCode); renderPicker(); }
    else if (event.target.matches('[data-price-picker-all]')) {
      root.querySelectorAll('[data-price-select-code]').forEach((checkbox) => { if (event.target.checked) selectedCodes.add(checkbox.dataset.priceSelectCode); else selectedCodes.delete(checkbox.dataset.priceSelectCode); });
      renderPicker();
    }
  });
  root.addEventListener('click', (event) => {
    const menuButton = event.target.closest('[data-price-row-menu]');
    if (menuButton) { const menu = menuButton.nextElementSibling; const open = menu.hidden; closeMenus(); menu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); return; }
    const action = event.target.closest('[data-price-action]');
    if (action) {
      const record = records.find((item) => item.id === action.dataset.id); closeMenus();
      if (action.dataset.priceAction === 'view') screen('view', record.id);
      else if (action.dataset.priceAction === 'edit') screen('edit', record.id);
      else if (action.dataset.priceAction === 'history') openHistory(record);
      else showToast('This prototype control is for screen preview only.');
      return;
    }
    if (event.target.closest('[data-price-add]')) { screen('new'); return; }
    if (event.target.closest('[data-price-export], [data-price-sample], [data-price-upload]')) { showToast('This prototype control is for screen preview only.'); return; }
    if (event.target.closest('[data-price-back], [data-price-cancel]')) { screen('list'); return; }
    if (event.target.closest('[data-price-save]')) { if (detailScreen.querySelector('form')?.reportValidity?.() === false) return; showToast('Screen preview only — price list changes are not saved.'); return; }
    if (event.target.closest('[data-price-detail-history]')) { openHistory(currentRecord()); return; }
    if (event.target.closest('[data-price-add-multiple]')) { selectedCodes = new Set((currentVersion(formValues)?.entries || []).map((entry) => entry.code)); pickerQuery = ''; itemsModal.hidden = false; document.body.classList.add('modal-open'); renderPicker(); return; }
    if (event.target.closest('[data-price-picker-add]')) { closeModal(itemsModal); showToast(`${selectedCodes.size} item${selectedCodes.size === 1 ? '' : 's'} selected for preview; changes are not saved.`); return; }
    if (event.target.closest('[data-price-picker-cancel], [data-price-picker-close]')) { closeModal(itemsModal); return; }
    if (event.target.closest('[data-price-history-close]')) { closeModal(historyModal); return; }
    const pageButton = event.target.closest('[data-price-page]');
    if (pageButton) { const pages = Math.max(1, Math.ceil(filteredRecords().length / pageSize)); const next = { first: 1, previous: page - 1, next: page + 1, last: pages }[pageButton.dataset.pricePage]; page = Math.max(1, Math.min(pages, next)); renderList(); return; }
    const itemPageButton = event.target.closest('[data-price-item-page]');
    if (itemPageButton) { const count = currentVersion(formValues).entries.filter((entry) => { const item = itemByCode.get(entry.code); return item && (!itemQuery || `${item.code} ${item.description} ${item.hospitalDescription}`.toLowerCase().includes(itemQuery)) && (!itemChapter || item.chapter === itemChapter); }).length; const pages = Math.max(1, Math.ceil(count / itemPageSize)); const next = { first: 1, previous: itemPage - 1, next: itemPage + 1, last: pages }[itemPageButton.dataset.priceItemPage]; itemPage = Math.max(1, Math.min(pages, next)); renderDetail(); }
    const pickerPageButton = event.target.closest('[data-price-picker-page]');
    if (pickerPageButton) { const chapter = root.querySelector('[data-price-picker-chapter]').value; const query = pickerQuery.toLowerCase(); const count = items.filter((item) => (!chapter || item.chapter === chapter) && (!query || `${item.code} ${item.hospitalCode} ${item.hospitalDescription} ${item.description} ${item.chapter} ${item.block}`.toLowerCase().includes(query))).length; const pages = Math.max(1, Math.ceil(count / itemPageSize)); pickerPage = Math.max(1, Math.min(pages, pickerPage + (pickerPageButton.dataset.pricePickerPage === 'next' ? 1 : -1))); renderPicker(); }
  });
  historyModal.addEventListener('click', (event) => { if (event.target === historyModal) closeModal(historyModal); });
  itemsModal.addEventListener('click', (event) => { if (event.target === itemsModal) closeModal(itemsModal); });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) closeMenus(); });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (!itemsModal.hidden) closeModal(itemsModal); else if (!historyModal.hidden) closeModal(historyModal); else if (mode !== 'list') screen('list'); } });
  root.hidden = location.hash.slice(1) !== 'price-lists';
  renderList();
})();
