(() => {
  const workspace = document.querySelector('[data-structure-workspace]');
  if (!workspace) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-cost-centers:v1:${facilityId}`;
  const pageSize = 5;
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  };
  const seed = [
    { code: 'CC-ER', name: 'Cost Center 1', pharmaceuticals: false },
    { code: 'CC-AMB', name: 'Cost Center 2', pharmaceuticals: false },
    { code: 'CC-LAB', name: 'Cost Center 3', pharmaceuticals: false },
    { code: 'CC-PHARM', name: 'Cost Center 4', pharmaceuticals: true },
    { code: 'CC-DIAG', name: 'Cost Center 5', pharmaceuticals: false },
  ];
  const childSeed = [
    { code: 'CC-ER-TRI', name: 'Sub Cost Center 1', parentCode: 'CC-ER', pharmaceuticals: false, glCode: '5101-01' },
    { code: 'CC-ER-TREAT', name: 'Sub Cost Center 2', parentCode: 'CC-ER', pharmaceuticals: false, glCode: '5101-02' },
    { code: 'CC-AMB-FAM', name: 'Sub Cost Center 3', parentCode: 'CC-AMB', pharmaceuticals: false, glCode: '5201-01' },
    { code: 'CC-LAB-CORE', name: 'Sub Cost Center 4', parentCode: 'CC-LAB', pharmaceuticals: false, glCode: '5301-01' },
    { code: 'CC-PHARM-OP', name: 'Sub Cost Center 5', parentCode: 'CC-PHARM', pharmaceuticals: true, glCode: '5401-01' },
    { code: 'CC-DIAG-RAD', name: 'Sub Cost Center 6', parentCode: 'CC-DIAG', pharmaceuticals: false, glCode: '5501-01' },
  ];

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      const records = [...seed.map((item) => ({ ...item, parentCode: '', glCode: '' })), ...childSeed.map((item) => ({ ...item }))];
      localStorage.setItem(storageKey, JSON.stringify(records));
      return records;
    } catch { return [...seed.map((item) => ({ ...item, parentCode: '', glCode: '' })), ...childSeed.map((item) => ({ ...item }))]; }
  }

  let records = load();
  let filters = { name: '', code: '' };
  let pageNumber = 1;
  let mode = 'new';
  let activeCode = null;
  let parentCodeForChild = null;
  let returnFocus = null;
  let toastTimer;

  const page = document.createElement('section');
  page.className = 'facility-grid cost-center-page';
  page.dataset.financialPage = 'cost-centers';
  page.setAttribute('aria-label', 'Cost Centers');
  page.hidden = true;
  page.innerHTML = `
    <div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-cost-add>${icons.add}Add Cost Center</button></div>
      <div class="branches-filter-grid cost-center-filters" role="search" aria-label="Filter cost centers">
        <label class="facility-filter"><span>Name</span><input type="search" data-cost-filter="name" placeholder="Search name"></label>
        <label class="facility-filter"><span>Code</span><input type="search" data-cost-filter="code" placeholder="Search code"></label>
      </div>
    </div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table cost-center-table"><thead><tr><th scope="col">Name</th><th scope="col">Code</th><th scope="col">Is Pharmaceuticals</th><th scope="col">GL Code</th><th scope="col">Actions</th></tr></thead><tbody data-cost-rows></tbody></table></div>
      <div class="facility-empty" data-cost-empty hidden>No cost centers match your filters.</div>
      <footer class="facility-pagination"><span data-cost-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-cost-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-cost-page="previous" aria-label="Previous page">‹</button><span data-cost-page-label></span><button class="icon-button" type="button" data-cost-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-cost-page="last" aria-label="Last page">»</button></div></footer>
    </div>
    <div class="patient-modal-backdrop" data-cost-modal hidden><section class="patient-modal branch-modal" role="dialog" aria-modal="true" aria-labelledby="cost-modal-title" aria-describedby="cost-modal-description">
      <header class="patient-modal-header"><div><p class="eyebrow">COST CENTER RECORD</p><h2 id="cost-modal-title">Add Cost Center</h2><p id="cost-modal-description">Enter cost center information.</p></div><button class="icon-button" type="button" data-cost-close aria-label="Close dialog">${icons.close}</button></header>
      <form data-cost-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">Basic Information</legend><div class="facility-form-section-heading">Basic Information</div><div class="patient-form-grid">
        <div class="form-field cost-parent-context" data-cost-parent-context hidden><span>Parent Cost Center</span><strong data-cost-parent-name></strong></div>
        <label class="form-field"><span>Name <b>*</b></span><input name="name" required autocomplete="off"></label>
        <label class="form-field"><span>Code <b>*</b></span><input name="code" required autocomplete="off"></label>
        <label class="form-field cost-gl-field" data-cost-gl-field hidden><span>GL Code</span><input name="glCode" autocomplete="off"></label>
        <label class="form-field form-field-checkbox"><input type="checkbox" name="pharmaceuticals"><span>Is Pharmaceuticals</span></label>
      </div></fieldset></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-cost-cancel>Cancel</button><button type="submit" class="button button-primary" data-cost-save>Create</button></div></footer></form>
    </section></div>`;
  workspace.append(page);

  const rows = page.querySelector('[data-cost-rows]');
  const modal = page.querySelector('[data-cost-modal]');
  const form = page.querySelector('[data-cost-form]');
  const title = page.querySelector('#cost-modal-title');
  const description = page.querySelector('#cost-modal-description');
  const saveButton = page.querySelector('[data-cost-save]');

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep the prototype available in memory. */ }
  }

  function toast(message) {
    const target = document.querySelector('[data-facility-toast]');
    if (!target) return;
    target.textContent = message;
    target.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => target.classList.remove('is-visible'), 2300);
  }

  function topLevelRecords() { return records.filter((record) => !record.parentCode); }

  function matches(record) {
    return (!filters.name || record.name.toLocaleLowerCase().includes(filters.name))
      && (!filters.code || record.code.toLocaleLowerCase().includes(filters.code));
  }

  function render() {
    const top = topLevelRecords();
    const entries = top.map((parent) => {
      const children = records.filter((record) => record.parentCode === parent.code);
      const parentMatches = matches(parent);
      const matchingChildren = children.filter(matches);
      if (!parentMatches && !matchingChildren.length) return null;
      return { parent, children: parentMatches ? children : matchingChildren };
    }).filter(Boolean);
    const totalRecords = entries.reduce((total, entry) => total + 1 + entry.children.length, 0);
    const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
    pageNumber = Math.min(pageNumber, totalPages);
    const visible = entries.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    const markup = [];
    visible.forEach(({ parent, children }) => {
      markup.push(rowMarkup(parent, false));
      children.forEach((child) => markup.push(rowMarkup(child, true, parent.name)));
    });
    rows.innerHTML = markup.join('');
    page.querySelector('[data-cost-empty]').hidden = totalRecords > 0;
    page.querySelector('[data-cost-count]').textContent = `Total Results: ${totalRecords}`;
    page.querySelector('[data-cost-page-label]').textContent = `Page ${entries.length ? pageNumber : 0} of ${entries.length ? totalPages : 0}`;
    page.querySelectorAll('[data-cost-page]').forEach((button) => {
      button.disabled = entries.length === 0 || (['first', 'previous'].includes(button.dataset.costPage) ? pageNumber === 1 : pageNumber === totalPages);
    });
  }

  function rowMarkup(record, isChild, parentName = '') {
    return `<tr class="${isChild ? 'cost-center-child-row' : 'cost-center-parent-row'}"${isChild ? ` data-parent-code="${escapeHtml(record.parentCode)}"` : ''}>
      <td><span class="cost-center-name${isChild ? ' is-child' : ''}"${isChild ? ` title="Under ${escapeHtml(parentName)}"` : ''}>${escapeHtml(record.name)}</span></td>
      <td class="branch-code">${escapeHtml(record.code)}</td><td>${record.pharmaceuticals ? 'Yes' : 'No'}</td><td>${escapeHtml(record.glCode || '—')}</td>
      <td><div class="cost-center-actions"><button class="icon-button period-action" type="button" data-cost-action="edit" data-cost-code="${escapeHtml(record.code)}" aria-label="Edit ${escapeHtml(record.name)}" title="Edit">${icons.edit}</button>${isChild ? '' : `<button class="icon-button period-action" type="button" data-cost-action="add-child" data-cost-code="${escapeHtml(record.code)}" aria-label="Add sub cost center under ${escapeHtml(record.name)}" title="Add sub cost center">${icons.add}</button>`}</div></td>
    </tr>`;
  }

  function openModal(nextMode, record = null, trigger = document.activeElement, parent = null) {
    mode = nextMode;
    activeCode = record?.code || null;
    parentCodeForChild = parent?.code || record?.parentCode || null;
    returnFocus = trigger;
    form.reset();
    const isChild = nextMode === 'child' || Boolean(record?.parentCode);
    const context = page.querySelector('[data-cost-parent-context]');
    context.hidden = !isChild;
    page.querySelector('[data-cost-parent-name]').textContent = parent?.name || records.find((item) => item.code === parentCodeForChild)?.name || '';
    page.querySelector('[data-cost-gl-field]').hidden = !isChild;
    title.textContent = nextMode === 'edit' ? (isChild ? 'Edit Sub Cost Center' : 'Edit Cost Center') : isChild ? 'Add Sub Cost Center' : 'Add Cost Center';
    description.textContent = nextMode === 'edit' ? 'Update cost center information.' : isChild ? 'Add a cost center under the selected parent.' : 'Enter cost center information.';
    saveButton.textContent = nextMode === 'edit' ? 'Save changes' : 'Create';
    form.elements.name.value = record?.name || '';
    form.elements.code.value = record?.code || '';
    form.elements.glCode.value = record?.glCode || '';
    form.elements.pharmaceuticals.checked = Boolean(record?.pharmaceuticals);
    modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    modal.querySelector('[data-cost-close]').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  page.querySelector('[data-cost-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  page.querySelectorAll('[data-cost-filter]').forEach((field) => field.addEventListener('input', () => {
    filters[field.dataset.costFilter] = field.value.trim().toLocaleLowerCase();
    pageNumber = 1;
    render();
  }));
  page.querySelectorAll('[data-cost-page]').forEach((button) => button.addEventListener('click', () => {
    const entryCount = topLevelRecords().filter((parent) => matches(parent) || records.some((child) => child.parentCode === parent.code && matches(child))).length;
    const totalPages = Math.max(1, Math.ceil(entryCount / pageSize));
    if (button.dataset.costPage === 'first') pageNumber = 1;
    if (button.dataset.costPage === 'previous') pageNumber = Math.max(1, pageNumber - 1);
    if (button.dataset.costPage === 'next') pageNumber = Math.min(totalPages, pageNumber + 1);
    if (button.dataset.costPage === 'last') pageNumber = totalPages;
    render();
  }));
  rows.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cost-action]');
    if (!button) return;
    const record = records.find((item) => item.code === button.dataset.costCode);
    if (!record) return;
    if (button.dataset.costAction === 'edit') openModal('edit', record, button);
    if (button.dataset.costAction === 'add-child' && !record.parentCode) openModal('child', null, button, record);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = form.elements.name.value.trim();
    const code = form.elements.code.value.trim();
    const duplicate = records.some((record) => record.code.toLocaleLowerCase() === code.toLocaleLowerCase() && record.code !== activeCode);
    if (duplicate) { form.elements.code.setCustomValidity('This cost center code is already in use.'); form.reportValidity(); form.elements.code.setCustomValidity(''); return; }
    const existing = mode === 'edit' ? records.find((item) => item.code === activeCode) : null;
    const record = {
      code,
      name,
      parentCode: existing ? existing.parentCode || '' : mode === 'child' ? parentCodeForChild : '',
      pharmaceuticals: form.elements.pharmaceuticals.checked,
      glCode: (mode === 'child' || existing?.parentCode) ? form.elements.glCode.value.trim() : '',
    };
    if (existing) {
      const oldCode = existing.code;
      Object.assign(existing, record);
      if (!existing.parentCode && oldCode !== existing.code) records.forEach((item) => { if (item.parentCode === oldCode) item.parentCode = existing.code; });
    }
    else records.push(record);
    persist();
    closeModal();
    render();
    toast(`${name} was ${existing ? 'updated' : 'created'} successfully.`);
  });

  page.querySelector('[data-cost-close]').addEventListener('click', closeModal);
  page.querySelector('[data-cost-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  function updateRoute() { page.hidden = location.hash.slice(1) !== 'cost-centers'; }
  updateRoute();
  window.addEventListener('hashchange', updateRoute);
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey || !event.newValue) return;
    try { const value = JSON.parse(event.newValue); if (Array.isArray(value)) { records = value; render(); } } catch { /* Ignore invalid external updates. */ }
  });
  render();
})();
