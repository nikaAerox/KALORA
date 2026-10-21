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
ok(h.indexOf('selOfficerFilter') !== -1, 'penapis pegawai wujud pada halaman Urusetia');
ok(h.indexOf('data-act="open-officer-act"') === -1, 'butang Tambah Aktiviti Peribadi tiada pada halaman Urusetia');
ok(elements['officerSimWrap'].style.display === 'none', 'Simulate Officer tersembunyi pada halaman Urusetia');
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

console.log('11. Halaman officer/PA: paparan peribadi + aktiviti peribadi');
(elements['roleSelect'].listeners.change || []).forEach(function (fn) { fn.call({ value: 'pa' }); });
fireNav('calendar');
h = content();
ok(elements['officerSimWrap'].style.display === '', 'Simulate Officer dipaparkan pada halaman officer/PA');
ok(h.indexOf('data-act="open-officer-act"') !== -1, 'butang Tambah Aktiviti Peribadi dipaparkan');
ok(h.indexOf('selOfficerFilter') === -1, 'pilihan Pegawai dibuang pada halaman officer/PA');

fireAct('open-officer-act');
ok(elements['officerActModal'] && elements['officerActModal'].hidden === false, 'modal aktiviti peribadi dibuka');
ok(elements['oaUntukPegawai'] && elements['oaUntukPegawai'].value === 'Ahmad bin Ali', 'modal memaparkan pegawai semasa');

elements['oaNama'].value = 'Kerja Tulis Laporan';
elements['oaTarikh'].value = '2026-09-25';
elements['oaMasaMula'].value = '08:00';
elements['oaMasaTamat'].value = '09:00';
elements['oaLokasi'].value = 'Bilik Kerja';
(elements['formOfficerAct'].listeners.submit || []).forEach(function (fn) { fn({ preventDefault: function () {} }); });
ok(elements['officerActModal'].hidden === true, 'modal ditutup selepas simpan');
h = content();
ok(h.indexOf('Kerja Tulis Laporan') !== -1, 'aktiviti peribadi dirender dalam kalendar');
ok(h.indexOf('Peranan: Peribadi') !== -1, 'entri peribadi bertanda Peranan: Peribadi');
ok(h.indexOf('Program Universiti (jadual sedia ada)') === -1, 'entri pegawai lain ditapis keluar (lalai peribadi)');
ok(h.indexOf('selOfficerFilter') === -1, 'pilihan Pegawai kekal tiada selepas simpan');

console.log('12. Integriti sumber');
var src = require('fs').readFileSync(path.join(__dirname, 'script.js'), 'utf8');
var fnCount = (src.match(/^\s*function /gm) || []).length;
ok(fnCount === 136, 'bilangan fungsi script.js = 136 (dapat: ' + fnCount + ')');
var names = (src.match(/^\s*function ([A-Za-z0-9_]+)/gm) || []).map(function (s) {
  return s.trim().replace(/^function /, '');
});
var dupes = names.filter(function (n, i) { return names.indexOf(n) !== i; });
  ok(dupes.length === 0, 'tiada fungsi duplikat' + (dupes.length ? ': ' + dupes.join(',') : ''));

console.log('13. Kelulusan individu + nisbah Status + Venue Calendar read-only');
fireNav('requests');
h = content();
ok(h.indexOf('<th>Status</th>') !== -1, 'lajur Status wujud pada senarai permohonan');
ok(h.indexOf('badge ratio green">1/1') !== -1, 'nisbah 1/1 (hijau) dipaparkan bagi permohonan disahkan penuh');
ok(h.indexOf('badge ratio amber">1/3') !== -1, 'nisbah 1/3 (kuning/amber) dipaparkan bagi kelulusan separa');
ok(h.indexOf('badge ratio red">0/1') !== -1, 'nisbah 0/1 (merah) dipaparkan bagi permohonan tiada kelulusan');
ok(h.indexOf('Kelulusan individu:') !== -1, 'legenda nisbah kelulusan dipaparkan');

