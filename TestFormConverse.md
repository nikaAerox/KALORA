# TestForm Conversation

**Date:** 20 September 2026 – 7 October 2026 (sesi berterusan)
**Tool:** opencode (CLI assistant)
**Project folder:** `C:\Users\ARS\Desktop\ARS\UiTM\INTERN\TASKS INTERN [CSC339]\PROJECT(S)\KALORA\Code\TestForm`

> Nota: fail ini merekodkan kesemua sesi perbualan. Sesi 1 (asas KALORA) ada di Bahagian 1–5.
> Sesi 2 (Modul Pengurusan Venue) di Bahagian 6. Sesi 3 (gabungan kalendar) di Bahagian 7.
> Sesi 4 (dua paparan Kalendar Pegawai) di Bahagian 8. Sesi 5 (paparan Bulanan) di Bahagian 9.

---

## 1. User Request

Create a simple **FRONTEND-ONLY** prototype for:

> **KALORA – UMS Activity & Officer Calendar System**

Constraints:
- Visual and functional prototype only.
- **NO** Laravel, PHP, MySQL, database, backend, API, authentication, or external frameworks.
- Use **ONLY** HTML, CSS, and Vanilla JavaScript.
- Purpose: review and test the basic system process before building the actual Laravel system.

### General design
- Clean, simple, professional UMS-style web interface with a blue/white theme.
- Responsive (desktop + mobile).
- Separate files: `index.html`, `style.css`, `script.js` (extra HTML pages allowed, but keep simple).

### Main process to demonstrate
```
START
 ↓
Urusetia Create Activity
 ↓
Select Category
 ↓
Select Officer + Invitation Role
 ↓
Check Officer Availability
 ↓
Conflict? ── YES ──> Show Conflict → Change Time/Officer
   │
   NO
   ↓
Submit Attendance Request
 ↓
PA / NC Review
 ↓
Approved? ── YES ──> Confirmed ──> Update Calendar ──> Notification
   │
   NO
   ↓
Rejected
```

### Page / feature requirements
1. **Dashboard** – KALORA branding, nav (Dashboard, Activities, Create Activity, Attendance Requests, Officer Calendar), summary cards (Activities, Pending Requests, Confirmed Activities, Conflicts).
2. **Create Activity form** – "Daftar Aktiviti": Nama Aktiviti (required), Kategori (8 options), Tarikh, Masa Mula, Masa Tamat, Lokasi, JAFPIB/PTJ, Keutamaan (Rendah/Sederhana/Tinggi), Penerangan. Buttons: Batal, Simpan & Seterusnya (validate + store in JS/localStorage, then go to Officer Selection).
3. **Officer Selection** – "Pilihan Pegawai": show selected activity summary, pick officer (Ahmad bin Ali, Siti Aminah, Muhammad Hakim, Nur Aisyah, Abdul Rahman), Invitation Role dropdown (9 roles), Attendance Type (Wajib/Pilihan), "+ Tambah Pegawai" table with Remove.
4. **Check Availability** – "Semak Ketersediaan" simulates conflict check against fake schedules (Ahmad 09:00-10:00 Mesyuarat Pengurusan; Siti 14:00-16:00 Program Universiti). Green message when OK; red warning on conflict with Tukar Masa / Tukar Pegawai. Required = "Konflik penting – kehadiran diperlukan"; Optional = "Amaran – pegawai mempunyai aktiviti lain".
5. **Attendance Request** – confirm screen with PENDING APPROVAL status, then "Pergi ke Semakan PA/NC".
6. **PA/NC Review** – request detail with Lulus / Tolak buttons.
7. **Approve** – CONFIRMED, update Officer Calendar, "Lihat Kalendar Pegawai".
8. **Reject** – REJECTED, return to activity page.
9. **Officer Calendar** – simple list grouped by date with status labels Tentative / Hold / Confirmed / Cancelled.
10. **Notification** – displayed in a notification panel (no email).
11. **Key concept** – AVAILABLE ≠ CONFIRMED (an available officer is not confirmed until PA/NC approves).
12. **Role switching** – "Simulate Role" selector: Urusetia / PA / NC / Admin with role-scoped navigation.
13. **Admin** – placeholder pages only (Users, Categories, Invitation Roles, Settings, Audit Log).
14. **UX** – cards, buttons, status badges, alerts, tables, simple nav, clear Malay labels.
15. **No backend** – everything via HTML/CSS/JS + localStorage.

---

## 2. Work Done (Summary)

