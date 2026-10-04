(() => {
  const grid = document.querySelector('[data-users-grid]');
  if (!grid) return;

  const facilityId = String(document.body.dataset.currentFacilityId || '1');
  const storageKey = `rcm-facility-users:v1:${facilityId}`;
  const facility = (window.RcmFacilityStore?.list?.() || []).find((item) => String(item.id) === facilityId) || { id: facilityId, englishName: 'Current Facility' };
  const branchKey = `rcm-facility-branches:v1:${facilityId}`;
  const usersSeed = [
    { username: 'a.alotaibi', englishName: 'Amal Alotaibi', arabicName: 'أمل العتيبي', email: 'amal.alotaibi@example.com', mobileCode: '+966', mobile: '501234567', userType: 'Employee', branchCode: '1', notes: '', active: true, roleIds: [] },
    { username: 'k.alharbi', englishName: 'Khalid Alharbi', arabicName: 'خالد الحربي', email: 'khalid.alharbi@example.com', mobileCode: '+966', mobile: '502345678', userType: 'Business Center', branchCode: '2', notes: '', active: true, roleIds: [] },
    { username: 'n.aldosari', englishName: 'Noura Aldosari', arabicName: 'نورة الدوسري', email: 'noura.aldosari@example.com', mobileCode: '+966', mobile: '503456789', userType: 'System Administrator', branchCode: '1', notes: '', active: true, roleIds: [] },
    { username: 'f.alqahtani', englishName: 'Faisal Alqahtani', arabicName: 'فيصل القحطاني', email: 'faisal.alqahtani@example.com', mobileCode: '+966', mobile: '504567890', userType: 'Overtimer', branchCode: '3', notes: '', active: false, roleIds: [] },
    { username: 's.alshammari', englishName: 'Sara Alshammari', arabicName: 'سارة الشمري', email: 'sara.alshammari@example.com', mobileCode: '+966', mobile: '505678901', userType: 'Employee', branchCode: '4', notes: '', active: true, roleIds: [] },
  ].map((record) => ({ ...record, facilityId }));
  const userTypes = ['Business Center', 'Overtimer', 'System Administrator', 'Employee'];
  const icons = {
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v8M6.4 6.4a8 8 0 1 0 11.2 0"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="8" cy="15" r="5"/><path d="m11.5 11.5 8-8 2 2-2 2 2 2-3 3-2-2-2 2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></svg>',
  };
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const branches = loadBranches();
  let users = loadUsers();
  let page = 1;
  let pageSize = 8;
  let mode = 'new';
  let currentUsername = null;
  let returnFocus = null;
  let toastTimer;
  let appliedFilters = {};

  grid.innerHTML = `<div class="branches-toolbar"><div class="branches-add-row"><button class="button button-primary" type="button" data-user-add>${icons.add}Add User</button></div>
    <div class="branches-filter-grid users-filter-grid" role="search" aria-label="Filter users">
      <label class="facility-filter"><span>User Name</span><input type="search" data-user-filter="username" placeholder="Search user name"></label>
      <label class="facility-filter"><span>English Name</span><input type="search" data-user-filter="englishName" placeholder="Search name"></label>
      <label class="facility-filter"><span>Arabic Name</span><input type="search" data-user-filter="arabicName" placeholder="Search Arabic name" dir="rtl"></label>
      <label class="facility-filter"><span>Email</span><input type="search" data-user-filter="email" placeholder="Search email"></label>
      <label class="facility-filter"><span>User Type</span><select data-user-filter="userType"><option value="">All user types</option>${userTypes.map((item) => `<option>${escapeHtml(item)}</option>`).join('')}</select></label>
      <label class="facility-filter"><span>Branch</span><select data-user-filter="branchCode"><option value="">All branches</option>${branches.map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.englishName)}</option>`).join('')}</select></label>
      <label class="facility-filter"><span>Status</span><select data-user-filter="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div></div>
    <div class="facility-table-card"><div class="facility-table-scroll"><table class="facility-table users-table"><thead><tr><th>User Name</th><th>English Name</th><th>Email</th><th>Mobile Number</th><th>User Type</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead><tbody data-user-rows></tbody></table></div>
      <div class="facility-empty" data-user-empty hidden>No users match your filters.</div><footer class="facility-pagination"><span data-user-result-count></span><div class="facility-page-controls"><button class="icon-button" type="button" data-user-page="first" aria-label="First page">«</button><button class="icon-button" type="button" data-user-page="previous" aria-label="Previous page">‹</button><span data-user-page-label></span><button class="icon-button" type="button" data-user-page="next" aria-label="Next page">›</button><button class="icon-button" type="button" data-user-page="last" aria-label="Last page">»</button></div></footer></div>`;

  const userModal = document.createElement('div');
  userModal.className = 'patient-modal-backdrop'; userModal.id = 'user-modal'; userModal.hidden = true;
  userModal.innerHTML = `<section class="patient-modal user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title" aria-describedby="user-modal-description"><header class="patient-modal-header"><div><p class="eyebrow">USER RECORD</p><h2 id="user-modal-title">Add User</h2><p id="user-modal-description">Enter user information and facility assignment.</p></div><button class="icon-button" type="button" data-user-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
    <form data-user-form><div class="patient-modal-body">
      <fieldset class="patient-form-section user-section"><legend class="sr-only">User Information</legend><div class="facility-form-section-heading">User Information</div><div class="patient-form-grid user-form-grid">
        <label class="form-field"><span>Arabic Name <b>*</b></span><input name="arabicName" dir="rtl" required autocomplete="off"></label>
        <label class="form-field"><span>English Name <b>*</b></span><input name="englishName" required autocomplete="off"></label>
        <label class="form-field"><span>User Name <b>*</b></span><input name="username" required autocomplete="off"></label>
        <label class="form-field"><span>Email <b>*</b></span><input name="email" type="email" required autocomplete="off"></label>
        <label class="form-field"><span>Mobile Number <b>*</b></span><span class="phone-control"><select name="mobileCode" aria-label="Mobile country code"><option selected>+966</option><option>+962</option><option>+20</option><option>+1</option><option>+44</option></select><input name="mobile" type="tel" required autocomplete="tel-national"></span></label>
        <label class="form-field"><span>User Type <b>*</b></span><select name="userType" required><option value="">Select user type</option>${userTypes.map((item) => `<option>${escapeHtml(item)}</option>`).join('')}</select></label>
        <label class="form-field user-notes"><span>Notes</span><textarea name="notes" rows="3"></textarea></label>
      </div></fieldset>
      <fieldset class="patient-form-section user-section"><legend class="sr-only">Facility Assignment</legend><div class="facility-form-section-heading">Facility Assignment</div><div class="patient-form-grid user-form-grid">
        <label class="form-field"><span>Facility</span><input name="facilityName" readonly value="${escapeHtml(facility.englishName || 'Current Facility')}" aria-readonly="true"></label>
        <label class="form-field"><span>Branch</span><select name="branchCode"><option value="">No branch assigned</option>${branches.map((item) => `<option value="${escapeHtml(item.code)}">(${escapeHtml(item.code)}) ${escapeHtml(item.englishName)}</option>`).join('')}</select></label>
      </div></fieldset>
    </div><footer class="patient-modal-footer"><span class="required-hint"><b>*</b> Required fields</span><div><button type="button" class="button button-secondary" data-user-cancel>Cancel</button><button type="submit" class="button button-primary" data-user-save>Create</button></div></footer></form></section>`;
  document.body.append(userModal);

  const passwordModal = createSimpleModal('password', 'Set Password', 'Set a prototype password for this user.', `<label class="form-field"><span>Password <b>*</b></span><input name="password" type="password" required autocomplete="new-password"></label><label class="form-field"><span>Confirm Password <b>*</b></span><input name="confirmPassword" type="password" required autocomplete="new-password"></label>`);
  const permissionsModal = createPermissionsModal();
  const rows = grid.querySelector('[data-user-rows]');
  const toast = document.createElement('div');
  toast.className = 'facility-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); document.body.append(toast);
  const userForm = userModal.querySelector('[data-user-form]');

  function createSimpleModal(type, title, description, fields) {
    const backdrop = document.createElement('div');
    backdrop.className = 'patient-modal-backdrop'; backdrop.id = `${type}-modal`; backdrop.hidden = true;
    backdrop.innerHTML = `<section class="patient-modal user-simple-modal" role="dialog" aria-modal="true" aria-labelledby="${type}-modal-title"><header class="patient-modal-header"><div><p class="eyebrow">USER SECURITY</p><h2 id="${type}-modal-title">${title}</h2><p>${description}</p></div><button class="icon-button" type="button" data-simple-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><form><div class="patient-modal-body user-simple-fields">${fields}</div><footer class="patient-modal-footer"><span></span><div><button type="button" class="button button-secondary" data-simple-cancel>Cancel</button><button type="submit" class="button button-primary">Save</button></div></footer></form></section>`;
    document.body.append(backdrop);
    return backdrop;
  }

  function createPermissionsModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'patient-modal-backdrop'; backdrop.id = 'user-permissions-modal'; backdrop.hidden = true;
  backdrop.innerHTML = `<section class="patient-modal user-simple-modal" role="dialog" aria-modal="true" aria-labelledby="user-permissions-title"><header class="patient-modal-header"><div><p class="eyebrow">USER ACCESS</p><h2 id="user-permissions-title">Assign Roles</h2><p>Select one or more roles for this user.</p></div><button class="icon-button" type="button" data-simple-close aria-label="Close dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><form><div class="patient-modal-body user-permission-body"><label class="facility-filter"><span>Search Roles</span><input type="search" data-permission-search placeholder="Search roles"></label><div class="user-permission-list" data-permission-list role="group" aria-label="Available roles"></div></div><footer class="patient-modal-footer"><span></span><div><button type="button" class="button button-secondary" data-simple-cancel>Cancel</button><button type="submit" class="button button-primary">Save assignments</button></div></footer></form></section>`;
    document.body.append(backdrop);
    return backdrop;
  }

  function loadBranches() {
    try {
      const stored = JSON.parse(localStorage.getItem(branchKey) || 'null');
      if (Array.isArray(stored)) return stored;
    } catch { /* Use facility-scoped mock choices below. */ }
    return Array.from({ length: 7 }, (_, index) => ({ code: String(index + 1), englishName: `Branch ${index + 1}`, arabicName: `الفرع ${index + 1}` }));
  }

  function loadUsers() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let migrated = false;
          const records = parsed.map((record) => {
            const { badgeNumber, permissionIds, ...cleanRecord } = record;
            if (badgeNumber !== undefined || permissionIds !== undefined || !Array.isArray(record.roleIds)) migrated = true;
            return { ...cleanRecord, facilityId, roleIds: Array.isArray(record.roleIds) ? record.roleIds : [] };
          });
          if (migrated) localStorage.setItem(storageKey, JSON.stringify(records));
          return records;
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(usersSeed));
    } catch { /* Keep mock state usable if browser storage is unavailable. */ }
    return usersSeed.map((record) => ({ ...record, roleIds: [...record.roleIds] }));
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(users)); } catch { /* Continue with in-memory state. */ }
  }

  function branchName(code) { return branches.find((item) => String(item.code) === String(code))?.englishName || '—'; }
  function showToast(message) {
    toast.textContent = message; toast.classList.add('is-visible'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }
  function closeMenus(except) {
    rows.querySelectorAll('.facility-row-menu').forEach((menu) => {
      if (menu !== except) { menu.hidden = true; menu.parentElement.querySelector('[data-user-row-menu]')?.setAttribute('aria-expanded', 'false'); }
    });
  }
  function readFilters() {
    return Object.fromEntries([...grid.querySelectorAll('[data-user-filter]')].map((field) => [field.dataset.userFilter, field.value.trim().toLocaleLowerCase()]));
  }
  function matchesFilters(user) {
    for (const key of ['username', 'englishName', 'arabicName', 'email']) if (appliedFilters[key] && !String(user[key] || '').toLocaleLowerCase().includes(appliedFilters[key])) return false;
    if (appliedFilters.userType && user.userType.toLocaleLowerCase() !== appliedFilters.userType) return false;
    if (appliedFilters.branchCode && String(user.branchCode || '') !== appliedFilters.branchCode) return false;
    if (appliedFilters.status && (user.active ? 'active' : 'inactive') !== appliedFilters.status) return false;
    return true;
  }
  function render() {
    const matching = users.filter(matchesFilters);
    const pages = Math.max(1, Math.ceil(matching.length / pageSize)); page = Math.min(page, pages);
    const visible = matching.slice((page - 1) * pageSize, page * pageSize);
    rows.innerHTML = visible.map((user) => `<tr>
      <td class="branch-code">${escapeHtml(user.username)}</td><td><span class="facility-name-en">${escapeHtml(user.englishName)}</span><small class="practitioner-arabic-name" dir="rtl">${escapeHtml(user.arabicName || '')}</small></td>
      <td>${escapeHtml(user.email)}</td><td>${escapeHtml(`${user.mobileCode || '+966'} ${user.mobile || ''}`.trim())}</td><td>${escapeHtml(user.userType)}</td><td>${escapeHtml(branchName(user.branchCode))}</td>
      <td><span class="facility-status ${user.active ? 'is-active' : 'is-inactive'}"><span></span>${user.active ? 'Active' : 'Inactive'}</span></td>
      <td><div class="facility-row-action"><button class="facility-menu-trigger" type="button" data-user-row-menu aria-label="Actions for ${escapeHtml(user.englishName)}" aria-haspopup="menu" aria-expanded="false" data-username="${escapeHtml(user.username)}">${icons.more}</button>
        <div class="facility-row-menu" role="menu" hidden><button type="button" role="menuitem" data-user-action="view" data-username="${escapeHtml(user.username)}">${icons.eye}View</button><button type="button" role="menuitem" data-user-action="edit" data-username="${escapeHtml(user.username)}">${icons.edit}Edit</button><button type="button" role="menuitem" data-user-action="status" data-username="${escapeHtml(user.username)}">${icons.status}${user.active ? 'Deactivate' : 'Activate'}</button><button type="button" role="menuitem" data-user-action="password" data-username="${escapeHtml(user.username)}">${icons.key}Set Password</button><button type="button" role="menuitem" data-user-action="permissions" data-username="${escapeHtml(user.username)}">${icons.shield}Assign Roles</button></div></div></td>
    </tr>`).join('');
    grid.querySelector('[data-user-empty]').hidden = matching.length > 0;
    grid.querySelector('[data-user-result-count]').textContent = `Total Results: ${matching.length}`;
    grid.querySelector('[data-user-page-label]').textContent = `Page ${matching.length ? page : 0} of ${matching.length ? pages : 0}`;
    grid.querySelectorAll('[data-user-page]').forEach((button) => { button.disabled = !matching.length || (['first', 'previous'].includes(button.dataset.userPage) ? page === 1 : page === pages); });
  }
  function setFormReadOnly(readOnly) {
    [...userForm.elements].forEach((field) => { if (field.name && field.name !== 'facilityName') field.disabled = readOnly; });
    userModal.querySelector('[data-user-save]').hidden = readOnly;
    userModal.querySelector('[data-user-cancel]').textContent = readOnly ? 'Back' : 'Cancel';
  }
  function openUserModal(nextMode, user = null, trigger = document.activeElement) {
    mode = nextMode; currentUsername = user?.username || null; returnFocus = trigger;
    userForm.reset(); setFormReadOnly(false);
    const isNew = nextMode === 'new';
    userModal.querySelector('#user-modal-title').textContent = isNew ? 'Add User' : nextMode === 'view' ? 'User Details' : 'Edit User';
    userModal.querySelector('#user-modal-description').textContent = isNew ? 'Enter user information and facility assignment.' : nextMode === 'view' ? 'Review user information and facility assignment.' : 'Update user information and facility assignment.';
    userModal.querySelector('[data-user-save]').textContent = isNew ? 'Create' : 'Save changes';
    userForm.elements.namedItem('facilityName').value = facility.englishName || 'Current Facility';
    if (user) {
      for (const name of ['arabicName', 'englishName', 'username', 'email', 'mobile', 'userType', 'notes', 'branchCode']) {
        const field = userForm.elements.namedItem(name);
        if (field) field.value = user[name] || '';
      }
      userForm.elements.namedItem('mobileCode').value = user.mobileCode || '+966';
    } else userForm.elements.namedItem('mobileCode').value = '+966';
    if (nextMode === 'view') setFormReadOnly(true);
    userModal.hidden = false; document.body.classList.add('patient-modal-open'); userModal.querySelector('[data-user-close]').focus();
  }
  function closeModal(modal, focus = true) {
    modal.hidden = true;
    if (![userModal, passwordModal, permissionsModal].some((item) => !item.hidden)) document.body.classList.remove('patient-modal-open');
    if (focus && returnFocus?.isConnected) returnFocus.focus();
  }
  function userByName(username) { return users.find((item) => item.username === username); }
  function openPasswordModal(user, trigger) {
    currentUsername = user.username; returnFocus = trigger;
    const form = passwordModal.querySelector('form'); form.reset();
    passwordModal.hidden = false; document.body.classList.add('patient-modal-open'); passwordModal.querySelector('[name="password"]').focus();
  }
  function renderRoleChoices(user) {
    const list = permissionsModal.querySelector('[data-permission-list]');
    const selectableRoles = (window.RcmFacilityRoles?.list?.() || []).filter((role) => role.active || user.roleIds.includes(role.id));
    list.innerHTML = selectableRoles.length ? selectableRoles.map((role) => `<label class="form-check"><input type="checkbox" name="roleIds" value="${escapeHtml(role.id)}" ${user.roleIds.includes(role.id) ? 'checked' : ''} ${role.active ? '' : 'disabled'}><span><strong>${escapeHtml(role.englishName)}${role.active ? '' : ' · Inactive'}</strong><small lang="ar" dir="rtl">${escapeHtml(role.arabicName)} · ${escapeHtml(role.level)}</small></span></label>`).join('') : '<p class="user-permission-empty">No active roles are available. Add or activate a role in Settings first.</p>';
    permissionsModal.querySelector('[data-permission-search]').value = '';
    list.querySelectorAll('.form-check').forEach((item) => { item.hidden = false; });
  }
  function openPermissionsModal(user, trigger) {
    currentUsername = user.username; returnFocus = trigger; renderRoleChoices(user);
    permissionsModal.hidden = false; document.body.classList.add('patient-modal-open'); permissionsModal.querySelector('[data-permission-search]').focus();
  }

  grid.querySelector('[data-user-empty]').hidden = true;
  grid.querySelector('[data-user-add]').addEventListener('click', (event) => openUserModal('new', null, event.currentTarget));
  grid.querySelectorAll('[data-user-filter]').forEach((field) => field.addEventListener(field.matches('select') ? 'change' : 'input', () => { appliedFilters = readFilters(); page = 1; closeMenus(); render(); }));
  grid.querySelectorAll('[data-user-page]').forEach((button) => button.addEventListener('click', () => {
    const pages = Math.max(1, Math.ceil(users.filter(matchesFilters).length / pageSize));
    if (button.dataset.userPage === 'first') page = 1;
    if (button.dataset.userPage === 'previous') page = Math.max(1, page - 1);
    if (button.dataset.userPage === 'next') page = Math.min(pages, page + 1);
    if (button.dataset.userPage === 'last') page = pages;
    closeMenus(); render();
  }));
  rows.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-user-row-menu]');
    if (trigger) { const menu = trigger.parentElement.querySelector('.facility-row-menu'); const opening = menu.hidden; closeMenus(menu); menu.hidden = !opening; trigger.setAttribute('aria-expanded', String(opening)); return; }
    const action = event.target.closest('[data-user-action]');
    if (!action) { if (!event.target.closest('.facility-row-action')) closeMenus(); return; }
    const user = userByName(action.dataset.username); if (!user) return;
    const rowTrigger = action.closest('.facility-row-action').querySelector('[data-user-row-menu]');
    closeMenus();
    if (action.dataset.userAction === 'view' || action.dataset.userAction === 'edit') { openUserModal(action.dataset.userAction, user, rowTrigger); return; }
    if (action.dataset.userAction === 'password') { openPasswordModal(user, rowTrigger); return; }
    if (action.dataset.userAction === 'permissions') { openPermissionsModal(user, rowTrigger); return; }
    user.active = !user.active; save(); render(); showToast(`${user.englishName} is now ${user.active ? 'active' : 'inactive'}.`);
  });

  userForm.addEventListener('input', (event) => {
    if (event.target.name === 'username') event.target.setCustomValidity('');
  });
  userForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const usernameField = userForm.elements.namedItem('username');
    const normalizedUsername = usernameField.value.trim().toLocaleLowerCase();
    if (users.some((item) => item.username.toLocaleLowerCase() === normalizedUsername && item.username !== currentUsername)) {
      usernameField.setCustomValidity('This user name is already in use for this facility.'); usernameField.reportValidity(); return;
    }
    if (!userForm.reportValidity()) return;
    const values = {
      arabicName: userForm.elements.namedItem('arabicName').value.trim(),
      englishName: userForm.elements.namedItem('englishName').value.trim(), username: usernameField.value.trim(),
      email: userForm.elements.namedItem('email').value.trim(), mobileCode: userForm.elements.namedItem('mobileCode').value,
      mobile: userForm.elements.namedItem('mobile').value.trim(), userType: userForm.elements.namedItem('userType').value,
      notes: userForm.elements.namedItem('notes').value.trim(),
      branchCode: userForm.elements.namedItem('branchCode').value, facilityId,
    };
    if (mode === 'new') {
      const record = { ...values, active: true, roleIds: [] }; users.push(record); save();
      grid.querySelectorAll('[data-user-filter]').forEach((field) => { field.value = ''; }); appliedFilters = {}; page = Math.ceil(users.length / pageSize);
      closeModal(userModal, false); render(); showToast(`${record.englishName} was created successfully.`);
    } else {
      const record = userByName(currentUsername); if (!record) return;
      Object.assign(record, values); save(); closeModal(userModal, false); render(); showToast(`${record.englishName} was updated successfully.`);
    }
  });
  passwordModal.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget; const password = form.elements.namedItem('password'); const confirmation = form.elements.namedItem('confirmPassword');
    confirmation.setCustomValidity(password.value === confirmation.value ? '' : 'Passwords do not match.');
    if (!form.reportValidity()) return;
    const user = userByName(currentUsername); closeModal(passwordModal); showToast(`Password setup completed for ${user?.englishName || 'user'}.`); form.reset();
  });
  passwordModal.querySelector('[name="confirmPassword"]').addEventListener('input', (event) => event.target.setCustomValidity(''));
  permissionsModal.querySelector('[data-permission-search]').addEventListener('input', (event) => {
    const query = event.target.value.toLocaleLowerCase();
    permissionsModal.querySelectorAll('.user-permission-list .form-check').forEach((item) => { item.hidden = !item.textContent.toLocaleLowerCase().includes(query); });
  });
  permissionsModal.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault(); const user = userByName(currentUsername); if (!user) return;
    user.roleIds = [...permissionsModal.querySelectorAll('[name="roleIds"]:checked')].map((input) => input.value);
    save(); closeModal(permissionsModal); showToast(`Roles updated for ${user.englishName}.`);
  });
  window.addEventListener('rcm:roles-changed', () => {
    const user = userByName(currentUsername);
    if (user && !permissionsModal.hidden) renderRoleChoices(user);
  });

  for (const modal of [userModal, passwordModal, permissionsModal]) {
    modal.querySelectorAll('[data-user-close], [data-simple-close], [data-user-cancel], [data-simple-cancel]').forEach((button) => button.addEventListener('click', () => closeModal(modal)));
    modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); });
  }
  document.addEventListener('click', (event) => { if (!event.target.closest('.facility-row-action')) closeMenus(); });
  document.addEventListener('keydown', (event) => {
    const openModal = [userModal, passwordModal, permissionsModal].find((modal) => !modal.hidden);
    if (event.key === 'Escape') { if (openModal) closeModal(openModal); else closeMenus(); }
    if (!openModal || event.key !== 'Tab') return;
    const focusable = [...openModal.querySelectorAll('button:not([hidden]):not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey && event.newValue) {
      try { const parsed = JSON.parse(event.newValue); if (Array.isArray(parsed)) { users = parsed; render(); } } catch { /* Ignore malformed storage updates. */ }
    }
    if (event.key === branchKey && event.newValue) { location.reload(); }
  });
  render();
})();