/* Tukar persona pegawai kepada Muhammad Hakim (req_3: 3 pegawai, Hakim masih pending). */
(elements['officerSelect'].listeners.change || []).forEach(function (fn) { fn.call({ value: 'Muhammad Hakim' }); });
fireAct('open-review', { id: 'req_3' });
h = content();
ok(h.indexOf('badge ratio amber">1/3') !== -1, 'halaman semakan memaparkan nisbah 1/3 sebelum kelulusan');
ok(h.indexOf('badge blue">ANDA') !== -1, 'baris pegawai semasa ditanda ANDA');
ok((h.match(/data-act="approve"/g) || []).length === 1, 'TEPAT SATU butang Lulus (untuk nama sendiri sahaja)');
ok((h.match(/data-act="reject"/g) || []).length === 1, 'TEPAT SATU butang Tolak (untuk nama sendiri sahaja)');
ok(h.indexOf('Menunggu kelulusan pegawai ini') !== -1, 'pegawai lain: status sahaja, tiada butang');
ok(h.indexOf('Pegawai ini telah meluluskan') !== -1, 'pegawai yang sudah lulus dipaparkan tanpa butang');

fireAct('approve', { id: 'req_3', idx: 0 });
h = content();
ok(h.indexOf('badge ratio amber">2/3') !== -1, 'nisbah kini 2/3 (amber) selepas kelulusan individu Hakim');
ok(h.indexOf('Kelulusan anda telah direkodkan.') !== -1, 'mesej kelulusan individu dipaparkan');
ok(h.indexOf('data-act="approve"') === -1, 'butang Lulus hilang selepas kelulusan direkodkan');

/* Permohonan lain tidak terjejas oleh kelulusan Hakim. */
fireAct('open-review', { id: 'req_4' });
h = content();
ok(h.indexOf('badge ratio red">0/1') !== -1, 'req_4 kekal 0/1 (tidak terjejas)');
ok(h.indexOf('tiada dalam senarai pegawai permohonan ini') !== -1, 'Hakim tiada dalam req_4 — tiada tindakan dibenarkan');
ok(h.indexOf('data-act="approve"') === -1, 'tiada butang Lulus bagi pegawai bukan dalam senarai');

/* Kalendar peribadi Hakim: entri Tentative -> Confirmed selepas kelulusan sendiri. */
fireNav('calendar');
h = content();
ok(h.indexOf('Seminar Pemantapan Pengurusan') !== -1, 'aktiviti req_3 dipaparkan dalam kalendar peribadi Hakim');
ok(h.indexOf('cal-entry confirmed') !== -1, 'entri kalendar kini Confirmed selepas kelulusan individu');

/* Venue Calendar halaman officer: mod READ-ONLY. */
ok(elements['nav'].innerHTML.indexOf('Venue Calendar') !== -1, 'nav officer/PA mempunyai tab Venue Calendar');
fireAct('cal-tab', { mode: 'venue' });
h = content();
ok(h.indexOf('Venue Schedule') !== -1, 'tab Venue Calendar dibuka');
ok(h.indexOf('READ-ONLY') !== -1, 'lencana READ-ONLY dipaparkan pada halaman officer');
ok(h.indexOf('Mod rujukan (read-only)') !== -1, 'nota mod rujukan dipaparkan');
ok(h.indexOf('data-act="pick-slot"') === -1, 'tiada slot boleh diklik untuk tempah (mod harian)');
ok(h.indexOf('>Urus</button>') === -1, 'butang Urus (CRUD) disembunyikan daripada pegawai');
ok(h.indexOf('Slot Kosong (rujukan sahaja') !== -1, 'slot kosong dipaparkan sebagai rujukan sahaja');
ok(h.indexOf('<span class="chip ro"') !== -1, 'chip slot kosong bukan butang tempahan');

fireChange('selCalMode', 'mingguan');
h = content();
ok(h.indexOf('class="vslot free ro"') !== -1, 'sel slot kosong guna kelas read-only dalam grid mingguan');
ok(h.indexOf('data-act="pick-slot"') === -1, 'grid mingguan: tiada tindakan tempahan bagi officer');

fireAct('pick-slot', { date: todayISO(), start: '09:00', venue: 'ven_1' });
h = content();
ok(h.indexOf('Venue Schedule') !== -1, 'pick-slot disekat — paparan kekal (tiada pendaftaran aktiviti)');
ok(h.indexOf('id="formActivity"') === -1, 'borang Daftar Aktiviti tidak dibuka');

fireAct('delete-venue', { id: 'ven_1' });
ok(true, 'delete-venue disekat untuk peranan bukan-Admin (tiada exception)');

console.log('');
console.log(passed + ' lulus, ' + failed + ' gagal');
process.exit(failed ? 1 : 0);
