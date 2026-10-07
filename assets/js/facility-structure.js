(() => {
  const workspace = document.querySelector('[data-structure-workspace]');
  if (!workspace) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const departmentKey = `rcm-facility-departments:v1:${facilityId}`;
  const pageSize = 5;
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
  };
  const choices = {
    locationType: [
      ['Clinical Zone', 'Clinical Zone (منطقة إكلينيكية)'], ['Diagnostic Area', 'Diagnostic Area (منطقة تشخيصية)'], ['Public Space', 'Public Space (مساحة عامة)'],
    ],
    floorNumber: [
      ['Basement', 'Basement (البدروم)'], ['Ground Floor', 'Ground Floor (الطابق الأرضي)'], ['Floor 1', 'Floor 1 (الطابق الأول)'],
    ],
    locationStatus: [
      ['Operational', 'Operational (قيد التشغيل)'], ['Under Maintenance', 'Under Maintenance (تحت الصيانة)'], ['Closed', 'Closed (مغلق)'],
    ],
    classification: [
      ['Clinical / Sterile', 'Clinical / Sterile (إكلينيكي / معقم)'], ['Clinical / Non-Sterile', 'Clinical / Non-Sterile (إكلينيكي / غير معقم)'], ['Administrative Office', 'Administrative Office (مكتب إداري)'],
    ],
    roomStatus: [
      ['Available', 'Available (متاح)'], ['Occupied', 'Occupied (مشغول)'], ['Reserved', 'Reserved (محجوز)'], ['Decommissioned', 'Decommissioned (خارج الخدمة)'],
    ],
  };
  const configurations = [
    {
      route: 'locations', plural: 'Locations', singular: 'Location', prefix: 'LOC', storage: `rcm-facility-locations:v1:${facilityId}`,
      fields: [
        { key: 'code', label: 'Location Code', kind: 'code', required: true },
        { key: 'nameEn', label: 'Location Name (EN)', kind: 'text', required: true },
        { key: 'nameAr', label: 'Location Name (AR)', kind: 'text', required: true, rtl: true },
        { key: 'locationType', label: 'Location Type', kind: 'choice', required: true, choices: choices.locationType },
        { key: 'floorNumber', label: 'Floor Number', kind: 'choice', required: true, choices: choices.floorNumber },
        { key: 'status', label: 'Status', kind: 'choice', required: true, choices: choices.locationStatus, default: 'Operational' },
      ],
      columns: [
        ['code', 'Location Code'], ['nameEn', 'Location Name (EN)'], ['nameAr', 'Location Name (AR)'], ['locationType', 'Location Type'], ['floorNumber', 'Floor Number'], ['status', 'Status'],
      ],
      filterKeys: ['code', 'nameEn', 'nameAr', 'locationType', 'floorNumber', 'status'],
      seed: [
        { nameEn: 'Location 1', nameAr: 'منطقة الطوارئ - الطابق الأرضي', locationType: 'Clinical Zone', floorNumber: 'Ground Floor', status: 'Operational' },
        { nameEn: 'Location 2', nameAr: 'الجناح الغربي للعيادات', locationType: 'Clinical Zone', floorNumber: 'Floor 1', status: 'Operational' },
        { nameEn: 'Location 3', nameAr: 'جناح التشخيص المركزي', locationType: 'Diagnostic Area', floorNumber: 'Floor 1', status: 'Operational' },
        { nameEn: 'Location 4', nameAr: 'صالة الاستقبال الرئيسية', locationType: 'Public Space', floorNumber: 'Ground Floor', status: 'Operational' },
        { nameEn: 'Location 5', nameAr: 'التصوير في الطابق السفلي', locationType: 'Diagnostic Area', floorNumber: 'Basement', status: 'Under Maintenance' },
        { nameEn: 'Location 6', nameAr: 'منطقة تسجيل العيادات الخارجية', locationType: 'Clinical Zone', floorNumber: 'Ground Floor', status: 'Operational' },
      ],
    },
    {
      route: 'rooms', plural: 'Rooms', singular: 'Room', prefix: 'RM', storage: `rcm-facility-rooms:v1:${facilityId}`,
      fields: [
        { key: 'code', label: 'Room Number / Code', kind: 'code', required: true },
        { key: 'nameEn', label: 'Room Name (EN)', kind: 'text', required: true },
        { key: 'nameAr', label: 'Room Name (AR)', kind: 'text', required: true, rtl: true },
        { key: 'parentLocation', label: 'Parent Location', kind: 'relation', required: true, relation: 'locations' },
        { key: 'classification', label: 'Room Classification', kind: 'choice', required: true, choices: choices.classification },
        { key: 'status', label: 'Availability Status', kind: 'choice', required: true, choices: choices.roomStatus, default: 'Available' },
      ],
      columns: [
        ['code', 'Room Number / Code'], ['nameEn', 'Room Name (EN)'], ['nameAr', 'Room Name (AR)'], ['parentLocation', 'Parent Location'], ['classification', 'Room Classification'], ['status', 'Availability Status'],
      ],
      filterKeys: ['code', 'nameEn', 'nameAr', 'parentLocation', 'classification', 'status'],
      seed: [
        { code: 'RM-001', nameEn: 'Room 1', nameAr: 'غرفة تقييم الطوارئ', parentLocation: 'LOC-001', classification: 'Clinical / Non-Sterile', status: 'Available' },
        { code: 'RM-002', nameEn: 'Room 2', nameAr: 'غرفة علاج الطوارئ', parentLocation: 'LOC-001', classification: 'Clinical / Sterile', status: 'Occupied' },
        { code: 'RM-003', nameEn: 'Room 3', nameAr: 'غرفة طب الأسرة ١', parentLocation: 'LOC-002', classification: 'Clinical / Non-Sterile', status: 'Available' },
        { code: 'RM-004', nameEn: 'Room 4', nameAr: 'غرفة طب الأسرة ٢', parentLocation: 'LOC-002', classification: 'Clinical / Non-Sterile', status: 'Reserved' },
        { code: 'RM-005', nameEn: 'Room 5', nameAr: 'غرفة الاستشارة التشخيصية', parentLocation: 'LOC-003', classification: 'Clinical / Non-Sterile', status: 'Available' },
        { code: 'RM-006', nameEn: 'Room 6', nameAr: 'مكتب العمليات', parentLocation: 'LOC-004', classification: 'Administrative Office', status: 'Available' },
      ],
    },
  ];

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const instances = new Map();

  function readStored(key, fallback, route) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback.map((item) => ({ ...item }));
      }
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return fallback.map((item) => ({ ...item }));
      if (route !== 'rooms') return parsed;
      const legacyCodes = new Set(['RM-101', 'RM-102', 'RM-201', 'RM-202', 'RM-310', 'RM-401']);
      let migrated = false;
      const records = parsed.map((record) => {
        const seedRecord = fallback.find((item) => item.nameEn === record.nameEn);
        if (!legacyCodes.has(record.code) || !seedRecord) return record;
        migrated = true;
        return { ...record, code: seedRecord.code };
      });
      if (migrated) localStorage.setItem(key, JSON.stringify(records));
      return records;
    } catch { return fallback.map((item) => ({ ...item })); }
  }

  function recordsForRelation(relation) {
    if (relation === 'departments') return readStored(departmentKey, []).map((item) => ({ code: item.code, name: item.name }));
    const config = configurations.find((item) => item.route === relation);
    const state = config && instances.get(config.route);
    return state ? state.records.map((item) => ({ code: item.code, name: item.nameEn })) : [];
  }

  function relationName(relation, code) {
    if (!code) return '';
    return recordsForRelation(relation).find((item) => item.code === code)?.name || code;
  }

  function renderChoiceOptions(field, selected = '') {
    const items = field.kind === 'choice'
      ? field.choices
      : recordsForRelation(field.relation).map((item) => [item.code, item.name]);
    const placeholder = field.required ? `Select ${field.label.toLowerCase()}` : 'None';
    return `<option value="">${escapeHtml(placeholder)}</option>${items.map(([value, label]) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}`;
  }

  function fieldControl(config, field, filter = false) {
    const required = !filter && field.required ? ' required' : '';
    const direction = field.rtl ? ' dir="rtl"' : '';
    if (filter && (field.kind === 'text' || field.kind === 'code')) {
      return `<input type="search" data-filter="${field.key}"${direction} placeholder="Search ${escapeHtml(field.label.toLowerCase())}">`;
    }
    if (filter && (field.kind === 'choice' || field.kind === 'relation')) {
      const label = field.label.toLocaleLowerCase();
      const allLabel = label.endsWith('status') ? `All ${label.slice(0, -6)}statuses` : `All ${label}s`;
      return `<select data-filter="${field.key}"><option value="">${escapeHtml(allLabel)}</option>${renderChoiceOptions({ ...field, required: false }).replace(/^<option[^>]*>[^<]*<\/option>/, '')}</select>`;
    }
    if (field.kind === 'choice' || field.kind === 'relation') {
      return `<select name="${field.key}"${required} data-related="${field.relation || ''}">${renderChoiceOptions(field)}</select>`;
    }
    const readOnly = field.kind === 'code' ? ' readonly aria-describedby="code-help"' : '';
    const help = field.kind === 'code' ? '<small id="code-help">Generated automatically.</small>' : '';
    return `<input name="${field.key}"${required}${readOnly}${direction} autocomplete="off">${help}`;
  }

  function buildPage(config) {
    const fieldsByKey = Object.fromEntries(config.fields.map((field) => [field.key, field]));
    const filters = config.filterKeys.map((key) => {
      const field = fieldsByKey[key];
      return `<label class="facility-filter"><span>${escapeHtml(field.label)}</span>${fieldControl(config, field, true)}</label>`;
    }).join('');
    const columns = config.columns.map(([, label]) => `<th scope="col">${escapeHtml(label)}</th>`).join('');
    const formFields = config.fields.map((field) => `<label class="form-field"><span>${escapeHtml(field.label)}${field.required ? ' <b>*</b>' : ''}</span>${fieldControl(config, field)}</label>`).join('');
    return `<section class="facility-grid structure-page" data-structure-page="${config.route}" aria-label="${config.plural}" hidden>
      <div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-add>${icons.add}Add ${config.singular}</button></div><div class="branches-filter-grid structure-filter-grid" role="search" aria-label="Filter ${config.plural.toLowerCase()}">${filters}</div></div>
      <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table structure-table"><thead><tr>${columns}<th scope="col">Actions</th></tr></thead><tbody data-rows></tbody></table></div>
      <div class="facility-empty" data-empty hidden>No ${config.plural.toLowerCase()} match your filters.</div><footer class="facility-pagination"><span data-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-page="previous" aria-label="Previous page">‹</button><span data-page-label></span><button class="icon-button" type="button" data-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-page="last" aria-label="Last page">»</button></div></footer></div>
      <div class="patient-modal-backdrop" data-modal hidden><section class="patient-modal branch-modal structure-modal" role="dialog" aria-modal="true" aria-labelledby="${config.route}-modal-title" aria-describedby="${config.route}-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">${config.singular.toUpperCase()} RECORD</p><h2 id="${config.route}-modal-title">Add ${config.singular}</h2><p id="${config.route}-modal-description">Enter the ${config.singular.toLowerCase()} details.</p></div><button type="button" class="icon-button" data-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
      <form data-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">${config.singular} Setup</legend><div class="facility-form-section-heading">${config.singular} Setup</div><div class="patient-form-grid">${formFields}</div></fieldset></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-cancel>Cancel</button><button type="submit" class="button button-primary" data-save>Create</button></div></footer></form></section></div>
    </section>`;
  }

  configurations.forEach((config) => {
    workspace.insertAdjacentHTML('beforeend', buildPage(config));
    const seedRecords = config.seed.map((record, index) => ({
      code: record.code || `${config.prefix}-${String(index + 1).padStart(3, '0')}`,
      ...record,
    }));
    instances.set(config.route, {
      config,
      root: workspace.querySelector(`[data-structure-page="${config.route}"]`),
      records: readStored(config.storage, seedRecords, config.route),
      page: 1,
      mode: 'new',
      activeCode: null,
      returnFocus: null,
      toastTimer: null,
      filters: {},
    });
  });
  const sharedToast = document.querySelector('[data-facility-toast]');

  function refreshRelations() {
    workspace.querySelectorAll('select[data-related]').forEach((select) => {
      const relation = select.dataset.related;
      if (!relation) return;
      const field = instances.get(select.closest('[data-structure-page]').dataset.structurePage).config.fields.find((item) => item.key === select.name);
      const value = select.value;
      select.innerHTML = renderChoiceOptions(field, value);
      select.value = value;
    });
    for (const state of instances.values()) render(state);
  }

  function persist(state) {
    try { localStorage.setItem(state.config.storage, JSON.stringify(state.records)); } catch { /* Keep in-memory prototype state if storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent('rcm:facility-structure-changed', { detail: { facilityId, route: state.config.route, records: state.records } }));
    refreshRelations();
  }

  function showToast(message) {
    sharedToast.textContent = message;
    sharedToast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => sharedToast.classList.remove('is-visible'), 2300);
  }

  function displayValue(state, key, value) {
    if (key === 'parentDepartment') return relationName('departments', value);
    if (key === 'parentLocation') return relationName('locations', value);
    return value || '—';
  }

  function closeMenus(state, except) {
    state.root.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) {
        menu.hidden = true;
        menu.parentElement.querySelector('[data-row-menu]').setAttribute('aria-expanded', 'false');
      }
    });
  }

  function filtered(state) {
    return state.records.filter((record) => state.config.filterKeys.every((key) => {
      const query = state.filters[key] || '';
      if (!query) return true;
      const rawValue = String(record[key] || '').toLocaleLowerCase();
      const value = displayValue(state, key, record[key]);
      return rawValue.includes(query) || String(value).toLocaleLowerCase().includes(query);
    }));
  }

  function render(state) {
    const matching = filtered(state);
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    state.page = Math.min(state.page, totalPages);
    const visible = matching.slice((state.page - 1) * pageSize, state.page * pageSize);
    state.root.querySelector('[data-rows]').innerHTML = visible.map((record) => `<tr>${state.config.columns.map(([key]) => {
      const value = displayValue(state, key, record[key]);
      if (key === 'code') return `<td class="branch-code">${escapeHtml(value)}</td>`;
      if (key === 'nameEn') return `<td><span class="facility-name-en">${escapeHtml(value)}</span></td>`;
      if (key === 'nameAr') return `<td><span class="branch-arabic-name" lang="ar" dir="rtl">${escapeHtml(value)}</span></td>`;
      if (key === 'status') {
        const good = ['Active', 'Operational', 'Available'].includes(value);
        return `<td><span class="facility-status ${good ? 'is-active' : 'is-inactive'}"><span></span>${escapeHtml(value)}</span></td>`;
      }
      return `<td>${escapeHtml(value)}</td>`;
    }).join('')}<td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-row-menu data-code="${escapeHtml(record.code)}" aria-label="Actions for ${escapeHtml(record.nameEn)}" aria-haspopup="menu" aria-expanded="false">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-action="view" data-code="${escapeHtml(record.code)}">${icons.eye}View</button><button type="button" role="menuitem" data-action="edit" data-code="${escapeHtml(record.code)}">${icons.edit}Edit</button></div></div></td></tr>`).join('');
    state.root.querySelector('[data-empty]').hidden = matching.length > 0;
    state.root.querySelector('[data-count]').textContent = `Total Results: ${matching.length}`;
    state.root.querySelector('[data-page-label]').textContent = `Page ${matching.length ? state.page : 0} of ${matching.length ? totalPages : 0}`;
    state.root.querySelectorAll('[data-page]').forEach((button) => {
      button.disabled = matching.length === 0 || (['first', 'previous'].includes(button.dataset.page) ? state.page === 1 : state.page === totalPages);
    });
  }

  function nextCode(state) {
    const next = Math.max(0, ...state.records.map((record) => Number(String(record.code).match(/(\d+)$/)?.[1]) || 0)) + 1;
    return `${state.config.prefix}-${String(next).padStart(3, '0')}`;
  }

  function setReadOnly(state, readOnly) {
    state.config.fields.filter((field) => field.kind !== 'code').forEach((field) => { state.form.elements.namedItem(field.key).disabled = readOnly; });
    state.save.hidden = readOnly;
    state.root.querySelector('[data-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }

  function openModal(state, mode, record = null, trigger = document.activeElement) {
    state.mode = mode;
    state.activeCode = record?.code || null;
    state.returnFocus = trigger;
    refreshRelationOptions(state);
    state.form.reset();
    setReadOnly(state, false);
    const isNew = mode === 'new';
    state.title.textContent = isNew ? `Add ${state.config.singular}` : mode === 'view' ? `${state.config.singular} Details` : `Edit ${state.config.singular}`;
    state.description.textContent = isNew ? `Enter the ${state.config.singular.toLowerCase()} details.` : mode === 'view' ? `Review ${state.config.singular.toLowerCase()} details.` : `Update the ${state.config.singular.toLowerCase()} details.`;
    state.save.textContent = isNew ? 'Create' : 'Save changes';
    const values = isNew ? { code: nextCode(state) } : record;
    state.config.fields.forEach((field) => {
      const control = state.form.elements.namedItem(field.key);
      control.value = values?.[field.key] ?? field.default ?? '';
    });
    if (mode === 'view') setReadOnly(state, true);
    state.modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    state.root.querySelector('[data-close]').focus();
  }

  function refreshRelationOptions(currentState) {
    currentState.config.fields.filter((field) => field.kind === 'relation').forEach((field) => {
      const control = currentState.form.elements.namedItem(field.key);
      const value = control.value;
      control.innerHTML = renderChoiceOptions(field, value);
      control.value = value;
    });
  }

  function closeModal(state) {
    state.modal.hidden = true;
    if (![...instances.values()].some((item) => !item.modal.hidden)) document.body.classList.remove('patient-modal-open');
    if (state.returnFocus?.isConnected) state.returnFocus.focus();
  }

  function setup(state) {
    state.rows = state.root.querySelector('[data-rows]');
    state.modal = state.root.querySelector('[data-modal]');
    state.form = state.root.querySelector('[data-form]');
    state.title = state.root.querySelector('[id$="-modal-title"]');
    state.description = state.root.querySelector('[id$="-modal-description"]');
    state.save = state.root.querySelector('[data-save]');
    state.root.querySelector('[data-add]').addEventListener('click', (event) => openModal(state, 'new', null, event.currentTarget));
    state.root.querySelectorAll('[data-filter]').forEach((field) => field.addEventListener(field.matches('select') ? 'change' : 'input', () => {
      state.filters[field.dataset.filter] = field.value.trim().toLocaleLowerCase();
      state.page = 1;
      closeMenus(state);
      render(state);
    }));
    state.root.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => {
      const total = Math.max(1, Math.ceil(filtered(state).length / pageSize));
      if (button.dataset.page === 'first') state.page = 1;
      if (button.dataset.page === 'previous') state.page = Math.max(1, state.page - 1);
      if (button.dataset.page === 'next') state.page = Math.min(total, state.page + 1);
      if (button.dataset.page === 'last') state.page = total;
      closeMenus(state);
      render(state);
    }));
    state.rows.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-row-menu]');
      if (trigger) {
        const menu = trigger.parentElement.querySelector('.facility-row-menu');
        const opening = menu.hidden;
        closeMenus(state, menu);
        menu.hidden = !opening;
        trigger.setAttribute('aria-expanded', String(opening));
        return;
      }
      const action = event.target.closest('[data-action]');
      if (!action) {
        if (!event.target.closest('.facility-row-action')) closeMenus(state);
        return;
      }
      const record = state.records.find((item) => item.code === action.dataset.code);
      if (!record) return;
      const rowTrigger = action.closest('.facility-row-action').querySelector('[data-row-menu]');
      closeMenus(state);
      openModal(state, action.dataset.action, record, rowTrigger);
    });
    state.form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!state.form.reportValidity()) return;
      const record = Object.fromEntries(state.config.fields.map((field) => [field.key, String(state.form.elements.namedItem(field.key).value || '').trim()]));
      if (state.mode === 'new') {
        state.records.push(record);
        state.filters = {};
        state.root.querySelectorAll('[data-filter]').forEach((field) => { field.value = ''; });
        state.page = Math.ceil(state.records.length / pageSize);
      } else {
        const existing = state.records.find((item) => item.code === state.activeCode);
        if (!existing) return;
        Object.assign(existing, record);
      }
      persist(state);
      closeModal(state);
      render(state);
      const savedName = state.config.route === 'rooms' ? record.code : record.nameEn;
      showToast(`${savedName} was ${state.mode === 'new' ? 'created' : 'updated'} successfully.`);
    });
    state.root.querySelector('[data-close]').addEventListener('click', () => closeModal(state));
    state.root.querySelector('[data-cancel]').addEventListener('click', () => closeModal(state));
    state.modal.addEventListener('click', (event) => { if (event.target === state.modal) closeModal(state); });
    state.filters = Object.fromEntries([...state.root.querySelectorAll('[data-filter]')].map((field) => [field.dataset.filter, field.value.trim().toLocaleLowerCase()]));
    render(state);
  }

  configurations.forEach((config) => setup(instances.get(config.route)));

  function updateRoute() {
    const route = decodeURIComponent(location.hash.slice(1));
    configurations.forEach((config) => {
      const state = instances.get(config.route);
      state.root.hidden = route !== config.route;
      if (route === config.route) render(state);
    });
  }
  updateRoute();
  window.addEventListener('hashchange', updateRoute);

  document.addEventListener('click', (event) => {
    if (event.target.closest('.facility-row-action')) return;
    instances.forEach((state) => closeMenus(state));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const open = [...instances.values()].find((state) => !state.modal.hidden);
      if (open) closeModal(open);
      else instances.forEach((state) => closeMenus(state));
      return;
    }
    const state = [...instances.values()].find((item) => !item.modal.hidden);
    if (!state || event.key !== 'Tab') return;
    const focusable = [...state.modal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled), select:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('rcm:departments-changed', refreshRelations);
  window.addEventListener('rcm:facility-structure-changed', (event) => {
    const state = instances.get(event.detail?.route);
    if (state && event.detail.facilityId === facilityId && Array.isArray(event.detail.records)) {
      state.records = event.detail.records;
      refreshRelations();
    }
  });
  window.addEventListener('storage', (event) => {
    if (!event.key) return;
    if (event.key === departmentKey) { refreshRelations(); return; }
    const state = [...instances.values()].find((item) => item.config.storage === event.key);
    if (!state || !event.newValue) return;
    try {
      const records = JSON.parse(event.newValue);
      if (Array.isArray(records)) { state.records = records; refreshRelations(); }
    } catch { /* Ignore invalid external updates. */ }
  });
})();
