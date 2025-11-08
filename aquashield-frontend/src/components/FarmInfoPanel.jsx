import React, { useEffect, useMemo, useState } from 'react'
import GeoJSON from 'ol/format/GeoJSON'
import { getArea as getSphericalArea } from 'ol/sphere'

const acresPerM2 = 0.00024710538146717

function focusedFarmAreaAcres(lands = [], focusLandId) {
  try {
    const fmt = new GeoJSON()
    const land =
      lands.find(l => l.id === focusLandId) ||
      (lands.length === 1 ? lands[0] : null)
    if (!land?.geometry) return null
    const feat = fmt.readFeature(land.geometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    })
    const m2 = getSphericalArea(feat.getGeometry(), { projection: 'EPSG:3857' })
    if (!isFinite(m2) || m2 <= 0) return null
    return +(m2 * acresPerM2).toFixed(2)
  } catch {
    return null
  }
}

const cropOptions = ['Vineyard', 'Orchard', 'Pasture', 'Vegetable', 'Fallow', 'Other']
const scheduleOptions = ['Morning', 'Evening', 'Night', 'Manual on-demand']
const pumpTypes = ['Electric-grid', 'Solar-assisted', 'Diesel generator', 'Gravity-fed']
const soilTypes = ['Sandy', 'Loam', 'Clay', 'Mixed']

