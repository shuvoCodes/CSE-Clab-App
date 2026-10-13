# Class Routine – Offline Android App

An offline Android app built with **React Native and Expo** for viewing class routines, rooms, teachers and campus rules. The app implements the six designed screens (Setup, Home, Routine, Rooms, Teachers, Rules), adds the requested Light/Dark theme control in Settings, and uses a floating bottom navigation bar.

The app works without a remote database. Course data and the Fall 2026 routine extracted from the supplied PDFs are bundled with the app. A newly selected routine is saved temporarily; analyzing it and importing replacement timetable data are not implemented.

> **Development status:** The supplied Fall 2026 timetable and `OBECSE.pdf` are bundled as offline references, and their routine/course data is included in `assets/data`. A selected new PDF is copied to local temporary storage, but analyzing it and replacing the bundled timetable are not implemented. The UI has not yet been visually verified on an Android device against the design PDF.

The Android app is branded **HUB CSE Club**. When connected to the internet it checks the GitHub release manifest and requires old versions to update; offline use is allowed until the next online check.

---

## Table of Contents

1. [Features](#features)
2. [Screens](#screens)
3. [Design System](#design-system)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Components](#components)
7. [Data Files](#data-files)
8. [Real Routine PDF Format](#real-routine-pdf-format)
9. [Planned PDF Import](#planned-pdf-import)
10. [Semester Setting](#semester-setting-batch-stays-fixed)
11. [Data Storage](#data-storage)
12. [Offline Behaviour](#offline-behaviour)
13. [Installation](#installation)
14. [Build an Android APK](#build-an-android-apk)
15. [Testing Checklist](#testing-checklist)
16. [Limitations](#limitations)

---

## Features

### App features

- First-launch **Setup form**: choose Semester and Batch so the Home routine is set automatically. Bundled Fall 2026 batch/semester pairs are 24th/8th through 31st/1st.
- **Home**: shows only today's classes by date, and the class running right now under the greeting.
  - Before the first class: shows that classes have not started and when the first class begins.
  - After the last class: shows that classes are over for today.
  - If the batch has no class: shows `N/A`.
- **Routine**: full routine for the selected batch, with day tabs.
- **Rooms**: grid of rooms with live status. Rooms with a class right now are red (Busy), empty rooms are green (Free). Tapping a room shows that room's schedule for the selected day (batch, semester, teacher, subject). A day selector shows every class in that room for the chosen day, with `N/A` when there is none.
- **Teachers**: search the teachers and view Busy or Available status for the selected period on the current day. Tapping a teacher shows that teacher's routine for the day.
- **Rules**: rule cards loaded from a list/array, so new rules can be added later by editing data only.
- **Settings**: choose Light or Dark appearance; the selection is saved on the device and applied across every screen. Semester can also be updated here without changing the saved batch.
- **Question Bank** card on Home: opens the Question Bank website if the device is online, otherwise shows `Network not connected`.
- **Required updates**: online version checks block versions older than the version published in the GitHub update manifest. Offline use is allowed until connectivity returns.
- Routine can be viewed by day, batch or semester, for the current day/time or any other day.

### Upload new routine and semester features

- **Upload a new routine PDF**: the device picker copies a selected PDF to temporary app storage. Analysis, preview, validation, and timetable replacement are not implemented yet.
- **Update semester**: the user can change the semester in Settings. The batch number stays fixed after Setup. The selected batch's routine is available only with its Fall 2026 paired semester.

### Offline and storage features

- Routine/course data, rules, and the font are bundled with the app and available offline.
- Bundled `OBECSE.pdf` and `Class-Routine-Fall-2026.pdf` for offline reference.
- Course information stored in `courses.json`.
- Fall 2026 timetable entries extracted from the routine PDF and stored in `routine.json`.
- Select a new class-routine PDF from the device and copy it to temporary app storage. Parsing it and updating routine data are not implemented.
- Theme, batch, and semester settings are saved locally.
- No SQLite, Firebase, Supabase or remote database required.

---

## Screens

The design reference uses **390 × 844** phone artboards. The bottom navigation is a floating dark pill on every main screen except Setup. The order is Routine, Rooms, Home, Teachers, Rules.

| # | Screen | File | Summary |
|---|--------|------|---------|
| 1 | Setup | `App.js` (`SetupScreen`) | Welcome icon, semester grid, batch chips, Continue button. No bottom nav. |
| 2 | Home | `App.js` (`HomeScreen`) | Greeting card, current class card, today's classes, Question Bank card. |
| 3 | Routine | `App.js` (`RoutineScreen`) | Batch chips, day tabs (Sat–Wed), period cards. |
| 4 | Rooms | `App.js` (`RoomsScreen`) | Day selector, Busy/Free legend, room grid, selected-room schedule. |
| 5 | Teachers | `App.js` (`TeachersScreen`) | Search field, period chips, teacher cards with status pills. |
| 6 | Rules | `App.js` (`RulesScreen`) | Numbered rule cards. |
| 7 | Settings | `App.js` (`SettingsScreen`) | Opened from the gear button; choose Light or Dark theme and update semester without changing batch. |

### 1. Setup

- Icon tile: 56 px, radius 18, indigo `#5B4FE9`, white calendar icon.
- Title: "Set up your routine" (32 px, weight 800).
- Subtitle: "Pick once. Everything works offline."
- **Semester**: 4-column grid of chips (1st–8th). Default selected: 3rd.
- **Batch**: wrapping chips (Batch 24–31), paired with the semester in the bundled Fall 2026 routine. Default selected: Batch 29 / 3rd semester.
- Continue button: full width, height 56, radius 28, background `#1E1B3A`, white text.

### 2. Home

- **Greeting card**: solid indigo, radius 28, translucent white circle decoration (top right). Shows "Good morning", the time (38 px, 800) with AM/PM, and the day and date on the right (example: Tuesday, 13 Oct 2026).
- **Current class card**: 2 px indigo border. Chip "2nd period · Now", class start–end time, course code, room, course title (18 px), `ShortName: Teacher Name`.
- **Today's classes**: list of period rows. Past classes are shown at 55% opacity.
- **Question Bank card**: dark `#1E1B3A` card, "Opens website · needs internet", arrow icon.

### 3. Routine

- Header "Routine".
- Batch chips, horizontally scrollable (example: Batch 29 · 3rd, Batch 28 · 4th, Batch 27 · 5th).
- Day tabs: Sat, Sun, Mon, Tue, Wed (equal width).
- Caption "Full routine · Fall 2026".
- Period rows for 1st–5th.

### 4. Rooms

- Header "Rooms".
- Day selector chip (example: Tuesday with a chevron) and legend: red dot = Busy, green dot = Free.
- 3-column grid of room tiles, 64 px high, radius 18. Each tile shows the room number and a text label (Busy or Free), so status is not shown by color alone.
- Room detail card: room number, day chip, time range, batch and semester, course title, teacher, and `N/A` for free slots.

### 5. Teachers

- Header "Teachers".
- Search input: height 46, radius 23, white.
- Period chips 1st–5th (active: 2nd) and caption "Status at 2nd period · 10:45AM – 12:00PM".
- Teacher card: 44 px initials avatar, name, short name, status pill (`Busy · Room 304`, `Busy · Lab 2` or `Available`).

### 6. Rules

- Header "Rules" with subtitle "Campus & class rules".
- Rule card: numbered circle (28 px), title, description (line height 1.5).

---

## Design System

### Colors

The Light theme uses the reference palette below. The Dark theme keeps the same indigo accent, status colors, component shapes and spacing while switching backgrounds, cards, borders and text to accessible dark-surface colors. Select either theme from **Settings**; the choice is persisted locally and used on every screen.

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#F4F2FB` | Screen background |
| `surface` | `#FFFFFF` | Cards, inactive chips, search field |
| `ink` | `#1E1B3A` | Primary text, bottom nav, Continue button, Question Bank card |
| `muted` | `#6F6B99` | Secondary text, inactive chip text |
| `navIdle` | `#A9A5D6` | Inactive nav icons, light text on dark |
| `primary` | `#5B4FE9` | Active chip, active nav item, current-class border |
| `primaryTint` | `#EDEAFF` | Period badge, avatar background |
| `busyBg` / `busyText` | `#FFE9E7` / `#B42318` | Busy status |
| `freeBg` / `freeText` | `#E2F7EC` / `#17714A` | Free / Available status |
| `busyDot` / `freeDot` | `#E5483B` / `#2BB673` | Legend dots |

### Typography

Font: **Plus Jakarta Sans** (weights 500, 700, 800).

| Style | Size | Weight |
|-------|------|--------|
| Screen title | 28 | 800 |
| Setup title | 32 | 800 |
| Clock | 38 | 800 |
| Current class title | 18 | 700 |
| Body / bold label | 14 | 700 |
| Caption | 12 | 500 |
| Chip text | 13 | 700 |
| Period badge / pill | 11 | 700 |

### Shape and spacing

- Screen padding: 30 top, 20 left and right.
- Card: white, radius 20, padding 14 × 16, shadow `0 6px 20px rgba(91,79,233,.08)`.
- Gap between list items: 10.
- Chips: height 40, radius 20.
- Bottom nav: left/right 16, bottom 20, height 68, radius 34, background `#1E1B3A`. Items are 46 px tall. The active item shows its label on an indigo pill; inactive items show the icon only (each needs an accessibility label).
- Icons: 20 px stroke icons, stroke width 1.8, round caps and joins.

---

## Technology Stack

- React Native
- Expo
- JavaScript
- React Native components in `App.js` – screens and bottom navigation
- `expo-font` and `@expo-google-fonts/plus-jakarta-sans` – bundled font (works offline)
- `@expo/vector-icons` – icons
- `expo-document-picker` – choose a PDF file from the device
- `expo-file-system` – copy a selected PDF to temporary local storage
- `@react-native-community/netinfo` – detect network for the Question Bank card
- `expo-linking` – open the Question Bank website
- `@react-native-async-storage/async-storage` – remember the selected theme, semester, and batch
- PDF analysis service/parser – not yet implemented; see [Planned PDF Import](#planned-pdf-import)

---

## Project Structure

```text
Class Routine Project/
├── assets/
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash.png
│   ├── pdfs/
│   │   ├── OBECSE.pdf
│   │   └── Class-Routine-Fall-2026.pdf
│   └── data/
│       ├── courses.json
│       ├── routine.json
│       ├── rooms.json
│       ├── teachers.json
│       └── rules.json
├── App.js
├── updateChecker.js
├── update.json
├── app.json
├── package.json
└── README.md
```

Screen components and their shared UI helpers currently live in `App.js`; the timetable, course, room, teacher, and demo-rule data live in `assets/data`.

---

## Components

| Component | Used in | Purpose |
|-----------|---------|---------|
| `BottomNav` | Home, Routine, Rooms, Teachers, Rules | Floating pill navigation; active item shows its label. |
| `ScreenHeading`, `PageLayout` | Main screens | Heading, optional Settings control, and scrollable page content. |
| `Chip` | Setup, Routine, Settings, Teachers | Selectable chip (active = accent, inactive = surface). |
| `GreetingCard` | Home | Greeting, live time, day and date. |
| `PeriodRow` | Home, Routine, Rooms, Teachers | Period badge, title, code, section, teacher, time, and room. |
| `Card`, `EmptyCard` | Multiple screens | Shared card surface and empty-state presentation. |
| `IconButton` | Main screen headers | Settings button with accessibility label. |

---

## Data Files

### `assets/data/courses.json`

The supplied `OBECSE.pdf` is bundled at `assets/pdfs/OBECSE.pdf`. `courses.json` contains the 61 course code/title pairs from its semester-wise curriculum, using course codes without spaces.

```json
[
  { "courseCode": "ACT215", "courseTitle": "Financial and Managerial Accounting" },
  { "courseCode": "CSE112", "courseTitle": "Basic Computer Skills" }
]
```

The semester curriculum does not list CSE481, so routine entries for that code indicate that its title is not listed in the handbook. Bundled assets are read-only at runtime; to update them, change the source JSON and rebuild the app, or implement a separate local-file update feature.

### `assets/data/routine.json`

Contains 129 scheduled period entries and three Wednesday club-activity entries extracted from `assets/pdfs/Class-Routine-Fall-2026.pdf`. Multi-period classes have one entry per period. Each entry includes the day, period, start/end times, batch, semester, section, course, teacher code, room, and enrolled-only flag.

### `assets/data/rules.json`

Rules are stored as a list. Adding a new object to the array adds a new card on the Rules page.

```json
[
  { "id": 1, "title": "Demo rule", "text": "Replace this example with a campus rule by editing assets/data/rules.json." }
]
```

The app displays rules to everyone; there is no password or in-app rule editor. Replace the demo rule or add rules in sequence by editing this JSON file, then rebuild the app.

### `assets/data/teachers.json`

Contains the teacher names found in the routine's legend. Short codes absent from the legend are retained as names in the teacher list.

### `assets/data/rooms.json`

Contains the unique room labels extracted from the routine.

Teacher names and room numbers in `teachers.json` and `rooms.json` are taken from the supplied routine PDF. Teacher codes missing from its legend are shown as their short codes.

---

## Real Routine PDF Format

The app is built for the department routine PDF: **Hamdard University Bangladesh, Department of Computer Science and Engineering, Class Routine for FALL 2026**. Every routine PDF uploaded later is expected to have the same layout.

### Layout

- **Days:** Sat, Sun, Mon, Tue, Wed.
- **Rows:** one row per batch and semester, written as `24th / 8th`, `25th / 7th`, and so on down to `31st / 1st`. The 6th, 4th, 3rd, 2nd and 1st semesters are split into `Sec 1` and `Sec 2`.
- **Columns:** five class periods.

| Period | Start | End |
|--------|-------|-----|
| 1st | 09:30AM | 10:45AM |
| 2nd | 10:45AM | 12:00PM |
| 3rd | 12:00PM | 01:15PM |
| 4th | 02:00PM | 03:15PM |
| 5th | 03:15PM | 04:30PM |

There is a break between 01:15PM and 02:00PM. Times remain stored as `HH:MM` in the routine JSON and are formatted with AM/PM in the app.

- **Batch and semester pairs in Fall 2026:** 24th/8th, 25th/7th, 26th/6th, 27th/5th, 28th/4th, 29th/3rd, 30th/2nd, 31st/1st.
- **Class cell:** `COURSECODE: TEACHERCODE` on one line and `Room: NNN` on the next, for example `CSE421: MMH` and `Room: 137`. Course codes have no space.
- **Teacher legend:** a list at the bottom of the PDF maps each short code to a full name, for example `MMH: Md. Monowar Hossain`.

### Special cases present in the supplied routine

- A leading `*` (for example `*CSE469/471: MMH`) means the class is for enrolled students only, and the cell holds two course codes.
- The same class can span two consecutive periods (for example a lab or a merged cell). It should become one entry per period.
- When `Sec 1` and `Sec 2` share a merged cell, both sections have that class.
- Wednesday has a non-class entry, `Club Activities (6th, 7th and 8th Semesters)`, with no teacher or room.
- Plain text extraction scrambles this PDF. Batch labels split across lines and room text runs into the next cell, so its table layout had to be interpreted spatially during extraction.
- Some teacher codes in the grid are missing from the legend (MA, MAM, MMI, MJI, SS, JF, MH), and the legend repeats `NS`. For an unknown code the app shows the short code only and does not fail.
- The routine PDF has no course titles. Titles come from `courses.json`, which is built from `OBECSE.pdf`.

---

## Planned PDF Import

The following is a proposed design for a future import feature. The current app can select a routine PDF and copy it temporarily, but it does not analyze the PDF, preview extracted classes, or replace the bundled routine.

### Flow

1. The user taps **Upload new routine** and selects a PDF with `expo-document-picker`.
2. The app copies the PDF to a temporary local file. The current routine is not touched yet.
3. A future parser/service could analyze the PDF and return structured JSON in the routine schema (day, period, times, batch, semester, course, teacher, and room).
4. The app should validate the result and show a summary/preview for confirmation.
5. Only validated, confirmed data should replace the current routine.

### Recommended safety rules

- If analysis or validation fails, the existing routine stays unchanged and the user sees an error.
- The old files are kept as a backup until the new files are fully written, so an interrupted update can roll back.
- AI output is never saved without validation. Scanned or low-quality PDFs can produce mistakes, so the preview step lets the user check the result before it replaces the old data.

### Internet requirement

The current upload flow checks for an internet connection before opening the picker, but no analysis service is configured. A future hosted AI service would need internet during import; routine viewing remains offline.

### API key

Do not hard-code an AI API key inside the app, because anyone can extract it from the APK. Send the request through a small backend or proxy that holds the key, or use an on-device model if you prefer no network at all.

---

## Semester Setting (Batch Stays Fixed)

The user's identity in the app is the **batch number**, chosen once at Setup. It never changes. The **semester** changes as the student moves up.

- Settings are stored locally as `{ "batch": "27th", "semester": "5th", "theme": "light" }`.
- Settings lets the user change the semester to any value from 1st to 8th without changing the saved batch.
- The supplied Fall 2026 routine contains only the paired semester for each batch. Choosing a different semester can therefore result in `N/A` until timetable data for that batch/semester is added.

---

## Data Storage

The current routine and course data are bundled as read-only JSON assets in `assets/data`. Settings are stored with AsyncStorage. A selected PDF is copied to the app's `routine/pending-routine-<timestamp>.pdf`; it is not read as routine data.

The bundled routine entries use this shape:

```json
[
  {
    "day": "Sat",
    "period": "2nd",
    "startTime": "10:45",
    "endTime": "12:00",
    "batch": "24th",
    "semester": "8th",
    "section": null,
    "courseCode": "CSE421",
    "courseTitle": "Course title from handbook",
    "teacherShort": "MMH",
    "room": "137",
    "enrolledOnly": false
  }
]
```

This illustrates the timetable-entry shape; the bundled `assets/data/routine.json` contains the extracted Fall 2026 entries.

### Future replacement flow

Replacement and rollback are not implemented. If added, validation must happen before replacement, with backup or versioned storage to avoid losing the previous routine if an update is interrupted.

### Status logic

- **Room Busy**: any routine entry for that room whose day is today and whose start–end time contains the current time.
- **Teacher Busy**: any routine entry for that teacher with the same rule.
- **Current class (Home)**: the entry for the saved batch that contains the current time. If none: not started yet, next class time, finished for today, or `N/A` when the batch has no classes.

---

## PDF Parsing (Future Work)

`expo-document-picker` selects a PDF; it does **not** extract the PDF's text or table structure by itself.

A future compatible parser/service must handle layout-aware parsing (or OCR for scanned pages), validate all extracted fields, and preserve the existing routine if analysis fails.

---

## Offline Behaviour

- Course data is bundled with the app, and the font is bundled with the app (no Google Fonts request at runtime).
- Settings and temporarily selected PDFs are stored locally; the active timetable and handbook-derived data are bundled with the app.
- Routine search and display use the saved JSON without internet access.
- The Question Bank card needs internet; offline it shows `Network not connected`. Its website URL must be configured in `app.json`.
- No AI service is required for normal app startup or routine display. Importing a new routine is not yet implemented.
- Forced-update checks require internet; offline app use is permitted, and the check runs again when the connection returns.

---

## Publishing Required App Updates

The installed app checks `update.json` at `https://raw.githubusercontent.com/shuvoCodes/CSE-Clab-App/main/update.json`. The manifest contains the newest app version and GitHub Releases page URL. Keep this file published on the repository's `main` branch.

For each release:

1. Increase `expo.version` in `app.json`.
2. Build an APK with the existing Android package ID and the same Android signing credentials.
3. Publish the APK as an asset on a GitHub Release.
4. Set `latestVersion` in `update.json` to the same version and publish the manifest to `main`.

Existing online installs older than `latestVersion` are blocked and directed to the Releases page. Offline installs continue working until internet is available. Keep the signing key private and unchanged so Android can install each release over the previous version without uninstalling or losing app data.

**Data-loss note:** App-private files may be removed when the app is uninstalled or its data is cleared. Consider adding a manual export/backup option.

---

## Installation

Requirements: Node.js LTS, npm, an Expo-compatible environment, and an Android device or emulator.

```bash
npm install
npx expo start
```

From the repository root, install dependencies and start Expo. Follow the CLI instructions to open the app on a device or emulator. To check dependency compatibility and export the Android JavaScript bundle, run `npx expo-doctor` and `npm run check`.

---

## Build an Android APK

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Configure an APK profile in `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

Then run:

```bash
eas build --platform android --profile preview
```

Test the APK on a real Android device, including offline startup. Routine replacement cannot be tested until PDF analysis and import are implemented.

---

## Testing Checklist

- [ ] App opens without an internet connection.
- [ ] Setup form saves Semester and Batch and sets the Home routine.
- [ ] Course information loads from the bundled JSON.
- [ ] Home shows only today's classes and the current class.
- [ ] Home shows "not started", next class time, "finished" and `N/A` states correctly.
- [ ] Room tiles are red when busy and green when free for the current time.
- [ ] Room day selector shows that room's classes, with `N/A` for empty days.
- [ ] Teacher status and period filter work.
- [ ] Tapping a teacher shows that teacher's routine for the day.
- [ ] Question Bank opens the website online and shows `Network not connected` offline.
- [ ] Adding an item to `rules.json` adds a rule card.
- [ ] A user can select a PDF file.
- [ ] Uploading while offline shows `Network not connected`.
- [ ] Changing the semester updates Home and Routine while the batch number stays the same.
- [ ] The batch cannot be changed after Setup.
- [ ] The app displays the saved routine after restarting.
- [ ] The app is tested on a real Android device.
- [ ] A published GitHub update manifest blocks an older online app and opens the release page.
- [ ] Offline startup remains available, and the version check runs again when connectivity returns.
- [x] `npx expo-doctor` passes.
- [x] `npm run check` exports the Android JavaScript bundle, including both PDFs.

**Not testable until PDF import is implemented:**

- [ ] The parser/service analyzes a new routine PDF and returns valid structured data.
- [ ] A preview is shown before the new routine replaces the old one.
- [ ] Invalid PDFs do not overwrite the existing routine.
- [ ] A valid new routine replaces the old routine.
- [ ] PDF and JSON remain consistent after an interrupted update.

---

## Limitations

- Selecting a new PDF stores it temporarily; parsing, validation, preview, and routine replacement still need to be implemented.
- The Question Bank URL is configured in `app.json` to the supplied HUB CSE Question Bank website.
- `routine.json`, `courses.json`, teacher names and room numbers are extracted from the supplied Fall 2026 PDFs. Rules are still sample content and should be checked against your institution's current regulations.
- Teacher cards and the Rooms day selector are implemented as in-screen interactions.
- CSE481 appears on the timetable but has no matching title in the supplied course handbook; its title is marked as unavailable rather than guessed.
- Semester and theme can be changed in Settings. A different semester will show `N/A` if there is no bundled routine for that batch/semester pair.
- The interface has not yet been visually verified on an Android device against the supplied design PDF.
- GitHub Releases version enforcement requires `update.json` and an APK release to be published to the configured repository.
- There is no cloud sync or automatic backup because the app does not use a remote database.

---

## License

Add a license file if you plan to publish or share this project publicly.
