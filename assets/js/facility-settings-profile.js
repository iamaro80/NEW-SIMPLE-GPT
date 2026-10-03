(() => {
  const root = document.querySelector('[data-current-facility-profile]');
  if (!root || !window.RcmFacilityStore) return;

  const sections = [
    { title: 'Facilities Information', fields: [
      ['Facility Identifier', 'facilityIdentifier'], ['HCP', 'hcp'], ['Arabic Name', 'arabicName', 'rtl'], ['English Name', 'englishName'],
      ['Contact Name', 'contactName'], ['Email', 'email'], ['Phone Number', 'phone'], ['Ext.', 'extension'], ['Mobile Number', 'mobile'],
      ['License Number', 'licenseNumber'], ['License Start', 'licenseStart'], ['License End', 'licenseEnd'], ['CHI ID', 'chiId'],
      ['Unified ID', 'unifiedId'], ['VAT Number', 'vatNumber'], ['CR Number', 'crNumber'], ['NHIC Number', 'nhicNumber'], ['Facility Category', 'category'],
    ] },
    { title: 'Address', fields: [
      ['Country', 'country'], ['City', 'city'], ['District', 'district'], ['Building Number', 'buildingNumber'],
      ['Street Name', 'streetName'], ['Postal Code', 'postalCode'], ['Additional Number', 'additionalNumber'],
    ] },
    { title: 'Facility Configurations', fields: [
      ['Episode Expiry Time', 'episodeExpiry'], ['Is Auto Authorization Process', 'autoAuthorization'],
      ['Invoice Configurations English', 'invoiceConfigEnglish'], ['Invoice Configurations Arabic', 'invoiceConfigArabic', 'rtl'],
      ['Background Color', 'backgroundColor'], ['Foreground Color', 'foregroundColor'],
    ] },
    { title: 'ZATCA Details', fields: [['Organization Id', 'zatcaOrganizationId'], ['Invoice Book', 'zatcaInvoiceBook']] },
  ];

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);

  function currentFacility() {
    const records = window.RcmFacilityStore.list();
    const selectedId = document.body.dataset.currentFacilityId || '1';
    return records.find((facility) => String(facility.id) === selectedId) || records[0] || null;
  }

  function displayValue(facility, key) {
    if (key === 'phone') return facility.phone || '—';
    if (key === 'mobile') return facility.mobileLocal ? `${facility.mobileCountryCode || '+966'} ${facility.mobileLocal}` : '—';
    if (key === 'autoAuthorization') return facility.autoAuthorization ? 'Yes' : 'No';
    const value = facility[key];
    return value === undefined || value === null || value === '' ? '—' : value;
  }

  function render() {
    const facility = currentFacility();
    const name = root.querySelector('[data-current-facility-name]');
    const identifier = root.querySelector('[data-current-facility-id-label]');
    const content = root.querySelector('[data-current-facility-sections]');
    if (!facility) {
      name.textContent = 'Facility unavailable';
      identifier.textContent = '';
      content.replaceChildren();
      return;
    }

    name.textContent = facility.englishName;
    identifier.textContent = `Facility Identifier ${facility.facilityIdentifier} · ${facility.active ? 'Active' : 'Inactive'}`;
    content.innerHTML = sections.map((section) => `<section class="facility-profile-data-section"><h3>${escapeHtml(section.title)}</h3><dl>${section.fields.map(([label, key, direction]) => {
      const value = displayValue(facility, key);
      const isColor = key === 'backgroundColor' || key === 'foregroundColor';
      const renderedValue = isColor && value !== '—'
        ? `<span class="facility-color-swatch" style="--facility-swatch:${escapeHtml(value)}"></span>${escapeHtml(value)}`
        : escapeHtml(value);
      return `<div><dt>${escapeHtml(label)}</dt><dd${direction ? ' dir="rtl"' : ''}>${renderedValue}</dd></div>`;
    }).join('')}</dl></section>`).join('');
  }

  root.querySelector('[data-current-facility-edit]').addEventListener('click', (event) => {
    const facility = currentFacility();
    if (!facility) return;
    document.dispatchEvent(new CustomEvent('rcm:facility-edit', { detail: { id: facility.id, trigger: event.currentTarget } }));
  });
  window.addEventListener('rcm:facilities-changed', render);
  render();
})();
