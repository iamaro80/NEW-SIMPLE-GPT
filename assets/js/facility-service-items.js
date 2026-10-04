(() => {
  const root = document.querySelector('[data-service-items-grid]');
  if (!root) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-service-items:v1:${facilityId}`;
  const pageSize = 5;
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icon = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const chapterCatalog = [
    { code: 'CH-01', description: 'Consultations and clinical assessments' },
    { code: 'CH-02', description: 'Diagnostic and laboratory services' },
    { code: 'CH-03', description: 'Imaging and radiology services' },
    { code: 'CH-04', description: 'Pharmacy and medication services' },
  ];
  const blockCatalog = [
    { code: 'BL-01A', chapter: 'CH-01', description: 'Primary care consultations' },
    { code: 'BL-01B', chapter: 'CH-01', description: 'Specialty consultations' },
    { code: 'BL-02A', chapter: 'CH-02', description: 'Core laboratory panels' },
    { code: 'BL-02B', chapter: 'CH-02', description: 'Microbiology testing' },
    { code: 'BL-03A', chapter: 'CH-03', description: 'General radiography' },
    { code: 'BL-03B', chapter: 'CH-03', description: 'Cross-sectional imaging' },
    { code: 'BL-04A', chapter: 'CH-04', description: 'Outpatient pharmacy' },
    { code: 'BL-04B', chapter: 'CH-04', description: 'Medication administration' },
  ];
  const itemCatalog = [
    { code: 'SV-1001', chapter: 'CH-01', block: 'BL-01A', description: 'Primary care consultation' },
    { code: 'SV-1002', chapter: 'CH-01', block: 'BL-01A', description: 'Follow-up consultation' },
    { code: 'SV-1011', chapter: 'CH-01', block: 'BL-01B', description: 'Cardiology specialist consultation' },
    { code: 'SV-1012', chapter: 'CH-01', block: 'BL-01B', description: 'Pediatric specialist consultation' },
    { code: 'SV-2001', chapter: 'CH-02', block: 'BL-02A', description: 'Complete blood count' },
    { code: 'SV-2002', chapter: 'CH-02', block: 'BL-02A', description: 'Comprehensive metabolic panel' },
    { code: 'SV-2011', chapter: 'CH-02', block: 'BL-02B', description: 'Urine culture and sensitivity' },
    { code: 'SV-2012', chapter: 'CH-02', block: 'BL-02B', description: 'Wound culture and sensitivity' },
    { code: 'SV-3001', chapter: 'CH-03', block: 'BL-03A', description: 'Chest radiograph, two views' },
    { code: 'SV-3002', chapter: 'CH-03', block: 'BL-03A', description: 'Extremity radiograph, two views' },
    { code: 'SV-3011', chapter: 'CH-03', block: 'BL-03B', description: 'CT scan of head without contrast' },
    { code: 'SV-3012', chapter: 'CH-03', block: 'BL-03B', description: 'Ultrasound abdomen, complete' },
    { code: 'SV-4001', chapter: 'CH-04', block: 'BL-04A', description: 'Outpatient medication dispensing' },
    { code: 'SV-4002', chapter: 'CH-04', block: 'BL-04A', description: 'Medication reconciliation service' },
    { code: 'SV-4011', chapter: 'CH-04', block: 'BL-04B', description: 'Intramuscular medication administration' },
    { code: 'SV-4012', chapter: 'CH-04', block: 'BL-04B', description: 'Intravenous medication administration' },
  ];
  const seed = [
    { chapter: 'CH-01', block: 'BL-01A', code: 'SV-1001', longDescription: 'Evaluation and management for a new or established primary care visit.', shortDescription: 'Primary care consultation', hospitalCode: 'HSP-OP-001', hospitalDescription: 'Outpatient Consultation', alias: 'Primary consult', costCenter: 'CC-AMB', subCostCenter: 'CC-AMB-FAM', departmentName: 'Family Medicine Clinic', subDepartment: '', category: 'Consultation', taxCategory: 'Healthcare service', type: 'Professional Service', isPackage: false, isListed: true, materialCost: 0, depreciationCost: 0, active: true },
    { chapter: 'CH-01', block: 'BL-01A', code: 'SV-1002', longDescription: 'Follow-up assessment for an existing treatment plan.', shortDescription: 'Follow-up consultation', hospitalCode: 'HSP-OP-002', hospitalDescription: 'Follow-up Visit', alias: 'Follow-up', costCenter: 'CC-AMB', subCostCenter: 'CC-AMB-FAM', departmentName: 'Family Medicine Clinic', subDepartment: '', category: 'Consultation', taxCategory: 'Healthcare service', type: 'Professional Service', isPackage: false, isListed: true, materialCost: 0, depreciationCost: 0, active: true },
    { chapter: 'CH-02', block: 'BL-02A', code: 'SV-2001', longDescription: 'Hematology test including red cells, white cells, hemoglobin, and platelets.', shortDescription: 'Complete blood count', hospitalCode: 'HSP-LAB-001', hospitalDescription: 'Core Laboratory', alias: 'CBC', costCenter: 'CC-LAB', subCostCenter: 'CC-LAB-CORE', departmentName: 'Clinical Laboratory', subDepartment: '', category: 'Laboratory', taxCategory: 'Healthcare service', type: 'Laboratory Service', isPackage: false, isListed: true, materialCost: 12, depreciationCost: 3, active: true },
    { chapter: 'CH-03', block: 'BL-03A', code: 'SV-3001', longDescription: 'Standard chest radiographic examination with frontal and lateral projections.', shortDescription: 'Chest radiograph, two views', hospitalCode: 'HSP-RAD-001', hospitalDescription: 'General Radiology', alias: 'Chest X-ray', costCenter: 'CC-DIAG', subCostCenter: 'CC-DIAG-RAD', departmentName: 'Diagnostic Imaging', subDepartment: '', category: 'Imaging', taxCategory: 'Healthcare service', type: 'Diagnostic Service', isPackage: false, isListed: true, materialCost: 18, depreciationCost: 7, active: true },
    { chapter: 'CH-04', block: 'BL-04A', code: 'SV-4001', longDescription: 'Preparation and dispensing of an outpatient prescription.', shortDescription: 'Outpatient medication dispensing', hospitalCode: 'HSP-PH-001', hospitalDescription: 'Outpatient Pharmacy', alias: 'OP dispensing', costCenter: 'CC-PHARM', subCostCenter: 'CC-PHARM-OP', departmentName: 'Outpatient Pharmacy', subDepartment: '', category: 'Pharmacy', taxCategory: 'Healthcare service', type: 'Pharmacy Service', isPackage: false, isListed: true, materialCost: 4, depreciationCost: 1, active: true },
    { chapter: 'CH-02', block: 'BL-02B', code: 'SV-2011', longDescription: 'Culture of urine specimen with antimicrobial susceptibility when indicated.', shortDescription: 'Urine culture and sensitivity', hospitalCode: 'HSP-LAB-004', hospitalDescription: 'Microbiology Laboratory', alias: 'Urine C&S', costCenter: 'CC-LAB', subCostCenter: 'CC-LAB-CORE', departmentName: 'Clinical Laboratory', subDepartment: '', category: 'Laboratory', taxCategory: 'Healthcare service', type: 'Laboratory Service', isPackage: false, isListed: false, materialCost: 22, depreciationCost: 5, active: false },
  ];

  function load() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep this prototype usable without browser storage. */ }
    return seed.map((item) => ({ ...item }));
  }
  let records = load();
  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeCode = null;
  let returnFocus = null;
  let toastTimer;
  let pickerTab = 'chapters';
  const chosenChapters = new Set();
  const chosenBlocks = new Set();
  const chosenItems = new Set();

  root.innerHTML = `
    <div class="branches-toolbar"><div class="branches-add-row service-items-actions">
      <button class="button button-primary" type="button" data-item-add>${icon.add}Add Item</button>
      <button class="button button-secondary" type="button" data-item-add-multiple>${icon.add}Add Multiple Items</button>
      <span class="service-items-toolbar-spacer"></span>
      <button class="button button-secondary" type="button">Export</button><button class="button button-secondary" type="button">Download Sample</button><button class="button button-secondary" type="button">Upload</button><button class="button button-secondary" type="button">Sync</button>
    </div><div class="branches-filter-grid service-items-filter-grid" aria-label="Filter service items">
      <label class="facility-filter"><span>Hospital Code</span><input type="search" data-filter="hospitalCode" placeholder="Search hospital code"></label>
      <label class="facility-filter"><span>Code</span><input type="search" data-filter="code" placeholder="Search code"></label>
      <label class="facility-filter"><span>Description</span><input type="search" data-filter="description" placeholder="Search description"></label>
      <label class="facility-filter"><span>Status</span><select data-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      <label class="facility-filter"><span>Is Package</span><select data-filter="isPackage"><option value="">All items</option><option value="true">Package</option><option value="false">Not package</option></select></label>
    </div></div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table service-items-table"><thead><tr><th>Chapter</th><th>Block</th><th>Code</th><th>Long Description</th><th>Short Description</th><th>Hospital Code</th><th>Hospital Description</th><th>Alias</th><th>Status</th><th>Actions</th></tr></thead><tbody data-rows></tbody></table></div>
    <div class="facility-empty" data-empty hidden>No service items match your filters.</div><footer class="facility-pagination"><span data-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-page="previous" aria-label="Previous page">‹</button><span data-page-label></span><button class="icon-button" type="button" data-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-page="last" aria-label="Last page">»</button></div></footer></div>
    <div class="patient-modal-backdrop" data-service-modal hidden><section class="patient-modal facility-modal service-item-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title"><header class="patient-modal-header"><div><p class="eyebrow">SERVICE ITEM RECORD</p><h2 id="service-modal-title">Add Item</h2><p data-service-modal-description>Enter service item details.</p></div><button class="icon-button" type="button" data-close-service aria-label="Close dialog">×</button></header>
      <form data-service-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">General Details</legend><div class="facility-form-section-heading">General Details</div><div class="patient-form-grid service-item-form-grid">
        <label class="form-field"><span>Chapter <b>*</b></span><input name="chapter" required></label><label class="form-field"><span>Block <b>*</b></span><input name="block" required></label><label class="form-field"><span>Code <b>*</b></span><input name="code" required></label>
        <label class="form-field"><span>Long Description</span><textarea name="longDescription"></textarea></label><label class="form-field"><span>Short Description <b>*</b></span><input name="shortDescription" required></label><label class="form-field"><span>Alias</span><input name="alias"></label>
        <label class="form-field"><span>Hospital Code <b>*</b></span><input name="hospitalCode" maxlength="20" required></label><label class="form-field"><span>Hospital Description</span><input name="hospitalDescription" maxlength="250"></label>
        <label class="form-field"><span>Cost Center</span><input name="costCenter"></label><label class="form-field"><span>Sub Cost Center</span><input name="subCostCenter"></label><label class="form-field"><span>Department Name</span><input name="departmentName"></label><label class="form-field"><span>Sub Department</span><input name="subDepartment" readonly></label>
        <label class="form-field"><span>Category</span><input name="category"></label><label class="form-field"><span>Tax Category</span><input name="taxCategory"></label><label class="form-field"><span>Type <b>*</b></span><input name="type" required></label>
      </div><div class="service-item-checks"><label><input name="isPackage" type="checkbox"> Is Package</label><label><input name="isListed" type="checkbox"> Is Listed</label></div></fieldset>
      <fieldset class="patient-form-section"><legend class="sr-only">Cost</legend><div class="facility-form-section-heading">Cost</div><div class="patient-form-grid"><label class="form-field"><span>Material Cost</span><input name="materialCost" type="number" step="0.01" value="0"></label><label class="form-field"><span>Dep Cost</span><input name="depreciationCost" type="number" step="0.01" value="0"></label><label class="form-field"><span>Total</span><input name="totalCost" type="number" readonly value="0"></label></div></fieldset></div>
      <footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-cancel-service>Cancel</button><button class="button button-primary" type="submit" data-save-service>Create</button></div></footer></form></section></div>
    <div class="patient-modal-backdrop" data-picker-modal hidden><section class="patient-modal facility-modal service-picker-modal" role="dialog" aria-modal="true" aria-labelledby="service-picker-title"><header class="patient-modal-header"><div><p class="eyebrow">SERVICE CATALOG</p><h2 id="service-picker-title">Add Multiple Items</h2><p>Browse the catalog hierarchy and select service items to add.</p></div><button class="icon-button" type="button" data-close-picker aria-label="Close dialog">×</button></header>
      <div class="patient-modal-body"><nav class="service-picker-tabs" role="tablist"><button type="button" role="tab" data-picker-tab="chapters" aria-selected="true">Chapters</button><button type="button" role="tab" data-picker-tab="blocks" aria-selected="false">Blocks</button><button type="button" role="tab" data-picker-tab="items" aria-selected="false">Items</button></nav>
      <label class="facility-filter service-picker-search"><span>Search catalog</span><input type="search" data-picker-search placeholder="Search code or description"></label><div class="service-picker-selection" data-picker-count>0 items selected</div>
      <div class="service-picker-grid"><table class="facility-table"><thead><tr><th class="service-picker-check"></th><th>Code</th><th>Description</th></tr></thead><tbody data-picker-rows></tbody></table></div><footer class="facility-pagination"><span data-picker-result-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-picker-page="previous" aria-label="Previous page">‹</button><span data-picker-page-label></span><button class="icon-button" type="button" data-picker-page="next" aria-label="Next page">›</button></div></footer>
      <fieldset class="patient-form-section service-picker-shared"><legend class="sr-only">Shared Item Values</legend><div class="facility-form-section-heading">Values for Selected Items</div><div class="patient-form-grid"><label class="form-field"><span>Hospital Code <b>*</b></span><input data-picker-hospital-code maxlength="20" required></label><label class="form-field"><span>Type <b>*</b></span><input data-picker-type required></label></div></fieldset></div>
      <footer class="patient-modal-footer"><span class="required-hint">Selected catalog rows will be added as active items.</span><div><button class="button button-secondary" type="button" data-cancel-picker>Cancel</button><button class="button button-primary" type="button" data-confirm-picker>Add Selected</button></div></footer></section></div>`;

  const rows = root.querySelector('[data-rows]');
  const empty = root.querySelector('[data-empty]');
  const count = root.querySelector('[data-count]');
  const pageLabel = root.querySelector('[data-page-label]');
  const modal = root.querySelector('[data-service-modal]');
  const form = root.querySelector('[data-service-form]');
  const picker = root.querySelector('[data-picker-modal]');
  const toast = document.querySelector('[data-facility-toast]');
  const fieldNames = ['chapter', 'block', 'code', 'longDescription', 'shortDescription', 'hospitalCode', 'hospitalDescription', 'alias', 'costCenter', 'subCostCenter', 'departmentName', 'subDepartment', 'category', 'taxCategory', 'type', 'materialCost', 'depreciationCost'];

  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Retain current session state. */ } }
  function showToast(message) { toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300); }
  function chapterName(code) { return chapterCatalog.find((item) => item.code === code)?.description || code || '—'; }
  function blockName(code) { return blockCatalog.find((item) => item.code === code)?.description || code || '—'; }
  function filteredRecords() {
    return records.filter((record) => {
      if (filters.hospitalCode && !String(record.hospitalCode).toLowerCase().includes(filters.hospitalCode)) return false;
      if (filters.code && !String(record.code).toLowerCase().includes(filters.code)) return false;
      if (filters.description && !`${record.longDescription || ''} ${record.shortDescription || ''} ${record.alias || ''}`.toLowerCase().includes(filters.description)) return false;
      if (filters.status && (record.active ? 'active' : 'inactive') !== filters.status) return false;
      if (filters.isPackage && String(Boolean(record.isPackage)) !== filters.isPackage) return false;
      return true;
    });
  }
  function closeMenus() { rows.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; menu.parentElement.querySelector('[data-row-menu]').setAttribute('aria-expanded', 'false'); }); }
  function render() {
    const matching = filteredRecords();
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((record) => `<tr><td>${escapeHtml(chapterName(record.chapter))}</td><td>${escapeHtml(blockName(record.block))}</td><td class="branch-code">${escapeHtml(record.code)}</td><td class="service-description-cell">${escapeHtml(record.longDescription || '—')}</td><td><span class="facility-name-en">${escapeHtml(record.shortDescription)}</span></td><td>${escapeHtml(record.hospitalCode)}</td><td>${escapeHtml(record.hospitalDescription || '—')}</td><td>${escapeHtml(record.alias || '—')}</td><td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-row-menu aria-label="Actions for ${escapeHtml(record.shortDescription)}" aria-haspopup="menu" aria-expanded="false" data-code="${escapeHtml(record.code)}">${icon.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-action="view" data-code="${escapeHtml(record.code)}">${icon.eye}View</button><button type="button" role="menuitem" data-action="edit" data-code="${escapeHtml(record.code)}">${icon.edit}Edit</button><button type="button" role="menuitem" data-action="toggle" data-code="${escapeHtml(record.code)}">${icon.status}${record.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    empty.hidden = matching.length > 0;
    count.textContent = `Total Results: ${matching.length}`;
    pageLabel.textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-page]').forEach((button) => { button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.page) ? page === 1 : page === pages); });
  }
  function populateForm(record = {}) {
    form.reset();
    fieldNames.forEach((name) => { const field = form.elements.namedItem(name); if (field) field.value = record[name] ?? (['materialCost', 'depreciationCost'].includes(name) ? 0 : ''); });
    form.elements.namedItem('isPackage').checked = Boolean(record.isPackage);
    form.elements.namedItem('isListed').checked = Boolean(record.isListed);
    updateTotal();
  }
  function updateTotal() {
    const material = Number(form.elements.namedItem('materialCost').value) || 0;
    const depreciation = Number(form.elements.namedItem('depreciationCost').value) || 0;
    form.elements.namedItem('totalCost').value = (material + depreciation).toFixed(2).replace(/\.00$/, '');
  }
  function setReadonly(readOnly) {
    [...form.querySelectorAll('input,textarea')].forEach((field) => { if (field.name !== 'totalCost') field.disabled = readOnly; });
    form.querySelector('[data-save-service]').hidden = readOnly;
    form.querySelector('[data-cancel-service]').textContent = readOnly ? 'Close' : 'Cancel';
  }
  function openForm(nextMode, record = null, trigger = document.activeElement) {
    mode = nextMode;
    activeCode = record?.code || null;
    returnFocus = trigger;
    populateForm(record || {});
    setReadonly(nextMode === 'view');
    modal.querySelector('#service-modal-title').textContent = nextMode === 'new' ? 'Add Item' : nextMode === 'edit' ? 'Edit Item' : 'Service Item Details';
    modal.querySelector('[data-service-modal-description]').textContent = nextMode === 'view' ? 'Review service item details.' : nextMode === 'edit' ? 'Update service item information.' : 'Enter service item details.';
    form.querySelector('[data-save-service]').textContent = nextMode === 'edit' ? 'Save Changes' : 'Create';
    modal.hidden = false;
    document.body.classList.add('modal-open');
    (nextMode === 'view' ? form.querySelector('[name="chapter"]') : form.querySelector('[name="chapter"]')).focus();
  }
  function closeForm() { modal.hidden = true; document.body.classList.remove('modal-open'); returnFocus?.focus?.(); }
  function pickerRows() {
    const query = picker.querySelector('[data-picker-search]').value.trim().toLowerCase();
    let source = pickerTab === 'chapters' ? chapterCatalog : pickerTab === 'blocks' ? blockCatalog.filter((item) => !chosenChapters.size || chosenChapters.has(item.chapter)) : itemCatalog.filter((item) => (!chosenChapters.size || chosenChapters.has(item.chapter)) && (!chosenBlocks.size || chosenBlocks.has(item.block)));
    if (query) source = source.filter((item) => `${item.code} ${item.description}`.toLowerCase().includes(query));
    return source;
  }
  let pickerPage = 1;
  function renderPicker() {
    const list = pickerRows();
    const pages = Math.max(1, Math.ceil(list.length / 6));
    pickerPage = Math.min(pickerPage, pages);
    const selectedSet = pickerTab === 'chapters' ? chosenChapters : pickerTab === 'blocks' ? chosenBlocks : chosenItems;
    const current = list.slice((pickerPage - 1) * 6, pickerPage * 6);
    picker.querySelector('[data-picker-rows]').innerHTML = current.map((item) => `<tr><td class="service-picker-check"><input type="checkbox" data-catalog-code="${escapeHtml(item.code)}" ${selectedSet.has(item.code) ? 'checked' : ''} aria-label="Select ${escapeHtml(item.code)}"></td><td class="branch-code">${escapeHtml(item.code)}</td><td>${escapeHtml(item.description)}</td></tr>`).join('');
    picker.querySelector('[data-picker-result-count]').textContent = `Total Results: ${list.length}`;
    picker.querySelector('[data-picker-page-label]').textContent = `Page ${list.length ? pickerPage : 0} of ${list.length ? pages : 0}`;
    picker.querySelector('[data-picker-page="previous"]').disabled = pickerPage <= 1;
    picker.querySelector('[data-picker-page="next"]').disabled = pickerPage >= pages;
    picker.querySelector('[data-picker-count]').textContent = `${chosenItems.size} item${chosenItems.size === 1 ? '' : 's'} selected`;
    picker.querySelectorAll('[data-picker-tab]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.pickerTab === pickerTab)));
  }
  function openPicker() { chosenChapters.clear(); chosenBlocks.clear(); chosenItems.clear(); pickerTab = 'chapters'; pickerPage = 1; picker.querySelector('[data-picker-search]').value = ''; picker.querySelector('[data-picker-hospital-code]').value = ''; picker.querySelector('[data-picker-type]').value = ''; renderPicker(); picker.hidden = false; document.body.classList.add('modal-open'); picker.querySelector('[data-picker-search]').focus(); }
  function closePicker() { picker.hidden = true; document.body.classList.remove('modal-open'); root.querySelector('[data-item-add-multiple]').focus(); }

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-filter]')) { filters[event.target.dataset.filter] = event.target.value.trim().toLowerCase(); page = 1; render(); }
    if (event.target.matches('[name="materialCost"], [name="depreciationCost"]')) updateTotal();
  });
  root.addEventListener('change', (event) => { if (event.target.matches('[data-filter]')) { filters[event.target.dataset.filter] = event.target.value.trim().toLowerCase(); page = 1; render(); } });
  root.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.matches('[data-item-add]')) openForm('new', null, target);
    else if (target.matches('[data-item-add-multiple]')) openPicker();
    else if (target.matches('[data-row-menu]')) {
      const menu = target.nextElementSibling;
      const shouldOpen = menu.hidden;
      closeMenus(); menu.hidden = !shouldOpen; target.setAttribute('aria-expanded', String(shouldOpen));
    } else if (target.matches('[data-action]')) {
      const record = records.find((item) => item.code === target.dataset.code);
      if (!record) return;
      closeMenus();
      if (target.dataset.action === 'toggle') { record.active = !record.active; persist(); render(); showToast(`${record.shortDescription} ${record.active ? 'activated' : 'deactivated'}.`); }
      else openForm(target.dataset.action, record, target);
    } else if (target.matches('[data-page]')) {
      const pages = Math.max(1, Math.ceil(filteredRecords().length / pageSize));
      if (target.dataset.page === 'first') page = 1;
      if (target.dataset.page === 'previous') page--;
      if (target.dataset.page === 'next') page++;
      if (target.dataset.page === 'last') page = pages;
      render();
    }
  });
  modal.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(fieldNames.map((name) => [name, form.elements.namedItem(name).value.trim()]));
    const duplicate = records.some((item) => item.code.toLowerCase() === data.code.toLowerCase() && item.code !== activeCode);
    if (duplicate) { form.elements.namedItem('code').setCustomValidity('This service item code is already in use.'); form.reportValidity(); form.elements.namedItem('code').setCustomValidity(''); return; }
    data.materialCost = Number(data.materialCost) || 0;
    data.depreciationCost = Number(data.depreciationCost) || 0;
    data.isPackage = form.elements.namedItem('isPackage').checked;
    data.isListed = form.elements.namedItem('isListed').checked;
    data.active = mode === 'edit' ? Boolean(records.find((item) => item.code === activeCode)?.active) : true;
    if (mode === 'edit') records = records.map((item) => item.code === activeCode ? data : item);
    else records.unshift(data);
    persist(); render(); closeForm(); showToast(mode === 'edit' ? 'Service item updated.' : 'Service item created.');
  });
  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-close-service], [data-cancel-service]')) closeForm();
  });
  picker.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-picker-tab]');
    if (tab) { pickerTab = tab.dataset.pickerTab; pickerPage = 1; renderPicker(); return; }
    const pageButton = event.target.closest('[data-picker-page]');
    if (pageButton) { pickerPage += pageButton.dataset.pickerPage === 'next' ? 1 : -1; renderPicker(); return; }
    if (event.target.closest('[data-close-picker], [data-cancel-picker]')) { closePicker(); return; }
    if (event.target.closest('[data-confirm-picker]')) {
      const hospitalCode = picker.querySelector('[data-picker-hospital-code]');
      const type = picker.querySelector('[data-picker-type]');
      if (!chosenItems.size) { showToast('Select at least one item.'); return; }
      if (!hospitalCode.reportValidity() || !type.reportValidity()) return;
      const alreadyThere = [...chosenItems].filter((code) => records.some((record) => record.code.toLowerCase() === code.toLowerCase()));
      if (alreadyThere.length) { showToast(`Already added: ${alreadyThere.join(', ')}.`); return; }
      const additions = [...chosenItems].map((code) => {
        const item = itemCatalog.find((entry) => entry.code === code);
        return { chapter: item.chapter, block: item.block, code: item.code, longDescription: '', shortDescription: item.description, hospitalCode: hospitalCode.value.trim(), hospitalDescription: '', alias: '', costCenter: '', subCostCenter: '', departmentName: '', subDepartment: '', category: '', taxCategory: '', type: type.value.trim(), isPackage: false, isListed: false, materialCost: 0, depreciationCost: 0, active: true };
      });
      records.unshift(...additions); persist(); page = 1; render(); closePicker(); showToast(`${additions.length} service item${additions.length === 1 ? '' : 's'} added.`);
    }
  });
  picker.addEventListener('input', (event) => { if (event.target.matches('[data-picker-search]')) { pickerPage = 1; renderPicker(); } });
  picker.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-catalog-code]');
    if (!checkbox) return;
    const code = checkbox.dataset.catalogCode;
    const set = pickerTab === 'chapters' ? chosenChapters : pickerTab === 'blocks' ? chosenBlocks : chosenItems;
    if (checkbox.checked) set.add(code); else set.delete(code);
    if (pickerTab === 'chapters') {
      const allowedBlocks = new Set(blockCatalog.filter((item) => !chosenChapters.size || chosenChapters.has(item.chapter)).map((item) => item.code));
      [...chosenBlocks].forEach((value) => { if (!allowedBlocks.has(value)) chosenBlocks.delete(value); });
      const allowedItems = new Set(itemCatalog.filter((item) => (!chosenChapters.size || chosenChapters.has(item.chapter)) && (!chosenBlocks.size || chosenBlocks.has(item.block))).map((item) => item.code));
      [...chosenItems].forEach((value) => { if (!allowedItems.has(value)) chosenItems.delete(value); });
    } else if (pickerTab === 'blocks') {
      const allowedItems = new Set(itemCatalog.filter((item) => (!chosenChapters.size || chosenChapters.has(item.chapter)) && (!chosenBlocks.size || chosenBlocks.has(item.block))).map((item) => item.code));
      [...chosenItems].forEach((value) => { if (!allowedItems.has(value)) chosenItems.delete(value); });
    }
    renderPicker();
  });
  picker.addEventListener('click', (event) => { if (event.target === picker) closePicker(); });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) closeMenus(); });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeForm(); else if (event.key === 'Escape' && !picker.hidden) closePicker(); });
  window.addEventListener('hashchange', () => { root.hidden = location.hash.slice(1) !== 'service-items'; });
  root.hidden = location.hash.slice(1) !== 'service-items';
  render();
})();
