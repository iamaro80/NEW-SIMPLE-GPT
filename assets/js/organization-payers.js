(() => {
  const grid = document.querySelector('[data-payers-grid]');
  if (!grid) return;

  const organizationView = document.body.dataset.facilityContext === 'organization';
  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const facilities = organizationView ? (window.RcmFacilityStore?.list?.() || []).map((facility) => ({ ...facility, id: String(facility.id) })) : [];
  const storageKey = `rcm-facility-payers:v2:${facilityId}`;
  const storageKeyFor = (id) => `rcm-facility-payers:v2:${id}`;
  const pageSize = 5;
  const countries = ['Saudi Arabia', 'Bahrain', 'Kuwait', 'United Arab Emirates'];
  const cities = ['Tabuk', 'Hail', 'Al Khari', 'Al Dirah', 'Al Mammafah', 'Makkah', 'Dammam', 'Jeddah', 'Al Taif', 'Buraidah', 'Al Hofuf', 'Madinah', 'Abha', 'Jazan', 'Al Khobar', 'Riyadh'];
  const payerTypes = ['Insurance Company', 'Government', 'Corporate', 'Self-Pay'];
  const licenceTypes = ['CHI', 'DHA', 'Other'];
  const insurers = ['Nujum Cooperative Health', 'Rimal Health Assurance', 'Tawuniya Cooperative Insurance Company', 'Bupa Arabia for Cooperative Insurance', 'AlJazira Takaful', 'Other Regional Insurer'];
  const tpas = ['Sahab Care Administration', 'Namaa Claims Services', 'Nextcare', 'Totalcare'];
  const payerCategories = ['Prepaid', 'Postpaid'];
  const billingOptions = ['General', 'Good Without Activation', 'Good Without New Patient', 'Good Without New Patient Activation', 'Good With Suspension', 'Graceful Debt', 'Bad Debt', 'Good With Full Access'];
  const adjudicationOptions = ['Treat as Total', 'Treat As Total Including Vat', 'Treat as Company Share', 'Treat As Company Share Including Vat'];
  const comparisonOptions = ['Fixed Date', 'Start Date', 'End Date'];
  const seed = [
    { id: 'payer-001', chiNumber: 'CHI-20481', unifiedNumber: '7003246812', vatNumber: '310784562300003', arabicName: 'جهة الدفع 1', englishName: 'Payer 1', payerType: 'Insurance Company', allowedContract: true, country: 'Saudi Arabia', city: 'Riyadh', active: true, payerCode: 'OAS-01', healthInsuranceCompany: insurers[0], payerCategory: 'Postpaid', acronym: 'OHA', chiLicenseNumber: 'CHI-L-20481', licenceNumber: 'LIC-OAS-24', dhaLicenseNumber: '', billing: 'General', mainPaymentAccount: 'SA1200000000123456789012', targetAmount: '500000', discount: '5', issuePeriod: 'Monthly', district: 'Al Olaya', buildingNumber: '2145', streetName: 'King Fahd Road', postalCode: '12241', additionalNumber: '7812', contacts: [{ id: 'CT-001', contactName: 'Contact 1', email: 'lina.haddad@oasis.example', phoneCode: '+966', phone: '112345678', ext: '214', mobileCode: '+966', mobile: '551234567', fax: '112345679' }], adjudicationHandling: 'Treat as Total', hasTpa: true, tpaRows: [{ id: 'TPA-001', chiNumber: 'NHIC-71042', name: tpas[0], startDate: '2026-01-01', endDate: '2026-12-31', dateComparisonType: 'Fixed Date', isDefault: true }] },
    { id: 'payer-002', chiNumber: 'CHI-31706', unifiedNumber: '7009182754', vatNumber: '311092837400003', arabicName: 'جهة الدفع 2', englishName: 'Payer 2', payerType: 'Insurance Company', allowedContract: true, country: 'Saudi Arabia', city: 'Jeddah', active: true, payerCode: 'HCT-02', healthInsuranceCompany: insurers[1], payerCategory: 'Prepaid', acronym: 'HCT', chiLicenseNumber: 'CHI-L-31706', licenceNumber: '', dhaLicenseNumber: '', billing: 'Good Without New Patient', mainPaymentAccount: '', targetAmount: '250000', discount: '3', issuePeriod: 'Monthly', district: 'Al Rawdah', buildingNumber: '', streetName: 'Prince Sultan Road', postalCode: '23432', additionalNumber: '', contacts: [], adjudicationHandling: 'Treat As Total Including Vat', hasTpa: true, tpaRows: [{ id: 'TPA-001', chiNumber: 'NHIC-82451', name: tpas[1], startDate: '2026-03-01', endDate: '2027-02-28', dateComparisonType: 'Start Date', isDefault: true }] },
    { id: 'payer-003', chiNumber: 'GOV-90152', unifiedNumber: '7005610938', vatNumber: '310341729800003', arabicName: 'جهة الدفع 3', englishName: 'Payer 3', payerType: 'Government', allowedContract: false, country: 'Saudi Arabia', city: 'Dammam', active: true, payerCode: 'PEHF-03', healthInsuranceCompany: '', payerCategory: 'Postpaid', acronym: 'PEHF', chiLicenseNumber: '', licenceNumber: 'GOV-HEALTH-152', dhaLicenseNumber: '', billing: 'Good With Full Access', mainPaymentAccount: '', targetAmount: '', discount: '', issuePeriod: 'Quarterly', district: 'Al Faisaliyah', buildingNumber: '', streetName: '', postalCode: '', additionalNumber: '', contacts: [], adjudicationHandling: 'Treat as Company Share', hasTpa: false, tpaRows: [] },
    { id: 'payer-004', chiNumber: 'CHI-46832', unifiedNumber: '7008174306', vatNumber: '310672845100003', arabicName: 'جهة الدفع 4', englishName: 'Payer 4', payerType: 'Insurance Company', allowedContract: true, country: 'Saudi Arabia', city: 'Madinah', active: false, payerCode: 'PMI-04', healthInsuranceCompany: insurers[2], payerCategory: 'Prepaid', acronym: 'PMI', chiLicenseNumber: 'CHI-L-46832', licenceNumber: '', dhaLicenseNumber: '', billing: 'Graceful Debt', mainPaymentAccount: '', targetAmount: '', discount: '2', issuePeriod: 'Monthly', district: 'Al Qiblatayn', buildingNumber: '', streetName: '', postalCode: '', additionalNumber: '', contacts: [], adjudicationHandling: adjudicationOptions[0], hasTpa: false, tpaRows: [] },
    { id: 'payer-005', chiNumber: 'COR-17204', unifiedNumber: '7002468091', vatNumber: '311027468900003', arabicName: 'جهة الدفع 5', englishName: 'Payer 5', payerType: 'Corporate', allowedContract: true, country: 'Bahrain', city: 'Dammam', active: true, payerCode: 'SIG-05', healthInsuranceCompany: '', payerCategory: 'Postpaid', acronym: 'SIG', chiLicenseNumber: '', licenceNumber: 'CORP-17204', dhaLicenseNumber: '', billing: 'Good Without Activation', mainPaymentAccount: '', targetAmount: '', discount: '', issuePeriod: 'Quarterly', district: 'Al Faisaliyah', buildingNumber: '', streetName: '', postalCode: '', additionalNumber: '', contacts: [], adjudicationHandling: adjudicationOptions[0], hasTpa: false, tpaRows: [] },
  ];
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const makeOptions = (values, first = 'Select') => `<option value="">${first}</option>${values.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}`;
  const input = (name, label, type = 'text', extra = '') => `<label class="form-field"><span>${label}</span><input name="${name}" type="${type}" ${extra}></label>`;
  const select = (name, label, values, first = 'Select') => `<label class="form-field"><span>${label}</span><select name="${name}">${makeOptions(values, first)}</select></label>`;
  let payers = load();
  let filters = {};
  let page = 1;
  let mode = 'new';
  let activeId = null;
  let activeFacilityId = facilityId;
  let returnFocus = null;
  let editingContactIndex = -1;
  let editingTpaIndex = -1;
  let toastTimer;

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-payer-add>${icons.add}Add Payer</button></div><div class="branches-filter-grid payer-filter-grid" role="search" aria-label="Filter payers">
      ${organizationView ? `<label class="facility-filter"><span>Facility</span><select data-payer-filter="facilityId"><option value="">All facilities</option>${facilities.map((facility) => `<option value="${escapeHtml(facility.id)}">${escapeHtml(facility.englishName)}</option>`).join('')}</select></label>` : ''}
      <label class="facility-filter"><span>Unified ID</span><input type="search" data-payer-filter="unifiedNumber" placeholder="Search unified ID"></label>
      <label class="facility-filter"><span>Arabic Name</span><input type="search" data-payer-filter="arabicName" placeholder="Search Arabic name" dir="rtl"></label>
      <label class="facility-filter"><span>English Name</span><input type="search" data-payer-filter="englishName" placeholder="Search English name"></label>
      <label class="facility-filter"><span>VAT Number</span><input type="search" data-payer-filter="vatNumber" placeholder="Search VAT number"></label>
      <label class="facility-filter"><span>CHI ID</span><input type="search" data-payer-filter="chiNumber" placeholder="Search CHI ID"></label>
      <label class="facility-filter"><span>Payer Type</span><select data-payer-filter="payerType">${makeOptions(payerTypes, 'All payer types')}</select></label>
      <label class="facility-filter"><span>Licences Type</span><select data-payer-filter="licenceType">${makeOptions(licenceTypes, 'All licence types')}</select></label>
    </div></div><div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table payers-table"><thead><tr>${organizationView ? '<th>Facility</th>' : ''}<th>CHI ID</th><th>Unified ID</th><th>VAT Number</th><th>Arabic Name</th><th>English Name</th><th>Payer Type</th><th>Allowed Contract</th><th>Country</th><th>City</th><th>Status</th><th>Actions</th></tr></thead><tbody data-payer-rows></tbody></table></div><div class="facility-empty" data-payer-empty hidden>No payers match your filters.</div><footer class="facility-pagination"><span data-payer-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-payer-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-payer-page="previous" aria-label="Previous page">‹</button><span data-payer-page-label></span><button class="icon-button" type="button" data-payer-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-payer-page="last" aria-label="Last page">»</button></div></footer></div>`;

  const modal = document.createElement('div');
  modal.className = 'patient-modal-backdrop'; modal.id = 'payer-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal payer-modal" role="dialog" aria-modal="true" aria-labelledby="payer-modal-title" aria-describedby="payer-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">PAYER RECORD</p><h2 id="payer-modal-title">Add Payer</h2><p id="payer-modal-description">Enter payer information and linked records.</p></div><button type="button" class="icon-button" data-payer-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><form data-payer-form><div class="patient-modal-body payer-modal-body">
    ${organizationView ? `<fieldset class="patient-form-section payer-section" data-payer-facility-section><legend class="sr-only">Facility Assignment</legend><div class="facility-form-section-heading">Facility Assignment</div><div class="organization-assignment-facility-list" data-payer-facilities>${facilities.map((facility) => `<label class="form-check"><input type="checkbox" value="${escapeHtml(facility.id)}"><span>${escapeHtml(facility.englishName)}</span></label>`).join('')}</div><p class="muted-text" data-payer-facility-note>Select one or more facilities. A separate payer record will be created in each.</p></fieldset>` : ''}
    <fieldset class="patient-form-section payer-section"><legend class="sr-only">Payer Information</legend><div class="facility-form-section-heading">Payer Information</div><div class="patient-form-grid payer-form-grid">
      ${select('payerType', 'Payer Type', payerTypes)}${input('payerCode', 'Payer Code')}
      <label class="form-field"><span>Health Insurance Company</span><input name="healthInsuranceCompany" list="payer-insurer-options"><datalist id="payer-insurer-options">${insurers.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('')}</datalist></label>
      ${select('payerCategory', 'Payer Category', payerCategories)}${input('arabicName', 'Arabic Name', 'text', 'dir="rtl"')}${input('englishName', 'English Name')}${input('acronym', 'Acronym')}${input('unifiedNumber', 'Unified Number')}${input('chiLicenseNumber', 'CHI License Number')}${input('vatNumber', 'VAT Number')}${input('licenceNumber', 'Licence Number')}${input('chiNumber', 'CHI Number')}${input('dhaLicenseNumber', 'DHA License Number')}${select('billing', 'Billing', billingOptions)}
    </div></fieldset>
    <fieldset class="patient-form-section payer-section"><legend class="sr-only">Financial Information</legend><div class="facility-form-section-heading">Financial Information</div><div class="patient-form-grid payer-form-grid">${input('mainPaymentAccount', 'Main Payment Account')}${input('targetAmount', 'Target Amount', 'number', 'step="any"')}${input('discount', 'Discount (%)', 'number', 'min="0" step="any"')}${input('issuePeriod', 'Issue Period')}</div></fieldset>
    <fieldset class="patient-form-section payer-section"><legend class="sr-only">Payer Address</legend><div class="facility-form-section-heading">Payer Address</div><div class="patient-form-grid payer-form-grid">${select('country', 'Country', countries)}<label class="form-field"><span>City</span><input name="city" list="payer-city-options"><datalist id="payer-city-options">${cities.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('')}</datalist></label>${input('district', 'District')}${input('buildingNumber', 'Building Number')}${input('streetName', 'Street Name')}${input('postalCode', 'Postal Code')}${input('additionalNumber', 'Additional Number')}</div></fieldset>
    <fieldset class="patient-form-section payer-section"><legend class="sr-only">Payer Contacts</legend><div class="facility-form-section-heading">Payer Contacts</div><div class="payer-nested-editor" data-contact-editor><div class="patient-form-grid payer-form-grid">
    ${input('contactName', 'Contact Name')}${input('contactEmail', 'Email', 'email')}<label class="form-field"><span>Phone Number</span><span class="phone-control"><select name="contactPhoneCode" aria-label="Phone country code"><option selected>+966</option><option>+973</option><option>+965</option><option>+971</option></select><input name="contactPhone" type="tel"></span></label>${input('contactExt', 'Ext.')}<label class="form-field"><span>Mobile Number</span><span class="phone-control"><select name="contactMobileCode" aria-label="Mobile country code"><option selected>+966</option><option>+973</option><option>+965</option><option>+971</option></select><input name="contactMobile" type="tel"></span></label>${input('contactFax', 'Fax')}</div><div class="payer-nested-action"><button type="button" class="button button-secondary" data-contact-add>${icons.add}Add Contact</button></div></div><div class="facility-table-scroll payer-nested-table-scroll"><table class="facility-table payer-nested-table"><thead><tr><th>ID</th><th>Contact Name</th><th>Email</th><th>Phone Number</th><th>Ext.</th><th>Mobile Number</th><th>Fax</th><th>Actions</th></tr></thead><tbody data-contact-rows></tbody></table></div><div class="facility-empty payer-nested-empty" data-contact-empty>No contacts added.</div></fieldset>
    <fieldset class="patient-form-section payer-section"><legend class="sr-only">Payer Configuration</legend><div class="facility-form-section-heading">Payer Configuration</div><div class="patient-form-grid payer-form-grid"><label class="form-field"><span>Adjudication Handling</span><select name="adjudicationHandling">${adjudicationOptions.map((value, index) => `<option${index === 0 ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label></div></fieldset>
    <fieldset class="patient-form-section payer-section"><legend class="sr-only">TPA Information</legend><div class="facility-form-section-heading">TPA Information</div><div class="patient-form-grid payer-form-grid payer-tpa-fields"><label class="form-check payer-checkbox"><input type="checkbox" name="hasTpa" checked><span>Has TPA</span></label>${select('tpaName', 'TPA', tpas)}${input('tpaChiNumber', 'CHI Number')}<label class="form-field"><span>Start Date</span><input name="tpaStartDate" type="date"></label><label class="form-field"><span>End Date</span><input name="tpaEndDate" type="date"></label>${select('tpaDateComparisonType', 'Date Comparison Type', comparisonOptions)}<label class="form-check payer-checkbox"><input type="checkbox" name="tpaIsDefault"><span>Is Default</span></label></div><div class="payer-nested-action payer-tpa-add"><button type="button" class="button button-secondary" data-tpa-add>${icons.add}Add TPA</button></div><div class="facility-table-scroll payer-nested-table-scroll"><table class="facility-table payer-nested-table"><thead><tr><th>ID</th><th>NHIC Number</th><th>Name</th><th>Start Date</th><th>End Date</th><th>Date Comparison Type</th><th>Is Default</th><th>Actions</th></tr></thead><tbody data-tpa-rows></tbody></table></div><div class="facility-empty payer-nested-empty" data-tpa-empty>No TPA linked.</div></fieldset>
    </div><footer class="patient-modal-footer"><span>All payer fields are optional.</span><div><button type="button" class="button button-secondary" data-payer-cancel>Cancel</button><button type="submit" class="button button-primary" data-payer-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);

  const form = modal.querySelector('[data-payer-form]');
  const rows = grid.querySelector('[data-payer-rows]');
  const toast = document.querySelector('[data-facility-toast]');

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function readFacility(fid) {
    try {
      const key = storageKeyFor(fid);
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map((record) => ({ ...record, contacts: Array.isArray(record.contacts) ? record.contacts : [], tpaRows: Array.isArray(record.tpaRows) ? record.tpaRows : [] }));
      }
      localStorage.setItem(key, JSON.stringify(seed));
    } catch { /* Keep the prototype usable when browser storage is unavailable. */ }
    return clone(seed);
  }
  function load() {
    if (!organizationView) return readFacility(facilityId);
    return facilities.flatMap((facility) => readFacility(facility.id).map((record) => ({ ...record, __facilityId: facility.id })));
  }
  function persist() {
    try {
      if (!organizationView) localStorage.setItem(storageKey, JSON.stringify(payers));
      else facilities.forEach((facility) => localStorage.setItem(storageKeyFor(facility.id), JSON.stringify(payers.filter((payer) => payer.__facilityId === facility.id).map(({ __facilityId, ...payer }) => payer))));
    } catch { /* Keep changes in memory for this page session. */ }
  }
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }
  function payerById(id, fid = facilityId) { return payers.find((payer) => payer.id === id && (!organizationView || payer.__facilityId === String(fid))); }
  function nextId(prefix, collection) { return `${prefix}-${String(Math.max(0, ...collection.map((item) => Number(String(item.id).split('-').at(-1)) || 0)) + 1).padStart(3, '0')}`; }
  function licenseMatches(payer, type) {
    if (!type) return true;
    if (type === 'CHI') return Boolean(payer.chiLicenseNumber || payer.chiNumber);
    if (type === 'DHA') return Boolean(payer.dhaLicenseNumber);
    return Boolean(payer.licenceNumber);
  }
  function matchingPayers() {
    return payers.filter((payer) => {
      for (const key of ['unifiedNumber', 'arabicName', 'englishName', 'vatNumber', 'chiNumber']) {
        if (filters[key] && !String(payer[key] || '').toLocaleLowerCase().includes(filters[key])) return false;
      }
      if (filters.payerType && payer.payerType !== filters.payerType) return false;
      if (filters.facilityId && payer.__facilityId !== filters.facilityId) return false;
      if (!licenseMatches(payer, filters.licenceType)) return false;
      return true;
    });
  }
  function closeMenus(except) {
    rows.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) { menu.hidden = true; menu.parentElement.querySelector('[data-payer-row-menu]')?.setAttribute('aria-expanded', 'false'); }
    });
  }
  function render() {
    const matches = matchingPayers();
    const pages = Math.max(1, Math.ceil(matches.length / pageSize)); page = Math.min(page, pages);
    const visible = matches.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((payer) => `<tr>${organizationView ? `<td>${escapeHtml(facilities.find((facility) => facility.id === payer.__facilityId)?.englishName || payer.__facilityId)}</td>` : ''}<td>${escapeHtml(payer.chiNumber || '—')}</td><td>${escapeHtml(payer.unifiedNumber || '—')}</td><td>${escapeHtml(payer.vatNumber || '—')}</td><td lang="ar" dir="rtl">${escapeHtml(payer.arabicName || '—')}</td><td><span class="facility-name-en">${escapeHtml(payer.englishName || '—')}</span></td><td>${escapeHtml(payer.payerType || '—')}</td><td>${payer.allowedContract ? 'Yes' : 'No'}</td><td>${escapeHtml(payer.country || '—')}</td><td>${escapeHtml(payer.city || '—')}</td><td><span class="facility-status ${payer.active ? 'is-active' : 'is-inactive'}"><span></span>${payer.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-payer-row-menu aria-label="Actions for ${escapeHtml(payer.englishName || 'payer')}" aria-haspopup="menu" aria-expanded="false" data-payer-id="${escapeHtml(payer.id)}" data-facility-id="${escapeHtml(payer.__facilityId || facilityId)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-payer-action="view" data-payer-id="${escapeHtml(payer.id)}" data-facility-id="${escapeHtml(payer.__facilityId || facilityId)}">${icons.eye}View</button><button type="button" role="menuitem" data-payer-action="edit" data-payer-id="${escapeHtml(payer.id)}" data-facility-id="${escapeHtml(payer.__facilityId || facilityId)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-payer-action="status" data-payer-id="${escapeHtml(payer.id)}" data-facility-id="${escapeHtml(payer.__facilityId || facilityId)}">${icons.status}${payer.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-payer-empty]').hidden = matches.length > 0;
    grid.querySelector('[data-payer-count]').textContent = `Total Results: ${matches.length}`;
    grid.querySelector('[data-payer-page-label]').textContent = `Page ${matches.length ? page : 0} of ${matches.length ? pages : 0}`;
    grid.querySelectorAll('[data-payer-page]').forEach((button) => { button.disabled = !matches.length || (['first', 'previous'].includes(button.dataset.payerPage) ? page === 1 : page === pages); });
  }
  function nestedTable(which, record) {
    const items = which === 'contact' ? record.contacts : record.tpaRows;
    const body = modal.querySelector(which === 'contact' ? '[data-contact-rows]' : '[data-tpa-rows]');
    if (which === 'contact') {
      body.innerHTML = items.map((item, index) => `<tr><td>${escapeHtml(item.id || `CT-${String(index + 1).padStart(3, '0')}`)}</td><td>${escapeHtml(item.contactName || '—')}</td><td>${escapeHtml(item.email || '—')}</td><td>${escapeHtml(item.phone ? `${item.phoneCode || '+966'} ${item.phone}` : '—')}</td><td>${escapeHtml(item.ext || '—')}</td><td>${escapeHtml(item.mobile ? `${item.mobileCode || '+966'} ${item.mobile}` : '—')}</td><td>${escapeHtml(item.fax || '—')}</td><td><button type="button" class="button button-ghost payer-row-edit" data-contact-edit="${index}" ${mode === 'view' ? 'hidden' : ''}>${icons.edit}Edit</button></td></tr>`).join('');
      modal.querySelector('[data-contact-empty]').hidden = items.length > 0;
    } else {
      body.innerHTML = items.map((item, index) => `<tr><td>${escapeHtml(item.id || `TPA-${String(index + 1).padStart(3, '0')}`)}</td><td>${escapeHtml(item.chiNumber || '—')}</td><td>${escapeHtml(item.name || '—')}</td><td>${escapeHtml(item.startDate || '—')}</td><td>${escapeHtml(item.endDate || '—')}</td><td>${escapeHtml(item.dateComparisonType || '—')}</td><td>${item.isDefault ? 'Yes' : 'No'}</td><td><button type="button" class="button button-ghost payer-row-edit" data-tpa-edit="${index}" ${mode === 'view' ? 'hidden' : ''}>${icons.edit}Edit</button></td></tr>`).join('');
      modal.querySelector('[data-tpa-empty]').hidden = items.length > 0;
    }
  }
  function setReadOnly(readOnly) {
    [...form.elements].forEach((field) => { if (field.name) field.disabled = readOnly; });
    modal.querySelector('[data-payer-save]').hidden = readOnly;
    modal.querySelector('[data-payer-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
    modal.querySelector('[data-contact-editor]').hidden = readOnly;
    modal.querySelector('[data-tpa-add]').hidden = readOnly;
    modal.querySelector('[data-tpa-add]').parentElement.previousElementSibling.querySelectorAll('input, select').forEach((field) => { field.disabled = readOnly; });
  }
  function resetNestedEditors() {
    editingContactIndex = -1; editingTpaIndex = -1;
    const contactButton = modal.querySelector('[data-contact-add]'); contactButton.textContent = 'Add Contact'; contactButton.insertAdjacentHTML('afterbegin', icons.add);
    const tpaButton = modal.querySelector('[data-tpa-add]'); tpaButton.textContent = 'Add TPA'; tpaButton.insertAdjacentHTML('afterbegin', icons.add);
  }
  function readFormFields() {
    const names = ['payerType', 'payerCode', 'healthInsuranceCompany', 'payerCategory', 'arabicName', 'englishName', 'acronym', 'unifiedNumber', 'chiLicenseNumber', 'vatNumber', 'licenceNumber', 'chiNumber', 'dhaLicenseNumber', 'billing', 'mainPaymentAccount', 'targetAmount', 'discount', 'issuePeriod', 'country', 'city', 'district', 'buildingNumber', 'streetName', 'postalCode', 'additionalNumber', 'adjudicationHandling'];
    return Object.fromEntries(names.map((name) => [name, String(form.elements.namedItem(name)?.value || '').trim()]));
  }
  function openModal(nextMode, payer = null, trigger = document.activeElement) {
    mode = nextMode; activeId = payer?.id || null; activeFacilityId = payer?.__facilityId || facilityId; returnFocus = trigger; form.reset(); resetNestedEditors(); setReadOnly(false);
    const editing = nextMode === 'edit';
    modal.querySelector('#payer-modal-title').textContent = nextMode === 'new' ? 'Add Payer' : nextMode === 'view' ? 'Payer Details' : 'Edit Payer';
    modal.querySelector('#payer-modal-description').textContent = nextMode === 'new' ? 'Enter payer information and linked records.' : nextMode === 'view' ? 'Review payer information and linked records.' : 'Update payer information and linked records.';
    modal.querySelector('[data-payer-save]').textContent = nextMode === 'new' ? 'Create' : 'Save changes';
    const activePayer = payer ? clone(payer) : { contacts: [], tpaRows: [] };
    modal._payerDraft = activePayer;
    if (organizationView) {
      const assignment = modal.querySelector('[data-payer-facilities]');
      assignment.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = payer ? checkbox.value === activeFacilityId : false;
        checkbox.disabled = Boolean(payer);
      });
      modal.querySelector('[data-payer-facility-note]').textContent = payer
        ? 'This record belongs to one facility. Edit applies only to this facility copy.'
        : 'Select one or more facilities. A separate payer record will be created in each.';
    }
    if (payer) {
      for (const [name, value] of Object.entries(payer)) {
        const field = form.elements.namedItem(name);
        if (field && field.type !== 'checkbox') field.value = value ?? '';
      }
      form.elements.namedItem('hasTpa').checked = Boolean(payer.hasTpa);
    }
    form.elements.namedItem('contactPhoneCode').value = '+966'; form.elements.namedItem('contactMobileCode').value = '+966';
    nestedTable('contact', activePayer); nestedTable('tpa', activePayer);
    if (nextMode === 'view') setReadOnly(true);
    modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-payer-close]').focus();
  }
  function closeModal() {
    modal.hidden = true; document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  function contactValues() {
    return { id: `CT-${String((editingContactIndex < 0 ? modal._payerDraft.contacts.length : editingContactIndex) + 1).padStart(3, '0')}`, contactName: form.elements.namedItem('contactName').value.trim(), email: form.elements.namedItem('contactEmail').value.trim(), phoneCode: form.elements.namedItem('contactPhoneCode').value, phone: form.elements.namedItem('contactPhone').value.trim(), ext: form.elements.namedItem('contactExt').value.trim(), mobileCode: form.elements.namedItem('contactMobileCode').value, mobile: form.elements.namedItem('contactMobile').value.trim(), fax: form.elements.namedItem('contactFax').value.trim() };
  }
  function addOrUpdateContact() {
    const values = contactValues();
    if (!values.contactName && !values.email && !values.phone && !values.mobile && !values.ext && !values.fax) return;
    if (editingContactIndex < 0) modal._payerDraft.contacts.push(values); else modal._payerDraft.contacts[editingContactIndex] = { ...modal._payerDraft.contacts[editingContactIndex], ...values };
    form.elements.namedItem('contactName').value = ''; form.elements.namedItem('contactEmail').value = ''; form.elements.namedItem('contactPhone').value = ''; form.elements.namedItem('contactExt').value = ''; form.elements.namedItem('contactMobile').value = ''; form.elements.namedItem('contactFax').value = ''; resetNestedEditors(); nestedTable('contact', modal._payerDraft);
  }
  function tpaValues() {
    return { id: `TPA-${String((editingTpaIndex < 0 ? modal._payerDraft.tpaRows.length : editingTpaIndex) + 1).padStart(3, '0')}`, name: form.elements.namedItem('tpaName').value, chiNumber: form.elements.namedItem('tpaChiNumber').value.trim(), startDate: form.elements.namedItem('tpaStartDate').value, endDate: form.elements.namedItem('tpaEndDate').value, dateComparisonType: form.elements.namedItem('tpaDateComparisonType').value, isDefault: form.elements.namedItem('tpaIsDefault').checked };
  }
  function addOrUpdateTpa() {
    const values = tpaValues();
    if (!values.name && !values.chiNumber && !values.startDate && !values.endDate && !values.dateComparisonType) return;
    if (values.isDefault) modal._payerDraft.tpaRows.forEach((item) => { item.isDefault = false; });
    if (editingTpaIndex < 0) modal._payerDraft.tpaRows.push(values); else modal._payerDraft.tpaRows[editingTpaIndex] = { ...modal._payerDraft.tpaRows[editingTpaIndex], ...values };
    for (const name of ['tpaName', 'tpaChiNumber', 'tpaStartDate', 'tpaEndDate', 'tpaDateComparisonType']) form.elements.namedItem(name).value = '';
    form.elements.namedItem('tpaIsDefault').checked = false; resetNestedEditors(); nestedTable('tpa', modal._payerDraft);
  }

  grid.querySelector('[data-payer-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.querySelectorAll('[data-payer-filter]').forEach((field) => field.addEventListener(field.matches('select') ? 'change' : 'input', () => { filters[field.dataset.payerFilter] = field.matches('select') ? field.value : field.value.trim().toLocaleLowerCase(); page = 1; closeMenus(); render(); }));
  grid.querySelectorAll('[data-payer-page]').forEach((button) => button.addEventListener('click', () => {
    const pages = Math.max(1, Math.ceil(matchingPayers().length / pageSize));
    if (button.dataset.payerPage === 'first') page = 1;
    if (button.dataset.payerPage === 'previous') page = Math.max(1, page - 1);
    if (button.dataset.payerPage === 'next') page = Math.min(pages, page + 1);
    if (button.dataset.payerPage === 'last') page = pages;
    closeMenus(); render();
  }));
  rows.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-payer-row-menu]');
    if (trigger) { const menu = trigger.parentElement.querySelector('.facility-row-menu'); const opening = menu.hidden; closeMenus(menu); menu.hidden = !opening; trigger.setAttribute('aria-expanded', String(opening)); return; }
    const action = event.target.closest('[data-payer-action]');
    if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const payer = payerById(action.dataset.payerId, action.dataset.facilityId); if (!payer) return;
    const rowTrigger = action.closest('.facility-row-action').querySelector('[data-payer-row-menu]'); closeMenus();
    if (action.dataset.payerAction === 'view' || action.dataset.payerAction === 'edit') { openModal(action.dataset.payerAction, payer, rowTrigger); return; }
    payer.active = !payer.active; persist(); render(); showToast(`${payer.englishName} is now ${payer.active ? 'active' : 'inactive'}.`);
  });
  modal.querySelector('[data-contact-add]').addEventListener('click', addOrUpdateContact);
  modal.querySelector('[data-tpa-add]').addEventListener('click', addOrUpdateTpa);
  modal.querySelector('[data-contact-rows]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-contact-edit]'); if (!button || mode === 'view') return;
    editingContactIndex = Number(button.dataset.contactEdit); const record = modal._payerDraft.contacts[editingContactIndex];
    for (const [name, value] of Object.entries({ contactName: record.contactName, contactEmail: record.email, contactPhoneCode: record.phoneCode, contactPhone: record.phone, contactExt: record.ext, contactMobileCode: record.mobileCode, contactMobile: record.mobile, contactFax: record.fax })) form.elements.namedItem(name).value = value || '';
    const control = modal.querySelector('[data-contact-add]'); control.textContent = 'Save Contact'; control.insertAdjacentHTML('afterbegin', icons.edit);
  });
  modal.querySelector('[data-tpa-rows]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-tpa-edit]'); if (!button || mode === 'view') return;
    editingTpaIndex = Number(button.dataset.tpaEdit); const record = modal._payerDraft.tpaRows[editingTpaIndex];
    for (const [name, value] of Object.entries({ tpaName: record.name, tpaChiNumber: record.chiNumber, tpaStartDate: record.startDate, tpaEndDate: record.endDate, tpaDateComparisonType: record.dateComparisonType })) form.elements.namedItem(name).value = value || '';
    form.elements.namedItem('tpaIsDefault').checked = Boolean(record.isDefault);
    const control = modal.querySelector('[data-tpa-add]'); control.textContent = 'Save TPA'; control.insertAdjacentHTML('afterbegin', icons.edit);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = { ...readFormFields(), hasTpa: form.elements.namedItem('hasTpa').checked, contacts: modal._payerDraft.contacts, tpaRows: modal._payerDraft.tpaRows };
    if (mode === 'new') {
      const assigned = organizationView ? [...modal.querySelectorAll('[data-payer-facilities] input:checked')].map((checkbox) => checkbox.value) : [facilityId];
      if (!assigned.length) { window.alert('Assign this payer to at least one facility.'); return; }
      assigned.forEach((fid) => payers.push({ ...clone(values), id: `payer-${crypto.randomUUID()}`, active: true, allowedContract: false, ...(organizationView ? { __facilityId: fid } : {}) }));
    } else { const payer = payerById(activeId, activeFacilityId); if (!payer) return; Object.assign(payer, values); }
    persist(); closeModal();
    if (mode === 'new') { grid.querySelectorAll('[data-payer-filter]').forEach((field) => { field.value = ''; }); filters = {}; page = Math.ceil(payers.length / pageSize); }
    render(); const createdCount = organizationView ? modal.querySelectorAll('[data-payer-facilities] input:checked').length : 1; showToast(mode === 'new' ? `${values.englishName || 'Payer'} was created for ${createdCount} ${createdCount === 1 ? 'facility' : 'facilities'}.` : `${values.englishName || 'Payer'} was updated successfully.`);
  });
  modal.querySelector('[data-payer-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-payer-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.facility-row-action')) closeMenus(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { if (!modal.hidden) closeModal(); else closeMenus(); }
    if (modal.hidden || event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled), select:not(:disabled)')];
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  });
  render();
})();
