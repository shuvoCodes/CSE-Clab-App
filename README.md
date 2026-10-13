# Class Routine

An offline-first Expo and React Native app named **HUB CSE Club**, based on the six-screen design in [`Resources/Class Routine App.pdf`](./Resources/Class%20Routine%20App.pdf) and the feature brief in [`Resources/README.md`](./Resources/README.md). It includes Setup, Home, Routine, Rooms, Teachers, Rules, and a Settings screen for Light/Dark theme control.

## Run locally

Install Node.js LTS, then run:

```bash
npm install
npm start
```

Use Expo Go or an Android emulator from the Expo development server. To produce an Android JavaScript bundle and check the app imports:

```bash
npm run check
```

## Build an Android APK

The app is linked to the Expo project `@shuvocodes/hub-cse-club`. Build an installable APK with the configured EAS preview profile:

```bash
npx eas-cli build --platform android --profile preview
```

EAS manages the Android signing credentials for this project. Keep them unchanged for future releases so Android can install new versions over the existing app.

## Included now

- Five-tab floating navigation and the six designed app screens, with Plus Jakarta Sans bundled for offline use.
- First-launch semester/batch setup and locally persisted settings.
- Light and Dark themes selectable from the gear button on the main screens.
- The Fall 2026 routine extracted from the supplied timetable PDF: Saturday–Wednesday, five periods, batches 24th–31st, sections, rooms, and enrolled-only classes.
- Course titles from the semester course lists in the supplied `OBECSE.pdf`, plus teacher names and room references from the routine.
- Both source PDFs bundled locally for offline reference.
- Device-local PDF selection and temporary storage. An AI/parser endpoint is still required to analyze and import newly selected routines.
- A HUB CSE Club launcher icon and splash-screen logo.
- Mandatory version checks against `update.json` in the GitHub repository when internet is available. If offline, the installed version remains usable and is checked again when connectivity returns.

## Integration notes

The Question Bank link is configured to the supplied HUB CSE Question Bank website. The handbook does not list a title for CSE481, so the app marks that title as unavailable instead of guessing. Selecting a new routine PDF stores it temporarily; it does not replace the current timetable until an analysis endpoint and validation flow are configured.

## Publishing a required app update

The app reads `update.json` from the GitHub repository's `main` branch. For every release:

1. Increase `expo.version` in `app.json`.
2. Build a new Android APK using the same Android application ID and signing credentials as the previous APK.
3. Publish the APK in a GitHub Release.
4. Update `latestVersion` in `update.json` to match `expo.version`, then publish that manifest on `main`.

Once online, any installed app with a lower version than `latestVersion` is blocked at launch and sent to the GitHub Releases page. Offline launch remains available; the app checks again when internet returns. Keep the APK download accessible from Releases and retain the same signing key so Android can install it as an update without uninstalling the app.
