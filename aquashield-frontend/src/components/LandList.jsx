import React from 'react'
import { getArea } from 'ol/sphere'
import { fromLonLat } from 'ol/proj'
import Polygon from 'ol/geom/Polygon'

function computeAreaAcres(geojson) {
  if (!geojson || geojson.type !== 'Feature') return 0
  const coords = geojson.geometry?.coordinates?.[0]
  if (!coords) return 0
  try {
    const ring = coords.map(([lon, lat]) => fromLonLat([lon, lat]))
    const poly = new Polygon([ring])
    const m2 = getArea(poly)
    return m2 / 4046.8564224
  } catch {
    return 0
  }
}

export default function LandList({ lands = [], onDelete }) {
  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Saved Farms</h3>
      {lands.length === 0 && <div className="muted">None yet.</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display:'flex', flexDirection:'column', gap:8 }}>
        {lands.map(land => {
          const acres = computeAreaAcres(land.geometry)
          return (
            <li
              key={land.id}
              style={{
                display:'grid',
                gridTemplateColumns:'1fr auto auto',
                alignItems:'center',
                gap:12,
                padding:'8px 12px',
                background:'#111827',
                border:'1px solid #1e293b',
                borderRadius:12
              }}
            >
              <span
                style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}
                title={land.name || 'Untitled'}
              >
                {land.name || 'Untitled'}
              </span>
              <span
                style={{
                  fontSize:12,
                  padding:'3px 10px',
                  background:'#0f172a',
                  border:'1px solid #1e293b',
                  borderRadius:999
                }}
                title={acres > 0 ? `${acres.toFixed(2)} acres` : 'No area'}
              >
                {acres > 0 ? `${acres.toFixed(2)} ac` : '—'}
              </span>
              <button
                aria-label="Delete farm"
                title="Delete"
                onClick={() => onDelete && onDelete(land.id)}
                style={{
                  width:30,
                  height:30,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  borderRadius:'50%',
                  border:'1px solid #334155',
                  background:'rgba(255,255,255,0.05)',
                  color:'#e2e8f0',
                  cursor:'pointer',
                  fontSize:16,
                  lineHeight:1,
                  padding:0,
                  transition:'background 120ms,border-color 120ms'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#dc2626'
                  e.currentTarget.style.borderColor = '#dc2626'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = '#334155'
                }}
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
