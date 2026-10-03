(() => {
  const grid = document.querySelector('[data-branches-grid]');
  if (!grid) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-branches:v1:${facilityId}`;
  const seed = [
    ['test', 'B'], ['1111', '111'], ['Mazen11111', 'DMw11111'], ['Mazen11', 'DMw11'],
    ['Mazen', 'DMw'], ['mazentestttttt', 'we'], ['Centeral Clinic', 'CC'],
  ].map(([englishName, prefix], index) => ({
    code: String(index + 1), englishName, arabicName: '', prefix, active: true,
  }));

  const rows = grid.querySelector('[data-branch-rows]');
  const empty = grid.querySelector('[data-branch-empty]');
  const resultCount = grid.querySelector('[data-branch-result-count]');
  const pageLabel = grid.querySelector('[data-branch-page-label]');
  const modal = document.querySelector('#branch-modal');
  const form = document.querySelector('#branch-form');
  const modalTitle = document.querySelector('#branch-modal-title');
  const modalDescription = document.querySelector('#branch-modal-description');
  const saveButton = document.querySelector('[data-branch-save]');
  const toast = document.querySelector('[data-facility-toast]');
  const pageSize = 5;
  let page = 1;
  let mode = 'new';
  let activeCode = null;
  let returnFocus = null;
  let toastTimer;
  let appliedFilters = {};
  let branches = load();

  const icons = {
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } else {
        localStorage.setItem(storageKey, JSON.stringify(seed));
      }
    } catch { /* Keep the prototype usable if browser storage is unavailable. */ }
    return seed.map((branch) => ({ ...branch }));
  }

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(branches)); } catch { /* Session state remains available in memory. */ }
    window.dispatchEvent(new CustomEvent('rcm:branches-changed', { detail: { facilityId, branches } }));
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300);
  }

  function readFilters() {
    return Object.fromEntries([...grid.querySelectorAll('[data-branch-filter]')].map((field) => [
      field.dataset.branchFilter,
      field.value.trim().toLocaleLowerCase(),
    ]));
  }

  function filteredBranches() {
    return branches.filter((branch) => {
      for (const key of ['code', 'englishName', 'arabicName', 'prefix']) {
        if (appliedFilters[key] && !String(branch[key] || '').toLocaleLowerCase().includes(appliedFilters[key])) return false;
      }
      if (appliedFilters.status && (branch.active ? 'active' : 'inactive') !== appliedFilters.status) return false;
      return true;
    });
  }

  function closeMenus(except) {
    rows.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) {
        menu.hidden = true;
        menu.parentElement.querySelector('[data-branch-row-menu]').setAttribute('aria-expanded', 'false');
      }
    });
  }

  function render() {
    const matching = filteredBranches();
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(page, totalPages);
    const start = (page - 1) * pageSize;
    const visible = matching.slice(start, start + pageSize);
    rows.innerHTML = visible.map((branch) => `<tr>
      <td class="branch-code">${escapeHtml(branch.code)}</td>
      <td><span class="facility-name-en">${escapeHtml(branch.englishName)}</span></td>
      <td><span class="branch-arabic-name" lang="ar" dir="rtl">${escapeHtml(branch.arabicName || '—')}</span></td>
      <td>${escapeHtml(branch.prefix || '—')}</td>
      <td><span class="facility-status ${branch.active ? 'is-active' : 'is-inactive'}"><span></span>${branch.active ? 'Active' : 'Inactive'}</span></td>
      <td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-branch-row-menu aria-label="Actions for ${escapeHtml(branch.englishName)}" aria-haspopup="menu" aria-expanded="false" data-code="${escapeHtml(branch.code)}">${icons.more}</button>
        <div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-branch-action="view" data-code="${escapeHtml(branch.code)}">${icons.eye}View</button><button type="button" role="menuitem" data-branch-action="edit" data-code="${escapeHtml(branch.code)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-branch-action="toggle-status" data-code="${escapeHtml(branch.code)}">${icons.status}${branch.active ? 'Deactivate' : 'Activate'}</button></div></div></td>
    </tr>`).join('');
    empty.hidden = matching.length > 0;
    resultCount.textContent = `Total Results: ${matching.length}`;
    pageLabel.textContent = `Page ${matching.length ? page : 0} of ${matching.length ? totalPages : 0}`;
    grid.querySelectorAll('[data-branch-page]').forEach((button) => {
      button.disabled = matching.length === 0 || (['first', 'previous'].includes(button.dataset.branchPage) ? page === 1 : page === totalPages);
    });
  }

  function nextCode() {
    return String(Math.max(0, ...branches.map((branch) => Number(branch.code) || 0)) + 1);
  }

  function setReadOnly(readOnly) {
    form.elements.namedItem('englishName').disabled = readOnly;
    form.elements.namedItem('arabicName').disabled = readOnly;
    form.elements.namedItem('prefix').disabled = readOnly;
    saveButton.hidden = readOnly;
    modal.querySelector('[data-branch-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }

  function openModal(nextMode, branch = null, trigger = document.activeElement) {
    mode = nextMode;
    activeCode = branch?.code ?? null;
    returnFocus = trigger;
    form.reset();
    setReadOnly(false);
    const isNew = nextMode === 'new';
    modalTitle.textContent = isNew ? 'Add Branch' : nextMode === 'view' ? 'Branch Details' : 'Edit Branch';
    modalDescription.textContent = isNew ? 'Enter the branch details.' : nextMode === 'view' ? 'Review branch details.' : 'Update the branch details.';
    saveButton.textContent = isNew ? 'Create' : 'Save changes';
    if (isNew) form.elements.namedItem('code').value = nextCode();
    else {
      form.elements.namedItem('code').value = branch.code;
      form.elements.namedItem('englishName').value = branch.englishName || '';
      form.elements.namedItem('arabicName').value = branch.arabicName || '';
      form.elements.namedItem('prefix').value = branch.prefix || '';
    }
    if (nextMode === 'view') setReadOnly(true);
    modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    modal.querySelector('[data-branch-close]').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = {
      code: form.elements.namedItem('code').value,
      englishName: form.elements.namedItem('englishName').value.trim(),
      arabicName: form.elements.namedItem('arabicName').value.trim(),
      prefix: form.elements.namedItem('prefix').value.trim(),
    };
    if (mode === 'new') {
      const branch = { ...values, active: true };
      branches.push(branch);
      persist();
      grid.querySelectorAll('[data-branch-filter]').forEach((field) => { field.value = ''; });
      appliedFilters = {};
      page = Math.ceil(branches.length / pageSize);
      closeModal();
      render();
      rows.querySelector(`[data-branch-row-menu][data-code="${CSS.escape(branch.code)}"]`)?.focus();
      showToast(`${branch.englishName} was created successfully.`);
    } else {
      const branch = branches.find((item) => item.code === activeCode);
      if (!branch) return;
      Object.assign(branch, values);
      persist();
      closeModal();
      render();
      rows.querySelector(`[data-branch-row-menu][data-code="${CSS.escape(branch.code)}"]`)?.focus();
      showToast(`${branch.englishName} was updated successfully.`);
    }
  });

  grid.querySelector('[data-branch-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.querySelector('[data-branch-search]').addEventListener('click', () => { appliedFilters = readFilters(); page = 1; closeMenus(); render(); });
  grid.querySelector('[data-branch-reset]').addEventListener('click', () => {
    grid.querySelectorAll('[data-branch-filter]').forEach((field) => { field.value = ''; });
    appliedFilters = {};
    page = 1;
    closeMenus();
    render();
  });
  grid.querySelectorAll('[data-branch-filter]').forEach((field) => field.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); grid.querySelector('[data-branch-search]').click(); }
  }));
  grid.querySelectorAll('[data-branch-page]').forEach((button) => button.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filteredBranches().length / pageSize));
    if (button.dataset.branchPage === 'first') page = 1;
    if (button.dataset.branchPage === 'previous') page = Math.max(1, page - 1);
    if (button.dataset.branchPage === 'next') page = Math.min(totalPages, page + 1);
    if (button.dataset.branchPage === 'last') page = totalPages;
    closeMenus();
    render();
  }));

  rows.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-branch-row-menu]');
    if (trigger) {
      const menu = trigger.parentElement.querySelector('.facility-row-menu');
      const opening = menu.hidden;
      closeMenus(menu);
      menu.hidden = !opening;
      trigger.setAttribute('aria-expanded', String(opening));
      return;
    }
    const action = event.target.closest('[data-branch-action]');
    if (!action) {
      if (!event.target.closest('.facility-row-action')) closeMenus();
      return;
    }
    const branch = branches.find((item) => item.code === action.dataset.code);
    if (!branch) return;
    const rowTrigger = action.closest('.facility-row-action').querySelector('[data-branch-row-menu]');
    if (action.dataset.branchAction === 'view' || action.dataset.branchAction === 'edit') {
      closeMenus();
      openModal(action.dataset.branchAction, branch, rowTrigger);
      return;
    }
    branch.active = !branch.active;
    persist();
    render();
    showToast(`${branch.englishName} is now ${branch.active ? 'active' : 'inactive'}.`);
  });

  modal.querySelector('[data-branch-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-branch-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.facility-row-action')) closeMenus(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { if (!modal.hidden) closeModal(); else closeMenus(); }
    if (modal.hidden || event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey || !event.newValue) return;
    try {
      const updated = JSON.parse(event.newValue);
      if (Array.isArray(updated)) { branches = updated; render(); }
    } catch { /* Ignore invalid external updates. */ }
  });

  render();
})();
