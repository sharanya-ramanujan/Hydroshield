import React, { useMemo } from 'react'
import { toLonLat } from 'ol/proj'
import { getDistance } from 'ol/sphere'

function centroidLonLat(geojson) {
  const ring = geojson?.geometry?.coordinates?.[0]
  if (!ring?.length) return null
  let sx = 0, sy = 0
  for (const [lon, lat] of ring) { sx += lon; sy += lat }
  return [sx / ring.length, sy / ring.length]
}

export default function ScenarioPanel({
  lands = [],
  simTimeHr,
  setSimTimeHr,
  maxTimeHr = 72,
  playing,
  setPlaying,
  scenarioActive,
  setScenarioActive,
  scenarioCenter3857,
  fireRadiusKm,
  onPickOrigin
}) {
  const centerLonLat = useMemo(
    () => (scenarioCenter3857 ? toLonLat(scenarioCenter3857) : null),
    [scenarioCenter3857]
  )

  const results = useMemo(() => {
    if (!centerLonLat || !fireRadiusKm) return []
    return lands.map(l => {
      const c = centroidLonLat(l.geometry)
      if (!c) return { id: l.id, name: l.name || 'Untitled', distanceKm: null, impacted: false }
      const km = getDistance(centerLonLat, c) / 1000
      return { id: l.id, name: l.name || 'Untitled', distanceKm: km, impacted: km <= fireRadiusKm }
    })
  }, [lands, centerLonLat, fireRadiusKm])

  const impacted = results.filter(r => r.impacted).length

  return (
    <div className="panel" style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <h3 style={{ margin:0 }}>Wildfire scenario</h3>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button
          type="button"
          onClick={onPickOrigin}
          style={{ fontSize:12 }}
        >
          Pick fire origin
        </button>
        <button
          type="button"
          onClick={() => { setSimTimeHr(0); setPlaying(false); setScenarioActive(false) }}
          style={{ fontSize:12 }}
        >
          Reset
        </button>
      </div>

      <label style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:12, color:'var(--muted)' }}>Time progression</span>
        <strong>{simTimeHr.toFixed(1)} h</strong>
        <input
          type="range"
          min="0"
          max={maxTimeHr}
          step="0.1"
          value={simTimeHr}
          onChange={(e) => {
            setScenarioActive(true)
            setSimTimeHr(Number(e.target.value))
          }}
          style={{ gridColumn:'1 / -1' }}
        />
      </label>

      <div className="muted" style={{ fontSize:12 }}>
        {centerLonLat
          ? `Center: ${centerLonLat[1].toFixed(3)}, ${centerLonLat[0].toFixed(3)} · Radius: ${fireRadiusKm.toFixed(1)} km`
          : 'Pick an origin to begin'}
      </div>

      <div style={{ fontSize:12, background:'#0f172a', border:'1px solid #1e293b', borderRadius:8, padding:'8px' }}>
        <div>Impacted farms: {impacted} / {lands.length}</div>
      </div>

      {results.length > 0 && (
        <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:6, maxHeight:180, overflow:'auto' }}>
          {results.map(r => (
            <li key={r.id} style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
              <span style={{ fontSize:12 }}>
                {r.distanceKm == null ? '—' : `${r.distanceKm.toFixed(1)} km`} · {r.impacted ? 'Impacted' : 'Safe'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}