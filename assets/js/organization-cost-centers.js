(() => {
  const grid = document.querySelector('[data-organization-cost-centers-grid]');
  if (!grid) return;
  const facilities = (window.RcmFacilityStore?.list?.() || []).map((item) => ({ ...item, id: String(item.id) }));
  const key = (id) => `rcm-facility-cost-centers:v1:${id}`;
  const seed = [
    { code: 'CC-ER', name: 'Cost Center 1', parentCode: '', pharmaceuticals: false, glCode: '' },
    { code: 'CC-AMB', name: 'Cost Center 2', parentCode: '', pharmaceuticals: false, glCode: '' },
    { code: 'CC-LAB', name: 'Cost Center 3', parentCode: '', pharmaceuticals: false, glCode: '' },
    { code: 'CC-PHARM', name: 'Cost Center 4', parentCode: '', pharmaceuticals: true, glCode: '' },
    { code: 'CC-DIAG', name: 'Cost Center 5', parentCode: '', pharmaceuticals: false, glCode: '' },
    { code: 'CC-ER-TRI', name: 'Sub Cost Center 1', parentCode: 'CC-ER', pharmaceuticals: false, glCode: '5101-01' },
    { code: 'CC-ER-TREAT', name: 'Sub Cost Center 2', parentCode: 'CC-ER', pharmaceuticals: false, glCode: '5101-02' },
    { code: 'CC-AMB-FAM', name: 'Sub Cost Center 3', parentCode: 'CC-AMB', pharmaceuticals: false, glCode: '5201-01' },
    { code: 'CC-LAB-CORE', name: 'Sub Cost Center 4', parentCode: 'CC-LAB', pharmaceuticals: false, glCode: '5301-01' },
    { code: 'CC-PHARM-OP', name: 'Sub Cost Center 5', parentCode: 'CC-PHARM', pharmaceuticals: true, glCode: '5401-01' },
    { code: 'CC-DIAG-RAD', name: 'Sub Cost Center 6', parentCode: 'CC-DIAG', pharmaceuticals: false, glCode: '5501-01' },
  ];
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const facilityName = (id) => facilities.find((item) => item.id === String(id))?.englishName || `Facility ${id}`;
  const read = (id) => {
    try {
      const stored = localStorage.getItem(key(id));
      if (stored !== null) { const parsed = JSON.parse(stored); if (Array.isArray(parsed)) return parsed; }
      localStorage.setItem(key(id), JSON.stringify(seed));
    } catch { /* Keep seeded records available for this session. */ }
    return seed.map((item) => ({ ...item }));
  };
  let records = facilities.flatMap((facility) => read(facility.id).map((record) => ({ ...record, __facilityId: facility.id })));
  const filters = { facilityId: '', name: '', code: '' };
  let page = 1, mode = 'new', activeFacilityId = '', activeCode = '', parentCode = '', returnFocus = null, toastTimer;
  const icon = { add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>', edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>', close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>' };
  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-cc-add>${icon.add}Add Cost Center</button></div><div class="branches-filter-grid cost-center-filters"><label class="facility-filter"><span>Facility</span><select data-cc-filter="facilityId"><option value="">All facilities</option>${facilities.map((f) => `<option value="${esc(f.id)}">${esc(f.englishName)}</option>`).join('')}</select></label><label class="facility-filter"><span>Name</span><input type="search" data-cc-filter="name" placeholder="Search name"></label><label class="facility-filter"><span>Code</span><input type="search" data-cc-filter="code" placeholder="Search code"></label></div></div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table cost-center-table"><thead><tr><th>Facility</th><th>Name</th><th>Code</th><th>Is Pharmaceuticals</th><th>GL Code</th><th>Actions</th></tr></thead><tbody data-cc-rows></tbody></table></div><div class="facility-empty" data-cc-empty hidden>No cost centers match these filters.</div><footer class="facility-pagination"><span data-cc-count></span><div class="facility-page-controls"><button class="icon-button" data-cc-page="first" type="button" aria-label="First page">«</button><button class="icon-button" data-cc-page="previous" type="button" aria-label="Previous page">‹</button><span data-cc-page-label></span><button class="icon-button" data-cc-page="next" type="button" aria-label="Next page">›</button><button class="icon-button" data-cc-page="last" type="button" aria-label="Last page">»</button></div></footer></div>
    <div class="patient-modal-backdrop" data-cc-modal hidden><section class="patient-modal branch-modal" role="dialog" aria-modal="true" aria-labelledby="cc-title"><header class="patient-modal-header"><div><p class="eyebrow">COST CENTER RECORD</p><h2 id="cc-title">Add Cost Center</h2><p data-cc-description>Enter cost center information.</p></div><button class="icon-button" type="button" data-cc-close aria-label="Close dialog">${icon.close}</button></header><form data-cc-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">Cost Center Information</legend><div class="facility-form-section-heading">Cost Center Information</div><div class="patient-form-grid"><fieldset class="form-field cc-assignment" data-cc-assignment><legend>Facilities <b>*</b></legend><div class="cc-facility-checks">${facilities.map((f) => `<label><input type="checkbox" name="facilityIds" value="${esc(f.id)}"><span>${esc(f.englishName)}</span></label>`).join('')}</div></fieldset><div class="form-field cc-fixed-facility" data-cc-fixed hidden><span>Facility</span><strong data-cc-facility-name></strong></div><div class="form-field cc-parent-context" data-cc-parent-context hidden><span>Parent Cost Center</span><strong data-cc-parent-name></strong></div><label class="form-field"><span>Name <b>*</b></span><input name="name" required autocomplete="off"></label><label class="form-field"><span>Code <b>*</b></span><input name="code" required autocomplete="off"></label><label class="form-field cc-gl-field" data-cc-gl hidden><span>GL Code</span><input name="glCode" autocomplete="off"></label><label class="form-field form-field-checkbox"><input type="checkbox" name="pharmaceuticals"><span>Is Pharmaceuticals</span></label></div></fieldset></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-cc-cancel>Cancel</button><button type="submit" class="button button-primary" data-cc-save>Create</button></div></footer></form></section></div>`;
  const rows = grid.querySelector('[data-cc-rows]'), modal = grid.querySelector('[data-cc-modal]'), form = grid.querySelector('[data-cc-form]');
  function persist() { facilities.forEach((f) => { try { localStorage.setItem(key(f.id), JSON.stringify(records.filter((r) => r.__facilityId === f.id).map(({ __facilityId, ...r }) => r))); } catch { /* Continue with in-memory data. */ } }); }
  function notify(message) { const el = document.querySelector('[data-facility-toast]'); if (!el) return; el.textContent = message; el.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2800); }
  function filtered() { return records.filter((r) => (!filters.facilityId || r.__facilityId === filters.facilityId) && (!filters.name || String(r.name).toLowerCase().includes(filters.name)) && (!filters.code || String(r.code).toLowerCase().includes(filters.code))); }
  function render() {
    const matches = filtered();
    const groups = [];
    const parents = records.filter((r) => !r.parentCode && (!filters.facilityId || r.__facilityId === filters.facilityId));
    parents.forEach((parent) => {
      const children = records.filter((r) => r.parentCode === parent.code && r.__facilityId === parent.__facilityId && (!filters.facilityId || r.__facilityId === filters.facilityId));
      const parentMatches = matches.includes(parent), matchingChildren = children.filter((child) => matches.includes(child));
      if (parentMatches || matchingChildren.length) groups.push({ parent, children: parentMatches ? children : matchingChildren });
    });
    matches.filter((r) => r.parentCode && !records.some((p) => !p.parentCode && p.code === r.parentCode && p.__facilityId === r.__facilityId)).forEach((child) => groups.push({ parent: child, children: [], orphan: true }));
    const totalRecords = groups.reduce((total, group) => total + 1 + group.children.length, 0);
    const pageSize = 5, pages = Math.max(1, Math.ceil(groups.length / pageSize)); page = Math.min(page, pages);
    const shown = groups.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = shown.map(({ parent, children, orphan }) => [parent, ...children].map((r, index) => {
      const child = Boolean(r.parentCode);
      const parentText = child ? records.find((p) => p.__facilityId === r.__facilityId && p.code === r.parentCode)?.name || '' : '';
      const addButton = !child ? `<button class="icon-button period-action" type="button" data-cc-action="add-child" data-fid="${esc(r.__facilityId)}" data-code="${esc(r.code)}" aria-label="Add sub cost center under ${esc(r.name)}" title="Add sub cost center">${icon.add}</button>` : '';
      return `<tr class="${child ? 'cost-center-child-row' : 'cost-center-parent-row'}"><td>${esc(facilityName(r.__facilityId))}</td><td><span class="cost-center-name${child ? ' is-child' : ''}"${child ? ` title="Under ${esc(parentText)}"` : ''}>${esc(r.name)}${orphan ? ' (parent unavailable)' : ''}</span></td><td class="branch-code">${esc(r.code)}</td><td>${r.pharmaceuticals ? 'Yes' : 'No'}</td><td>${esc(r.glCode || '—')}</td><td><div class="cost-center-actions"><button class="icon-button period-action" type="button" data-cc-action="edit" data-fid="${esc(r.__facilityId)}" data-code="${esc(r.code)}" aria-label="Edit ${esc(r.name)}" title="Edit">${icon.edit}</button>${addButton}</div></td></tr>`;
    }).join('')).join('');
    grid.querySelector('[data-cc-empty]').hidden = totalRecords > 0;
    grid.querySelector('[data-cc-count]').textContent = `Total Results: ${totalRecords}`;
    grid.querySelector('[data-cc-page-label]').textContent = `Page ${totalRecords ? page : 0} of ${totalRecords ? pages : 0}`;
    grid.querySelectorAll('[data-cc-page]').forEach((b) => { b.disabled = !totalRecords || (['first', 'previous'].includes(b.dataset.ccPage) ? page === 1 : page === pages); });
  }
  function open(nextMode, record, trigger, parent) {
    mode = nextMode; activeFacilityId = record?.__facilityId || parent?.__facilityId || ''; activeCode = record?.code || ''; parentCode = parent?.code || record?.parentCode || ''; returnFocus = trigger; form.reset();
    const isChild = nextMode === 'child' || Boolean(record?.parentCode);
    grid.querySelector('[data-cc-title]').textContent = nextMode === 'edit' ? (isChild ? 'Edit Sub Cost Center' : 'Edit Cost Center') : isChild ? 'Add Sub Cost Center' : 'Add Cost Center';
    grid.querySelector('[data-cc-description]').textContent = nextMode === 'new' ? 'Create an independent cost center in each selected facility.' : isChild ? 'Manage the sub cost center for this facility.' : 'Update this facility cost center.';
    grid.querySelector('[data-cc-save]').textContent = nextMode === 'edit' ? 'Save changes' : 'Create';
    grid.querySelector('[data-cc-assignment]').hidden = nextMode !== 'new';
    grid.querySelector('[data-cc-fixed]').hidden = nextMode === 'new';
    grid.querySelector('[data-cc-facility-name]').textContent = facilityName(activeFacilityId);
    grid.querySelector('[data-cc-parent-context]').hidden = !isChild;
    grid.querySelector('[data-cc-parent-name]').textContent = parent?.name || records.find((r) => r.__facilityId === activeFacilityId && r.code === parentCode)?.name || '';
    grid.querySelector('[data-cc-gl]').hidden = !isChild;
    form.elements.name.value = record?.name || ''; form.elements.code.value = record?.code || ''; form.elements.glCode.value = record?.glCode || ''; form.elements.pharmaceuticals.checked = Boolean(record?.pharmaceuticals);
    modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-cc-close]').focus();
  }
  function close() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); returnFocus?.focus?.(); }
  grid.querySelector('[data-cc-add]').addEventListener('click', (e) => open('new', null, e.currentTarget));
  grid.querySelectorAll('[data-cc-filter]').forEach((field) => field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', () => { filters[field.dataset.ccFilter] = field.tagName === 'SELECT' ? field.value : field.value.trim().toLowerCase(); page = 1; render(); }));
  grid.querySelectorAll('[data-cc-page]').forEach((button) => button.addEventListener('click', () => { const matched = filtered(); const groupCount = records.filter((p) => !p.parentCode && (!filters.facilityId || p.__facilityId === filters.facilityId) && (matched.includes(p) || records.some((c) => c.parentCode === p.code && c.__facilityId === p.__facilityId && matched.includes(c)))).length; const n = Math.max(1, Math.ceil(groupCount / 5)); if (button.dataset.ccPage === 'first') page = 1; if (button.dataset.ccPage === 'previous') page = Math.max(1, page - 1); if (button.dataset.ccPage === 'next') page = Math.min(n, page + 1); if (button.dataset.ccPage === 'last') page = n; render(); }));
  rows.addEventListener('click', (e) => { const b = e.target.closest('[data-cc-action]'); if (!b) return; const rec = records.find((r) => r.__facilityId === b.dataset.fid && r.code === b.dataset.code); if (!rec) return; if (b.dataset.ccAction === 'edit') open('edit', rec, b); else if (b.dataset.ccAction === 'add-child') open('child', null, b, rec); });
  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (!form.reportValidity()) return;
    const data = { name: form.elements.name.value.trim(), code: form.elements.code.value.trim(), glCode: form.elements.glCode.value.trim(), pharmaceuticals: form.elements.pharmaceuticals.checked };
    if (mode === 'new') {
      const targets = [...form.querySelectorAll('[name="facilityIds"]:checked')].map((c) => c.value);
      if (!targets.length) { notify('Select at least one facility.'); return; }
      const created = [], skipped = [];
      targets.forEach((fid) => { if (records.some((r) => r.__facilityId === fid && r.code.toLowerCase() === data.code.toLowerCase())) { skipped.push(fid); return; } records.push({ ...data, parentCode: '', __facilityId: fid }); created.push(fid); });
      if (created.length) persist(); close(); page = 1; render();
      notify(`${created.length} created; ${skipped.length} skipped due to duplicate code${skipped.length === 1 ? '' : 's'}.${skipped.length ? ` Skipped: ${skipped.map(facilityName).join(', ')}.` : ''}`);
      return;
    }
    if (mode === 'child') {
      if (records.some((r) => r.__facilityId === activeFacilityId && r.code.toLowerCase() === data.code.toLowerCase())) { form.elements.code.setCustomValidity('This cost center code is already in use in this facility.'); form.reportValidity(); form.elements.code.setCustomValidity(''); return; }
      records.push({ ...data, parentCode, __facilityId: activeFacilityId });
      persist(); close(); render(); notify(`${data.name} was created successfully under ${facilityName(activeFacilityId)}.`); return;
    }
    const existing = records.find((r) => r.__facilityId === activeFacilityId && r.code === activeCode); if (!existing) return;
    if (records.some((r) => r.__facilityId === activeFacilityId && r.code.toLowerCase() === data.code.toLowerCase() && r !== existing)) { form.elements.code.setCustomValidity('This cost center code is already in use in this facility.'); form.reportValidity(); form.elements.code.setCustomValidity(''); return; }
    const oldCode = existing.code; Object.assign(existing, data);
    if (!existing.parentCode && oldCode !== data.code) records.filter((r) => r.__facilityId === activeFacilityId && r.parentCode === oldCode).forEach((r) => { r.parentCode = data.code; });
    persist(); close(); render(); notify(`${data.name} was updated successfully.`);
  });
  [grid.querySelector('[data-cc-close]'), grid.querySelector('[data-cc-cancel]')].forEach((b) => b.addEventListener('click', close)); modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  window.addEventListener('storage', (e) => { const facility = facilities.find((f) => key(f.id) === e.key); if (!facility || e.newValue === null) return; try { const next = JSON.parse(e.newValue); if (Array.isArray(next)) { records = records.filter((r) => r.__facilityId !== facility.id).concat(next.map((r) => ({ ...r, __facilityId: facility.id }))); render(); } } catch { /* Ignore malformed cross-tab updates. */ } });
  render();
})();
