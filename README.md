# Pera: personal net worth tracker (PWA)

Tracks how much you have in each bank, e-wallet and cash account and adds it up into one net worth number in Philippine pesos. Everything is stored **on your device** (IndexedDB). There is no backend, no login, no bank connection, no API key and no external service. It works fully offline once installed.

Stack: Next.js (App Router, static export) · TypeScript · Tailwind CSS · Framer Motion · Dexie (IndexedDB) · custom SVG charts · hand-written service worker.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000 (service worker is disabled in dev)
npm test             # unit tests (net worth, daily change, month-end series, export/import)
npm run build        # generates icons + manifest, then a static export in ./out
npm start            # serves ./out so you can test the installed/offline behaviour
```

`npm run build` runs `scripts/generate-icons.mjs` first, which redraws the logo, all PNG icons, the iOS launch images and `public/manifest.webmanifest` from `app.config.json`. The Google font (Plus Jakarta Sans) is downloaded at build time and self-hosted, so the build needs internet access once; the running app needs none.

## Deploy on Vercel

1. Push this folder to a GitHub repo.
2. In Vercel choose **Add New → Project**, import the repo and click **Deploy**. No settings are needed: Vercel detects Next.js and the static export.
3. Open the `https://…vercel.app` URL on your phone. HTTPS is required for installing the app and for the service worker.

## Install on your phone

**iPhone (Safari only):** open the site in Safari → tap **Share** → **Add to Home Screen** → **Add**. Launch it from the new icon.

**Android (Chrome):** open the site → tap the **⋮** menu → **Install app** (or **Add to Home screen**).

After the first launch the app is cached and works with no connection.

## Your data lives only on the device

- Data is stored in the browser's IndexedDB for this site. Deleting the app, clearing Safari/Chrome site data, or (on iOS) leaving the app unused for a long time can erase it. The app asks the browser for persistent storage to reduce that risk, but this is not a guarantee.
- The installed app and the same site opened in Safari/Chrome have **separate** storage on iOS. Pick one and stick with it.
- **Back up regularly:** Settings → Export backup (JSON for a full backup, CSV for spreadsheets). The app reminds you if you haven't exported for 30 days. Restore with Settings → Import from JSON.
- The optional PIN lock is a screen lock only. It does not encrypt the stored data. **Face ID is not available to web apps**, so a PIN is the only lock option.

## Change the app name and colors

Everything lives in [`app.config.json`](app.config.json):

| Key | Used for |
| --- | --- |
| `name`, `shortName`, `description` | In-app header and splash, page title, manifest, iOS launch images |
| `themeColor`, `backgroundColor` | Manifest colors (Android status bar and launch screen), splash gradient |
| `brandLight`, `brandDark` | Gradient of the generated app icon |

After editing, run `npm run build` (or `npm run icons`) to regenerate the icons, launch images and manifest. The in-app color theme (background gradient, cards, light/dark palettes) is a set of CSS variables at the top of [`src/app/globals.css`](src/app/globals.css). If you rename the app, also bump `VERSION` in [`public/sw.js`](public/sw.js) so phones drop the old cache.

The logo is a simple geometric mark (three rising bars and a coin ring) defined in [`src/components/Logo.tsx`](src/components/Logo.tsx) and mirrored in `scripts/generate-icons.mjs`. Change both if you redraw it.

## How it works

- **Money** is stored as integer centavos and formatted with `Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })`.
- **Accounts** have a type (Bank, E-wallet, Cash, Investment, Credit card, Loan). Credit cards and loans are liabilities and are subtracted. For a liability you enter the amount you owe.
- Every balance update is a new history entry. An account's current balance is its latest entry. Removing an account asks whether to keep its history.
- **Expenses:** logging an expense lowers the balance of the account you paid from (a credit card or loan goes up instead, because you owe more). It is stored as a normal history entry, so net worth, history and charts update automatically. Removing an expense puts the money back. **Day change** compares with the previous day's closing total, or with the total before the latest update if nothing was recorded on an earlier day.
- **Service worker** (`public/sw.js`): on install it caches the app shell and the hashed assets the page references; static assets are cache-first, pages are stale-while-revalidate.
- Bank logos live in `assets/bank-logos` (originals). `npm run logos` turns them into uniform tiles in `public/logos`. BPI, BDO and Cash have no logo file, so they use a colored monogram badge. To add one, drop the file in `assets/bank-logos`, add an entry in `scripts/prepare-logos.mjs` and a `logo` field on its preset in `src/lib/presets.ts`.

## Project layout

```
app.config.json            name + colors (single source of truth)
scripts/generate-icons.mjs logo/icons/splash/manifest generator
public/sw.js               service worker
src/lib/                   money, net worth math, Dexie db, export/import, PIN
src/components/            screens, sheets, charts, onboarding, splash, lock
tests/                     vitest unit tests
```

## Screenshots

`screenshots/` has iPhone 13 captures (1170x2532) of every screen in `light/` and `dark/`, plus `overview-light.png` and `overview-dark.png` (four screens side by side) for a portfolio. They use demo data only. The folder is outside `public/`, so it is not deployed with the app.
