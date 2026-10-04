(() => {
  const page = document.querySelector('[data-direct-billing-settings]');
  const toggle = page?.querySelector('[data-direct-billing-toggle]');
  if (!page || !toggle) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const storageKey = `rcm-facility-direct-billing:v1:${facilityId}`;
  const status = page.querySelector('[data-direct-billing-status]');
  const toast = document.querySelector('[data-facility-toast]');
  let toastTimer;

  function enabledValue() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  }

  function render() {
    toggle.checked = enabledValue();
    toggle.setAttribute('aria-checked', String(toggle.checked));
    status.textContent = toggle.checked ? 'Enabled' : 'Disabled';
  }

  function notify() {
    if (!toast) return;
    toast.textContent = toggle.checked
      ? 'Direct Billing Enrollment is now enabled.'
      : 'Direct Billing Enrollment is now disabled.';
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  toggle.addEventListener('change', () => {
    try { localStorage.setItem(storageKey, String(toggle.checked)); } catch { /* Keep the current setting for this page session. */ }
    render();
    notify();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) render();
  });
  render();
})();
