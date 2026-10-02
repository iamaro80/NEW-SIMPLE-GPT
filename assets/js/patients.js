(() => {
  const rows = document.querySelector('#patients-rows');
  const search = document.querySelector('#patient-search');
  const count = document.querySelector('#patient-count');
  const empty = document.querySelector('#patients-empty');
  const modal = document.querySelector('#patient-modal');
  const form = document.querySelector('#patient-form');
  const title = document.querySelector('#patient-modal-title');
  const saveButton = document.querySelector('#patient-save');
  const toast = document.querySelector('#patient-toast');
  if (!rows || !form || !modal) return;

  let patients = [
    { mrn: '10000482', documentId: '1098456238', documentType: 'National ID', firstName: 'Amal', lastName: 'Demo', nationality: 'Saudi', eligibilityStatus: 'Eligible' },
    { mrn: '10000617', documentId: 'P90214567', documentType: 'Passport number', firstName: 'Nawal', lastName: 'Marwan', nationality: 'Jordanian', eligibilityStatus: 'Not checked' },
    { mrn: '10000803', documentId: '1087654641', documentType: 'National ID', firstName: 'Munirah', lastName: 'Saleh', nationality: 'Saudi', eligibilityStatus: 'Expired' },
    { mrn: '10000914', documentId: 'P30781290', documentType: 'Passport number', firstName: 'Reem', lastName: 'Mamdouh', nationality: 'Egyptian', eligibilityStatus: 'Not checked' },
    { mrn: '10001028', documentId: '1065432855', documentType: 'National ID', firstName: 'Hajar', lastName: 'Mohammed', nationality: 'Saudi', eligibilityStatus: 'Eligible' },
  ];
  let activeIndex = -1;
  let modalMode = 'new';
  let returnFocus = null;
  let toastTimer;

  const icons = {
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
  };

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const matches = patients.map((patient, index) => ({ patient, index })).filter(({ patient }) =>
      [patient.mrn, patient.documentId, patient.documentType, patient.firstName, patient.lastName, patient.nationality]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
    rows.innerHTML = matches.map(({ patient, index }) => {
      const statusClass = patient.eligibilityStatus === 'Eligible' ? 'is-eligible' : patient.eligibilityStatus === 'Ineligible' || patient.eligibilityStatus === 'Expired' ? 'is-ineligible' : '';
      return `<tr data-patient-index="${index}">
        <td class="patient-mrn">${escapeHtml(patient.mrn)}</td><td>${escapeHtml(patient.documentId)}</td><td>${escapeHtml(patient.documentType)}</td>
        <td>${escapeHtml(patient.firstName)}</td><td>${escapeHtml(patient.lastName)}</td><td>${escapeHtml(patient.nationality)}</td>
        <td><span class="eligibility-badge ${statusClass}">${escapeHtml(patient.eligibilityStatus || 'Not checked')}</span></td>
        <td><button class="eligibility-check" type="button" data-action="eligibility" data-index="${index}">Check eligibility</button></td>
        <td><div class="row-action-wrap"><button class="row-menu-trigger" type="button" aria-label="Actions for ${escapeHtml(patient.firstName)} ${escapeHtml(patient.lastName)}" aria-haspopup="menu" aria-expanded="false" data-action="menu" data-index="${index}">${icons.more}</button>
          <div class="row-menu" role="menu" hidden><button type="button" role="menuitem" data-action="view" data-index="${index}">${icons.eye}View</button><button type="button" role="menuitem" data-action="edit" data-index="${index}">${icons.edit}Edit</button><button type="button" role="menuitem" data-action="toggle-status" data-index="${index}">${icons.status}${patient.active === false ? 'Activate' : 'Deactivate'}</button></div></div></td>
      </tr>`;
    }).join('');
    count.textContent = `${matches.length} ${matches.length === 1 ? 'patient' : 'patients'}`;
    empty.hidden = matches.length !== 0;
  }

  function closeMenu(except) {
    rows.querySelectorAll('.row-menu').forEach((menu) => {
      if (menu !== except) {
        menu.hidden = true;
        menu.parentElement.querySelector('.row-menu-trigger').setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setReadOnly(readOnly) {
    [...form.elements].forEach((element) => {
      if (element.name) element.disabled = readOnly;
    });
    saveButton.hidden = readOnly;
  }

  function openModal(mode, index = -1) {
    modalMode = mode;
    activeIndex = index;
    returnFocus = document.activeElement;
    form.reset();
    setReadOnly(false);
    if (mode === 'new') {
      title.textContent = 'Register patient';
      saveButton.textContent = 'Save patient';
    } else {
      const patient = patients[index];
      title.textContent = mode === 'view' ? 'Patient details' : 'Edit patient';
      saveButton.textContent = 'Save changes';
      const recordData = patient.formData || {
        ...patient,
        systemType: 'HIDP - Insurance for Nationals / Residents',
        patientCountryCode: '+966', patientPhone: '500000000',
        gender: 'Unknown', maritalStatus: 'unkNown', occupation: 'Unknown',
        insurer: 'Tawuniya Cooperative Insurance Company', policy: 'Policy 1', plan: 'Plan 1',
        contactName: 'Emergency contact', contactCountryCode: '+966', contactPhone: '500000000', contactRelation: 'Parent',
      };
      Object.entries(recordData).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (!field) return;
        if (field.type === 'checkbox') field.checked = Boolean(value);
        else field.value = value ?? '';
      });
      if (mode === 'view') setReadOnly(true);
    }
    modal.hidden = false;
    document.body.classList.add('patient-modal-open');
    modal.querySelector('[data-close-modal]').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('patient-modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  document.querySelector('#register-patient').addEventListener('click', () => openModal('new'));
  modal.querySelector('[data-scroll-target]').addEventListener('click', (event) => {
    const target = document.getElementById(event.currentTarget.dataset.scrollTarget);
    if (!target) return;
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  });
  search.addEventListener('input', render);
  modal.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!modal.hidden) closeModal();
      else closeMenu();
    }
    if (event.key === 'Tab' && !modal.hidden) {
      const focusable = [...modal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  rows.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) { if (!event.target.closest('.row-action-wrap')) closeMenu(); return; }
    const index = Number(button.dataset.index);
    const action = button.dataset.action;
    if (action === 'menu') {
      const menu = button.parentElement.querySelector('.row-menu');
      const opening = menu.hidden;
      closeMenu(menu);
      menu.hidden = !opening;
      button.setAttribute('aria-expanded', String(opening));
    } else if (action === 'view' || action === 'edit') {
      closeMenu();
      openModal(action, index);
    } else if (action === 'toggle-status') {
      const patient = patients[index];
      patient.active = patient.active === false;
      render();
      showToast(`${patient.firstName} ${patient.lastName} ${patient.active ? 'activated' : 'deactivated'}.`);
    } else if (action === 'eligibility') {
      patients[index].eligibilityStatus = 'Eligible';
      patients[index].lastEligibilityCheck = new Date().toISOString();
      render();
      showToast('Demo eligibility check complete. Patient marked eligible.');
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const formData = {};
    [...form.elements].forEach((element) => {
      if (!element.name) return;
      formData[element.name] = element.type === 'checkbox' ? element.checked : element.value;
    });
    const existing = modalMode === 'edit' ? patients[activeIndex] : {};
    const patient = {
      ...existing,
      formData,
      mrn: formData.mrn,
      documentId: formData.documentId,
      documentType: formData.documentType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      nationality: formData.nationality,
      eligibilityStatus: existing.eligibilityStatus || 'Not checked',
      active: existing.active !== false,
    };
    if (modalMode === 'edit') patients[activeIndex] = patient;
    else patients.unshift(patient);
    render();
    closeModal();
    showToast(modalMode === 'edit' ? 'Patient changes saved.' : 'Patient registered successfully.');
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.row-action-wrap')) closeMenu();
  });
  render();
})();
