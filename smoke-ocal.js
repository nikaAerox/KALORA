/* smoke-ocal.js — ujian asap: paparan kalendar pegawai (Agenda | Calendar grid) */
'use strict';

var path = require('path');

var passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  ok   - ' + msg); }
  else { failed++; console.log('  FAIL - ' + msg); }
}

/* ---------- DOM / storage stubs ---------- */
function makeEl(id) {
  return {
    id: id || '',
    innerHTML: '',
    textContent: '',
    value: '',
    hidden: false,
    className: '',
    style: {},
    listeners: {},
    attrs: {},
    classList: { add: function () {}, remove: function () {}, contains: function () { return false; } },
    addEventListener: function (t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    removeEventListener: function () {},
    appendChild: function (c) { return c; },
    remove: function () {},
    focus: function () {},
    closest: function () { return null; },
    getAttribute: function (n) { return this.attrs[n] != null ? this.attrs[n] : null; },
    setAttribute: function (n, v) { this.attrs[n] = v; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
  };
}

var docListeners = {};
var elements = {};
var documentStub = {
  getElementById: function (id) { return elements[id] || (elements[id] = makeEl(id)); },
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  createElement: function () { return makeEl(); },
  addEventListener: function (t, fn) { (docListeners[t] = docListeners[t] || []).push(fn); },
  body: makeEl('body')
};

var store = {};
var localStorageStub = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};

global.document = documentStub;
global.localStorage = localStorageStub;
global.window = { scrollTo: function () {} };

/* ---------- dispatch helpers ---------- */
function content() { return elements['content'] ? elements['content'].innerHTML : ''; }

function dispatch(type, ev) {
  (docListeners[type] || []).forEach(function (fn) { fn(ev); });
}

function fireNav(id) {
  var navEl = { getAttribute: function (n) { return n === 'data-nav' ? id : null; } };
  dispatch('click', {
    preventDefault: function () {},
    target: { closest: function (sel) { return sel === '[data-nav]' ? navEl : null; } }
  });
}

function fireAct(act, args) {
  var actEl = {
    getAttribute: function (n) {
      if (n === 'data-act') return act;
      if (n === 'data-args') return args ? JSON.stringify(args) : null;
      return null;
    }
  };
  dispatch('click', {
    preventDefault: function () {},
    target: {
      closest: function (sel) {
        if (sel === '[data-act]') return actEl;
        return null;
      }
    }
  });
}

function fireChange(id, value) {
  var ev = { target: { id: id, value: value } };
  (elements['content'].listeners.change || []).forEach(function (fn) { fn(ev); });
}

function inputValue(id) {
  var m = content().match(new RegExp('id="' + id + '" value="([^"]*)"'));
  return m ? m[1] : null;
}

function todayISO() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

/* ---------- load system ---------- */
require(path.join(__dirname, 'script.js'));
dispatch('DOMContentLoaded', {});

console.log('1. Asas');
ok(elements['content'] && content().length > 0, 'dashboard dirender selepas init');

console.log('2. Navigasi ke Calendar (lalai = Agenda list)');
fireNav('calendar');
var h = content();
ok(h.indexOf('Officer Schedule') !== -1, 'tajuk Officer Schedule dipaparkan');
ok(h.indexOf('data-act="cal-view"') !== -1, 'toggle Agenda | Calendar wujud');
ok(h.indexOf("data-args='{\"view\":\"list\"}' aria-pressed=\"true\"") !== -1, 'tab Agenda aktif secara lalai (aria-pressed=true)');
ok(h.indexOf("data-args='{\"view\":\"grid\"}' aria-pressed=\"false\"") !== -1, 'tab Calendar tidak aktif secara lalai');
ok(h.indexOf('cal-day') !== -1, 'senarai agenda (blok cal-day) dipaparkan');
ok(h.indexOf('Mesyuarat Pengurusan UMS') !== -1, 'entri benih (c1) dalam agenda');
ok(h.indexOf('vgrid') === -1, 'tiada grid jadual dalam mod Agenda');
ok(h.indexOf('cal-tools') === -1, 'tiada toolbar grid dalam mod Agenda');
ok(h.indexOf('selOfficerFilter') !== -1, 'penapis pegawai wujud');
ok(h.indexOf('badge green">Confirmed') !== -1, 'legenda status dipaparkan');

console.log('3. Tukar ke mod Calendar (grid mingguan)');
fireAct('cal-view', { view: 'grid' });
h = content();
ok(h.indexOf("data-args='{\"view\":\"grid\"}' aria-pressed=\"true\"") !== -1, 'tab Calendar kini aktif');
ok(h.indexOf('selOfficerCalMode') !== -1, 'select Paparan Harian/Mingguan wujud');
ok(h.indexOf('inOfficerCalDate') !== -1, 'input tarikh wujud');
ok(h.indexOf('data-act="oc-prev"') !== -1 && h.indexOf('data-act="oc-today"') !== -1 && h.indexOf('data-act="oc-next"') !== -1, 'butang navigasi prev/today/next wujud');
ok(h.indexOf('Jadual Mingguan') !== -1, 'tajuk Jadual Mingguan dipaparkan');
ok(h.indexOf('class="vgrid') !== -1, 'grid vgrid dipaparkan');
ok(h.indexOf('vgrid one-day') === -1, 'grid tiada kelas one-day dalam mod mingguan');
ok((h.match(/<td class="vslot">/g) || []).length > 100, 'seluruh sel slot kosong dirender (15 jam x 7 hari)');
ok(h.indexOf('Tiada entri kalendar untuk paparan ini.') !== -1, 'amaran tarikh kosong dipaparkan (minggu ini tiada entri)');
ok(h.indexOf('selOfficerFilter') !== -1, 'penapis pegawai kekal dalam mod grid');
ok(h.indexOf('badge green">Confirmed') !== -1, 'legenda status kekal dalam mod grid');

console.log('4. Grid mingguan memaparkan entri (tarikh benih 20/09/2026)');
fireChange('inOfficerCalDate', '2026-09-20');
h = content();
ok(inputValue('inOfficerCalDate') === '2026-09-20', 'tarikh toolbar dikemas kini');
ok(h.indexOf('Jadual Mingguan &middot; 14/09/2026 &ndash; 20/09/2026') !== -1, 'tajuk minggu 14/09-20/09 betul');
ok(h.indexOf('<b>Mesyuarat Pengurusan UMS</b>') !== -1, 'blok entri c1 (mula 09:00) dirender');
ok(h.indexOf('obook confirmed') !== -1, 'kelas status .obook.confirmed digunakan');
ok(h.indexOf('obook confirmed cont') !== -1, 'sambungan entri merentas jam (.cont) dirender');
ok(h.indexOf('<b>Program Universiti (jadual sedia ada)</b>') !== -1, 'entri c3 (Siti 14:00) dirender');
ok(h.indexOf('>3 entri</span>') !== -1, 'kiraan entri hari (3 entri pada 20/09) betul');
ok(h.indexOf('Tiada entri kalendar untuk paparan ini.') === -1, 'amaran tarikh kosong hilang apabila ada entri');
ok(h.indexOf('title="Mesyuarat Pengurusan UMS | Ahmad bin Ali') !== -1, 'tooltip blok mengandungi maklumat penuh');

console.log('5. Penapis pegawai dalam mod grid (regresi: params tidak hilang)');
fireChange('selOfficerFilter', 'Ahmad bin Ali');
h = content();
ok(h.indexOf('class="vgrid') !== -1, 'paparan kekal selepas tukar penapis (calView tidak hilang)');
ok(h.indexOf('value="Ahmad bin Ali" selected') !== -1, 'penapis Ahmad dipilih');
ok(h.indexOf('<b>Mesyuarat Pengurusan UMS</b>') !== -1, 'entri Ahmad dipaparkan');
ok(h.indexOf('Program Universiti (jadual sedia ada)') === -1, 'entri Siti ditapis keluar');

console.log('6. Semua status grid (22/09-27/09/2026)');
fireChange('selOfficerFilter', 'semua');
fireChange('inOfficerCalDate', '2026-09-22');
h = content();
ok(h.indexOf('Jadual Mingguan &middot; 21/09/2026 &ndash; 27/09/2026') !== -1, 'tajuk minggu 21/09-27/09 betul');
ok(h.indexOf('Seminar Pemantapan Pengurusan') !== -1, 'entri c5 dirender');
ok(h.indexOf('obook tentative') !== -1, 'kelas .obook.tentative digunakan');
ok(h.indexOf('obook hold') !== -1, 'kelas .obook.hold digunakan (c7)');
ok(h.indexOf('obook cancelled') !== -1, 'kelas .obook.cancelled digunakan (c8)');
ok(h.indexOf('Program Perkembangan Staf') !== -1, 'entri c7 (Abdul Rahman) dirender');
ok(h.indexOf('Mesyuarat Jawatankuasa Kecil') !== -1, 'entri c8 dirender');

console.log('7. Mod Harian');
fireChange('selOfficerCalMode', 'harian');
h = content();
ok(h.indexOf('Jadual Harian &middot; 22 September 2026') !== -1, 'tajuk Jadual Harian betul');
ok(h.indexOf('vgrid one-day') !== -1, 'grid guna kelas one-day');
ok((h.match(/class="vday-d"/g) || []).length === 1, 'hanya 1 lajur hari dalam mod harian');
ok(h.indexOf('Agenda &middot; 22 September 2026') !== -1, 'kad agenda harian dipaparkan');
ok(h.indexOf('<b>Seminar Pemantapan Pengurusan</b>') !== -1, 'entri 22/09 dalam agenda harian');

console.log('8. Navigasi tarikh');
fireAct('oc-next');
ok(inputValue('inOfficerCalDate') === '2026-09-23', 'oc-next dalam mod harian = +1 hari');
h = content();
ok(h.indexOf('Program Perkembangan Staf') !== -1, 'agenda harian ikut tarikh baharu (23/09)');
fireChange('selOfficerCalMode', 'mingguan');
fireAct('oc-prev');
ok(inputValue('inOfficerCalDate') === '2026-09-16', 'oc-prev dalam mod mingguan = -7 hari');
fireAct('oc-next');
ok(inputValue('inOfficerCalDate') === '2026-09-23', 'oc-next dalam mod mingguan = +7 hari');
fireAct('oc-today');
ok(inputValue('inOfficerCalDate') === todayISO(), 'oc-today kembali ke tarikh hari ini');

console.log('8b. Paparan Bulanan (grid bulanan)');
fireChange('inOfficerCalDate', '2026-09-01');
fireChange('selOfficerCalMode', 'bulanan');
h = content();
ok(h.indexOf('Jadual Bulanan') !== -1, 'tajuk Jadual Bulanan dipaparkan');
ok(h.indexOf('Paparan Bulanan') !== -1, 'pilihan Paparan Bulanan dalam select mod');
ok(h.indexOf('inOfficerCalMonth') !== -1, 'input bulan (type=month) wujud');
ok(inputValue('inOfficerCalMonth') === '2026-09', 'nilai input bulan 2026-09 betul');
ok((h.match(/class="mday /g) || []).length > 20, 'sel hari dalam bulan dirender (>20)');
ok(h.indexOf('inOfficerCalDate') === -1, 'input tarikh harian tiada dalam mod bulanan');
ok(h.indexOf('class="mday full"') !== -1, 'hari 20/09 (3 entri) dikelaskan mday full');
ok(h.indexOf('class="mday busy"') !== -1, 'hari 1-2 entri dikelaskan mday busy');
ok(h.indexOf('class="mday free"') !== -1, 'hari tanpa entri dikelaskan mday free');
ok(h.indexOf('class="mday blank"') !== -1, 'sel kosong pelengkap grid wujud');
ok(h.indexOf('isnin') !== -1 || h.indexOf('Isnin') !== -1, 'kepala minggu (Isnin-Ahad) dipaparkan');
fireAct('oc-prev');
ok(inputValue('inOfficerCalMonth') === '2026-08', 'oc-prev dalam mod bulanan = tolak 1 bulan');
fireAct('oc-next');
ok(inputValue('inOfficerCalMonth') === '2026-09', 'oc-next dalam mod bulanan = tambah 1 bulan');
fireAct('oc-day', { date: '2026-09-20' });
h = content();
ok(inputValue('inOfficerCalDate') === '2026-09-20', 'klik hari membuka mod Harian pada 20/09');
ok(h.indexOf('Jadual Harian') !== -1, 'mod Harian dipaparkan selepas klik');
ok(h.indexOf('vgrid one-day') !== -1, 'grid one-day selepas drill-down');
fireChange('selOfficerCalMode', 'mingguan');

console.log('9. Kekal selepas pertukaran tab Venue <-> Officer');
fireAct('cal-tab', { mode: 'venue' });
h = content();
ok(h.indexOf('Venue Schedule') !== -1, 'tab Venue masih berfungsi');
ok(h.indexOf('selVenueCalFilter') !== -1, 'toolbar venue dipaparkan');
fireAct('cal-tab', { mode: 'pegawai' });
h = content();
ok(h.indexOf('Officer Schedule') !== -1, 'kembali ke tab Officer');
ok(h.indexOf('selOfficerCalMode') !== -1, 'mod grid kekal selepas pertukaran tab');

console.log('10. Kembali ke mod Agenda');
fireAct('cal-view', { view: 'list' });
h = content();
ok(h.indexOf("data-args='{\"view\":\"list\"}' aria-pressed=\"true\"") !== -1, 'tab Agenda aktif semula');
ok(h.indexOf('cal-day') !== -1, 'senarai agenda dipaparkan semula');
ok(h.indexOf('class="vgrid') === -1, 'grid tiada dalam mod Agenda');
ok(h.indexOf('cal-tools') === -1, 'toolbar grid tiada dalam mod Agenda');
ok(h.indexOf('selOfficerFilter') !== -1, 'penapis pegawai kekal dalam mod Agenda');

console.log('11. Integriti sumber');
var src = require('fs').readFileSync(path.join(__dirname, 'script.js'), 'utf8');
var fnCount = (src.match(/^\s*function /gm) || []).length;
ok(fnCount === 129, 'bilangan fungsi script.js = 129 (dapat: ' + fnCount + ')');
var names = (src.match(/^\s*function ([A-Za-z0-9_]+)/gm) || []).map(function (s) {
  return s.trim().replace(/^function /, '');
});
var dupes = names.filter(function (n, i) { return names.indexOf(n) !== i; });
ok(dupes.length === 0, 'tiada fungsi duplikat' + (dupes.length ? ': ' + dupes.join(',') : ''));

console.log('');
console.log(passed + ' lulus, ' + failed + ' gagal');
process.exit(failed ? 1 : 0);
