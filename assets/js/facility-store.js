(() => {
  const storageKey = 'rcm-facilities:v1';
  const hcpOptions = [
    '(10000300091434) Al Ansari Specialist Hospital - Yanbu',
    'King Abdullah Specialized Hospital- Alqassim',
    'King Fahad Hospital',
    'Tabuk Medical Center',
  ];
  const seed = [
    { arabicName: 'مستشفى الملك عبدالله التخصصي بالقصيم', englishName: 'King Abdullah Specialized Hospital- Alqassim', unifiedId: '7001000001', licenseNumber: 'LIC-2024-001', phone: '+966 13 533 8080', country: 'Saudi Arabia', city: 'Riyadh', district: 'Al Olaya', active: true },
    { arabicName: 'مستشفى الملك فهد', englishName: 'King Fahad Hospital', unifiedId: '7001000002', licenseNumber: 'LIC-2024-002', phone: '+966 14 844 4444', country: 'Saudi Arabia', city: 'Madinah', district: 'Al Jumuah', active: true },
    { arabicName: 'مركز تبوك الطبي', englishName: 'Tabuk Medical Center', unifiedId: '7001000003', licenseNumber: 'LIC-2024-003', phone: '+966 14 422 1100', country: 'Saudi Arabia', city: 'Tabuk', district: 'Al Muruj', active: false },
    { arabicName: 'مجمع الخبر الطبي', englishName: 'Al Khobar Medical Complex', unifiedId: '7001000004', licenseNumber: 'LIC-2024-004', phone: '+966 13 895 7000', country: 'Saudi Arabia', city: 'Al Khobar', district: 'Al Aqrabiyah', active: true },
    { arabicName: 'مستشفى الدمام المركزي', englishName: 'Dammam Central Hospital', unifiedId: '7001000005', licenseNumber: 'LIC-2024-005', phone: '+966 13 815 5777', country: 'Saudi Arabia', city: 'Dammam', district: 'Al Shifa', active: true },
    { arabicName: 'مستشفى جدة العام', englishName: 'Jeddah General Hospital', unifiedId: '7001000006', licenseNumber: 'LIC-2024-006', phone: '+966 12 647 5555', country: 'Saudi Arabia', city: 'Jeddah', district: 'Al Kandarah', active: false },
    { arabicName: 'مركز الرياض التخصصي', englishName: 'Riyadh Specialty Center', unifiedId: '7001000007', licenseNumber: 'LIC-2024-007', phone: '+966 11 465 0000', country: 'Saudi Arabia', city: 'Riyadh', district: 'Al Malaz', active: true },
    { arabicName: 'عيادات المدينة الطبية', englishName: 'Madinah Medical Clinics', unifiedId: '7001000008', licenseNumber: 'LIC-2024-008', phone: '+966 14 820 4000', country: 'Saudi Arabia', city: 'Madinah', district: 'Qurban', active: true },
    { arabicName: 'مجمع تبوك الصحي', englishName: 'Tabuk Health Complex', unifiedId: '7001000009', licenseNumber: 'LIC-2024-009', phone: '+966 14 422 9090', country: 'Saudi Arabia', city: 'Tabuk', district: 'Al Faisaliyah', active: true },
    { arabicName: 'مستشفى الخليج', englishName: 'Gulf Hospital', unifiedId: '7001000010', licenseNumber: 'LIC-2024-010', phone: '+966 13 859 9999', country: 'Saudi Arabia', city: 'Al Khobar', district: 'Al Thuqbah', active: true },
    { arabicName: 'مركز النور الطبي', englishName: 'Al Noor Medical Center', unifiedId: '7001000011', licenseNumber: 'LIC-2024-011', phone: '+966 13 832 2323', country: 'Saudi Arabia', city: 'Dammam', district: 'Al Faisaliyah', active: false },
    { arabicName: 'مستشفى السلام', englishName: 'Al Salam Hospital', unifiedId: '7001000012', licenseNumber: 'LIC-2024-012', phone: '+966 12 682 2222', country: 'Saudi Arabia', city: 'Jeddah', district: 'Al Sharafiyah', active: true },
  ].map((facility, index) => ({
    ...facility,
    id: index + 1,
    facilityIdentifier: String(47 + index),
    hcp: hcpOptions[index % hcpOptions.length],
    contactName: ['Sara Alotaibi', 'Faisal Alharbi', 'Noura Aldosari'][index % 3],
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

  let memoryRecords = seed;

  function publish(records) {
    window.dispatchEvent(new CustomEvent('rcm:facilities-changed', { detail: { facilities: records } }));
  }

  function list() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryRecords = parsed;
          return parsed;
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } catch { /* Keep the mock workflow available when browser storage is unavailable. */ }
    return memoryRecords;
  }

  function save(records) {
    memoryRecords = records;
    try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* In-memory CRUD remains available. */ }
    publish(records);
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey || event.newValue === null) return;
    try {
      const records = JSON.parse(event.newValue);
      if (Array.isArray(records)) {
        memoryRecords = records;
        publish(records);
      }
    } catch { /* Ignore invalid external storage updates. */ }
  });

  window.RcmFacilityStore = { storageKey, hcpOptions, list, save };
})();
