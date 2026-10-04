(() => {
  const grid = document.querySelector('[data-practitioners-grid]');
  if (!grid) return;

  const facilityId = document.body.dataset.currentFacilityId || '1';
  const storageKey = `rcm-facility-practitioners:v1:${facilityId}`;
  const departmentStorageKey = (id) => `rcm-facility-departments:v1:${id}`;
  const pageSize = 5;
  const roles = ['Doctor', 'Nurse', 'Pharmacist', 'Researcher', 'Teacher/educator', 'Dentist', 'Physiotherapist', 'Speechtherapist', 'ICT professional'];
  const documentTypes = ['National ID', 'Permanent Resident Card Number', 'Passport number', 'Visitor Permit', 'Medical record number', 'Border Number', 'Displaced person'];
  const specialties = ['Anesthesiology Specialty', 'Ambulatory Anesthesia', 'Anesthesia Cardiology', 'Neuro-Anesthesia', 'Obstetrics Anesthesia', 'Pediatrics Anesthesia', 'Pediatrics Cardiac Anesthesia', 'Regional Anesthesia', 'Vascular / Thoracic Anesthesia', 'Community Medicine Specialty', 'Community Health', 'Dermatology Specialty', 'Dermatology Surgery', 'Hair Implant Dermatology', 'Pediatrics Dermatology', 'Emergency Medicine Specialty', 'Adult Emergency Medicine'];
  const designations = ['Assistant Consultant', 'Assistant Family Therapist II', 'Assistant Psychologist', 'Associate Consultant', 'Board Certified Physician', 'Chairman Medical Imaging', 'Chairman Pediatrics', 'Chief of Medical Staff', 'Clinical Psychologist I', 'Clinical Psychologist II', 'Clinical Scientist', 'Consultant', 'Cytologist', 'PhD', 'IAC', 'Dental Hygienist', 'Dentist', 'Division Head', 'Emergency Consultant'];
  const users = ['admin', 'test22', 'service-account-realm-admin'];
  const consultationItems = ['(90487-002) ANTENATAL C.T.G. (30 MIN)', '(182519) MYELIN OLIGODENDROCYTE GLYCOPROTEIN ABS TO BIO', '(182476) CENTO ARRAY CYTO HD TO CENTOGENE', '(182453) MSI BY PCR (MICROSATELLITE INSTABILITY BY PCR)', '(182436) CASPR 2 AB', '(182411) MYELOPROLIFERATIVE NEOPLASM (CALR)', '(182407) BRAF (SEND OUT TO UNILABS)', '(182402) NRAS (SEND OUT TO UNILABS)', '(182343) ONCOTYPE DX TEST', '(182264) BRAF-PCR', '(181809) DNA EXTRACTION FOR BANKING', '(132137) KAPPA'];
  const seed = [
    { documentId: '1093847562', englishName: 'Lina Alharbi', arabicName: 'لينا الحربي', departmentCodes: ['DPT-001'], role: 'Doctor', documentType: 'National ID', mobileCode: '+966', mobile: '550123456', phoneCode: '+966', phone: '112345678', prefix: 'Dr.', degree: 'MBBS', licenseNumber: 'SCFHS-48271', licenseStart: '2024-01-01', licenseEnd: '2027-12-31', specialty: 'Community Health', designation: 'Consultant', user: 'admin', followUp: '', lastDesignationUpdate: '2025-06-12', active: true },
    { documentId: '1082763451', englishName: 'Omar Alotaibi', arabicName: 'عمر العتيبي', departmentCodes: ['DPT-002', 'DPT-006'], role: 'Doctor', documentType: 'National ID', mobileCode: '+966', mobile: '551234678', phoneCode: '+966', phone: '', prefix: 'Dr.', degree: 'MD', licenseNumber: 'SCFHS-39184', licenseStart: '2023-09-01', licenseEnd: '2026-08-31', specialty: 'Emergency Medicine Specialty', designation: 'Emergency Consultant', user: 'test22', followUp: '', lastDesignationUpdate: '2025-03-04', active: true },
    { documentId: '1071654328', englishName: 'Maha Alqahtani', arabicName: 'مها القحطاني', departmentCodes: ['DPT-003'], role: 'Nurse', documentType: 'National ID', mobileCode: '+966', mobile: '552345789', phoneCode: '+966', phone: '', prefix: 'Ms.', degree: 'BSN', licenseNumber: 'SCFHS-51829', licenseStart: '2025-02-01', licenseEnd: '2028-01-31', specialty: 'Community Health', designation: 'Clinical Scientist', user: '', followUp: '', lastDesignationUpdate: '2025-05-19', active: true },
    { documentId: '1069382714', englishName: 'Yousef Almutairi', arabicName: 'يوسف المطيري', departmentCodes: ['DPT-004'], role: 'Pharmacist', documentType: 'National ID', mobileCode: '+966', mobile: '553456890', phoneCode: '+966', phone: '', prefix: 'Mr.', degree: 'PharmD', licenseNumber: 'SCFHS-62045', licenseStart: '2024-06-01', licenseEnd: '2027-05-31', specialty: 'Community Medicine Specialty', designation: 'Associate Consultant', user: '', followUp: '', lastDesignationUpdate: '2024-11-08', active: true },
    { documentId: '1058273649', englishName: 'Sara Alshammari', arabicName: 'سارة الشمري', departmentCodes: ['DPT-005', 'DPT-006'], role: 'Doctor', documentType: 'National ID', mobileCode: '+966', mobile: '554567901', phoneCode: '+966', phone: '', prefix: 'Dr.', degree: 'MBBS', licenseNumber: 'SCFHS-74413', licenseStart: '2022-11-01', licenseEnd: '2025-10-31', specialty: 'Adult Emergency Medicine', designation: 'Assistant Consultant', user: '', followUp: '', lastDesignationUpdate: '2024-02-14', active: false },
    { documentId: '1047162538', englishName: 'Khalid Alzahrani', arabicName: 'خالد الزهراني', departmentCodes: ['DPT-001', 'DPT-003'], role: 'Physiotherapist', documentType: 'National ID', mobileCode: '+966', mobile: '555678012', phoneCode: '+966', phone: '', prefix: 'Mr.', degree: 'DPT', licenseNumber: 'SCFHS-83620', licenseStart: '2025-04-01', licenseEnd: '2028-03-31', specialty: 'Community Medicine Specialty', designation: 'Clinical Scientist', user: '', followUp: '', lastDesignationUpdate: '2025-04-07', active: true },
  ].map((record) => ({ ...record, facilityId: String(facilityId) }));
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };
  const selectOptions = (items, placeholder) => `<option value="">${placeholder}</option>${items.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('')}`;
  function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
  const facilityStore = window.RcmFacilityStore;
  function loadFacilities() {
    const storedFacilities = facilityStore?.list?.() || [];
    return storedFacilities.length ? storedFacilities : [{ id: Number(facilityId), englishName: 'Current Facility', active: true }];
  }
  let facilities = loadFacilities();
  const facilityCache = new Map(facilities.map((facility) => [String(facility.id), facility]));
  const currentFacility = facilityCache.get(String(facilityId)) || { id: facilityId, englishName: 'Current Facility' };
  const departmentCache = new Map();
  function departmentRecordsFor(targetFacilityId) {
    const id = String(targetFacilityId || '');
    if (departmentCache.has(id)) return departmentCache.get(id);
    try {
      const data = JSON.parse(localStorage.getItem(departmentStorageKey(id)) || 'null');
      if (Array.isArray(data)) { departmentCache.set(id, data); return data; }
    } catch { /* Keep this facility's department list empty until configured. */ }
    if (id !== String(facilityId)) { departmentCache.set(id, []); return []; }
    return [
      { code: 'DPT-001', name: 'Ambulatory Care Clinic' }, { code: 'DPT-002', name: 'Emergency Department' },
      { code: 'DPT-003', name: 'Internal Medicine Ward' }, { code: 'DPT-004', name: 'Outpatient Pharmacy' },
      { code: 'DPT-005', name: 'Clinical Laboratory' }, { code: 'DPT-006', name: 'Diagnostic Imaging' },
    ];
  }
  function loadRecords() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (Array.isArray(data)) {
        const migrated = data.map((record) => ({ ...record, facilityId: String(facilityId), departmentCodes: Array.isArray(record.departmentCodes) ? record.departmentCodes : [] }));
        if (migrated.some((record, index) => record.facilityId !== String(data[index].facilityId || ''))) localStorage.setItem(storageKey, JSON.stringify(migrated));
        return migrated;
      }
    } catch { /* Seed below. */ }
    try { localStorage.setItem(storageKey, JSON.stringify(seed)); } catch { /* Keep seed in memory. */ }
    return seed.map((record) => ({ ...record, departmentCodes: [...record.departmentCodes] }));
  }
  let departments = departmentRecordsFor(facilityId);
  let selectedFormFacilityId = String(facilityId);
  let records = loadRecords();
  let currentPage = 1;
  let mode = 'new';
  let activeDocumentId = null;
  let returnFocus = null;
  let toastTimer;
  let appliedFilters = {};
  const toast = document.querySelector('[data-facility-toast]');

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-practitioner-add>${icons.add}Add Practitioner</button></div>
    <div class="branches-filter-grid practitioner-filter-grid" role="search" aria-label="Filter practitioners">
      <label class="facility-filter"><span>Document ID</span><input type="search" data-practitioner-filter="documentId" placeholder="Search document ID"></label>
      <label class="facility-filter"><span>English Name</span><input type="search" data-practitioner-filter="englishName" placeholder="Search name"></label>
      <label class="facility-filter"><span>Department</span><select data-practitioner-filter="department"><option value="">All departments</option></select></label>
      <label class="facility-filter"><span>Practitioner Role</span><select data-practitioner-filter="role">${selectOptions(roles, 'All roles')}</select></label>
      <label class="facility-filter"><span>Specialty</span><input type="search" data-practitioner-filter="specialty" placeholder="Search specialty"></label>
      <label class="facility-filter"><span>Designation</span><input type="search" data-practitioner-filter="designation" placeholder="Search designation"></label>
      <label class="facility-filter"><span>Status</span><select data-practitioner-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div></div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table practitioners-table"><thead><tr><th>Document ID</th><th>English Name</th><th>Department(s)</th><th>Practitioner Role</th><th>Specialty</th><th>Designation</th><th>Status</th><th>Actions</th></tr></thead><tbody data-practitioner-rows></tbody></table></div><div class="facility-empty" data-practitioner-empty hidden>No practitioners match your filters.</div><footer class="facility-pagination"><span data-practitioner-result-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-practitioner-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-practitioner-page="previous" aria-label="Previous page">‹</button><span data-practitioner-page-label></span><button class="icon-button" type="button" data-practitioner-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-practitioner-page="last" aria-label="Last page">»</button></div></footer></div>`;
  const modal = document.createElement('div');
  modal.className = 'patient-modal-backdrop'; modal.id = 'practitioner-modal'; modal.hidden = true;
  modal.innerHTML = `<section class="patient-modal practitioner-modal" role="dialog" aria-modal="true" aria-labelledby="practitioner-modal-title" aria-describedby="practitioner-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">PRACTITIONER RECORD</p><h2 id="practitioner-modal-title">Add Practitioner</h2><p id="practitioner-modal-description">Enter practitioner information.</p></div><button class="icon-button" type="button" data-practitioner-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
    <form data-practitioner-form><div class="patient-modal-body">
      <fieldset class="patient-form-section practitioner-section"><legend class="sr-only">Facility Assignment</legend><div class="facility-form-section-heading">Facility Assignment</div><div class="patient-form-grid practitioner-form-grid">
        <label class="form-field"><span>Facility</span><input name="facilityDisplay" readonly aria-readonly="true" value="${escapeHtml(currentFacility.englishName || `Facility ${facilityId}`)}"><input type="hidden" name="facilityId" value="${escapeHtml(facilityId)}"></label>
        <div class="form-field practitioner-department-field"><span>Departments <b>*</b></span><input type="search" data-department-search placeholder="Search departments" aria-label="Search departments"><div class="practitioner-department-options" data-department-options role="group" aria-label="Select departments"></div><small>Select one or more departments from the chosen facility.</small></div>
      </div></fieldset>
      <fieldset class="patient-form-section practitioner-section"><legend class="sr-only">Practitioner Data</legend><div class="facility-form-section-heading">Practitioner Data</div><div class="patient-form-grid practitioner-form-grid">
        <label class="form-field"><span>English Name <b>*</b></span><input name="englishName" required autocomplete="off"></label>
        <label class="form-field"><span>Arabic Name</span><input name="arabicName" dir="rtl" autocomplete="off"></label>
        <label class="form-field"><span>Email</span><input name="email" type="email" autocomplete="off"></label>
        <label class="form-field"><span>Mobile Number</span><span class="phone-control"><select name="mobileCode" aria-label="Mobile country code"><option selected>+966</option><option>+962</option><option>+20</option><option>+1</option><option>+44</option></select><input name="mobile" type="tel"></span></label>
        <label class="form-field"><span>Phone Number</span><span class="phone-control"><select name="phoneCode" aria-label="Phone country code"><option selected>+966</option><option>+962</option><option>+20</option><option>+1</option><option>+44</option></select><input name="phone" type="tel"></span></label>
        <label class="form-field"><span>Ext.</span><input name="extension"></label>
        <label class="form-field"><span>Practitioner Role <b>*</b></span><select name="role" required>${selectOptions(roles, 'Select role')}</select></label>
        <label class="form-field"><span>Document ID <b>*</b></span><input name="documentId" required autocomplete="off"></label>
        <label class="form-field"><span>Document Type <b>*</b></span><select name="documentType" required>${selectOptions(documentTypes, 'Select document type')}</select></label>
        <label class="form-field"><span>Prefix</span><input name="prefix"></label>
        <label class="form-field"><span>Degree</span><input name="degree"></label>
        <label class="form-field"><span>License Number</span><input name="licenseNumber"></label>
        <label class="form-field"><span>License Start</span><input name="licenseStart" type="date"></label>
        <label class="form-field"><span>License End</span><input name="licenseEnd" type="date"></label>
        <label class="form-field"><span>User</span><select name="user">${selectOptions(users, 'Select user')}</select></label>
        <label class="form-field"><span>Consultation Item</span><select name="consultationItem">${selectOptions(consultationItems, 'Search or select consultation item')}</select></label>
        <label class="form-field"><span>Follow Up</span><select name="followUp">${selectOptions(consultationItems.slice(0, 6), 'Select follow up item')}</select></label>
        <label class="form-field"><span>Last Designation Update On</span><input name="lastDesignationUpdate" readonly value="—"></label>
      </div></fieldset>
      <fieldset class="patient-form-section practitioner-section"><legend class="sr-only">Practitioner Role Details</legend><div class="facility-form-section-heading">Practitioner Role Details</div><div class="patient-form-grid practitioner-form-grid">
        <label class="form-field"><span>Practitioner Specialty <b>*</b></span><select name="specialty" required>${selectOptions(specialties, 'Select specialty')}</select></label>
        <label class="form-field"><span>Designation <b>*</b></span><select name="designation" required>${selectOptions(designations, 'Select designation')}</select></label>
      </div></fieldset>
      <fieldset class="patient-form-section practitioner-section"><legend class="sr-only">SCFHS Details</legend><div class="facility-form-section-heading">SCFHS Details</div><div class="patient-form-grid practitioner-form-grid">
        ${[['scfhsCategoryCode','Category Code'],['scfhsCategoryNameEn','Category Name En'],['scfhsSpecialityCode','Speciality Code'],['scfhsSpecialityNameEn','Speciality Name En'],['scfhsCategoryNameAr','Category Name Ar'],['scfhsSpecialityNameAr','Speciality Name Ar']].map(([name,label]) => `<label class="form-field"><span>${label}</span><input name="${name}" readonly value="—"></label>`).join('')}
      </div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-practitioner-cancel>Cancel</button><button type="submit" class="button button-primary" data-practitioner-save>Create</button></div></footer></form></section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-practitioner-form]');
  const rows = grid.querySelector('[data-practitioner-rows]');
  const searchDepartment = form.querySelector('[data-department-search]');
  const departmentOptions = form.querySelector('[data-department-options]');
  const valuesToSave = ['facilityId','documentId','englishName','arabicName','email','mobileCode','mobile','phoneCode','phone','extension','role','documentType','prefix','degree','licenseNumber','licenseStart','licenseEnd','user','consultationItem','followUp','lastDesignationUpdate','specialty','designation'];
  const scfhsFields = ['scfhsCategoryCode','scfhsCategoryNameEn','scfhsSpecialityCode','scfhsSpecialityNameEn','scfhsCategoryNameAr','scfhsSpecialityNameAr'];
  const allFields = [...valuesToSave, ...scfhsFields];

  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep changes in memory if storage is unavailable. */ } }
  function showToast(message) { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2300); }
  function facilityName(id) { return facilityCache.get(String(id))?.englishName || `Facility ${id}`; }
  function departmentName(code, targetFacilityId = selectedFormFacilityId) {
    const source = departmentRecordsFor(targetFacilityId);
    return source.find((item) => String(item.code) === String(code))?.name || source.find((item) => String(item.code) === String(code))?.englishName || `Department ${code}`;
  }
  function selectedDepartments() { return [...departmentOptions.querySelectorAll('input:checked')].map((input) => input.value); }
  function drawDepartmentChoices(selected = selectedDepartments()) {
    const query = searchDepartment.value.trim().toLocaleLowerCase();
    const filtered = departments.filter((department) => departmentName(department.code, selectedFormFacilityId).toLocaleLowerCase().includes(query));
    departmentOptions.innerHTML = filtered.length ? filtered.map((department) => `<label class="form-check"><input type="checkbox" value="${escapeHtml(department.code)}" ${selected.includes(String(department.code)) ? 'checked' : ''}><span>${escapeHtml(departmentName(department.code, selectedFormFacilityId))}</span></label>`).join('') : `<span class="practitioner-no-departments">${facilityRecordsFor(selectedFormFacilityId).length ? 'No departments are configured for this facility.' : 'No departments found.'}</span>`;
    departmentOptions.querySelectorAll('input').forEach((input) => input.addEventListener('change', validateDepartmentSelection));
    validateDepartmentSelection();
  }
  function validateDepartmentSelection() { searchDepartment.setCustomValidity(selectedDepartments().length ? '' : 'Select at least one department.'); }
  function readFilters() { return Object.fromEntries([...grid.querySelectorAll('[data-practitioner-filter]')].map((field) => [field.dataset.practitionerFilter, field.value.trim().toLocaleLowerCase()])); }
  function filteredRecords() {
    return records.filter((record) => {
      const textMatch = ['documentId','englishName','role','specialty','designation'].every((key) => !appliedFilters[key] || String(record[key] || '').toLocaleLowerCase().includes(appliedFilters[key]));
      const [departmentFacilityId, departmentCode] = (appliedFilters.department || '').split('::');
      const deptMatch = !departmentCode || (String(record.facilityId) === departmentFacilityId && record.departmentCodes.some((code) => String(code).toLocaleLowerCase() === departmentCode));
      const statusMatch = !appliedFilters.status || String(Boolean(record.active)) === String(appliedFilters.status === 'active');
      return textMatch && deptMatch && statusMatch;
    });
  }
  function closeMenus(except) { rows.querySelectorAll('.facility-row-menu').forEach((menu) => { if (menu !== except) { menu.hidden = true; menu.parentElement.querySelector('[data-practitioner-row-menu]').setAttribute('aria-expanded','false'); } }); }
  function render() {
    const matches = filteredRecords();
    const pages = Math.max(1, Math.ceil(matches.length / pageSize)); currentPage = Math.min(currentPage, pages);
    const visible = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    rows.innerHTML = visible.map((record) => `<tr><td class="branch-code">${escapeHtml(record.documentId)}</td><td><span class="facility-name-en">${escapeHtml(record.englishName)}</span><small class="practitioner-arabic-name" dir="rtl">${escapeHtml(record.arabicName || '')}</small></td><td>${record.departmentCodes.map((code) => `<span class="practitioner-department-chip">${escapeHtml(departmentName(code, record.facilityId))}</span>`).join(' ') || '—'}</td><td>${escapeHtml(record.role)}</td><td>${escapeHtml(record.specialty)}</td><td>${escapeHtml(record.designation)}</td><td><span class="facility-status ${record.active ? 'is-active' : 'is-inactive'}"><span></span>${record.active ? 'Active' : 'Inactive'}</span></td><td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-practitioner-row-menu aria-label="Actions for ${escapeHtml(record.englishName)}" aria-haspopup="menu" aria-expanded="false" data-document-id="${escapeHtml(record.documentId)}">${icons.more}</button><div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-practitioner-action="view" data-document-id="${escapeHtml(record.documentId)}">${icons.eye}View</button><button type="button" role="menuitem" data-practitioner-action="edit" data-document-id="${escapeHtml(record.documentId)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-practitioner-action="status" data-document-id="${escapeHtml(record.documentId)}">${icons.status}${record.active ? 'Deactivate' : 'Activate'}</button></div></div></td></tr>`).join('');
    grid.querySelector('[data-practitioner-empty]').hidden = matches.length > 0;
    grid.querySelector('[data-practitioner-result-count]').textContent = `Total Results: ${matches.length}`;
    grid.querySelector('[data-practitioner-page-label]').textContent = `Page ${matches.length ? currentPage : 0} of ${matches.length ? pages : 0}`;
    grid.querySelectorAll('[data-practitioner-page]').forEach((button) => { const start = ['first','previous'].includes(button.dataset.practitionerPage); button.disabled = !matches.length || (start ? currentPage === 1 : currentPage === pages); });
  }
  function updateFilterDepartments() {
    const field = grid.querySelector('[data-practitioner-filter="department"]'); const previous = field.value;
    const id = String(facilityId);
    const options = departmentRecordsFor(id).map((item) => ({ value: `${id}::${item.code}`, label: departmentName(item.code, id) }));
    field.innerHTML = `<option value="">All departments</option>${options.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join('')}`;
    if (options.some((item) => item.value.toLocaleLowerCase() === previous)) field.value = previous;
    else field.value = '';
  }
  function facilityRecordsFor(id) { return facilities.filter((facility) => String(facility.id) === String(id)); }
  function setFormFacility(id, selected = []) {
    selectedFormFacilityId = String(facilityId);
    form.elements.namedItem('facilityId').value = selectedFormFacilityId;
    form.elements.namedItem('facilityDisplay').value = facilityName(facilityId);
    departments = departmentRecordsFor(selectedFormFacilityId);
    searchDepartment.value = '';
    drawDepartmentChoices(selected);
  }
  function refreshFacilityOptions() {
    facilities = loadFacilities();
    facilityCache.clear(); facilities.forEach((facility) => facilityCache.set(String(facility.id), facility));
    facilityCache.set(String(facilityId), facilities.find((facility) => String(facility.id) === String(facilityId)) || currentFacility);
    form.elements.namedItem('facilityDisplay').value = facilityName(facilityId);
    departments = departmentRecordsFor(facilityId);
    selectedFormFacilityId = String(facilityId);
    updateFilterDepartments();
  }
  function setReadOnly(readonly) {
    form.querySelectorAll('input,select').forEach((field) => { if (!field.readOnly) field.disabled = readonly; });
    form.querySelector('[data-practitioner-save]').hidden = readonly;
    form.querySelector('[data-practitioner-cancel]').textContent = readonly ? 'Back' : 'Cancel';
  }
  function openModal(nextMode, record = null, trigger = document.activeElement) {
    mode = nextMode; activeDocumentId = record?.documentId || null; returnFocus = trigger;
    form.reset(); setReadOnly(false);
    const isNew = nextMode === 'new';
    modal.querySelector('#practitioner-modal-title').textContent = isNew ? 'Add Practitioner' : nextMode === 'view' ? 'Practitioner Details' : 'Edit Practitioner';
    modal.querySelector('#practitioner-modal-description').textContent = isNew ? 'Enter practitioner information.' : nextMode === 'view' ? 'Review practitioner information.' : 'Update practitioner information.';
    modal.querySelector('[data-practitioner-save]').textContent = isNew ? 'Create' : 'Save changes';
    form.querySelectorAll('option[data-existing-value]').forEach((option) => option.remove());
    allFields.forEach((name) => {
      const field = form.elements.namedItem(name);
      const fallback = ['mobileCode', 'phoneCode'].includes(name) ? '+966' : ['lastDesignationUpdate', ...scfhsFields].includes(name) ? '—' : '';
      const value = isNew ? fallback : (record?.[name] || fallback);
      if (field instanceof HTMLSelectElement && value && ![...field.options].some((option) => option.value === value)) {
        const existingOption = new Option(`${value} (saved value)`, value);
        existingOption.dataset.existingValue = 'true';
        field.add(existingOption);
      }
      field.value = value;
    });
    setFormFacility(isNew ? String(facilityId) : record.facilityId || facilityId, isNew ? [] : record.departmentCodes || []);
    if (nextMode === 'view') setReadOnly(true);
    modal.hidden = false; document.body.classList.add('patient-modal-open'); modal.querySelector('[data-practitioner-close]').focus();
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('patient-modal-open'); if (returnFocus?.isConnected) returnFocus.focus(); }

  grid.querySelectorAll('[data-practitioner-filter]').forEach((field) => field.addEventListener(field.matches('select') ? 'change' : 'input', () => {
    appliedFilters = readFilters();
    currentPage = 1; closeMenus(); render();
  }));
  grid.querySelector('[data-practitioner-add]').addEventListener('click', (event) => openModal('new', null, event.currentTarget));
  grid.querySelectorAll('[data-practitioner-page]').forEach((button) => button.addEventListener('click', () => { const pages = Math.max(1, Math.ceil(filteredRecords().length / pageSize)); if (button.dataset.practitionerPage === 'first') currentPage = 1; if (button.dataset.practitionerPage === 'previous') currentPage = Math.max(1, currentPage - 1); if (button.dataset.practitionerPage === 'next') currentPage = Math.min(pages, currentPage + 1); if (button.dataset.practitionerPage === 'last') currentPage = pages; closeMenus(); render(); }));
  searchDepartment.addEventListener('input', () => drawDepartmentChoices());
  departmentOptions.addEventListener('change', validateDepartmentSelection);
  rows.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-practitioner-row-menu]');
    if (trigger) { const menu = trigger.parentElement.querySelector('.facility-row-menu'); const opening = menu.hidden; closeMenus(menu); menu.hidden = !opening; trigger.setAttribute('aria-expanded', String(opening)); return; }
    const action = event.target.closest('[data-practitioner-action]'); if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const record = records.find((item) => item.documentId === action.dataset.documentId); if (!record) return;
    const focus = action.closest('.facility-row-action').querySelector('[data-practitioner-row-menu]');
    if (['view','edit'].includes(action.dataset.practitionerAction)) { closeMenus(); openModal(action.dataset.practitionerAction, record, focus); return; }
    record.active = !record.active; persist(); render(); showToast(`${record.englishName} is now ${record.active ? 'active' : 'inactive'}.`);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault(); validateDepartmentSelection(); if (!form.reportValidity()) return;
    const values = Object.fromEntries(allFields.map((name) => [name, form.elements.namedItem(name).value.trim()]));
    values.departmentCodes = selectedDepartments();
    if (mode === 'new') { if (records.some((record) => record.documentId === values.documentId)) { form.elements.namedItem('documentId').setCustomValidity('A practitioner with this Document ID already exists.'); form.reportValidity(); return; } values.active = true; records.push(values); }
    else { const record = records.find((item) => item.documentId === activeDocumentId); if (!record) return; if (records.some((item) => item !== record && item.documentId === values.documentId)) { form.elements.namedItem('documentId').setCustomValidity('A practitioner with this Document ID already exists.'); form.reportValidity(); return; } Object.assign(record, values); }
    persist(); grid.querySelectorAll('[data-practitioner-filter]').forEach((field) => { field.value = ''; }); appliedFilters = {}; currentPage = Math.ceil(records.length / pageSize); closeModal(); render(); showToast(`${values.englishName} was ${mode === 'new' ? 'created' : 'updated'} successfully.`);
  });
  form.elements.namedItem('documentId').addEventListener('input', (event) => event.currentTarget.setCustomValidity(''));
  modal.querySelector('[data-practitioner-close]').addEventListener('click', closeModal);
  modal.querySelector('[data-practitioner-cancel]').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.facility-row-action')) closeMenus(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (!modal.hidden) closeModal(); else closeMenus(); } if (modal.hidden || event.key !== 'Tab') return; const focusable = [...modal.querySelectorAll('button:not([hidden]):not(:disabled),input:not(:disabled),select:not(:disabled)')]; if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); } });
  function updateDepartments(targetFacilityId, nextDepartments) {
    if (!Array.isArray(nextDepartments)) return;
    departmentCache.set(String(targetFacilityId), nextDepartments);
    if (String(targetFacilityId) === selectedFormFacilityId) { departments = nextDepartments; drawDepartmentChoices(); }
    updateFilterDepartments(); render();
  }
  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith('rcm-facility-departments:v1:') && event.newValue) {
      try { updateDepartments(event.key.slice('rcm-facility-departments:v1:'.length), JSON.parse(event.newValue)); } catch { /* Ignore invalid updates. */ }
    }
    if (event.key === storageKey && event.newValue) { try { const updated = JSON.parse(event.newValue); if (Array.isArray(updated)) { records = updated; render(); } } catch { /* Ignore invalid updates. */ } }
  });
  window.addEventListener('rcm:departments-changed', (event) => { if (Array.isArray(event.detail?.departments)) updateDepartments(event.detail.facilityId, event.detail.departments); });
  window.addEventListener('rcm:facilities-changed', () => refreshFacilityOptions());
  updateFilterDepartments(); appliedFilters = readFilters(); render();
})();
