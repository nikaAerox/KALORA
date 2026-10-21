/* ============================================================
   KALORA - UMS Activity & Officer Calendar System
   Prototaip FRONTEND sahaja. Tiada backend / pangkalan data.
   Semua simulasi menggunakan JavaScript + localStorage.
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- CONSTANS ---------------- */

  var STORAGE_KEY = 'kalora_db_v2';
  var LEGACY_STORAGE_KEY = 'kalora_db_v1';

  var CATEGORIES = [
    'Mesyuarat',
    'Majlis Rasmi',
    'Program / Acara',
    'Seminar / Persidangan',
    'Bengkel / Kursus',
    'Lawatan Rasmi',
    'Ceramah / Taklimat',
    'Lain-lain'
  ];

  var PRIORITIES = ['Rendah', 'Sederhana', 'Tinggi'];

  var INVITATION_ROLES = [
    'Tetamu Kehormat',
    'Perasmi',
    'Penyampai Ucapan',
    'Panel',
    'Jemputan Rasmi',
    'Wakil Universiti',
    'Urusetia',
    'Kehadiran Diperlukan',
    'Hadir Jika Berkelapangan'
  ];

  var OFFICERS = [
    'Ahmad bin Ali',
    'Siti Aminah',
    'Muhammad Hakim',
    'Nur Aisyah',
    'Abdul Rahman',
    'Fatin Nabilah',
    'Hafizuddin bin Johan'
  ];

  /* Jadual sedia ada (simulasi) - contoh jadual pegawai yang telah wujud. */
  var FAKE_SCHEDULES = [
    { officer: 'Ahmad bin Ali', 'start': '09:00', 'end': '10:00', title: 'Mesyuarat Pengurusan' },
    { officer: 'Siti Aminah', 'start': '14:00', 'end': '16:00', title: 'Program Universiti' }
  ];

  /* Data benih venue rasmi UMS (untuk ujian / demo). */
  var VENUES_SEED = [
    {
      id: 'ven_1', nama: 'Dewan Canselor UMS', kod: 'DCU', kapasiti: 3000,
      lokasi: 'Bangunan Canselor, Universiti Malaysia Sabah',
      fasiliti: ['Pentas Utama', 'PA System', 'VIP Lounge'], status: 'aktif'
    },
    {
      id: 'ven_2', nama: 'Bilik Mesyuarat Utama (JAFPIB)', kod: 'BMU-JAFPIB', kapasiti: 30,
      lokasi: 'JAFPIB / Pejabat Pendaftar',
      fasiliti: ['Projektor', 'Video Conference'], status: 'aktif'
    },
    {
      id: 'ven_3', nama: 'Dewan Kuliah Pusat 1 (DKP 1)', kod: 'DKP1', kapasiti: 200,
      lokasi: 'Bangunan DKP, Pusat Akademik', fasiliti: ['Smart Board', 'PA System'], status: 'aktif'
    },
    {
      id: 'ven_4', nama: 'Auditorium FKJ', kod: 'AUD-FKJ', kapasiti: 150,
      lokasi: 'Fakulti Kejuruteraan',
      fasiliti: ['Projektor', 'Sound System'], status: 'penyelenggaraan'
    }
  ];

  /* Jam operasi venue untuk cadangan slot kosong. */
  var VENUE_HOURS = { start: 8, end: 23 };

  var ACTIVE_STATUS = 'aktif';
  var MAINT_STATUS = 'penyelenggaraan';

  var MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  var NAVS = {
    urusetia: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'activities', label: 'Activities' },
      { id: 'create-activity', label: 'Create Activity' },
      { id: 'requests', label: 'Attendance Requests' },
      { id: 'calendar', label: 'Calendar' }
    ],
    pa: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'requests', label: 'Attendance Requests' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'venue-calendar', label: 'Venue Calendar' }
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'users', label: 'Users' },
      { id: 'categories', label: 'Categories' },
      { id: 'roles', label: 'Invitation Roles' },
      { id: 'venues', label: 'Venue Management' },
      { id: 'settings', label: 'System Settings' },
      { id: 'audit', label: 'Audit Log' }
    ]
  };

  var ROLE_LABEL = { urusetia: 'URUSETIA', pa: 'PA / NC', admin: 'ADMIN' };

  var VIEW_TITLES = {
    'dashboard': 'Dashboard',
    'activities': 'Activities',
    'create-activity': 'Daftar Aktiviti',
    'officers': 'Pilihan Pegawai',
    'requests': 'Attendance Requests',
    'review': 'Semakan Permohonan Kehadiran',
    'submitted': 'Permohonan Dihantar',
    'calendar': 'Calendar',
    'venues': 'Pengurusan Venue',
    'users': 'User Management',
    'categories': 'Category Management',
    'roles': 'Invitation Role Management',
    'settings': 'System Settings',
    'audit': 'Audit Log'
  };

  /* ---------------- STATE ---------------- */

  var state = {
    role: 'urusetia',
    view: 'dashboard',
    viewParams: {},
    currentOfficer: null,
    draftActivityId: null,
    activities: [],
    requests: [],
    calendar: [],
    notifications: [],
    audit: [],
    categories: [],
    roles: [],
    officers: [],
    venues: [],
    settings: { systemName: 'KALORA', footerNote: 'Prototaip frontend sahaja. Tiada backend / pangkalan data.', demoActive: true },
    roleChangedNotice: null
  };

  var viewParams = {};

  var adminEdit = { user: null, categoryIdx: null, roleIdx: null };

  /* ---------------- HELPERS ---------------- */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function fmtTime(t) {
    if (!t) return '';
    var p = t.split(':');
    var h = parseInt(p[0], 10);
    var m = p[1];
    var ap = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12;
    if (hh === 0) hh = 12;
    return hh + ':' + m + ' ' + ap;
  }

  function fmtDate(d) {
    if (!d) return '';
    var p = d.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function fmtDateLong(d) {
    if (!d) return '';
    var p = d.split('-');
    return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  function overlaps(s1, e1, s2, e2) {
    return s1 < e2 && s2 < e1;
  }

  function toast(msg, type) {
    var wrap = $('toastWrap');
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .3s';
      setTimeout(function () { el.remove(); }, 350);
    }, 2600);
  }

  function audit(msg) {
    state.audit.unshift({ msg: msg, time: new Date().toLocaleString('ms-MY') });
    if (state.audit.length > 50) state.audit.length = 50;
  }

  function notify(msg) {
    state.notifications.unshift({ id: uid('n_'), msg: msg, time: new Date().toLocaleString('ms-MY'), read: false });
    if (state.notifications.length > 30) state.notifications.length = 30;
  }

  function scoreRequestStatus(status) {
    if (status === 'pending') return { label: 'Menunggu Semakan PA/NC', cls: 'amber', sub: 'PENDING APPROVAL' };
    if (status === 'confirmed') return { label: 'Disahkan', cls: 'green', sub: 'CONFIRMED' };
    if (status === 'rejected') return { label: 'Ditolak', cls: 'red', sub: 'REJECTED' };
    return { label: status, cls: 'gray' };
  }

  /* Nisbah kelulusan KEHADIRAN INDIVIDU: berapa pegawai telah Lulus / jumlah jemputan.
     Hijau = semua lulus, Amber = separa, Merah = tiada kelulusan. */
  function approvalRatio(req) {
    var officers = (req && req.officers) || [];
    var total = officers.length;
    var confirmed = officers.filter(function (o) { return o.status === 'confirmed'; }).length;
    var cls = (total > 0 && confirmed === total) ? 'green' : (confirmed === 0 ? 'red' : 'amber');
    var sub = (total > 0 && confirmed === total) ? 'Semua pegawai lulus'
      : (confirmed === 0 ? 'Tiada kelulusan' : 'Sebahagian lulus');
    return { total: total, confirmed: confirmed, cls: cls, text: confirmed + '/' + total, sub: sub };
  }

  /* Kemas kini status agregat permohonan & aktiviti berdasarkan status individu pegawai. */
  function syncRequestStatus(req) {
    var officers = req.officers || [];
    var total = officers.length;
    var confirmed = officers.filter(function (o) { return o.status === 'confirmed'; }).length;
    var rejected = officers.filter(function (o) { return o.status === 'rejected'; }).length;
    var st = 'pending';
    if (total > 0 && confirmed === total) st = 'confirmed';
    else if (total > 0 && rejected === total) st = 'rejected';
    req.status = st;

    var act = getActivity(req.activityId);
    if (act && act.status !== 'draf') {
      if (st === 'confirmed') act.status = 'disahkan';
      else if (st === 'rejected') act.status = 'ditolak';
      else act.status = 'menunggu';
    }
    return st;
  }

  /* Normalisasi data lama: setiap pegawai wujud dalam permohonan mesti mempunyai
     status kelulusan INDIVIDU sendiri ('pending' | 'confirmed' | 'rejected'). */
  function normalizeRequests() {
    (state.requests || []).forEach(function (r) {
      if (!Array.isArray(r.officers)) r.officers = [];
      r.officers.forEach(function (o) {
        if (o.status !== 'confirmed' && o.status !== 'rejected') {
          o.status = r.status === 'confirmed' ? 'confirmed'
            : (r.status === 'rejected' ? 'rejected' : 'pending');
        }
      });
      syncRequestStatus(r);
    });
  }

  function calStatusBadge(st) {
    if (st === 'Confirmed') return '<span class="badge green">Confirmed</span>';
    if (st === 'Tentative') return '<span class="badge gray">Tentative</span>';
    if (st === 'Hold') return '<span class="badge amber">Hold</span>';
    if (st === 'Cancelled') return '<span class="badge red">Cancelled</span>';
    return '<span class="badge gray">' + esc(st) + '</span>';
  }

  function getActivity(id) {
    for (var i = 0; i < state.activities.length; i++) {
      if (state.activities[i].id === id) return state.activities[i];
    }
    return null;
  }

  function getRequest(id) {
    for (var i = 0; i < state.requests.length; i++) {
      if (state.requests[i].id === id) return state.requests[i];
    }
    return null;
  }

  /* ============================================================
     MODUL PENGURUSAN VENUE
     - data venue (localStorage: kalora_db_v2)
     - CRUD venue (Admin)
     - semakan pertindihan slot venue (Urusetia)
     - kalendar venue (mingguan / harian)
     ============================================================ */

  var DAYS_SHORT = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

  var venueModalId = null;
  var venueSuggest = { venue: false, time: false };
  var venueCalCtx = { venue: 'semua', mode: 'harian', date: '' };

  function getVenue(id) {
    for (var i = 0; i < state.venues.length; i++) {
      if (state.venues[i].id === id) return state.venues[i];
    }
    return null;
  }

  function venueByName(name) {
    for (var i = 0; i < state.venues.length; i++) {
      if (state.venues[i].nama === name) return state.venues[i];
    }
    return null;
  }

  function sortedVenues() {
    return state.venues.slice().sort(function (a, b) {
      if ((a.status === 'aktif') !== (b.status === 'aktif')) return a.status === 'aktif' ? -1 : 1;
      return a.nama < b.nama ? -1 : 1;
    });
  }

  function isActiveVenue(v) { return !!v && v.status === 'aktif'; }

  function toMin(t) {
    if (!t) return 0;
    var p = String(t).split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }

  function fromMin(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  }

  /* Aktiviti berstatus Menunggu Semakan (Pending) atau Disahkan (Confirmed) => venue ditempah. */
  function isVenueBooking(a) {
    return a.status === 'menunggu' || a.status === 'disahkan';
  }

  function venueStatusBadge(v) {
    if (!v) return '<span class="badge gray">Tiada Venue</span>';
    if (v.status === 'penyelenggaraan') return '<span class="badge red">&#9888;&#65039; Dalam Penyelenggaraan</span>';
    return '<span class="badge green">&#10003; Aktif</span>';
  }

  function venueLabel(a) {
    if (!a) return '-';
    if (a.venueId) {
      var v = getVenue(a.venueId);
      if (v) return v.nama;
    }
    return a.lokasi || '-';
  }

  function venueFacilitiesHtml(fasiliti) {
    var list = fasiliti || [];
    if (!list.length) return '<span style="color:var(--muted)">-</span>';
    return '<div class="chip-row">' + list.map(function (x) {
      return '<span class="chip">' + esc(x) + '</span>';
    }).join('') + '</div>';
  }

  function venueMetaHtml(v) {
    return '<div class="venue-meta">' +
      '<div><span class="k">Kod</span><span class="v">' + esc(v.kod) + '</span></div>' +
      '<div><span class="k">Kapasiti</span><span class="v">' + esc(v.kapasiti) + ' pax</span></div>' +
      '<div><span class="k">Lokasi / Bangunan</span><span class="v">' + esc(v.lokasi) + '</span></div>' +
      '<div><span class="k">Status</span><span class="v">' + venueStatusBadge(v) + '</span></div>' +
      '<div class="full"><span class="k">Fasiliti</span><span class="v">' + venueFacilitiesHtml(v.fasiliti) + '</span></div>' +
      '</div>';
  }

  /* Adakah aktiviti/permohonan ini menggunakan venue tertentu? */
  function sameVenueId(a, id) {
    if (!a || !id) return false;
    if (a.venueId) return a.venueId === id;
    var v = venueByName(a.lokasi);
    return !!v && v.id === id;
  }

  function venueUses(id) {
    var n = 0;
    state.activities.forEach(function (a) {
      if (isVenueBooking(a) && sameVenueId(a, id)) n++;
    });
    return n;
  }

  function venueBookings(filter) {
    filter = filter || {};
    return state.activities.filter(function (a) {
      if (!isVenueBooking(a)) return false;
      if (filter.venueId && filter.venueId !== 'semua' && !sameVenueId(a, filter.venueId)) return false;
      if (filter.date && a.tarikh !== filter.date) return false;
      return true;
    }).sort(function (x, y) {
      if (x.tarikh !== y.tarikh) return x.tarikh < y.tarikh ? -1 : 1;
      return toMin(x.masaMula) - toMin(y.masaMula);
    });
  }

  /* Cari aktiviti (Pending / Confirmed) yang bertindih dengan slotvenue. */
  function findVenueConflict(v, tarikh, start, end, excludeId) {
    var found = null;
    state.activities.forEach(function (a) {
      if (found || a.id === excludeId) return;
      if (!isVenueBooking(a)) return;
      if (a.tarikh !== tarikh) return;
      if (!sameVenueId(a, v.id)) return;
      if (overlaps(start, end, a.masaMula, a.masaTamat)) found = a;
    });
    return found;
  }

  /* Semakan slot venue: mod = no-venue | incomplete | invalid-time | maintenance | available | conflict */
  function venueSlotCheck(venueId, tarikh, start, end, excludeId) {
    var v = getVenue(venueId);
    if (!v) return { mode: 'no-venue', blocked: true };
    if (!tarikh || !start || !end) return { mode: 'incomplete', blocked: false, venue: v };
    if (end <= start) return { mode: 'invalid-time', blocked: false, venue: v };
    if (!isActiveVenue(v)) return { mode: 'maintenance', blocked: true, venue: v };
    var c = findVenueConflict(v, tarikh, start, end, excludeId);
    return { mode: c ? 'conflict' : 'available', blocked: !!c, venue: v, conflict: c, tarikh: tarikh, start: start, end: end, excludeId: excludeId };
  }

  /* Cadangan venue lain yang bebas pada slot tersebut. */
  function freeVenueIds(tarikh, start, end, excludeId) {
    return state.venues.filter(isActiveVenue).filter(function (v) {
      if (v.id === excludeId) return false;
      return !findVenueConflict(v, tarikh, start, end, null);
    }).map(function (v) { return v.id; });
  }

  /* Cadangan slot kosong (sama venue) yang muat dalam tempoh aktiviti. */
  function freeTimeSlots(v, tarikh, start, end, excludeId) {
    var dur = toMin(end) - toMin(start);
    if (dur <= 0) return [];
    var booked = state.activities.filter(function (a) {
      return a.id !== excludeId && isVenueBooking(a) && a.tarikh === tarikh && sameVenueId(a, v.id);
    }).map(function (a) {
      return { s: toMin(a.masaMula), e: toMin(a.masaTamat) };
    }).sort(function (x, y) { return x.s - y.s; });

    var out = [];
    var cur = VENUE_HOURS.start * 60;
    var limit = VENUE_HOURS.end * 60;
    booked.forEach(function (b) {
      if (b.s - cur >= dur) out.push({ s: cur, e: cur + dur });
      cur = Math.max(cur, b.e);
    });
    if (limit - cur >= dur) out.push({ s: cur, e: cur + dur });
    return out.filter(function (o) {
      return !(o.s === toMin(start) && o.e === toMin(end));
    }).slice(0, 5);
  }

  /* Semua ruang masa kosong pada satu tarikh (untuk paparan harian). */
  function freeWindows(v, tarikh) {
    var booked = state.activities.filter(function (a) {
      return isVenueBooking(a) && a.tarikh === tarikh && sameVenueId(a, v.id);
    }).map(function (a) {
      return { s: toMin(a.masaMula), e: toMin(a.masaTamat) };
    }).sort(function (x, y) { return x.s - y.s; });

    var out = [];
    var cur = VENUE_HOURS.start * 60;
    var limit = VENUE_HOURS.end * 60;
    booked.forEach(function (b) {
      if (b.s - cur >= 30) out.push({ s: cur, e: b.s });
      cur = Math.max(cur, b.e);
    });
    if (limit - cur >= 30) out.push({ s: cur, e: limit });
    return out;
  }

  function addDays(iso, n) {
    var d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function addMonths(iso, n) {
    var d = new Date(iso + 'T00:00:00');
    var day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dd;
  }

  function weekDays(iso) {
    var d = new Date(iso + 'T00:00:00');
    var shift = (d.getDay() + 6) % 7; // 0 = Isnin
    var monday = addDays(iso, -shift);
    var out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(monday, i));
    return out;
  }

  /* ---------------- KETERSEDIAAN VENUE: KOTAK MAKLUMAT ---------------- */

  function avBox(kind, ico, title, text) {
    return '<div class="venue-avail ' + kind + '">' +
      '<div class="va-ico">' + ico + '</div>' +
      '<div class="va-body"><div class="va-title">' + title + '</div>' +
      '<div class="va-text">' + text + '</div></div></div>';
  }

  function venueAvailHtml(d) {
    if (d.mode === 'no-venue') {
      return avBox('idle', '&#127969;&#65039;',
        '<strong>Belum pilih venue</strong>',
        'Sila pilih venue rasmi daripada senarai di atas untuk menyemak ketersediaan slot.');
    }

    var v = d.venue;

    if (d.mode === 'incomplete') {
      return avBox('warn', '&#128197;',
        '<strong>' + esc(v.nama) + ' &mdash; belum boleh disemak</strong>',
        'Lengkapkan tarikh, masa mula dan masa tamat untuk menyemak ketersediaan venue.');
    }

    if (d.mode === 'invalid-time') {
      return avBox('warn', '&#9888;&#65039;',
        '<strong>Masa tidak sah</strong>',
        'Masa tamat mesti selepas masa mula. Sila betulkan julat masa aktiviti.');
    }

    if (d.mode === 'maintenance') {
      return avBox('bad', '&#128295;',
        '<strong>Pertindihan Venue Dikesan &mdash; ' + esc(v.nama) + ' sedang dalam penyelenggaraan</strong>',
        'Venue ini berstatus <b>Dalam Penyelenggaraan</b> dan tidak boleh ditempah. ' +
        'Sila pilih venue lain melalui butang <b>Tukar Venue</b> di bawah.') +
        venueMetaHtml(v) + venueActionRow(true, true);
    }

    if (d.mode === 'available') {
      return avBox('ok', '&#9989;',
        '<strong>Venue Tersedia</strong>',
        esc(v.nama) + ' bebas pada ' + esc(fmtDateLong(d.tarikh)) + ', ' +
        esc(fmtTime(d.start)) + ' &ndash; ' + esc(fmtTime(d.end)) + '. Anda boleh teruskan pendaftaran aktiviti.') +
        venueMetaHtml(v) + venueActionRow(false, false);
    }

    var c = d.conflict;
    var list = '<ul class="va-list"><li><b>' + esc(c.nama) + '</b> &mdash; ' +
      esc(fmtDateLong(c.tarikh)) + ', ' + esc(fmtTime(c.masaMula)) + ' &ndash; ' + esc(fmtTime(c.masaTamat)) +
      ' &middot; ' + (c.status === 'disahkan'
        ? '<span class="badge green">Disahkan</span>'
        : '<span class="badge amber">Menunggu Semakan</span>') + '</li></ul>';

    return avBox('bad', '&#10060;',
      '<strong>Pertindihan Venue Dikesan</strong>',
      esc(v.nama) + ' telah ditempah pada slot tersebut. Sila <b>Tukar Venue</b> atau <b>Tukar Masa</b> sebelum meneruskan.') +
      list + venueActionRow(true, true) + venueSuggestionHtml(d, v);
  }

  function venueActionRow(withSwap, withCal) {
    var btns = '';
    if (withSwap) btns += '<button class="btn btn-sm" data-act="venue-swap-venue">Tukar Venue</button> ';
    if (withSwap) btns += '<button class="btn btn-sm btn-outline" data-act="venue-swap-time">Tukar Masa</button> ';
    if (withCal) btns += '<button class="btn btn-sm btn-outline" data-act="go-venue-calendar">Lihat Kalendar Venue</button>';
    return btns ? '<div class="btn-row">' + btns + '</div>' : '';
  }

  function venueSuggestionHtml(d, v) {
    var out = '';

    if (venueSuggest.venue) {
      var alts = freeVenueIds(d.tarikh, d.start, d.end, d.excludeId);
      out += '<div class="va-sugg"><b>Venue lain yang tersedia pada slot ini:</b>' +
        (alts.length
          ? '<div class="chip-row">' + alts.map(function (id) {
              var av = getVenue(id);
              return '<button class="chip chip-btn" data-act="venue-use" data-args=\'{"id":"' + esc(id) + '"}\'>' +
                esc(av.nama) + ' &middot; ' + esc(av.kapasiti) + ' pax</button>';
            }).join('') + '</div>'
          : '<div class="va-muted">Tiada venue lain yang tersedia untuk slot ini.</div>') +
        '</div>';
    }

    if (venueSuggest.time) {
      var slots = freeTimeSlots(v, d.tarikh, d.start, d.end, d.excludeId);
      out += '<div class="va-sugg"><b>Slot kosong pada ' + esc(v.nama) + ' (' + esc(fmtDate(d.tarikh)) + '):</b>' +
        (slots.length
          ? '<div class="chip-row">' + slots.map(function (s) {
              return '<button class="chip chip-btn" data-act="venue-use-time" data-args=\'{"start":"' + s.s + '","end":"' + s.e + '"}\'>' +
                esc(fmtTime(fromMin(s.s))) + ' &ndash; ' + esc(fmtTime(fromMin(s.e))) + '</button>';
            }).join('') + '</div>'
          : '<div class="va-muted">Tiada slot kosong mencukupi pada tarikh ini. Sila tukar tarikh atau venue.</div>') +
        '</div>';
    }

    return out;
  }

  function collectVenueForm() {
    return venueSlotCheck(
      $('selVenue') ? $('selVenue').value : '',
      $('inTarikh') ? $('inTarikh').value : '',
      $('inMula') ? $('inMula').value : '',
      $('inTamat') ? $('inTamat').value : '',
      $('actId') ? $('actId').value : ''
    );
  }

  function refreshVenueAvail() {
    var box = $('venueAvailBox');
    if (!box) return;
    var d = collectVenueForm();
    box.innerHTML = venueAvailHtml(d);
    var btn = $('btnSubmitActivity');
    if (btn) btn.disabled = !!d.blocked;
  }

  function focusField(id) {
    var el = $(id);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.focus();
  }

  function useSuggestedVenue(id) {
    var sel = $('selVenue');
    if (!sel) return;
    sel.value = id;
    venueSuggest = { venue: false, time: false };
    var v = getVenue(id);
    toast('Venue ditukar kepada ' + (v ? v.nama : id) + '.');
    refreshVenueAvail();
  }

  function useSuggestedTime(start, end) {
    if ($('inMula')) $('inMula').value = start;
    if ($('inTamat')) $('inTamat').value = end;
    venueSuggest = { venue: false, time: false };
    toast('Masa ditukar kepada ' + fmtTime(start) + ' &ndash; ' + fmtTime(end) + '.');
    refreshVenueAvail();
  }

  /* ---------------- PERSISTENCE ---------------- */

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