export default function FarmInfoPanel({ lands = [], focusLandId, onChange }) {
  const defaultState = useMemo(
    () => ({
      zones: [],
      tanks: [],
      pump: { type: 'Electric-grid', flowLpm: '' },
      energy: { solarKW: '', batteryKWh: '', inverterEff: '' },
      soilType: ''
    }),
    []
  )

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem('hs:farmInfo')
      return raw ? JSON.parse(raw) : defaultState
    } catch {
      return defaultState
    }
  })

  // Persist and bubble up
  useEffect(() => {
    try { localStorage.setItem('hs:farmInfo', JSON.stringify(state)) } catch {}
    onChange && onChange(state)
  }, [state, onChange])

  const wholeFarmAcres = focusedFarmAreaAcres(lands, focusLandId)

  // Handlers
  const addZone = (preset) => {
    setState(s => ({
      ...s,
      zones: [
        ...s.zones,
        {
          id: crypto.randomUUID(),
          name: preset?.name || `Zone ${s.zones.length + 1}`,
          area: preset?.area ?? '',
          areaUnit: preset?.areaUnit || 'acres',
          crop: preset?.crop || '',
          schedule: { periods: [], minutesPerDay: '', unknown: false }
        }
      ]
    }))
  }
  const updateZone = (id, patch) =>
    setState(s => ({ ...s, zones: s.zones.map(z => (z.id === id ? { ...z, ...patch } : z)) }))
  const removeZone = (id) =>
    setState(s => ({ ...s, zones: s.zones.filter(z => z.id !== id) }))

  const addTank = () =>
    setState(s => ({
      ...s,
      tanks: [
        ...s.tanks,
        { id: crypto.randomUUID(), capacity: '', unit: 'gallons', approximate: false, photo: null }
      ]
    }))
  const updateTank = (id, patch) =>
    setState(s => ({ ...s, tanks: s.tanks.map(t => (t.id === id ? { ...t, ...patch } : t)) }))
  const removeTank = (id) =>
    setState(s => ({ ...s, tanks: s.tanks.filter(t => t.id !== id) }))

  const setPump = (patch) => setState(s => ({ ...s, pump: { ...s.pump, ...patch } }))
  const setEnergy = (patch) => setState(s => ({ ...s, energy: { ...s.energy, ...patch } }))

  // Simple validation flags (for quick guidance)
  const missingZones = state.zones.length === 0 || state.zones.some(z => !z.name || !z.area)
  const missingTanks = state.tanks.length === 0 || state.tanks.some(t => !t.capacity)
  const missingPump = !state.pump?.type
  const missingCropInAnyZone = state.zones.some(z => !z.crop)

  return (
    <div className="panel" style={{ display: 'grid', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Farm setup</h3>

      {/* Irrigation zones */}
      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong>Irrigation zones</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="primary-btn"
              onClick={() => addZone({ name: 'Whole farm', area: wholeFarmAcres ?? '', areaUnit: 'acres' })}
              title={wholeFarmAcres ? `Use ${wholeFarmAcres} acres from map` : 'Adds one zone; fill area'}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              Quick add (1 zone)
            </button>
            <button
              type="button"
              onClick={() => addZone()}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              Add zone
            </button>
          </div>
        </div>

        {state.zones.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)' }}>
            Add zones with name and area. Quick add sets one zone for the whole farm
            {wholeFarmAcres ? ` (~${wholeFarmAcres} acres from map).` : '.'}
          </div>
        )}

        {state.zones.map((z) => (
          <div key={z.id} style={{ border: '1px solid #293241', borderRadius: 8, padding: 8, display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, alignItems: 'center' }}>
              <input
                value={z.name}
                onChange={e => updateZone(z.id, { name: e.target.value })}
                placeholder="Zone name"
                style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
              />
              <input
                type="number"
                value={z.area}
                onChange={e => updateZone(z.id, { area: e.target.value })}
                placeholder="Area"
                min="0"
                step="0.01"
                style={{ width: 110, padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
              />
              <select
                value={z.areaUnit}
                onChange={e => updateZone(z.id, { areaUnit: e.target.value })}
                style={{ width: 100, padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
              >
                <option value="acres">acres</option>
                <option value="ha">ha</option>
              </select>
              <button onClick={() => removeZone(z.id)} style={{ padding: '6px 8px' }}>Remove</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--muted, #94a3b8)' }}>Crop</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={z.crop}
                    onChange={e => updateZone(z.id, { crop: e.target.value })}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
                  >
                    <option value="">Select crop</option>
                    {cropOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {z.crop === 'Other' && (
                    <input
                      placeholder="Specify"
                      onChange={e => updateZone(z.id, { cropOther: e.target.value })}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
                    />
                  )}
                </div>
              </label>

              <label style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--muted, #94a3b8)' }}>Daily schedule (approx)</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select
                    multiple
                    value={z.schedule.periods}
                    onChange={e => updateZone(z.id, { schedule: { ...z.schedule, periods: Array.from(e.target.selectedOptions).map(o => o.value) } })}
                    style={{ flex: 1, padding: '6px 8px', minHeight: 72, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
                  >
                    {scheduleOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Minutes/day"
                    value={z.schedule.minutesPerDay}
                    onChange={e => updateZone(z.id, { schedule: { ...z.schedule, minutesPerDay: e.target.value } })}
                    min="0"
                    step="1"
                    style={{ width: 140, padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
                  />
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={z.schedule.unknown || false}
                      onChange={e => updateZone(z.id, { schedule: { ...z.schedule, unknown: e.target.checked } })}
                    />
                    I don’t know (use defaults)
                  </label>
                </div>
              </label>
            </div>
          </div>
        ))}

        {missingZones && (
          <div style={{ fontSize: 12, color: '#f59e0b' }}>
            Required: add at least one zone with name and area.
          </div>
        )}
      </section>

      {/* Tanks */}
      <section style={{ display: 'grid', gap: 8 }}>
        <strong>Tank capacity (per tank)</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={addTank} style={{ padding: '4px 10px', fontSize: 12 }}>Add tank</button>
        </div>

        {state.tanks.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)' }}>
            Required: add at least one tank with capacity and unit.
          </div>
        )}

        {state.tanks.map(t => (
          <div key={t.id} style={{ border: '1px solid #293241', borderRadius: 8, padding: 8, display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8 }}>
              <input
                type="number"
                placeholder="Capacity"
                value={t.capacity}
                onChange={e => updateTank(t.id, { capacity: e.target.value })}
                min="0"
                step="1"
                style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
              />
              <select
                value={t.unit}
                onChange={e => updateTank(t.id, { unit: e.target.value })}
                style={{ width: 120, padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
              >
                <option value="gallons">gallons</option>
                <option value="liters">liters</option>
              </select>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={t.approximate || false}
                  onChange={e => updateTank(t.id, { approximate: e.target.checked })}
                />
                Approximate
              </label>
              <button onClick={() => removeTank(t.id)}>Remove</button>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--muted, #94a3b8)' }}>
                Optional: photo of tank (for later verification)
              </label>
              <input type="file" accept="image/*" onChange={e => updateTank(t.id, { photo: e.target.files?.[0] || null })} />
            </div>
          </div>
        ))}

        {missingTanks && (
          <div style={{ fontSize: 12, color: '#f59e0b' }}>Required: at least one tank with capacity.</div>
        )}
      </section>

      {/* Pump */}
      <section style={{ display: 'grid', gap: 8 }}>
        <strong>Pump type & power</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select
            value={state.pump.type}
            onChange={e => setPump({ type: e.target.value })}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
          >
            {pumpTypes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input
            type="number"
            placeholder="Pump flow (L/min, optional)"
            value={state.pump.flowLpm}
            onChange={e => setPump({ flowLpm: e.target.value })}
            min="0"
            step="1"
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
          />
        </div>
        {missingPump && <div style={{ fontSize: 12, color: '#f59e0b' }}>Required: select pump type.</div>}
      </section>

      {/* Energy (recommended) */}
      <section style={{ display: 'grid', gap: 8 }}>
        <strong>Battery and solar (recommended)</strong>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <input
            type="number"
            placeholder="Solar kW (peak)"
            value={state.energy.solarKW}
            onChange={e => setEnergy({ solarKW: e.target.value })}
            min="0" step="0.1"
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
          />
          <input
            type="number"
            placeholder="Battery kWh"
            value={state.energy.batteryKWh}
            onChange={e => setEnergy({ batteryKWh: e.target.value })}
            min="0" step="0.1"
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
          />
          <input
            type="number"
            placeholder="Inverter efficiency %"
            value={state.energy.inverterEff}
            onChange={e => setEnergy({ inverterEff: e.target.value })}
            min="0" max="100" step="1"
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
          />
        </div>
      </section>

      {/* Soil type (recommended) */}
      <section style={{ display: 'grid', gap: 8 }}>
        <strong>Soil type (dominant)</strong>
        <select
          value={state.soilType}
          onChange={e => setState(s => ({ ...s, soilType: e.target.value }))}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'inherit' }}
        >
          <option value="">Select soil</option>
          {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </section>

      {/* Quick status */}
      <section style={{ fontSize: 12, color: '#94a3b8' }}>
        Status: {missingZones ? 'Zones incomplete' : 'Zones ✓'} · {missingTanks ? 'Tanks incomplete' : 'Tanks ✓'} · {missingPump ? 'Pump missing' : 'Pump ✓'} {missingCropInAnyZone ? '· Some zones missing crop' : ''}
      </section>
    </div>
  )
}