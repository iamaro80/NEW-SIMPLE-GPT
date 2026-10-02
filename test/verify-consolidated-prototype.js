const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const htmlFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(target);
  }
}
walk(root);
assert.equal(htmlFiles.length, 21, `Expected 21 HTML files, found ${htmlFiles.length}`);

const css = fs.readFileSync(path.join(root, 'assets/css/shadcn.css'), 'utf8');
const theme = fs.readFileSync(path.join(root, 'assets/js/theme.js'), 'utf8');
assert.match(css, /--background:/);
assert.match(css, /\.dark\s*\{/);
assert.match(css, /--card:/);
assert.match(css, /--border:/);
assert.match(theme, /localStorage/);
assert.match(theme, /classList\.toggle\('dark'/);
assert.match(theme, /prefers-color-scheme/);

const themeStorage = new Map([['rcm-prototype-theme', 'dark']]);
function loadTheme(view) {
  const handlers = {};
  const classes = new Set();
  const button = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  const document = {
    currentScript: { dataset: { themeView: view } },
    documentElement: { classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } } },
    querySelectorAll() { return [button]; },
    addEventListener(name, handler) { handlers[name] = handler; },
  };
  vm.runInNewContext(theme, {
    document,
    localStorage: { getItem(key) { return themeStorage.get(key) ?? null; }, setItem(key, value) { themeStorage.set(key, value); } },
    matchMedia() { return { matches: false }; },
  });
  return {
    isDark: () => classes.has('dark'),
    toggle() { handlers.click({ target: { closest() { return button; } } }); },
  };
}
const facilityTheme = loadTheme('facility');
assert.equal(facilityTheme.isDark(), true, 'legacy theme should migrate to Facility only');
facilityTheme.toggle();
assert.equal(facilityTheme.isDark(), false);
assert.equal(themeStorage.get('rcm-prototype-theme:facility'), 'light');
const organizationTheme = loadTheme('organization');
assert.equal(organizationTheme.isDark(), false, 'Organization should use its independent system default');
organizationTheme.toggle();
assert.equal(organizationTheme.isDark(), true);
assert.equal(themeStorage.get('rcm-prototype-theme:facility'), 'light', 'Organization toggle must not change Facility preference');
assert.equal(loadTheme('facility').isDark(), false, 'Facility preference should persist independently');
assert.equal(loadTheme('control-panel').isDark(), false, 'Control Panel should retain its independent system default');

const facilityFiles = htmlFiles.filter((file) => path.relative(root, file).startsWith(`facility${path.sep}`));
assert.equal(facilityFiles.length, 18, `Expected 18 Facility pages, found ${facilityFiles.length}`);
for (const file of facilityFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).split(path.sep).join('/');
  assert.match(html, /id="sidebar-container"/, `${relative}: missing sidebar container`);
  assert.match(html, /id="topbar-container"/, `${relative}: missing topbar container`);
  assert.match(html, /class="workspace"/, `${relative}: missing minimal workspace`);
  assert.match(html, /data-breadcrumb-current/, `${relative}: missing breadcrumb current page`);
  const navigationScript = relative === 'facility/settings/index.html' ? 'settings-sidebar.js' : 'facility-sidebar.js';
  const source = html.match(new RegExp(`<script src="([^"]*${navigationScript})"`));
  assert.ok(source, `${relative}: missing ${navigationScript}`);
  assert.ok(fs.existsSync(path.resolve(path.dirname(file), source[1])), `${relative}: broken navigation script path`);
}
assert.match(fs.readFileSync(path.join(root, 'assets/js/facility-sidebar.js'), 'utf8'), /data-theme-toggle/);
const settingsHtml = fs.readFileSync(path.join(root, 'facility/settings/index.html'), 'utf8');
const settingsNav = fs.readFileSync(path.join(root, 'assets/js/settings-sidebar.js'), 'utf8');
assert.match(settingsHtml, /settings-sidebar\.js/);
assert.doesNotMatch(settingsHtml, /facility-sidebar\.js/);
assert.match(settingsNav, /Facility Settings/);
for (const label of [
  'Organization and Access', 'Facility', 'Branches', 'Departments', 'Cost Centers', 'Practitioners', 'Users', 'Roles', 'Billing Periods',
  'Payers Setup', 'Payers', 'TPAs', 'Insurance Setup', 'Policies', 'Plans', 'Benefits', 'Payer Contracts', 'Contracts', 'Direct Billing Toggle',
  'Billing Rules', 'TAT Management', 'Consultation Rules', 'Services and Pricing', 'Service Items', 'Categories and Groups', 'Service Catalog',
  'Master Price Lists', 'Price Lists', 'Premium Pricing', 'Discounts', 'HIS Management', 'Reference Data', 'Global Dictionary', 'Audit Log',
]) assert.ok(settingsNav.includes(`'${label}'`) || settingsNav.includes(`label: '${label}'`), `Settings navigation missing ${label}`);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).split(path.sep).join('/');
  const expectedView = relative.startsWith('facility/') ? 'facility'
    : relative.startsWith('organization/') ? 'organization'
      : relative.startsWith('control-panel/') ? 'control-panel' : 'launcher';
  assert.match(html, new RegExp(`theme\.js" data-theme-view="${expectedView}"`), `${relative}: incorrect theme view scope`);
  for (const [, href] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(href)) continue;
    const targetPath = href.split(/[?#]/, 1)[0];
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), targetPath)), `${relative}: broken local reference ${href}`);
  }
}

console.log(`Verified ${htmlFiles.length} HTML pages, 18 Facility layouts, theme assets, and local references.`);
