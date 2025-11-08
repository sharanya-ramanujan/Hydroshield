# HydroShield (frontend)

React + Vite app for mapping farms and collecting basic irrigation inputs.

Features
- Draw farm boundaries on a map (OpenLayers + OSM).
- Save farms by name; list and delete saved polygons.
- Areas shown in acres.
- Optional quick buttons to capture:
  - Irrigation zones (name, area in acres; “Whole farm” quick add)
  - Tank capacity (liters/gallons, approximate toggle)
  - Pump type & flow (L/min)
  - Battery & solar specs (kW, kWh, inverter efficiency)
  - Soil type

Tech
- React 18 + Vite
- OpenLayers
- Vanilla CSS

Prerequisites
- Node.js 18+ and npm 9+

Check versions:
```bash
node -v
npm -v
```

Run locally (development)
```bash
npm install
npm run dev
# open the URL shown (typically http://localhost:5173)
# hard reload if needed: Cmd+Shift+R (macOS)
```

Build and preview (production)
```bash
npm run build
npm run preview
```

Using the app
1) Home: click “Enter App”.
2) Map: click to draw polygon, double‑click to finish.
3) Save: enter a name and click “Save Farm”.
4) Manage: view/delete saved polygons; area shows in acres.

Troubleshooting
- White screen: open DevTools console (Cmd+Option+J) and fix any import/export errors, then hard‑reload.
- Map blank: ensure `import 'ol/ol.css'` is present in map components and you have internet for OSM tiles.
- Centered landing page: ensure this CSS exists:
  ```
  html, body, #root { height: 100%; margin: 0; }
  .home-page {
    min-height: 100vh; display: flex; flex-direction: column;
    justify-content: center; align-items: center; text-align: center; padding: 2rem;
  }
  ```

Notes
- Map tiles © OpenStreetMap contributors.
- Data is in-memory only (no backend).
