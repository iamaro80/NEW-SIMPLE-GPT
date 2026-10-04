(() => {
  const grid = document.querySelector('[data-tpas-grid]');
  if (!grid) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const storageKey = `rcm-facility-tpas:v1:${facilityId}`;
  const providers = ['GlobeMed Saudi', 'Nextcare', 'Mednet', 'Totalcare', 'GFGq'];
  const countries = ['Saudi Arabia', 'Bahrain', 'Kuwait', 'United Arab Emirates'];
  const cities = ['Tabuk', 'Hail', 'Badr', 'Al Kharj', 'Ad Dilam', 'Al Marmuthah', 'Makkah', 'Riyadh', 'Dammam', 'Jeddah', 'At Taif', 'Buraidah', 'Al Hafuf', 'Madinah', 'Abha', 'Jazan', 'Al Khobar'];
  const districts = ['Al Olaya', 'Al Jumuah', 'Al Muruj', 'Al Aqrabiyah', 'Al Shifa', 'Al Kandarah', 'Al Malaz', 'Qurban', 'Al Faisaliyah', 'Al Thuqbah', 'Al Sharafiyah'];
  const seed = [
    { id: 'TPA-001', provider: providers[0], arabicName: 'جلوب ميد السعودية', englishName: 'GlobeMed Saudi Operations', unifiedNumber: '7004826153', crNumber: '1010842157', vatNumber: '310482615300003', chiNumber: 'CHI-TPA-2841', nhicNumber: 'NHIC-73041', country: 'Saudi Arabia', city: 'Riyadh', district: 'Al Olaya', buildingNumber: '2841', streetName: 'King Fahd Road', postalCode: '12214', additionalNumber: '6217', active: true },
    { id: 'TPA-002', provider: providers[1], arabicName: 'نكست كير', englishName: 'Nextcare Gulf Services', unifiedNumber: '7005937264', crNumber: '4030286195', vatNumber: '310593726400003', chiNumber: 'CHI-TPA-3916', nhicNumber: 'NHIC-84126', country: 'Saudi Arabia', city: 'Jeddah', district: 'Al Sharafiyah', buildingNumber: '3916', streetName: 'Madinah Road', postalCode: '21452', additionalNumber: '8031', active: true },
    { id: 'TPA-003', provider: providers[2], arabicName: 'ميدنت للخدمات الطبية', englishName: 'Mednet Saudi Arabia', unifiedNumber: '7006148392', crNumber: '2050164738', vatNumber: '310614839200003', chiNumber: 'CHI-TPA-4267', nhicNumber: 'NHIC-92538', country: 'Saudi Arabia', city: 'Dammam', district: 'Al Faisaliyah', buildingNumber: '4267', streetName: 'Prince Mohammed Street', postalCode: '32271', additionalNumber: '1594', active: true },
    { id: 'TPA-004', provider: providers[3], arabicName: 'توتال كير', englishName: 'Totalcare Network Management', unifiedNumber: '7007259418', crNumber: '1010973526', vatNumber: '310725941800003', chiNumber: 'CHI-TPA-5372', nhicNumber: 'NHIC-63817', country: 'Saudi Arabia', city: 'Makkah', district: 'Al Shifa', buildingNumber: '5372', streetName: 'Ibrahim Al Khalil Road', postalCode: '24231', additionalNumber: '4762', active: true },
    { id: 'TPA-005', provider: providers[4], arabicName: 'جي إف جي كيو', englishName: 'GFGq Claims Administration', unifiedNumber: '7008361529', crNumber: '2050248163', vatNumber: '310836152900003', chiNumber: 'CHI-TPA-6485', nhicNumber: 'NHIC-51964', country: 'Saudi Arabia', city: 'Al Khobar', district: 'Al Aqrabiyah', buildingNumber: '6485', streetName: 'Dhahran Street', postalCode: '34447', additionalNumber: '9143', active: true },
  ];
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const options = (values, prompt, selected = '') => `<option value="">${prompt}</option>${values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}`;
  const input = (name, label, type = 'text', required = false, extra = '') => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><input name="${name}" type="${type}"${required ? ' required' : ''} ${extra}></label>`;
  const select = (name, label, values, prompt, required = false, selected = '') => `<label class="form-field"><span>${label}${required ? ' <b>*</b>' : ''}</span><select name="${name}"${required ? ' required' : ''}>${options(values, prompt, selected)}</select></label>`;

  grid.innerHTML = `<div class="branches-toolbar">
    <div class="branches-add-row"><button class="button button-primary" type="button" data-tpa-add>${icons.add}Add TPA</button></div>
    <div class="branches-filter-grid tpa-filter-grid" role="search" aria-label="Filter TPAs">
      <label class="facility-filter"><span>TPA</span><select data-tpa-filter="provider">${options(providers, 'All TPAs')}</select></label>
      <label class="facility-filter"><span>NHIC Number</span><input type="search" data-tpa-filter="nhicNumber" placeholder="Search NHIC number"></label>
      <label class="facility-filter"><span>Unified Number</span><input type="search" data-tpa-filter="unifiedNumber" placeholder="Search unified number"></label>
      <label class="facility-filter"><span>English Name</span><input type="search" data-tpa-filter="englishName" placeholder="Search English name"></label>
      <label class="facility-filter"><span>Country</span><select data-tpa-filter="country">${options(countries, 'All countries')}</select></label>
      <label class="facility-filter"><span>City</span><select data-tpa-filter="city">${options(cities, 'All cities')}</select></label>
      <label class="facility-filter"><span>Status</span><select data-tpa-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div>
  </div>
  <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table tpa-table"><thead><tr><th>TPA</th><th>NHIC Number</th><th>Unified Number</th><th>English Name</th><th>Country</th><th>City</th><th>Status</th><th>Actions</th></tr></thead><tbody data-tpa-rows></tbody></table></div><div class="facility-empty" data-tpa-empty hidden>No TPAs match your filters.</div><footer class="facility-pagination"><span data-tpa-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-tpa-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-tpa-page="previous" aria-label="Previous page">‹</button><span data-tpa-page-label></span><button class="icon-button" type="button" data-tpa-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-tpa-page="last" aria-label="Last page">»</button></div></footer></div>`;

  const modal = document.querySelector('#tpa-modal');
  modal.innerHTML = `<section class="patient-modal tpa-modal" role="dialog" aria-modal="true" aria-labelledby="tpa-modal-title" aria-describedby="tpa-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">TPA RECORD</p><h2 id="tpa-modal-title">Add TPA</h2><p id="tpa-modal-description">Enter third party administrator information.</p></div><button type="button" class="icon-button" data-tpa-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><form data-tpa-form><div class="patient-modal-body">
    <fieldset class="patient-form-section"><legend class="sr-only">TPA Information</legend><div class="facility-form-section-heading">TPA Information</div><div class="patient-form-grid tpa-form-grid">
      ${select('provider', 'TPA', providers, 'Select TPA', true)}${input('arabicName', 'Arabic Name', 'text', false, 'dir="rtl"')}${input('englishName', 'English Name')}${input('unifiedNumber', 'Unified Number')}${input('crNumber', 'CR Number')}${input('vatNumber', 'VAT Number')}${input('chiNumber', 'CHI Number')}${input('nhicNumber', 'NHIC Number', 'text', true)}
    </div></fieldset>
    <fieldset class="patient-form-section"><legend class="sr-only">TPA Address</legend><div class="facility-form-section-heading">TPA Address</div><div class="patient-form-grid tpa-form-grid">
      ${select('country', 'Country', countries, 'Select country', true, 'Saudi Arabia')}${select('city', 'City', cities, 'Select city', true)}${select('district', 'District', districts, 'Select district', true)}${input('buildingNumber', 'Building Number')}${input('streetName', 'Street Name')}${input('postalCode', 'Postal Code')}${input('additionalNumber', 'Additional Number')}
    </div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-tpa-cancel>Cancel</button><button type="submit" class="button button-primary" data-tpa-save>Create</button></div></footer></form></section>`;

  const rows = grid.querySelector('[data-tpa-rows]');
  const form = modal.querySelector('[data-tpa-form]');
  const toast = document.querySelector('[data-facility-toast]');
  const pageSize = 5;
  let records = load();
  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let returnFocus = null;
  let toastTimer;

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep this page usable if browser storage is unavailable. */ }
    return JSON.parse(JSON.stringify(seed));
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Changes remain available for this page session. */ }
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300);
  }
  function filtered() {
    return records.filter((record) => Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'status') return (record.active ? 'active' : 'inactive') === value;
      return String(record[key] || '').toLocaleLowerCase().includes(value.toLocaleLowerCase());
    }));
  }
  function closeMenus(except) {
    rows.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) {
        menu.hidden = true;
        menu.parentElement.querySelector('[data-tpa-row-menu]').setAttribute('aria-expanded', 'false');
      }
    });
  }
  function render() {
    const matches = filtered();
    const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, totalPages);
    const visible = matches.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((record) => `<tr>
      <td><span class="facility-name-en">${escapeHtml(record.provider)}</span></td><td>${escapeHtml(record.nhicNumber || '—')}</td><td>${escapeHtml(record.unifiedNumber || '—')}</td><td><span class="facility-name-en">${escapeHtml(record.englishName || '—')}</span></td><td>${escapeHtml(record.country || '—')}</td><td>${escapeHtml(record.city || '—')}</td>
      <td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td>
      <td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-tpa-row-menu aria-label="Actions for ${escapeHtml(record.provider)}" aria-haspopup="menu" aria-expanded="false" data-id="${escapeHtml(record.id)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-tpa-action="view" data-id="${escapeHtml(record.id)}">${icons.eye}View</button><button type="button" role="menuitem" data-tpa-action="edit" data-id="${escapeHtml(record.id)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-tpa-action="toggle-status" data-id="${escapeHtml(record.id)}">${icons.status}${record.active ? 'Deactivate' : 'Activate'}</button></div></div></td>
    </tr>`).join('');
    grid.querySelector('[data-tpa-empty]').hidden = matches.length > 0;
    grid.querySelector('[data-tpa-count]').textContent = `Total Results: ${matches.length}`;
    grid.querySelector('[data-tpa-page-label]').textContent = `Page ${matches.length ? page : 0} of ${matches.length ? totalPages : 0}`;
    grid.querySelectorAll('[data-tpa-page]').forEach((button) => {
      button.disabled = matches.length === 0 || (['first', 'previous'].includes(button.dataset.tpaPage) ? page === 1 : page === totalPages);
    });
  }
  function nextId() {
    const next = Math.max(0, ...records.map((record) => Number(String(record.id).match(/(\d+)$/)?.[1]) || 0)) + 1;
    return `TPA-${String(next).padStart(3, '0')}`;
  }
  function setReadOnly(readOnly) {
    form.querySelectorAll('input, select, textarea').forEach((field) => { field.disabled = readOnly; });
    modal.querySelector('[data-tpa-save]').hidden = readOnly;
    modal.querySelector('[data-tpa-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }
  function openModal(nextMode, record = null, trigger = document.activeElement) {
    mode = nextMode;
    activeId = record?.id || null;
    returnFocus = trigger;
    form.reset();
    setReadOnly(false);
    const isNew = nextMode === 'new';
    modal.querySelector('#tpa-modal-title').textContent = isNew ? 'Add TPA' : nextMode === 'view' ? 'TPA Details' : 'Edit TPA';
    modal.querySelector('#tpa-modal-description').textContent = isNew ? 'Enter third party administrator information.' : nextMode === 'view' ? 'Review third party administrator details.' : 'Update third party administrator information.';
    modal.querySelector('[data-tpa-save]').textContent = isNew ? 'Create' : 'Save changes';
    const values = isNew ? { country: 'Saudi Arabia' } : record;
    Object.keys(values || {}).forEach((name) => {
      const field = form.elements.namedItem(name);
      if (field && field.type !== 'checkbox') field.value = values[name] ?? '';
    });
    if (nextMode === 'view') setReadOnly(true);
    modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    modal.querySelector('[data-tpa-close]').focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  grid.querySelectorAll('[data-tpa-filter]').forEach((field) => field.addEventListener('input', applyFilters));
  grid.querySelectorAll('[data-tpa-filter]').forEach((field) => field.addEventListener('change', applyFilters));
  function applyFilters() {
    filters = Object.fromEntries([...grid.querySelectorAll('[data-tpa-filter]')].map((field) => [field.dataset.tpaFilter, field.value.trim()]));
    page = 1;
    render();
  }

  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-tpa-row-menu]');
    if (trigger) {
      const menu = trigger.nextElementSibling;
      const willOpen = menu.hidden;
      closeMenus(menu);
      menu.hidden = !willOpen;
      trigger.setAttribute('aria-expanded', String(willOpen));
      return;
    }
    const action = event.target.closest('[data-tpa-action]');
    if (action) {
      const record = records.find((item) => item.id === action.dataset.id);
      if (!record) return;
      closeMenus();
      if (action.dataset.tpaAction === 'toggle-status') {
        record.active = !record.active;
        persist(); render();
        showToast(`${record.provider} was ${record.active ? 'activated' : 'deactivated'}.`);
      } else openModal(action.dataset.tpaAction, record, grid.querySelector(`[data-tpa-row-menu][data-id="${CSS.escape(record.id)}"]`));
      return;
    }
    if (!event.target.closest('.facility-row-action')) closeMenus();
  });
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tpa-page]');
    if (!button) return;
    const totalPages = Math.max(1, Math.ceil(filtered().length / pageSize));
    if (button.dataset.tpaPage === 'first') page = 1;
    if (button.dataset.tpaPage === 'previous') page = Math.max(1, page - 1);
    if (button.dataset.tpaPage === 'next') page = Math.min(totalPages, page + 1);
    if (button.dataset.tpaPage === 'last') page = totalPages;
    render();
  });
  grid.querySelector('[data-tpa-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  modal.querySelector('[data-tpa-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-tpa-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(['provider', 'arabicName', 'englishName', 'unifiedNumber', 'crNumber', 'vatNumber', 'chiNumber', 'nhicNumber', 'country', 'city', 'district', 'buildingNumber', 'streetName', 'postalCode', 'additionalNumber'].map((key) => [key, String(form.elements.namedItem(key).value || '').trim()]));
    if (mode === 'new') {
      const record = { ...values, id: nextId(), active: true };
      records.push(record);
      persist();
      grid.querySelectorAll('[data-tpa-filter]').forEach((field) => { field.value = ''; });
      filters = {};
      page = Math.ceil(records.length / pageSize);
      closeModal(); render();
      showToast(`${record.provider} was created successfully.`);
    } else {
      const record = records.find((item) => item.id === activeId);
      if (!record) return;
      Object.assign(record, values);
      persist(); closeModal(); render();
      showToast(`${record.provider} was updated successfully.`);
    }
  });
  render();
})();
