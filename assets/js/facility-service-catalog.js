(() => {
  const root = document.querySelector('[data-service-catalog-grid]');
  if (!root) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-service-catalogs:v1:${facilityId}`;
  const groupsKey = `rcm-facility-groups:v1:${facilityId}`;
  const categoriesKey = `rcm-facility-categories:v1:${facilityId}`;
  const itemsKey = `rcm-facility-service-items:v1:${facilityId}`;
  const pageSize = 6;
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  };
  function readArray(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }
  const groups = readArray(groupsKey);
  const categories = readArray(categoriesKey);
  const serviceItems = readArray(itemsKey);
  const categoryOptions = categories.map((category) => `<option value="${esc(category.code)}">${esc(category.description)}</option>`).join('');
  const groupOptions = groups.filter((group) => group.type === 'group' && group.active !== false).map((group) => `<option value="${esc(group.id)}">${esc(group.description)} (${esc(group.code)})</option>`).join('');
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const itemByCode = new Map(serviceItems.map((item) => [item.code, item]));
  const categoryByCode = new Map(categories.map((category) => [category.code, category]));
  const seed = [
    { id: 'catalog-ambulatory', name: 'Service Catalog 1', description: 'Service catalog description 1', categoryCode: 'CAT-CONS', groupId: 'group-consultation', itemCodes: ['SV-1001', 'SV-1002'], active: true },
    { id: 'catalog-laboratory', name: 'Service Catalog 2', description: 'Service catalog description 2', categoryCode: 'CAT-LAB', groupId: 'group-laboratory', itemCodes: ['SV-2001', 'SV-2011'], active: true },
    { id: 'catalog-imaging', name: 'Service Catalog 3', description: 'Service catalog description 3', categoryCode: 'CAT-IMG', groupId: 'group-imaging', itemCodes: ['SV-3001'], active: true },
  ];
  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((record) => ({ ...record, itemCodes: Array.isArray(record.itemCodes) ? record.itemCodes.filter((code) => itemByCode.has(code)) : [] }));
      }
      const usableSeed = seed.filter((record) => groupById.has(record.groupId)).map((record) => ({ ...record, itemCodes: record.itemCodes.filter((code) => itemByCode.has(code)) }));
      localStorage.setItem(storageKey, JSON.stringify(usableSeed));
      return usableSeed;
    } catch { return seed.map((record) => ({ ...record, itemCodes: [...record.itemCodes] })); }
  }
  let records = load();
  let filters = { name: '', description: '' };
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let selectedItemCodes = new Set();
  let pickerTab = 'chapters';
  let pickerPage = 1;
  let pickerQuery = '';
  let chosenChapters = new Set();
  let chosenBlocks = new Set();
  let chosenPickerItems = new Set();
  let returnFocus = null;
  let toastTimer;

  root.innerHTML = `
    <div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-catalog-add>${icons.add}Add Catalog</button></div>
      <div class="branches-filter-grid catalog-filter-grid" aria-label="Filter service catalogs">
        <label class="facility-filter"><span>Name</span><input type="search" data-catalog-filter="name" placeholder="Search catalog name"></label>
        <label class="facility-filter"><span>Description</span><input type="search" data-catalog-filter="description" placeholder="Search description"></label>
      </div>
    </div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table catalog-table"><thead><tr><th>Catalog Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody data-catalog-rows></tbody></table></div>
      <div class="facility-empty" data-catalog-empty hidden>No service catalogs match your filters.</div><footer class="facility-pagination"><span data-catalog-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-catalog-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-catalog-page="previous" aria-label="Previous page">‹</button><span data-catalog-page-label></span><button class="icon-button" type="button" data-catalog-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-catalog-page="last" aria-label="Last page">»</button></div></footer></div>
    <input type="file" accept=".csv,text/csv" data-catalog-file hidden>
    <div class="patient-modal-backdrop catalog-modal-backdrop" data-catalog-modal hidden><section class="patient-modal facility-modal catalog-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-modal-title" aria-describedby="catalog-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">SERVICE CATALOG</p><h2 id="catalog-modal-title">Add Catalog</h2><p id="catalog-modal-description">Enter catalog details and select service items.</p></div><button class="icon-button" type="button" data-catalog-close aria-label="Close dialog">${icons.close}</button></header>
      <form data-catalog-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">Catalog Details</legend><div class="facility-form-section-heading">Catalog Details</div><div class="patient-form-grid catalog-form-grid">
        <label class="form-field"><span>Name <b>*</b></span><input name="name" required autocomplete="off"></label>
        <label class="form-field"><span>Description <b>*</b></span><input name="description" required autocomplete="off"></label>
        <label class="form-field"><span>Category</span><select name="categoryCode"><option value="">No category</option>${categoryOptions}</select></label>
        <label class="form-field"><span>Service Group <b>*</b></span><select name="groupId" data-catalog-group-choice required><option value="">Select Service Group</option>${groupOptions}</select><input name="groupDisplay" readonly hidden></label>
      </div></fieldset>
      <section class="catalog-items-section"><div class="catalog-items-heading"><div><div class="facility-form-section-heading">Items</div><p data-catalog-items-help>Select saved service items linked to the selected Group or its Sub Groups.</p></div><button class="button button-secondary" type="button" data-catalog-add-item>${icons.add}Add Item</button></div>
        <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table catalog-items-table"><thead><tr><th class="catalog-item-check"><input type="checkbox" data-catalog-select-all aria-label="Clear all selected items"></th><th>Chapter</th><th>Block</th><th>Code</th><th>Description</th><th>Hospital Code</th><th>Hospital Description</th></tr></thead><tbody data-catalog-item-rows></tbody></table></div><div class="facility-empty" data-catalog-items-empty>No items selected.</div></div>
      </section></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-catalog-cancel>Cancel</button><button class="button button-primary" type="submit" data-catalog-save>Create</button></div></footer></form></section></div>
    <div class="patient-modal-backdrop catalog-picker-backdrop" data-catalog-picker hidden><section class="patient-modal catalog-picker-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-picker-title"><header class="patient-modal-header"><div><p class="eyebrow">SERVICE ITEM LOOKUP</p><h2 id="catalog-picker-title">Add Items</h2><p>Choose from saved Service Items assigned to this Service Group.</p></div><button class="icon-button" type="button" data-picker-close aria-label="Close item picker">${icons.close}</button></header>
      <div class="patient-modal-body"><nav class="service-picker-tabs" role="tablist" aria-label="Browse service item hierarchy"><button type="button" role="tab" data-catalog-tab="chapters" aria-selected="true">Chapters</button><button type="button" role="tab" data-catalog-tab="blocks" aria-selected="false">Blocks</button><button type="button" role="tab" data-catalog-tab="items" aria-selected="false">Items</button></nav>
        <label class="facility-filter catalog-picker-search"><span>Search ${'catalog'}</span><input type="search" data-catalog-picker-search placeholder="Search code or description"></label><div class="catalog-picker-selection" data-picker-selection-count>0 items selected</div>
        <div class="facility-table-card catalog-picker-table"><div class="facility-table-scroll"><table class="facility-table"><thead><tr><th class="catalog-item-check">Select</th><th>Code</th><th>Description</th></tr></thead><tbody data-picker-rows></tbody></table></div><div class="facility-empty" data-picker-empty>No matching entries.</div></div>
        <footer class="facility-pagination"><span data-picker-results></span><div class="facility-page-controls"><button class="icon-button" type="button" data-picker-page="previous" aria-label="Previous page">‹</button><span data-picker-page-label></span><button class="icon-button" type="button" data-picker-page="next" aria-label="Next page">›</button></div></footer>
      </div><footer class="patient-modal-footer"><span>Only items assigned to this Group or its Sub Groups are available.</span><div><button class="button button-secondary" type="button" data-picker-cancel>Cancel</button><button class="button button-primary" type="button" data-picker-add>Add Selected</button></div></footer></section></div>`;

  const rows = root.querySelector('[data-catalog-rows]');
  const modal = root.querySelector('[data-catalog-modal]');
  const picker = root.querySelector('[data-catalog-picker]');
  const form = root.querySelector('[data-catalog-form]');
  const fileInput = root.querySelector('[data-catalog-file]');
  const toast = document.querySelector('[data-facility-toast]');

  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep the current session usable. */ } }
  function showToast(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); }
  function groupFor(record) { return groupById.get(record.groupId); }
  function categoryName(code) { return categoryByCode.get(code)?.description || ''; }
  function eligibleItems(groupId) {
    const group = groupById.get(groupId);
    if (!group) return [];
    const codes = new Set([...(group.itemIds || []), ...groups.filter((item) => item.type === 'subgroup' && item.parentId === groupId).flatMap((item) => item.itemIds || [])]);
    return serviceItems.filter((item) => codes.has(item.code));
  }
  function filteredRecords() {
    return records.filter((record) => (!filters.name || record.name.toLowerCase().includes(filters.name))
      && (!filters.description || record.description.toLowerCase().includes(filters.description)));
  }
  function closeMenus() { root.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; menu.parentElement.querySelector('[data-row-menu]').setAttribute('aria-expanded', 'false'); }); }
  function render() {
    const matching = filteredRecords();
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((record) => `<tr><td><span class="facility-name-en">${esc(record.name)}</span></td><td><span class="catalog-description">${esc(record.description)}</span></td><td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-row-menu aria-label="Actions for ${esc(record.name)}" aria-haspopup="menu" aria-expanded="false" data-id="${esc(record.id)}">${icons.more}</button><div class="facility-row-menu catalog-row-menu" role="menu" hidden><button type="button" role="menuitem" data-catalog-action="view" data-id="${esc(record.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-catalog-action="edit" data-id="${esc(record.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-catalog-action="upload" data-id="${esc(record.id)}">${icons.upload}Upload File</button><button type="button" role="menuitem" data-catalog-action="toggle" data-id="${esc(record.id)}">${icons.status}${record.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    root.querySelector('[data-catalog-empty]').hidden = matching.length > 0;
    root.querySelector('[data-catalog-count]').textContent = `Total Results: ${matching.length}`;
    root.querySelector('[data-catalog-page-label]').textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-catalog-page]').forEach((button) => { button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.catalogPage) ? page === 1 : page === pages); });
  }
  function renderSelectedItems() {
    const selected = eligibleItems(form.elements.namedItem('groupId').value).filter((item) => selectedItemCodes.has(item.code));
    const tbody = form.querySelector('[data-catalog-item-rows]');
    tbody.innerHTML = selected.map((item) => `<tr><td class="catalog-item-check"><input type="checkbox" data-catalog-selected-item="${esc(item.code)}" checked ${mode === 'view' ? 'disabled' : ''} aria-label="Remove ${esc(item.code)}"></td><td>${esc(item.chapter || '—')}</td><td>${esc(item.block || '—')}</td><td class="branch-code">${esc(item.code)}</td><td>${esc(item.shortDescription || item.longDescription || '—')}</td><td>${esc(item.hospitalCode || '—')}</td><td>${esc(item.hospitalDescription || '—')}</td></tr>`).join('');
    const none = selected.length === 0;
    form.querySelector('[data-catalog-items-empty]').hidden = !none;
    form.querySelector('[data-catalog-select-all]').checked = selected.length > 0;
    form.querySelector('[data-catalog-select-all]').disabled = mode === 'view' || none;
    form.querySelector('[data-catalog-add-item]').hidden = mode === 'view';
  }
  function populateGroups() {
    const field = form.elements.namedItem('groupId');
    field.innerHTML = `<option value="">Select Service Group</option>${groupOptions}`;
  }
  function setReadOnly(readOnly) {
    form.elements.namedItem('name').disabled = readOnly;
    form.elements.namedItem('description').disabled = readOnly;
    form.elements.namedItem('categoryCode').disabled = readOnly;
    form.elements.namedItem('groupId').hidden = mode !== 'new';
    form.elements.namedItem('groupId').disabled = mode !== 'new';
    form.elements.namedItem('groupDisplay').hidden = mode === 'new';
    form.elements.namedItem('groupDisplay').disabled = true;
    form.querySelector('[data-catalog-save]').hidden = readOnly;
    form.querySelector('[data-catalog-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
    form.querySelector('[data-catalog-items-help]').textContent = readOnly ? 'Service items included in this catalog.' : 'Select saved service items linked to the selected Group or its Sub Groups.';
  }
  function openForm(nextMode, record = null, trigger = document.activeElement) {
    mode = nextMode;
    activeId = record?.id || null;
    returnFocus = trigger;
    form.reset();
    populateGroups();
    form.elements.namedItem('name').value = record?.name || '';
    form.elements.namedItem('description').value = record?.description || '';
    form.elements.namedItem('categoryCode').value = record?.categoryCode || '';
    form.elements.namedItem('groupId').value = record?.groupId || '';
    const group = record ? groupFor(record) : null;
    form.elements.namedItem('groupDisplay').value = group ? `${group.description} (${group.code})` : '—';
    selectedItemCodes = new Set(record?.itemCodes || []);
    const readOnly = nextMode === 'view';
    setReadOnly(readOnly);
    modal.querySelector('#catalog-modal-title').textContent = `${nextMode === 'new' ? 'Add' : nextMode === 'edit' ? 'Edit' : 'View'} Catalog`;
    modal.querySelector('#catalog-modal-description').textContent = readOnly ? 'Review catalog details and included service items.' : nextMode === 'edit' ? 'Update catalog information and included items.' : 'Enter catalog details and select service items.';
    form.querySelector('[data-catalog-save]').textContent = nextMode === 'edit' ? 'Save Changes' : 'Create';
    form.querySelector('[data-catalog-select-all]').onchange = (event) => {
      const selected = eligibleItems(form.elements.namedItem('groupId').value).filter((item) => selectedItemCodes.has(item.code));
      if (event.target.checked) selected.forEach((item) => selectedItemCodes.add(item.code));
      else selected.forEach((item) => selectedItemCodes.delete(item.code));
      renderSelectedItems();
    };
    renderSelectedItems();
    modal.hidden = false;
    document.body.classList.add('modal-open');
    (readOnly ? form.querySelector('[data-catalog-cancel]') : form.elements.namedItem('name')).focus();
  }
  function closeForm() {
    modal.hidden = true;
    if (picker.hidden) document.body.classList.remove('modal-open');
    returnFocus?.focus?.();
  }
  function closePicker() {
    picker.hidden = true;
    if (modal.hidden) document.body.classList.remove('modal-open');
    form.querySelector('[data-catalog-add-item]').focus();
  }
  function pickerSource() {
    const eligible = eligibleItems(form.elements.namedItem('groupId').value);
    const chapterOptions = new Map();
    const blockOptions = new Map();
    eligible.forEach((item) => {
      chapterOptions.set(item.chapter || 'Unassigned', { code: item.chapter || 'Unassigned', description: item.chapter || 'Unassigned chapter' });
      blockOptions.set(item.block || 'Unassigned', { code: item.block || 'Unassigned', description: item.block || 'Unassigned block', chapter: item.chapter || 'Unassigned' });
    });
    let source = pickerTab === 'chapters' ? [...chapterOptions.values()]
      : pickerTab === 'blocks' ? [...blockOptions.values()].filter((item) => !chosenChapters.size || chosenChapters.has(item.chapter))
        : eligible.filter((item) => (!chosenChapters.size || chosenChapters.has(item.chapter || 'Unassigned')) && (!chosenBlocks.size || chosenBlocks.has(item.block || 'Unassigned')));
    if (pickerQuery) source = source.filter((item) => `${item.code} ${item.description} ${item.shortDescription || ''} ${item.longDescription || ''}`.toLowerCase().includes(pickerQuery));
    return source;
  }
  function renderPicker() {
    const source = pickerSource();
    const pages = Math.max(1, Math.ceil(source.length / 6));
    pickerPage = Math.min(pickerPage, pages);
    const visible = source.slice((pickerPage - 1) * 6, pickerPage * 6);
    const selectedSet = pickerTab === 'chapters' ? chosenChapters : pickerTab === 'blocks' ? chosenBlocks : chosenPickerItems;
    const codeOf = (item) => pickerTab === 'items' ? item.code : item.code;
    picker.querySelector('[data-picker-rows]').innerHTML = visible.map((item) => `<tr><td class="catalog-item-check"><input type="checkbox" data-picker-code="${esc(codeOf(item))}" ${selectedSet.has(codeOf(item)) ? 'checked' : ''} aria-label="Select ${esc(codeOf(item))}"></td><td class="branch-code">${esc(codeOf(item))}</td><td>${esc(pickerTab === 'items' ? item.shortDescription || item.longDescription || 'Service Item' : item.description)}</td></tr>`).join('');
    picker.querySelector('[data-picker-empty]').hidden = source.length > 0;
    picker.querySelector('[data-picker-results]').textContent = `Total Results: ${source.length}`;
    picker.querySelector('[data-picker-page-label]').textContent = `Page ${source.length ? pickerPage : 0} of ${source.length ? pages : 0}`;
    picker.querySelector('[data-picker-page="previous"]').disabled = !source.length || pickerPage <= 1;
    picker.querySelector('[data-picker-page="next"]').disabled = !source.length || pickerPage >= pages;
    picker.querySelector('[data-picker-selection-count]').textContent = `${chosenPickerItems.size} item${chosenPickerItems.size === 1 ? '' : 's'} selected`;
    picker.querySelector('[data-catalog-picker-search]').previousElementSibling.textContent = `Search ${pickerTab}`;
    picker.querySelectorAll('[data-catalog-tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.catalogTab === pickerTab)));
  }
  function openPicker() {
    if (!form.elements.namedItem('groupId').value) { showToast('Select a Service Group first.'); return; }
    pickerTab = 'chapters'; pickerPage = 1; pickerQuery = '';
    chosenChapters = new Set(); chosenBlocks = new Set(); chosenPickerItems = new Set();
    picker.querySelector('[data-catalog-picker-search]').value = '';
    renderPicker(); picker.hidden = false; picker.querySelector('[data-catalog-picker-search]').focus();
  }
  function parseCsv(text) {
    const data = [];
    let row = [], value = '', quoted = false;
    const source = text.replace(/^\uFEFF/, '');
    for (let index = 0; index < source.length; index++) {
      const char = source[index];
      if (char === '"' && quoted && source[index + 1] === '"') { value += '"'; index++; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { row.push(value); value = ''; }
      else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && source[index + 1] === '\n') index++;
        row.push(value); value = '';
        if (row.some((cell) => cell.trim())) data.push(row);
        row = [];
      } else value += char;
    }
    row.push(value);
    if (row.some((cell) => cell.trim())) data.push(row);
    return data;
  }
  async function importFile(file, record) {
    let matrix;
    try { matrix = parseCsv(await file.text()); }
    catch { showToast('The CSV file could not be read.'); return; }
    const header = (matrix.shift() || []).map((value) => value.trim().toLowerCase());
    const codeIndex = header.findIndex((value) => ['code', 'service item code'].includes(value));
    if (codeIndex < 0) { showToast('CSV must include a Code or Service Item Code column.'); return; }
    const eligibleCodes = new Set(eligibleItems(record.groupId).map((item) => item.code.toLowerCase()));
    const knownCodes = new Map(serviceItems.map((item) => [item.code.toLowerCase(), item.code]));
    const linked = new Set(record.itemCodes || []);
    let added = 0, duplicates = 0, unmatched = 0;
    matrix.forEach((line) => {
      const value = String(line[codeIndex] || '').trim();
      if (!value) return;
      const normalized = value.toLowerCase();
      const code = knownCodes.get(normalized);
      if (!code || !eligibleCodes.has(normalized)) { unmatched++; return; }
      if (linked.has(code)) { duplicates++; return; }
      linked.add(code); added++;
    });
    record.itemCodes = [...linked];
    persist(); render();
    showToast(`Added ${added}; skipped ${duplicates} duplicate and ${unmatched} unmatched code${unmatched === 1 ? '' : 's'}.`);
  }

  root.addEventListener('input', (event) => {
    const filter = event.target.closest('[data-catalog-filter]');
    if (filter) { filters[filter.dataset.catalogFilter] = filter.value.trim().toLowerCase(); page = 1; render(); }
    if (event.target.matches('[data-catalog-picker-search]')) { pickerQuery = event.target.value.trim().toLowerCase(); pickerPage = 1; renderPicker(); }
  });
  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-catalog-filter]')) { filters[event.target.dataset.catalogFilter] = event.target.value.trim().toLowerCase(); page = 1; render(); }
    if (event.target.matches('[data-catalog-group-choice]')) renderSelectedItems();
    if (event.target.matches('[data-catalog-selected-item]')) { selectedItemCodes.delete(event.target.dataset.catalogSelectedItem); renderSelectedItems(); }
    if (event.target.matches('[data-picker-code]')) {
      const code = event.target.dataset.pickerCode;
      const set = pickerTab === 'chapters' ? chosenChapters : pickerTab === 'blocks' ? chosenBlocks : chosenPickerItems;
      if (event.target.checked) set.add(code); else set.delete(code);
      renderPicker();
    }
  });
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) {
      if (button.matches('[data-catalog-add]')) openForm('new', null, button);
      else if (button.matches('[data-row-menu]')) { const menu = button.nextElementSibling; const shouldOpen = menu.hidden; closeMenus(); menu.hidden = !shouldOpen; button.setAttribute('aria-expanded', String(shouldOpen)); }
      else if (button.matches('[data-catalog-action]')) {
        const record = records.find((item) => item.id === button.dataset.id);
        if (!record) return;
        closeMenus();
        if (button.dataset.catalogAction === 'toggle') { record.active = !record.active; persist(); render(); showToast(`${record.name} ${record.active ? 'activated' : 'deactivated'}.`); }
        else if (button.dataset.catalogAction === 'upload') { fileInput.dataset.catalogId = record.id; fileInput.click(); }
        else openForm(button.dataset.catalogAction, record, button);
      } else if (button.matches('[data-catalog-add-item]')) openPicker();
      else if (button.matches('[data-catalog-close], [data-catalog-cancel]')) closeForm();
      else if (button.matches('[data-picker-close], [data-picker-cancel]')) closePicker();
      else if (button.matches('[data-catalog-tab]')) { pickerTab = button.dataset.catalogTab; pickerPage = 1; renderPicker(); }
      else if (button.matches('[data-picker-page]')) { pickerPage += button.dataset.pickerPage === 'next' ? 1 : -1; renderPicker(); }
      else if (button.matches('[data-picker-add]')) {
        selectedItemCodes = new Set([...selectedItemCodes, ...chosenPickerItems]);
        closePicker(); renderSelectedItems();
      } else if (button.matches('[data-catalog-page]')) {
        const pages = Math.max(1, Math.ceil(filteredRecords().length / pageSize));
        if (button.dataset.catalogPage === 'first') page = 1;
        if (button.dataset.catalogPage === 'previous') page--;
        if (button.dataset.catalogPage === 'next') page++;
        if (button.dataset.catalogPage === 'last') page = pages;
        render();
      }
    }
  });
  modal.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const groupId = mode === 'new' ? form.elements.namedItem('groupId').value : records.find((record) => record.id === activeId)?.groupId;
    if (!groupById.has(groupId)) { showToast('Select a valid Service Group.'); return; }
    const record = {
      id: activeId || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `catalog-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      name: form.elements.namedItem('name').value.trim(), description: form.elements.namedItem('description').value.trim(),
      categoryCode: form.elements.namedItem('categoryCode').value, groupId,
      itemCodes: [...selectedItemCodes].filter((code) => eligibleItems(groupId).some((item) => item.code === code)),
      active: mode === 'edit' ? Boolean(records.find((item) => item.id === activeId)?.active) : true,
    };
    if (mode === 'edit') records = records.map((item) => item.id === activeId ? record : item);
    else records.unshift(record);
    persist(); render(); closeForm(); showToast(mode === 'edit' ? 'Service Catalog updated.' : 'Service Catalog created.');
  });
  modal.addEventListener('click', (event) => { if (event.target === modal) closeForm(); });
  picker.addEventListener('click', (event) => { if (event.target === picker) closePicker(); });
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    const record = records.find((item) => item.id === fileInput.dataset.catalogId);
    if (file && record) await importFile(file, record);
    fileInput.value = '';
  });
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!picker.hidden) closePicker();
    else if (!modal.hidden) closeForm();
  });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) closeMenus(); });
  window.addEventListener('hashchange', () => { root.hidden = location.hash.slice(1) !== 'service-catalog'; });
  root.hidden = location.hash.slice(1) !== 'service-catalog';
  render();
})();