### Files created in the TestForm folder
| File | Purpose |
|------|---------|
| `index.html` | Layout: sidebar, topbar, role simulator, notifications bell, toast + notification panel containers |
| `style.css` | Blue/white UMS-style theme, cards, badges, tables, alerts, forms, calendar, responsive/mobile sidebar |
| `script.js` | All logic: views, form validation, availability check, requests, approve/reject, calendar, notifications, role switching, localStorage persistence |

### Features implemented
- **Dashboard** with live summary counts; workflow strip; concept card "AVAILABLE ≠ CONFIRMED".
- **Activities** list with status badges (Draf / Menunggu Semakan / Disahkan / Ditolak).
- **Daftar Aktiviti** form with validation (required fields + masa tamat > masa mula); edit mode via "Tukar Masa".
- **Pilihan Pegawai** with add/remove officer table, roles, Wajib/Pilihan.
- **Semak Ketersediaan** – fake schedule conflict simulation:
  - Wajib conflict → red "Konflik jadual dikesan / Konflik penting – kehadiran diperlukan", submit disabled.
  - Pilihan conflict → amber warning, submit still allowed.
  - No conflict → green "Ketersediaan pegawai disahkan. Tiada konflik jadual."
  - Buttons: Tukar Masa, Tukar Pegawai, Hantar Permohonan Kehadiran.
- **Request submission** → PENDING APPROVAL screen → button switches role to PA/NC.
- **PA/NC review** with Lulus/Tolak.
- **Approve** → CONFIRMED + calendar entry added for each officer + notification "telah diluluskan".
- **Reject** → REJECTED + notification "telah ditolak".
- **Officer Calendar** grouped by date, officer filter, 4 status labels.
- **Notification panel** with unread badge count.
- **Simulate Role** – Urusetia / PA / NC / Admin nav filtering.
- **Admin placeholder** pages + functional **Audit Log**.
- **localStorage** persistence (all data survives reload).
- **Seeded demo data** – 3 activities + 3 requests (so confirmation/review is testable immediately).

### Seed demo data
- Mesyuarat Pengurusan UMS – 20/09/2026 09:00–11:00 – Confirmed (Ahmad bin Ali, Perasmi).
- Program Universiti – 21/09/2026 14:00–16:00 – Confirmed (Siti Aminah, Panel).
- Seminar Pemantapan Pengurusan – 22/09/2026 10:00–12:00 – **Pending** (Muhammad Hakim, Panel).
- Fake existing schedules: Ahmad bin Ali 09:00–10:00; Siti Aminah 14:00–16:00.
- Calendar also includes Tentative / Hold / Cancelled sample entries.

---

## 3. Verification

- Performed `node --check` on `script.js` (syntax OK, Node v24.20.0).
- Built and ran a temporary **headless DOM smoke test** (stubbed DOM + localStorage in Node) that drove the entire workflow. **36 checks all passed**, including:
  - All views render without errors.
  - Create activity → add officer → conflict detected (Wajib) → submit disabled.
  - Tukar Masa → change time → conflict cleared → green confirmation.
  - Submit → PENDING APPROVAL → go to PA/NC review → approve → request confirmed, calendar entry added, notification created.
  - Seeded pending request → reject → REJECTED + rejection message.
- The temporary test harness was deleted after testing.

---

## 4. How to Use

1. Open `index.html` in any browser (double-click).
2. Full demo path:
   Create Activity → Select Category → Select Officer + Role + Wajib/Pilihan → Semak Ketersediaan (find conflict / avoid it) → Hantar Permohonan Kehadiran → Pergi ke Semakan PA/NC → Lulus / Tolak → view Officer Calendar + Notification.
3. Demo conflict tip: schedule an activity **09:00–11:00** and add **Ahmad bin Ali** → conflict. Change time to **10:30–12:00** → conflict cleared.
4. Use **Simulate Role** dropdown (top-right) to switch Urusetia / PA / NC / Admin.

---

## 5. Notes
- No backend, no database: all state lives in `localStorage`. *(Sesi 1: kunci `kalora_db_v1`; kini dikemas kini kepada `kalora_db_v2` — lihat Bahagian 6.)* To reset the demo, clear browser site data (or the seed data is reloaded only when empty).
- Roles work purely by UI simulation; there is no real authentication.

---

## 6. Sesi 2 — Modul Pengurusan Venue (Venue Management Module)

### 6.1 Perbualan

**User:** *What did we do so far?*

**Assistant:** Menyemak semula keadaan kerja dan mendapati modul Pengurusan Venue telahpun dilaksanakan separa dalam sesi terdahulu (storage v2 + migrasi, seed venue, helper CRUD, modal HTML, CSS, routing, pengesahan konflik, kalendar venue). Mengesahkan semua fail, kemudian meneruskan kerja pengesahan.

