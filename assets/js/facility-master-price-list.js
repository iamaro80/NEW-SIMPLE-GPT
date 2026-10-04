(() => {
  const root = document.querySelector('[data-master-price-list]');
  if (!root) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-master-price-lists:v1:${facilityId}`;
  const catalogsKey = `rcm-facility-service-catalogs:v1:${facilityId}`;
  const itemsKey = `rcm-facility-service-items:v1:${facilityId}`;
  const pageSize = 10;
  const vatOptions = ['Standard', 'Zero', 'Tax Exempt', 'Out of Tax'];
  const approvalOptions = [
    { value: '0', label: 'Select' },
    { value: '100', label: 'No Need' },
    { value: '101', label: 'Need Approval' },
    { value: '104', label: 'Not Covered' },
  ];
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></svg>',
    renew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>',
    sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.7 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.3-3"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  };

  function readArray(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }
  function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  function addDays(value, amount) {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return localDate(date);
  }
  function formatDate(value) {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  function catalogItems() {
    const activeCodes = new Set(readArray(catalogsKey).filter((catalog) => catalog.active !== false).flatMap((catalog) => Array.isArray(catalog.itemCodes) ? catalog.itemCodes : []));
    return readArray(itemsKey).filter((item) => activeCodes.has(item.code));
  }
  function seedVersion() {
    const seedPrices = { 'SV-1001': '145.00', 'SV-1002': '90.00', 'SV-2001': '38.50', 'SV-3001': '125.00' };
    return {
      id: 'version-1', version: 1, status: 'Active', name: 'Master', description: 'Master', discountRate: '0',
      startDate: '2026-10-01', endDate: '', createdAt: '2026-10-01',
      entries: catalogItems().map((item) => ({ code: item.code, discount: item.code === 'SV-1002' ? '0.05' : '0', price: seedPrices[item.code] ?? '', vatCategory: 'Standard', approvalStatus: '0' })),
    };
  }
  function loadState() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.versions) && parsed.versions.length) return parsed;
      }
    } catch { /* Recover with a fresh prototype seed. */ }
    const version = seedVersion();
    const state = { activeVersionId: version.id, versions: [version] };
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Keep the workspace usable for this session. */ }
    return state;
  }
  let state = loadState();
  let selectedVersionId = state.activeVersionId || state.versions.find((version) => version.status === 'Active')?.id || state.versions[0].id;
  let filters = { query: '', price: 'all' };
  let page = 1;
  let pendingEntries = new Map();
  let toastTimer;
  let returnFocus = null;

  root.innerHTML = `
    <div class="master-price-workspace">
      <section class="master-price-header-card" aria-label="Master price list details">
        <div class="master-price-header-title"><div><p class="eyebrow">FACILITY PRICING</p><h2>Master Price List</h2><p>Maintain item prices, approvals, VAT categories, and versions.</p></div><label class="facility-filter master-version-picker"><span>Select Version</span><select data-master-version aria-label="Select version"></select></label></div>
        <div class="master-price-metadata">
          <label class="form-field"><span>Name <b>*</b></span><input data-master-field="name" required maxlength="100"></label>
          <label class="form-field"><span>Description <b>*</b></span><input data-master-field="description" required maxlength="250"></label>
          <label class="form-field"><span>Discount Rate</span><input data-master-field="discountRate" type="number" min="0" max="1" step="0.01" value="0"></label>
          <label class="form-field"><span>Start Date</span><input data-master-field="startDate" type="date" required></label>
          <label class="form-field"><span>End Date</span><input data-master-field="endDate" type="date"></label>
        </div>
        <div class="master-price-header-actions"><span class="master-version-status" data-master-status></span><div class="master-action-buttons">
          <button class="button button-primary" type="button" data-master-save>Save</button>
          <button class="button button-secondary" type="button" data-master-history>${icons.history}Version History</button>
          <button class="button button-secondary" type="button" data-master-renew>${icons.renew}New Version / Renew</button>
          <button class="button button-secondary" type="button" data-master-upload>${icons.upload}Upload Excel</button>
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-master-file hidden>
        </div></div>
      </section>
      <section class="master-price-panel" aria-label="Master price list items">
        <div class="master-price-toolbar"><button class="button button-secondary" type="button" data-master-sync>${icons.sync}Sync Service Catalog</button><div class="master-live-filters">
          <label class="facility-filter"><span>Search items</span><input type="search" data-master-filter="query" placeholder="Search items..."></label>
          <label class="facility-filter"><span>Price</span><select data-master-filter="price"><option value="all">All</option><option value="priced">Priced</option><option value="unpriced">Unpriced</option></select></label>
        </div></div>
        <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table master-price-table"><thead><tr><th>Code</th><th>Hospital Code</th><th>Hospital Description</th><th>Description</th><th>Chapter</th><th>Block</th><th>Discount</th><th>Price</th><th>VAT Category</th><th>Approvals Status</th><th>Actions</th></tr></thead><tbody data-master-rows></tbody></table></div>
          <div class="facility-empty" data-master-empty hidden>No service catalog items match these filters.</div>
          <footer class="facility-pagination master-price-footer"><span data-master-count></span><div class="master-price-footer-save"><span data-master-pending-label>No unsaved pricing changes</span><button class="button button-primary" type="button" data-master-save-prices disabled>Save Changes (0)</button></div><div class="facility-page-controls"><button class="icon-button" type="button" data-master-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-master-page="previous" aria-label="Previous page">‹</button><span data-master-page-label></span><button class="icon-button" type="button" data-master-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-master-page="last" aria-label="Last page">»</button></div></footer>
        </div>
      </section>
    </div>
    <div class="patient-modal-backdrop master-modal-backdrop" data-master-history-modal hidden><section class="patient-modal master-history-modal" role="dialog" aria-modal="true" aria-labelledby="master-history-title"><header class="patient-modal-header"><div><p class="eyebrow">VERSION TIMELINE</p><h2 id="master-history-title">Version History</h2><p>Review saved versions of the Master Price List.</p></div><button class="icon-button" type="button" data-master-history-close aria-label="Close version history">${icons.close}</button></header><div class="patient-modal-body"><ol class="master-history-list" data-master-history-list></ol></div><footer class="patient-modal-footer"><span></span><div><button class="button button-secondary" type="button" data-master-history-close>Close</button></div></footer></section></div>
    <div class="patient-modal-backdrop master-modal-backdrop" data-master-renew-modal hidden><section class="patient-modal master-renew-modal" role="dialog" aria-modal="true" aria-labelledby="master-renew-title"><header class="patient-modal-header"><div><p class="eyebrow">PRICE LIST VERSION</p><h2 id="master-renew-title">New Version / Renew</h2><p>A new active version copies the current pricing values.</p></div><button class="icon-button" type="button" data-master-renew-close aria-label="Close renewal dialog">${icons.close}</button></header><form data-master-renew-form><div class="patient-modal-body"><label class="form-field"><span>New Version Start Date <b>*</b></span><input name="startDate" type="date" required></label><p class="master-renew-note" data-master-renew-note></p></div><footer class="patient-modal-footer"><span></span><div><button class="button button-secondary" type="button" data-master-renew-close>Cancel</button><button class="button button-primary" type="submit">Create Version</button></div></footer></form></section></div>`;

  const versionSelect = root.querySelector('[data-master-version]');
  const bodyRows = root.querySelector('[data-master-rows]');
  const fileInput = root.querySelector('[data-master-file]');
  const historyModal = root.querySelector('[data-master-history-modal]');
  const renewModal = root.querySelector('[data-master-renew-modal]');
  const renewForm = root.querySelector('[data-master-renew-form]');
  const toast = document.querySelector('[data-facility-toast]');

  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Session remains functional if storage is unavailable. */ } }
  function showToast(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000); }
  function currentVersion() { return state.versions.find((version) => version.id === selectedVersionId) || state.versions[0]; }
  function isEditable() { return currentVersion().status === 'Active' && currentVersion().id === state.activeVersionId; }
  function headerHasPendingChanges() {
    const version = currentVersion();
    return [...root.querySelectorAll('[data-master-field]')].some((field) => {
      const saved = version[field.dataset.masterField] ?? '';
      if (field.dataset.masterField === 'discountRate') return Number(field.value || 0) !== Number(saved || 0);
      return field.value !== String(saved);
    });
  }
  function serviceItemMap() { return new Map(readArray(itemsKey).map((item) => [item.code, item])); }
  function entryMap(version = currentVersion()) { return new Map((version.entries || []).map((entry) => [entry.code, entry])); }
  function currentCatalogItems() { return catalogItems().sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true })); }
  function mergedEntry(code) { return { ...(entryMap().get(code) || { code, discount: '0', price: '', vatCategory: 'Standard', approvalStatus: '0' }), ...(pendingEntries.get(code) || {}) }; }
  function isDirty(code) { return pendingEntries.has(code); }
  function filteredItems() {
    const items = serviceItemMap();
    const versionEntries = entryMap();
    return currentCatalogItems().filter((item) => {
      const searchable = `${item.code} ${item.hospitalCode || ''} ${item.hospitalDescription || ''} ${item.shortDescription || ''} ${item.longDescription || ''} ${item.chapter || ''} ${item.block || ''}`.toLowerCase();
      if (filters.query && !searchable.includes(filters.query)) return false;
      const entry = pendingEntries.get(item.code) || versionEntries.get(item.code) || {};
      const hasPrice = entry.price !== '' && entry.price !== null && Number.isFinite(Number(entry.price));
      if (filters.price === 'priced' && !hasPrice) return false;
      if (filters.price === 'unpriced' && hasPrice) return false;
      return items.has(item.code);
    });
  }
  function updateDirtySummary() {
    const count = pendingEntries.size;
    root.querySelector('[data-master-save-prices]').textContent = `Save Changes (${count})`;
    root.querySelector('[data-master-save-prices]').disabled = !count || !isEditable();
    root.querySelector('[data-master-pending-label]').textContent = count ? `${count} item${count === 1 ? '' : 's'} with unsaved changes` : 'No unsaved pricing changes';
  }
  function populateVersionSelect() {
    versionSelect.innerHTML = [...state.versions].sort((a, b) => b.version - a.version).map((version) => {
      const range = `${formatDate(version.startDate)} → ${version.status === 'Active' ? 'Present' : formatDate(version.endDate)}`;
      return `<option value="${esc(version.id)}">v${version.version} — ${esc(version.status)} (${range})</option>`;
    }).join('');
    versionSelect.value = selectedVersionId;
  }
  function renderHeader() {
    const version = currentVersion();
    const editable = isEditable();
    root.querySelector('[data-master-field="name"]').value = version.name || '';
    root.querySelector('[data-master-field="description"]').value = version.description || '';
    root.querySelector('[data-master-field="discountRate"]').value = version.discountRate ?? '0';
    root.querySelector('[data-master-field="startDate"]').value = version.startDate || '';
    root.querySelector('[data-master-field="endDate"]').value = version.endDate || '';
    root.querySelectorAll('[data-master-field]').forEach((field) => { field.disabled = !editable; });
    root.querySelector('[data-master-save]').disabled = !editable;
    root.querySelector('[data-master-renew]').disabled = !editable;
    root.querySelector('[data-master-upload]').disabled = !editable;
    root.querySelector('[data-master-sync]').disabled = !editable;
    root.querySelector('[data-master-status]').innerHTML = `<span class="facility-status ${editable ? 'is-active' : 'is-inactive'}"><span></span>${esc(version.status)}${editable ? ' · Current' : ''}</span>`;
  }
  function renderRows() {
    const all = filteredItems();
    const pages = Math.max(1, Math.ceil(all.length / pageSize));
    page = Math.min(page, pages);
    const visible = all.slice((page - 1) * pageSize, page * pageSize);
    const items = serviceItemMap();
    const editable = isEditable();
    bodyRows.innerHTML = visible.map((item) => {
      const entry = mergedEntry(item.code);
      const itemName = item.shortDescription || item.longDescription || '';
      const rowTitle = `${item.code} ${itemName}`.trim();
      return `<tr data-master-row="${esc(item.code)}" class="${isDirty(item.code) ? 'master-row-dirty' : ''}">
        <td class="master-code">${esc(item.code)}</td><td>${esc(item.hospitalCode || '—')}</td><td>${esc(item.hospitalDescription || '—')}</td><td class="master-description">${esc(itemName || '—')}</td><td>${esc(item.chapter || '—')}</td><td>${esc(item.block || '—')}</td>
        <td><input class="master-cell-input" type="number" min="0" max="1" step="0.01" value="${esc(entry.discount ?? '0')}" data-master-entry="discount" data-code="${esc(item.code)}" aria-label="Discount for ${esc(rowTitle)}" ${editable ? '' : 'disabled'}></td>
        <td><input class="master-cell-input" type="number" min="0" step="0.01" value="${esc(entry.price ?? '')}" data-master-entry="price" data-code="${esc(item.code)}" aria-label="Price for ${esc(rowTitle)}" placeholder="Unpriced" ${editable ? '' : 'disabled'}></td>
        <td><select class="master-cell-select" data-master-entry="vatCategory" data-code="${esc(item.code)}" aria-label="VAT Category for ${esc(rowTitle)}" ${editable ? '' : 'disabled'}>${vatOptions.map((option) => `<option ${entry.vatCategory === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></td>
        <td><select class="master-cell-select" data-master-entry="approvalStatus" data-code="${esc(item.code)}" aria-label="Approvals Status for ${esc(rowTitle)}" ${editable ? '' : 'disabled'}>${approvalOptions.map((option) => `<option value="${option.value}" ${String(entry.approvalStatus ?? '0') === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}</select></td>
        <td><button class="icon-button master-row-revert" type="button" data-master-revert="${esc(item.code)}" title="Revert unsaved changes" aria-label="Revert unsaved changes for ${esc(item.code)}" ${!editable || !isDirty(item.code) ? 'disabled' : ''}>${icons.undo}</button></td>
      </tr>`;
    }).join('');
    root.querySelector('[data-master-empty]').hidden = all.length > 0;
    root.querySelector('[data-master-count]').textContent = `Total Results: ${all.length}`;
    root.querySelector('[data-master-page-label]').textContent = `Page ${all.length ? page : 0} of ${all.length ? pages : 0}`;
    root.querySelectorAll('[data-master-page]').forEach((button) => {
      button.disabled = !all.length || (['first', 'previous'].includes(button.dataset.masterPage) ? page === 1 : page === pages);
    });
    updateDirtySummary();
  }
  function render() {
    populateVersionSelect();
    renderHeader();
    renderRows();
  }
  function normalizeEntry(entry) {
    return { discount: String(entry.discount ?? '0'), price: entry.price === '' || entry.price === null ? '' : String(entry.price), vatCategory: entry.vatCategory || 'Standard', approvalStatus: String(entry.approvalStatus ?? '0') };
  }
  function stageRow(row) {
    const code = row.dataset.masterRow;
    const base = entryMap().get(code) || { code, discount: '0', price: '', vatCategory: 'Standard', approvalStatus: '0' };
    const next = { ...base };
    row.querySelectorAll('[data-master-entry]').forEach((field) => { next[field.dataset.masterEntry] = field.value; });
    if (JSON.stringify(normalizeEntry(next)) === JSON.stringify(normalizeEntry(base))) pendingEntries.delete(code);
    else pendingEntries.set(code, next);
    row.classList.toggle('master-row-dirty', pendingEntries.has(code));
    row.querySelector('[data-master-revert]').disabled = !pendingEntries.has(code);
    updateDirtySummary();
  }
  function closeModal(modal) {
    modal.hidden = true;
    if (historyModal.hidden && renewModal.hidden) document.body.classList.remove('modal-open');
    returnFocus?.focus?.();
  }
  function openHistory(trigger) {
    returnFocus = trigger;
    root.querySelector('[data-master-history-list]').innerHTML = [...state.versions].sort((a, b) => b.version - a.version).map((version) => `<li class="master-history-item ${version.id === selectedVersionId ? 'is-selected' : ''}"><button type="button" data-master-history-version="${esc(version.id)}"><span class="master-history-dot ${version.status === 'Active' ? 'is-active' : ''}"></span><span class="master-history-info"><strong>v${version.version} · ${esc(version.status)}</strong><small>${formatDate(version.startDate)} → ${version.status === 'Active' ? 'Present' : formatDate(version.endDate)}</small><small>${esc(version.name)} · ${esc(version.description)}</small></span><span class="master-history-open">View</span></button></li>`).join('');
    historyModal.hidden = false;
    document.body.classList.add('modal-open');
    historyModal.querySelector('[data-master-history-close]').focus();
  }
  function openRenew(trigger) {
    if (pendingEntries.size || headerHasPendingChanges()) { showToast('Save or revert pending changes before creating a new version.'); return; }
    returnFocus = trigger;
    renewForm.reset();
    renewForm.elements.namedItem('startDate').value = localDate();
    root.querySelector('[data-master-renew-note]').textContent = `The current version v${currentVersion().version} will end the day before the new version starts.`;
    renewModal.hidden = false;
    document.body.classList.add('modal-open');
    renewForm.elements.namedItem('startDate').focus();
  }
  function syncCatalogItems() {
    const version = state.versions.find((record) => record.id === state.activeVersionId);
    if (!version || version.id !== selectedVersionId || version.status !== 'Active') return;
    const existing = new Set(version.entries.map((entry) => entry.code));
    const missing = currentCatalogItems().filter((item) => !existing.has(item.code));
    if (!missing.length) { showToast('The Master Price List is already in sync.'); return; }
    version.entries.push(...missing.map((item) => ({ code: item.code, discount: '0', price: '', vatCategory: 'Standard', approvalStatus: '0' })));
    persist();
    renderRows();
    showToast(`Added ${missing.length} catalog item${missing.length === 1 ? '' : 's'} to the Master Price List.`);
  }
  function saveHeader() {
    const fields = [...root.querySelectorAll('[data-master-field]')];
    if (!isEditable()) return;
    const invalid = fields.find((field) => !field.checkValidity());
    if (invalid) { invalid.reportValidity(); return; }
    const values = Object.fromEntries(fields.map((field) => [field.dataset.masterField, field.value]));
    if (values.endDate && values.endDate < values.startDate) { root.querySelector('[data-master-field="endDate"]').setCustomValidity('End Date must be on or after Start Date.'); root.querySelector('[data-master-field="endDate"]').reportValidity(); root.querySelector('[data-master-field="endDate"]').setCustomValidity(''); return; }
    const version = currentVersion();
    Object.assign(version, values);
    persist();
    render();
    showToast('Master Price List details saved.');
  }
  function savePrices() {
    if (!pendingEntries.size || !isEditable()) return;
    for (const [code, entry] of pendingEntries) {
      const discount = Number(entry.discount);
      const price = entry.price === '' ? null : Number(entry.price);
      if (!Number.isFinite(discount) || discount < 0 || discount > 1) { showToast(`Discount for ${code} must be between 0 and 1.`); return; }
      if (price !== null && (!Number.isFinite(price) || price < 0)) { showToast(`Price for ${code} must be zero or greater.`); return; }
    }
    const version = currentVersion();
    const byCode = entryMap(version);
    pendingEntries.forEach((entry, code) => byCode.set(code, { ...byCode.get(code), ...normalizeEntry(entry), code }));
    version.entries = [...byCode.values()];
    pendingEntries.clear();
    persist();
    renderRows();
    showToast('Master Price List prices saved.');
  }
  function createVersion(startDate) {
    if (!isEditable()) return;
    if (pendingEntries.size || headerHasPendingChanges()) { showToast('Save or revert pending changes before creating a new version.'); return; }
    const previous = currentVersion();
    if (startDate <= previous.startDate) { showToast('New version must start after the current version.'); return; }
    const nextNumber = Math.max(...state.versions.map((version) => Number(version.version) || 0)) + 1;
    previous.status = 'Inactive';
    previous.endDate = addDays(startDate, -1);
    const next = { ...previous, id: `version-${nextNumber}`, version: nextNumber, status: 'Active', startDate, endDate: '', createdAt: localDate(), entries: previous.entries.map((entry) => ({ ...entry })) };
    state.versions.push(next);
    state.activeVersionId = next.id;
    selectedVersionId = next.id;
    persist();
    render();
    closeModal(renewModal);
    showToast(`Version v${nextNumber} is now active.`);
  }
  function normalizeVat(value) {
    const match = vatOptions.find((option) => option.toLowerCase() === String(value).trim().toLowerCase());
    return match || null;
  }
  function normalizeApproval(value) {
    const normalized = String(value).trim().toLowerCase();
    const match = approvalOptions.find((option) => option.value === normalized || option.label.toLowerCase() === normalized);
    return match?.value ?? null;
  }

  async function zipEntries(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let eocd = -1;
    for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index--) {
      if (view.getUint32(index, true) === 0x06054b50) { eocd = index; break; }
    }
    if (eocd < 0) throw new Error('Invalid XLSX archive.');
    const count = view.getUint16(eocd + 10, true);
    let offset = view.getUint32(eocd + 16, true);
    const entries = new Map();
    for (let index = 0; index < count; index++) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('Invalid XLSX directory.');
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('Invalid XLSX member.');
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
      let content;
      if (method === 0) content = compressed;
      else if (method === 8 && 'DecompressionStream' in globalThis) {
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        content = new Uint8Array(await new Response(stream).arrayBuffer());
      } else throw new Error('This XLSX compression format is not supported by this browser.');
      entries.set(name, new TextDecoder().decode(content));
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }
  function xmlDocument(text) {
    const documentXml = new DOMParser().parseFromString(text, 'application/xml');
    if (documentXml.querySelector('parsererror')) throw new Error('Invalid workbook XML.');
    return documentXml;
  }
  function xmlChildren(element, localName) { return [...element.getElementsByTagName('*')].filter((child) => child.localName === localName); }
  function columnIndex(reference) {
    const letters = String(reference).match(/^[A-Z]+/i)?.[0]?.toUpperCase() || '';
    return [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  }
  async function readFirstWorksheet(file) {
    const zip = await zipEntries(file);
    const workbookText = zip.get('xl/workbook.xml');
    const relsText = zip.get('xl/_rels/workbook.xml.rels');
    if (!workbookText || !relsText) throw new Error('The file is not a readable Excel workbook.');
    const workbook = xmlDocument(workbookText);
    const rels = xmlDocument(relsText);
    const sheet = xmlChildren(workbook, 'sheet')[0];
    if (!sheet) throw new Error('The workbook has no worksheets.');
    const relationId = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sheet.getAttribute('r:id');
    const relation = xmlChildren(rels, 'Relationship').find((item) => item.getAttribute('Id') === relationId);
    if (!relation) throw new Error('The first worksheet could not be found.');
    const target = relation.getAttribute('Target').replace(/^\//, '');
    const worksheetPath = target.startsWith('xl/') ? target : `xl/${target.replace(/^\.\//, '')}`;
    const sheetText = zip.get(worksheetPath);
    if (!sheetText) throw new Error('The first worksheet is missing.');
    const sharedStrings = zip.has('xl/sharedStrings.xml') ? xmlChildren(xmlDocument(zip.get('xl/sharedStrings.xml')), 'si').map((item) => xmlChildren(item, 't').map((node) => node.textContent || '').join('')) : [];
    const worksheet = xmlDocument(sheetText);
    const rows = xmlChildren(worksheet, 'row').map((row) => {
      const cells = [];
      for (const cell of xmlChildren(row, 'c')) {
        const type = cell.getAttribute('t');
        const valueNode = xmlChildren(cell, 'v')[0];
        let value = valueNode?.textContent || '';
        if (type === 's') value = sharedStrings[Number(value)] ?? '';
        else if (type === 'inlineStr') value = xmlChildren(cell, 't').map((node) => node.textContent || '').join('');
        cells[columnIndex(cell.getAttribute('r'))] = value;
      }
      return cells;
    });
    return rows.filter((row) => row.some((cell) => String(cell || '').trim()));
  }
  function headerIndex(headers, names) { return headers.findIndex((header) => names.includes(header.trim().toLowerCase())); }
  async function importWorkbook(file) {
    if (!isEditable()) return;
    let rows;
    try { rows = await readFirstWorksheet(file); }
    catch (error) { showToast(error?.message || 'The Excel workbook could not be read.'); return; }
    const headers = (rows.shift() || []).map((value) => String(value || '').trim().toLowerCase());
    const codeColumn = headerIndex(headers, ['code', 'service item code']);
    if (codeColumn < 0) { showToast('The first worksheet must include a Code or Service Item Code column.'); return; }
    const columns = {
      price: headerIndex(headers, ['price']),
      discount: headerIndex(headers, ['discount']),
      vatCategory: headerIndex(headers, ['vat category']),
      approvalStatus: headerIndex(headers, ['approvals status', 'approval status']),
    };
    const eligible = new Set(currentCatalogItems().map((item) => item.code.toLowerCase()));
    const seen = new Set();
    const index = entryMap();
    let imported = 0, duplicates = 0, unmatched = 0, invalidValues = 0;
    rows.forEach((row) => {
      const code = String(row[codeColumn] || '').trim();
      if (!code) return;
      const normalized = code.toLowerCase();
      if (seen.has(normalized)) { duplicates++; return; }
      seen.add(normalized);
      const exactCode = [...index.keys()].find((key) => key.toLowerCase() === normalized);
      if (!eligible.has(normalized) || !exactCode) { unmatched++; return; }
      const base = pendingEntries.get(exactCode) || index.get(exactCode);
      const next = { ...base };
      let changed = false;
      if (columns.price >= 0 && String(row[columns.price] ?? '').trim() !== '') {
        const value = Number(String(row[columns.price]).replace(/,/g, '').trim());
        if (Number.isFinite(value) && value >= 0) { next.price = String(value); changed = true; }
        else invalidValues++;
      }
      if (columns.discount >= 0 && String(row[columns.discount] ?? '').trim() !== '') {
        const value = Number(String(row[columns.discount]).trim());
        if (Number.isFinite(value) && value >= 0 && value <= 1) { next.discount = String(value); changed = true; }
        else invalidValues++;
      }
      if (columns.vatCategory >= 0 && String(row[columns.vatCategory] ?? '').trim() !== '') {
        const value = normalizeVat(row[columns.vatCategory]);
        if (value) { next.vatCategory = value; changed = true; } else invalidValues++;
      }
      if (columns.approvalStatus >= 0 && String(row[columns.approvalStatus] ?? '').trim() !== '') {
        const value = normalizeApproval(row[columns.approvalStatus]);
        if (value !== null) { next.approvalStatus = value; changed = true; } else invalidValues++;
      }
      if (changed) {
        if (JSON.stringify(normalizeEntry(next)) === JSON.stringify(normalizeEntry(index.get(exactCode)))) pendingEntries.delete(exactCode);
        else pendingEntries.set(exactCode, next);
        imported++;
      }
    });
    renderRows();
    showToast(`Imported ${imported}; skipped ${duplicates} duplicate, ${unmatched} unmatched, and ${invalidValues} invalid value${invalidValues === 1 ? '' : 's'}. Save changes to apply.`);
  }

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-master-filter="query"]')) { filters.query = event.target.value.trim().toLowerCase(); page = 1; renderRows(); return; }
    if (event.target.matches('[data-master-entry]')) { stageRow(event.target.closest('[data-master-row]')); return; }
  });
  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-master-filter="price"]')) { filters.price = event.target.value; page = 1; renderRows(); return; }
    if (event.target.matches('[data-master-entry]')) { stageRow(event.target.closest('[data-master-row]')); return; }
    if (event.target.matches('[data-master-version]')) {
      if (pendingEntries.size || headerHasPendingChanges()) { versionSelect.value = selectedVersionId; showToast('Save or revert pending changes before switching versions.'); return; }
      selectedVersionId = versionSelect.value;
      page = 1;
      render();
    }
  });
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.matches('[data-master-save]')) saveHeader();
    else if (button.matches('[data-master-history]')) openHistory(button);
    else if (button.matches('[data-master-renew]')) openRenew(button);
    else if (button.matches('[data-master-upload]')) { if (isEditable()) fileInput.click(); }
    else if (button.matches('[data-master-sync]')) syncCatalogItems();
    else if (button.matches('[data-master-save-prices]')) savePrices();
    else if (button.matches('[data-master-revert]')) { pendingEntries.delete(button.dataset.masterRevert); renderRows(); }
    else if (button.matches('[data-master-page]')) {
      const pages = Math.max(1, Math.ceil(filteredItems().length / pageSize));
      if (button.dataset.masterPage === 'first') page = 1;
      if (button.dataset.masterPage === 'previous') page--;
      if (button.dataset.masterPage === 'next') page++;
      if (button.dataset.masterPage === 'last') page = pages;
      renderRows();
    }
  });
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-master-history-version]');
    if (!button) return;
    if (pendingEntries.size || headerHasPendingChanges()) { showToast('Save or revert pending changes before switching versions.'); return; }
    selectedVersionId = button.dataset.masterHistoryVersion;
    page = 1;
    closeModal(historyModal);
    render();
  });
  historyModal.addEventListener('click', (event) => { if (event.target === historyModal) closeModal(historyModal); });
  renewModal.addEventListener('click', (event) => { if (event.target === renewModal) closeModal(renewModal); });
  renewForm.addEventListener('submit', (event) => { event.preventDefault(); if (renewForm.reportValidity()) createVersion(renewForm.elements.namedItem('startDate').value); });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (file) await importWorkbook(file);
    fileInput.value = '';
  });
  historyModal.querySelectorAll('[data-master-history-close]').forEach((button) => button.addEventListener('click', () => closeModal(historyModal)));
  renewModal.querySelectorAll('[data-master-renew-close]').forEach((button) => button.addEventListener('click', () => closeModal(renewModal)));
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!historyModal.hidden) closeModal(historyModal);
    else if (!renewModal.hidden) closeModal(renewModal);
  });
  window.addEventListener('hashchange', () => { root.hidden = location.hash.slice(1) !== 'master-price-list'; });
  root.hidden = location.hash.slice(1) !== 'master-price-list';
  render();
})();