function seedData() {
    state.categories = CATEGORIES.slice();
    state.roles = INVITATION_ROLES.slice();
    state.officers = OFFICERS.map(function (n) { return { name: n, role: 'urusetia' }; });
    state.venues = normalizeVenues(null);

    var a1 = {
      id: 'act_1', nama: 'Mesyuarat Pengurusan UMS', kategori: 'Mesyuarat',
      tarikh: '2026-09-20', masaMula: '09:00', masaTamat: '11:00',
      lokasi: 'Bilik Mesyuarat Utama (JAFPIB)', venueId: 'ven_2', jafpib: 'JAFPIB / Pejabat Pendaftar',
      keutamaan: 'Tinggi', penerangan: 'Mesyuarat pengurusan bulanan.',
      status: 'disahkan', officers: [{ name: 'Ahmad bin Ali', peranan: 'Perasmi', kehadiran: 'Wajib' }], checked: true
    };
    var a2 = {
      id: 'act_2', nama: 'Program Universiti', kategori: 'Program / Acara',
      tarikh: '2026-09-21', masaMula: '14:00', masaTamat: '16:00',
      lokasi: 'Dewan Kuliah Pusat 1 (DKP 1)', venueId: 'ven_3', jafpib: 'HEPA', keutamaan: 'Sederhana',
      penerangan: 'Program tahunan universiti.',
      status: 'disahkan', officers: [{ name: 'Siti Aminah', peranan: 'Panel', kehadiran: 'Wajib' }], checked: true
    };
    var a3 = {
      id: 'act_3', nama: 'Seminar Pemantapan Pengurusan', kategori: 'Seminar / Persidangan',
      tarikh: '2026-09-22', masaMula: '10:00', masaTamat: '12:00',
      lokasi: 'Dewan Canselor UMS', venueId: 'ven_1', jafpib: 'BPI', keutamaan: 'Tinggi',
      penerangan: 'Seminar dalaman untuk kakitangan.',
      status: 'menunggu', officers: [
        { name: 'Muhammad Hakim', peranan: 'Panel', kehadiran: 'Wajib' },
        { name: 'Nur Aisyah', peranan: 'Penyampai Ucapan', kehadiran: 'Wajib' },
        { name: 'Fatin Nabilah', peranan: 'Hadir Jika Berkelapangan', kehadiran: 'Pilihan' }
      ], checked: true
    };

    /* Demo tempahan venue pada minggu semasa (untuk Kalendar Venue & semakan pertindihan). */
    var a4 = {
      id: 'act_4', nama: 'Majlis Anugerah Akademik UMS', kategori: 'Majlis Rasmi',
      tarikh: addDays(todayISO(), 1), masaMula: '09:00', masaTamat: '12:00',
      lokasi: 'Dewan Canselor UMS', venueId: 'ven_1', jafpib: 'BPI', keutamaan: 'Tinggi',
      penerangan: 'Majlis anugerah pelajarkatan.',
      status: 'disahkan', officers: [{ name: 'Nur Aisyah', peranan: 'Perasmi', kehadiran: 'Wajib' }], checked: true
    };
    var a5 = {
      id: 'act_5', nama: 'Taklimat Latihan Staf Jabatan', kategori: 'Ceramah / Taklimat',
      tarikh: addDays(todayISO(), 2), masaMula: '14:00', masaTamat: '16:00',
      lokasi: 'Bilik Mesyuarat Utama (JAFPIB)', venueId: 'ven_2', jafpib: 'JAFPIB', keutamaan: 'Sederhana',
      penerangan: 'Taklimat program latihan staf.',
      status: 'menunggu', officers: [{ name: 'Abdul Rahman', peranan: 'Panel', kehadiran: 'Wajib' }], checked: true
    };
    var a6 = {
      id: 'act_6', nama: 'Forum Alumni Pascasiswaji FKJ', kategori: 'Program / Acara',
      tarikh: addDays(todayISO(), 3), masaMula: '10:00', masaTamat: '12:00',
      lokasi: 'Auditorium FKJ', venueId: 'ven_4', jafpib: 'FKJ', keutamaan: 'Sederhana',
      penerangan: 'Forum alumni (draf - venue dalam penyelenggaraan).',
      status: 'draf', officers: [], checked: false, conflicts: null
    };

    state.activities = [a1, a2, a3, a4, a5, a6];

    state.requests = [
      {
        id: 'req_1', activityId: 'act_1',
        nama: 'Mesyuarat Pengurusan UMS', kategori: 'Mesyuarat',
        tarikh: '2026-09-20', masaMula: '09:00', masaTamat: '11:00',
        lokasi: 'Bilik Mesyuarat Utama (JAFPIB)', venueId: 'ven_2', keutamaan: 'Tinggi',
        officers: [{ name: 'Ahmad bin Ali', peranan: 'Perasmi', kehadiran: 'Wajib', status: 'confirmed' }],
        status: 'confirmed', submittedAt: '18 Sep 2026, 10:15'
      },
      {
        id: 'req_2', activityId: 'act_2',
        nama: 'Program Universiti', kategori: 'Program / Acara',
        tarikh: '2026-09-21', masaMula: '14:00', masaTamat: '16:00',
        lokasi: 'Dewan Kuliah Pusat 1 (DKP 1)', venueId: 'ven_3', keutamaan: 'Sederhana',
        officers: [{ name: 'Siti Aminah', peranan: 'Panel', kehadiran: 'Wajib', status: 'confirmed' }],
        status: 'confirmed', submittedAt: '18 Sep 2026, 11:00'
      },
      {
        id: 'req_3', activityId: 'act_3',
        nama: 'Seminar Pemantapan Pengurusan', kategori: CATEGORIES[4],
        tarikh: '2026-09-22', masaMula: '10:00', masaTamat: '12:00',
        lokasi: 'Dewan Canselor UMS', venueId: 'ven_1', keutamaan: 'Tinggi',
        officers: [
          { name: 'Muhammad Hakim', peranan: 'Panel', kehadiran: 'Wajib', status: 'pending' },
          { name: 'Nur Aisyah', peranan: 'Penyampai Ucapan', kehadiran: 'Wajib', status: 'pending' },
          { name: 'Fatin Nabilah', peranan: 'Hadir Jika Berkelapangan', kehadiran: 'Pilihan', status: 'confirmed' }
        ],
        status: 'pending', submittedAt: '20 Sep 2026, 09:05'
      },
      {
        id: 'req_4', activityId: 'act_5',
        nama: 'Taklimat Latihan Staf Jabatan', kategori: 'Ceramah / Taklimat',
        tarikh: addDays(todayISO(), 2), masaMula: '14:00', masaTamat: '16:00',
        lokasi: 'Bilik Mesyuarat Utama (JAFPIB)', venueId: 'ven_2', keutamaan: 'Sederhana',
        officers: [{ name: 'Abdul Rahman', peranan: 'Panel', kehadiran: 'Wajib', status: 'pending' }],
        status: 'pending', submittedAt: new Date().toLocaleString('ms-MY')
      }
    ];

    state.calendar = [
      { id: 'c1', date: '2026-09-20', start: '09:00', end: '11:00', title: 'Mesyuarat Pengurusan UMS', officer: 'Ahmad bin Ali', role: 'Perasmi', status: 'Confirmed' },
      { id: 'c2', date: '2026-09-20', start: '09:00', end: '10:00', title: 'Mesyuarat Pengurusan (jadual sedia ada)', officer: 'Ahmad bin Ali', role: '-', status: 'Confirmed' },
      { id: 'c3', date: '2026-09-20', start: '14:00', end: '16:00', title: 'Program Universiti (jadual sedia ada)', officer: 'Siti Aminah', role: '-', status: 'Confirmed' },
      { id: 'c4', date: '2026-09-21', start: '14:00', end: '16:00', title: 'Program Universiti', officer: 'Siti Aminah', role: 'Panel', status: 'Confirmed' },
      { id: 'c5', date: '2026-09-22', start: '10:00', end: '12:00', title: 'Seminar Pemantapan Pengurusan', officer: 'Muhammad Hakim', role: 'Panel', status: 'Tentative' },
      { id: 'c6', date: '2026-09-24', start: '09:00', end: '12:00', title: 'Latihan Kesedaran Etika', officer: 'Nur Aisyah', role: 'Penyampai Ucapan', status: 'Tentative' },
      { id: 'c7', date: '2026-09-23', start: '15:00', end: '17:00', title: 'Program Perkembangan Staf', officer: 'Abdul Rahman', role: 'Jemputan Rasmi', status: 'Hold' },
      { id: 'c8', date: '2026-09-26', start: '10:00', end: '11:00', title: 'Mesyuarat Jawatankuasa Kecil', officer: 'Muhammad Hakim', role: 'Jemputan Rasmi', status: 'Cancelled' }
    ];

    state.audit = [
      { msg: 'Sistem prototaip dimulakan (data contoh dimuatkan).', time: '20 Sep 2026, 09:00' }
    ];

    state.notifications = [
      { id: 'seed_n1', msg: 'Permohonan "Seminar Pemantapan Pengurusan" menunggu semakan PA/NC.', time: '20 Sep 2026, 09:05', read: false }
    ];
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }

    /* Migrasi automatik daripada versi lama (kalora_db_v1) */
    if (!raw) {
      try { raw = localStorage.getItem(LEGACY_STORAGE_KEY); } catch (e2) { /* ignore */ }
    }

    try {
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && saved.activities) Object.assign(state, saved);
      }
    } catch (e) { /* ignore */ }

    if (!state.activities || !state.activities.length) {
      state.activities = []; state.requests = []; state.calendar = []; state.notifications = []; state.audit = [];
      seedData();
    }
    if (!state.calendar || !state.calendar.length) seedData();
    if (!state.categories || !state.categories.length) state.categories = CATEGORIES.slice();
    if (!state.roles || !state.roles.length) state.roles = INVITATION_ROLES.slice();
    if (!state.officers || !state.officers.length) state.officers = OFFICERS.map(function (n) { return { name: n, role: 'urusetia' }; });
    else state.officers = state.officers.map(function (o) { return (typeof o === 'string') ? { name: o, role: 'urusetia' } : o; });
    if (!state.currentOfficer) {
      state.currentOfficer = (state.officers[0] && state.officers[0].name) || OFFICERS[0];
    }
    state.venues = normalizeVenues(state.venues);
    linkVenues();
    normalizeRequests();
    state.settings = Object.assign(
      { systemName: 'KALORA', footerNote: 'Prototaip frontend sahaja. Tiada backend / pangkalan data.', demoActive: true },
      state.settings || {}
    );
  }

  function normalizeVenues(list) {
    if (!Array.isArray(list) || !list.length) {
      return VENUES_SEED.map(function (v) {
        return { id: v.id, nama: v.nama, kod: v.kod, kapasiti: v.kapasiti, lokasi: v.lokasi, fasiliti: v.fasiliti.slice(), status: v.status };
      });
    }
    return list.map(function (v) {
      var fasiliti = v.fasiliti;
      if (!Array.isArray(fasiliti)) {
        fasiliti = fasiliti ? String(fasiliti).split(',') : [];
      }
      return {
        id: v.id || uid('ven_'),
        nama: String(v.nama || '').trim(),
        kod: String(v.kod || '').trim(),
        kapasiti: parseInt(v.kapasiti, 10) || 0,
        lokasi: String(v.lokasi || '').trim(),
        fasiliti: fasiliti.map(function (x) { return String(x).trim(); }).filter(Boolean),
        status: v.status === 'penyelenggaraan' ? 'penyelenggaraan' : 'aktif'
      };
    });
  }

  /* Sambungkan aktiviti / permohonan lama (lokasi teks) kepada rekod venue. */
  function linkVenues() {
    state.activities.forEach(function (a) {
      if (!a.venueId && a.lokasi) {
        var v = venueByName(a.lokasi);
        if (v) a.venueId = v.id;
      }
    });
    state.requests.forEach(function (r) {
      if (!r.venueId && r.lokasi) {
        var v2 = venueByName(r.lokasi);
        if (v2) r.venueId = v2.id;
      }
    });
  }

  /* ---------------- KEMAS KINI SIDEBAR / TITLE ---------------- */

  function renderChrome() {
    var allowed = NAVS[state.role].map(function (n) { return n.id; });

    // Sidebar nav
    var venueMode = state.view === 'calendar' && viewParams.calMode === 'venue';
    var hasVenueNav = NAVS[state.role].some(function (n) { return n.id === 'venue-calendar'; });
    var navHtml = NAVS[state.role].map(function (n) {
      var active;
      if (n.id === 'venue-calendar') active = venueMode ? ' active' : '';
      else if (n.id === 'calendar') active = (state.view === 'calendar' && !(venueMode && hasVenueNav)) ? ' active' : '';
      else active = state.view === n.id ? ' active' : '';
      return '<a href="#" data-nav="' + n.id + '" class="' + active + '">' + esc(n.label) + '</a>';
    }).join('');
    $('nav').innerHTML = navHtml;
    $('sidebarRoleTag').textContent = 'Peranan: ' + ROLE_LABEL[state.role];

    // Topbar title
    $('pageTitle').textContent = VIEW_TITLES[state.view] || 'KALORA';

    // Role select
    $('roleSelect').value = state.role;

    // Officer persona simulator (untuk paparan kalendar peribadi)
    var officerSel = $('officerSelect');
    if (officerSel) {
      var officerNames = (state.officers || []).map(function (o) { return o.name; });
      if (state.currentOfficer && officerNames.indexOf(state.currentOfficer) === -1) {
        officerNames.unshift(state.currentOfficer);
      }
      officerSel.innerHTML = officerNames.map(function (n) {
        return '<option value="' + esc(n) + '"' + (n === state.currentOfficer ? ' selected' : '') + '>' + esc(n) + '</option>';
      }).join('');
    }
    var officerSimWrap = $('officerSimWrap');
    if (officerSimWrap) officerSimWrap.style.display = state.role === 'pa' ? '' : 'none';

    // Bell count
    var unread = state.notifications.filter(function (n) { return !n.read; }).length;
    var bellCount = $('bellCount');
    bellCount.hidden = unread === 0;
    bellCount.textContent = unread > 9 ? '9+' : unread;

    // System settings applied to chrome
    var brandName = document.querySelector('.brand-name');
    if (brandName) brandName.textContent = state.settings.systemName || 'KALORA';
    var sidebarNote = document.querySelector('.sidebar-note');
    if (sidebarNote) {
      sidebarNote.innerHTML = esc(state.settings.footerNote || 'Prototaip frontend sahaja.<br>Tiada backend / pangkalan data.').replace(/\n/g, '<br>');
    }
  }

  /* ---------------- ROUTER ---------------- */

  function show(view, params) {
    /* Alias: "venue-calendar" kini tab Venue dalam halaman Calendar yang disatukan. */
    if (view === 'venue-calendar') {
      params = Object.assign({}, params || {}, { calMode: 'venue' });
      view = 'calendar';
    }
    state.view = view;
    viewParams = params || {};
    renderChrome();
    renderContent();
    window.scrollTo(0, 0);
    save();
  }

  /* Pintasan ke tab Venue dalam halaman Calendar yang disatukan. */
  function showVenueCalendar(params) {
    show('calendar', Object.assign({ calMode: 'venue' }, params || {}));
  }

  function renderContent() {
    var content = $('content');
    switch (state.view) {
      case 'dashboard': content.innerHTML = rDashboard(); break;
      case 'activities': content.innerHTML = rActivities(); break;
      case 'create-activity': content.innerHTML = rCreateActivity(); break;
      case 'officers': content.innerHTML = rOfficers(); break;
      case 'requests': content.innerHTML = rRequests(); break;
      case 'review': content.innerHTML = rReview(); break;
      case 'submitted': content.innerHTML = rSubmitted(); break;
      case 'calendar': content.innerHTML = rCalendarPage(); break;
      case 'venues': content.innerHTML = rVenues(); break;
      case 'users': content.innerHTML = rUsers(); break;
      case 'categories': content.innerHTML = rCategories(); break;
      case 'roles': content.innerHTML = rRoles(); break;
      case 'settings': content.innerHTML = rSettings(); break;
      case 'audit': content.innerHTML = rAudit(); break;
      default: content.innerHTML = rDashboard();
    }
    afterRender();
  }

  function afterRender() {
    if (state.view === 'create-activity') {
      venueSuggest = { venue: false, time: false };
      refreshVenueAvail();
    }
  }

  /* ---------------- SUMBER PELIHAT ---------------- */

  function summaryCounts() {
    var pending = state.requests.filter(function (r) { return r.status === 'pending'; }).length;
    var confirmed = state.requests.filter(function (r) { return r.status === 'confirmed'; }).length;
    var conflicts = 0;
    state.activities.forEach(function (a) {
      if (a.checked && a.conflicts) conflicts += a.conflicts.filter(function (c) { return c.conflict; }).length;
    });
    return {
      activities: state.activities.length,
      pending: pending,
      confirmed: confirmed,
      conflicts: conflicts
    };
  }

  function rDashboard() {
    var s = summaryCounts();
    var flowHtml = flowStrip(['Cipta Aktiviti', 'Pilih Pegawai', 'Semak Ketersediaan', 'Hantar Permohonan', 'Semakan PA/NC', 'Disahkan', 'Kalendar']);
    var roleCta = '';
    if (state.role === 'urusetia') {
      roleCta = '<div class="btn-row"><a href="#" data-nav="create-activity" class="btn">+ Daftar Aktiviti Baharu</a>' +
        '<a href="#" data-nav="requests" class="btn btn-outline">Semak Permohonan</a>' +
        '<a href="#" data-nav="calendar" class="btn btn-outline">Calendar</a></div>';
    } else if (state.role === 'pa') {
      /* Bagi pegawai/PA: kira permohonan yang menunggu KELULUSAN INDIVIDU dirinya sahaja. */
      var meName = state.currentOfficer || '';
      var myWaiting = state.requests.filter(function (r) {
        return (r.officers || []).some(function (o) { return o.name === meName && o.status === 'pending'; });
      });
      roleCta = '<div class="btn-row"><a href="#" data-nav="requests" class="btn">Kelulusan Individu (Bilangan: ' + myWaiting.length + ')</a>' +
        '<a href="#" data-nav="calendar" class="btn btn-outline">Calendar</a>' +
        '<a href="#" data-nav="venue-calendar" class="btn btn-outline">Venue Calendar (Read-Only)</a></div>';
      if (myWaiting.length > 0) {
        roleCta += '<div class="msg info" style="margin-top:14px"><div class="ico">&#8505;</div><div><strong>Menunggu kelulusan anda (' + esc(meName) + ')</strong>' + esc(myWaiting[0].nama) + ' &mdash; ' +
          '<a href="#" data-act="open-review" data-args=\'{"id":"' + myWaiting[0].id + '"}\'>[ Pergi ke Semakan ]</a>' +
          '<br><span style="font-size:13px">Lulus / Tolak hanya untuk nama anda sendiri; pegawai lain meluluskan kelulusan mereka secara berasingan.</span></div></div>';
      }
    } else {
      roleCta = '<div class="btn-row"><a href="#" data-nav="audit" class="btn">Lihat Audit Log</a>' +
        '<a href="#" data-nav="users" class="btn btn-outline">Pengurusan Pengguna</a>' +
        '<a href="#" data-nav="venues" class="btn btn-outline">Pengurusan Venue</a></div>';
    }

    return '' +
      '<div class="card">' +
      '  <h2>Selamat datang, ' + esc(ROLE_LABEL[state.role]) + '</h2>' +
      '  <p style="color:var(--muted)">KALORA &mdash; UMS Activity &amp; Officer Calendar System (Prototaip).' +
      ' Gunakan menu <b>Simulate Role</b> di atas untuk menukar peranan secara simulasi.</p>' +
      '  <div class="flow">' + flowHtml + '</div>' +
      '  ' + roleCta +
      '</div>' +

      '<div class="summary-grid">' +
      summaryCard(s.activities, 'Jumlah Aktiviti', 'blue') +
      summaryCard(s.pending, 'Permohonan Menunggu', 'gold') +
      summaryCard(s.confirmed, 'Aktiviti Disahkan', 'green') +
      summaryCard(s.conflicts, 'Konflik Jadual', 'red') +
      '</div>' +

      '<div class="card">' +
      '  <h3>Konsep Utama: AVAILABLE &#8800; CONFIRMED</h3>' +
      '  <p style="color:var(--muted)">Tiada konflik bermakna pegawai <b>tersedia</b>, tetapi permohonan' +
      ' masih mesti melalui <b>semakan PA/NC</b> sebelum dianggap <b>disahkan</b> dan dikemas kini dalam kalendar.</p>' +
      '  <div class="flow">' +
      '    <span class="step done">Tiada Konflik</span><span class="arrow">&rarr;</span>' +
      '    <span class="step wait">Tersedia</span><span class="arrow">&rarr;</span>' +
      '    <span class="step wait">Permohonan Kehadiran</span><span class="arrow">&rarr;</span>' +
      '    <span class="step wait">Semakan PA/NC</span><span class="arrow">&rarr;</span>' +
      '    <span class="step">Lulus</span><span class="arrow">&rarr;</span>' +
      '    <span class="step done">Disahkan</span>' +
      '  </div>' +
      '</div>';

    function summaryCard(num, label, mod) {
      return '<div class="summary-card ' + mod + '"><div class="num ' + mod + '">' + num + '</div><div class="label">' + esc(label) + '</div></div>';
    }
  }

  function flowStrip(steps) {
    return steps.map(function (s, i) {
      var cls = (i === 0) ? 'done' : '';
      return '<span class="step ' + cls + '">' + esc(s) + '</span>' +
        (i < steps.length - 1 ? '<span class="arrow">&rarr;</span>' : '');
    }).join('');
  }

  /* ---------------- ACTIVITIES ---------------- */

  function rActivities() {
    if (!state.activities.length) {
      return '<div class="empty-state">Tiada aktiviti lagi. Sila <a href="#" data-nav="create-activity">daftar aktiviti</a> pertama anda.</div>';
    }
    var rows = state.activities.map(function (a) {
      var st = activityStatusBadge(a);
      var nOfficers = (a.officers || []).length;
      var actions = '';
      if (state.role === 'urusetia') {
        if (a.status === 'draf') {
          actions += '<button class="btn btn-sm" data-act="open-officers" data-args=\'{"id":"' + a.id + '"}\'>Pilih Pegawai</button> ';
          actions += '<button class="btn btn-sm btn-outline" data-act="edit-activity" data-args=\'{"id":"' + a.id + '"}\'>Edit</button>';
        } else if (a.status === 'menunggu' || a.status === 'disahkan' || a.status === 'ditolak') {
          actions += '<button class="btn btn-sm btn-outline" data-act="open-officers" data-args=\'{"id":"' + a.id + '"}\'>Lihat Pegawai</button> ';
          actions += '<a href="#" class="btn btn-sm btn-outline" data-nav="requests">Permohonan</a>';
        }
        actions += '<button class="btn btn-sm btn-danger-outline" title="Hapus aktiviti" data-act="delete-activity" data-args=\'{"id":"' + a.id + '"}\'>&#128465;</button>';
      }
      return '<tr>' +
        '<td><strong>' + esc(a.nama) + '</strong><div class="muted" style="font-size:12.5px;color:var(--muted)">' + esc(a.kategori) + ' &middot; ' + esc(fmtDateLong(a.tarikh)) + '</div></td>' +
        '<td class="nowrap">' + esc(fmtDate(a.tarikh)) + '<div class="muted" style="font-size:12.5px">' + esc(fmtTime(a.masaMula)) + ' &ndash; ' + esc(fmtTime(a.masaTamat)) + '</div></td>' +
        '<td>' + esc(venueLabel(a)) + '</td>' +
        '<td>' + esc(a.keutamaan) + '</td>' +
        '<td>' + nOfficers + ' pegawai</td>' +
        '<td>' + st + '</td>' +
        '<td style="white-space:nowrap">' + actions + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
      '<h2>Senarai Aktiviti</h2>' +
      (state.role === 'urusetia' ? '<a href="#" class="btn btn-sm" data-nav="create-activity">+ Daftar Aktiviti</a>' : '') +
      '</div>' +
      '<div class="table-wrap" style="margin-top:12px"><table>' +
      '<thead><tr><th>Aktiviti</th><th>Tarikh</th><th>Venue</th><th>Keutamaan</th><th>Pegawai</th><th>Status</th><th>Tindakan</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>';
  }

  function activityStatusBadge(a) {
    if (a.status === 'draf') return '<span class="badge gray">Draf</span>';
    if (a.status === 'menunggu') return '<span class="badge amber">Menunggu Semakan</span>';
    if (a.status === 'disahkan') return '<span class="badge green">Disahkan</span>';
    if (a.status === 'ditolak') return '<span class="badge red">Ditolak</span>';
    return '<span class="badge gray">' + esc(a.status) + '</span>';
  }

  /* ---------------- CREATE / EDIT ACTIVITY ---------------- */

  function rCreateActivity() {
    var id = viewParams.id || null;
    var a = id ? getActivity(id) : null;
    var editing = !!a;

    /* Praisi daripada Kalendar Venue (slot diklik) atau daripada aktiviti sedia ada. */
    var selVenue = a ? (a.venueId || (venueByName(a.lokasi) ? venueByName(a.lokasi).id : '')) : (viewParams.venue || '');
    var preTarikh = a ? a.tarikh : (viewParams.tarikh || todayISO());
    var preMula = a ? a.masaMula : (viewParams.masaMula || '');

    var opts = function (list, sel) {
      return list.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === sel ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('');
    };

    return '<div class="card">' +
      (editing ? '<div class="msg info"><div class="ico">&#8505;</div><div><strong>Mod Edit</strong> Tukar masa / maklumat aktiviti, kemudian klik <b>Simpan &amp; Seterusnya</b> untuk kembali ke <b>Pilihan Pegawai</b>.</div></div>' : '') +
      '<h2>Daftar Aktiviti</h2>' +
      '<p style="color:var(--muted)">Lengkapkan maklumat aktiviti di bawah. Ketersediaan venue disemak secara automatik.</p>' +
      '<form id="formActivity" novalidate>' +
      '  <input type="hidden" id="actId" value="' + esc(id || '') + '">' +
      '  <div class="form-grid">' +

      '    <div class="form-group full" id="gNama">' +
      '      <label for="inNama">Nama Aktiviti <span class="req">*</span></label>' +
      '      <input type="text" id="inNama" placeholder="cth. Mesyuarat Pengurusan UMS" value="' + esc(a ? a.nama : '') + '">' +
      '      <div class="form-error">Sila masukkan nama aktiviti.</div>' +
      '    </div>' +

      '    <div class="form-group" id="gKategori">' +
      '      <label for="selKategori">Kategori <span class="req">*</span></label>' +
      '      <select id="selKategori"><option value="">- Pilih Kategori -</option>' + opts(state.categories, a ? a.kategori : '') + '</select>' +
      '      <div class="form-error">Sila pilih kategori.</div>' +
      '    </div>' +

      '    <div class="form-group" id="gKeutamaan">' +
      '      <label for="selKeutamaan">Keutamaan <span class="req">*</span></label>' +
      '      <select id="selKeutamaan"><option value="">- Pilih Keutamaan -</option>' + opts(PRIORITIES, a ? a.keutamaan : '') + '</select>' +
      '      <div class="form-error">Sila pilih keutamaan.</div>' +
      '    </div>' +

      '    <div class="form-group" id="gTarikh">' +
      '      <label for="inTarikh">Tarikh <span class="req">*</span></label>' +
      '      <input type="date" id="inTarikh" value="' + esc(preTarikh) + '">' +
      '      <div class="form-error">Sila pilih tarikh.</div>' +
      '    </div>' +

      '    <div class="form-group full" id="gLokasi">' +
      '      <label for="selVenue">Venue Rasmi <span class="req">*</span></label>' +
      '      <select id="selVenue">' + venueSelectHtml(selVenue) + '</select>' +
      '      <div class="form-error">Sila pilih venue rasmi daripada senarai.</div>' +
      '      <div class="form-hint">Senarai venue diselaraskan secara langsung dengan modul <b>Pengurusan Venue</b> (Admin).</div>' +
      '    </div>' +

      '    <div class="form-group" id="gMula">' +
      '      <label for="inMula">Masa Mula <span class="req">*</span></label>' +
      '      <input type="time" id="inMula" value="' + esc(a ? a.masaMula : preMula) + '">' +
      '      <div class="form-error">Sila masukkan masa mula.</div>' +
      '    </div>' +

      '    <div class="form-group" id="gTamat">' +
      '      <label for="inTamat">Masa Tamat <span class="req">*</span></label>' +
      '      <input type="time" id="inTamat" value="' + esc(a ? a.masaTamat : '') + '">' +
      '      <div class="form-error">Masa tamat mesti selepas masa mula.</div>' +
      '    </div>' +

      '    <div class="form-group full" id="gJafpib">' +
      '      <label for="inJafpib">JAFPIB / PTJ <span class="req">*</span></label>' +
      '      <input type="text" id="inJafpib" placeholder="cth. JAFPIB / HEPA" value="' + esc(a ? a.jafpib : '') + '">' +
      '      <div class="form-error">Sila masukkan JAFPIB / PTJ.</div>' +
      '    </div>' +

      '    <div class="form-group full">' +
      '      <label for="taPenerangan">Penerangan</label>' +
      '      <textarea id="taPenerangan" placeholder="Perincian aktiviti (pilihan)">' + esc(a ? a.penerangan : '') + '</textarea>' +
      '    </div>' +
      '  </div>' +

      '  <div id="venueAvailBox" class="venue-avail-box"></div>' +

      '  <div class="btn-row">' +
      '    <button type="button" class="btn btn-outline" data-act="back-dashboard">Batal</button>' +
      '    <button type="submit" class="btn" id="btnSubmitActivity">Simpan &amp; Seterusnya</button>' +
      '  </div>' +
      '</form></div>';
  }

  /* Senarai dropdown venue rasmi (dinamik daripada data Admin). */
  function venueSelectHtml(sel) {
    var akt = [], maint = [];
    sortedVenues().forEach(function (v) {
      var opt = '<option value="' + esc(v.id) + '"' + (sel === v.id ? ' selected' : '') + '>' +
        esc(v.nama) + ' &mdash; ' + esc(v.kapasiti) + ' pax [' + esc(v.kod) + ']</option>';
      (isActiveVenue(v) ? akt : maint).push(opt);
    });

    var out = '<option value="">- Pilih Venue Rasmi -</option>';
    if (akt.length) out += '<optgroup label="Venue Aktif">' + akt.join('') + '</optgroup>';
    if (maint.length) out += '<optgroup label="Dalam Penyelenggaraan">' + maint.join('') + '</optgroup>';
    if (sel && !getVenue(sel)) {
      out = '<option value="' + esc(sel) + '" selected>' + esc(sel) + ' (venue telah dihapus)</option>' + out;
    }
    return out;
  }

  function handleActivitySubmit(e) {
    e.preventDefault();
    var edId = $('actId').value;
    var isEdit = !!edId;

    var nama = $('inNama').value.trim();
    var kategori = $('selKategori').value;
    var tarikh = $('inTarikh').value;
    var masaMula = $('inMula').value;
    var masaTamat = $('inTamat').value;
    var venueId = $('selVenue').value;
    var venue = getVenue(venueId);
    var lokasi = venue ? venue.nama : '';
    var jafpib = $('inJafpib').value.trim();
    var keutamaan = $('selKeutamaan').value;
    var penerangan = $('taPenerangan').value.trim();

    var fields = {
      'gNama': nama, 'gKategori': kategori, 'gTarikh': tarikh,
      'gMula': masaMula, 'gLokasi': venueId, 'gJafpib': jafpib, 'gKeutamaan': keutamaan
    };
    var ok = true;
    Object.keys(fields).forEach(function (key) {
      var el = $(key);
      if (!fields[key]) { el.classList.add('invalid'); ok = false; }
      else el.classList.remove('invalid');
    });

    var gTamat = $('gTamat');
    if (masaTamat && masaMula) {
      if (masaTamat <= masaMula) { gTamat.classList.add('invalid'); ok = false; }
      else gTamat.classList.remove('invalid');
    } else { gTamat.classList.add('invalid'); ok = false; }

    if (!ok) {
      toast('Sila lengkapkan maklumat yang diperlukan.', 'red');
      return;
    }

    /* Semakanavailability venue (lapisan kedua - selepas semakan langsung). */
    var slot = venueSlotCheck(venueId, tarikh, masaMula, masaTamat, edId);
    if (slot.blocked) {
      refreshVenueAvail();
      audit('Pendaftaran aktiviti disekat &mdash; venue: ' + lokasi);
      if (slot.mode === 'maintenance') {
        toast('Venue "' + lokasi + '" dalam penyelenggaraan. Sila pilih venue lain.', 'red');
      } else if (slot.mode === 'conflict') {
        toast('Pertindihan venue: ' + lokasi + ' telah ditempah pada slot tersebut.', 'red');
      } else {
        toast('Sila pilih venue rasmi terlebih dahulu.', 'red');
      }
      return;
    }

    var act;
    if (isEdit) {
      act = getActivity(edId);
      act.nama = nama; act.kategori = kategori; act.tarikh = tarikh;
      act.masaMula = masaMula; act.masaTamat = masaTamat;
      act.lokasi = lokasi; act.venueId = venueId; act.jafpib = jafpib; act.keutamaan = keutamaan;
      act.penerangan = penerangan;
      act.checked = false;
      act.conflicts = null;
      audit('Aktiviti dikemas kini: ' + nama + ' (venue: ' + lokasi + ')');
      toast('Aktiviti dikemas kini.');
    } else {
      act = {
        id: uid('act_'), nama: nama, kategori: kategori, tarikh: tarikh,
        masaMula: masaMula, masaTamat: masaTamat, lokasi: lokasi, venueId: venueId,
        jafpib: jafpib, keutamaan: keutamaan, penerangan: penerangan,
        status: 'draf', officers: [], checked: false, conflicts: null
      };
      state.activities.push(act);
      audit('Aktiviti baharu didaftarkan: ' + nama + ' (venue: ' + lokasi + ')');
      toast('Aktiviti disimpan. Sila pilih pegawai.');
    }

    state.draftActivityId = act.id;
    save();
    show('officers', { id: act.id });
  }

  /* ---------------- PILIHAN PEGAWAI + SEMAK KETERSEDIAAN ---------------- */

  function rOfficers() {
    var id = viewParams.id || state.draftActivityId;
    var a = getActivity(id);
    if (!a) {
      return '<div class="empty-state">Tiada aktiviti. <a href="#" data-nav="create-activity">Daftar aktiviti dahulu.</a></div>';
    }
    state.draftActivityId = a.id;

    var venue = a.venueId ? getVenue(a.venueId) : venueByName(a.lokasi);
    var venueRow = '<div class="k">Venue:</div><div class="v">' + esc(venueLabel(a)) +
      (venue ? ' <span class="badge ' + (isActiveVenue(venue) ? 'blue' : 'red') + '">' +
        esc(venueStatusText(venue)) + '</span> <span class="sub">' + esc(venue.kapasiti) + ' pax</span>' : '') +
      '</div>';

    var officerOpts = state.officers.map(function (o) {
      var already = (a.officers || []).some(function (x) { return x.name === o.name; });
      return '<option value="' + esc(o.name) + '"' + (already ? ' disabled' : '') + '>' + esc(o.name) + (already ? ' (ditambah)' : '') + '</option>';
    }).join('');

    var roleOpts = state.roles.map(function (r) {
      return '<option value="' + esc(r) + '">' + esc(r) + '</option>';
    }).join('');

    var officerRows = (a.officers || []).map(function (o, i) {
      return '<tr>' +
        '<td>' + esc(o.name) + '</td>' +
        '<td>' + esc(o.peranan) + '</td>' +
        '<td><span class="badge ' + (o.kehadiran === 'Wajib' ? 'blue' : 'gray') + '">' + esc(o.kehadiran) + '</span></td>' +
        '<td><button class="btn btn-sm btn-danger-outline" data-act="remove-officer" data-args=\'{"id":"' + a.id + '","idx":' + i + '}\'>Buang</button></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--muted)">Tiada pegawai ditambah lagi.</td></tr>';

    var checkArea = rCheckArea(a);

    return '<div class="card detail-box">' +
      '<h2>Pilihan Pegawai</h2>' +
      '<div class="info-grid">' +
      '  <div class="k">Aktiviti:</div><div class="v"><strong>' + esc(a.nama) + '</strong></div>' +
      '  <div class="k">Kategori:</div><div class="v">' + esc(a.kategori) + ' &middot; ' + esc(a.keutamaan) + '</div>' +
      '  <div class="k">Tarikh:</div><div class="v">' + esc(fmtDate(a.tarikh)) + '</div>' +
      '  <div class="k">Masa:</div><div class="v">' + esc(fmtTime(a.masaMula)) + ' &ndash; ' + esc(fmtTime(a.masaTamat)) + '</div>' +
      venueRow +
      '</div>' +
      (venue && !isActiveVenue(venue)
        ? '<div class="msg error" style="margin:14px 0 0"><div class="ico">&#9888;&#65039;</div><div>' +
        '<strong>Venue dalam penyelenggaraan.</strong> Permohonan kehadiran tidak boleh dihantar sehingga venue diaktifkan semula.</div></div>'
        : '') +
      '</div>' +

      '<div class="card">' +
      '<h3>Tambah Pegawai</h3>' +
      '<div class="form-grid">' +
      '  <div class="form-group"><label for="selOfficer">Pegawai</label>' +
      '    <select id="selOfficer"><option value="">- Pilih Pegawai -</option>' + officerOpts + '</select></div>' +
      '  <div class="form-group"><label for="selPeranan">Peranan Jemputan</label>' +
      '    <select id="selPeranan">' + roleOpts + '</select></div>' +
      '  <div class="form-group full"><label>Kehadiran</label>' +
      '    <div class="radio-row">' +
      '      <label><input type="radio" name="kehadiran" value="Wajib" checked> Wajib</label>' +
      '      <label><input type="radio" name="kehadiran" value="Pilihan"> Pilihan</label>' +
      '    </div></div>' +
      '</div>' +
      '<button class="btn btn-sm" data-act="add-officer" data-args=\'{"id":"' + a.id + '"}\'>+ Tambah Pegawai</button>' +
      '</div>' +

      '<div class="card">' +
      '<h3>Senarai Pegawai</h3>' +
      '<div class="table-wrap"><table>' +
      '<thead><tr><th>Pegawai</th><th>Peranan Jemputan</th><th>Kehadiran</th><th>Tindakan</th></tr></thead>' +
      '<tbody>' + officerRows + '</tbody></table></div>' +
      '<div class="btn-row">' +
      '  <button class="btn" data-act="check-avail" data-args=\'{"id":"' + a.id + '"}\'>Semak Ketersediaan</button>' +
      (a.officers && a.officers.length ? '<button class="btn btn-outline" data-act="clear-officers" data-args=\'{"id":"' + a.id + '"}\'>Kosongkan Pegawai</button>' : '') +
      '</div>' +
      '</div>' +

      checkArea;
  }

  function rCheckArea(a) {
    if (!a.checked) {
      return '<div class="msg info"><div class="ico">&#8505;</div><div>Klik <b>Semak Ketersediaan</b> untuk memeriksa konflik jadual pegawai sebelum menghantar permohonan.</div></div>';
    }

    var results = a.conflicts || [];
    if (!results.some(function (r) { return r.conflict; })) {
      return '<div class="card" style="border-color:var(--green-border);background:var(--green-bg)">' +
        '<div class="msg success" style="margin-bottom:0"><div class="ico">&#9989;</div>' +
        '<div><strong>Ketersediaan pegawai disahkan. Tiada konflik jadual.</strong>' +
        '<ul>' + results.map(function (r) {
          return '<li>' + esc(r.officer) + ' ' + esc(r.role) + ' (Kehadiran: ' + esc(r.attendance) + ') &mdash; tiada konflik.</li>';
        }).join('') + '</ul></div></div>' +
        '<div class="btn-row"><button class="btn btn-success" data-act="submit-request" data-args=\'{"id":"' + a.id + '"}\'>Hantar Permohonan Kehadiran</button></div>' +
        '</div>';
    }

    var hasRequired = results.some(function (r) { return r.conflict && r.attendance === 'Wajib'; });

    var conflictLines = results.filter(function (r) { return r.conflict; }).map(function (r) {
      var strong = r.attendance === 'Wajib';
      return '<li>' + esc(r.officer) + ' mempunyai aktiviti pada ' +
        esc(fmtTime(r.conflict.start)) + ' - ' + esc(fmtTime(r.conflict.end)) + ' (' + esc(r.conflict.title) + ').' +
        '<br><span style="font-weight:700;' + (strong ? 'color:var(--red);' : 'color:var(--amber);') + '">' +
        (strong ? '&#9888;&#65039; Konflik penting &ndash; kehadiran diperlukan.' : '&#9888;&#65039; Amaran &ndash; pegawai mempunyai aktiviti lain.') +
        '</span></li>';
    }).join('');

    var headerMsg = hasRequired
      ? '<div class="msg error"><div class="ico">&#9888;&#65039;</div><div><strong>Konflik jadual dikesan.</strong><ul>' + conflictLines + '</ul>' +
        '<div style="margin-top:8px">Permohonan tidak boleh dihantar sehingga konflik pegawai <b>Wajib</b> diselesaikan.</div></div></div>'
      : '<div class="msg warn"><div class="ico">&#9888;&#65039;</div><div><strong>Konflik jadual dikesan (amaran sahaja).</strong><ul>' + conflictLines + '</ul>' +
        '<div style="margin-top:8px">Semua pegawai yang berkonflik adalah <b>Pilihan</b>. Anda boleh tukar masa/pegawai atau teruskan dengan amaran.</div></div></div>';

    return '<div class="card">' + headerMsg +
      '<div class="btn-row">' +
      '  <button class="btn btn-amber" data-act="tukar-masa" data-args=\'{"id":"' + a.id + '"}\'>Tukar Masa</button>' +
      '  <button class="btn btn-outline" data-act="tukar-pegawai" data-args=\'{"id":"' + a.id + '"}\'>Tukar Pegawai</button>' +
      '  <button class="btn btn-success" data-act="submit-request" data-args=\'{"id":"' + a.id + '"}\'' + (hasRequired ? ' disabled' : '') + '>Hantar Permohonan Kehadiran</button>' +
      '</div></div>';
  }

  function checkAvailability(id) {
    var a = getActivity(id);
    if (!a) return;
    if (!a.officers || !a.officers.length) {
      toast('Sila tambah sekurang-kurangnya seorang pegawai dahulu.', 'amber');
      return;
    }
    a.conflicts = a.officers.map(function (o) {
      var found = null;
      /* 1) Jadual simulasi sedia ada (data demo). */
      FAKE_SCHEDULES.forEach(function (f) {
        if (found) return;
        if (f.officer === o.name && overlaps(a.masaMula, a.masaTamat, f.start, f.end)) found = f;
      });
      /* 2) Entri kalendar sebenar (termasuk aktiviti peribadi yang ditambah pegawai). */
      if (!found) {
        (state.calendar || []).forEach(function (c) {
          if (found) return;
          if (c.status === 'Cancelled') return;
          if (c.officer !== o.name) return;
          if (c.date !== a.tarikh) return;
          if (overlaps(a.masaMula, a.masaTamat, c.start, c.end)) {
            found = { officer: c.officer, start: c.start, end: c.end, title: c.title };
          }
        });
      }
      return { officer: o.name, role: o.peranan, attendance: o.kehadiran, conflict: found };
    });
    a.checked = true;
    save();
    audit('Semakan ketersediaan dijalankan untuk: ' + a.nama);
    show('officers', { id: a.id });
  }

  /* ---------------- HANTAR PERMOHONAN ---------------- */

  function submitRequest(id) {
    var a = getActivity(id);
    if (!a) return;
    if (a.conflicts && a.conflicts.some(function (c) { return c.conflict && c.attendance === 'Wajib'; })) {
      toast('Konflik pegawai Wajib masih wujud. Sila tukar masa / pegawai dahulu.', 'red');
      return;
    }

    /* Semakan semula ketersediaan venue sebelum memohon. */
    var venue = a.venueId ? getVenue(a.venueId) : venueByName(a.lokasi);
    var slot = venueSlotCheck(venue ? venue.id : '', a.tarikh, a.masaMula, a.masaTamat, a.id);
    if (slot.blocked) {
      audit('Permohonan kehadiran disekat &mdash; venue: ' + venueLabel(a));
      toast(slot.mode === 'maintenance'
        ? 'Venue "' + venueLabel(a) + '" dalam penyelenggaraan. Permohonan tidak boleh dihantar.'
        : 'Venue "' + venueLabel(a) + '" sudah ditempah pada slot tersebut.', 'red');
      return;
    }

    var req = {
      id: uid('req_'),
      activityId: a.id,
      nama: a.nama, kategori: a.kategori,
      tarikh: a.tarikh, masaMula: a.masaMula, masaTamat: a.masaTamat,
      lokasi: a.lokasi, venueId: a.venueId || (venue ? venue.id : ''), keutamaan: a.keutamaan,
      officers: (a.officers || []).map(function (o) {
        return { name: o.name, peranan: o.peranan, kehadiran: o.kehadiran, status: 'pending' };
      }),
      status: 'pending',
      submittedAt: new Date().toLocaleString('ms-MY')
    };
    state.requests.push(req);
    a.status = 'menunggu';
    save();
    audit('Permohonan kehadiran dihantar: ' + a.nama + ' (venue: ' + a.lokasi + ')');
    notify('Permohonan kehadiran "' + a.nama + '" telah dihantar. Menunggu semakan PA/NC.');
    toast('Permohonan kehadiran berjaya dihantar.');
    show('submitted', { id: req.id });
  }

  function rSubmitted() {
    var req = getRequest(viewParams.id);
    if (!req) return '<div class="empty-state">Permohonan tidak dijumpai.</div>';
    return '<div class="card" style="border-color:var(--green-border);background:var(--green-bg)">' +
      '<h2 style="color:var(--green)">&#9989; Permohonan kehadiran berjaya dihantar.</h2>' +
      '<div style="margin:12px 0"><span class="badge amber">PENDING APPROVAL</span> <span class="badge blue">Menunggu Semakan PA/NC</span></div>' +
      '<div class="info-grid">' +
      '  <div class="k">Aktiviti:</div><div class="v"><strong>' + esc(req.nama) + '</strong></div>' +
      '  <div class="k">Tarikh:</div><div class="v">' + esc(fmtDateLong(req.tarikh)) + '</div>' +
      '  <div class="k">Masa:</div><div class="v">' + esc(fmtTime(req.masaMula)) + ' &ndash; ' + esc(fmtTime(req.masaTamat)) + '</div>' +
      '  <div class="k">Lokasi:</div><div class="v">' + esc(req.lokasi) + '</div>' +
      '  <div class="k">Pegawai:</div><div class="v">' + esc(req.officers.map(function (o) { return o.name + ' (' + o.peranan + ')'; }).join(', ')) + '</div>' +
      '  <div class="k">Status:</div><div class="v"><b>Menunggu Semakan PA/NC</b></div>' +
      '</div></div>' +
      '<div class="card">' +
      '<div class="msg info"><div class="ico">&#8505;</div><div><strong>Ingat: AVAILABLE &#8800; CONFIRMED</strong>' +
      'Walaupun pegawai tersedia dan tiada konflik, setiap pegawai yang dijemput masih perlu ' +
      '<b>meluluskan kehadiran mereka secara individu</b> (untuk nama mereka sendiri) sebelum ' +
      'kehadiran dianggap disahkan dalam kalendar peribadi masing-masing.</div></div>' +
      '<div class="btn-row">' +
      '  <button class="btn" data-act="go-review" data-args=\'{"id":"' + req.id + '"}\'>Pergi ke Semakan PA/NC</button>' +
      '  <a href="#" class="btn btn-outline" data-nav="requests">Senarai Permohonan</a>' +
      '</div></div>';
  }

  /* ---------------- PERMOHONAN / SEMAKAN ---------------- */

  function rRequests() {
    var isPa = state.role === 'pa';
    var me = state.currentOfficer || '';

    /* Permohonan yang menunggu kelulusan INDIVIDU pegawai semasa (mod PA). */
    function myApprovalPending(r) {
      if (!isPa) return false;
      return (r.officers || []).some(function (o) { return o.name === me && o.status === 'pending'; });
    }

    var rows = state.requests.map(function (r) {
      var ratio = approvalRatio(r);
      var semak = '';
      if (isPa) {
        semak = myApprovalPending(r)
          ? '<button class="btn btn-sm" data-act="open-review" data-args=\'{"id":"' + r.id + '"}\'>Semak</button>'
          : '<button class="btn btn-sm btn-outline" data-act="open-review" data-args=\'{"id":"' + r.id + '"}\'>Lihat</button>';
      }
      return '<tr>' +
        '<td><strong>' + esc(r.nama) + '</strong></td>' +
        '<td>' + esc(fmtDate(r.tarikh)) + '<div style="font-size:12.5px;color:var(--muted)">' + esc(fmtTime(r.masaMula)) + ' &ndash; ' + esc(fmtTime(r.masaTamat)) + '</div></td>' +
        '<td>' + esc(venueLabel(r)) + '</td>' +
        '<td>' + esc(r.officers.map(function (o) { return o.name; }).join(', ')) + '</td>' +
        '<td>' + esc(r.officers.map(function (o) { return o.peranan; }).join(', ')) + '</td>' +
        '<td><span class="badge ratio ' + ratio.cls + '">' + ratio.text + '</span>' +
        '<div style="font-size:11px;color:var(--muted);letter-spacing:.5px">' + esc(ratio.sub) + '</div></td>' +
        '<td>' + semak + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted)">Tiada permohonan.</td></tr>';

    var pending = scoreNotice(
      isPa
        ? state.requests.filter(myApprovalPending).length
        : state.requests.filter(function (r) { return r.status === 'pending'; }).length
    );

    return '<div class="card">' +
      '<h2>Permohonan Kehadiran</h2>' +
      (pending ? '<div class="msg info"><div class="ico">&#8505;</div><div>' + pending + '</div></div>' : '') +
      '<div class="table-wrap" style="margin-top:12px"><table>' +
      '<thead><tr><th>Aktiviti</th><th>Tarikh / Masa</th><th>Venue</th><th>Pegawai</th><th>Peranan</th><th>Status</th><th>Tindakan</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<div style="margin-top:10px;font-size:12.5px;color:var(--muted);display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
      '<span>Kelulusan individu:</span>' +
      '<span class="badge ratio green">5/5</span><span>semua pegawai lulus</span>' +
      '<span class="badge ratio amber">2/5</span><span>sebahagian lulus</span>' +
      '<span class="badge ratio red">0/5</span><span>tiada kelulusan</span>' +
      '</div></div>';

    function scoreNotice(n) {
      if (n === 0) return null;
      if (isPa) {
        var pr = state.requests.filter(myApprovalPending)[0];
        return '<strong>' + n + ' permohonan menunggu kelulusan anda (' + esc(me) + ').</strong> ' +
          'Kelulusan adalah PER INDIVIDU &mdash; pegawai lain perlu meluluskan secara berasingan. ' +
          '<a href="#" data-act="open-review" data-args=\'{"id":"' + pr.id + '"}\'>[ Pergi ke Semakan ]</a>';
      }
      return '<strong>' + n + ' permohonan menunggu semakan PA/NC.</strong>';
    }
  }

  function rReview() {
    var req = getRequest(viewParams.id);
    if (!req) return '<div class="empty-state">Permohonan tidak dijumpai.</div>';
    var st = scoreRequestStatus(req.status);
    var ratio = approvalRatio(req);
    var isPa = state.role === 'pa';
    var current = state.currentOfficer || '';

    var myIdx = -1;
    (req.officers || []).forEach(function (o, i) { if (o.name === current) myIdx = i; });

    var officerLines = (req.officers || []).map(function (o, i) {
      var mine = isPa && i === myIdx;
      var statusBadge = o.status === 'confirmed'
        ? '<span class="badge green">&#10003; Lulus</span>'
        : (o.status === 'rejected'
          ? '<span class="badge red">&#10005; Tolak</span>'
          : '<span class="badge amber">Menunggu</span>');
      var tindakan = '';
      if (mine && o.status === 'pending') {
        tindakan = '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-sm btn-success" data-act="approve" data-args=\'{"id":"' + req.id + '","idx":' + i + '}\'>&#10003; Lulus</button>' +
          '<button class="btn btn-sm btn-danger-outline" data-act="reject" data-args=\'{"id":"' + req.id + '","idx":' + i + '}\'>&#10005; Tolak</button>' +
          '</div>';
      } else if (mine) {
        tindakan = '<span class="sub">Kelulusan anda telah direkodkan.</span>';
      } else {
        tindakan = '<span class="sub">' + (o.status === 'pending'
          ? 'Menunggu kelulusan pegawai ini'
          : (o.status === 'confirmed' ? 'Pegawai ini telah meluluskan' : 'Pegawai ini menolak')) + '</span>';
      }
      return '<tr' + (mine ? ' style="background:var(--blue-50)"' : '') + '>' +
        '<td><strong>' + esc(o.name) + '</strong>' + (mine ? ' <span class="badge blue">ANDA</span>' : '') + '</td>' +
        '<td>' + esc(o.peranan) + '</td>' +
        '<td><span class="badge ' + (o.kehadiran === 'Wajib' ? 'blue' : 'gray') + '">' + esc(o.kehadiran) + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + tindakan + '</td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Tiada pegawai dijemput.</td></tr>';

    /* Arahan tindakan mengikut status KEHADIRAN INDIVIDU pegawai semasa. */
    var my = myIdx >= 0 ? req.officers[myIdx] : null;
    var actionArea = '';
    if (!isPa) {
      actionArea = '<div class="msg info"><div class="ico">&#8505;</div><div>' +
        '<strong>Paparan semakan (Urusetia).</strong> Kelulusan kehadiran dilakukan secara ' +
        '<b>individu</b> oleh setiap pegawai / PA untuk nama mereka sendiri sahaja.</div></div>';
    } else if (!my) {
      actionArea = '<div class="msg info"><div class="ico">&#8505;</div><div>' +
        '<strong>Anda (' + esc(current || '-') + ') tiada dalam senarai pegawai permohonan ini.</strong> ' +
        'Tiada kelulusan individu diperlukan daripada anda.</div></div>';
    } else if (my.status === 'confirmed') {
      actionArea = '<div class="msg success"><div class="ico">&#9989;</div><div>' +
        '<strong>Kelulusan anda telah direkodkan (CONFIRMED).</strong>' +
        'Hanya status kehadiran <b>' + esc(my.name) + '</b> yang diubah &mdash; status pegawai lain tidak terjejas. ' +
        'Kalendar peribadi anda dikemas kini sebagai <b>Confirmed</b>.</div></div>' +
        '<div class="btn-row"><button class="btn" data-act="go-calendar">Lihat Kalendar Pegawai</button></div>';
    } else if (my.status === 'rejected') {
      actionArea = '<div class="msg error"><div class="ico">&#10062;</div><div>' +
        '<strong>Anda telah menolak kehadiran ini.</strong>' +
        'Hanya status kehadiran <b>' + esc(my.name) + '</b> sahaja direkodkan sebagai ditolak. ' +
        'Aktiviti ini tidak masuk ke kalendar peribadi anda.</div></div>' +
        '<div class="btn-row"><a href="#" class="btn btn-outline" data-nav="requests">Kembali ke Senarai Permohonan</a></div>';
    } else {
      actionArea = '<div class="msg warn"><div class="ico">&#9888;&#65039;</div><div>' +
        '<strong>Tindakan anda diperlukan &mdash; Lulus / Tolak untuk nama anda sendiri.</strong>' +
        'Tekan butang dalam baris <b>' + esc(my.name) + '</b> di atas. Keputusan anda hanya menukar status peribadi anda; ' +
        'status pegawai lain kekal tidak terjejas.</div></div>';
    }

    return '<div class="card detail-box">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
      '<h2 style="margin:0">Permohonan Kehadiran</h2>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<span class="badge ratio ' + ratio.cls + '" title="Nisbah kelulusan individu">' + ratio.text + '</span>' +
      '<span class="badge ' + st.cls + '">' + st.label + ' &middot; ' + st.sub + '</span></div></div>' +
      '<div class="info-grid" style="margin-top:14px">' +
      '  <div class="k">Aktiviti:</div><div class="v"><strong>' + esc(req.nama) + '</strong></div>' +
      '  <div class="k">Tarikh:</div><div class="v">' + esc(fmtDateLong(req.tarikh)) + '</div>' +
      '  <div class="k">Masa:</div><div class="v">' + esc(fmtTime(req.masaMula)) + ' &ndash; ' + esc(fmtTime(req.masaTamat)) + '</div>' +
      '  <div class="k">Lokasi:</div><div class="v">' + esc(req.lokasi) + '</div>' +
      '  <div class="k">Status Venue:</div><div class="v">' + (req.venueId && getVenue(req.venueId) ? venueStatusBadge(getVenue(req.venueId)) : '<span class="badge gray">-</span>') + '</div>' +
      '  <div class="k">Keutamaan:</div><div class="v">' + esc(req.keutamaan) + '</div>' +
      '  <div class="k">Dihantar:</div><div class="v">' + esc(req.submittedAt || '-') + '</div>' +
      '  <div class="k">Nisbah Kelulusan:</div><div class="v"><span class="badge ratio ' + ratio.cls + '">' + ratio.text + '</span> ' +
      '<span style="font-size:13px;color:var(--muted)">' + esc(ratio.sub) + '</span></div>' +
      '</div></div>' +

      '<div class="card">' +
      '<h3>Pegawai &amp; Peranan <span style="font-size:13px;font-weight:400;color:var(--muted)">&mdash; Kelulusan Individu</span></h3>' +
      '<div class="table-wrap"><table>' +
      '<thead><tr><th>Pegawai</th><th>Peranan</th><th>Kehadiran</th><th>Status Kelulusan</th><th>Tindakan</th></tr></thead>' +
      '<tbody>' + officerLines + '</tbody></table></div>' +
      actionArea +
      '</div>';
  }

  /* Kelulusan KEHADIRAN INDIVIDU — hanya menukar status pegawai yang bertindak
     (idx). Status pegawai lain dalam permohonan yang sama tidak terjejas. */
  function approveRequest(id, idx) {
    var req = getRequest(id);
    if (!req) return;
    var o = (req.officers || [])[idx];
    if (!o) return;
    if (state.role !== 'pa' || o.name !== (state.currentOfficer || '')) {
      toast('Kelulusan hanya boleh dilakukan oleh pegawai berkenaan untuk nama sendiri.', 'red');
      return;
    }
    if (o.status !== 'pending') {
      toast('Kelulusan individu untuk ' + o.name + ' telah direkodkan sebelum ini.', 'amber');
      return;
    }

    o.status = 'confirmed';

    /* Kalendar peribadi pegawai: hanya menjadi Confirmed SETELAH pegawai itu
       sendiri meluluskan kehadirannya. Entri sedia ada dikemas kini, baharu ditambah. */
    var match = null;
    state.calendar.forEach(function (c) {
      if (match) return;
      if (c.officer === o.name && c.date === req.tarikh &&
        c.start === req.masaMula && c.end === req.masaTamat && c.title === req.nama) match = c;
    });
    if (match) {
      match.status = 'Confirmed';
      match.role = o.peranan;
    } else {
      state.calendar.push({
        id: uid('c_'), date: req.tarikh, start: req.masaMula, end: req.masaTamat,
        title: req.nama, officer: o.name, role: o.peranan, status: 'Confirmed',
        venue: req.lokasi, venueId: req.venueId || ''
      });
    }

    var agg = syncRequestStatus(req);
    save();
    audit('Kelulusan kehadiran INDIVIDU (' + o.name + '): ' + req.nama + ' — nisbah ' +
      approvalRatio(req).text);
    if (agg === 'confirmed') {
      notify('Semua pegawai telah mengesahkan kehadiran "' + req.nama + '". Permohonan kini disahkan.');
    }
    toast('Kelulusan direkodkan untuk ' + o.name + '.');
    show('review', { id: id });
  }

  /* Penolakan KEHADIRAN INDIVIDU — status pegawai lain tidak terjejas. */
  function rejectRequest(id, idx) {
    var req = getRequest(id);
    if (!req) return;
    var o = (req.officers || [])[idx];
    if (!o) return;
    if (state.role !== 'pa' || o.name !== (state.currentOfficer || '')) {
      toast('Penolakan hanya boleh dilakukan oleh pegawai berkenaan untuk nama sendiri.', 'red');
      return;
    }
    if (o.status !== 'pending') {
      toast('Keputusan individu untuk ' + o.name + ' telah direkodkan sebelum ini.', 'amber');
      return;
    }

    o.status = 'rejected';

    var agg = syncRequestStatus(req);
    save();
    audit('Penolakan kehadiran INDIVIDU (' + o.name + '): ' + req.nama + ' — nisbah ' +
      approvalRatio(req).text);
    if (agg === 'rejected') {
      notify('Semua pegawai telah menolak kehadiran "' + req.nama + '". Permohonan kini ditolak.');
    }
    toast('Kehadiran individu ' + o.name + ' ditolak.', 'red');
    show('review', { id: id });
  }

  function deleteActivity(id) {
    var a = getActivity(id);
    if (!a) return;
    if (!confirm('Yakin untuk menghapus aktiviti "' + a.nama + '"?')) return;
    state.activities = state.activities.filter(function (x) { return x.id !== id; });
    state.requests = state.requests.filter(function (r) { return r.activityId !== id; });
    state.calendar = state.calendar.filter(function (c) { return c.title !== a.nama; });
    if (state.draftActivityId === id) state.draftActivityId = null;
    save();
    audit('Aktiviti dihapuskan: ' + a.nama);
    toast('Aktiviti "' + a.nama + '" dihapuskan.');
    show('activities');
  }

  /* ---------------- OFFICER CALENDAR ---------------- */

  /* Halaman Calendar yang menyatukan Kalendar Pegawai dan Kalendar Venue di bawah satu menu.
     Route lama "venue-calendar" ditukar kepada "calendar" + calMode:"venue" oleh show(). */
  function rCalendarPage() {
    var mode = viewParams.calMode === 'venue' ? 'venue' : 'pegawai';

    function tabBtn(id, label) {
      var on = mode === id;
      return '<button type="button" class="btn btn-sm" data-act="cal-tab"' +
        ' data-args=\'{"mode":"' + id + '"}\' aria-pressed="' + (on ? 'true' : 'false') + '">' +
        label + '</button>';
    }

    return '<div class="card">' +
      '<div class="card-head">' +
      '<h2 style="margin:0">Calendar</h2>' +
      '<div class="cal-tabs" role="group" aria-label="Calendar view">' +
      tabBtn('pegawai', 'Officer Calendar') +
      tabBtn('venue', 'Venue Calendar') +
      '</div></div>' +
      '</div>' +
      (mode === 'venue' ? rVenueCalendar() : rCalendar());
  }

  function rCalendar() {
    /* Halaman officer (peranan PA): paparan peribadi, tiada penapis Pegawai.
       Halaman Urusetia: paparan global dengan penapis Pegawai. */
    var isOfficerPage = state.role === 'pa';
    var filter = viewParams.officer;
    if (filter === undefined || filter === null || filter === '') {
      filter = isOfficerPage ? (state.currentOfficer || 'semua') : 'semua';
    }
    var view = viewParams.calView === 'grid' ? 'grid' : 'list';
    var entries = state.calendar.slice().sort(function (x, y) {
      if (x.date !== y.date) return x.date < y.date ? -1 : 1;
      return x.start < y.start ? -1 : 1;
    });

    var officers = ['semua'];
    if (state.currentOfficer && officers.indexOf(state.currentOfficer) === -1) officers.push(state.currentOfficer);
    entries.forEach(function (e) {
      if (officers.indexOf(e.officer) === -1) officers.push(e.officer);
    });

    if (filter !== 'semua') {
      entries = entries.filter(function (e) { return e.officer === filter; });
    }

    var selOpts = officers.map(function (o) {
      return '<option value="' + esc(o) + '"' + (o === filter ? ' selected' : '') + '>' + (o === 'semua' ? 'Semua Pegawai' : esc(o)) + '</option>';
    }).join('');

    function viewBtn(id, label) {
      var on = view === id;
      return '<button type="button" class="btn btn-sm" data-act="cal-view"' +
        ' data-args=\'{"view":"' + id + '"}\' aria-pressed="' + (on ? 'true' : 'false') + '">' + label + '</button>';
    }

    var addBtn = isOfficerPage
      ? '<button class="btn btn-sm" data-act="open-officer-act">+ Tambah Jadual / Aktiviti Peribadi</button>'
      : '';
    var officerFilter = isOfficerPage
      ? ''
      : '<div class="role-sim"><label for="selOfficerFilter" style="display:block">Pegawai</label>' +
        '<select id="selOfficerFilter" data-calfilter>' + selOpts + '</select></div>';

    var head = '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
      '<div style="display:flex;gap:10px;align-items:center"><h3 style="margin:0">Officer Schedule</h3>' + addBtn + '</div>' +
      '<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">' +
      '<div class="cal-tabs" role="group" aria-label="Paparan kalendar pegawai">' +
      viewBtn('list', 'Agenda') + viewBtn('grid', 'Calendar') + '</div>' +
      officerFilter +
      '</div></div>' +
      (view === 'grid' ? officerCalTools() : '') +
      '<div class="msg info" style="margin-top:12px"><div class="ico">&#8505;</div><div>' +
      'Status kalendar: <span class="badge gray">Tentative</span> <span class="badge amber">Hold</span> ' +
      '<span class="badge green">Confirmed</span> <span class="badge red">Cancelled</span> &mdash; ' +
      'Aktiviti hanya menjadi <b>Confirmed</b> selepas diluluskan oleh PA/NC.</div></div>' +
      '</div>';

    if (view === 'grid') return head + officerGridBody(entries);

    return head + officerAgendaHtml(entries);
  }

  function officerEntryHtml(e) {
    return '<div class="cal-entry ' + e.status.toLowerCase() + '">' +
      '<div class="time">' + esc(fmtTime(e.start)) + ' &ndash; ' + esc(fmtTime(e.end)) + '</div>' +
      '<div class="grow"><strong>' + esc(e.title) + '</strong>' +
      '<div class="meta">' + esc(e.officer) + ' &middot; Peranan: ' + esc(e.role) +
      (e.venue ? ' &middot; Venue: ' + esc(e.venue) : '') + '</div></div>' +
      calStatusBadge(e.status) + '</div>';
  }

  function officerAgendaHtml(entries) {
    var grouped = {};
    entries.forEach(function (e) {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    var dates = Object.keys(grouped).sort();

    return dates.map(function (d) {
      return '<div class="cal-day"><h3>&#128197; ' + esc(fmtDateLong(d)) + '</h3>' +
        grouped[d].map(officerEntryHtml).join('') + '</div>';
    }).join('') || '<div class="empty-state">Tiada entri kalendar untuk pegawai ini.</div>';
  }

  /* Alat kawalan paparan grid kalendar pegawai (mod + tarikh + navigasi). */
  function officerCalTools() {
    var mode = viewParams.calGridMode === 'harian' ? 'harian' : (viewParams.calGridMode === 'bulanan' ? 'bulanan' : 'mingguan');
    var date = viewParams.calDate || todayISO();
    var ctrl = mode === 'bulanan'
      ? '<input type="month" id="inOfficerCalMonth" value="' + esc(date.slice(0, 7)) + '" title="Bulan">'
      : '<input type="date" id="inOfficerCalDate" value="' + esc(date) + '" title="Tarikh">';
    return '<div class="cal-tools" style="margin-top:12px">' +
      '<select id="selOfficerCalMode" title="Paparan">' +
      '<option value="harian"' + (mode === 'harian' ? ' selected' : '') + '>Paparan Harian</option>' +
      '<option value="mingguan"' + (mode === 'mingguan' ? ' selected' : '') + '>Paparan Mingguan</option>' +
      '<option value="bulanan"' + (mode === 'bulanan' ? ' selected' : '') + '>Paparan Bulanan</option>' +
      '</select>' +
      ctrl +
      '<button class="btn btn-sm btn-outline" data-act="oc-prev">&larr;</button>' +
      '<button class="btn btn-sm btn-outline" data-act="oc-today">Hari Ini</button>' +
      '<button class="btn btn-sm btn-outline" data-act="oc-next">&rarr;</button>' +
      '</div>';
  }

  function officerGridBody(entries) {
    var mode = viewParams.calGridMode === 'harian' ? 'harian' : (viewParams.calGridMode === 'bulanan' ? 'bulanan' : 'mingguan');
    var date = viewParams.calDate || todayISO();

    if (mode === 'bulanan') return officerMonthBody(entries, date);

    var days = mode === 'harian' ? [date] : weekDays(date);
    var visible = entries.filter(function (e) { return days.indexOf(e.date) !== -1; });

    var title = mode === 'harian'
      ? 'Jadual Harian &middot; ' + esc(fmtDateLong(date))
      : 'Jadual Mingguan &middot; ' + esc(fmtDate(days[0])) + ' &ndash; ' + esc(fmtDate(days[6]));

    var empty = visible.length ? '' :
      '<div class="msg warn" style="margin-top:12px"><div class="ico">&#9888;&#65039;</div><div>' +
      'Tiada entri kalendar untuk paparan ini.</div></div>';

    var grid = '<div class="card"><h3>' + title + '</h3>' + empty +
      '<div class="table-wrap"><table class="vgrid' + (mode === 'harian' ? ' one-day' : '') + '">' +
      '<thead><tr><th class="vtime">Masa</th>' + officerDaysHeadHtml(days, entries) + '</tr></thead>' +
      '<tbody>' + officerRowsBodyHtml(days, entries) + '</tbody></table></div></div>';

    if (mode === 'harian') {
      var dayEntries = entries.filter(function (e) { return e.date === date; });
      grid += '<div class="card"><h3>&#128197; Agenda &middot; ' + esc(fmtDateLong(date)) + '</h3>' +
        (dayEntries.map(officerEntryHtml).join('') ||
          '<div class="empty-state">Tiada entri kalendar pada tarikh ini.</div>') +
        '</div>';
    }
    return grid;
  }

  function officerMonthBody(entries, date) {
    var d0 = new Date(date.slice(0, 4) + '-' + date.slice(5, 7) + '-01T00:00:00');
    var year = d0.getFullYear();
    var month = d0.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var lead = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Isnin
    var today = todayISO();

    function cell(d) {
      var iso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var n = entries.filter(function (e) { return e.date === iso && e.status !== 'Cancelled'; }).length;
      var level = n === 0 ? 'free' : (n <= 2 ? 'busy' : 'full');
      var label = n === 0 ? 'Percuma' : n + ' entri';
      return '<button type="button" class="mday ' + level + (iso === today ? ' today' : '') + '"' +
        ' data-act="oc-day" data-args=\'{"date":"' + iso + '"}\' title="' + esc(fmtDate(iso)) + ' &middot; ' + label + '">' +
        '<span class="mday-n">' + d + '</span><span class="mday-c">' + label + '</span></button>';
    }

    var head = '<div class="mday-h">' +
      ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(function (w) {
        return '<div>' + w + '</div>';
      }).join('') + '</div>';

    var cells = '';
    for (var i = 0; i < lead; i++) cells += '<div class="mday blank"></div>';
    for (var d = 1; d <= daysInMonth; d++) cells += cell(d);

    var pads = (7 - (cells.match(/class="mday/g) || []).length % 7) % 7;
    for (var j = 0; j < pads; j++) cells += '<div class="mday blank"></div>';

    var monthName = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'][month];

    return '<div class="card"><h3>Jadual Bulanan &middot; ' + monthName + ' ' + year + '</h3>' +
      '<div class="month-legend">' +
      '<span><i class="dot free"></i>Percuma (0 entri)</span>' +
      '<span><i class="dot busy"></i>Sederhana (1&ndash;2 entri)</span>' +
      '<span><i class="dot full"></i>Penuh (3+ entri)</span>' +
      '</div>' +
      '<div class="month-grid">' + head + cells + '</div></div>';
  }

  function officerDaysHeadHtml(days, entries) {
    return days.map(function (d) {
      var n = entries.filter(function (e) { return e.date === d; }).length;
      var idx = new Date(d + 'T00:00:00').getDay();
      return '<th class="vday' + (d === todayISO() ? ' today' : '') + '">' + esc(DAYS_SHORT[idx]) +
        '<span class="vday-d">' + esc(fmtDate(d)) + '</span>' +
        '<span class="vday-n">' + n + ' entri</span></th>';
    }).join('');
  }

  function officerRowsBodyHtml(days, entries) {
    var html = '';
    for (var h = VENUE_HOURS.start; h < VENUE_HOURS.end; h++) {
      var slotStart = h * 60;
      var slotEnd = slotStart + 60;
      html += '<tr><td class="vtime">' + esc(fromMin(slotStart)) + '</td>';
      days.forEach(function (d) {
        var items = entries.filter(function (e) {
          if (e.date !== d) return false;
          return toMin(e.start) < slotEnd && slotStart < toMin(e.end);
        }).map(function (e) {
          var starts = toMin(e.start) >= slotStart;
          var title = e.title + ' | ' + e.officer + ' | ' + e.role + ' | ' +
            fmtTime(e.start) + '-' + fmtTime(e.end) + ' | ' + e.status;
          return '<div class="obook ' + e.status.toLowerCase() + (starts ? '' : ' cont') +
            '" title="' + esc(title) + '">' +
            (starts ? '<b>' + esc(e.title) + '</b><span>' + esc(e.officer) + '</span>' +
              '<em>' + esc(fmtTime(e.start)) + ' &ndash; ' + esc(fmtTime(e.end)) + '</em>' : '') +
            '</div>';
        });
        html += '<td class="vslot' + (items.length ? ' busy' : '') + '">' + items.join('') + '</td>';
      });
      html += '</tr>';
    }
    return html;
  }

  /* ---------------- ADMIN / AUDIT ---------------- */

  /* ============================================================
     MODUL PENGURUSAN VENUE - ADMIN (CRUD)
     ============================================================ */

  function rVenues() {
    var rows = state.venues.map(function (v) {
      return '<tr>' +
        '<td><strong>' + esc(v.nama) + '</strong><div class="sub">' + esc(v.lokasi) + '</div></td>' +
        '<td><span class="code">' + esc(v.kod) + '</span></td>' +
        '<td class="nowrap">' + esc(v.kapasiti) + ' pax</td>' +
        '<td>' + venueFacilitiesHtml(v.fasiliti) + '</td>' +
        '<td>' + venueStatusBadge(v) + '</td>' +
        '<td class="nowrap">' + venueUses(v.id) + ' tempahan</td>' +
        '<td class="nowrap">' +
        '<button class="btn btn-sm btn-outline" data-act="edit-venue" data-args=\'{"id":"' + esc(v.id) + '"}\'>Edit</button> ' +
        '<button class="btn btn-sm btn-outline" data-act="toggle-venue" data-args=\'{"id":"' + esc(v.id) + '"}\'>' +
        (v.status === 'aktif' ? 'Penyelenggaraan' : 'Aktifkan') + '</button> ' +
        '<button class="btn btn-sm btn-danger-outline" title="Hapus venue" data-act="delete-venue" data-args=\'{"id":"' + esc(v.id) + '"}\'>&#128465;</button>' +
        '</td></tr>';
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted)">Tiada venue direkodkan.</td></tr>';

    var aktif = state.venues.filter(isActiveVenue).length;

    return '<div class="card">' +
      '<div class="card-head">' +
      '<h2 style="margin:0">Pengurusan Venue</h2>' +
      '<button class="btn btn-sm" data-act="add-venue">+ Tambah Venue</button>' +
      '</div>' +
      '<p style="color:var(--muted)">Venue rasmi universiti yang boleh dipilih oleh Urusetia semasa mendaftarkan aktiviti. ' +
      'Venue berstatus <b>Dalam Penyelenggaraan</b> disekat daripada tempahan sehingga selesai kerja penyelenggaraan.</p>' +
      '<div class="summary-grid">' +
      miniStat(state.venues.length, 'Jumlah Venue', 'blue') +
      miniStat(aktif, 'Venue Aktif', 'green') +
      miniStat(state.venues.length - aktif, 'Dalam Penyelenggaraan', 'red') +
      '</div>' +
      '<div class="table-wrap"><table>' +
      '<thead><tr><th>Venue</th><th>Kod</th><th>Kapasiti</th><th>Fasiliti</th><th>Status</th><th>Tempahan</th><th>Tindakan</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<div class="msg info" style="margin:16px 0 0"><div class="ico">&#8505;</div><div>' +
      'Venue yang masih mempunyai tempahan <b>Pending</b> atau <b>Confirmed</b> tidak boleh dihapus &mdash; ' +
      'sila tukar statusnya kepada <b>Dalam Penyelenggaraan</b> bagi menyahaktifkan.</div></div>' +
      '</div>';
  }

  function miniStat(num, label, mod) {
    return '<div class="summary-card ' + mod + '"><div class="num ' + mod + '">' + num +
      '</div><div class="label">' + esc(label) + '</div></div>';
  }

  function openVenueModal(id) {
    var v = id ? getVenue(id) : null;
    if (id && !v) { toast('Venue tidak dijumpai.', 'red'); return; }
    venueModalId = v ? v.id : null;

    $('venueModalTitle').textContent = v ? 'Edit Venue' : 'Tambah Venue Baharu';
    $('venueModalSubmit').textContent = v ? 'Simpan Perubahan' : 'Tambah Venue';
    ['vgNama', 'vgKod', 'vgKapasiti', 'vgLokasi', 'vgFasiliti'].forEach(function (g) {
      $(g).classList.remove('invalid');
    });

    $('vNama').value = v ? v.nama : '';
    $('vKod').value = v ? v.kod : '';
    $('vKapasiti').value = v ? v.kapasiti : '';
    $('vLokasi').value = v ? v.lokasi : '';
    $('vFasiliti').value = v ? (v.fasiliti || []).join(', ') : '';
    $('vStatus').value = v ? v.status : 'aktif';

    $('venueModal').hidden = false;
    setTimeout(function () { $('vNama').focus(); }, 40);
  }

  function closeVenueModal() {
    $('venueModal').hidden = true;
    venueModalId = null;
  }

  function handleVenueSubmit(e) {
    e.preventDefault();

    var nama = $('vNama').value.trim();
    var kod = $('vKod').value.trim().toUpperCase();
    var kapasiti = parseInt($('vKapasiti').value, 10);
    var lokasi = $('vLokasi').value.trim();
    var fasiliti = $('vFasiliti').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    var status = $('vStatus').value === MAINT_STATUS ? MAINT_STATUS : ACTIVE_STATUS;

    var ok = true;
    function mark(groupId, valid) {
      $(groupId).classList[valid ? 'remove' : 'add']('invalid');
      if (!valid) ok = false;
    }
    mark('vgNama', !!nama);
    mark('vgKod', !!kod && !state.venues.some(function (v) {
      return v.kod.toUpperCase() === kod && v.id !== venueModalId;
    }));
    mark('vgKapasiti', !!kapasiti && kapasiti > 0);
    mark('vgLokasi', !!lokasi);

    if (!ok) {
      toast('Sila semak maklumat venue yang diperlukan.', 'red');
      return;
    }

    if (venueModalId) {
      var v = getVenue(venueModalId);
      var lama = v.status;
      v.nama = nama; v.kod = kod; v.kapasiti = kapasiti;
      v.lokasi = lokasi; v.fasiliti = fasiliti; v.status = status;

      /* Kemas kini rujukan nama venue pada aktiviti & permohonan sedia ada. */
      state.activities.forEach(function (a) {
        if (sameVenueId(a, v.id)) a.lokasi = nama;
      });
      state.requests.forEach(function (r) {
        if (sameVenueId(r, v.id)) r.lokasi = nama;
      });

      audit('Venue dikemas kini: ' + nama + (lama !== status ? ' (status: ' + venueStatusText(v) + ')' : ''));
      toast('Venue "' + nama + '" dikemas kini.');
      closeVenueModal();
    } else {
      state.venues.push({
        id: uid('ven_'), nama: nama, kod: kod, kapasiti: kapasiti,
        lokasi: lokasi, fasiliti: fasiliti, status: status
      });
      audit('Venue baharu ditambah: ' + nama + ' (' + kod + ', ' + kapasiti + ' pax)');
      toast('Venue baharu "' + nama + '" ditambah.');
      closeVenueModal();
    }

    save();
    renderChrome();
    renderContent();
  }

  function toggleVenueStatus(id) {
    var v = getVenue(id);
    if (!v) return;
    var next = v.status === 'aktif' ? 'penyelenggaraan' : 'aktif';
    v.status = next;
    audit('Status venue ditukar: ' + v.nama + ' -> ' + venueStatusText(v));
    if (next === 'penyelenggaraan') {
      toast('"' + v.nama + '" kini dalam penyelenggaraan &mdash; venue disekat dari tempahan.', 'amber');
    } else {
      toast('"' + v.nama + '" kini aktif dan boleh ditempah.');
    }
    save();
    renderContent();
  }

  function venueStatusText(v) {
    if (!v) return '-';
    return v.status === 'penyelenggaraan' ? 'Dalam Penyelenggaraan' : 'Aktif';
  }

  function deleteVenue(id) {
    var v = getVenue(id);
    if (!v) return;
    var uses = venueUses(id);
    if (uses > 0) {
      toast('Venue "' + v.nama + '" mempunyai ' + uses + ' tempahan aktif. Gunakan status "Dalam Penyelenggaraan" untuk menyahaktifkan.', 'red');
      audit('Hapus venue ditolak (ada tempahan): ' + v.nama);
      return;
    }
    if (!confirm('Yakin untuk menghapus venue "' + v.nama + '"?')) return;
    state.venues = state.venues.filter(function (x) { return x.id !== id; });
    state.activities.forEach(function (a) { if (a.venueId === id) a.venueId = null; });
    state.requests.forEach(function (r) { if (r.venueId === id) r.venueId = null; });
    audit('Venue dihapuskan: ' + v.nama + ' (' + v.kod + ')');
    toast('Venue "' + v.nama + '" dihapuskan.');
    save();
    renderContent();
  }

  /* ============================================================
     MODUL PENGURUSAN VENUE - KALENDAR VENUE
     ============================================================ */

  function rVenueCalendar() {
    var mode = viewParams.mode === 'mingguan' ? 'mingguan' : 'harian';
    var vFilter = viewParams.venue || 'semua';
    var date = viewParams.date || todayISO();
    var venue = vFilter === 'semua' ? null : getVenue(vFilter);
    /* Halaman Officer/PA: Venue Calendar dalam mod READ-ONLY (rujukan sahaja). */
    var ro = state.role === 'pa';

    venueCalCtx = { venue: vFilter, mode: mode, date: date };

    var cards = sortedVenues().map(function (v) {
      var n = venueBookings({ venueId: v.id, date: date }).length;
      return '<div class="venue-card' + (v.status === 'aktif' ? '' : ' maint') + '">' +
        '<div class="vc-head"><strong>' + esc(v.nama) + '</strong>' + venueStatusBadge(v) + '</div>' +
        '<div class="vc-meta">' + esc(v.kod) + ' &middot; ' + esc(v.kapasiti) + ' pax &middot; ' + esc(v.lokasi) + '</div>' +
        venueFacilitiesHtml(v.fasiliti) +
        '<div class="vc-foot">' +
        '<span class="vc-count">' + (v.status === 'aktif'
          ? n + ' tempahan pada ' + esc(fmtDate(date))
          : 'Tidak boleh ditempah') + '</span>' +
        '<button class="btn btn-sm btn-outline" data-act="venue-filter-cal" data-args=\'{"id":"' + esc(v.id) + '"}\'>Jadual Venue</button>' +
        '</div></div>';
    }).join('');

    var opts = '<option value="semua"' + (vFilter === 'semua' ? ' selected' : '') + '>Semua Venue</option>' +
      sortedVenues().map(function (v) {
        return '<option value="' + esc(v.id) + '"' + (vFilter === v.id ? ' selected' : '') + '>' +
          esc(v.nama) + (v.status === 'aktif' ? '' : ' (Penyelenggaraan)') + '</option>';
      }).join('');

    var tools = '<div class="cal-tools">' +
      '<select id="selVenueCalFilter" title="Tapis mengikut venue">' + opts + '</select>' +
      '<select id="selCalMode" title="Paparan">' +
      '<option value="harian"' + (mode === 'harian' ? ' selected' : '') + '>Paparan Harian</option>' +
      '<option value="mingguan"' + (mode === 'mingguan' ? ' selected' : '') + '>Paparan Mingguan</option>' +
      '</select>' +
      '<input type="date" id="inCalDate" value="' + esc(date) + '" title="Tarikh">' +
      '<button class="btn btn-sm btn-outline" data-act="cal-prev">&larr;</button>' +
      '<button class="btn btn-sm btn-outline" data-act="cal-today">Hari Ini</button>' +
      '<button class="btn btn-sm btn-outline" data-act="cal-next">&rarr;</button>' +
      '</div>';

    var head = '<div class="card">' +
      '<div class="card-head"><h3 style="margin:0">Venue Schedule</h3>' +
      (ro ? '<span class="badge blue">READ-ONLY &middot; RUJUKAN SAHAJA</span>' : '') + tools + '</div>' +
      '<div class="msg info" style="margin-top:12px"><div class="ico">&#8505;</div><div>' +
      (ro
        ? '<b>Mod rujukan (read-only).</b> Paparan ini hanya untuk menyemak ketersediaan dewan / bilik. ' +
          'Klik pada slot, penempahan dan pengubahsuaian data venue <b>tidak dibenarkan</b> &mdash; ' +
          'hubungi Urusetia untuk mendaftarkan aktiviti rasmi.'
        : (venue ? 'Jadual tempahan <b>' + esc(venue.nama) + '</b> &middot; ' : 'Jadual tempahan semua venue &middot; ') +
          'Slot kosong <b>klik untuk terus mendaftarkan aktiviti</b>. ' +
          'Tempahan berstatus <span class="badge amber">Menunggu Semakan</span> (Pending) dan ' +
          '<span class="badge green">Disahkan</span> (Confirmed) menghalang slot baharu yang bertindih.') +
      '</div></div>' +
      '</div>';

    var body;
    if (venue && !isActiveVenue(venue)) {
      body = '<div class="card"><div class="msg error"><div class="ico">&#9888;&#65039;</div><div>' +
        '<strong>' + esc(venue.nama) + ' sedang dalam penyelenggaraan</strong>' +
        'Venue ini tidak boleh ditempah sehingga Admin mengemas kini statusnya kepada <b>Aktif</b>.</div></div>' +
        '<div class="table-wrap"><table class="vgrid"><thead><tr><th class="vtime">Masa</th>' +
        daysHeadHtml(weekDays(date), vFilter) + '</tr></thead><tbody>' +
        rowsBodyHtml(weekDays(date), vFilter, ro) + '</tbody></table></div></div>';
    } else if (mode === 'mingguan') {
      var days = weekDays(date);
      body = '<div class="card"><h3>Jadual Mingguan &middot; ' +
        esc(fmtDate(days[0])) + ' &ndash; ' + esc(fmtDate(days[6])) + '</h3>' +
        '<div class="table-wrap"><table class="vgrid">' +
        '<thead><tr><th class="vtime">Masa</th>' + daysHeadHtml(days, vFilter) + '</tr></thead>' +
        '<tbody>' + rowsBodyHtml(days, vFilter, ro) + '</tbody></table></div></div>';
    } else {
      body = venueDayPanel(date, vFilter, ro);
    }

    return head +
      '<div class="card"><h3>Senarai Venue</h3><div class="venue-grid">' +
      (cards || '<div class="empty-state">Tiada venue direkodkan. Sila Admin tambah venue terlebih dahulu.</div>') +
      '</div></div>' + body;
  }

  function daysHeadHtml(days, vFilter) {
    return days.map(function (d) {
      var n = venueBookings({ date: d }).filter(function (a) {
        return vFilter === 'semua' || sameVenueId(a, vFilter);
      }).length;
      var idx = new Date(d + 'T00:00:00').getDay();
      return '<th class="vday' + (d === todayISO() ? ' today' : '') + '">' + esc(DAYS_SHORT[idx]) +
        '<span class="vday-d">' + esc(fmtDate(d)) + '</span>' +
        '<span class="vday-n">' + n + ' tempahan</span></th>';
    }).join('');
  }

  function rowsBodyHtml(days, vFilter, ro) {
    var bookings = venueBookings({});
    var html = '';
    for (var h = VENUE_HOURS.start; h < VENUE_HOURS.end; h++) {
      var slotStart = h * 60;
      var slotEnd = slotStart + 60;
      html += '<tr><td class="vtime">' + esc(fromMin(slotStart)) + '</td>';
      days.forEach(function (d) {
        var items = bookings.filter(function (a) {
          if (a.tarikh !== d) return false;
          if (vFilter !== 'semua' && !sameVenueId(a, vFilter)) return false;
          return toMin(a.masaMula) < slotEnd && slotStart < toMin(a.masaTamat);
        }).map(function (a) {
          var starts = toMin(a.masaMula) >= slotStart;
          var title = a.nama + ' | ' + venueLabel(a) + ' | ' + fmtTime(a.masaMula) + '-' + fmtTime(a.masaTamat) +
            ' | ' + (a.status === 'disahkan' ? 'Disahkan' : 'Menunggu Semakan');
          return '<div class="vslot-book ' + (a.status === 'disahkan' ? 'ok' : 'wait') + (starts ? '' : ' cont') +
            '" title="' + esc(title) + '">' +
            (starts ? '<b>' + esc(a.nama) + '</b><span>' + esc(venueLabel(a)) + '</span>' +
              '<em>' + esc(fmtTime(a.masaMula)) + ' &ndash; ' + esc(fmtTime(a.masaTamat)) + '</em>' : '') +
            '</div>';
        });
        if (items.length) {
          html += '<td class="vslot busy">' + items.join('') + '</td>';
        } else if (ro) {
          /* Mod read-only (officer): slot kosong tanpa tindakan tempahan. */
          html += '<td class="vslot free ro" title="Slot kosong (rujukan sahaja - tiada tempahan)"></td>';
        } else {
          html += '<td class="vslot free" title="Slot kosong - klik untuk daftar aktiviti" data-act="pick-slot" data-args=\'' +
            '{"date":"' + d + '","start":"' + fromMin(slotStart) + '","venue":"' + (vFilter === 'semua' ? '' : vFilter) + '"}\'></td>';
        }
      });
      html += '</tr>';
    }
    return html;
  }

  function venueDayPanel(date, vFilter, ro) {
    var bookings = venueBookings({ date: date }).filter(function (a) {
      return vFilter === 'semua' || sameVenueId(a, vFilter);
    });

    var rows = bookings.map(function (a) {
      return '<tr>' +
        '<td class="nowrap">' + esc(fmtTime(a.masaMula)) + ' &ndash; ' + esc(fmtTime(a.masaTamat)) + '</td>' +
        '<td><strong>' + esc(a.nama) + '</strong><div class="sub">' + esc(a.kategori) + ' &middot; ' + esc(a.jafpib || '-') + '</div></td>' +
        '<td>' + esc(venueLabel(a)) + '</td>' +
        '<td>' + activityStatusBadge(a) + '</td>' +
        (ro ? '' : '<td class="nowrap"><button class="btn btn-sm btn-outline" data-act="edit-activity" data-args=\'{"id":"' + esc(a.id) + '"}\'>Urus</button></td>') +
        '</tr>';
    }).join('') || '<tr><td colspan="' + (ro ? 4 : 5) + '" style="text-align:center;color:var(--muted)">Tiada tempahan pada ' +
      esc(fmtDate(date)) + ' &mdash; semua slot kosong.</td></tr>';

    var list = (vFilter === 'semua' ? state.venues.filter(isActiveVenue) : [getVenue(vFilter)])
      .filter(Boolean).map(function (v) {
        var wins = freeWindows(v, date);
        return '<div class="free-block">' +
          '<div class="free-head"><strong>' + esc(v.nama) + '</strong>' +
          '<span class="vc-count">' + (wins.length ? wins.length + ' slot kosong' : 'Penuh') + '</span></div>' +
          (wins.length
            ? '<div class="chip-row">' + wins.map(function (w) {
                var range = esc(fmtTime(fromMin(w.s))) + ' &ndash; ' + esc(fmtTime(fromMin(w.e)));
                return ro
                  /* Mod read-only (officer): paparan maklumat sahaja, bukan butang tempahan. */
                  ? '<span class="chip ro" title="Slot kosong (rujukan sahaja)">' + range + '</span>'
                  : '<button class="chip chip-btn" data-act="pick-slot" data-args=\'' +
                    '{"date":"' + date + '","start":"' + fromMin(w.s) + '","end":"' + fromMin(w.e) + '","venue":"' + esc(v.id) + '"}\'>' +
                    range + '</button>';
              }).join('') + '</div>'
            : '<div class="va-muted">Tiada ruang kosong pada tarikh ini.</div>') +
          '</div>';
      }).join('') || '<div class="empty-state">Tiada venue aktif untuk dipaparkan.</div>';

    return '<div class="card"><h3>Tempahan pada ' + esc(fmtDateLong(date)) + '</h3>' +
      '<div class="table-wrap"><table>' +
      '<thead><tr><th>Masa</th><th>Aktiviti</th><th>Venue</th><th>Status</th>' +
      (ro ? '' : '<th>Tindakan</th>') + '</tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card"><h3>' +
      (ro ? 'Slot Kosong (rujukan sahaja &mdash; tiada tempahan)' : 'Slot Kosong (boleh diklik untuk tempah)') +
      '</h3>' + list + '</div>';
  }

  /* ============================================================
     MODUL PENGURUSAN VENUE - ADMIN / AUDIT
     ============================================================ */

  function rUsers() {
    var idx = adminEdit.user && adminEdit.user.idx != null ? adminEdit.user.idx : -1;
    var editUser = idx >= 0 ? state.officers[idx] : null;
    var name = editUser ? editUser.name : '';
    var role = editUser ? (editUser.role || 'urusetia') : 'urusetia';

    var roleOpts = Object.keys(ROLE_LABEL).map(function (k) {
      return '<option value="' + k + '"' + (k === role ? ' selected' : '') + '>' + esc(ROLE_LABEL[k]) + '</option>';
    }).join('');

    var rows = state.officers.map(function (o, i) {
      return '<tr><td><strong>' + esc(o.name) + '</strong></td>' +
        '<td><span class="badge blue">' + esc((o.role && ROLE_LABEL[o.role]) || 'Pengguna') + '</span></td>' +
        '<td class="nowrap">' +
        '<button class="btn btn-sm btn-outline" data-act="edit-user" data-args=\'{"idx":' + i + '}\'>Edit</button> ' +
        '<button class="btn btn-sm btn-danger-outline" title="Hapus pengguna" data-act="delete-user" data-args=\'{"idx":' + i + '}\'>&#128465;</button></td></tr>';
    }).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--muted)">Tiada pengguna.</td></tr>';

    return '<div class="card">' +
      '<h2>Pengurusan Pengguna</h2>' +
      '<p style="color:var(--muted)">Pengguna menjadi senarai pegawai dalam <b>Pilih Pegawai</b> dan Kalendar Pegawai.</p>' +
      '<form id="formUser" novalidate>' +
      '  <div class="form-grid">' +
      '    <div class="form-group" id="gUserName"><label>Nama Pengguna <span class="req">*</span></label>' +
      '      <input type="text" id="inUserName" placeholder="cth. Ahmad bin Ali" value="' + esc(name) + '">' +
      '      <div class="form-error">Sila masukkan nama pengguna.</div></div>' +
      '    <div class="form-group"><label>Peranan</label><select id="inUserRole">' + roleOpts + '</select></div>' +
      '  </div>' +
      '  <div class="btn-row">' +
      '    <button type="submit" class="btn btn-sm">' + (editUser ? 'Simpan' : 'Tambah Pengguna') + '</button>' +
      (editUser ? '<button type="button" class="btn btn-sm btn-outline" data-act="cancel-user">Batal</button>' : '') +
      '  </div>' +
      '</form></div>' +
      '<div class="card"><h3>Senarai Pengguna</h3>' +
      '<div class="table-wrap"><table>' +
      '<thead><tr><th>Nama</th><th>Peranan</th><th>Tindakan</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>';
  }

  function handleUserSubmit(e) {
    e.preventDefault();
    var name = $('inUserName').value.trim();
    var role = $('inUserRole').value;
    var group = $('gUserName');
    if (!name) { group.classList.add('invalid'); toast('Sila masukkan nama pengguna.', 'red'); return; }
    group.classList.remove('invalid');
    var idx = adminEdit.user && adminEdit.user.idx != null ? adminEdit.user.idx : -1;
    if (idx >= 0) {
      state.officers[idx].name = name;
      state.officers[idx].role = role;
      audit('Pengguna dikemas kini: ' + name);
      toast('Pengguna dikemas kini.');
    } else {
      if (state.officers.some(function (o) { return o.name === name; })) { toast('Pengguna sudah wujud.', 'amber'); return; }
      state.officers.push({ name: name, role: role });
      audit('Pengguna baharu ditambah: ' + name);
      toast('Pengguna baharu ditambah.');
    }
    adminEdit.user = null;
    save(); renderContent();
  }

  function deleteUser(i) {
    var u = state.officers[i];
    if (!u) return;
    var inUse = state.activities.some(function (a) { return (a.officers || []).some(function (o) { return o.name === u.name; }); }) ||
      state.requests.some(function (r) { return r.officers.some(function (o) { return o.name === u.name; }); });
    if (inUse) { toast('Pengguna tidak boleh dihapus kerana telah digunakan dalam aktiviti.', 'red'); return; }
    if (!confirm('Yakin untuk menghapus pengguna "' + u.name + '"?')) return;
    state.officers.splice(i, 1);
    if (adminEdit.user && adminEdit.user.idx === i) adminEdit.user = null;
    save(); audit('Pengguna dihapuskan: ' + u.name);
    toast('Pengguna "' + u.name + '" dihapuskan.');
    renderContent();
  }

  function rManage(cfg) {
    var cols = cfg.columns.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('');
    return '<div class="card">' +
      '<h2>' + esc(cfg.title) + '</h2>' +
      (cfg.note ? '<p style="color:var(--muted)">' + cfg.note + '</p>' : '') +
      '<form id="' + cfg.formId + '" novalidate>' +
      '  <div class="form-group" id="' + cfg.groupId + '"><label>' + esc(cfg.label) + ' <span class="req">*</span></label>' +
      '    <input type="text" id="' + cfg.inputId + '" placeholder="' + esc(cfg.placeholder) + '" value="' + esc(cfg.editing || '') + '">' +
      '    <div class="form-error">' + esc(cfg.errorText) + '</div>' +
      '  </div>' +
      '  <div class="btn-row">' +
      '    <button type="submit" class="btn btn-sm">' + (cfg.editing ? 'Simpan' : 'Tambah') + '</button>' +
      (cfg.editing ? '<button type="button" class="btn btn-sm btn-outline" data-act="' + cfg.cancelAct + '">Batal</button>' : '') +
      '  </div>' +
      '</form></div>' +
      '<div class="card"><h3>Senarai Semasa</h3>' +
      '<div class="table-wrap"><table>' +
      '<thead><tr>' + cols + '</tr></thead>' +
      '<tbody>' + (cfg.rows || '<tr><td colspan="' + cfg.columns.length + '" style="text-align:center;color:var(--muted)">Tiada senarai.</td></tr>') + '</tbody>' +
      '</table></div></div>';
  }

  function countCategoryUse(c) {
    var n = 0;
    state.activities.forEach(function (a) { if (a.kategori === c) n++; });
    state.requests.forEach(function (r) { if (r.kategori === c) n++; });
    return n;
  }

  function countRoleUse(role) {
    var n = 0;
    state.activities.forEach(function (a) { (a.officers || []).forEach(function (o) { if (o.peranan === role) n++; }); });
    state.requests.forEach(function (r) { r.officers.forEach(function (o) { if (o.peranan === role) n++; }); });
    return n;
  }

  function rCategories() {
    var editing = adminEdit.categoryIdx != null ? state.categories[adminEdit.categoryIdx] : '';
    var rows = state.categories.map(function (c, i) {
      return '<tr><td><strong>' + esc(c) + '</strong></td><td>' + countCategoryUse(c) + ' aktiviti</td><td class="nowrap">' +
        '<button class="btn btn-sm btn-outline" data-act="edit-category" data-args=\'{"idx":' + i + '}\'>Edit</button> ' +
        '<button class="btn btn-sm btn-danger-outline" title="Hapus kategori" data-act="delete-category" data-args=\'{"idx":' + i + '}\'>&#128465;</button></td></tr>';
    }).join('');
    return rManage({
      title: 'Pengurusan Kategori Aktiviti',
      note: 'Kategori digunakan dalam borang Daftar Aktiviti (Urusetia).',
      formId: 'formCategory', inputId: 'inCategory', groupId: 'gCategory',
      placeholder: 'cth. Mesyuarat', label: 'Nama Kategori',
      errorText: 'Sila masukkan nama kategori.',
      editing: editing, cancelAct: 'cancel-category',
      columns: ['Kategori', 'Digunakan', 'Tindakan'], rows: rows
    });
  }

  function handleCategorySubmit(e) {
    e.preventDefault();
    var val = $('inCategory').value.trim();
    var group = $('gCategory');
    if (!val) { group.classList.add('invalid'); toast('Sila masukkan nama kategori.', 'red'); return; }
    group.classList.remove('invalid');
    var idx = adminEdit.categoryIdx != null ? adminEdit.categoryIdx : -1;
    if (idx >= 0) {
      var old = state.categories[idx];
      state.categories[idx] = val;
      state.activities.forEach(function (a) { if (a.kategori === old) a.kategori = val; });
      state.requests.forEach(function (r) { if (r.kategori === old) r.kategori = val; });
      adminEdit.categoryIdx = null;
      audit('Kategori dikemas kini: ' + val);
      toast('Kategori dikemas kini.');
    } else {
      if (state.categories.indexOf(val) !== -1) { toast('Kategori sudah wujud.', 'amber'); return; }
      state.categories.push(val);
      audit('Kategori baharu ditambah: ' + val);
      toast('Kategori baharu ditambah.');
    }
    save(); renderContent();
  }

  function deleteCategory(i) {
    var c = state.categories[i];
    if (!c) return;
    if (countCategoryUse(c) > 0) { toast('Kategori sedang digunakan. Sila kemas kini aktiviti dahulu.', 'red'); return; }
    if (!confirm('Yakin untuk menghapus kategori "' + c + '"?')) return;
    state.categories.splice(i, 1);
    if (adminEdit.categoryIdx === i) adminEdit.categoryIdx = null;
    save(); audit('Kategori dihapuskan: ' + c);
    toast('Kategori "' + c + '" dihapuskan.');
    renderContent();
  }

  function rRoles() {
    var editing = adminEdit.roleIdx != null ? state.roles[adminEdit.roleIdx] : '';
    var rows = state.roles.map(function (r, i) {
      return '<tr><td><strong>' + esc(r) + '</strong></td><td>' + countRoleUse(r) + ' jemputan</td><td class="nowrap">' +
        '<button class="btn btn-sm btn-outline" data-act="edit-role" data-args=\'{"idx":' + i + '}\'>Edit</button> ' +
        '<button class="btn btn-sm btn-danger-outline" title="Hapus peranan" data-act="delete-role" data-args=\'{"idx":' + i + '}\'>&#128465;</button></td></tr>';
    }).join('');
    return rManage({
      title: 'Pengurusan Peranan Jemputan',
      note: 'Peranan digunakan dalam Pilih Pegawai semasa menetapkan pegawai aktiviti.',
      formId: 'formRole', inputId: 'inRole', groupId: 'gRole',
      placeholder: 'cth. Tetamu Kehormat', label: 'Nama Peranan',
      errorText: 'Sila masukkan nama peranan.',
      editing: editing, cancelAct: 'cancel-role',
      columns: ['Peranan', 'Digunakan', 'Tindakan'], rows: rows
    });
  }

  function handleRoleSubmit(e) {
    e.preventDefault();
    var val = $('inRole').value.trim();
    var group = $('gRole');
    if (!val) { group.classList.add('invalid'); toast('Sila masukkan nama peranan.', 'red'); return; }
    group.classList.remove('invalid');
    var idx = adminEdit.roleIdx != null ? adminEdit.roleIdx : -1;
    if (idx >= 0) {
      var old = state.roles[idx];
      state.roles[idx] = val;
      state.activities.forEach(function (a) { (a.officers || []).forEach(function (o) { if (o.peranan === old) o.peranan = val; }); });
      state.requests.forEach(function (r) { r.officers.forEach(function (o) { if (o.peranan === old) o.peranan = val; }); });
      adminEdit.roleIdx = null;
      audit('Peranan jemputan dikemas kini: ' + val);
      toast('Peranan jemputan dikemas kini.');
    } else {
      if (state.roles.indexOf(val) !== -1) { toast('Peranan sudah wujud.', 'amber'); return; }
      state.roles.push(val);
      audit('Peranan jemputan baharu ditambah: ' + val);
      toast('Peranan jemputan baharu ditambah.');
    }
    save(); renderContent();
  }

  function deleteRole(i) {
    var r = state.roles[i];
    if (!r) return;
    if (countRoleUse(r) > 0) { toast('Peranan sedang digunakan. Sila kemas kini jemputan dahulu.', 'red'); return; }
    if (!confirm('Yakin untuk menghapus peranan "' + r + '"?')) return;
    state.roles.splice(i, 1);
    if (adminEdit.roleIdx === i) adminEdit.roleIdx = null;
    save(); audit('Peranan jemputan dihapuskan: ' + r);
    toast('Peranan "' + r + '" dihapuskan.');
    renderContent();
  }

  function rSettings() {
    var s = state.settings || {};
    return '<div class="card"><h2>Tetapan Sistem</h2>' +
      '<p style="color:var(--muted)">Tetapan disimpan dalam penyemak imbas (localStorage) dan digunakan sepanjang prototaip.</p>' +
      '<form id="formSettings" novalidate>' +
      '  <div class="form-grid">' +
      '    <div class="form-group"><label for="setName">Nama Sistem</label>' +
      '      <input type="text" id="setName" value="' + esc(s.systemName || 'KALORA') + '"></div>' +
      '    <div class="form-group"><label for="setFooter">Nota Kaki (Sidebar)</label>' +
      '      <input type="text" id="setFooter" value="' + esc(s.footerNote || '') + '"></div>' +
      '  </div>' +
      '  <div class="form-group"><label>Mod Demo</label><div class="radio-row">' +
      '    <label><input type="radio" name="setDemo" value="true"' + (s.demoActive ? ' checked' : '') + '> Aktif</label>' +
      '    <label><input type="radio" name="setDemo" value="false"' + (!s.demoActive ? ' checked' : '') + '> Tidak Aktif</label>' +
      '  </div></div>' +
      '  <div class="btn-row"><button type="submit" class="btn">Simpan Tetapan</button></div>' +
      '</form></div>';
  }

  function handleSettingsSubmit(e) {
    e.preventDefault();
    state.settings.systemName = $('setName').value.trim() || 'KALORA';
    state.settings.footerNote = $('setFooter').value.trim() || 'Prototaip frontend sahaja. Tiada backend / pangkalan data.';
    var demo = document.querySelector('input[name="setDemo"]:checked');
    state.settings.demoActive = demo ? demo.value === 'true' : true;
    save();
    renderChrome();
    audit('Tetapan sistem dikemas kini.');
    toast('Tetapan sistem disimpan.');
  }

  function rAudit() {
    var rows = state.audit.map(function (x) {
      return '<tr><td>' + esc(x.time) + '</td><td>' + esc(x.msg) + '</td></tr>';
    }).join('') || '<tr><td colspan="2" style="text-align:center;color:var(--muted)">Tiada rekod audit.</td></tr>';

    return '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
      '<h2 style="margin:0">Audit Log</h2>' +
      '<button class="btn btn-sm btn-outline" data-act="clear-audit">Buang Rekod</button></div>' +
      '<div class="table-wrap" style="margin-top:12px"><table>' +
      '<thead><tr><th>Masa</th><th>Tindakan</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '</div>';
  }

  /* ---------------- MAKLUMAN PANEL ---------------- */

  function refreshNotifPanel() {
    var list = $('notifList');
    if (!state.notifications.length) {
      list.innerHTML = '<div class="notif-item" style="color:var(--muted)">Tiada makluman.</div>';
      return;
    }
    list.innerHTML = state.notifications.map(function (n) {
      return '<div class="notif-item">&#128276; ' + esc(n.msg) + '<div class="t">' + esc(n.time) +
        (n.read ? '' : ' &middot; <b>BARU</b>') + '</div></div>';
    }).join('');
  }

  function markNotifsRead() {
    var changed = false;
    state.notifications.forEach(function (n) {
      if (!n.read) { n.read = true; changed = true; }
    });
    if (changed) { save(); renderChrome(); }
  }

  /* ---------------- TINDAKAN ---------------- */

  function openOfficers(id) { show('officers', { id: id }); }

  function openReview(id) { show('review', { id: id }); }

  function shiftVenueCal(dir) {
    var d = venueCalCtx.date || todayISO();
    return {
      venue: venueCalCtx.venue,
      mode: venueCalCtx.mode,
      date: addDays(d, venueCalCtx.mode === 'mingguan' ? dir * 7 : dir)
    };
  }

  /* Navigasi prev/next untuk paparan grid kalendar pegawai (menggunakan viewParams). */
  function shiftOfficerCal(dir) {
    var mode = viewParams.calGridMode === 'harian' ? 'harian' : (viewParams.calGridMode === 'bulanan' ? 'bulanan' : 'mingguan');
    var d = viewParams.calDate || todayISO();
    return Object.assign({}, viewParams, {
      calDate: mode === 'bulanan' ? addMonths(d, dir) : addDays(d, mode === 'mingguan' ? dir * 7 : dir)
    });
  }

  /* ---------------- PENGIKAT PERISTIWA ---------------- */

  function wireEvents() {
    document.addEventListener('click', function (e) {
      // Sidebar nav
      var navEl = e.target.closest('[data-nav]');
      if (navEl) {
        e.preventDefault();
        closeSidebar();
        show(navEl.getAttribute('data-nav'));
        return;
      }

      // Bell notification
      var bell = e.target.closest('#bellBtn');
      if (bell) {
        e.preventDefault();
        var panel = $('notifPanel');
        if (panel.hidden) {
          refreshNotifPanel();
          panel.hidden = false;
          markNotifsRead();
        } else {
          panel.hidden = true;
        }
        return;
      }

      // Close panel when clicking outside
      var notifPanel = $('notifPanel');
      if (!notifPanel.hidden && !e.target.closest('#notifPanel') && !e.target.closest('#bellBtn')) {
        notifPanel.hidden = true;
      }

      var actEl = e.target.closest('[data-act]');
      if (!actEl) return;
      var act = actEl.getAttribute('data-act');
      var args = {};
      try { args = JSON.parse(actEl.getAttribute('data-args') || '{}'); } catch (err) { /* ignore */ }

      switch (act) {
        case 'add-officer': addOfficer(args.id); break;
        case 'remove-officer': removeOfficer(args.id, args.idx); break;
        case 'clear-officers': clearOfficers(args.id); break;
        case 'check-avail': checkAvailability(args.id); break;
        case 'tukar-masa':
          toast('Sila tukar masa aktiviti menggunakan borang.', 'amber');
          show('create-activity', { id: args.id });
          break;
        case 'tukar-pegawai':
          toast('Sila gugurkan / tukar pegawai yang berkonflik.', 'amber');
          show('officers', { id: args.id });
          break;
        case 'submit-request': submitRequest(args.id); break;
        case 'open-review': openReview(args.id); break;
        case 'open-officers': openOfficers(args.id); break;
        case 'edit-activity':
          if (state.role === 'pa') { toast('Mod rujukan sahaja — pegawai tidak boleh mengubah aktiviti.', 'amber'); break; }
          show('create-activity', { id: args.id });
          break;
        case 'approve': approveRequest(args.id, args.idx); break;
        case 'reject': rejectRequest(args.id, args.idx); break;
        case 'delete-activity': deleteActivity(args.id); break;
        case 'edit-user': adminEdit.user = { idx: args.idx }; renderContent(); break;
        case 'cancel-user': adminEdit.user = null; renderContent(); break;
        case 'delete-user': deleteUser(args.idx); break;

        /* --- Modul Pengurusan Venue (Admin) --- */
        case 'add-venue':
          if (state.role !== 'admin') { toast('Pengurusan venue hanya untuk Admin.', 'amber'); break; }
          openVenueModal(null);
          break;
        case 'edit-venue':
          if (state.role !== 'admin') { toast('Pengurusan venue hanya untuk Admin.', 'amber'); break; }
          openVenueModal(args.id);
          break;
        case 'toggle-venue':
          if (state.role !== 'admin') { toast('Pengurusan venue hanya untuk Admin.', 'amber'); break; }
          toggleVenueStatus(args.id);
          break;
        case 'delete-venue':
          if (state.role !== 'admin') { toast('Pengurusan venue hanya untuk Admin.', 'amber'); break; }
          deleteVenue(args.id);
          break;
        case 'venue-swap-venue':
          venueSuggest.venue = !venueSuggest.venue;
          refreshVenueAvail();
          focusField('selVenue');
          break;
        case 'venue-swap-time':
          venueSuggest.time = !venueSuggest.time;
          refreshVenueAvail();
          focusField('inMula');
          break;
        case 'venue-use': useSuggestedVenue(args.id); break;
        case 'venue-use-time': useSuggestedTime(args.start, args.end); break;
        case 'go-venue-calendar':
          showVenueCalendar({
            venue: ($('selVenue') && $('selVenue').value) || 'semua',
            date: ($('inTarikh') && $('inTarikh').value) || todayISO(),
            mode: 'harian'
          });
          break;
        case 'venue-filter-cal':
          showVenueCalendar({ venue: args.id, date: venueCalCtx.date || todayISO(), mode: 'mingguan' });
          break;
        case 'pick-slot':
          /* Venue Calendar mod read-only (halaman officer/PA): penempahan disekat. */
          if (state.role === 'pa') {
            toast('Mod rujukan sahaja — pegawai tidak boleh menempah slot venue.', 'amber');
            break;
          }
          show('create-activity', {
            venue: args.venue || '', tarikh: args.date || todayISO(),
            masaMula: args.start || ''
          });
          break;
        case 'cal-prev':
          showVenueCalendar(shiftVenueCal(-1));
          break;
        case 'cal-next':
          showVenueCalendar(shiftVenueCal(1));
          break;
        case 'cal-today':
          showVenueCalendar({ venue: venueCalCtx.venue, mode: venueCalCtx.mode, date: todayISO() });
          break;
        case 'cal-tab':
          show('calendar', Object.assign({}, viewParams, { calMode: args.mode }));
          break;
        case 'cal-view':
          show('calendar', Object.assign({}, viewParams, { calView: args.view }));
          break;
        case 'open-officer-act':
          openOfficerActModal();
          break;
        case 'oc-prev':
          show('calendar', shiftOfficerCal(-1));
          break;
        case 'oc-next':
          show('calendar', shiftOfficerCal(1));
          break;
        case 'oc-today':
          show('calendar', Object.assign({}, viewParams, { calDate: todayISO() }));
          break;
        case 'oc-day':
          show('calendar', Object.assign({}, viewParams, { calGridMode: 'harian', calDate: args.date }));
          break;
        case 'edit-category': adminEdit.categoryIdx = args.idx; renderContent(); break;
        case 'cancel-category': adminEdit.categoryIdx = null; renderContent(); break;
        case 'delete-category': deleteCategory(args.idx); break;
        case 'edit-role': adminEdit.roleIdx = args.idx; renderContent(); break;
        case 'cancel-role': adminEdit.roleIdx = null; renderContent(); break;
        case 'delete-role': deleteRole(args.idx); break;
        case 'go-review': {
          var grReq = getRequest(args.id);
          var grOff = (grReq && grReq.officers && grReq.officers.length) ? grReq.officers[0].name : '';
          if (grOff) { state.currentOfficer = grOff; save(); }
          setRoleTo('pa', grOff
            ? 'Permohonan telah dihantar. Simulasi: anda sekarang bertindak sebagai pegawai jemputan ' + grOff + ' (PA/NC) — kelulusan adalah individu.'
            : 'Permohonan telah dihantar. Simulasi: anda sekarang bertindak sebagai PA/NC.');
          openReview(args.id);
          break;
        }
        case 'go-calendar': show('calendar', { calMode: 'pegawai' }); break;
        case 'back-dashboard': show('dashboard'); break;
        case 'clear-audit':
          state.audit = [];
          save(); renderContent();
          toast('Rekod audit dibuang.');
          break;
        case 'clear-notifs':
          state.notifications = [];
          save(); renderChrome(); refreshNotifPanel();
          toast('Semua makluman dibuang.');
          break;
      }
    });

    // Role simulator
    $('roleSelect').addEventListener('change', function () {
      setRoleTo(this.value, 'Simulasi peranan: anda kini bertindak sebagai ' + ROLE_LABEL[this.value] + '.');
    });

    // Officer persona simulator (paparan kalendar peribadi)
    $('officerSelect').addEventListener('change', function () {
      state.currentOfficer = this.value;
      save();
      audit('Pegawai semasa (simulasi) ditukar ke: ' + this.value);
      if (state.view === 'calendar' && state.role === 'pa') {
        show('calendar', Object.assign({}, viewParams, { officer: this.value }));
      } else {
        renderChrome();
      }
      toast('Paparan peribadi: ' + this.value);
    });

    function setRoleTo(role, msg) {
      if (state.role === role) {
        if (msg) toast(msg, '');
        return;
      }
      state.role = role;
      audit('Pertukaran peranan (simulasi) ke: ' + ROLE_LABEL[role]);
      save();
      // Pastikan paparan semasa dibenarkan untuk peranan baharu
      var allowed = NAVS[role].some(function (n) { return n.id === state.view; });
      if (!allowed) show('dashboard');
      else { renderChrome(); renderContent(); }
      if (msg) toast(msg, '');
    }

    // Activity form submit
    $('content').addEventListener('submit', function (e) {
      var f = e.target && e.target.id;
      if (f === 'formActivity') handleActivitySubmit(e);
      else if (f === 'formUser') handleUserSubmit(e);
      else if (f === 'formCategory') handleCategorySubmit(e);
      else if (f === 'formRole') handleRoleSubmit(e);
      else if (f === 'formSettings') handleSettingsSubmit(e);
    });

    // Calendar officer filter
    $('content').addEventListener('change', function (e) {
      if (!e.target) return;
      if (e.target.id === 'selOfficerFilter') {
        show('calendar', Object.assign({}, viewParams, { officer: e.target.value }));
        return;
      }
      if (e.target.id === 'selOfficerCalMode') {
        show('calendar', Object.assign({}, viewParams, { calGridMode: e.target.value }));
        return;
      }
      if (e.target.id === 'inOfficerCalDate' && e.target.value) {
        show('calendar', Object.assign({}, viewParams, { calDate: e.target.value }));
        return;
      }
      if (e.target.id === 'inOfficerCalMonth' && e.target.value) {
        show('calendar', Object.assign({}, viewParams, { calGridMode: 'bulanan', calDate: e.target.value + '-01' }));
        return;
      }
      if (e.target.id === 'selVenueCalFilter') {
        showVenueCalendar({ venue: e.target.value, mode: venueCalCtx.mode, date: venueCalCtx.date });
        return;
      }
      if (e.target.id === 'selCalMode') {
        showVenueCalendar({ venue: venueCalCtx.venue, mode: e.target.value, date: venueCalCtx.date });
        return;
      }
      if (e.target.id === 'inCalDate' && e.target.value) {
        showVenueCalendar({ venue: venueCalCtx.venue, mode: venueCalCtx.mode, date: e.target.value });
      }
    });

    /* Semakan ketersediaan venue secara langsung dalam borang Daftar Aktiviti. */
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === 'selVenue' || t.id === 'inTarikh' || t.id === 'inMula' || t.id === 'inTamat') {
        refreshVenueAvail();
      }
    });
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === 'inMula' || t.id === 'inTamat') refreshVenueAvail();
    });

    /* Modal Pengurusan Venue */
    $('venueModal').addEventListener('click', function (e) {
      if (e.target === this) closeVenueModal();
    });
    $('venueModalX').addEventListener('click', closeVenueModal);
    $('venueModalCancel').addEventListener('click', closeVenueModal);
    $('formVenue').addEventListener('submit', handleVenueSubmit);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('venueModal').hidden) closeVenueModal();
    });

    /* Modal Tambah Aktiviti Peribadi Pegawai / PA */
    $('officerActModal').addEventListener('click', function (e) {
      if (e.target === this) closeOfficerActModal();
    });
    $('officerActModalX').addEventListener('click', closeOfficerActModal);
    $('officerActModalCancel').addEventListener('click', closeOfficerActModal);
    $('formOfficerAct').addEventListener('submit', handleOfficerActivitySubmit);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('officerActModal').hidden) closeOfficerActModal();
    });

    // Mobile menu
    $('menuToggle').addEventListener('click', function () {
      $('sidebar').classList.add('open');
      $('sidebarBackdrop').classList.add('show');
    });
    $('sidebarBackdrop').addEventListener('click', closeSidebar);
  }


  function openOfficerActModal() {
    $('officerActModal').hidden = false;
    $('oaNama').value = '';
    $('oaTarikh').value = todayISO();
    $('oaMasaMula').value = '';
    $('oaMasaTamat').value = '';
    $('oaLokasi').value = '';
    $('ogNama').classList.remove('invalid');
    $('ogTarikh').classList.remove('invalid');
    $('ogMasaMula').classList.remove('invalid');
    $('ogMasaTamat').classList.remove('invalid');
    var who = $('oaUntukPegawai');
    if (who) who.value = state.currentOfficer || '-';
    var nama = $('oaNama');
    if (nama && nama.focus) nama.focus();
  }

  function closeOfficerActModal() {
    $('officerActModal').hidden = true;
  }

  function handleOfficerActivitySubmit(e) {
    e.preventDefault();
    var nama = $('oaNama').value.trim();
    var tarikh = $('oaTarikh').value.trim();
    var mula = $('oaMasaMula').value.trim();
    var tamat = $('oaMasaTamat').value.trim();
    var lokasi = $('oaLokasi').value.trim();
    var ok = true;
    if (!nama) { $('ogNama').classList.add('invalid'); ok = false; } else { $('ogNama').classList.remove('invalid'); }
    if (!tarikh) { $('ogTarikh').classList.add('invalid'); ok = false; } else { $('ogTarikh').classList.remove('invalid'); }
    if (!mula) { $('ogMasaMula').classList.add('invalid'); ok = false; } else { $('ogMasaMula').classList.remove('invalid'); }
    if (!tamat) { $('ogMasaTamat').classList.add('invalid'); ok = false; } else { $('ogMasaTamat').classList.remove('invalid'); }
    if (!ok) { toast('Sila lengkapkan medan wajib.', 'amber'); return; }
    if (mula >= tamat) { $('ogMasaMula').classList.add('invalid'); $('ogMasaTamat').classList.add('invalid'); toast('Masa tamat mesti selepas masa mula.', 'red'); return; }
    var officer = state.currentOfficer || 'Aktiviti Peribadi';
    state.calendar.push({
      id: uid('c_'),
      date: tarikh,
      start: mula,
      end: tamat,
      title: nama,
      officer: officer,
      role: 'Peribadi',
      status: 'Confirmed',
      venue: lokasi,
      venueId: '',
      personal: true
    });
    save();
    audit('Aktiviti peribadi ditambah (' + officer + '): ' + nama);
    toast('Aktiviti peribadi berjaya ditambah.');
    closeOfficerActModal();
    show('calendar', Object.assign({}, viewParams, { officer: officer }));
  }
  function closeSidebar() {
    $('sidebar').classList.remove('open');
    $('sidebarBackdrop').classList.remove('show');
  }

  /* ---------------- PEGAWAI ---------------- */

  function addOfficer(id) {
    var a = getActivity(id);
    if (!a) return;
    var name = $('selOfficer').value;
    var role = $('selPeranan').value;
    var attendance = document.querySelector('input[name="kehadiran"]:checked');
    var kehadiran = attendance ? attendance.value : 'Wajib';
    if (!name) { toast('Sila pilih pegawai.', 'amber'); return; }
    if ((a.officers || []).some(function (o) { return o.name === name; })) { toast('Pegawai telah ditambah.', 'amber'); return; }
    a.officers = a.officers || [];
    a.officers.push({ name: name, peranan: role, kehadiran: kehadiran });
    a.checked = false;
    a.conflicts = null;
    save();
    toast(name + ' ditambah sebagai ' + role + ' (' + kehadiran + ').');
    show('officers', { id: id });
  }

  function removeOfficer(id, idx) {
    var a = getActivity(id);
    if (!a) return;
    var removed = a.officers.splice(idx, 1);
    a.checked = false;
    a.conflicts = null;
    save();
    if (removed.length) toast(removed[0].name + ' digugurkan.');
    show('officers', { id: id });
  }

  function clearOfficers(id) {
    var a = getActivity(id);
    if (!a) return;
    a.officers = [];
    a.checked = false;
    a.conflicts = null;
    save();
    toast('Senarai pegawai dikosongkan.');
    show('officers', { id: id });
  }

  /* ---------------- INIT ---------------- */

  function init() {
    load();
    wireEvents();
    show('dashboard');
  }

  document.addEventListener('DOMContentLoaded', init);
})();