**Assistant — kerja pengesahan yang dijalankan:**
1. Menulis ujian asap `smoke-venue.js` (stub DOM + localStorage dalam Node) untuk memacu logik tanpa pelayar.
2. Menulis `smoke-venue2.js` — 42–43 kes meliputi migrasi, CRUD, sekatan, dan paparan.
3. **Menjumpai dan membaiki satu bug sebenar:**
   - `venueSuggestionHtml` menghantar nilai **minit** (nombor) terus ke `fmtTime()` yang menjangka string `'HH:MM'` → `TypeError: t.split is not a function`.
   - Baikan di `script.js` (~L551): `fmtTime(fromMin(s.s))` / `fmtTime(fromMin(s.e))`.
4. Menambah CTA dashboard: **Pengurusan Venue** (Admin) dan **Kalendar Venue** (Urusetia/PA).
5. Mengemas kini hint modal venue supaya tepat (venue penyelenggaraan *masih* kelihatan dalam dropdown tetapi tempahan disekat).
6. Menjalankan pemeriksaan integriti teks (tiada token rosak) dan pemeriksaan fungsi duplikat.

**Hasil:** `node --check` OK · kedua-dua suite ujian lulus tanpa kegagalan (`smoke-venue.js` logik + `smoke-venue2.js` **43/43**) · tiada fungsi duplikat.

### 6.2 Apa yang direkodkan tentang modul ini

**Storage**
| Kunci | Guna |
|---|---|
| `kalora_db_v2` | Kunci semasa — semua data venue/aktiviti/tempahan. |
| `kalora_db_v1` | Fallback baca-sahaja; dimigrasikan secara automatik ke v2. |

**Status tempahan yang menghalang slot venue:** `menunggu` (Pending) dan `disahkan` (Confirmed).

**4 venue di-seed:**
| ID | Nama | Kod | Kapasiti | Status |
|---|---|---|---|---|
| `ven_1` | Dewan Canselor UMS | DCU | 3000 pax | Aktif |
| `ven_2` | Bilik Mesyuarat Utama (JAFPIB) | BMU-JAFPIB | 30 pax | Aktif |
| `ven_3` | Dewan Kuliah Pusat 1 (DKP 1) | DKP1 | 200 pax | Aktif |
| `ven_4` | Auditorium FKJ | AUD-FKJ | 150 pax | Dalam Penyelenggaraan |

**Ciri utama**
- **CRUD venue (Admin)** – halaman Pengurusan Venue, modal tambah/edit, kod venue unik (dinormalisasi huruf besar), fasiliti dipisah dengan koma, status toggle.
- **Sekatan penghapusan** – venue dengan tempahan Pending/Confirmed tidak boleh dihapus; mesej mencadangkan status *Dalam Penyelenggaraan*.
- **Dropdown lokasi** dalam *Daftar Aktiviti* ditukar kepada venue rasmi dinamik.
- **Ketersediaan langsung** (hijau/merah/amber) semasa borang diisi; butang *Tukar Venue* / *Tukar Masa* + cadangan venue & slot masa alternatif.
- **Sekatan penghantaran** – `Submit Disabled` apabila venue dalam penyelenggaraan **atau** slot bertindih (pengesakan nama aktiviti + tarikh + masa; aktiviti sedia ada dikecualikan semasa edit).
- **Kalendar Venue** – paparan harian (tempahan + slot kosong boleh klik) dan mingguan (grid jam 08:00–23:00), penapis venue/tarikh/mod.
- **Pengauditan** – semua CRUD/status/logik disekat direkod dalam Audit Log.

**Bilangan fungsi dalam `script.js`:** 115 (sebelum penggabungan kalendar).

---

## 7. Sesi 3 — Menggabungkan Officer Calendar + Venue Calendar

### 7.1 Perbualan

**User:** *is it possible to combine the "officer calendar" and "venue calendar" into 1 page?*

**Assistant (baca-sahaja):** Kajian menunjukkan kedua-dua paparan berada dalam fungsi berasingan dan berbeza model data:

| | Officer Calendar (`rCalendar`) | Venue Calendar (`rVenueCalendar`) |
|---|---|---|
| Sumber data | `state.calendar` (entri kelulusan) | `state.activities` (tempahan venue) |
| Status | Tentative / Hold / Confirmed / Cancelled | menunggu / disahkan |
| Susun atur | Senarai agenda ikut tarikh | Grid mingguan / senarai harian |
| Penapis | Pegawai | Venue, tarikh, mod |

Fakta penting: entri kelulusan **sudah menyimpan `venueId`**, tetapi entri seed `c1`–`c8` **tiada `venueId`** dan ada yang sengaja bertindih (dua pegawai pada masa sama) — jadi penggabungan penuh memerlukan fallback `venueByName()` dan pemetaan status.

