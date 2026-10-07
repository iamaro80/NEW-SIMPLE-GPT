(() => {
  const facilities = (window.RcmFacilityStore?.list?.() || []).map((facility) => ({ ...facility, id: String(facility.id) }));
  const routes = ['service-items', 'categories', 'groups', 'service-catalog'];
  const keys = {
    'service-items': 'rcm-facility-service-items:v1:',
    categories: 'rcm-facility-categories:v1:',
    groups: 'rcm-facility-groups:v1:',
    'service-catalog': 'rcm-facility-service-catalogs:v1:',
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const read = (key) => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const storageKey = (route, facilityId) => `${keys[route]}${facilityId}`;
  const toast = document.querySelector('[data-facility-toast]');
  let toastTimer;
  const chapters = [
    { code: 'CH-01', description: 'Chapter 1' }, { code: 'CH-02', description: 'Chapter 2' },
    { code: 'CH-03', description: 'Chapter 3' }, { code: 'CH-04', description: 'Chapter 4' },
  ];
  const blocks = [
    { code: 'BL-01A', chapter: 'CH-01', description: 'Block 1' }, { code: 'BL-01B', chapter: 'CH-01', description: 'Block 2' },
    { code: 'BL-02A', chapter: 'CH-02', description: 'Block 3' }, { code: 'BL-02B', chapter: 'CH-02', description: 'Block 4' },
    { code: 'BL-03A', chapter: 'CH-03', description: 'Block 5' }, { code: 'BL-03B', chapter: 'CH-03', description: 'Block 6' },
    { code: 'BL-04A', chapter: 'CH-04', description: 'Block 7' }, { code: 'BL-04B', chapter: 'CH-04', description: 'Block 8' },
  ];
  const itemSeed = [
    { chapter: 'CH-01', block: 'BL-01A', code: 'SV-1001', longDescription: 'Service item description 1', shortDescription: 'Service Item 1', hospitalCode: 'HSP-OP-001', hospitalDescription: 'Hospital Service 1', alias: 'Service alias 1', costCenter: 'CC-AMB', subCostCenter: 'CC-AMB-FAM', departmentName: 'Department 1', subDepartment: '', category: 'Consultation', taxCategory: 'Healthcare service', type: 'Professional Service', isPackage: false, isListed: true, materialCost: 0, depreciationCost: 0, active: true },
    { chapter: 'CH-01', block: 'BL-01A', code: 'SV-1002', longDescription: 'Service item description 2', shortDescription: 'Service Item 2', hospitalCode: 'HSP-OP-002', hospitalDescription: 'Hospital Service 2', alias: 'Service alias 2', costCenter: 'CC-AMB', subCostCenter: 'CC-AMB-FAM', departmentName: 'Department 1', subDepartment: '', category: 'Consultation', taxCategory: 'Healthcare service', type: 'Professional Service', isPackage: false, isListed: true, materialCost: 0, depreciationCost: 0, active: true },
    { chapter: 'CH-02', block: 'BL-02A', code: 'SV-2001', longDescription: 'Service item description 5', shortDescription: 'Service Item 5', hospitalCode: 'HSP-LAB-001', hospitalDescription: 'Hospital Service 5', alias: 'Service alias 5', costCenter: 'CC-LAB', subCostCenter: 'CC-LAB-CORE', departmentName: 'Department 5', subDepartment: '', category: 'Laboratory', taxCategory: 'Healthcare service', type: 'Laboratory Service', isPackage: false, isListed: true, materialCost: 12, depreciationCost: 3, active: true },
    { chapter: 'CH-03', block: 'BL-03A', code: 'SV-3001', longDescription: 'Service item description 9', shortDescription: 'Service Item 9', hospitalCode: 'HSP-RAD-001', hospitalDescription: 'Hospital Service 9', alias: 'Service alias 9', costCenter: 'CC-DIAG', subCostCenter: 'CC-DIAG-RAD', departmentName: 'Department 6', subDepartment: '', category: 'Imaging', taxCategory: 'Healthcare service', type: 'Diagnostic Service', isPackage: false, isListed: true, materialCost: 18, depreciationCost: 7, active: true },
    { chapter: 'CH-04', block: 'BL-04A', code: 'SV-4001', longDescription: 'Service item description 13', shortDescription: 'Service Item 13', hospitalCode: 'HSP-PH-001', hospitalDescription: 'Hospital Service 13', alias: 'Service alias 13', costCenter: 'CC-PHARM', subCostCenter: 'CC-PHARM-OP', departmentName: 'Department 4', subDepartment: '', category: 'Pharmacy', taxCategory: 'Healthcare service', type: 'Pharmacy Service', isPackage: false, isListed: true, materialCost: 4, depreciationCost: 1, active: true },
    { chapter: 'CH-02', block: 'BL-02B', code: 'SV-2011', longDescription: 'Service item description 7', shortDescription: 'Service Item 7', hospitalCode: 'HSP-LAB-004', hospitalDescription: 'Hospital Service 7', alias: 'Service alias 7', costCenter: 'CC-LAB', subCostCenter: 'CC-LAB-CORE', departmentName: 'Department 5', subDepartment: '', category: 'Laboratory', taxCategory: 'Healthcare service', type: 'Laboratory Service', isPackage: false, isListed: false, materialCost: 22, depreciationCost: 5, active: false },
  ].map((item) => ({ ...item, id: item.code }));
  const categorySeed = [
    { code: 'CAT-CONS', description: 'Category 1', alias: 'Category 1 alias', active: true },
    { code: 'CAT-LAB', description: 'Category 2', alias: 'Category 2 alias', active: true },
    { code: 'CAT-IMG', description: 'Category 3', alias: 'Category 3 alias', active: true },
    { code: 'CAT-PHARM', description: 'Category 4', alias: 'Category 4 alias', active: true },
    { code: 'CAT-PROC', description: 'Category 5', alias: 'Category 5 alias', active: true },
    { code: 'CAT-THER', description: 'Category 6', alias: '', active: true },
  ];
  const groupSeed = [
    { id: 'group-consultation', type: 'group', code: 'GRP-CONS', description: 'Group 1', alias: 'Group 1 alias', tags: ['Tag 1', 'Tag 2'], itemIds: ['SV-1001', 'SV-1002'], active: true },
    { id: 'subgroup-primary-care', type: 'subgroup', parentId: 'group-consultation', code: 'SUB-CONS-PRIMARY', description: 'Sub Group 1', alias: 'Sub Group 1 alias', tags: ['Tag 3'], itemIds: ['SV-1001'], active: true },
    { id: 'group-laboratory', type: 'group', code: 'GRP-LAB', description: 'Group 2', alias: 'Group 2 alias', tags: ['Tag 4'], itemIds: ['SV-2001', 'SV-2011'], active: true },
    { id: 'subgroup-core-lab', type: 'subgroup', parentId: 'group-laboratory', code: 'SUB-LAB-CORE', description: 'Sub Group 2', alias: 'Sub Group 2 alias', tags: ['Tag 5'], itemIds: ['SV-2001'], active: true },
    { id: 'group-imaging', type: 'group', code: 'GRP-IMG', description: 'Group 3', alias: 'Group 3 alias', tags: ['Tag 6'], itemIds: ['SV-3001'], active: true },
    { id: 'subgroup-radiology', type: 'subgroup', parentId: 'group-imaging', code: 'SUB-IMG-RAD', description: 'Sub Group 3', alias: '', tags: [], itemIds: ['SV-3001'], active: true },
  ];
  const catalogSeed = [
    { id: 'catalog-ambulatory', name: 'Service Catalog 1', description: 'Service catalog description 1', categoryCode: 'CAT-CONS', groupId: 'group-consultation', itemCodes: ['SV-1001', 'SV-1002'], active: true },
    { id: 'catalog-laboratory', name: 'Service Catalog 2', description: 'Service catalog description 2', categoryCode: 'CAT-LAB', groupId: 'group-laboratory', itemCodes: ['SV-2001', 'SV-2011'], active: true },
    { id: 'catalog-imaging', name: 'Service Catalog 3', description: 'Service catalog description 3', categoryCode: 'CAT-IMG', groupId: 'group-imaging', itemCodes: ['SV-3001'], active: true },
  ];
  const seeds = { 'service-items': itemSeed, categories: categorySeed, groups: groupSeed, 'service-catalog': catalogSeed };
  function seedMissingRecords() {
    facilities.forEach(({ id }) => {
      for (const route of routes) {
        const key = storageKey(route, id);
        if (localStorage.getItem(key) !== null) continue;
        let seed = clone(seeds[route]);
        if (route === 'groups') {
          const codes = new Set(read(storageKey('service-items', id)).map((item) => item.code));
          seed = seed.map((group) => ({ ...group, itemIds: group.itemIds.filter((code) => codes.has(code)) }));
        }
        if (route === 'service-catalog') {
          const groupIds = new Set(read(storageKey('groups', id)).map((group) => group.id));
          const categoryCodes = new Set(read(storageKey('categories', id)).map((category) => category.code));
          const codes = new Set(read(storageKey('service-items', id)).map((item) => item.code));
          seed = seed.filter((catalog) => groupIds.has(catalog.groupId)).map((catalog) => ({ ...catalog, categoryCode: categoryCodes.has(catalog.categoryCode) ? catalog.categoryCode : '', itemCodes: catalog.itemCodes.filter((code) => codes.has(code)) }));
        }
        try { localStorage.setItem(key, JSON.stringify(seed)); } catch { /* Keep this page usable without browser storage. */ }
      }
    });
  }
  seedMissingRecords();

  const data = Object.fromEntries(routes.map((route) => [route, facilities.flatMap(({ id }) => read(storageKey(route, id)).map((record) => ({ ...record, __facilityId: id })))]));
  const state = Object.fromEntries(routes.map((route) => [route, { filters: {}, page: 1, pageSize: 6 }]));
  const icon = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>',
  };
  const itemPickerCatalog = [
    { code: 'SV-1001', chapter: 'CH-01', block: 'BL-01A', description: 'Service Item 1' },
    { code: 'SV-1002', chapter: 'CH-01', block: 'BL-01A', description: 'Service Item 2' },
    { code: 'SV-2001', chapter: 'CH-02', block: 'BL-02A', description: 'Service Item 3' },
    { code: 'SV-2011', chapter: 'CH-02', block: 'BL-02B', description: 'Service Item 4' },
    { code: 'SV-3001', chapter: 'CH-03', block: 'BL-03A', description: 'Service Item 5' },
    { code: 'SV-4001', chapter: 'CH-04', block: 'BL-04A', description: 'Service Item 6' },
    { code: 'SV-1003', chapter: 'CH-01', block: 'BL-01B', description: 'Service Item 7' },
    { code: 'SV-1004', chapter: 'CH-01', block: 'BL-01B', description: 'Service Item 8' },
    { code: 'SV-2002', chapter: 'CH-02', block: 'BL-02A', description: 'Service Item 9' },
    { code: 'SV-3002', chapter: 'CH-03', block: 'BL-03B', description: 'Service Item 10' },
    { code: 'SV-4002', chapter: 'CH-04', block: 'BL-04B', description: 'Service Item 11' },
    { code: 'SV-5001', chapter: 'CH-02', block: 'BL-02B', description: 'Service Item 12' },
  ];
  function facilityName(id) { return facilities.find((facility) => facility.id === String(id))?.englishName || `Facility ${id}`; }
  function recordsFor(route) { return data[route]; }
  function persist(route) {
    try { facilities.forEach(({ id }) => localStorage.setItem(storageKey(route, id), JSON.stringify(data[route].filter((record) => record.__facilityId === id).map(({ __facilityId, ...record }) => record)))); }
    catch { /* Preserve the in-memory session if storage is unavailable. */ }
  }
  function notify(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600); }
  function makePage(route) {
    const root = document.querySelector(`[data-organization-service-route="${route}"]`);
    if (!root) return;
    const commonFilters = `<label class="facility-filter"><span>Facility</span><select data-filter="facilityId"><option value="">All facilities</option>${facilities.map((facility) => `<option value="${esc(facility.id)}">${esc(facility.englishName)}</option>`).join('')}</select></label>`;
    const toolbar = route === 'service-items'
      ? `<div class="branches-add-row service-items-actions"><button class="button button-primary" type="button" data-add>${icon.add}Add Item</button><button class="button button-secondary" type="button" data-add-multiple>${icon.add}Add Multiple Items</button><span class="service-items-toolbar-spacer"></span><button class="button button-secondary" type="button">Export</button><button class="button button-secondary" type="button">Download Sample</button><button class="button button-secondary" type="button">Upload</button><button class="button button-secondary" type="button">Sync</button></div>`
      : `<div class="branches-add-row"><button class="button button-primary" type="button" data-add>${icon.add}Add ${route === 'service-catalog' ? 'Catalog' : route === 'categories' ? 'Category' : 'Group'}</button></div>`;
    const filters = route === 'service-items'
      ? `${commonFilters}<label class="facility-filter"><span>Hospital Code</span><input type="search" data-filter="hospitalCode" placeholder="Search hospital code"></label><label class="facility-filter"><span>Code</span><input type="search" data-filter="code" placeholder="Search code"></label><label class="facility-filter"><span>Description</span><input type="search" data-filter="description" placeholder="Search description"></label><label class="facility-filter"><span>Status</span><select data-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label class="facility-filter"><span>Is Package</span><select data-filter="isPackage"><option value="">All items</option><option value="true">Package</option><option value="false">Not package</option></select></label>`
      : route === 'categories' || route === 'groups'
        ? `${commonFilters}<label class="facility-filter"><span>Code</span><input type="search" data-filter="code" placeholder="Search code"></label><label class="facility-filter"><span>Description</span><input type="search" data-filter="description" placeholder="Search description"></label><label class="facility-filter"><span>Status</span><select data-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>`
        : `${commonFilters}<label class="facility-filter"><span>Name</span><input type="search" data-filter="name" placeholder="Search catalog name"></label><label class="facility-filter"><span>Description</span><input type="search" data-filter="description" placeholder="Search description"></label><label class="facility-filter"><span>Status</span><select data-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>`;
    root.innerHTML = `<div class="branches-toolbar">${toolbar}<div class="branches-filter-grid" aria-label="Filter ${esc(route)}">${filters}</div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table"><thead data-head></thead><tbody data-rows></tbody></table></div><div class="facility-empty" data-empty hidden>No records match these filters.</div><footer class="facility-pagination"><span data-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-page="previous" aria-label="Previous page">‹</button><span data-page-label></span><button class="icon-button" type="button" data-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-page="last" aria-label="Last page">»</button></div></footer></div>`;
    root.querySelector('[data-head]').innerHTML = `<tr>${columns(route).map((column) => `<th>${column}</th>`).join('')}</tr>`;
    root.addEventListener('input', (event) => { const field = event.target.closest('[data-filter]'); if (field) updateFilter(route, field); });
    root.addEventListener('change', (event) => { const field = event.target.closest('[data-filter]'); if (field) updateFilter(route, field); });
    root.addEventListener('click', (event) => handleGridClick(route, event));
    render(route);
  }
  function columns(route) {
    if (route === 'service-items') return ['Facility','Chapter','Block','Code','Long Description','Short Description','Hospital Code','Hospital Description','Alias','Status','Actions'];
    if (route === 'categories') return ['Facility','Code','Description','Alias','Status','Actions'];
    if (route === 'groups') return ['Facility','Code','Description','Alias','Tags','Items','Status','Actions'];
    return ['Facility','Catalog Name','Description','Status','Actions'];
  }
  function primaryKey(route, record) { return route === 'service-items' || route === 'categories' ? record.code : record.id; }
  function updateFilter(route, field) { const pageState = state[route]; pageState.filters[field.dataset.filter] = field.value.trim().toLowerCase(); pageState.page = 1; render(route); }
  function getMatches(route) {
    const filters = state[route].filters;
    return data[route].filter((record) => {
      if (filters.facilityId && record.__facilityId !== filters.facilityId) return false;
      if (filters.status && ((record.active === false ? 'inactive' : 'active') !== filters.status)) return false;
      if (route === 'service-items') return (!filters.code || record.code.toLowerCase().includes(filters.code)) && (!filters.hospitalCode || (record.hospitalCode || '').toLowerCase().includes(filters.hospitalCode)) && (!filters.description || `${record.shortDescription || ''} ${record.longDescription || ''} ${record.alias || ''}`.toLowerCase().includes(filters.description)) && (!filters.isPackage || String(Boolean(record.isPackage)) === filters.isPackage);
      if (route === 'categories' || route === 'groups') return (!filters.code || record.code.toLowerCase().includes(filters.code)) && (!filters.description || `${record.description || ''} ${record.alias || ''} ${(record.tags || []).join(' ')}`.toLowerCase().includes(filters.description));
      return (!filters.name || record.name.toLowerCase().includes(filters.name)) && (!filters.description || record.description.toLowerCase().includes(filters.description));
    });
  }
  function menu(record, route) {
    const identity = esc(primaryKey(route, record)); const facilityId = esc(record.__facilityId);
    const actions = route === 'groups'
      ? `<button type="button" role="menuitem" data-action="view" data-key="${identity}" data-fid="${facilityId}">${icon.eye}View</button><button type="button" role="menuitem" data-action="edit" data-key="${identity}" data-fid="${facilityId}">${icon.edit}Edit</button>${record.type === 'group' ? `<button type="button" role="menuitem" data-action="add-subgroup" data-key="${identity}" data-fid="${facilityId}">${icon.add}Add Sub Group</button>` : ''}<button type="button" role="menuitem" data-action="toggle" data-key="${identity}" data-fid="${facilityId}">${icon.status}${record.active === false ? 'Activate' : 'Deactivate'}</button>`
      : route === 'service-catalog'
        ? `<button type="button" role="menuitem" data-action="view" data-key="${identity}" data-fid="${facilityId}">${icon.eye}View</button><button type="button" role="menuitem" data-action="edit" data-key="${identity}" data-fid="${facilityId}">${icon.edit}Edit</button><button type="button" role="menuitem" data-action="upload" data-key="${identity}" data-fid="${facilityId}">${icon.upload}Upload File</button><button type="button" role="menuitem" data-action="toggle" data-key="${identity}" data-fid="${facilityId}">${icon.status}${record.active === false ? 'Activate' : 'Deactivate'}</button>`
        : `<button type="button" role="menuitem" data-action="view" data-key="${identity}" data-fid="${facilityId}">${icon.eye}View</button><button type="button" role="menuitem" data-action="edit" data-key="${identity}" data-fid="${facilityId}">${icon.edit}Edit</button><button type="button" role="menuitem" data-action="toggle" data-key="${identity}" data-fid="${facilityId}">${icon.status}${record.active === false ? 'Activate' : 'Deactivate'}</button>`;
    return `<div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-row-menu aria-label="Actions for ${esc(record.name || record.description || record.shortDescription || record.code)} at ${esc(facilityName(record.__facilityId))}" aria-haspopup="menu" aria-expanded="false">${icon.more}</button><div class="facility-row-menu" role="menu" hidden>${actions}</div></div>`;
  }
  function row(route, record, child = false) {
    const status = `<span class="facility-status ${record.active === false ? 'is-inactive' : 'is-active'}"><span></span>${record.active === false ? 'Inactive' : 'Active'}</span>`;
    const action = menu(record, route);
    const facility = `<td>${esc(facilityName(record.__facilityId))}</td>`;
    if (route === 'service-items') return `<tr>${facility}<td>${esc(record.chapter || '—')}</td><td>${esc(record.block || '—')}</td><td class="branch-code">${esc(record.code)}</td><td>${esc(record.longDescription || '—')}</td><td>${esc(record.shortDescription || '—')}</td><td>${esc(record.hospitalCode || '—')}</td><td>${esc(record.hospitalDescription || '—')}</td><td>${esc(record.alias || '—')}</td><td>${status}</td><td>${action}</td></tr>`;
    if (route === 'categories') return `<tr>${facility}<td class="branch-code">${esc(record.code)}</td><td>${esc(record.description)}</td><td>${esc(record.alias || '—')}</td><td>${status}</td><td>${action}</td></tr>`;
    if (route === 'groups') return `<tr class="${child ? 'group-child-row' : 'group-parent-row'}">${facility}<td class="branch-code">${child ? '<span class="group-child-marker" aria-hidden="true">↳</span>' : ''}${esc(record.code)}</td><td>${esc(record.description)}${child ? '<span class="group-kind-label">Sub Group</span>' : ''}</td><td>${esc(record.alias || '—')}</td><td>${(record.tags || []).map((tag) => `<span class="group-tag-pill">${esc(tag)}</span>`).join(' ') || '—'}</td><td>${(record.itemIds || []).length}</td><td>${status}</td><td>${action}</td></tr>`;
    return `<tr>${facility}<td>${esc(record.name)}</td><td>${esc(record.description)}</td><td>${status}</td><td>${action}</td></tr>`;
  }
  function render(route) {
    const root = document.querySelector(`[data-organization-service-route="${route}"]`); const pageState = state[route];
    const matching = getMatches(route); const pages = Math.max(1, Math.ceil(matching.length / pageState.pageSize)); pageState.page = Math.min(pageState.page, pages);
    const slice = matching.slice((pageState.page - 1) * pageState.pageSize, pageState.page * pageState.pageSize);
    let rows = '';
    if (route === 'groups') {
      rows = slice.filter((record) => record.type === 'group').map((group) => `${row(route, group)}${data[route].filter((child) => child.type === 'subgroup' && child.parentId === group.id && child.__facilityId === group.__facilityId && (!pageState.filters.status || (child.active === false ? 'inactive' : 'active') === pageState.filters.status) && (!pageState.filters.code || child.code.toLowerCase().includes(pageState.filters.code)) && (!pageState.filters.description || `${child.description} ${child.alias || ''} ${(child.tags || []).join(' ')}`.toLowerCase().includes(pageState.filters.description))).map((child) => row(route, child, true)).join('')}`).join('');
      const represented = new Set(slice.filter((record) => record.type === 'group').map((record) => `${record.__facilityId}:${record.id}`));
      rows += slice.filter((record) => record.type === 'subgroup' && !represented.has(`${record.__facilityId}:${record.parentId}`)).map((record) => row(route, record, true)).join('');
    } else rows = slice.map((record) => row(route, record)).join('');
    root.querySelector('[data-rows]').innerHTML = rows; root.querySelector('[data-empty]').hidden = matching.length > 0;
    root.querySelector('[data-count]').textContent = `Total Results: ${matching.length}`;
    root.querySelector('[data-page-label]').textContent = `Page ${matching.length ? pageState.page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-page]').forEach((button) => { button.disabled = !matching.length || (['first','previous'].includes(button.dataset.page) ? pageState.page === 1 : pageState.page === pages); });
  }
  function closeMenus(route) { document.querySelector(`[data-organization-service-route="${route}"]`)?.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; menu.parentElement.querySelector('[data-row-menu]')?.setAttribute('aria-expanded', 'false'); }); }
  function findRecord(route, key, facilityId) { return data[route].find((record) => record.__facilityId === facilityId && String(primaryKey(route, record)) === String(key)); }
  function handleGridClick(route, event) {
    const root = event.currentTarget; const button = event.target.closest('button'); if (!button) return;
    if (button.matches('[data-add]')) openModal(route, 'new', null, null, button);
    else if (button.matches('[data-add-multiple]')) openBulkItemModal(button);
    else if (button.matches('[data-row-menu]')) { const menu = button.nextElementSibling; const open = menu.hidden; closeMenus(route); menu.hidden = !open; button.setAttribute('aria-expanded', String(open)); }
    else if (button.matches('[data-action]')) {
      const record = findRecord(route, button.dataset.key, button.dataset.fid); if (!record) return; closeMenus(route);
      if (button.dataset.action === 'toggle') { record.active = record.active === false; persist(route); render(route); notify(`${record.name || record.description || record.shortDescription || record.code} ${record.active ? 'activated' : 'deactivated'}.`); }
      else if (button.dataset.action === 'upload') uploadInputForRecord(record);
      else if (button.dataset.action === 'add-subgroup') openModal(route, 'new', null, record, button);
      else openModal(route, button.dataset.action, record, null, button);
    } else if (button.matches('[data-page]')) { const s = state[route]; const pages = Math.max(1, Math.ceil(getMatches(route).length / s.pageSize)); if (button.dataset.page === 'first') s.page = 1; if (button.dataset.page === 'previous') s.page = Math.max(1, s.page - 1); if (button.dataset.page === 'next') s.page = Math.min(pages, s.page + 1); if (button.dataset.page === 'last') s.page = pages; render(route); }
    if (!root.contains(event.target)) closeMenus(route);
  }
  const modal = document.createElement('div'); modal.className = 'patient-modal-backdrop'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal facility-modal organization-service-modal" role="dialog" aria-modal="true" aria-labelledby="org-service-title"><header class="patient-modal-header"><div><p class="eyebrow">ORGANIZATION SERVICE SETUP</p><h2 id="org-service-title"></h2><p data-modal-description></p></div><button class="icon-button" type="button" data-close aria-label="Close dialog">×</button></header><form data-form><div class="patient-modal-body" data-modal-body></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-cancel>Cancel</button><button class="button button-primary" type="submit" data-save>Create</button></div></footer></form></section></div>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-form]'); const body = modal.querySelector('[data-modal-body]');
  const picker = document.createElement('div'); picker.className = 'patient-modal-backdrop'; picker.hidden = true;
  picker.innerHTML = `<section class="patient-modal facility-modal service-picker-modal" role="dialog" aria-modal="true" aria-labelledby="org-item-picker-title"><header class="patient-modal-header"><div><p class="eyebrow">SERVICE ITEM LOOKUP</p><h2 id="org-item-picker-title">Add Multiple Items</h2><p>Browse chapters, blocks, and items.</p></div><button class="icon-button" type="button" data-picker-close aria-label="Close dialog">×</button></header><div class="patient-modal-body"><nav class="service-picker-tabs" role="tablist"><button type="button" role="tab" data-tab="chapters">Chapters</button><button type="button" role="tab" data-tab="blocks">Blocks</button><button type="button" role="tab" data-tab="items">Items</button></nav><label class="facility-filter"><span data-picker-label>Search chapters</span><input type="search" data-picker-search placeholder="Search code or description"></label><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table"><thead><tr><th>Select</th><th>Code</th><th>Description</th></tr></thead><tbody data-picker-rows></tbody></table></div></div></div><footer class="patient-modal-footer"><div class="service-picker-footer-info"><span data-picker-count>0 items selected</span><span data-picker-pages></span></div><div><button class="button button-secondary" type="button" data-picker-cancel>Cancel</button><button class="button button-primary" type="button" data-picker-add>Add Selected</button></div></footer></section>`;
  document.body.append(picker);
  const uploadInput = document.createElement('input'); uploadInput.type = 'file'; uploadInput.accept = '.csv,text/csv'; uploadInput.hidden = true; document.body.append(uploadInput);
  let mode = 'new', routeNow = '', activeKey = null, activeFacility = null, parentRecord = null, returnFocus = null;
  let itemPickTab = 'chapters', itemPickPage = 1, itemPickQuery = '', pickerMode = 'bulk', pickerFacility = null, pickedChapters = new Set(), pickedBlocks = new Set(), pickedItems = new Set();
  let perFacilityLinks = {};
  function assignmentMarkup(selected = []) { const set = new Set(selected); return `<fieldset class="patient-form-section org-service-assignment"><legend class="sr-only">Facility Assignment</legend><div class="facility-form-section-heading">Facility Assignment</div><div class="organization-assignment-facility-list">${facilities.map((facility) => `<label class="form-check"><input type="checkbox" data-assigned-facility value="${esc(facility.id)}" ${set.has(facility.id) ? 'checked' : ''}><span>${esc(facility.englishName)}</span></label>`).join('')}</div><p class="muted-text">Select one or more facilities. A separate record will be saved for each.</p></fieldset>`; }
  function selectedFacilities() { return [...modal.querySelectorAll('[data-assigned-facility]:checked')].map((input) => input.value); }
  function currentFacilityRecords(route, facilityId) { return data[route].filter((record) => record.__facilityId === String(facilityId)); }
  function eligibleCatalogItems(facilityId, groupId) {
    const groups = currentFacilityRecords('groups', facilityId); const group = groups.find((item) => item.id === groupId && item.type === 'group'); if (!group) return [];
    const codes = new Set([...(group.itemIds || []), ...groups.filter((item) => item.type === 'subgroup' && item.parentId === group.id).flatMap((item) => item.itemIds || [])]);
    return currentFacilityRecords('service-items', facilityId).filter((item) => codes.has(item.code));
  }
  function itemChecklist(facilityId, route, selected = []) {
    const chosen = new Set(selected); const items = currentFacilityRecords('service-items', facilityId);
    return `<div class="org-service-link-list" data-links-list="${esc(facilityId)}"><label class="facility-filter"><span>Search Service Items</span><input type="search" data-link-search="${esc(facilityId)}" placeholder="Search code or description"></label><div class="org-service-link-options">${items.map((item) => `<label class="form-check" data-link-item data-search="${esc(`${item.code} ${item.shortDescription} ${item.longDescription}`.toLowerCase())}"><input type="checkbox" data-link-code="${esc(item.code)}" data-link-fid="${esc(facilityId)}" ${chosen.has(item.code) ? 'checked' : ''}><span><b>${esc(item.code)}</b> · ${esc(item.shortDescription || item.longDescription || '')}</span></label>`).join('') || '<p class="muted-text">No saved Service Items for this facility.</p>'}</div></div>`;
  }
  function groupLinksMarkup(route, assigned) {
    return `<section class="patient-form-section"><div class="facility-form-section-heading">Service Item Associations</div><p class="muted-text">Choose linked items independently for each facility.</p><div class="patient-form-grid">${assigned.map((fid) => `<fieldset class="org-service-facility-card"><legend>${esc(facilityName(fid))}</legend>${itemChecklist(fid, route, perFacilityLinks[fid] || [])}</fieldset>`).join('')}</div></section>`;
  }
  function catalogAssignmentsMarkup(assigned, savedByFacility = {}) {
    return `<section class="patient-form-section"><div class="facility-form-section-heading">Facility Catalog Assignment</div><p class="muted-text">Choose saved Categories, Groups, and eligible Items for each facility copy.</p>${assigned.map((fid) => {
      const cats = currentFacilityRecords('categories', fid); const groups = currentFacilityRecords('groups', fid).filter((group) => group.type === 'group' && group.active !== false); const saved = savedByFacility[fid] || {};
      const groupId = saved.groupId || ''; const eligible = eligibleCatalogItems(fid, groupId); const codes = new Set(saved.itemCodes || []);
      return `<fieldset class="org-service-facility-card" data-catalog-facility="${esc(fid)}"><legend>${esc(facilityName(fid))}</legend><div class="patient-form-grid"><label class="form-field"><span>Category</span><select data-catalog-category="${esc(fid)}"><option value="">No category</option>${cats.map((item) => `<option value="${esc(item.code)}" ${item.code === saved.categoryCode ? 'selected' : ''}>${esc(item.description)}</option>`).join('')}</select></label><label class="form-field"><span>Service Group <b>*</b></span><select data-catalog-group="${esc(fid)}" required><option value="">Select Service Group</option>${groups.map((item) => `<option value="${esc(item.id)}" ${item.id === groupId ? 'selected' : ''}>${esc(item.description)} (${esc(item.code)})</option>`).join('')}</select></label></div><div data-catalog-items="${esc(fid)}">${eligible.length ? `<div class="catalog-items-heading"><strong>Eligible Items</strong><button type="button" class="button button-secondary" data-catalog-picker-open="${esc(fid)}">Add Item</button></div><div class="org-service-link-options">${eligible.map((item) => `<label class="form-check"><input type="checkbox" data-catalog-item="${esc(fid)}" value="${esc(item.code)}" ${codes.has(item.code) ? 'checked' : ''}><span>${esc(item.code)} · ${esc(item.shortDescription || item.longDescription || '')}</span></label>`).join('')}</div>` : '<p class="muted-text">Select a Group with linked Service Items.</p>'}</div></fieldset>`;
    }).join('')}</section>`;
  }
  function fieldsMarkup(route, record = {}) {
    if (route === 'service-items') return `<fieldset class="patient-form-section"><div class="facility-form-section-heading">General Details</div><div class="patient-form-grid"><label class="form-field"><span>Chapter <b>*</b></span><input name="chapter" required value="${esc(record.chapter || '')}"></label><label class="form-field"><span>Block <b>*</b></span><input name="block" required value="${esc(record.block || '')}"></label><label class="form-field"><span>Code <b>*</b></span><input name="code" required value="${esc(record.code || '')}"></label><label class="form-field"><span>Long Description</span><input name="longDescription" value="${esc(record.longDescription || '')}"></label><label class="form-field"><span>Short Description <b>*</b></span><input name="shortDescription" required value="${esc(record.shortDescription || '')}"></label><label class="form-field"><span>Alias</span><input name="alias" value="${esc(record.alias || '')}"></label><label class="form-field"><span>Hospital Code <b>*</b></span><input name="hospitalCode" required maxlength="20" value="${esc(record.hospitalCode || '')}"></label><label class="form-field"><span>Hospital Description</span><input name="hospitalDescription" maxlength="250" value="${esc(record.hospitalDescription || '')}"></label><label class="form-field"><span>Cost Center</span><input name="costCenter" value="${esc(record.costCenter || '')}"></label><label class="form-field"><span>Sub Cost Center</span><input name="subCostCenter" value="${esc(record.subCostCenter || '')}"></label><label class="form-field"><span>Department Name</span><input name="departmentName" value="${esc(record.departmentName || '')}"></label><label class="form-field"><span>Sub Department</span><input name="subDepartment" value="${esc(record.subDepartment || '')}" readonly></label><label class="form-field"><span>Category</span><input name="category" value="${esc(record.category || '')}"></label><label class="form-field"><span>Tax Category</span><input name="taxCategory" value="${esc(record.taxCategory || '')}"></label><label class="form-field"><span>Type <b>*</b></span><input name="type" required value="${esc(record.type || '')}"></label><label class="form-check"><input type="checkbox" name="isPackage" ${record.isPackage ? 'checked' : ''}><span>Is Package</span></label><label class="form-check"><input type="checkbox" name="isListed" ${record.isListed ? 'checked' : ''}><span>Is Listed</span></label></div></fieldset><fieldset class="patient-form-section"><div class="facility-form-section-heading">Cost</div><div class="patient-form-grid"><label class="form-field"><span>Material Cost</span><input name="materialCost" type="number" min="0" step="0.01" value="${esc(record.materialCost ?? 0)}"></label><label class="form-field"><span>Dep Cost</span><input name="depreciationCost" type="number" min="0" step="0.01" value="${esc(record.depreciationCost ?? 0)}"></label><label class="form-field"><span>Total</span><input name="totalCost" readonly value="${Number(record.materialCost || 0) + Number(record.depreciationCost || 0)}"></label></div></fieldset>`;
    if (route === 'categories') return `<fieldset class="patient-form-section"><div class="facility-form-section-heading">Category Details</div><div class="patient-form-grid"><label class="form-field"><span>Code <b>*</b></span><input name="code" required value="${esc(record.code || '')}"></label><label class="form-field"><span>Description <b>*</b></span><input name="description" required value="${esc(record.description || '')}"></label><label class="form-field"><span>Alias</span><input name="alias" value="${esc(record.alias || '')}"></label></div></fieldset>`;
    if (route === 'groups') return `<fieldset class="patient-form-section"><div class="facility-form-section-heading">${record.__parentId ? 'Sub Group' : 'Group'} Details</div><div class="patient-form-grid"><label class="form-field"><span>Code <b>*</b></span><input name="code" required value="${esc(record.code || '')}"></label><label class="form-field"><span>Description <b>*</b></span><input name="description" required value="${esc(record.description || '')}"></label><label class="form-field"><span>Alias</span><input name="alias" value="${esc(record.alias || '')}"></label><label class="form-field"><span>Tags</span><input name="tags" placeholder="Separate tags with commas" value="${esc((record.tags || []).join(', '))}"></label></div></fieldset>`;
    return `<fieldset class="patient-form-section"><div class="facility-form-section-heading">Catalog Details</div><div class="patient-form-grid"><label class="form-field"><span>Name <b>*</b></span><input name="name" required value="${esc(record.name || '')}"></label><label class="form-field"><span>Description <b>*</b></span><input name="description" required value="${esc(record.description || '')}"></label></div></fieldset>`;
  }
  function openModal(route, nextMode, record = null, parent = null, trigger = document.activeElement) {
    routeNow = route; mode = nextMode; activeKey = record ? primaryKey(route, record) : null; activeFacility = record?.__facilityId || null; parentRecord = parent; returnFocus = trigger;
    const readOnly = nextMode === 'view'; const add = nextMode === 'new';
    modal.querySelector('#org-service-title').textContent = `${readOnly ? 'View' : add ? 'Add' : 'Edit'} ${route === 'service-items' ? 'Service Item' : route === 'categories' ? 'Category' : route === 'groups' ? (parent ? 'Sub Group' : record?.type === 'subgroup' ? 'Sub Group' : 'Group') : 'Service Catalog'}`;
    modal.querySelector('[data-modal-description]').textContent = readOnly ? 'Review this facility record.' : add ? 'Create separate facility records from the selected information.' : `Update this record at ${facilityName(activeFacility)}.`;
    modal.querySelector('[data-save]').textContent = nextMode === 'edit' ? 'Save Changes' : 'Create';
    const subgroupAdd = route === 'groups' && add && Boolean(parent);
    const target = subgroupAdd ? [parent.__facilityId] : add ? [] : [activeFacility];
    const recordForForm = record ? { ...record, __parentId: parent?.id || record.parentId || null } : { __parentId: parent?.id || null };
    perFacilityLinks = {};
    if (route === 'groups' && !add) perFacilityLinks[activeFacility] = [...(record?.itemIds || [])];
    if (route === 'service-catalog' && record) perFacilityLinks[activeFacility] = { groupId: record.groupId, categoryCode: record.categoryCode, itemCodes: [...(record.itemCodes || [])] };
    body.innerHTML = `${add && !subgroupAdd ? assignmentMarkup() : add ? `<div class="org-service-record-context"><strong>Facility</strong><span>${esc(facilityName(parent.__facilityId))}</span></div>` : `<div class="org-service-record-context"><strong>Facility</strong><span>${esc(facilityName(activeFacility))}</span></div>`}${fieldsMarkup(route, recordForForm)}${route === 'groups' ? `<div data-group-links>${groupLinksMarkup(route, target)}</div>` : route === 'service-catalog' ? `<div data-catalog-assignments>${add ? catalogAssignmentsMarkup([]) : ''}</div>` : ''}${readOnly && route === 'categories' ? mappedServicesMarkup(record) : ''}`;
    if (route === 'service-catalog' && !add && record) body.querySelector('[data-catalog-assignments]').innerHTML = catalogAssignmentsMarkup(target, perFacilityLinks);
    if (route === 'categories' && readOnly) body.querySelectorAll('input').forEach((field) => { field.disabled = true; });
    if (route === 'service-items' && readOnly) body.querySelectorAll('input').forEach((field) => { field.disabled = true; });
    if (route === 'groups' && readOnly) { body.querySelectorAll('input').forEach((field) => { field.disabled = true; }); body.querySelectorAll('[data-link-search]').forEach((field) => { field.closest('.form-field')?.remove(); }); }
    if (route === 'service-catalog' && readOnly) body.querySelectorAll('input,select,button').forEach((field) => { field.disabled = true; });
    modal.querySelector('[data-save]').hidden = readOnly; modal.querySelector('[data-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
    modal.hidden = false; document.body.classList.add('modal-open'); (body.querySelector('input:not([readonly])') || modal.querySelector('[data-close]')).focus();
  }
  function readOnlyItems(fid, codes) { const wanted = new Set(codes); const items = currentFacilityRecords('service-items', fid).filter((item) => wanted.has(item.code)); return items.length ? `<div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table"><thead><tr><th>Chapter</th><th>Block</th><th>Code</th><th>Description</th><th>Hospital Code</th><th>Hospital Description</th></tr></thead><tbody>${items.map((item) => `<tr><td>${esc(item.chapter)}</td><td>${esc(item.block)}</td><td>${esc(item.code)}</td><td>${esc(item.shortDescription || item.longDescription)}</td><td>${esc(item.hospitalCode)}</td><td>${esc(item.hospitalDescription || '—')}</td></tr>`).join('')}</tbody></table></div></div>` : '<p class="muted-text">No linked Service Items.</p>'; }
  function mappedServicesMarkup(category) { const categoryAliases = { 'CAT-CONS': ['consultation'], 'CAT-LAB': ['laboratory'], 'CAT-IMG': ['imaging', 'radiology'], 'CAT-PHARM': ['pharmacy'], 'CAT-PROC': ['procedure'], 'CAT-THER': ['therapy'] }; const values = [category.code, category.description, category.alias, ...(categoryAliases[category.code] || [])].filter(Boolean).map((value) => value.toLowerCase()); const items = currentFacilityRecords('service-items', category.__facilityId).filter((item) => values.includes(String(item.category || '').toLowerCase())); return `<section class="patient-form-section"><div class="facility-form-section-heading">Mapped Services</div>${items.length ? `<div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table"><thead><tr><th>#</th><th>Chapter</th><th>Block</th><th>Code</th><th>Description</th></tr></thead><tbody>${items.map((item,index) => `<tr><td>${index + 1}</td><td>${esc(item.chapter)}</td><td>${esc(item.block)}</td><td>${esc(item.code)}</td><td>${esc(item.shortDescription || item.longDescription)}</td></tr>`).join('')}</tbody></table></div></div>` : '<p class="muted-text">No mapped services.</p>'}</section>`; }
  function closeModal() { modal.hidden = true; document.body.classList.remove('modal-open'); returnFocus?.focus?.(); }
  function duplicate(route, record, facilityId, excludeKey = null) { const key = route === 'service-items' || route === 'categories' ? record.code : record.code || record.id; return currentFacilityRecords(route, facilityId).some((item) => String(route === 'service-items' || route === 'categories' || route === 'groups' ? item.code : item.id).toLowerCase() === String(key).toLowerCase() && (excludeKey === null || String(primaryKey(route, item)) !== String(excludeKey))); }
  function readFormRecord(route) {
    const value = (name) => form.elements.namedItem(name)?.value?.trim() || '';
    if (route === 'service-items') return { id: value('code'), chapter: value('chapter'), block: value('block'), code: value('code'), longDescription: value('longDescription'), shortDescription: value('shortDescription'), hospitalCode: value('hospitalCode'), hospitalDescription: value('hospitalDescription'), alias: value('alias'), costCenter: value('costCenter'), subCostCenter: value('subCostCenter'), departmentName: value('departmentName'), subDepartment: value('subDepartment'), category: value('category'), taxCategory: value('taxCategory'), type: value('type'), isPackage: form.elements.namedItem('isPackage').checked, isListed: form.elements.namedItem('isListed').checked, materialCost: Number(value('materialCost')) || 0, depreciationCost: Number(value('depreciationCost')) || 0, active: mode === 'edit' ? findRecord(route, activeKey, activeFacility)?.active !== false : true };
    if (route === 'categories') return { code: value('code'), description: value('description'), alias: value('alias'), active: mode === 'edit' ? findRecord(route, activeKey, activeFacility)?.active !== false : true };
    if (route === 'groups') return { id: activeKey || `group-${crypto.randomUUID()}`, type: parentRecord || findRecord(route, activeKey, activeFacility)?.type === 'subgroup' ? 'subgroup' : 'group', parentId: parentRecord?.id || findRecord(route, activeKey, activeFacility)?.parentId || null, code: value('code'), description: value('description'), alias: value('alias'), tags: value('tags').split(',').map((tag) => tag.trim()).filter(Boolean), itemIds: [], active: mode === 'edit' ? findRecord(route, activeKey, activeFacility)?.active !== false : true };
    return { id: activeKey || `catalog-${crypto.randomUUID()}`, name: value('name'), description: value('description'), active: mode === 'edit' ? findRecord(route, activeKey, activeFacility)?.active !== false : true };
  }
  function saveForm(event) {
    event.preventDefault(); if (!form.reportValidity()) return;
    const route = routeNow; const record = readFormRecord(route);
    const facilityIds = mode === 'new' ? (parentRecord ? [parentRecord.__facilityId] : selectedFacilities()) : [activeFacility];
    if (!facilityIds.length) { notify('Select at least one facility.'); return; }
    let saved = 0, skipped = 0;
    if (mode === 'edit') {
      const original = findRecord(route, activeKey, activeFacility); if (!original) return;
      if (duplicate(route, record, activeFacility, activeKey)) { form.elements.namedItem('code')?.setCustomValidity('This code is already in use at this facility.'); form.reportValidity(); form.elements.namedItem('code')?.setCustomValidity(''); return; }
      if (route === 'groups') record.itemIds = [...new Set([...[...body.querySelectorAll(`[data-link-fid="${activeFacility}"]:checked`)].map((input) => input.dataset.linkCode)])];
      if (route === 'service-catalog') Object.assign(record, catalogRecordForFacility(activeFacility));
      data[route] = data[route].map((item) => item.__facilityId === activeFacility && String(primaryKey(route,item)) === String(activeKey) ? { ...record, __facilityId: activeFacility } : item); saved = 1;
    } else {
      for (const fid of facilityIds) {
        const copy = clone(record); copy.__facilityId = fid;
        if (duplicate(route, copy, fid)) { skipped++; continue; }
        if (route === 'groups') copy.itemIds = [...new Set([...[...body.querySelectorAll(`[data-link-fid="${fid}"]:checked`)].map((input) => input.dataset.linkCode)])];
        if (route === 'service-catalog') Object.assign(copy, catalogRecordForFacility(fid));
        if (route === 'service-catalog' && !copy.groupId) { notify(`Select a Service Group for ${facilityName(fid)}.`); return; }
        data[route].unshift(copy); saved++;
      }
    }
    persist(route); closeModal(); render(route); notify(`${saved} ${route === 'service-items' ? 'Service Item' : route === 'service-catalog' ? 'Service Catalog' : route === 'categories' ? 'Category' : 'Group'} record${saved === 1 ? '' : 's'} saved${skipped ? `; ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''}.`);
  }
  function catalogRecordForFacility(fid) {
    const card = body.querySelector(`[data-catalog-facility="${fid}"]`); if (!card) return {};
    return { categoryCode: card.querySelector(`[data-catalog-category="${fid}"]`).value, groupId: card.querySelector(`[data-catalog-group="${fid}"]`).value, itemCodes: [...card.querySelectorAll(`[data-catalog-item="${fid}"]:checked`)].map((input) => input.value) };
  }
  function refreshCatalogFacility(fid) {
    const name = form.elements.namedItem('name').value; const description = form.elements.namedItem('description').value;
    const saved = catalogRecordForFacility(fid); const cards = body.querySelectorAll('[data-catalog-facility]');
    const prior = Object.fromEntries([...cards].map((card) => [card.dataset.catalogFacility, catalogRecordForFacility(card.dataset.catalogFacility)])); prior[fid] = saved;
    const assigned = mode === 'new' ? selectedFacilities() : [activeFacility];
    body.querySelector('[data-catalog-assignments]')?.remove(); body.insertAdjacentHTML('beforeend', `<div data-catalog-assignments>${catalogAssignmentsMarkup(assigned, prior)}</div>`);
    form.elements.namedItem('name').value = name; form.elements.namedItem('description').value = description;
  }
  function openItemPicker(trigger, context = 'bulk', facilityId = null) {
    pickerMode = context; pickerFacility = facilityId; itemPickTab = 'chapters'; itemPickPage = 1; itemPickQuery = ''; pickedChapters.clear(); pickedBlocks.clear(); pickedItems.clear();
    if (context === 'catalog') body.querySelectorAll(`[data-catalog-item="${facilityId}"]:checked`).forEach((input) => pickedItems.add(input.value));
    picker.querySelector('[data-picker-search]').value = ''; picker.querySelector('#org-item-picker-title').textContent = context === 'catalog' ? 'Add Service Items' : 'Add Multiple Items'; picker.dataset.return = trigger === undefined ? '' : 'open'; renderItemPicker(); picker.hidden = false; document.body.classList.add('modal-open'); picker.querySelector('[data-picker-search]').focus();
  }
  function openBulkItemModal(trigger) {
    routeNow = 'service-items'; mode = 'new'; activeKey = null; activeFacility = null; parentRecord = null; returnFocus = trigger;
    modal.querySelector('#org-service-title').textContent = 'Add Multiple Items';
    modal.querySelector('[data-modal-description]').textContent = 'Select facilities, then choose service items to add to each facility.';
    body.innerHTML = `${assignmentMarkup()}<fieldset class="patient-form-section"><div class="facility-form-section-heading">Shared Item Details</div><div class="patient-form-grid"><label class="form-field"><span>Hospital Code <b>*</b></span><input data-bulk-hospital-code required maxlength="20"></label><label class="form-field"><span>Type <b>*</b></span><input data-bulk-type required></label></div><button type="button" class="button button-secondary" data-bulk-open>${icon.add}Select Items</button></fieldset>`;
    modal.querySelector('[data-save]').hidden = true; modal.querySelector('[data-cancel]').textContent = 'Cancel'; modal.hidden = false; document.body.classList.add('modal-open'); body.querySelector('[data-assigned-facility]').focus();
  }
  function renderItemPicker() {
    let source;
    if (pickerMode === 'catalog') {
      const eligible = eligibleCatalogItems(pickerFacility, body.querySelector(`[data-catalog-group="${pickerFacility}"]`)?.value);
      const chapterRows = [...new Map(eligible.map((item) => [item.chapter, { code: item.chapter, description: item.chapter }])).values()];
      const blockRows = [...new Map(eligible.filter((item) => !pickedChapters.size || pickedChapters.has(item.chapter)).map((item) => [item.block, { code: item.block, chapter: item.chapter, description: item.block }])).values()];
      source = itemPickTab === 'chapters' ? chapterRows : itemPickTab === 'blocks' ? blockRows.filter((item) => !pickedChapters.size || pickedChapters.has(item.chapter)) : eligible.filter((item) => (!pickedChapters.size || pickedChapters.has(item.chapter)) && (!pickedBlocks.size || pickedBlocks.has(item.block))).map((item) => ({ ...item, description: item.shortDescription || item.longDescription || item.code }));
    } else source = itemPickTab === 'chapters' ? chapters : itemPickTab === 'blocks' ? blocks.filter((item) => !pickedChapters.size || pickedChapters.has(item.chapter)) : itemPickerCatalog.filter((item) => (!pickedChapters.size || pickedChapters.has(item.chapter)) && (!pickedBlocks.size || pickedBlocks.has(item.block)));
    const filtered = source.filter((item) => `${item.code} ${item.description}`.toLowerCase().includes(itemPickQuery));
    const pageSize = 8; const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); itemPickPage = Math.min(itemPickPage, pages); const pageItems = filtered.slice((itemPickPage - 1) * pageSize, itemPickPage * pageSize);
    picker.querySelector('[data-picker-label]').textContent = `Search ${itemPickTab}`; picker.querySelector('[data-picker-rows]').innerHTML = pageItems.map((item) => { const set = itemPickTab === 'chapters' ? pickedChapters : itemPickTab === 'blocks' ? pickedBlocks : pickedItems; return `<tr><td><input type="checkbox" data-picker-code="${esc(item.code)}" ${set.has(item.code) ? 'checked' : ''}></td><td>${esc(item.code)}</td><td>${esc(item.description)}</td></tr>`; }).join('');
    picker.querySelectorAll('[data-tab]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === itemPickTab))); picker.querySelector('[data-picker-count]').textContent = `${pickedItems.size} items selected`; picker.querySelector('[data-picker-add]').textContent = pickerMode === 'catalog' ? 'Add to Catalog' : 'Add Selected';
    picker.querySelector('[data-picker-pages]').innerHTML = `<button type="button" class="icon-button" data-picker-page="previous" aria-label="Previous lookup page" ${itemPickPage <= 1 ? 'disabled' : ''}>‹</button><span>Page ${itemPickPage} of ${pages}</span><button type="button" class="icon-button" data-picker-page="next" aria-label="Next lookup page" ${itemPickPage >= pages ? 'disabled' : ''}>›</button>`;
  }
  function addCatalogItems() {
    const selected = new Set(pickedItems); body.querySelectorAll(`[data-catalog-item="${pickerFacility}"]`).forEach((input) => { input.checked = selected.has(input.value); });
    picker.hidden = true; document.body.classList.remove('modal-open');
  }
  async function addMultipleItems() {
    const targetIds = selectedFacilities(); if (!targetIds.length) { notify('Select at least one facility first.'); return; }
    const hospitalCode = form.querySelector('[data-bulk-hospital-code]')?.value.trim(); const type = form.querySelector('[data-bulk-type]')?.value.trim();
    if (!hospitalCode || !type) { notify('Enter a shared Hospital Code and Type before adding selected items.'); return; }
    let added = 0, skipped = 0;
    targetIds.forEach((fid) => pickedItems.forEach((code) => {
      const item = itemPickerCatalog.find((entry) => entry.code === code); if (!item) return;
      if (currentFacilityRecords('service-items', fid).some((saved) => saved.code.toLowerCase() === code.toLowerCase())) { skipped++; return; }
      data['service-items'].push({ __facilityId: fid, id: code, chapter: item.chapter, block: item.block, code, longDescription: '', shortDescription: item.description, hospitalCode, hospitalDescription: '', alias: '', costCenter: '', subCostCenter: '', departmentName: '', subDepartment: '', category: '', taxCategory: '', type, isPackage: false, isListed: false, materialCost: 0, depreciationCost: 0, active: true }); added++;
    }));
    persist('service-items'); picker.hidden = true; modal.hidden = true; document.body.classList.remove('modal-open'); render('service-items'); notify(`Added ${added} Service Items; skipped ${skipped} duplicate codes.`);
  }
  async function uploadFile(file, record) {
    try {
      const rows = parseCsv(await file.text()); const headers = (rows.shift() || []).map((value) => value.trim().toLowerCase()); const codeIndex = headers.findIndex((header) => ['code','service item code'].includes(header));
      if (codeIndex < 0) { notify('CSV must include a Code or Service Item Code column.'); return; }
      const eligible = new Set(eligibleCatalogItems(record.__facilityId, record.groupId).map((item) => item.code.toLowerCase())); const known = new Set(record.itemCodes || []); let added = 0, duplicateCount = 0, unmatched = 0;
      rows.forEach((row) => { const code = String(row[codeIndex] || '').trim(); if (!code) return; const actual = currentFacilityRecords('service-items', record.__facilityId).find((item) => item.code.toLowerCase() === code.toLowerCase())?.code; if (!actual || !eligible.has(actual.toLowerCase())) { unmatched++; return; } if (known.has(actual)) { duplicateCount++; return; } known.add(actual); added++; });
      record.itemCodes = [...known]; persist('service-catalog'); render('service-catalog'); notify(`Added ${added}; skipped ${duplicateCount} duplicate and ${unmatched} unmatched code${unmatched === 1 ? '' : 's'}.`);
    } catch { notify('The CSV file could not be read.'); }
  }
  function parseCsv(text) { const rows = []; let row = [], value = '', quoted = false; const source = text.replace(/^\uFEFF/, ''); for (let i=0;i<source.length;i++) { const char=source[i]; if(char==='"'&&quoted&&source[i+1]==='"'){value+='"';i++;} else if(char==='"') quoted=!quoted; else if(char===','&&!quoted){row.push(value);value='';} else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&source[i+1]==='\n')i++;row.push(value);value='';if(row.some(cell=>cell.trim()))rows.push(row);row=[];} else value+=char;} row.push(value);if(row.some(cell=>cell.trim()))rows.push(row);return rows; }
  function uploadInputForRecord(record) { uploadInput.dataset.key = record.id; uploadInput.dataset.fid = record.__facilityId; uploadInput.click(); }
  function installModalHandlers() {
    modal.querySelector('[data-close]').addEventListener('click', closeModal); modal.querySelector('[data-cancel]').addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); }); form.addEventListener('submit', saveForm);
    body.addEventListener('change', (event) => {
      if (event.target.matches('[data-link-fid]')) {
        const fid = event.target.dataset.linkFid; perFacilityLinks[fid] = [...body.querySelectorAll(`[data-link-fid="${fid}"]:checked`)].map((input) => input.dataset.linkCode);
      }
      if (event.target.matches('[data-assigned-facility]')) {
        const assigned = selectedFacilities();
        if (routeNow === 'groups') { body.querySelector('[data-group-links]')?.remove(); body.insertAdjacentHTML('beforeend', `<div data-group-links>${groupLinksMarkup(routeNow, assigned)}</div>`); }
        if (routeNow === 'service-catalog') { const old = Object.fromEntries([...body.querySelectorAll('[data-catalog-facility]')].map((card) => [card.dataset.catalogFacility, catalogRecordForFacility(card.dataset.catalogFacility)])); body.querySelector('[data-catalog-assignments]')?.remove(); body.insertAdjacentHTML('beforeend', `<div data-catalog-assignments>${catalogAssignmentsMarkup(assigned, old)}</div>`); }
      }
      if (event.target.matches('[data-catalog-group]')) refreshCatalogFacility(event.target.dataset.catalogGroup);
    });
    body.addEventListener('input', (event) => {
      if (event.target.matches('[data-link-search]')) { const query = event.target.value.trim().toLowerCase(); event.target.closest('[data-links-list]').querySelectorAll('[data-link-item]').forEach((item) => { item.hidden = !item.dataset.search.includes(query); }); }
      if (event.target.matches('[name="materialCost"],[name="depreciationCost"]')) { form.elements.namedItem('totalCost').value = (Number(form.elements.namedItem('materialCost').value || 0) + Number(form.elements.namedItem('depreciationCost').value || 0)).toFixed(2).replace(/\.00$/, ''); }
    });
    body.addEventListener('click', (event) => {
      const bulk = event.target.closest('[data-bulk-open]'); if (bulk) { openItemPicker(bulk); return; }
      const button = event.target.closest('[data-catalog-picker-open]'); if (button) openItemPicker(button, 'catalog', button.dataset.catalogPickerOpen);
    });
  }
  function initPicker() {
    picker.querySelector('[data-picker-close]').addEventListener('click', () => { picker.hidden = true; }); picker.querySelector('[data-picker-cancel]').addEventListener('click', () => { picker.hidden = true; }); picker.querySelector('[data-picker-add]').addEventListener('click', () => pickerMode === 'catalog' ? addCatalogItems() : addMultipleItems());
    picker.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { itemPickTab = button.dataset.tab; itemPickPage = 1; renderItemPicker(); }));
    picker.querySelector('[data-picker-search]').addEventListener('input', (event) => { itemPickQuery = event.target.value.trim().toLowerCase(); itemPickPage = 1; renderItemPicker(); });
    picker.addEventListener('click', (event) => { const page = event.target.closest('[data-picker-page]'); if (!page) return; itemPickPage += page.dataset.pickerPage === 'next' ? 1 : -1; renderItemPicker(); });
    picker.addEventListener('change', (event) => { if (!event.target.matches('[data-picker-code]')) return; const set = itemPickTab === 'chapters' ? pickedChapters : itemPickTab === 'blocks' ? pickedBlocks : pickedItems; if (event.target.checked) set.add(event.target.dataset.pickerCode); else set.delete(event.target.dataset.pickerCode); renderItemPicker(); });
  }
  function installUpload() { uploadInput.addEventListener('change', async () => { const file = uploadInput.files?.[0]; const record = data['service-catalog'].find((item) => item.id === uploadInput.dataset.key && item.__facilityId === uploadInput.dataset.fid); if (file && record) await uploadFile(file, record); uploadInput.value = ''; }); }
  routes.forEach(makePage); installModalHandlers(); initPicker(); installUpload();
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !picker.hidden) picker.hidden = true; else if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  document.addEventListener('click', (event) => routes.forEach((route) => { const root = document.querySelector(`[data-organization-service-route="${route}"]`); if (root && !root.contains(event.target)) closeMenus(route); }));
  window.addEventListener('hashchange', () => routes.forEach((route) => { const root = document.querySelector(`[data-organization-service-route="${route}"]`); if (root) root.hidden = location.hash.slice(1) !== route; }));
  window.addEventListener('storage', (event) => {
    if (!event.key) return;
    const route = routes.find((candidate) => event.key.startsWith(keys[candidate])); if (!route) return;
    const facilityId = event.key.slice(keys[route].length); let records = [];
    try { const value = JSON.parse(event.newValue || '[]'); if (Array.isArray(value)) records = value; } catch { records = []; }
    data[route] = data[route].filter((record) => record.__facilityId !== facilityId).concat(records.map((record) => ({ ...record, __facilityId: facilityId })));
    if (routeNow === route) render(route);
  });
  routes.forEach((route) => { const root = document.querySelector(`[data-organization-service-route="${route}"]`); if (root) root.hidden = location.hash.slice(1) !== route; });
})();
