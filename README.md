# HydroShield

Interactive farm resilience planner: map your farm, define irrigation assets (zones, tanks, pump, energy, soil), and generate wildfire irrigation continuity guidance with optional AI assessment.

## Features
- Farm drawing & multiple land parcels (OpenLayers, EPSG:3857)
- Irrigation zone management (name, area, crop, schedule)
- Tank inventory (capacity, units, approximate flag, photo placeholder)
- Pump & energy inputs (type, flow, solar, battery, inverter efficiency)
- Soil type selection
- Wildfire risk heuristic (0–100 preparedness score) + AI assessment (OpenAI Chat Completion)
- Scenario tools (fire radius, time simulation) (map code intact)
- Persistent localStorage for farm + setup data

## Tech Stack
React (Vite), OpenLayers, CSS, JavaScript, Supabase

## Directory Structure (key parts)
```
aquashield-frontend/
  src/
    components/ (FarmInfoPanel, WildfireRiskPanel, map + forms)
    pages/ (HomePage, MapPage, AuthPage, FarmEditorPage)
    context/ (AuthProvider)
    lib/ (supabaseClient.js)
  public/ (HydroShieldLogo.png)
.github/workflows/deploy-pages.yml
```

## Getting Started
Prerequisites: Node 20+, npm.

```
cd aquashield-frontend
npm install
npm run dev
```

## Build
```
cd aquashield-frontend
npm run build
```

## Deployment (GitHub Pages via Actions)
1. Ensure `vite.config.js` has: `base: '/<repo-name>/'`
2. Workflow `.github/workflows/deploy-pages.yml` builds `aquashield-frontend/dist`.
3. Push to `main`; Actions → verify green deploy.
4. Pages URL: `https://<username>.github.io/<repo-name>/`

Manual check before deploy:
```
npm run build
npx serve dist
```

---
