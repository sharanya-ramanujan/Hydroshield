# HydroShield

Monorepo root for the HydroShield project.

Frontend (React + Vite)
- Code: ./aquashield-frontend
- Features:
  - Draw farm boundaries on a map (OpenLayers + OSM)
  - Save farms; list and delete saved polygons
  - Areas shown in acres
  - Optional quick buttons for zones, tanks, pump, battery/solar, soil

Quick start
```bash
cd aquashield-frontend
npm install
npm run dev
# open the URL shown (usually http://localhost:5173)
```

Build & preview
```bash
cd aquashield-frontend
npm run build
npm run preview
```

Troubleshooting
- White screen: open DevTools console and fix any import/export errors, then hard‑reload (Cmd+Shift+R).
- Map blank: ensure `import 'ol/ol.css'` is present and you have internet for OSM tiles.

More docs
- Frontend README: [aquashield-frontend/README.md](./aquashield-frontend/README.md)