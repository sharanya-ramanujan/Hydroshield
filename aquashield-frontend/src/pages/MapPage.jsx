import React, { useEffect, useRef, useState } from 'react'
import FarmMap from '../components/FarmMap.jsx'
import WildfireRiskPanel from '../components/WildfireRiskPanel.jsx'
import FarmInfoPanel from '../components/FarmInfoPanel.jsx'
import AddressSearch from '../components/AddressSearch.jsx'
import LandForm from '../components/LandForm.jsx'
import LandList from '../components/LandList.jsx'
import ScenarioPanel from '../components/ScenarioPanel.jsx'
import { fromLonLat } from 'ol/proj'

export default function MapPage() {
  const [selectedGeometry, setSelectedGeometry] = useState(null)
  const [lands, setLands] = useState([])
  const [focusLandId, setFocusLandId] = useState(null)
  const [farmInfo, setFarmInfo] = useState(null)

  // Scenario state
  const [scenarioActive, setScenarioActive] = useState(false)
  const [scenarioPickMode, setScenarioPickMode] = useState(false)

  // Fixed origin: once picked it does not move
  const [scenarioOrigin3857, setScenarioOrigin3857] = useState(null)

  // Time (hours)
  const [simTimeHr, setSimTimeHr] = useState(0)
  const maxTimeHr = 72

  // Auto-play
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef(null)
  const lastRef = useRef(null)

  // Fire model: radial growth only (km/h)
  const [spreadRateKmH] = useState(2.5)

  const [addressCenter3857, setAddressCenter3857] = useState(null)

  const hasSavedFarm = lands.length > 0
  const zonesCount = farmInfo?.zones?.length || 0
  const tanksCount = farmInfo?.tanks?.length || 0

  // Start picking origin on map
  const beginPickOrigin = () => {
    setScenarioPickMode(true)
    setScenarioActive(true)
    setPlaying(false)
  }

  // When origin picked on map: set fixed origin and reset time
  const handleScenarioPick = (coord3857) => {
    setScenarioOrigin3857(coord3857)
    setSimTimeHr(0)
    setScenarioPickMode(false)
    setScenarioActive(true)
  }

  const handleLocateAddress = (lon, lat) => {
    const coord3857 = fromLonLat([lon, lat])
    setAddressCenter3857(coord3857)
  }

  // Animate time when playing
  useEffect(() => {
    if (!playing || !scenarioActive) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastRef.current = null
      return
    }
    const step = (ts) => {
      if (!lastRef.current) lastRef.current = ts
      const dtMs = ts - lastRef.current
      lastRef.current = ts
      const dtHr = dtMs / (1000 * 60 * 60)
      setSimTimeHr(t => {
        const next = Math.min(maxTimeHr, t + dtHr)
        if (next >= maxTimeHr) setPlaying(false)
        return next
      })
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastRef.current = null
    }
  }, [playing, scenarioActive])

  // Fixed origin; radius grows with time
  const fireRadiusKm = Math.max(0, spreadRateKmH * simTimeHr)

  return (
    <div className="map-page">
      <div className="map-panel">
        <FarmMap
          onGeometryDrawn={setSelectedGeometry}
          selectedGeometry={selectedGeometry}
          lands={lands}
          focusLandId={focusLandId}
          // scenario props (render-only)
          scenarioActive={scenarioActive}
          scenarioCenter3857={scenarioOrigin3857} // fixed origin
          fireRadiusKm={fireRadiusKm}
          scenarioPickMode={scenarioPickMode}
          onScenarioPick={handleScenarioPick}
          addressCenter3857={addressCenter3857}
        />
      </div>

      <div className="side-panel" style={{ display:'grid', gap:12, alignContent:'start' }}>
        {/* Sticky header with status pills */}
        <div className="sidebar-header">
          <div className="title">Planner</div>
          <div className="sub">Add your farm, then fill out setup for a tailored wildfire plan.</div>
          <div className="header-pills">
            <span className="pill blue">{lands.length} {lands.length === 1 ? 'farm' : 'farms'}</span>
            {hasSavedFarm && <span className="pill green">{zonesCount} zones</span>}
            {hasSavedFarm && <span className="pill">{tanksCount} tanks</span>}
          </div>
        </div>

        {/* Add Farm first */}
        <LandForm onSave={(data) => {
          if (!selectedGeometry) return
          const newLand = { id: Date.now(), ...data, geometry: selectedGeometry }
          setLands(prev => [...prev, newLand])
          setSelectedGeometry(null)
          setFocusLandId(newLand.id)
        }} hasGeometry={!!selectedGeometry} />

        {/* Farm list */}
        <LandList lands={lands} onDelete={(id) => {
          setLands(prev => prev.filter(l => l.id !== id))
          if (focusLandId === id) setFocusLandId(null)
        }} />

        {/* Farm setup + AI risk (shown only after save) */}
        {hasSavedFarm ? (
          <>
            <div className="panel">
              <div className="section-title">Farm setup <span className="hint">(zones, tanks, pump, crop, schedule, energy, soil)</span></div>
              <FarmInfoPanel lands={lands} focusLandId={focusLandId} onChange={setFarmInfo} />
            </div>

            <div className="panel">
              <div className="section-title">Wildfire risk & plan</div>
              <WildfireRiskPanel lands={lands} focusLandId={focusLandId} farmInfo={farmInfo} />
            </div>
          </>
        ) : (
          <div className="panel" style={{ fontSize:13, color:'var(--muted)' }}>
            Draw and save a farm to unlock setup and AI planning.
          </div>
        )}

        {/* Address search and scenario controls remain */}
        <div className="panel">
          <div className="section-title">Find address</div>
          <AddressSearch onLocate={handleLocateAddress} />
        </div>

        <div className="panel">
          <div className="section-title">Scenario</div>
          <ScenarioPanel
            lands={lands}
            // time controls
            simTimeHr={simTimeHr}
            setSimTimeHr={setSimTimeHr}
            maxTimeHr={maxTimeHr}
            playing={playing}
            setPlaying={setPlaying}
            // scenario toggles
            scenarioActive={scenarioActive}
            setScenarioActive={setScenarioActive}
            // render data
            scenarioCenter3857={scenarioOrigin3857} // fixed origin
            fireRadiusKm={fireRadiusKm}
            // picking origin
            onPickOrigin={beginPickOrigin}
          />
        </div>
      </div>
    </div>
  )
}
