(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('embed') !== 'organization') return;

  document.documentElement.classList.add('organization-embedded');
  const facilityId = params.get('facilityId');
  if (facilityId && /^\d+$/.test(facilityId)) document.body.dataset.currentFacilityId = facilityId;
  document.body.dataset.organizationEmbed = 'true';

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.data?.type !== 'rcm:theme') return;
    if (event.data.theme !== 'light' && event.data.theme !== 'dark') return;
    document.documentElement.classList.toggle('dark', event.data.theme === 'dark');
  });
})();
