import React, { useEffect, useMemo, useState } from 'react'
import GeoJSON from 'ol/format/GeoJSON'
import { getArea } from 'ol/sphere'
import Polygon from 'ol/geom/Polygon'
import { fromLonLat } from 'ol/proj'

const crops = ['Vineyard', 'Orchard', 'Pasture', 'Vegetable', 'Fallow', 'Other']
const times = ['Morning', 'Evening', 'Night', 'Manual on-demand']
const soilTypes = ['Sandy', 'Loam', 'Clay', 'Mixed']
const pumpTypes = ['Electric-grid', 'Solar-assisted', 'Diesel generator', 'Gravity-fed']

function computeFarmArea(polygonGeoJSON) {
  if (!polygonGeoJSON?.geometry?.coordinates?.[0]) return { ha: 0, acres: 0 }
  try {
    // Convert lon/lat ring to projected coords then compute area
    const coords = polygonGeoJSON.geometry.coordinates[0]
    const ring3857 = coords.map(([lon, lat]) => fromLonLat([lon, lat]))
    const poly = new Polygon([ring3857])
    const m2 = getArea(poly)
    return { ha: m2 / 10000, acres: m2 / 4046.8564224 }
  } catch {
    return { ha: 0, acres: 0 }
  }
}

export default function FarmDetailsForm({ polygonGeoJSON, value, onChange }) {
  const farmArea = useMemo(() => computeFarmArea(polygonGeoJSON), [polygonGeoJSON])

  const [data, setData] = useState(() => value || {
    zones: [], // [{id,name,area,unit,crop,times,minutesPerDay,iDontKnow}]
    tanks: [], // [{id,capacity,unit,approximate,photoName}]
    pump: { type: '', flowLpm: '' },
    batterySolar: { solarKw: '', batteryKwh: '', inverterEffPct: '' },
    soilType: ''
  })

  useEffect(() => { onChange && onChange(data) }, [data, onChange])

  // Helpers
  const update = (patch) => setData((d) => ({ ...d, ...patch }))
  const updateZone = (id, patch) =>
    setData((d) => ({ ...d, zones: d.zones.map(z => z.id === id ? { ...z, ...patch } : z) }))
  const addZone = () => setData(d => ({
    ...d,
    zones: [...d.zones, { id: Date.now(), name: `Zone ${d.zones.length + 1}`, area: '', unit: 'acres', crop: '', times: [], minutesPerDay: '', iDontKnow: false }]
  }))
  const quickAddOneZone = (unit = 'acres') => {
    const area = unit === 'acres' ? farmArea.acres : farmArea.ha
    setData(d => ({
      ...d,
      zones: [{ id: Date.now(), name: 'Whole farm', area: Number(area.toFixed(2)), unit, crop: '', times: [], minutesPerDay: '', iDontKnow: false }]
    }))
  }
  const removeZone = (id) => setData(d => ({ ...d, zones: d.zones.filter(z => z.id !== id) }))

  const updateTank = (id, patch) =>
    setData((d) => ({ ...d, tanks: d.tanks.map(t => t.id === id ? { ...t, ...patch } : t) }))
  const addTank = () => setData(d => ({
    ...d,
    tanks: [...d.tanks, { id: Date.now(), capacity: '', unit: 'liters', approximate: false, photoName: '' }]
  }))
  const removeTank = (id) => setData(d => ({ ...d, tanks: d.tanks.filter(t => t.id !== id) }))

  const requiredOk =
    data.zones.length > 0 &&
    data.zones.every(z => z.name && Number(z.area) > 0 && z.unit && (z.iDontKnow || Number(z.minutesPerDay) >= 0)) &&
    data.tanks.length > 0 &&
    data.tanks.every(t => Number(t.capacity) > 0) &&
    data.pump.type

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0 }}>Farm details</h3>

      <div className="muted" style={{ marginTop: -8 }}>
        Farm area: {farmArea.acres.toFixed(2)} acres ({farmArea.ha.toFixed(2)} ha)
      </div>

      {/* Irrigation zones */}
      <section>
        <h4 style={{ margin: '0 0 0.5rem' }}>Irrigation zones (required)</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <button type="button" className="primary-btn" onClick={addZone}>Add zone</button>
          <button type="button" className="primary-btn" onClick={() => quickAddOneZone('acres')}>Quick add: 1 zone = whole farm (acres)</button>
          <button type="button" className="primary-btn" onClick={() => quickAddOneZone('ha')}>Quick add: 1 zone = whole farm (ha)</button>
        </div>
        {data.zones.length === 0 && <div className="warning-text">Add at least one zone.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.zones.map((z) => (
            <div key={z.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px', gap: 8, alignItems: 'center' }}>
                <input placeholder="Zone name" value={z.name} onChange={e => updateZone(z.id, { name: e.target.value })} />
                <input placeholder="Area" type="number" min="0" step="0.01" value={z.area} onChange={e => updateZone(z.id, { area: e.target.value })} />
                <select value={z.unit} onChange={e => updateZone(z.id, { unit: e.target.value })}>
                  <option value="acres">acres</option>
                  <option value="ha">ha</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8, marginTop: 8 }}>
                <select value={z.crop} onChange={e => updateZone(z.id, { crop: e.target.value })}>
                  <option value="">Primary crop (required)</option>
                  {crops.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Minutes/day (approx)" type="number" min="0" step="1" value={z.minutesPerDay} onChange={e => updateZone(z.id, { minutesPerDay: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {times.map(t => (
                  <label key={t} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={z.times.includes(t)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const next = checked ? [...z.times, t] : z.times.filter(x => x !== t)
                        updateZone(z.id, { times: next })
                      }}
                    />
                    <span>{t}</span>
                  </label>
                ))}
                <label style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={z.iDontKnow} onChange={(e) => updateZone(z.id, { iDontKnow: e.target.checked })} />
                  <span>I don’t know</span>
                </label>
              </div>

              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <button type="button" onClick={() => removeZone(z.id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
                  Remove zone
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tanks */}
      <section>
        <h4 style={{ margin: '0 0 0.5rem' }}>Tank capacity (required)</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" className="primary-btn" onClick={addTank}>Add tank</button>
        </div>
        {data.tanks.length === 0 && <div className="warning-text">Add at least one tank.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.tanks.map(t => (
            <div key={t.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 1fr', gap: 8 }}>
                <input type="number" min="0" step="1" placeholder="Capacity" value={t.capacity} onChange={e => updateTank(t.id, { capacity: e.target.value })} />
                <select value={t.unit} onChange={e => updateTank(t.id, { unit: e.target.value })}>
                  <option value="liters">liters</option>
                  <option value="gallons">gallons</option>
                </select>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={t.approximate} onChange={e => updateTank(t.id, { approximate: e.target.checked })} />
                  <span>Approximate</span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <label style={{ color: 'var(--muted)', fontSize: 12 }}>
                  Photo (optional): <input type="file" accept="image/*" onChange={e => updateTank(t.id, { photoName: e.target.files?.[0]?.name || '' })} />
                </label>
                <button type="button" onClick={() => removeTank(t.id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
                  Remove tank
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pump */}
      <section>
        <h4 style={{ margin: '0 0 0.5rem' }}>Pump type & power source (required)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 8 }}>
          <select value={data.pump.type} onChange={e => update({ pump: { ...data.pump, type: e.target.value } })}>
            <option value="">Select pump</option>
            {pumpTypes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="number" min="0" step="1" placeholder="Pump flow (L/min, optional)" value={data.pump.flowLpm} onChange={e => update({ pump: { ...data.pump, flowLpm: e.target.value } })} />
        </div>
      </section>

      {/* Battery & Solar */}
      <section>
        <h4 style={{ margin: '0 0 0.5rem' }}>Battery & solar (recommended)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <input type="number" min="0" step="0.1" placeholder="Solar kW (peak)" value={data.batterySolar.solarKw} onChange={e => update({ batterySolar: { ...data.batterySolar, solarKw: e.target.value } })} />
          <input type="number" min="0" step="0.1" placeholder="Battery kWh (storage)" value={data.batterySolar.batteryKwh} onChange={e => update({ batterySolar: { ...data.batterySolar, batteryKwh: e.target.value } })} />
          <input type="number" min="0" max="100" step="1" placeholder="Inverter efficiency %" value={data.batterySolar.inverterEffPct} onChange={e => update({ batterySolar: { ...data.batterySolar, inverterEffPct: e.target.value } })} />
        </div>
      </section>

      {/* Soil */}
      <section>
        <h4 style={{ margin: '0 0 0.5rem' }}>Soil type (recommended)</h4>
        <select value={data.soilType} onChange={e => update({ soilType: e.target.value })}>
          <option value="">Select soil</option>
          {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </section>

      {!requiredOk && (
        <div className="warning-text">
          Required: at least 1 zone (name + area), at least 1 tank (capacity), and a pump type.
        </div>
      )}
    </div>
  )
}