**Assistant menyoal 5 keputusan. Jawapan user:**

| Soalan | Jawapan |
|---|---|
| Bentuk penyatuan? | **Tab / satu pautan, dua paparan** (risiko rendah, kedua-dua fungsi kekal) |
| Menu sedia ada? | **Ganti dengan satu menu** (route lama dijadikan alias) |
| Akses Admin? | **Tidak** — kekal Urusetia/PA sahaja |
| Tab lalai sidebar? | **Sentiasa mula dengan tab Pegawai** |
| Label menu/tab? | **English** — `Calendar`, `Officer Calendar`, `Venue Calendar` |

**User:** *continue* → pelan dibentangkan, disahkan, dan dilaksanakan (lihat 7.2).

### 7.2 Pelaksanaan

| # | Sasaran | Tindakan |
|---|---|---|
| 1 | `script.js` NAVS + `VIEW_TITLES` | Satu entri `{id:'calendar', label:'Calendar'}` untuk Urusetia & PA; buang `venue-calendar`; `VIEW_TITLES.calendar = 'Calendar'`; `NAVS.admin` kekal tanpa kalendar. |
| 2 | `show()` (router) | Alias: `view === 'venue-calendar'` → `view = 'calendar'` + `calMode: 'venue'`. |
| 3 | `renderContent()` | `case 'calendar'` → `rCalendarPage()`; buang `case 'venue-calendar'`. |
| 4 | Fungsi baharu `rCalendarPage()` | Header card "Calendar" + butang segmen `Officer Calendar` \| `Venue Calendar` (guna `aria-pressed`), kemudian delegasi ke sub-paparan sedia ada. |
| 5 | Fungsi baharu `showVenueCalendar(params)` | Pintasan yang menggantikan 8 panggilan `show('venue-calendar', …)`. |
| 6 | Tajuk sub-paparan | `<h2>` → `<h3>`: *Officer Schedule* dan *Venue Schedule* (elak tajuk ganda; 18px > 16px). |
| 7 | Tapak panggilan | CTA dashboard (1 link sahaja), `go-venue-calendar`, `venue-filter-cal`, prev/next/today, filter pegawai/venue/mode/tarikh — semua kini menyatakan `calMode`. |
| 8 | Aksi baharu `cal-tab` | `show('calendar', Object.assign({}, viewParams, { calMode: args.mode }))` — konteks tab tidak hilang semasa bertukar. |
| 9 | `style.css` `.cal-tabs` | Kapsul `--blue-50`, tab aktif putih + `box-shadow`. |

**Yang TIDAK diubah:** logik `rCalendar()`, logik `rVenueCalendar()`, `venueCalCtx`, `daysHeadHtml` / `rowsBodyHtml` / `venueDayPanel`, `pick-slot`, `NAVS.admin`, semua CRUD venue.

### 7.3 Pengesahan (Sesi 3)

- `node --check script.js` → **OK**; **118 fungsi**, tiada duplikat.
- `smoke-calendar.js` (baharu) → **57/57 lulus**, meliputi:
  - NAVS: tepat satu `calendar`, tiada `venue-calendar`, Admin kekal tanpa kalendar.
  - Tab lalai = *Officer Calendar*; `pageTitle` = `Calendar`; tiada tajuk ganda.
  - Penukaran tab: penapis & sub-tajuk bertukar betul.
  - Alias route: `show('venue-calendar')` mendarat ke `view === 'calendar'` + `calMode:'venue'` + semua argumen dibawa.
  - `showVenueCalendar()`, filter pegawai, CTA dashboard, tiada rujukan route lama tinggal.
- `smoke-venue2.js` → **43/43 lulus** (regresi modul venue + butang *Lihat Kalendar Venue* muncul semasa konflik).
- Pemeriksaan integriti token → tiada teks rosak.

### 7.4 Keputusan reka bentuk yang perlu diingat
- Sidebar `data-nav` hanya menghantar string (tiada parameter) → klik menu `Calendar` sentiasa membuka tab **Officer Calendar**, seperti yang diminta.
- Route/aksi lama `venue-calendar` dan `go-venue-calendar` dikekalkan sebagai alias supaya mana-mana pautan lama tetap berfungsi.
- Tab aktif dinyatakan dengan `aria-pressed` (butang biasa, bukan widget `role="tab"` penuh).

---

## 8. Sesi 4 — Dua Paparan untuk Kalendar Pegawai (Agenda + Grid)

### 8.1 Perbualan

**User:** *read what we've done so far first from the TestFormConverse.md*

