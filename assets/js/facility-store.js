(() => {
  const storageKey = 'rcm-facilities:v1';
  const hcpOptions = [
    '(10000300091434) Facility 1 HCP',
    'Facility 2 HCP',
    'Facility 3 HCP',
    'Facility 4 HCP',
    'Facility 5 HCP',
    'Facility 6 HCP',
  ];
  const seed = [
    { arabicName: 'المنشأة 1', englishName: 'Facility 1', unifiedId: '7001000001', licenseNumber: 'LIC-2024-001', phone: '+966 13 533 8080', country: 'Saudi Arabia', city: 'Riyadh', district: 'Al Olaya', active: true },
    { arabicName: 'المنشأة 2', englishName: 'Facility 2', unifiedId: '7001000002', licenseNumber: 'LIC-2024-002', phone: '+966 14 844 4444', country: 'Saudi Arabia', city: 'Madinah', district: 'Al Jumuah', active: true },
    { arabicName: 'المنشأة 3', englishName: 'Facility 3', unifiedId: '7001000003', licenseNumber: 'LIC-2024-003', phone: '+966 14 422 1100', country: 'Saudi Arabia', city: 'Tabuk', district: 'Al Muruj', active: false },
    { arabicName: 'المنشأة 4', englishName: 'Facility 4', unifiedId: '7001000004', licenseNumber: 'LIC-2024-004', phone: '+966 13 895 7000', country: 'Saudi Arabia', city: 'Al Khobar', district: 'Al Aqrabiyah', active: true },
    { arabicName: 'المنشأة 5', englishName: 'Facility 5', unifiedId: '7001000005', licenseNumber: 'LIC-2024-005', phone: '+966 13 815 5777', country: 'Saudi Arabia', city: 'Dammam', district: 'Al Shifa', active: true },
    { arabicName: 'المنشأة 6', englishName: 'Facility 6', unifiedId: '7001000006', licenseNumber: 'LIC-2024-006', phone: '+966 12 647 5555', country: 'Saudi Arabia', city: 'Jeddah', district: 'Al Kandarah', active: false },
  ].map((facility, index) => ({
    ...facility,
    id: index + 1,
    facilityIdentifier: String(47 + index),
    hcp: hcpOptions[index],
    contactName: `Contact ${index + 1}`,
    email: `contact${index + 1}@example.com`,
    phoneCountryCode: '+966',
    phoneLocal: facility.phone.replace(/^\+966\s*/, ''),
    extension: '',
    mobileCountryCode: '+966',
    mobileLocal: `5${String(10000000 + index * 17321).slice(0, 8)}`,
    licenseStart: '',
    licenseEnd: '',
    chiId: ['1000000000', '111', '1060'][index % 3],
    vatNumber: `310${String(100000000 + index).padStart(9, '0')}03`,
    crNumber: `1010${String(1000000 + index)}`,
    nhicNumber: `NHIC-${String(index + 1).padStart(4, '0')}`,
    category: ['Hospital', 'Clinic', 'General Medical Complex'][index % 3],
    buildingNumber: '',
    streetName: '',
    postalCode: '',
    additionalNumber: '',
    episodeExpiry: 'Two Weeks',
    autoAuthorization: false,
    invoiceConfigEnglish: '',
    invoiceConfigArabic: '',
    backgroundColor: '#1e76b5',
    foregroundColor: '#ffffff',
    zatcaOrganizationId: '',
    zatcaInvoiceBook: '',
  }));

  const testFacilityIds = new Set(seed.map((facility) => String(facility.id)));
  let memoryRecords = seed;
  const inTestScope = (records) => records.filter((facility) => testFacilityIds.has(String(facility.id)));

  function publish(records) {
    window.dispatchEvent(new CustomEvent('rcm:facilities-changed', { detail: { facilities: records } }));
  }

  function list() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const legacyContacts = ['Sara Alotaibi', 'Faisal Alharbi', 'Noura Aldosari'];
          memoryRecords = parsed.map((facility) => {
            if (!testFacilityIds.has(String(facility.id))) return facility;
            const hcpCode = Number(facility.id) === 1 && String(facility.hcp || '').startsWith('(') ? `(${String(facility.hcp).match(/^\(([^)]+)\)/)?.[1]}) ` : '';
            return { ...facility, englishName: `Facility ${facility.id}`, arabicName: `المنشأة ${facility.id}`, hcp: `${hcpCode}Facility ${facility.id} HCP`, contactName: legacyContacts.includes(facility.contactName) ? `Contact ${facility.id}` : facility.contactName };
          });
          if (memoryRecords.some((facility, index) => facility !== parsed[index])) localStorage.setItem(storageKey, JSON.stringify(memoryRecords));
          return inTestScope(memoryRecords);
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep the mock workflow available when browser storage is unavailable. */ }
    return memoryRecords;
  }

  function save(records) {
    const submitted = new Map(records.filter((facility) => testFacilityIds.has(String(facility.id))).map((facility) => [String(facility.id), facility]));
    const preserved = memoryRecords.filter((facility) => !testFacilityIds.has(String(facility.id)));
    memoryRecords = [...preserved, ...submitted.values()];
    try { localStorage.setItem(storageKey, JSON.stringify(memoryRecords)); } catch { /* In-memory CRUD remains available. */ }
    publish(inTestScope(memoryRecords));
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey || event.newValue === null) return;
    try {
      const records = JSON.parse(event.newValue);
      if (Array.isArray(records)) {
        memoryRecords = records;
        publish(inTestScope(records));
      }
    } catch { /* Ignore invalid external storage updates. */ }
  });

  window.RcmFacilityStore = { storageKey, hcpOptions, list, save };
})();
