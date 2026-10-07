(() => {
  const store = window.RcmFacilityStore;
  if (!store) return;

  const departmentSeed = [
    { code: 'DPT-001', name: 'Department 1', type: 'Clinic', specialty: 'Family Medicine', profile: 'Clinic', category: 'Billing' },
    { code: 'DPT-002', name: 'Department 2', type: 'Ward', specialty: 'Emergency Medicine', profile: 'Hospital', category: 'Billing' },
    { code: 'DPT-003', name: 'Department 3', type: 'Ward', specialty: 'Internal Medicine', profile: 'Hospital', category: 'Billing' },
    { code: 'DPT-004', name: 'Department 4', type: 'OP Pharmacy', specialty: 'Pharmacy', profile: 'Pharmacy', category: 'Billing' },
    { code: 'DPT-005', name: 'Department 5', type: 'Laboratory', specialty: 'Laboratory Medicine', profile: 'Laboratory', category: 'Billing' },
    { code: 'DPT-006', name: 'Department 6', type: 'Imaging Location', specialty: 'Radiology', profile: 'Diagnostic Center', category: 'Billing' },
  ];
  const divisions = [
    { code: 'DIV-001', nameEn: 'Division 1', nameAr: 'قسم 1', parentDepartment: 'DPT-002', divisionType: 'Clinical', status: 'Active' },
    { code: 'DIV-002', nameEn: 'Division 2', nameAr: 'قسم 2', parentDepartment: 'DPT-001', divisionType: 'Clinical', status: 'Active' },
    { code: 'DIV-003', nameEn: 'Division 3', nameAr: 'قسم 3', parentDepartment: 'DPT-003', divisionType: 'Clinical', status: 'Active' },
    { code: 'DIV-004', nameEn: 'Division 4', nameAr: 'قسم 4', parentDepartment: 'DPT-004', divisionType: 'Administrative', status: 'Active' },
    { code: 'DIV-005', nameEn: 'Division 5', nameAr: 'قسم 5', parentDepartment: 'DPT-006', divisionType: 'Support', status: 'Active' },
    { code: 'DIV-006', nameEn: 'Division 6', nameAr: 'قسم 6', parentDepartment: 'DPT-005', divisionType: 'Clinical', status: 'Active' },
  ];
  const locations = [
    { code: 'LOC-001', nameEn: 'Location 1', nameAr: 'موقع 1', locationType: 'Clinical Zone', floorNumber: 'Ground Floor', status: 'Operational' },
    { code: 'LOC-002', nameEn: 'Location 2', nameAr: 'موقع 2', locationType: 'Clinical Zone', floorNumber: 'Floor 1', status: 'Operational' },
    { code: 'LOC-003', nameEn: 'Location 3', nameAr: 'موقع 3', locationType: 'Diagnostic Area', floorNumber: 'Floor 1', status: 'Operational' },
    { code: 'LOC-004', nameEn: 'Location 4', nameAr: 'موقع 4', locationType: 'Public Space', floorNumber: 'Ground Floor', status: 'Operational' },
    { code: 'LOC-005', nameEn: 'Location 5', nameAr: 'موقع 5', locationType: 'Diagnostic Area', floorNumber: 'Basement', status: 'Under Maintenance' },
    { code: 'LOC-006', nameEn: 'Location 6', nameAr: 'موقع 6', locationType: 'Clinical Zone', floorNumber: 'Ground Floor', status: 'Operational' },
  ];
  const rooms = [
    { code: 'RM-001', nameEn: 'Room 1', nameAr: 'غرفة 1', parentLocation: 'LOC-001', assignedDivision: 'DIV-001', classification: 'Clinical / Non-Sterile', status: 'Available' },
    { code: 'RM-002', nameEn: 'Room 2', nameAr: 'غرفة 2', parentLocation: 'LOC-001', assignedDivision: 'DIV-001', classification: 'Clinical / Sterile', status: 'Occupied' },
    { code: 'RM-003', nameEn: 'Room 3', nameAr: 'غرفة 3', parentLocation: 'LOC-002', assignedDivision: 'DIV-002', classification: 'Clinical / Non-Sterile', status: 'Available' },
    { code: 'RM-004', nameEn: 'Room 4', nameAr: 'غرفة 4', parentLocation: 'LOC-002', assignedDivision: 'DIV-002', classification: 'Clinical / Non-Sterile', status: 'Reserved' },
    { code: 'RM-005', nameEn: 'Room 5', nameAr: 'غرفة 5', parentLocation: 'LOC-003', assignedDivision: 'DIV-005', classification: 'Clinical / Non-Sterile', status: 'Available' },
    { code: 'RM-006', nameEn: 'Room 6', nameAr: 'غرفة 6', parentLocation: 'LOC-004', assignedDivision: '', classification: 'Administrative Office', status: 'Available' },
  ];
  const costCenters = [
    { code: 'CC-ER', name: 'Cost Center 1', pharmaceuticals: false, parentCode: '', glCode: '' },
    { code: 'CC-AMB', name: 'Cost Center 2', pharmaceuticals: false, parentCode: '', glCode: '' },
    { code: 'CC-LAB', name: 'Cost Center 3', pharmaceuticals: false, parentCode: '', glCode: '' },
    { code: 'CC-PHARM', name: 'Cost Center 4', pharmaceuticals: true, parentCode: '', glCode: '' },
    { code: 'CC-DIAG', name: 'Cost Center 5', pharmaceuticals: false, parentCode: '', glCode: '' },
    { code: 'CC-ER-TRI', name: 'Sub Cost Center 1', pharmaceuticals: false, parentCode: 'CC-ER', glCode: '5101-01' },
    { code: 'CC-ER-TREAT', name: 'Sub Cost Center 2', pharmaceuticals: false, parentCode: 'CC-ER', glCode: '5101-02' },
    { code: 'CC-AMB-FAM', name: 'Sub Cost Center 3', pharmaceuticals: false, parentCode: 'CC-AMB', glCode: '5201-01' },
    { code: 'CC-LAB-CORE', name: 'Sub Cost Center 4', pharmaceuticals: false, parentCode: 'CC-LAB', glCode: '5301-01' },
    { code: 'CC-PHARM-OP', name: 'Sub Cost Center 5', pharmaceuticals: true, parentCode: 'CC-PHARM', glCode: '5401-01' },
    { code: 'CC-DIAG-RAD', name: 'Sub Cost Center 6', pharmaceuticals: false, parentCode: 'CC-DIAG', glCode: '5501-01' },
  ];

  function persist(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep local fixtures best-effort. */ }
  }

  function readArray(key) {
    try {
      const value = localStorage.getItem(key);
      const parsed = value === null ? [] : JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  function mergeByCode(key, fixtures, normalize = (record) => record, identity = (record) => record.code) {
    const current = readArray(key).map(normalize);
    const known = new Set(current.map((record) => String(identity(record))));
    const additions = fixtures.filter((record) => !known.has(String(identity(record))));
    persist(key, [...current, ...additions]);
  }

  function createPeriods() {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const lastDay = new Date(Date.UTC(2026, month, 0)).getUTCDate();
      const date = (day) => `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/2026`;
      const status = month === 1 ? 'Pending Closure' : month === 2 ? 'Open' : 'Future';
      return { id: `2026-${month}`, name: `2026-${month}`, year: 2026, month, startDate: date(1), endDate: date(lastDay), status, payerOnly: status === 'Pending Closure', allowClaimCreation: true, fiscalYearType: 'Gregorian Fiscal', frequency: 'Monthly' };
    });
  }

  function seedFacility(facility) {
    const id = String(facility.id);
    const branchKey = `rcm-facility-branches:v1:${id}`;
    let branches = readArray(branchKey);
    if (!branches.length) {
      branches = id === '1'
        ? Array.from({ length: 7 }, (_, index) => ({ code: String(index + 1), englishName: `Branch ${index + 1}`, arabicName: `الفرع ${index + 1}`, prefix: `BR${index + 1}`, active: true }))
        : id === '2'
          ? Array.from({ length: 3 }, (_, index) => ({ code: String(index + 1), englishName: `Branch ${index + 1}`, arabicName: `الفرع ${index + 1}`, prefix: `BR${index + 1}`, active: true }))
          : [{ code: '1', englishName: 'Default Branch', arabicName: '', prefix: 'DEF', active: true, isDefault: true }];
      persist(branchKey, branches);
    } else if (!branches.some((branch) => branch.active !== false)) {
      const numericCodes = branches.map((branch) => Number(branch.code)).filter(Number.isFinite);
      branches.push({ code: String(Math.max(0, ...numericCodes) + 1), englishName: 'Default Branch', arabicName: '', prefix: 'DEF', active: true, isDefault: true });
      persist(branchKey, branches);
    }
    const activeBranches = branches.filter((branch) => branch.active !== false);
    const branchCodes = activeBranches.map((branch) => String(branch.code));
    const branchFor = (index) => branchCodes.length > 1 ? branchCodes[index % branchCodes.length] : (branchCodes[0] || '1');

    const departmentKey = `rcm-facility-departments:v1:${id}`;
    const departments = departmentSeed.map((department, index) => ({ ...department, branchCodes: [branchFor(index)], active: true }));
    mergeByCode(departmentKey, departments, (record) => ({
      ...record,
      branchCodes: Array.isArray(record.branchCodes) ? record.branchCodes.map(String) : record.parentBranch ? [String(record.parentBranch)] : [branchFor(0)],
    }));

    mergeByCode(`rcm-facility-divisions:v1:${id}`, divisions);
    mergeByCode(`rcm-facility-locations:v1:${id}`, locations);
    mergeByCode(`rcm-facility-rooms:v1:${id}`, rooms, (record) => record, (record) => record.nameEn || record.code);
    const periodKey = `rcm-facility-billing-periods:v1:${id}`;
    const existingPeriods = readArray(periodKey);
    const knownPeriods = new Set(existingPeriods.map((period) => String(period.id || period.name)));
    persist(periodKey, [...existingPeriods, ...createPeriods().filter((period) => !knownPeriods.has(String(period.id)))]);
    mergeByCode(`rcm-facility-cost-centers:v1:${id}`, costCenters);
  }

  store.list().forEach(seedFacility);

  // Rename only recognizable seeded rows in existing facility storage. Stable
  // codes/IDs keep custom records and all relationships untouched.
  const fixtureNames = {
    'rcm-facility-departments:v1:': ['DPT-001', 'DPT-002', 'DPT-003', 'DPT-004', 'DPT-005', 'DPT-006'],
    'rcm-facility-divisions:v1:': ['DIV-001', 'DIV-002', 'DIV-003', 'DIV-004', 'DIV-005', 'DIV-006'],
    'rcm-facility-locations:v1:': ['LOC-001', 'LOC-002', 'LOC-003', 'LOC-004', 'LOC-005', 'LOC-006'],
    'rcm-facility-rooms:v1:': ['RM-001', 'RM-002', 'RM-003', 'RM-004', 'RM-005', 'RM-006'],
    'rcm-facility-cost-centers:v1:': ['CC-ER', 'CC-AMB', 'CC-LAB', 'CC-PHARM', 'CC-DIAG', 'CC-ER-TRI', 'CC-ER-TREAT', 'CC-AMB-FAM', 'CC-LAB-CORE', 'CC-PHARM-OP', 'CC-DIAG-RAD'],
  };
  store.list().forEach((facility) => {
    const fid = String(facility.id);
    Object.entries(fixtureNames).forEach(([prefix, codes]) => {
      const key = `${prefix}${fid}`;
      const rows = readArray(key);
      let changed = false;
      const updated = rows.map((row) => {
        const stable = row.code || row.nameEn;
        const index = codes.indexOf(String(stable));
        if (index < 0) return row;
        const next = { ...row };
        if (prefix.includes('departments')) next.name = `Department ${index + 1}`;
        if (prefix.includes('divisions')) { next.nameEn = `Division ${index + 1}`; next.nameAr = `قسم ${index + 1}`; }
        if (prefix.includes('locations')) { next.nameEn = `Location ${index + 1}`; next.nameAr = `موقع ${index + 1}`; }
        if (prefix.includes('rooms')) { next.nameEn = `Room ${index + 1}`; next.nameAr = `غرفة ${index + 1}`; }
        if (prefix.includes('cost-centers')) next.name = index < 5 ? `Cost Center ${index + 1}` : `Sub Cost Center ${index - 4}`;
        changed ||= Object.keys(next).some((field) => next[field] !== row[field]);
        return next;
      });
      if (changed) persist(key, updated);
    });
    const branchKey = `rcm-facility-branches:v1:${fid}`;
    const branches = readArray(branchKey);
    let branchChanged = false;
    branches.forEach((branch) => { if (branch.isDefault && branch.englishName === 'Default Branch') { branch.englishName = 'Branch 1'; branch.arabicName = 'الفرع 1'; branchChanged = true; } });
    if (branchChanged) persist(branchKey, branches);

    const renameRows = (key, idField, names, update) => {
      const rows = readArray(key); let changed = false;
      const next = rows.map((row) => {
        const index = names.findIndex((entry) => String(entry.id) === String(row[idField]));
        if (index < 0) return row;
        const renamed = update({ ...row }, index);
        changed ||= Object.keys(renamed).some((field) => renamed[field] !== row[field]);
        return renamed;
      });
      if (changed) persist(key, next);
    };
    const scoped = (kind, version = 'v1') => `rcm-facility-${kind}:${version}:${fid}`;
    const numbered = (prefix, count, field) => Array.from({ length: count }, (_, i) => ({ id: `${prefix}${String(i + 1).padStart(3, '0')}`, name: `${field} ${i + 1}` }));
    renameRows(scoped('practitioners'), 'documentId', ['1093847562','1082763451','1071654328','1069382714','1058273649','1047162538'].map((id, i) => ({ id, name: i + 1 })), (row, i) => ({ ...row, englishName: `Practitioner ${i + 1}`, arabicName: `ممارس ${i + 1}` }));
    renameRows(scoped('users'), 'username', ['a.alotaibi','k.alharbi','n.aldosari','f.alqahtani','s.alshammari'].map((id, i) => ({ id, name: i + 1 })), (row, i) => ({ ...row, englishName: `User ${i + 1}`, arabicName: `مستخدم ${i + 1}` }));
    renameRows(scoped('roles'), 'id', numbered('role-', 4, 'Role'), (row, i) => ({ ...row, englishName: `Role ${i + 1}`, arabicName: `دور ${i + 1}` }));
    renameRows(scoped('payers', 'v2'), 'id', Array.from({ length: 5 }, (_, i) => ({ id: `payer-00${i + 1}` })), (row, i) => ({ ...row, englishName: `Payer ${i + 1}`, arabicName: `جهة الدفع ${i + 1}`, acronym: `PAY${i + 1}`, contacts: (row.contacts || []).map((contact, contactIndex) => ({ ...contact, contactName: `Contact ${contactIndex + 1}` })) }));
    renameRows(scoped('tpas'), 'id', Array.from({ length: 5 }, (_, i) => ({ id: `TPA-00${i + 1}` })), (row, i) => ({ ...row, englishName: `TPA ${i + 1}`, arabicName: `مدير مطالبات ${i + 1}` }));
    renameRows(scoped('contracts'), 'id', Array.from({ length: 3 }, (_, i) => ({ id: `contract-00${i + 1}` })), (row, i) => ({ ...row, name: `Contract ${i + 1}`, payerLabel: `Payer ${row.payerId === 'payer-002' ? 2 : row.payerId === 'payer-005' ? 5 : 1}`, priceLists: (row.priceLists || []).map((entry, n) => ({ ...entry, name: `Price List ${n + 1}` })), discounts: (row.discounts || []).map((entry, n) => ({ ...entry, name: `Discount ${n + 1}` })) }));
    renameRows(scoped('plans'), 'planId', ['PLAN-2026-001','PLAN-2026-002','PLAN-2026-003'].map((id, i) => ({ id, name: i + 1 })), (row, i) => ({ ...row, name: `Plan ${i + 1}`, network: `Network ${i + 1}`, term: `Plan coverage terms ${i + 1}` }));
    renameRows(scoped('policies'), 'id', Array.from({ length: 3 }, (_, i) => ({ id: `policy-00${i + 1}` })), (row, i) => ({ ...row, policyHolderName: `Policy Holder ${i + 1}`, remarks: `Policy remarks ${i + 1}` }));
    renameRows(scoped('groups'), 'id', [
      ['group-consultation','Group 1'],['subgroup-primary-care','Sub Group 1'],['subgroup-specialty-consult','Sub Group 2'],['group-laboratory','Group 2'],['subgroup-core-lab','Sub Group 3'],['subgroup-microbiology','Sub Group 4'],['group-imaging','Group 3'],['subgroup-radiology','Sub Group 5'],['group-pharmacy','Group 4'],['subgroup-outpatient-pharmacy','Sub Group 6'],['group-procedures','Group 5'],
    ].map(([id, name]) => ({ id, name })), (row, i) => ({ ...row, description: ['Group 1','Sub Group 1','Sub Group 2','Group 2','Sub Group 3','Sub Group 4','Group 3','Sub Group 5','Group 4','Sub Group 6','Group 5'][i], alias: `Group alias ${i + 1}`, tags: (row.tags || []).map((_, index) => `Tag ${index + 1}`) }));
    renameRows(scoped('categories'), 'code', ['CAT-CONS','CAT-LAB','CAT-IMG','CAT-PHARM','CAT-PROC','CAT-THER'].map((id, i) => ({ id, name: i + 1 })), (row, i) => ({ ...row, description: `Category ${i + 1}`, alias: `Category ${i + 1} alias` }));
    renameRows(scoped('service-catalogs'), 'id', ['catalog-ambulatory','catalog-laboratory','catalog-imaging'].map((id, i) => ({ id, name: i + 1 })), (row, i) => ({ ...row, name: `Service Catalog ${i + 1}`, description: `Service catalog description ${i + 1}` }));
    renameRows(scoped('service-items'), 'code', ['SV-1001','SV-1002','SV-2001','SV-2011','SV-3001','SV-4001','SV-5001'].map((id, i) => ({ id, name: i + 1 })), (row, i) => ({ ...row, shortDescription: `Service Item ${i + 1}`, longDescription: `Service item description ${i + 1}`, hospitalDescription: `Hospital Service ${i + 1}`, alias: `Service alias ${i + 1}`, departmentName: `Department ${i + 1}` }));
    renameRows(scoped('benefits'), 'id', Array.from({ length: 3 }, (_, i) => ({ id: `BEN-2026-00${i + 1}` })), (row, i) => ({ ...row, name: `Benefit ${i + 1}`, description: `Benefit description ${i + 1}`, ruleTitle: `Benefit rule ${i + 1}` }));
    renameRows(scoped('discounts'), 'id', Array.from({ length: 3 }, (_, i) => ({ id: `DISC-2026-00${i + 1}` })), (row, i) => ({ ...row, name: `Discount ${i + 1}`, description: `Discount description ${i + 1}`, rules: (row.rules || []).map((rule, ruleIndex) => ({ ...rule, ruleTitle: `Discount rule ${ruleIndex + 1}` })) }));
    renameRows(scoped('tat-rules'), 'id', Array.from({ length: 3 }, (_, i) => ({ id: `tat-rule-00${i + 1}` })), (row, i) => ({ ...row, contractLabel: row.contractId ? `Contract ${row.contractId.slice(-1)}` : '—' }));
    renameRows(scoped('consultation-rules'), 'id', Array.from({ length: 3 }, (_, i) => ({ id: `consult-rule-00${i + 1}` })), (row) => ({ ...row, updatedBy: 'User 1' }));
  });

  // Organization-owned staff fixtures use stable seed IDs. Other shared staff
  // records and all assignment relationships remain untouched.
  const renameOrganization = (key, kind) => {
    const rows = readArray(key); let changed = false;
    const next = rows.map((row, index) => {
      const rawId = String(row.id || '');
      const match = rawId.match(/^org-(practitioner|user|role)(?:-seed)?-(\d+)(?:-(.*))?$/);
      if (!match || match[1] !== kind) return row;
      const roleSuffix = kind === 'role' ? rawId.match(/role-(\d+)$/) : null;
      const number = Number(roleSuffix?.[1] || match[3] || match[2]); const updated = { ...row };
      if (kind === 'practitioner' || kind === 'user') { updated.englishName = `${kind === 'user' ? 'User' : 'Practitioner'} ${number}`; updated.arabicName = `${kind === 'user' ? 'مستخدم' : 'ممارس'} ${number}`; }
      else { updated.englishName = `Role ${number}`; updated.arabicName = `دور ${number}`; }
      changed ||= updated.englishName !== row.englishName || updated.arabicName !== row.arabicName;
      return updated;
    });
    if (changed) persist(key, next);
  };
  renameOrganization('rcm-organization-practitioners:v1', 'practitioner');
  renameOrganization('rcm-organization-users:v1', 'user');
  renameOrganization('rcm-organization-roles:v1', 'role');
})();