**Assistant (baca-sahaja):** Membaca `TestFormConverse.md` (254 baris) dan meringkaskan 3 sesi terdahulu: (1) asas KALORA frontend-only + aliran kelulusan PA/NC, (2) Modul Pengurusan Venue (storage v2, CRUD, sekatan, kalendar venue), (3) penggabungan tab Officer/Venue di bawah satu halaman `Calendar`.

**User:** *in the officer calendar, i want it to have 2 way of views: 1. like the current, 2. like the real calendar (as in the venue calendar)*

**Assistant (kajian read-only):** Menyemak `rCalendar()` (senarai agenda sahaja, tiada grid), `rVenueCalendar()` (grid mingguan/harian `vgrid`), bentuk data `state.calendar` (`date/start/end/title/officer/status`; entri benih `c1`–`c8` tiada `venueId`), CSS `.vgrid`/`.vslot`, dan pengendalian event sedia ada.

**Assistant (soalan reka bentuk):**

| Soalan | Jawapan |
|---|---|
| Skop grid? | **Weekly + Daily modes** (seperti venue: Paparan Mingguan/Harian) |
| Letak toggle? | **Di dalam Officer view** — bersebelahan tajuk "Officer Schedule"; tab atas kekal Officer \| Venue sahaja |

**Assistant:** Bentang pelan: kunci `viewParams` baharu (`calView`, `calGridMode`, `calDate`), fungsi grid baharu, event `cal-view`/`oc-*`, CSS `.obook`, ujian `smoke-ocal.js`, kemas kini fail ini.

**User:** *proceed* → pelan dilaksanakan (lihat 8.2).

**User:** *save our conversation in TestFormConverse.md pls* → transkrip sesi ini direkodkan dalam bahagian ini.

### 8.2 Pelaksanaan

**`viewParams` baharu** (nilai default mengekalkan tingkah laku lama):

| Kunci | Nilai | Default |
|---|---|---|
| `calView` | `list` \| `grid` | `list` (Agenda — sama seperti sebelum ini) |
| `calGridMode` | `harian` \| `mingguan` | `mingguan` |
| `calDate` | ISO tarikh | `todayISO()` |

Kunci berasingan daripada `calMode` (tab Officer/Venue) supaya pertukaran tab tidak berlanggar dengan `mode`/`date` milik kalendar venue.

**`script.js` (118 → 126 fungsi):**

| Fungsi | Peranan |
|---|---|
| `rCalendar()` (ubah suai) | Cabang mengikut `calView`; header kini ada butang segmen `Agenda` \| `Calendar` (gaya `.cal-tabs`, aksi `cal-view`, `aria-pressed`) + penapis pegawai; toolbar grid dimasukkan dalam kad yang sama |
| `officerEntryHtml(e)` | Dipecah daripada `rCalendar()` — satu blok entri senarai (kod tidak dipendek dua kali) |
| `officerAgendaHtml(entries)` | Paparan Agenda lama (kumpul ikut tarikh) |
| `officerCalTools()` | Toolbar: select Harian/Mingguan, input tarikh, `‹` / Hari Ini / `›` |
| `officerGridBody(entries)` | Badan grid: mingguan = jadual 7 hari; harian = jadual 1 hari (kelas `one-day`) + kad Agenda hari tersebut; amaran "Tiada entri" jika tiada entri *untuk paparan dipaparkan* |
| `officerDaysHeadHtml(days, entries)` | Kepala hari (Isnin–Ahad, naik hari semasa, kiraan entri per hari) |
| `officerRowsBodyHtml(days, entries)` | Baris jam 08:00–23:00 (guna `VENUE_HOURS`); entri `state.calendar` diletak sebagai blok `.obook.<status>` + `.cont` untuk sambungan; sel kosong **tidak** boleh diklik (tiada `pick-slot`) |
| `shiftOfficerCal(dir)` | Prev/next: ±7 hari (mingguan) atau ±1 hari (harian); gabung semua `viewParams` sedia ada |

**Tindakan/events:**
- `cal-view` → tukar `calView` (gabung `Object.assign({}, viewParams, …)`).
- `oc-prev` / `oc-next` / `oc-today` → navigasi tarikh grid pegawai.
- Change: `#selOfficerCalMode`, `#inOfficerCalDate`.
- **Baikan serentak:** `#selOfficerFilter` dahulu membina params dari kosong (`{calMode, officer}`) → kini `Object.assign({}, viewParams, {officer})` supaya mod grid/tarikh **tidak hilang** apabila tukar penapis pegawai.

**`style.css`:** blok `.obook` (padanan `.vslot-book` untuk entri pegawai) + status: `.tentative` kelabu, `.hold` amber, `.confirmed` hijau, `.cancelled` merah + strikethrough; `.obook.cont` bergaris sambungan; `.vgrid.one-day { min-width:320px }` untuk mod harian.

