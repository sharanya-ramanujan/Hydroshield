import React, { useMemo, useState } from 'react'
import GeoJSON from 'ol/format/GeoJSON'
import { getArea as getSphericalArea } from 'ol/sphere'

const acresPerM2 = 0.00024710538146717
const litersPerGallon = 3.785411784

function calcFarmAreaAcres(lands = [], focusLandId, zones) {
  const zoneAreaAc = zones?.length
    ? zones.reduce((s, z) => s + (z.area ? Number(z.area) * (z.areaUnit === 'ha' ? 2.4710538146717 : 1) : 0), 0)
    : 0
  if (zoneAreaAc > 0) return zoneAreaAc
  try {
    const land = lands.find(l => l.id === focusLandId) || (lands.length === 1 ? lands[0] : null)
    if (!land?.geometry) return null
    const fmt = new GeoJSON()
    const f = fmt.readFeature(land.geometry, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
    const m2 = getSphericalArea(f.getGeometry(), { projection: 'EPSG:3857' })
    return +(m2 * acresPerM2).toFixed(2)
  } catch { return null }
}

function sumTankLiters(tanks = []) {
  return tanks.reduce((s, t) => {
    const v = Number(t.capacity)
    if (!isFinite(v) || v <= 0) return s
    return s + (t.unit === 'liters' ? v : v * litersPerGallon)
  }, 0)
}
function estimatePumpFlowLpm(pump, areaAcres) {
  const val = Number(pump?.flowLpm)
  if (isFinite(val) && val > 0) return val
  return Math.max(30, Math.round((areaAcres || 10) * 6))
}
function soilFactor(soilType) {
  switch ((soilType || '').toLowerCase()) {
    case 'sandy': return 1.25
    case 'clay': return 0.9
    default: return 1.0
  }
}
function outageResilience(pumpType, energy) {
  const t = (pumpType || '').toLowerCase()
  const hasSolar = Number(energy?.solarKW) > 0
  const hasBattery = Number(energy?.batteryKWh) > 0
  if (t.includes('gravity')) return 'high'
  if (t.includes('diesel')) return 'high'
  if ((t.includes('solar') || t.includes('electric')) && (hasSolar || hasBattery)) return 'medium'
  return 'low'
}
function computeRisk({ farmAreaAc, tanksL, pumpType, pumpFlowLpm, soil, zones }) {
  const perAcL = farmAreaAc ? tanksL / farmAreaAc : 0
  const storageScore = Math.max(0, Math.min(40, (perAcL / 4000) * 40))
  const pumpScore = pumpType.includes('gravity') ? 30 : pumpType.includes('diesel') ? 25 : 10
  const flowScore = Math.max(0, Math.min(10, pumpFlowLpm / 200 * 10))
  const zoningBonus = Math.min(10, (zones?.length || 0) * 2)
  let base = storageScore + pumpScore + flowScore + zoningBonus
  base = Math.max(0, Math.min(100, Math.round(base / soilFactor(soil))))
  return base
}

export default function WildfireRiskPanel({ lands, focusLandId, farmInfo }) {
  const [aiText, setAiText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [tempKey, setTempKey] = useState('')

  const envKey = (import.meta.env.VITE_OPENAI_API_KEY || '').trim()
  const storedKey = (localStorage.getItem('hs:openaiKey') || '').trim()
  const apiKey = storedKey || envKey
  const hasKey = apiKey.length > 20

  const data = farmInfo || {}
  const farmAreaAc = calcFarmAreaAcres(lands, focusLandId, data.zones)
  const tanksL = sumTankLiters(data.tanks)
  const pumpFlowLpm = estimatePumpFlowLpm(data.pump, farmAreaAc)
  const resilience = outageResilience(data.pump?.type || '', data.energy)
  const riskScore = useMemo(() => computeRisk({
    farmAreaAc, tanksL,
    pumpType: (data.pump?.type || '').toLowerCase(),
    pumpFlowLpm,
    soil: data.soilType || '',
    zones: data.zones
  }), [farmAreaAc, tanksL, data, pumpFlowLpm])

  const suggestions = useMemo(() => {
    const s = []
    if (!farmAreaAc) s.push('Confirm farm area or add zones.')
    if (tanksL / (farmAreaAc || 1) < 2000) s.push('Increase tank storage toward 2,000 L/acre.')
    if ((data.pump?.type || '').toLowerCase().includes('electric') && resilience === 'low')
      s.push('Add backup (battery or generator) for outages.')
    if (!data.pump?.flowLpm) s.push('Measure pump flow (L/min).')
    if ((data.zones?.length || 0) < 2 && farmAreaAc && farmAreaAc > 5)
      s.push('Create multiple zones to prioritize crops.')
    if (!data.soilType) s.push('Set soil type for better scheduling.')
    return s
  }, [data, farmAreaAc, resilience, tanksL])

  async function runAI() {
    setLoading(true); setError(''); setAiText('')
    if (!hasKey) {
      setAiText('No API key set. Enter one to enable AI assessment.')
      setLoading(false); return
    }
    try {
      const body = {
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'Be concise, specific, actionable.' },
            {
              role: 'user',
              content:
                'Assess irrigation continuity wildfire risk and give prioritized mitigations.\n' +
                JSON.stringify({
                  farmAreaAc, tanksL,
                  pump: data.pump,
                  energy: data.energy,
                  soilType: data.soilType,
                  zones: data.zones
                }, null, 2)
            }
        ]
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setAiText(json.choices?.[0]?.message?.content?.trim() || 'No response.')
    } catch (e) {
      setError('AI request failed')
    } finally {
      setLoading(false)
    }
  }

  function saveKey() {
    if (tempKey.trim().length < 20) { setError('Key too short'); return }
    localStorage.setItem('hs:openaiKey', tempKey.trim())
    setTempKey(''); setShowKeyInput(false); setError('')
  }

  const perAcreL = farmAreaAc ? Math.round(tanksL / farmAreaAc) : 0
  const resilienceLabel = resilience === 'high' ? 'High' : resilience === 'medium' ? 'Medium' : 'Low'

  return (
    <div className="panel" style={{ display:'grid', gap:12 }}>
      <h3 style={{ margin:0 }}>Wildfire risk & plan</h3>
      <div style={{ display:'grid', gap:6, fontSize:13 }}>
        <div>Farm area: {farmAreaAc ? `${farmAreaAc.toFixed(2)} ac` : '—'}</div>
        <div>Tanks: {Math.round(tanksL).toLocaleString()} L ({perAcreL.toLocaleString()} L/acre)</div>
        <div>Pump: {data.pump?.type || '—'} · Flow: {pumpFlowLpm} L/min · Outage resilience: {resilienceLabel}</div>
        <div>Soil: {data.soilType || '—'} · Zones: {data.zones?.length || 0}</div>
        <div>Risk score: <strong>{riskScore}/100</strong> <span style={{ marginLeft:8, fontSize:11, color:'#94a3b8' }}>(higher = better preparedness)</span></div>
      </div>

      {suggestions.length > 0 && (
        <div style={{ fontSize:13 }}>
          <strong>Quick suggestions</strong>
          <ul style={{ margin:'4px 0 0', paddingLeft:18 }}>
            {suggestions.map((s,i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button className="primary-btn" onClick={runAI} disabled={loading}>
          {loading ? 'Analyzing…' : 'AI assessment'}
        </button>
        {!hasKey && (
          <button className="ghost-btn" type="button" onClick={() => setShowKeyInput(v => !v)} style={{ fontSize:12 }}>
            Set API key
          </button>
        )}
        {hasKey && (
          <span style={{ fontSize:11, color:'#94a3b8' }}>
            Key loaded ({storedKey ? 'local' : 'env'}) len {apiKey.length}
          </span>
        )}
      </div>

      {showKeyInput && (
        <div style={{ display:'grid', gap:6 }}>
          <input
            type="text"
            placeholder="Paste OpenAI key (sk-...)"
            value={tempKey}
            onChange={e => setTempKey(e.target.value)}
          />
          <div style={{ display:'flex', gap:8 }}>
            <button className="primary-btn" onClick={saveKey}>Save key</button>
            <button className="ghost-btn" onClick={() => setShowKeyInput(false)}>Cancel</button>
          </div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>Stored locally; used only for assessments.</div>
        </div>
      )}

      {error && <div style={{ color:'#ef4444', fontSize:12 }}>{error}</div>}

      {aiText && (
        <div style={{ whiteSpace:'pre-wrap', fontSize:13, border:'1px solid #293241', borderRadius:8, padding:8 }}>
          {aiText}
        </div>
      )}

      {!hasKey && !showKeyInput && (
        <div style={{ fontSize:12, color:'#94a3b8' }}>
          Set VITE_OPENAI_API_KEY in .env.local or provide a key.
        </div>
      )}

      <div style={{ fontSize:11, color:'#94a3b8' }}>
        Note: Guidance only; not a safety guarantee.
      </div>
    </div>
  )
}