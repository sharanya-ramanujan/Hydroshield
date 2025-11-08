import React from 'react'
import { getArea } from 'ol/sphere'
import GeoJSON from 'ol/format/GeoJSON'
import { fromLonLat } from 'ol/proj'
import Polygon from 'ol/geom/Polygon'

function computeAreaHa(geojson) {
  if (!geojson) return 0
  if (geojson.type !== 'Feature') return 0
  const coords = geojson.geometry.coordinates
  if (!coords) return 0
  // Convert lon/lat ring to projected coordinates (approx)
  const ring = coords[0].map(([lon, lat]) => fromLonLat([lon, lat]))
  const poly = new Polygon([ring])
  const m2 = getArea(poly)
  return m2 / 10000 // hectares
}

const LandList = ({ lands }) => {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Lands</h3>
      {lands.length === 0 && (
        <div className="muted">No lands saved yet.</div>
      )}
      <ul className="land-list">
        {lands.map(l => {
          const areaHa = computeAreaHa(l.geometry)
          return (
            <li key={l.id} className="land-item">
              <div className="land-title">{l.name || 'Unnamed'}</div>
              <div className="land-meta">
                {areaHa > 0 ? areaHa.toFixed(2) + ' ha' : '—'}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default LandList