**Yang TIDAK diubah:** `rCalendarPage()`, tab Officer/Venue, logik `rVenueCalendar()` + `venueCalCtx`, alias route, `NAVS`, CRUD venue, semua CSS grid venue.

### 8.3 Pengesahan (Sesi 4)

- `node --check script.js` → **OK**; **126 fungsi**, tiada duplikat.
- `smoke-ocal.js` (baharu; stub DOM + localStorage dalam Node) → **63/63 lulus**, meliputi:
  - Lalai = Agenda (`aria-pressed` betul, tiada grid/toolbar).
  - Toggle ke Grid: toolbar, navigasi, grid mingguan 15×7 sel, amaran tarikh kosong.
  - Penempatan entri benih: blok mula + sambungan `.cont`, kiraan entri per hari, tooltip.
  - Penapis pegawai dalam grid (regresi: `calView` tidak hilang).
  - Kelas status `tentative`/`hold`/`cancelled`, mod Harian (1 lajur + kad agenda).
  - Navigasi: harian ±1 hari, mingguan ±7 hari, Hari Ini.
  - Pertukaran tab Venue ↔ Officer (grid kekal), kembali ke Agenda.
  - Integriti sumber: 126 fungsi, 0 duplikat.
- Nota: suite lama (`smoke-calendar.js`, `smoke-venue2.js`) telah dipadam pada sesi sebelumnya dan tidak disimpan; regresi venue dicover secara langsung dalam bahagian 9 ujian baharu.

### 8.4 Keputusan reka bentuk
- Klik menu sidebar `Calendar` (tanpa params) → kembali ke **Agenda** (default), bukan grid — konsisten dengan default tab Officer.
- Mod grid adalah paparan **read-only** — sel kosong tidak klikable (berbeza dengan grid venue yang membawa kepada pendaftaran aktiviti).
- Nama tindakan grid pegawai dieja `oc-*` (`oc-prev`, `oc-next`, `oc-today`) untuk berbeza daripada tindakan grid venue `cal-*`.

---

## 9. Sesi 5 — Paparan Bulanan (Monthly) untuk Officer Schedule

### 9.1 Perbualan

**User:** *can you add monthly filter for the officer schedule pls. make it: green - if that day is free from activities; orange - many activities; red - full of activities (compact)*

**Assistant (kajian read-only):** Mengesahkan tiada mod bulanan wujud; navigasi grid pegawai hanya Harian/Mingguan melalui `#selOfficerCalMode`, `#inOfficerCalDate` (`<input type="date">`), dan `shiftOfficerCal()` (±1/±7 hari). Hari semasa ditanda kelas `today` (CSS `.vgrid th.vday.today`), dan kiraan entri per hari hanya teks (`vday-n`). Data benih `c1`–`c8` (Sep 2026): 3 entri pada **20/09**, 1 entri pada 21/22/23/24/09, dan c8 (**26/09**) berstatus **Cancelled**.

**Assistant (soalan reka bentuk):**

| Soalan | Jawapan |
|---|---|
| Ambang warna hari? | **0 = hijau (Percuma) · 1–2 = oren (Sederhana) · 3+ = merah (Penuh)** |
| Klik sel hari? | **Ya — drill-down ke mod Harian hari tersebut** |

**User:** *0 green / 1-2 orange / 3+ red* dan *Yes, drill down* → pelan dibentangkan, kemudian *continue* → dilaksanakan (lihat 9.2).

**User:** *save our latest conversation in TestFormConverse.md pls* → transkrip sesi ini direkodkan dalam bahagian ini.

### 9.2 Pelaksanaan

**`script.js` (126 → 129 fungsi):**

| Fungsi | Peranan |
|---|---|
| `addMonths(iso, n)` (baharu) | Alihkan tarikh ISO ±n bulan; hari dikekalkan tetapi di-clamp ke hujung bulan sasaran (elak 31 → 1/3 dsb). |
| `officerCalTools()` (ubah) | Pilihan mod bertambah **`Paparan Bulanan`** (`selOfficerCalMode`). Dalam mod bulanan, input tarikh diganti dengan `<input type="month" id="inOfficerCalMonth" value="YYYY-MM">`. |
| `officerGridBody()` (ubah) | Cabang: jika `calGridMode === 'bulanan'` → serahkan kepada `officerMonthBody()` (skip jadual jam + agenda). |
| `officerMonthBody(entries, date)` (baharu) | Grid 7 lajur (Isnin–Ahad seiring `weekDays`): penyorong kosong ikut hari pertama bulan, satu sel setiap hari, sel pelengkap di hujung. Sel = `<button class="mday free\|busy\|full[ today]" data-act="oc-day">` dengan nombor hari + label (`Percuma` / `n entri`). Legenda (Percuma/Sederhana/Penuh) di atas grid. |
| `shiftOfficerCal()` (ubah) | Mod bulanan → `addMonths(d, ±1)`; Harian/Mingguan kekal ±1/±7 hari. |

