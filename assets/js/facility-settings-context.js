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

  const reportPageHeight = () => {
    const height = Math.ceil(Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.getBoundingClientRect().height,
    ));
    window.parent.postMessage({ type: 'rcm:facility-embed-size', height }, window.location.origin);
  };

  let resizeFrame = 0;
  const scheduleHeightReport = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(reportPageHeight);
  };

  window.addEventListener('resize', scheduleHeightReport);
  window.addEventListener('load', scheduleHeightReport, { once: true });
  document.addEventListener('DOMContentLoaded', () => {
    const heightObserver = new ResizeObserver(scheduleHeightReport);
    heightObserver.observe(document.documentElement);
    heightObserver.observe(document.body);
    scheduleHeightReport();
  }, { once: true });
})();
