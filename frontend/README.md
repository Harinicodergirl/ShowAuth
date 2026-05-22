# ShadowAuth React Frontend

Banking UI built with React around the existing `tracking.js` hook.

## Stack

- React 18 (functional components + JSX)
- React Router
- Parcel (simple bundler, no Vite/Next.js)
- `styles.css` — fintech theme

## Tracking

`tracking.js` is **not modified**. It is imported in `src/App.jsx`:

```js
import useTracking from "../tracking";
```

`useTracking()` runs once at the app root so keyboard/mouse telemetry and `/predict` API calls work on every page.

## Run locally

```bash
# Terminal 1 — Flask backend
cd ../backend && python app.py

# Terminal 2 — Frontend
cd frontend
npm install
npm start
```

Open http://localhost:8080

## Routes

| Path | Page |
|------|------|
| `/login` | Login |
| `/dashboard` | Banking dashboard |
| `/transfer` | Transfer money |

## Build for production

```bash
npm run build
```

Output: `dist/` — serve with Flask or any static host.