Kiraan kesibukan hari di `officerMonthBody()`: `entries.filter(e => e.date === iso && e.status !== 'Cancelled').length` — entri **Cancelled tidak dikira** (tidak mengisi jadual pegawai).

**Tindakan/events:**
- `oc-day` (baharu) → `show('calendar', Object.assign({}, viewParams, { calGridMode: 'harian', calDate: args.date }))` — klik hari bulanan membuka mod Harian hari itu (+ kad Agenda).
- Change: `#inOfficerCalMonth` → `calGridMode: 'bulanan'` + `calDate: value + '-01'` (simpan konteks penapis/pegawai sedia ada).

**`style.css`:** `.month-grid` (grid 7 lajur `repeat(7, minmax(0,1fr))`), `.mday-h` (kepala Isnin–Ahad), `.mday` (butang sel, hover ring, klik), `.mday.blank` (sel pelengkap), `.mday.free` (hijau `--green-*`), `.mday.busy` (oren `--amber-*`), `.mday.full` (merah `--red-*`), `.mday.today` (outline biru `--blue-500`), dan `.month-legend` + ikon `.dot`.

**Yang TIDAK diubah:** tab Officer/Venue, logik Agenda `rCalendar()`, grid Harian/Mingguan sedia ada, `rVenueCalendar()`, alias route, `NAVS`.

### 9.3 Pengesahan (Sesi 5)

- `node --check` (via smoke test memuatkan `script.js`) → **OK**; **129 fungsi**, 0 duplikat.
- `smoke-ocal.js` (dikemas kini) → **79/79 lulus** (63 kes lama + 16 kes baharu bahagian 8b), meliputi:
  - Pilihan `Paparan Bulanan`, input bulan (`type="month"`) dengan nilai `2026-09`, tiada input tarikh harian dalam mod bulanan.
  - Grid bulanan dirender (>20 sel), sel kosong pelengkap, kepala Isnin–Ahad.
  - Warna mengikut kiraan: **`mday full`** (20/09 = 3 entri), **`mday busy`** (hari 1–2 entri), **`mday free`** (hari tanpa entri — termasuk 26/09 kerana c8 Cancelled dikecualikan).
  - Navigasi bulan: `oc-prev` = tolak 1 bulan (2026-08), `oc-next` = tambah 1 bulan (kembali ke 2026-09).
  - **Drill-down:** `fireAct('oc-day', {date:'2026-09-20'})` → mod Harian (input tarikh kembali, `Jadual Harian`, grid `one-day`).
  - Regresi 63 kes lama (Agenda/Grid/Harian/Mingguan/tab Venue) kekal lulus.

### 9.4 Keputusan reka bentuk
- Mod bulanan **read-only** (serasi dengan grid pegawai sedia ada); interaksi satu-satunya ialah klik hari untuk drill-down ke mod Harian.
- Entri **Cancelled tidak dikira** sebagai kesibukan — ia tidak mengisi masa pegawai.
- State bulan dikekalkan melalui `calDate` (hujung `'YYYY-MM-DD'`); `addMonths` memastikan tarikh jangkar sentiasa sah (hari di-clamp).
- Sel `mday` ialah `<button>` sebenar dengan `data-act="oc-day"` supaya ujian `fireAct()` dapat memacunya tanpa pelayar.

## 10. Sesi 6 - Tambah Aktiviti Peribadi + Skop Kalendar Pegawai

**Tarikh:** 13–14 Oct 2026
**Tugas:** Menambah 'Tambah Aktiviti Peribadi' untuk pegawai/PA di kalendar, skopkan paparan kalendar kepada profil pegawai semasa, dan pastikan conflict detection membaca entri baharu.

### 10.1 Pelaksanaan

**`script.js` (129 → 132 fungsi; 3 fungsi sedia ada dibaiki):**

