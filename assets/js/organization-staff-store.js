(() => {
  const keys = {
    practitioners: 'rcm-organization-practitioners:v1',
    users: 'rcm-organization-users:v1',
    roles: 'rcm-organization-roles:v1',
  };
  const permissions = [
    { id: 'PERM-001', name: 'Patient Info Sync', module: 'Patient' },
    { id: 'PERM-002', name: 'Synchronization', module: 'Patient' },
    { id: 'PERM-003', name: 'Change Patient Status', module: 'Patient' },
    { id: 'PERM-004', name: 'View Patient', module: 'Patient' },
    { id: 'PERM-005', name: 'Search Patient', module: 'Patient' },
    { id: 'PERM-006', name: 'Edit Patient', module: 'Patient' },
    { id: 'PERM-007', name: 'Add New Patient', module: 'Patient' },
    { id: 'PERM-008', name: 'Incentive Order Report', module: 'Reports' },
    { id: 'PERM-009', name: 'Access Global Dictionaries Application', module: 'Reference Data' },
    { id: 'PERM-010', name: 'Access X4Security Application', module: 'Security' },
  ];
  const read = (key) => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(value) ? value : null; } catch { return null; } };
  const write = (kind, rows) => { try { localStorage.setItem(keys[kind], JSON.stringify(rows)); window.dispatchEvent(new CustomEvent('rcm:organization-staff-changed', { detail: { kind } })); } catch { /* Keep the page usable when storage is unavailable. */ } };
  let practitioners = read(keys.practitioners), users = read(keys.users), roles = read(keys.roles);
  const facilities = window.RcmFacilityStore?.list?.() || [{ id: 1, englishName: 'King Abdullah Specialized Hospital- Alqassim', active: true }];
  const facilityName = (id) => facilities.find((item) => String(item.id) === String(id))?.englishName || `Facility ${id}`;
  const facilityKey = (kind, id) => `rcm-facility-${kind}:v1:${id}`;
  // An empty array can be left behind when this page was opened before the
  // Facility Settings pages had initialized their sample records. Treat that
  // state as recoverable so legacy facility records can be imported later.
  const recover = {
    practitioners: !practitioners?.length,
    users: !users?.length,
    roles: !roles?.length,
  };
  practitioners ||= []; users ||= []; roles ||= [];
  if (Object.values(recover).some(Boolean)) {
    const legacyByFacility = facilities.map((facility) => {
      const fid = String(facility.id);
      return { fid, oldRoles: read(facilityKey('roles', fid)) || [], oldPractitioners: read(facilityKey('practitioners', fid)) || [], oldUsers: read(facilityKey('users', fid)) || [] };
    });
    const roleIdMap = new Map();
    legacyByFacility.forEach(({ fid, oldRoles }) => oldRoles.forEach((role, i) => {
      let target = roles.find((item) => String(item.legacyFacilityId) === fid && String(item.legacyRoleId) === String(role.id));
      if (!target && recover.roles) {
        target = { ...role, branchScope: 'facility', id: `org-role-${fid}-${role.id || i + 1}`, facilityIds: [fid], legacyFacilityId: fid, legacyRoleId: String(role.id || i + 1) };
        roles.push(target);
      }
      if (target) roleIdMap.set(`${fid}:${role.id}`, target.id);
    }));
    if (recover.practitioners) legacyByFacility.forEach(({ fid, oldPractitioners }) => oldPractitioners.forEach((row, i) => practitioners.push({
      ...row, id: `org-practitioner-${fid}-${i + 1}`, facilityIds: [fid],
      departmentsByFacility: { [fid]: Array.isArray(row.departmentCodes) ? row.departmentCodes : [] },
    })));
    if (recover.users) legacyByFacility.forEach(({ fid, oldUsers }) => oldUsers.forEach((row, i) => users.push({
      ...row, id: `org-user-${fid}-${i + 1}`, facilityIds: [fid],
      assignmentsByFacility: { [fid]: { branchCode: row.branchCode || '', branchCodes: (Array.isArray(row.branchCodes) ? row.branchCodes : row.branchCode ? [row.branchCode] : []).map(String), roleIds: (row.roleIds || []).map((id) => roleIdMap.get(`${fid}:${id}`)).filter(Boolean), roleBranchCodesById: row.roleBranchCodesById || {} } },
    })));
    // If the browser has no facility seeds either, initialize realistic
    // organization sample data for the primary facility so the grids are not
    // blank on first use. Existing nonempty lists are never replaced.
    const primaryFacilityId = String(facilities[0]?.id ?? 1);
    if (recover.practitioners && !practitioners.length) {
      practitioners = [
        { id: 'org-practitioner-seed-001', documentId: '1093847562', englishName: 'Practitioner 1', arabicName: 'ممارس 1', role: 'Doctor', documentType: 'National ID', specialty: 'Community Health', designation: 'Consultant', active: true, facilityIds: [primaryFacilityId], departmentsByFacility: { [primaryFacilityId]: ['DPT-001'] } },
        { id: 'org-practitioner-seed-002', documentId: '1082763451', englishName: 'Practitioner 2', arabicName: 'ممارس 2', role: 'Doctor', documentType: 'National ID', specialty: 'Emergency Medicine Specialty', designation: 'Emergency Consultant', active: true, facilityIds: [primaryFacilityId], departmentsByFacility: { [primaryFacilityId]: ['DPT-002', 'DPT-006'] } },
        { id: 'org-practitioner-seed-003', documentId: '1071654328', englishName: 'Practitioner 3', arabicName: 'ممارس 3', role: 'Nurse', documentType: 'National ID', specialty: 'Community Health', designation: 'Clinical Scientist', active: true, facilityIds: [primaryFacilityId], departmentsByFacility: { [primaryFacilityId]: ['DPT-003'] } },
        { id: 'org-practitioner-seed-004', documentId: '1069382714', englishName: 'Practitioner 4', arabicName: 'ممارس 4', role: 'Pharmacist', documentType: 'National ID', specialty: 'Community Medicine Specialty', designation: 'Associate Consultant', active: true, facilityIds: [primaryFacilityId], departmentsByFacility: { [primaryFacilityId]: ['DPT-004'] } },
        { id: 'org-practitioner-seed-005', documentId: '1058273649', englishName: 'Practitioner 5', arabicName: 'ممارس 5', role: 'Doctor', documentType: 'National ID', specialty: 'Adult Emergency Medicine', designation: 'Assistant Consultant', active: false, facilityIds: [primaryFacilityId], departmentsByFacility: { [primaryFacilityId]: ['DPT-005', 'DPT-006'] } },
        { id: 'org-practitioner-seed-006', documentId: '1047162538', englishName: 'Practitioner 6', arabicName: 'ممارس 6', role: 'Physiotherapist', documentType: 'National ID', specialty: 'Community Medicine Specialty', designation: 'Clinical Scientist', active: true, facilityIds: [primaryFacilityId], departmentsByFacility: { [primaryFacilityId]: ['DPT-001', 'DPT-003'] } },
      ];
    }
    if (recover.roles && !roles.length) {
      roles = [
        { id: 'org-role-seed-001', arabicName: 'دور 1', englishName: 'Role 1', permissionIds: permissions.map((item) => item.id), active: true, branchScope: 'facility', facilityIds: facilities.map((item) => String(item.id)), organizationWide: true },
        { id: 'org-role-seed-002', arabicName: 'دور 2', englishName: 'Role 2', permissionIds: ['PERM-001', 'PERM-002', 'PERM-003', 'PERM-004', 'PERM-005', 'PERM-006', 'PERM-007'], active: true, branchScope: 'facility', facilityIds: facilities.map((item) => String(item.id)), organizationWide: true },
        { id: 'org-role-seed-003', arabicName: 'دور 3', englishName: 'Role 3', permissionIds: ['PERM-004', 'PERM-008'], active: true, branchScope: 'facility', facilityIds: facilities.map((item) => String(item.id)), organizationWide: true },
        { id: 'org-role-seed-004', arabicName: 'دور 4', englishName: 'Role 4', permissionIds: ['PERM-004', 'PERM-005', 'PERM-008'], active: true, branchScope: 'facility', facilityIds: facilities.map((item) => String(item.id)), organizationWide: true },
      ];
    }
  if (recover.users && !users.length) {
      const seedRoleIds = roles.slice(0, 3).map((role) => role.id);
      users = [
        { id: 'org-user-seed-001', username: 'a.alotaibi', englishName: 'User 1', arabicName: 'مستخدم 1', email: 'amal.alotaibi@example.com', mobileCode: '+966', mobile: '501234567', userType: 'Employee', active: true, facilityIds: [primaryFacilityId], assignmentsByFacility: { [primaryFacilityId]: { branchCode: '1', branchCodes: ['1'], roleIds: [seedRoleIds[1]] } } },
        { id: 'org-user-seed-002', username: 'k.alharbi', englishName: 'User 2', arabicName: 'مستخدم 2', email: 'khalid.alharbi@example.com', mobileCode: '+966', mobile: '502345678', userType: 'Business Center', active: true, facilityIds: [primaryFacilityId], assignmentsByFacility: { [primaryFacilityId]: { branchCode: '2', branchCodes: ['2'], roleIds: [seedRoleIds[2]] } } },
        { id: 'org-user-seed-003', username: 'n.aldosari', englishName: 'User 3', arabicName: 'مستخدم 3', email: 'noura.aldosari@example.com', mobileCode: '+966', mobile: '503456789', userType: 'System Administrator', active: true, facilityIds: [primaryFacilityId], assignmentsByFacility: { [primaryFacilityId]: { branchCode: '1', branchCodes: ['1'], roleIds: [seedRoleIds[0]] } } },
        { id: 'org-user-seed-004', username: 'f.alqahtani', englishName: 'User 4', arabicName: 'مستخدم 4', email: 'faisal.alqahtani@example.com', mobileCode: '+966', mobile: '504567890', userType: 'Overtimer', active: false, facilityIds: [primaryFacilityId], assignmentsByFacility: { [primaryFacilityId]: { branchCode: '3', branchCodes: ['3'], roleIds: [] } } },
        { id: 'org-user-seed-005', username: 's.alshammari', englishName: 'Practitioner 5', arabicName: 'ممارس 5', email: 'sara.alshammari@example.com', mobileCode: '+966', mobile: '505678901', userType: 'Employee', active: true, facilityIds: [primaryFacilityId], assignmentsByFacility: { [primaryFacilityId]: { branchCode: '4', branchCodes: ['4'], roleIds: [seedRoleIds[1]] } } },
      ];
    }
    Object.entries(recover).forEach(([kind, shouldRecover]) => { if (shouldRecover) write(kind, kind === 'practitioners' ? practitioners : kind === 'users' ? users : roles); });
  }

  // Resolve legacy practitioner usernames to stable IDs after either side has
  // been loaded or recovered. Keep the old text value for audit/display.
  let linksMigrated = false;
  practitioners.forEach((practitioner) => {
    if (practitioner.userId || !practitioner.user) return;
    const matches = users.filter((user) => String(user.username || '').toLocaleLowerCase() === String(practitioner.user).toLocaleLowerCase());
    if (matches.length !== 1 || (matches[0].practitionerId && matches[0].practitionerId !== practitioner.id)) return;
    const user = matches[0];
    const practitionerFacilities = (practitioner.facilityIds || []).map(String);
    if (!practitionerFacilities.some((id) => (user.facilityIds || []).map(String).includes(id))) return;
    practitioner.userId = user.id; user.practitionerId = practitioner.id; linksMigrated = true;
  });
  if (linksMigrated) { write('practitioners', practitioners); write('users', users); }

  // Organization roles are globally available; user assignments remain facility-specific.
  const organizationFacilityIds = facilities.map((facility) => String(facility.id));
  let rolesChanged = false, usersChanged = false;
  const roleIdMap = new Map(), roleBySignature = new Map(), organizationRoles = [];
  roles.forEach((role) => {
    const permissionIds = [...new Set((role.permissionIds || []).map(String))].sort();
    const branchScope = role.branchScope || 'facility';
    const signature = [String(role.englishName || '').trim().toLocaleLowerCase(), String(role.arabicName || '').trim(), Boolean(role.active), branchScope, permissionIds.join('|')].join('::');
    let canonical = roleBySignature.get(signature);
    if (!canonical) {
      canonical = { ...role, branchScope, permissionIds };
      roleBySignature.set(signature, canonical);
      organizationRoles.push(canonical);
    } else rolesChanged = true;
    roleIdMap.set(String(role.id), canonical.id);
  });
  roles = organizationRoles.map((role) => {
    const normalizedIds = [...organizationFacilityIds];
    const branchScope = role.branchScope || 'facility';
    if (!role.branchScope || role.organizationWide !== true || JSON.stringify((role.facilityIds || []).map(String)) !== JSON.stringify(normalizedIds)) rolesChanged = true;
    return { ...role, branchScope, facilityIds: normalizedIds, organizationWide: true };
  });
  users = users.map((user) => {
    const assignmentsByFacility = { ...(user.assignmentsByFacility || {}) };
    Object.entries(assignmentsByFacility).forEach(([fid, assignment]) => {
      const prior = (assignment.roleIds || []).map(String), roleIds = [...new Set(prior.map((id) => roleIdMap.get(id) || id))];
      if (roleIds.length !== prior.length || roleIds.some((id, index) => id !== prior[index])) usersChanged = true;
      const roleBranchCodesById = { ...(assignment.roleBranchCodesById || {}) };
      roleIds.forEach((id) => { if (!Object.hasOwn(roleBranchCodesById, id)) roleBranchCodesById[id] = []; });
      if (!assignment.roleBranchCodesById) usersChanged = true;
      assignmentsByFacility[fid] = { ...assignment, roleIds, roleBranchCodesById };
    });
    return { ...user, assignmentsByFacility };
  });
  if (rolesChanged) write('roles', roles);
  if (usersChanged) write('users', users);

  const idFor = (kind) => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const facilityRows = (kind, facilityId) => {
    const fid = String(facilityId);
    if (kind === 'practitioners') return practitioners.filter((row) => row.facilityIds?.map(String).includes(fid)).map((row) => ({
      ...clone(row), facilityId: fid, departmentCodes: [...(row.departmentsByFacility?.[fid] || [])],
    }));
    if (kind === 'users') return users.filter((row) => row.facilityIds?.map(String).includes(fid)).map((row) => ({
      ...clone(row), facilityId: fid, branchCode: row.assignmentsByFacility?.[fid]?.branchCode || row.assignmentsByFacility?.[fid]?.branchCodes?.[0] || '', branchCodes: (Array.isArray(row.assignmentsByFacility?.[fid]?.branchCodes) ? row.assignmentsByFacility[fid].branchCodes : row.assignmentsByFacility?.[fid]?.branchCode ? [row.assignmentsByFacility[fid].branchCode] : []).map(String), roleIds: [...(row.assignmentsByFacility?.[fid]?.roleIds || [])], roleBranchCodesById: clone(row.assignmentsByFacility?.[fid]?.roleBranchCodesById || {}),
    }));
    if (kind === 'roles') return roles.filter((row) => row.facilityIds?.map(String).includes(fid)).map((row) => clone(row));
    return [];
  };
  const saveFacilityRows = (kind, facilityId, rows) => {
    const fid = String(facilityId);
    rows.forEach((projection) => {
      let record;
      if (kind === 'practitioners') {
        record = practitioners.find((row) => row.id === projection.id) || practitioners.find((row) => row.facilityIds?.map(String).includes(fid) && row.documentId === projection.documentId);
        if (!record) { record = { ...projection, id: projection.id || idFor('practitioner'), facilityIds: [fid], departmentsByFacility: {} }; practitioners.push(record); }
        Object.assign(record, projection, { id: record.id, facilityId: undefined, departmentCodes: undefined });
        record.facilityIds = [...new Set([...(record.facilityIds || []).map(String), fid])];
        record.departmentsByFacility = { ...(record.departmentsByFacility || {}), [fid]: [...(projection.departmentCodes || [])] };
        delete record.facilityId; delete record.departmentCodes;
      } else if (kind === 'users') {
        record = users.find((row) => row.id === projection.id) || users.find((row) => row.facilityIds?.map(String).includes(fid) && row.username === projection.username);
        if (!record) { record = { ...projection, id: projection.id || idFor('user'), facilityIds: [fid], assignmentsByFacility: {} }; users.push(record); }
        Object.assign(record, projection, { id: record.id, facilityId: undefined, branchCode: undefined, branchCodes: undefined, roleIds: undefined, roleBranchCodesById: undefined });
        record.facilityIds = [...new Set([...(record.facilityIds || []).map(String), fid])];
        const branchCodes = (Array.isArray(projection.branchCodes) ? projection.branchCodes : projection.branchCode ? [projection.branchCode] : []).map(String);
        record.assignmentsByFacility = { ...(record.assignmentsByFacility || {}), [fid]: { branchCode: branchCodes[0] || '', branchCodes, roleIds: [...(projection.roleIds || [])], roleBranchCodesById: clone(projection.roleBranchCodesById || {}) } };
        delete record.facilityId; delete record.branchCode; delete record.branchCodes; delete record.roleIds; delete record.roleBranchCodesById;
      } else if (kind === 'roles') {
        record = roles.find((row) => row.id === projection.id) || roles.find((row) => row.facilityIds?.map(String).includes(fid) && row.englishName === projection.englishName && row.arabicName === projection.arabicName);
        if (!record) { record = { ...projection, id: projection.id || idFor('role'), facilityIds: [fid] }; roles.push(record); }
        Object.assign(record, projection, { id: record.id });
        record.facilityIds = [...new Set([...(record.facilityIds || []).map(String), fid])];
      }
    });
    write(kind, kind === 'practitioners' ? practitioners : kind === 'users' ? users : roles);
    return facilityRows(kind, fid);
  };
  const saveLinkedRecords = (nextPractitioners, nextUsers) => {
    practitioners = clone(nextPractitioners);
    users = clone(nextUsers);
    write('practitioners', practitioners);
    write('users', users);
  };
  const linkRecords = (kind, recordId, counterpartId = '') => {
    const practitionerRows = clone(practitioners), userRows = clone(users);
    const user = kind === 'users' ? userRows.find((row) => String(row.id) === String(recordId)) : userRows.find((row) => String(row.id) === String(counterpartId));
    const oldPractitionerId = user?.practitionerId || practitionerRows.find((row) => String(row.userId || '') === String(user?.id || ''))?.id || '';
    const practitioner = kind === 'practitioners' ? practitionerRows.find((row) => String(row.id) === String(recordId)) : practitionerRows.find((row) => String(row.id) === String(counterpartId || oldPractitionerId));
    if ((kind === 'practitioners' && !practitioner) || (kind === 'users' && !user) || (counterpartId && (!practitioner || !user))) return { ok: false, reason: 'missing-record' };
    if (!practitioner && kind === 'users') { user.practitionerId = ''; saveLinkedRecords(practitionerRows, userRows); return { ok: true }; }
    const desiredPractitionerId = counterpartId ? practitioner.id : '';
    const desiredUserId = counterpartId ? user.id : '';
    if (desiredUserId && user?.practitionerId && String(user.practitionerId) !== String(desiredPractitionerId)) return { ok: false, reason: 'already-linked' };
    if (desiredPractitionerId && practitioner.userId && String(practitioner.userId) !== String(desiredUserId)) {
      const currentUser = userRows.find((row) => String(row.id) === String(practitioner.userId));
      if (currentUser?.practitionerId && String(currentUser.practitionerId) === String(practitioner.id)) return { ok: false, reason: 'already-linked' };
    }
    if (desiredUserId && !((practitioner.facilityIds || []).map(String).some((id) => (user.facilityIds || []).map(String).includes(id)))) return { ok: false, reason: 'facility-mismatch' };
    // Clear either side's previous backlink as well as any stale reciprocal
    // reference left by legacy or partially migrated records.
    if (practitioner) userRows.forEach((row) => {
      if (String(row.practitionerId || '') === String(practitioner.id) && String(row.id) !== String(desiredUserId)) row.practitionerId = '';
    });
    if (user) practitionerRows.forEach((row) => {
      if (String(row.userId || '') === String(user.id) && String(row.id) !== String(desiredPractitionerId)) row.userId = '';
    });
    if (practitioner) practitioner.userId = desiredUserId || '';
    if (user) user.practitionerId = desiredPractitionerId || '';
    saveLinkedRecords(practitionerRows, userRows);
    return { ok: true };
  };
  const store = {
    keys, permissions, facilities: () => clone(facilities), facilityName,
    list: (kind) => clone(kind === 'practitioners' ? practitioners : kind === 'users' ? users : roles),
    forFacility: facilityRows, saveFacility: saveFacilityRows,
    save: (kind, rows) => {
      const copy = clone(rows);
      if (kind === 'practitioners') practitioners = copy;
      if (kind === 'users') users = copy;
      if (kind === 'roles') roles = copy;
      write(kind, copy);
    },
    saveLinkedRecords,
    link: linkRecords,
    nextId: idFor,
  };
  window.RcmOrganizationStaffStore = store;
})();
