import React, { useMemo, useState, useEffect } from 'react'
import { getArea } from 'ol/sphere'
import Polygon from 'ol/geom/Polygon'
import { fromLonLat } from 'ol/proj'

const pumpTypes = ['Electric-grid', 'Solar-assisted', 'Diesel generator', 'Gravity-fed']
const crops = ['Vineyard', 'Orchard', 'Pasture', 'Vegetable', 'Fallow', 'Other']
const times = ['Morning', 'Evening', 'Night', 'Manual on-demand']
const soilTypes = ['Sandy', 'Loam', 'Clay', 'Mixed']

function computeAcres(feature) {
  const coords = feature?.geometry?.coordinates?.[0]
  if (!coords) return 0
  try {
    const ring3857 = coords.map(([lon, lat]) => fromLonLat([lon, lat]))
    const poly = new Polygon([ring3857])
    return getArea(poly) / 4046.8564224
  } catch { return 0 }
}

export default function QuickFarmDataButtons({ lands = [], activeLandId, detailsByLand = {}, onUpdate }) {
  const [localActiveId, setLocalActiveId] = useState(activeLandId || lands[0]?.id || null)
  useEffect(() => {
    if (activeLandId) setLocalActiveId(activeLandId)
    else if (!localActiveId && lands[0]) setLocalActiveId(lands[0].id)
  }, [activeLandId, lands])

  const land = lands.find(l => l.id === localActiveId)
  if (!land) {
    return (
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Farm inputs</h3>
        <div className="muted" style={{ fontSize: 12 }}>Save a farm polygon to enable inputs.</div>
      </div>
    )
  }

  const acres = useMemo(() => computeAcres(land.geometry), [land])
  const details = detailsByLand[land.id] || {
    zones: [],
    tanks: [],
    pump: { type: '', flowLpm: '' },
    batterySolar: { solarKw: '', batteryKwh: '', inverterEffPct: '' },
    soilType: ''
  }

  const push = (patch) => onUpdate && onUpdate(land.id, patch)
  const setZones = (zones) => push({ zones })
  const setTanks = (tanks) => push({ tanks })

  return (
    <div className="panel" style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <h3 style={{ margin:0 }}>Farm inputs</h3>

      {lands.length > 1 && (
        <select
          value={localActiveId}
          onChange={e => setLocalActiveId(Number(e.target.value))}
          style={{ fontSize:12 }}
        >
          {lands.map(l => <option key={l.id} value={l.id}>{l.name || 'Untitled'}</option>)}
        </select>
      )}

      <div className="muted" style={{ fontSize:12 }}>
        {land.name || 'Untitled'} · {acres ? acres.toFixed(2) : '—'} ac
      </div>

      <section>
        <strong style={{ fontSize:12 }}>Zones</strong>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
          <button
            type="button"
            className="primary-btn"
            style={{ fontSize:11 }}
            onClick={() => {
              const name = prompt('Zone name?') || `Zone ${details.zones.length + 1}`
              const area = prompt('Area (acres)?') || ''
              setZones([
                ...details.zones,
                { id: Date.now(), name, areaAcres: area ? Number(area) : '', crop: '', times: [], minutesPerDay: '', iDontKnow: false }
              ])
            }}
          >Add zone</button>
          <button
            type="button"
            className="primary-btn"
            style={{ fontSize:11 }}
            onClick={() => {
              setZones([{
                id: Date.now(), name: 'Whole farm', areaAcres: Number(acres.toFixed(2)),
                crop: '', times: [], minutesPerDay: '', iDontKnow: false
              }])
            }}
          >Whole farm</button>
          <button
            type="button"
            style={{ fontSize:11 }}
            onClick={() => {
              if (!details.zones.length) return alert('Add a zone first.')
              const last = details.zones.at(-1)
              const crop = prompt(`Crop for ${last.name}? (${crops.join(', ')})`) || ''
              setZones(details.zones.map(z => z.id === last.id ? { ...z, crop } : z))
            }}
          >Set crop</button>
          <button
            type="button"
            style={{ fontSize:11 }}
            onClick={() => {
              if (!details.zones.length) return alert('Add a zone first.')
              const minutes = prompt('Minutes/day (number) or blank') || ''
              const schedule = prompt(`Times? comma list: ${times.join(', ')}`) || ''
              const list = schedule.split(',').map(s => s.trim()).filter(s => times.includes(s))
              setZones(details.zones.map(z => ({ ...z, minutesPerDay: minutes || '', times: list, iDontKnow: !minutes })))
            }}
          >Schedule</button>
        </div>
      </section>

      <section>
        <strong style={{ fontSize:12 }}>Tanks</strong>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
          <button
            type="button"
            className="primary-btn"
            style={{ fontSize:11 }}
            onClick={() => {
              const cap = prompt('Tank capacity?') || ''
              if (!cap) return
              const unit = prompt('Unit (liters/gallons)?', 'liters') || 'liters'
              const approximate = confirm('Approximate? OK=yes, Cancel=no')
              setTanks([
                ...details.tanks,
                { id: Date.now(), capacity: Number(cap), unit, approximate, photoName: '' }
              ])
            }}
          >Add tank</button>
        </div>
      </section>

      <section>
        <strong style={{ fontSize:12 }}>Pump</strong>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
          <button
            type="button"
            className="primary-btn"
            style={{ fontSize:11 }}
            onClick={() => {
              const type = prompt(`Pump type? (${pumpTypes.join(', ')})`) || ''
              const flow = prompt('Pump flow (L/min), optional') || ''
              push({ pump: { type, flowLpm: flow } })
            }}
          >Set pump</button>
        </div>
      </section>

      <section>
        <strong style={{ fontSize:12 }}>Battery & solar</strong>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
          <button
            type="button"
            style={{ fontSize:11 }}
            onClick={() => {
              const solarKw = prompt('Solar kW?') || ''
              const batteryKwh = prompt('Battery kWh?') || ''
              const inverterEffPct = prompt('Inverter efficiency %?') || ''
              push({ batterySolar: { solarKw, batteryKwh, inverterEffPct } })
            }}
          >Set specs</button>
          <button
            type="button"
            style={{ fontSize:11 }}
            onClick={() => {
              const panels = prompt('Number of panels?') || ''
              if (!panels) return
              const solarKw = (Number(panels) * 0.4).toFixed(1)
              push({ batterySolar: { ...(details.batterySolar || {}), solarKw } })
            }}
          >I have X panels</button>
        </div>
      </section>

      <section>
        <strong style={{ fontSize:12 }}>Soil</strong>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
          <button
            type="button"
            className="primary-btn"
            style={{ fontSize:11 }}
            onClick={() => {
              const soil = prompt(`Soil? (${soilTypes.join(', ')})`) || ''
              push({ soilType: soil })
            }}
          >Set soil</button>
        </div>
      </section>

      <div style={{ fontSize:11, background:'#0f172a', padding:'6px 8px', borderRadius:6, border:'1px solid #1e293b' }}>
        <div>Zones: {details.zones.length}</div>
        <div>Tanks: {details.tanks.length}</div>
        <div>Pump: {details.pump.type || '—'}</div>
        <div>Soil: {details.soilType || '—'}</div>
      </div>
    </div>
  )
}