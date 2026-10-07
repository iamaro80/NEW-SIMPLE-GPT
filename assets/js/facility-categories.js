(() => {
  const root = document.querySelector('[data-categories-grid]');
  if (!root) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-categories:v1:${facilityId}`;
  const serviceItemsKey = `rcm-facility-service-items:v1:${facilityId}`;
  const pageSize = 5;
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const seed = [
    { code: 'CAT-CONS', description: 'Category 1', alias: 'Category 1 alias', active: true },
    { code: 'CAT-LAB', description: 'Category 2', alias: 'Category 2 alias', active: true },
    { code: 'CAT-IMG', description: 'Category 3', alias: 'Category 3 alias', active: true },
    { code: 'CAT-PHARM', description: 'Category 4', alias: 'Category 4 alias', active: true },
    { code: 'CAT-PROC', description: 'Category 5', alias: 'Category 5 alias', active: true },
    { code: 'CAT-THER', description: 'Category 6', alias: '', active: true },
  ];
  function load() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep the prototype usable when storage is unavailable. */ }
    return seed.map((item) => ({ ...item }));
  }
  let records = load();
  let filters = { code: '', description: '', status: '' };
  let page = 1;
  let mode = 'new';
  let activeCode = null;
  let returnFocus = null;
  let toastTimer;

  root.innerHTML = `
    <div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-category-add>${icons.add}Add Category</button></div>
      <div class="branches-filter-grid category-filter-grid" aria-label="Filter categories">
        <label class="facility-filter"><span>Code</span><input type="search" data-category-filter="code" placeholder="Search code"></label>
        <label class="facility-filter"><span>Description</span><input type="search" data-category-filter="description" placeholder="Search description"></label>
        <label class="facility-filter"><span>Status</span><select data-category-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      </div>
    </div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table categories-table"><thead><tr><th>Code</th><th>Description</th><th>Alias</th><th>Status</th><th>Actions</th></tr></thead><tbody data-category-rows></tbody></table></div>
      <div class="facility-empty" data-category-empty hidden>No categories match your filters.</div><footer class="facility-pagination"><span data-category-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-category-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-category-page="previous" aria-label="Previous page">‹</button><span data-category-page-label></span><button class="icon-button" type="button" data-category-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-category-page="last" aria-label="Last page">»</button></div></footer></div>
    <div class="patient-modal-backdrop" data-category-modal hidden><section class="patient-modal branch-modal category-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title" aria-describedby="category-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">SERVICE CATEGORY</p><h2 id="category-modal-title">Add Category</h2><p id="category-modal-description">Enter category details.</p></div><button class="icon-button" type="button" data-category-close aria-label="Close dialog">×</button></header>
      <form data-category-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">Category Details</legend><div class="facility-form-section-heading">Category Details</div><div class="patient-form-grid category-form-grid">
        <label class="form-field"><span>Code <b>*</b></span><input name="code" required autocomplete="off"></label>
        <label class="form-field"><span>Description <b>*</b></span><input name="description" required autocomplete="off"></label>
        <label class="form-field"><span>Alias</span><input name="alias" autocomplete="off"></label>
      </div></fieldset>
      <section class="category-mapped-services" data-mapped-services hidden><div class="facility-form-section-heading">Mapped Services</div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table category-services-table"><thead><tr><th>#</th><th>Chapter</th><th>Block</th><th>Code</th><th>Description</th></tr></thead><tbody data-mapped-service-rows></tbody></table></div><div class="facility-empty" data-no-mapped-services hidden>No mapped services.</div></div></section>
      <div class="category-view-status" data-category-status hidden></div></div>
      <footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button class="button button-secondary" type="button" data-category-cancel>Cancel</button><button class="button button-primary" type="submit" data-category-save>Create</button></div></footer></form></section></div>`;

  const rows = root.querySelector('[data-category-rows]');
  const empty = root.querySelector('[data-category-empty]');
  const count = root.querySelector('[data-category-count]');
  const pageLabel = root.querySelector('[data-category-page-label]');
  const modal = root.querySelector('[data-category-modal]');
  const form = root.querySelector('[data-category-form]');
  const toast = document.querySelector('[data-facility-toast]');

  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep the current session available. */ } }
  function showToast(message) { toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300); }
  function filteredCategories() {
    return records.filter((record) => (!filters.code || String(record.code).toLowerCase().includes(filters.code))
      && (!filters.description || `${record.description} ${record.alias || ''}`.toLowerCase().includes(filters.description))
      && (!filters.status || (record.active ? 'active' : 'inactive') === filters.status));
  }
  function render() {
    const matching = filteredCategories();
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((record) => `<tr><td class="branch-code">${escapeHtml(record.code)}</td><td><span class="facility-name-en">${escapeHtml(record.description)}</span></td><td>${escapeHtml(record.alias || '—')}</td><td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-row-menu aria-label="Actions for ${escapeHtml(record.description)}" aria-haspopup="menu" aria-expanded="false" data-code="${escapeHtml(record.code)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-category-action="view" data-code="${escapeHtml(record.code)}">${icons.eye}View</button><button type="button" role="menuitem" data-category-action="edit" data-code="${escapeHtml(record.code)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-category-action="toggle" data-code="${escapeHtml(record.code)}">${icons.status}${record.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    empty.hidden = matching.length > 0;
    count.textContent = `Total Results: ${matching.length}`;
    pageLabel.textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    root.querySelectorAll('[data-category-page]').forEach((button) => { button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.categoryPage) ? page === 1 : page === pages); });
  }
  function mappedServices(category) {
    let services = [];
    try {
      const saved = localStorage.getItem(serviceItemsKey);
      if (saved) services = JSON.parse(saved);
    } catch { /* Mapping table remains available with an empty state. */ }
    const values = [category.code, category.description, category.alias].filter(Boolean).map((value) => value.toLocaleLowerCase());
    return services.filter((service) => values.includes(String(service.category || '').toLocaleLowerCase()));
  }
  function setReadonly(readOnly) {
    form.querySelectorAll('input').forEach((field) => { field.disabled = readOnly; });
    form.querySelector('[data-category-save]').hidden = readOnly;
    form.querySelector('[data-category-cancel]').textContent = readOnly ? 'Close' : 'Cancel';
    form.querySelector('[data-category-status]').hidden = !readOnly;
    form.querySelector('[data-mapped-services]').hidden = !readOnly;
  }
  function openModal(nextMode, record = null, trigger = document.activeElement) {
    mode = nextMode;
    activeCode = record?.code || null;
    returnFocus = trigger;
    form.reset();
    form.elements.namedItem('code').value = record?.code || '';
    form.elements.namedItem('description').value = record?.description || '';
    form.elements.namedItem('alias').value = record?.alias || '';
    const readOnly = nextMode === 'view';
    setReadonly(readOnly);
    modal.querySelector('#category-modal-title').textContent = nextMode === 'new' ? 'Add Category' : nextMode === 'edit' ? 'Edit Category' : 'View Category';
    modal.querySelector('#category-modal-description').textContent = nextMode === 'view' ? 'Review category details and mapped services.' : nextMode === 'edit' ? 'Update category details.' : 'Enter category details.';
    form.querySelector('[data-category-save]').textContent = nextMode === 'edit' ? 'Save Changes' : 'Create';
    const status = form.querySelector('[data-category-status]');
    if (readOnly) {
      status.innerHTML = `<span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span>`;
      const related = mappedServices(record);
      form.querySelector('[data-mapped-service-rows]').innerHTML = related.map((service, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(service.chapter || '—')}</td><td>${escapeHtml(service.block || '—')}</td><td class="branch-code">${escapeHtml(service.code || '—')}</td><td>${escapeHtml(service.shortDescription || service.longDescription || '—')}</td></tr>`).join('');
      form.querySelector('[data-no-mapped-services]').hidden = related.length > 0;
    } else {
      status.textContent = '';
      form.querySelector('[data-mapped-service-rows]').innerHTML = '';
      form.querySelector('[data-no-mapped-services]').hidden = true;
    }
    modal.hidden = false;
    document.body.classList.add('modal-open');
    form.elements.namedItem('code').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('modal-open'); returnFocus?.focus?.(); }
  function closeMenus() { rows.querySelectorAll('.facility-row-menu').forEach((menu) => { menu.hidden = true; menu.parentElement.querySelector('[data-row-menu]').setAttribute('aria-expanded', 'false'); }); }

  root.addEventListener('input', (event) => {
    const field = event.target.closest('[data-category-filter]');
    if (!field) return;
    filters[field.dataset.categoryFilter] = field.value.trim().toLowerCase();
    page = 1;
    render();
  });
  root.addEventListener('change', (event) => {
    const field = event.target.closest('[data-category-filter]');
    if (!field) return;
    filters[field.dataset.categoryFilter] = field.value.trim().toLowerCase();
    page = 1;
    render();
  });
  root.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.matches('[data-category-add]')) openModal('new', null, target);
    else if (target.matches('[data-row-menu]')) {
      const menu = target.nextElementSibling;
      const shouldOpen = menu.hidden;
      closeMenus(); menu.hidden = !shouldOpen; target.setAttribute('aria-expanded', String(shouldOpen));
    } else if (target.matches('[data-category-action]')) {
      const record = records.find((item) => item.code === target.dataset.code);
      if (!record) return;
      closeMenus();
      if (target.dataset.categoryAction === 'toggle') {
        record.active = !record.active; persist(); render();
        showToast(`${record.description} ${record.active ? 'activated' : 'deactivated'}.`);
      } else openModal(target.dataset.categoryAction, record, target);
    } else if (target.matches('[data-category-page]')) {
      const pages = Math.max(1, Math.ceil(filteredCategories().length / pageSize));
      if (target.dataset.categoryPage === 'first') page = 1;
      if (target.dataset.categoryPage === 'previous') page--;
      if (target.dataset.categoryPage === 'next') page++;
      if (target.dataset.categoryPage === 'last') page = pages;
      render();
    }
  });
  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-category-close], [data-category-cancel]')) closeModal();
  });
  modal.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const category = {
      code: form.elements.namedItem('code').value.trim(),
      description: form.elements.namedItem('description').value.trim(),
      alias: form.elements.namedItem('alias').value.trim(),
      active: mode === 'edit' ? Boolean(records.find((item) => item.code === activeCode)?.active) : true,
    };
    const duplicate = records.some((item) => item.code.toLowerCase() === category.code.toLowerCase() && item.code !== activeCode);
    if (duplicate) {
      form.elements.namedItem('code').setCustomValidity('This category code is already in use.');
      form.reportValidity();
      form.elements.namedItem('code').setCustomValidity('');
      return;
    }
    if (mode === 'edit') records = records.map((item) => item.code === activeCode ? category : item);
    else records.unshift(category);
    persist(); render(); closeModal(); showToast(mode === 'edit' ? 'Category updated.' : 'Category created.');
  });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) closeMenus(); });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  window.addEventListener('hashchange', () => { root.hidden = location.hash.slice(1) !== 'categories'; });
  root.hidden = location.hash.slice(1) !== 'categories';
  render();
})();
