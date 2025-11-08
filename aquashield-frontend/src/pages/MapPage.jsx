import React, { useEffect, useRef, useState } from 'react'
import FarmMap from '../components/FarmMap.jsx'
import LandForm from '../components/LandForm.jsx'
import LandList from '../components/LandList.jsx'
import ScenarioPanel from '../components/ScenarioPanel.jsx'
import { fromLonLat } from 'ol/proj'
import AddressSearch from '../components/AddressSearch.jsx'

export default function MapPage() {
  const [selectedGeometry, setSelectedGeometry] = useState(null)
  const [lands, setLands] = useState([])
  const [focusLandId, setFocusLandId] = useState(null)

  // Scenario state
  const [scenarioActive, setScenarioActive] = useState(false)
  const [scenarioPickMode, setScenarioPickMode] = useState(false)
  const [scenarioOrigin3857, setScenarioOrigin3857] = useState(null)
  const [scenarioCenter3857, setScenarioCenter3857] = useState(null)

  // Time (hours)
  const [simTimeHr, setSimTimeHr] = useState(0)
  const maxTimeHr = 72

  // Auto-play
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef(null)
  const lastRef = useRef(null)

  // Simple fire model params
  const [spreadRateKmH] = useState(2.5) // radial growth
  const [driftKmH] = useState(6)        // center drift speed
  const [driftDeg, setDriftDeg] = useState(0)

  const [addressCenter3857, setAddressCenter3857] = useState(null)

  const handleGeometryDrawn = (geojson) => setSelectedGeometry(geojson)

  const handleSaveLand = (landData) => {
    if (!selectedGeometry) return
    const newLand = { id: Date.now(), ...landData, geometry: selectedGeometry }
    setLands(prev => [...prev, newLand])
    setSelectedGeometry(null)
    setFocusLandId(newLand.id)
  }

  const handleDeleteLand = (id) => {
    setLands(prev => prev.filter(l => l.id !== id))
    if (focusLandId === id) setFocusLandId(null)
  }

  // Start picking origin on map
  const beginPickOrigin = () => {
    setScenarioPickMode(true)
    setScenarioActive(true)
    setPlaying(false)
  }

  // When origin picked on map: reset time and randomize drift direction
  const handleScenarioPick = (coord3857) => {
    setScenarioOrigin3857(coord3857)
    setScenarioCenter3857(coord3857)
    setSimTimeHr(0)
    setDriftDeg(Math.floor(Math.random() * 360))
    setScenarioPickMode(false)
  }

  const handleLocateAddress = (lon, lat, label) => {
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

  // Update moving fire center based on time
  useEffect(() => {
    if (!scenarioOrigin3857) return
    const theta = (driftDeg * Math.PI) / 180
    const dx = Math.cos(theta) * driftKmH * simTimeHr * 1000 // meters
    const dy = Math.sin(theta) * driftKmH * simTimeHr * 1000
    setScenarioCenter3857([scenarioOrigin3857[0] + dx, scenarioOrigin3857[1] + dy])
  }, [scenarioOrigin3857, driftDeg, driftKmH, simTimeHr])

  // Derived radius (km) from time
  const fireRadiusKm = Math.max(0, spreadRateKmH * simTimeHr)

  return (
    <div className="map-page">
      <div className="map-panel">
        <FarmMap
          onGeometryDrawn={handleGeometryDrawn}
          selectedGeometry={selectedGeometry}
          lands={lands}
          focusLandId={focusLandId}
          // scenario props (render-only)
          scenarioActive={scenarioActive}
          scenarioCenter3857={scenarioCenter3857}
          fireRadiusKm={fireRadiusKm}
          scenarioPickMode={scenarioPickMode}
          onScenarioPick={handleScenarioPick}
          addressCenter3857={addressCenter3857}
        />
      </div>
      <div className="side-panel">
        <AddressSearch onLocate={handleLocateAddress} />
        <LandForm onSave={handleSaveLand} hasGeometry={!!selectedGeometry} />
        <LandList lands={lands} onDelete={handleDeleteLand} />

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
          scenarioCenter3857={scenarioCenter3857}
          fireRadiusKm={fireRadiusKm}
          // picking origin
          onPickOrigin={beginPickOrigin}
        />
      </div>
    </div>
  )
}
