(() => {
  const root = document.querySelector('[data-groups-grid]');
  if (!root) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-groups:v1:${facilityId}`;
  const serviceItemsKey = `rcm-facility-service-items:v1:${facilityId}`;
  const pageSize = 6;
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const seed = [
    { id: 'group-consultation', type: 'group', code: 'GRP-CONS', description: 'Consultation Services', alias: 'Clinical visits', tags: ['Outpatient', 'Professional'], itemIds: ['SV-1001', 'SV-1002'], active: true },
    { id: 'subgroup-primary-care', type: 'subgroup', parentId: 'group-consultation', code: 'SUB-CONS-PRIMARY', description: 'Primary Care Visits', alias: 'Primary care', tags: ['Family medicine'], itemIds: ['SV-1001', 'SV-1002'], active: true },
    { id: 'subgroup-specialty-consult', type: 'subgroup', parentId: 'group-consultation', code: 'SUB-CONS-SPECIALTY', description: 'Specialty Consultations', alias: 'Specialist visits', tags: ['Specialty'], itemIds: [], active: true },
    { id: 'group-laboratory', type: 'group', code: 'GRP-LAB', description: 'Laboratory Diagnostics', alias: 'Lab services', tags: ['Diagnostics', 'Laboratory'], itemIds: ['SV-2001', 'SV-2011'], active: true },
    { id: 'subgroup-core-lab', type: 'subgroup', parentId: 'group-laboratory', code: 'SUB-LAB-CORE', description: 'Core Laboratory Testing', alias: 'Core lab', tags: ['Hematology'], itemIds: ['SV-2001'], active: true },
    { id: 'subgroup-microbiology', type: 'subgroup', parentId: 'group-laboratory', code: 'SUB-LAB-MICRO', description: 'Microbiology Testing', alias: 'Microbiology', tags: ['Culture'], itemIds: ['SV-2011'], active: true },
    { id: 'group-imaging', type: 'group', code: 'GRP-IMG', description: 'Diagnostic Imaging', alias: 'Imaging', tags: ['Radiology'], itemIds: ['SV-3001'], active: true },
    { id: 'subgroup-radiology', type: 'subgroup', parentId: 'group-imaging', code: 'SUB-IMG-RAD', description: 'Radiography and Imaging', alias: 'Radiology', tags: ['Diagnostic'], itemIds: ['SV-3001'], active: true },
    { id: 'group-pharmacy', type: 'group', code: 'GRP-PHARM', description: 'Pharmacy Services', alias: 'Pharmacy', tags: ['Medication'], itemIds: ['SV-4001'], active: true },
    { id: 'subgroup-outpatient-pharmacy', type: 'subgroup', parentId: 'group-pharmacy', code: 'SUB-PHARM-OP', description: 'Outpatient Pharmacy', alias: 'OP pharmacy', tags: ['Dispensing'], itemIds: ['SV-4001'], active: true },
    { id: 'group-procedures', type: 'group', code: 'GRP-PROC', description: 'Clinical Procedures', alias: 'Procedures', tags: ['Clinical'], itemIds: [], active: true },
  ];
  let serviceItems = [];
  try { serviceItems = JSON.parse(localStorage.getItem(serviceItemsKey) || '[]'); if (!Array.isArray(serviceItems)) serviceItems = []; } catch { serviceItems = []; }
  const availableItemCodes = new Set(serviceItems.map((item) => item.code));
  function load() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map((record) => ({ ...record, tags: Array.isArray(record.tags) ? record.tags : [], itemIds: (Array.isArray(record.itemIds) ? record.itemIds : []).filter((code) => availableItemCodes.has(code)) }));
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep this prototype usable without browser storage. */ }
    return seed.map((record) => ({ ...record, tags: [...record.tags], itemIds: [...record.itemIds] }));
  }
  let records = load();
  const filters = { code: '', description: '', status: '' };
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let parentId = null;
  let returnFocus = null;
  let toastTimer;
  let selectedItems = new Set();
  let currentTags = [];

  root.innerHTML = `
    <div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-group-add>${icons.add}Add Group</button></div>
      <div class="branches-filter-grid group-filter-grid" aria-label="Filter groups">
        <label class="facility-filter"><span>Code</span><input type="search" data-group-filter="code" placeholder="Search code"></label>
        <label class="facility-filter"><span>Description</span><input type="search" data-group-filter="description" placeholder="Search description"></label>
        <label class="facility-filter"><span>Status</span><select data-group-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      </div>
    </div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table groups-table"><thead><tr><th>Code</th><th>Description</th><th>Alias</th><th>Tags</th><th>Items</th><th>Status</th><th>Actions</th></tr></thead><tbody data-group-rows></tbody></table></div>
      <div class="facility-empty" data-group-empty hidden>No groups match your filters.</div><footer class="facility-pagination"><span data-group-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-group-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-group-page="previous" aria-label="Previous page">‹</button><span data-group-page-label></span><button class="icon-button" type="button" data-group-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-group-page="last" aria-label="Last page">»</button></div></footer></div>
    <div class="patient-modal-backdrop" data-group-modal hidden><section class="patient-modal branch-modal group-modal" role="dialog" aria-modal="true" aria-labelledby="group-modal-title" aria-describedby="group-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">SERVICE GROUP</p><h2 id="group-modal-title">Add Group</h2><p id="group-modal-description">Enter group details and link service items.</p></div><button class="icon-button" type="button" data-group-close aria-label="Close dialog">×</button></header>
      <form data-group-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">Group Details</legend><div class="facility-form-section-heading" data-group-section-title>Group Details</div><div class="patient-form-grid group-form-grid">
        <label class="form-field"><span>Code <b>*</b></span><input name="code" required autocomplete="off"></label><label class="form-field"><span>Description <b>*</b></span><input name="description" required autocomplete="off"></label><label class="form-field"><span>Alias</span><input name="alias" autocomplete="off"></label>
        <div class="form-field group-tag-field"><span>Tags</span><div class="group-tag-editor" data-tag-editor><div class="group-tag-list" data-tag-list></div><input type="text" data-tag-input placeholder="Type a tag and press Enter" autocomplete="off"></div><small>Press Enter or comma to add each tag.</small></div>
      </div></fieldset>
      <section class="group-items-section"><div class="facility-form-section-heading">Items List</div><div class="group-items-search" data-item-search-wrap><label class="facility-filter"><span>Search items</span><input type="search" data-item-search placeholder="Search service items by code or description"></label></div><div class="group-items-picker" data-item-picker></div><div class="group-items-empty" data-item-empty hidden>No service items match this search.</div></section>
      <div class="group-view-status" data-group-status hidden></div></div>
      <footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-group-cancel>Cancel</button><button class="button button-primary" type="submit" data-group-save>Create</button></div></footer></form></section></div>`;

  const rows = root.querySelector('[data-group-rows]');
  const empty = root.querySelector('[data-group-empty]');
  const count = root.querySelector('[data-group-count]');
  const pageLabel = root.querySelector('[data-group-page-label]');
  const modal = root.querySelector('[data-group-modal]');
  const form = root.querySelector('[data-group-form]');
  const tagList = form.querySelector('[data-tag-list]');
  const tagInput = form.querySelector('[data-tag-input]');
  const toast = document.querySelector('[data-facility-toast]');

  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep the current session available. */ } }
  function showToast(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300); }
  function isMatch(record) {
    return (!filters.code || record.code.toLowerCase().includes(filters.code))
      && (!filters.description || `${record.description} ${record.alias || ''} ${(record.tags || []).join(' ')}`.toLowerCase().includes(filters.description))
      && (!filters.status || (record.active ? 'active' : 'inactive') === filters.status);
  }
  function filteredGroups() {
    return records.filter((record) => record.type === 'group').map((group) => ({ group, groupMatches: isMatch(group), children: records.filter((child) => child.type === 'subgroup' && child.parentId === group.id && isMatch(child)) }))
      .filter((entry) => entry.groupMatches || entry.children.length);
  }
  function menuButton(record, isSubgroup) {
    const label = `${record.description} actions`;
    return `<div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-row-menu aria-label="${esc(label)}" aria-haspopup="menu" aria-expanded="false" data-id="${esc(record.id)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-group-action="view" data-id="${esc(record.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-group-action="edit" data-id="${esc(record.id)}">${icons.edit}Edit</button>${isSubgroup ? '' : `<button type="button" role="menuitem" data-group-action="add-subgroup" data-id="${esc(record.id)}">${icons.add}Add Sub Group</button>`}<button type="button" role="menuitem" data-group-action="toggle" data-id="${esc(record.id)}">${icons.status}${record.active ? 'Deactivate' : 'Activate'}</button></div></div>`;
  }
  function rowMarkup(record, isSubgroup, groupMatches = true, contextOnly = false) {
    const matched = isMatch(record);
    if (!matched && groupMatches && !contextOnly) return '';
    const tags = (record.tags || []).map((tag) => `<span class="group-tag-pill">${esc(tag)}</span>`).join('') || '—';
    const itemCount = (record.itemIds || []).length;
    return `<tr class="${isSubgroup ? 'group-child-row' : 'group-parent-row'}${contextOnly ? ' group-context-row' : ''}"><td class="branch-code">${isSubgroup ? '<span class="group-child-marker" aria-hidden="true">↳</span>' : ''}${esc(record.code)}</td><td><span class="facility-name-en">${esc(record.description)}</span>${isSubgroup ? '<span class="group-kind-label">Sub Group</span>' : contextOnly ? '<span class="group-kind-label">Parent Group</span>' : ''}</td><td>${esc(record.alias || '—')}</td><td><div class="group-tags-cell">${tags}</div></td><td><span class="group-item-count">${itemCount}</span></td><td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td><td>${menuButton(record, isSubgroup)}</td></tr>`;
  }
  function render() {
    const matching = filteredGroups();
    const totalRecords = matching.reduce((total, entry) => total + 1 + (entry.groupMatches ? records.filter((child) => child.type === 'subgroup' && child.parentId === entry.group.id && isMatch(child)).length : entry.children.length), 0);
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map(({ group, groupMatches, children }) => `${rowMarkup(group, false, true, !groupMatches)}${(groupMatches ? records.filter((child) => child.type === 'subgroup' && child.parentId === group.id) : children).map((child) => rowMarkup(child, true, groupMatches)).join('')}`).join('');
    empty.hidden = matching.length > 0;
    count.textContent = `Total Results: ${totalRecords}`;
    pageLabel.textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-group-page]').forEach((button) => { button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.groupPage) ? page === 1 : page === pages); });
  }
  function closeMenus() { rows.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; menu.parentElement.querySelector('[data-row-menu]').setAttribute('aria-expanded', 'false'); }); }
  function renderTags() {
    tagList.innerHTML = currentTags.map((tag, index) => `<span class="group-tag-chip">${esc(tag)}${mode === 'view' ? '' : `<button type="button" aria-label="Remove ${esc(tag)}" data-remove-tag="${index}">×</button>`}</span>`).join('');
    tagInput.hidden = mode === 'view';
    tagInput.disabled = mode === 'view';
  }
  function renderItems() {
    const query = form.querySelector('[data-item-search]').value.trim().toLowerCase();
    const matching = serviceItems.filter((item) => (mode !== 'view' || selectedItems.has(item.code)) && `${item.code} ${item.shortDescription || ''} ${item.longDescription || ''}`.toLowerCase().includes(query));
    const picker = form.querySelector('[data-item-picker]');
    picker.innerHTML = matching.map((item) => `<label class="group-item-option"><input type="checkbox" value="${esc(item.code)}" data-item-choice ${selectedItems.has(item.code) ? 'checked' : ''} ${mode === 'view' ? 'disabled' : ''}><span class="group-item-code">${esc(item.code)}</span><span>${esc(item.shortDescription || item.longDescription || 'Service item')}</span><small>${item.active === false ? 'Inactive' : 'Active'}</small></label>`).join('');
    const noItems = form.querySelector('[data-item-empty]');
    noItems.textContent = mode === 'view' ? 'No linked Service Items.' : 'No service items match this search.';
    noItems.hidden = matching.length > 0;
  }
  function setReadOnly(readOnly) {
    form.querySelectorAll('input[name]').forEach((field) => { field.disabled = readOnly; });
    form.querySelector('[data-item-search-wrap]').hidden = readOnly;
    form.querySelector('[data-item-search]').disabled = readOnly;
    form.querySelector('[data-group-save]').hidden = readOnly;
    form.querySelector('[data-group-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
    form.querySelector('[data-group-status]').hidden = !readOnly;
    form.querySelector('[data-tag-editor]').classList.toggle('is-readonly', readOnly);
  }
  function openModal(nextMode, record = null, nextParentId = null, trigger = document.activeElement) {
    mode = nextMode;
    activeId = record?.id || null;
    parentId = nextParentId || record?.parentId || null;
    returnFocus = trigger;
    selectedItems = new Set(record?.itemIds || []);
    currentTags = [...(record?.tags || [])];
    form.reset();
    form.elements.namedItem('code').value = record?.code || '';
    form.elements.namedItem('description').value = record?.description || '';
    form.elements.namedItem('alias').value = record?.alias || '';
    form.querySelector('[data-group-section-title]').textContent = parentId ? 'Sub Group Details' : 'Group Details';
    const kind = parentId ? 'Sub Group' : 'Group';
    const readOnly = nextMode === 'view';
    setReadOnly(readOnly);
    modal.querySelector('#group-modal-title').textContent = `${nextMode === 'new' ? 'Add' : nextMode === 'edit' ? 'Edit' : 'View'} ${kind}`;
    modal.querySelector('#group-modal-description').textContent = readOnly ? `Review ${kind.toLowerCase()} details and linked service items.` : nextMode === 'edit' ? `Update ${kind.toLowerCase()} details and linked service items.` : `Enter ${kind.toLowerCase()} details and link service items.`;
    form.querySelector('[data-group-save]').textContent = nextMode === 'edit' ? 'Save Changes' : 'Create';
    const status = form.querySelector('[data-group-status]');
    if (readOnly) status.innerHTML = `<span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span>`;
    else status.textContent = '';
    form.querySelector('[data-item-search]').value = '';
    renderTags();
    renderItems();
    modal.hidden = false;
    document.body.classList.add('modal-open');
    if (!readOnly) form.elements.namedItem('code').focus();
    else form.querySelector('[data-group-cancel]').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('modal-open'); returnFocus?.focus?.(); }
  function addTag(value) {
    const tag = value.trim().replace(/,$/, '').trim();
    if (tag && !currentTags.some((existing) => existing.toLocaleLowerCase() === tag.toLocaleLowerCase())) currentTags.push(tag);
    tagInput.value = '';
    renderTags();
    tagInput.focus();
  }
  function uniqueId() { return globalThis.crypto?.randomUUID ? crypto.randomUUID() : `group-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

  root.addEventListener('input', (event) => {
    const filter = event.target.closest('[data-group-filter]');
    if (filter) {
      filters[filter.dataset.groupFilter] = filter.value.trim().toLowerCase();
      page = 1;
      render();
    }
    if (event.target.matches('[data-item-search]')) renderItems();
  });
  root.addEventListener('change', (event) => {
    const filter = event.target.closest('[data-group-filter]');
    if (filter) { filters[filter.dataset.groupFilter] = filter.value.trim().toLowerCase(); page = 1; render(); }
    if (event.target.matches('[data-item-choice]')) {
      if (event.target.checked) selectedItems.add(event.target.value);
      else selectedItems.delete(event.target.value);
    }
  });
  root.addEventListener('keydown', (event) => {
    if (event.target !== tagInput) return;
    if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addTag(tagInput.value); }
    else if (event.key === 'Backspace' && !tagInput.value && currentTags.length) { currentTags.pop(); renderTags(); }
  });
  root.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.matches('[data-group-add]')) openModal('new', null, null, target);
    else if (target.matches('[data-row-menu]')) { const menu = target.nextElementSibling; const shouldOpen = menu.hidden; closeMenus(); menu.hidden = !shouldOpen; target.setAttribute('aria-expanded', String(shouldOpen)); }
    else if (target.matches('[data-group-action]')) {
      const record = records.find((item) => item.id === target.dataset.id);
      if (!record) return;
      closeMenus();
      if (target.dataset.groupAction === 'toggle') { record.active = !record.active; persist(); render(); showToast(`${record.description} ${record.active ? 'activated' : 'deactivated'}.`); }
      else if (target.dataset.groupAction === 'add-subgroup') openModal('new', null, record.id, target);
      else openModal(target.dataset.groupAction, record, null, target);
    } else if (target.matches('[data-remove-tag]')) { currentTags.splice(Number(target.dataset.removeTag), 1); renderTags(); }
    else if (target.matches('[data-group-page]')) {
      const pages = Math.max(1, Math.ceil(filteredGroups().length / pageSize));
      if (target.dataset.groupPage === 'first') page = 1;
      if (target.dataset.groupPage === 'previous') page--;
      if (target.dataset.groupPage === 'next') page++;
      if (target.dataset.groupPage === 'last') page = pages;
      render();
    }
  });
  modal.addEventListener('click', (event) => { if (event.target === modal || event.target.closest('[data-group-close], [data-group-cancel]')) closeModal(); });
  modal.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const record = {
      id: activeId || uniqueId(), type: parentId ? 'subgroup' : 'group', parentId,
      code: form.elements.namedItem('code').value.trim(), description: form.elements.namedItem('description').value.trim(), alias: form.elements.namedItem('alias').value.trim(),
      tags: [...currentTags], itemIds: [...selectedItems], active: mode === 'edit' ? Boolean(records.find((item) => item.id === activeId)?.active) : true,
    };
    const duplicate = records.some((item) => item.code.toLocaleLowerCase() === record.code.toLocaleLowerCase() && item.id !== activeId);
    if (duplicate) {
      form.elements.namedItem('code').setCustomValidity('This code is already in use by a Group or Sub Group.');
      form.reportValidity();
      form.elements.namedItem('code').setCustomValidity('');
      return;
    }
    if (mode === 'edit') records = records.map((item) => item.id === activeId ? record : item);
    else records.push(record);
    persist(); render(); closeModal(); showToast(mode === 'edit' ? `${parentId ? 'Sub Group' : 'Group'} updated.` : `${parentId ? 'Sub Group' : 'Group'} created.`);
  });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) closeMenus(); });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  window.addEventListener('hashchange', () => { root.hidden = location.hash.slice(1) !== 'groups'; });
  root.hidden = location.hash.slice(1) !== 'groups';
  render();
})();
