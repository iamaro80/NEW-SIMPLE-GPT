(() => {
  const grid = document.querySelector('[data-organization-direct-billing-grid]');
  if (!grid) return;

  const facilities = (window.RcmFacilityStore?.list?.() || []).map((facility) => ({ ...facility, id: String(facility.id) }));
  const keyFor = (id) => `rcm-facility-direct-billing:v1:${id}`;
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const toast = document.querySelector('[data-facility-toast]');
  let toastTimer;

  function enabledValue(id) {
    try {
      const saved = localStorage.getItem(keyFor(id));
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  }

  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function render() {
    grid.innerHTML = `<section class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table"><thead><tr><th>Facility</th><th>Direct Billing Enrollment</th><th>Status</th></tr></thead><tbody>${facilities.map((facility) => {
      const enabled = enabledValue(facility.id);
      return `<tr><td><strong>${esc(facility.englishName || `Facility ${facility.id}`)}</strong></td><td><label class="direct-billing-switch"><input type="checkbox" data-direct-billing-toggle="${esc(facility.id)}" aria-label="Enable Direct Billing Enrollment for ${esc(facility.englishName || `Facility ${facility.id}`)}" aria-checked="${enabled}" ${enabled ? 'checked' : ''}><span class="direct-billing-switch-track" aria-hidden="true"><span></span></span><span class="direct-billing-switch-label">${enabled ? 'Enabled' : 'Disabled'}</span></label></td><td><span class="facility-status ${enabled ? 'is-active' : 'is-inactive'}"><span></span>${enabled ? 'Enabled' : 'Disabled'}</span></td></tr>`;
    }).join('')}</tbody></table></div>${facilities.length ? '' : '<div class="facility-empty">No facilities are available.</div>'}<footer class="facility-pagination"><span>Total Facilities: ${facilities.length}</span></footer></section>`;
  }

  grid.addEventListener('change', (event) => {
    const toggle = event.target.closest('[data-direct-billing-toggle]');
    if (!toggle) return;
    const id = toggle.dataset.directBillingToggle;
    try { localStorage.setItem(keyFor(id), String(toggle.checked)); } catch { /* Keep the toggle state for this session. */ }
    const facilityName = facilities.find((facility) => facility.id === id)?.englishName || `Facility ${id}`;
    render();
    notify(`Direct Billing Enrollment for ${facilityName} is now ${toggle.checked ? 'enabled' : 'disabled'}.`);
  });

  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith('rcm-facility-direct-billing:v1:')) render();
  });

  render();
})();