| Fungsi / Sasaran | Peranan |
|---|---|
| `state.currentOfficer` (baharu, state) | Nama profil pegawai semasa (persona). Lalai = pegawai pertama dalam `state.officers`. Dipersist dalam `localStorage`. |
| `renderChrome()` (ubah) | Mengisi `#officerSelect` dengan senarai pegawai dan menanda pilihan semasa; `#officerSimWrap` disembunyikan untuk Admin. |
| `rCalendar()` (ubah) | Lalai penapis = `state.currentOfficer` apabila peranan `pa` (paparan peribadi); `'semua'` untuk Urusetia (tingkah laku lama dikekalkan). Pegawai semasa sentiasa dimasukkan dalam dropdown walaupun tiada entri. |
| `openOfficerActModal()` / `closeOfficerActModal()` (baiki) | Sintaks rosak (`\officerActModal`) dibaiki kepada `$('officerActModal')`; prefill tarikh, tetapkan `#oaUntukPegawai`. |
| `handleOfficerActivitySubmit()` (baiki) | Simpan entri ke `state.calendar` dengan `officer: state.currentOfficer`, `role: 'Peribadi'`, `status: 'Confirmed'`, `personal: true`, `venue: lokasi`; turut disimpan ke `localStorage`. |
| `checkAvailability()` (ubah) | Selepas `FAKE_SCHEDULES`, turut mengimbas `state.calendar` (peserta sama, tarikh sama, tidak `Cancelled`) supaya aktiviti peribadi dikesan sebagai konflik. |

**Tindakan/events:**
- `cal-view`/`oc-*`/`oc-day` kekal; lalai penapis peribadi bagi `pa` kekal kerana semua handler menggabung `Object.assign({}, viewParams, …)`.
- Aksi baharu `open-officer-act` → `openOfficerActModal()`.
- `#officerSelect` change → tetapkan `state.currentOfficer`; jika dalam halaman kalendar & peranan `pa`, papar semula ditapis kepada pegawai tersebut.
- Modal aktiviti peribadi: backdrop click, butang X, Batal, submit `#formOfficerAct`, dan `Escape` (wiring selari dengan modal venue).

**`index.html`:**
- Bar atas ditambah selektor persona **Simulate Officer** (`#officerSimWrap` > `#officerSelect`).
- Modal `#officerActModal` dikemas struktur (satu baris → HTML berformat) + medan baca-sahaja **Untuk Pegawai (Profil Semasa)** (`#oaUntukPegawai`).

**Yang TIDAK diubah:** tab Officer/Venue, mod Agenda/Harian/Mingguan/Bulanan, `rVenueCalendar()` + `venueCalCtx`, CRUD venue, alur PA/NC, `NAVS`.

### 10.2 Pengesahan (Sesi 6)

- `node --check script.js` → **OK**.
- `smoke-ocal.js` (dikemas kini) → **87/87 lulus** (79 kes lama + 8 kes baharu):
  - Modal aktiviti peribadi dibuka, memaparkan pegawai semasa, ditutup selepas simpan.
  - Entri peribadi dirender (`Peranan: Peribadi`).
  - Skop peribadi role PA: hanya entri pegawai semasa; penapis lalai = pegawai semasa.
  - Integriti sumber: **132 fungsi**, 0 duplikat.

### 10.3 Keputusan reka bentuk
- Persona pegawai disimulasikan (`Simulate Officer`) kerana prototaip tiada pengesahan identiti sebenar.
- Skop peribadi lalai digunakan untuk peranan **PA** sahaja; Urusetia kekal melihat semua pegawai (elak regresi).
- Aktiviti peribadi berstatus **Confirmed** terus dikira sebagai *busy slot* dan dibaca oleh `checkAvailability()`.

### 10.4 Penambahbaikan susulan (satu halaman, dua skop)
Permintaan: Urusetia buang "Simulate Officer"; halaman officer/PA buang pilihan "Pegawai" di Officer Schedule.

| Sasaran | Tindakan |
|---|---|
| `renderChrome()` | `#officerSimWrap` (Simulate Officer) dipaparkan **hanya** untuk peranan `pa`; tersembunyi untuk Urusetia & Admin. |
| `rCalendar()` | Butang **+ Tambah Jadual / Aktiviti Peribadi** dipaparkan **hanya** pada halaman officer/PA. |
| `rCalendar()` | Pilihan **Pegawai** (`#selOfficerFilter`) dipaparkan **hanya** pada halaman Urusetia (urusetia boleh tapis semua pegawai); dibuang pada halaman officer/PA (paparan peribadi). |

Rasional: halaman officer/PA = paparan peribadi (persona ditetapkan melalui Simulate Officer), jadi penapis Pegawai berlebihan. Halaman Urusetia = paparan pengurusan, jadi penapis Pegawai dikekalkan tetapi Simulate Officer dibuang.

`smoke-ocal.js` → **91/91 lulus** (penambahan 4 kes: Simulate Officer tersembunyi & butang peribadi tiada pada Urusetia; Simulate Officer muncul & pilihan Pegawai tiada pada officer/PA).


