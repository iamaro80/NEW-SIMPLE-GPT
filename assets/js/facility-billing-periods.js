(() => {
  const workspace = document.querySelector('[data-structure-workspace]');
  if (!workspace) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-billing-periods:v1:${facilityId}`;
  const years = [2026, 2027, 2028, 2029, 2030];
  const pageSize = 12;
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    reopen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 11a8 8 0 1 0 1 4M20 4v7h-7"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
  };

  function periodsForYear(year, frequency) {
    if (frequency === 'Yearly') {
      return [{
        id: `${year}-yearly`, name: String(year), year, startDate: dateString(year, 1, 1), endDate: dateString(year, 12, 31),
        status: 'Future', payerOnly: false, allowClaimCreation: true, fiscalYearType: 'Gregorian Fiscal', frequency,
      }];
    }
    if (frequency === 'Weekly') {
      const yearLength = Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000);
      return Array.from({ length: Math.ceil(yearLength / 7) }, (_, index) => {
        const start = new Date(Date.UTC(year, 0, 1 + index * 7));
        const end = new Date(Date.UTC(year, 0, Math.min(yearLength, (index + 1) * 7)));
        const week = index + 1;
        return {
          id: `${year}-weekly-${week}`, name: `${year}-W${String(week).padStart(2, '0')}`, year, week,
          startDate: dateString(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate()),
          endDate: dateString(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate()),
          status: 'Future', payerOnly: false, allowClaimCreation: true, fiscalYearType: 'Gregorian Fiscal', frequency,
        };
      });
    }
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      let status = 'Future';
      if (year === 2026 && month === 1) status = 'Pending Closure';
      else if (year === 2026 && month === 2) status = 'Open';
      return {
        id: `${year}-${month}`,
        name: `${year}-${month}`,
        year,
        month,
        startDate: dateString(year, month, 1),
        endDate: dateString(year, month, lastDay),
        status,
        payerOnly: status === 'Pending Closure' || status === 'Closed',
        allowClaimCreation: status !== 'Closed',
        fiscalYearType: 'Gregorian Fiscal',
        frequency: 'Monthly',
      };
    });
  }

  function dateString(year, month, day) {
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      const seeded = periodsForYear(2026, 'Monthly');
      localStorage.setItem(storageKey, JSON.stringify(seeded));
      return seeded;
    } catch { return periodsForYear(2026, 'Monthly'); }
  }

  let periods = load();
  let selectedYear = 2026;
  let selectedFrequency = 'Monthly';
  let toastTimer;
  const page = document.createElement('section');
  page.className = 'facility-grid billing-period-page';
  page.dataset.financialPage = 'billing-period';
  page.setAttribute('aria-label', 'Billing Period');
  page.hidden = true;
  page.innerHTML = `
    <div class="branches-toolbar">
      <div class="branches-add-row"><button class="button button-primary" type="button" data-period-add>${icons.add}Add Billing Periods</button></div>
      <div class="billing-summary-row">
        <label class="facility-filter"><span>Year</span><select data-period-year>${years.map((year) => `<option value="${year}"${year === 2026 ? ' selected' : ''}>${year}</option>`).join('')}</select></label>
        <label class="facility-filter"><span>Billing Periods</span><select data-period-frequency><option>Weekly</option><option selected>Monthly</option><option>Yearly</option></select></label>
        <div class="billing-summary-card"><span>Year</span><strong data-summary-year>26</strong></div>
        <div class="billing-summary-card"><span>Billing Frequency</span><strong data-summary-frequency>Monthly</strong></div>
        <div class="billing-summary-card"><span>Fiscal Year Type</span><strong>Gregorian Fiscal</strong></div>
      </div>
    </div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table billing-period-table"><thead><tr><th scope="col">Name</th><th scope="col">Start Date</th><th scope="col">End Date</th><th scope="col">Status</th><th scope="col">Payer Only</th><th scope="col">Allow Claim Creation</th><th scope="col">Actions</th></tr></thead><tbody data-period-rows></tbody></table></div>
      <div class="facility-empty" data-period-empty hidden>No billing periods exist for this year and frequency. Use Add Billing Periods to generate them.</div>
      <footer class="facility-pagination"><span data-period-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-period-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-period-page="previous" aria-label="Previous page">‹</button><span data-period-page-label></span><button class="icon-button" type="button" data-period-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-period-page="last" aria-label="Last page">»</button></div></footer>
    </div>
    <div class="patient-modal-backdrop" data-period-modal hidden><section class="patient-modal branch-modal" role="dialog" aria-modal="true" aria-labelledby="period-modal-title" aria-describedby="period-modal-description">
      <header class="patient-modal-header"><div><p class="eyebrow">BILLING PERIOD</p><h2 id="period-modal-title">Add Billing Periods</h2><p id="period-modal-description">Generate periods for the selected frequency and fiscal year.</p></div><button class="icon-button" type="button" data-period-close aria-label="Close dialog">${icons.close}</button></header>
      <form data-period-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">Billing Period Setup</legend><div class="facility-form-section-heading">Billing Period Setup</div><div class="patient-form-grid">
        <label class="form-field"><span>Fiscal Year Type <b>*</b></span><select name="fiscalYearType" required><option>Gregorian Fiscal</option></select></label>
        <label class="form-field"><span>Fiscal Year <b>*</b></span><select name="year" required>${years.map((year) => `<option value="${year}">${year}</option>`).join('')}</select></label>
        <label class="form-field"><span>Billing Periods <b>*</b></span><select name="frequency" required><option>Weekly</option><option selected>Monthly</option><option>Yearly</option></select></label>
      </div></fieldset></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-period-cancel>Cancel</button><button type="submit" class="button button-primary">Generate</button></div></footer></form>
    </section></div>
    <div class="patient-modal-backdrop" data-period-edit-modal hidden><section class="patient-modal branch-modal" role="dialog" aria-modal="true" aria-labelledby="period-edit-title" aria-describedby="period-edit-description">
      <header class="patient-modal-header"><div><p class="eyebrow">BILLING PERIOD</p><h2 id="period-edit-title">Edit Billing Period</h2><p id="period-edit-description">Update the date range for this period.</p></div><button class="icon-button" type="button" data-period-edit-close aria-label="Close dialog">${icons.close}</button></header>
      <form data-period-edit-form><div class="patient-modal-body"><fieldset class="patient-form-section"><legend class="sr-only">Period Dates</legend><div class="facility-form-section-heading">Period Dates</div><div class="patient-form-grid">
        <label class="form-field"><span>Name</span><input name="name" readonly></label><label class="form-field"><span>Start Date <b>*</b></span><input name="startDate" type="date" required></label><label class="form-field"><span>End Date <b>*</b></span><input name="endDate" type="date" required></label>
      </div></fieldset></div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-period-edit-cancel>Cancel</button><button type="submit" class="button button-primary">Save changes</button></div></footer></form>
    </section></div>`;
  workspace.append(page);

  const rows = page.querySelector('[data-period-rows]');
  const yearSelect = page.querySelector('[data-period-year]');
  const frequencySelect = page.querySelector('[data-period-frequency]');
  const count = page.querySelector('[data-period-count]');
  const pageLabel = page.querySelector('[data-period-page-label]');
  const empty = page.querySelector('[data-period-empty]');
  const summaryYear = page.querySelector('[data-summary-year]');
  const summaryFrequency = page.querySelector('[data-summary-frequency]');
  const modal = page.querySelector('[data-period-modal]');
  const form = page.querySelector('[data-period-form]');
  const editModal = page.querySelector('[data-period-edit-modal]');
  const editForm = page.querySelector('[data-period-edit-form]');
  let currentPage = 1;
  let editingId = null;
  let returnFocus = null;

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(periods)); } catch { /* Keep changes in memory for this page session. */ }
  }

  function toast(message) {
    const target = document.querySelector('[data-facility-toast]');
    if (!target) return;
    target.textContent = message;
    target.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => target.classList.remove('is-visible'), 2300);
  }

  function filtered() { return periods.filter((period) => Number(period.year) === Number(selectedYear) && period.frequency === selectedFrequency); }

  function switchMarkup(label, checked, disabled, action, id) {
    return `<button type="button" class="billing-switch${checked ? ' is-on' : ''}" role="switch" aria-label="${label} for ${escapeHtml(id)}" aria-checked="${checked}" data-period-action="${action}" data-period-id="${escapeHtml(id)}"${disabled ? ' disabled' : ''}><span></span></button>`;
  }

  function render() {
    const matching = filtered();
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const visible = matching.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    rows.innerHTML = visible.map((period) => {
      const canCloseOrReopen = period.status === 'Open' || period.status === 'Pending Closure';
      const actionLabel = period.status === 'Open' ? 'Close' : 'Reopen';
      const actionIcon = period.status === 'Open' ? icons.close : icons.reopen;
      const payerLocked = period.status === 'Future' || period.status === 'Closed';
      const claimLocked = period.status === 'Future' || period.status === 'Open';
      return `<tr>
        <td class="branch-code">${escapeHtml(period.name)}</td><td>${escapeHtml(period.startDate)}</td><td>${escapeHtml(period.endDate)}</td>
        <td><span class="period-status period-status-${period.status.toLowerCase().replaceAll(' ', '-')}">${escapeHtml(period.status)}</span></td>
        <td>${switchMarkup('Payer Only', Boolean(period.payerOnly), payerLocked, 'payer-only', period.id)}</td>
        <td>${switchMarkup('Allow Claim Creation', Boolean(period.allowClaimCreation), claimLocked, 'allow-claims', period.id)}</td>
        <td><div class="period-row-actions"><button class="icon-button period-action" type="button" data-period-action="close-reopen" data-period-id="${escapeHtml(period.id)}" aria-label="${actionLabel} ${escapeHtml(period.name)}" title="${actionLabel}"${canCloseOrReopen ? '' : ' disabled'}>${actionIcon}</button><button class="icon-button period-action" type="button" data-period-action="edit" data-period-id="${escapeHtml(period.id)}" aria-label="Edit ${escapeHtml(period.name)}" title="Edit">${icons.edit}</button></div></td>
      </tr>`;
    }).join('');
    empty.hidden = matching.length > 0;
    count.textContent = `Total Results: ${matching.length}`;
    pageLabel.textContent = `Page ${matching.length ? currentPage : 0} of ${matching.length ? totalPages : 0}`;
    page.querySelectorAll('[data-period-page]').forEach((button) => {
      button.disabled = matching.length === 0 || (['first', 'previous'].includes(button.dataset.periodPage) ? currentPage === 1 : currentPage === totalPages);
    });
  }

  function closeModal(target) {
    target.hidden = true;
    document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  page.querySelector('[data-period-add]').addEventListener('click', (event) => {
    returnFocus = event.currentTarget;
    form.reset();
    form.elements.year.value = String(selectedYear);
    form.elements.frequency.value = selectedFrequency;
    modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    modal.querySelector('[data-period-close]').focus();
  });
  yearSelect.addEventListener('change', () => {
    selectedYear = Number(yearSelect.value);
    summaryYear.textContent = String(selectedYear).slice(-2);
    currentPage = 1;
    render();
  });
  frequencySelect.addEventListener('change', () => {
    selectedFrequency = frequencySelect.value;
    summaryFrequency.textContent = selectedFrequency;
    currentPage = 1;
    render();
  });
  page.querySelectorAll('[data-period-page]').forEach((button) => button.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filtered().length / pageSize));
    if (button.dataset.periodPage === 'first') currentPage = 1;
    if (button.dataset.periodPage === 'previous') currentPage = Math.max(1, currentPage - 1);
    if (button.dataset.periodPage === 'next') currentPage = Math.min(totalPages, currentPage + 1);
    if (button.dataset.periodPage === 'last') currentPage = totalPages;
    render();
  }));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const year = Number(form.elements.year.value);
    const fiscalYearType = form.elements.fiscalYearType.value;
    const frequency = form.elements.frequency.value;
    if (periods.some((period) => Number(period.year) === year && period.fiscalYearType === fiscalYearType && period.frequency === frequency)) {
      toast(`Billing periods already exist for ${year}.`);
      return;
    }
    periods.push(...periodsForYear(year, frequency));
    selectedYear = year;
    selectedFrequency = frequency;
    yearSelect.value = String(year);
    frequencySelect.value = frequency;
    summaryYear.textContent = String(year).slice(-2);
    summaryFrequency.textContent = frequency;
    persist();
    closeModal(modal);
    currentPage = 1;
    render();
    toast(`Billing periods for ${year} were generated successfully.`);
  });

  function toInputDate(value) {
    const [day, month, year] = String(value).split('/');
    return `${year}-${month}-${day}`;
  }
  function fromInputDate(value) {
    const [year, month, day] = String(value).split('-');
    return `${day}/${month}/${year}`;
  }

  rows.addEventListener('click', (event) => {
    const button = event.target.closest('[data-period-action]');
    if (!button || button.disabled) return;
    const period = periods.find((item) => item.id === button.dataset.periodId);
    if (!period) return;
    const action = button.dataset.periodAction;
    if (action === 'edit') {
      editingId = period.id;
      returnFocus = button;
      editForm.elements.name.value = period.name;
      editForm.elements.startDate.value = toInputDate(period.startDate);
      editForm.elements.endDate.value = toInputDate(period.endDate);
      editModal.hidden = false;
      document.body.classList.add('patient-modal-open');
      editModal.querySelector('[data-period-edit-close]').focus();
      return;
    }
    if (action === 'close-reopen') {
      if (period.status === 'Open') {
        period.status = 'Pending Closure';
        period.payerOnly = true;
        period.allowClaimCreation = true;
        toast(`${period.name} is pending closure; payer-only context is enabled.`);
      } else if (period.status === 'Pending Closure') {
        period.status = 'Open';
        period.payerOnly = false;
        period.allowClaimCreation = true;
        toast(`${period.name} was reopened.`);
      }
    } else if (action === 'payer-only') {
      period.payerOnly = !period.payerOnly;
      if (period.payerOnly) {
        period.status = 'Pending Closure';
        period.allowClaimCreation = true;
        toast(`${period.name} switched to payer-only context.`);
      } else {
        period.status = 'Open';
        period.allowClaimCreation = true;
        toast(`${period.name} returned to Open.`);
      }
    } else if (action === 'allow-claims') {
      period.allowClaimCreation = !period.allowClaimCreation;
      if (!period.allowClaimCreation) {
        period.status = 'Closed';
        period.payerOnly = true;
        toast(`${period.name} is closed; claim creation is disabled.`);
      } else {
        period.status = 'Pending Closure';
        period.payerOnly = true;
        toast(`${period.name} returned to Pending Closure; claim creation is enabled.`);
      }
    }
    persist();
    render();
  });

  editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!editForm.reportValidity()) return;
    const start = new Date(editForm.elements.startDate.value);
    const end = new Date(editForm.elements.endDate.value);
    if (start > end) { editForm.elements.endDate.setCustomValidity('End date must be on or after the start date.'); editForm.reportValidity(); editForm.elements.endDate.setCustomValidity(''); return; }
    const period = periods.find((item) => item.id === editingId);
    if (!period) return;
    period.startDate = fromInputDate(editForm.elements.startDate.value);
    period.endDate = fromInputDate(editForm.elements.endDate.value);
    persist();
    closeModal(editModal);
    render();
    toast(`${period.name} was updated successfully.`);
  });

  [
    [modal, '[data-period-close]', '[data-period-cancel]'],
    [editModal, '[data-period-edit-close]', '[data-period-edit-cancel]'],
  ].forEach(([target, closeSelector, cancelSelector]) => {
    target.querySelector(closeSelector).addEventListener('click', () => closeModal(target));
    target.querySelector(cancelSelector).addEventListener('click', () => closeModal(target));
    target.addEventListener('click', (event) => { if (event.target === target) closeModal(target); });
  });

  function updateRoute() {
    page.hidden = location.hash.slice(1) !== 'billing-period';
    if (!page.hidden) render();
  }
  updateRoute();
  window.addEventListener('hashchange', updateRoute);
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey || !event.newValue) return;
    try { const value = JSON.parse(event.newValue); if (Array.isArray(value)) { periods = value; render(); } } catch { /* Ignore invalid external updates. */ }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const open = [modal, editModal].find((target) => !target.hidden);
      if (open) closeModal(open);
    }
  });
  render();
})();
