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
  const missing = { practitioners: !practitioners, users: !users, roles: !roles };
  practitioners ||= []; users ||= []; roles ||= [];
  if (Object.values(missing).some(Boolean)) {
    const legacyByFacility = facilities.map((facility) => {
      const fid = String(facility.id);
      return { fid, oldRoles: read(facilityKey('roles', fid)) || [], oldPractitioners: read(facilityKey('practitioners', fid)) || [], oldUsers: read(facilityKey('users', fid)) || [] };
    });
    const roleIdMap = new Map();
    legacyByFacility.forEach(({ fid, oldRoles }) => oldRoles.forEach((role, i) => {
      let target = roles.find((item) => String(item.legacyFacilityId) === fid && String(item.legacyRoleId) === String(role.id));
      if (!target && missing.roles) {
        target = { ...role, id: `org-role-${fid}-${role.id || i + 1}`, facilityIds: [fid], legacyFacilityId: fid, legacyRoleId: String(role.id || i + 1) };
        roles.push(target);
      }
      if (target) roleIdMap.set(`${fid}:${role.id}`, target.id);
    }));
    if (missing.practitioners) legacyByFacility.forEach(({ fid, oldPractitioners }) => oldPractitioners.forEach((row, i) => practitioners.push({
      ...row, id: `org-practitioner-${fid}-${i + 1}`, facilityIds: [fid],
      departmentsByFacility: { [fid]: Array.isArray(row.departmentCodes) ? row.departmentCodes : [] },
    })));
    if (missing.users) legacyByFacility.forEach(({ fid, oldUsers }) => oldUsers.forEach((row, i) => users.push({
      ...row, id: `org-user-${fid}-${i + 1}`, facilityIds: [fid],
      assignmentsByFacility: { [fid]: { branchCode: row.branchCode || '', roleIds: (row.roleIds || []).map((id) => roleIdMap.get(`${fid}:${id}`)).filter(Boolean) } },
    })));
    Object.entries(missing).forEach(([kind, wasMissing]) => { if (wasMissing) write(kind, kind === 'practitioners' ? practitioners : kind === 'users' ? users : roles); });
  }

  const idFor = (kind) => `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const facilityRows = (kind, facilityId) => {
    const fid = String(facilityId);
    if (kind === 'practitioners') return practitioners.filter((row) => row.facilityIds?.map(String).includes(fid)).map((row) => ({
      ...clone(row), facilityId: fid, departmentCodes: [...(row.departmentsByFacility?.[fid] || [])],
    }));
    if (kind === 'users') return users.filter((row) => row.facilityIds?.map(String).includes(fid)).map((row) => ({
      ...clone(row), facilityId: fid, branchCode: row.assignmentsByFacility?.[fid]?.branchCode || '', roleIds: [...(row.assignmentsByFacility?.[fid]?.roleIds || [])],
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
        Object.assign(record, projection, { id: record.id, facilityId: undefined, branchCode: undefined, roleIds: undefined });
        record.facilityIds = [...new Set([...(record.facilityIds || []).map(String), fid])];
        record.assignmentsByFacility = { ...(record.assignmentsByFacility || {}), [fid]: { branchCode: projection.branchCode || '', roleIds: [...(projection.roleIds || [])] } };
        delete record.facilityId; delete record.branchCode; delete record.roleIds;
      } else if (kind === 'roles') {
        record = roles.find((row) => row.id === projection.id) || roles.find((row) => row.facilityIds?.map(String).includes(fid) && row.englishName === projection.englishName && row.arabicName === projection.arabicName);
        if (!record) { record = { ...projection, id: projection.id || idFor('role'), facilityIds: [fid] }; roles.push(record); }
        Object.assign(record, projection, { id: record.id });
        record.facilityIds = [...new Set([...(record.facilityIds || []).map(String), fid])];
      }
    });
    write(kind, kind === 'practitioners' ? practitioners : kind === 'users' ? users : roles);
  };
  const store = {
    keys, permissions, facilities: () => clone(facilities), facilityName,
    list: (kind) => clone(kind === 'practitioners' ? practitioners : kind === 'users' ? users : roles),
    forFacility: facilityRows, saveFacility: saveFacilityRows,
    save: (kind, rows) => write(kind, rows),
    nextId: idFor,
  };
  window.RcmOrganizationStaffStore = store;
})();
