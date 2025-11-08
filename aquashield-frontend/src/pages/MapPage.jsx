import React, { useState } from 'react'
import FarmMap from '../components/FarmMap.jsx'
import LandForm from '../components/LandForm.jsx'
import LandList from '../components/LandList.jsx'

const MapPage = () => {
  const [selectedGeometry, setSelectedGeometry] = useState(null)
  const [lands, setLands] = useState([])

  const handleGeometryDrawn = (geojson) => {
    setSelectedGeometry(geojson)
  }

  const handleSaveLand = (landData) => {
    // attach geometry to land
    if (!selectedGeometry) {
      alert('Draw an area on the map first.')
      return
    }

    const newLand = {
      id: Date.now(),
      ...landData,
      geometry: selectedGeometry,
    }

    setLands((prev) => [...prev, newLand])
    setSelectedGeometry(null)
  }

  return (
    <div className="map-page">
      <div className="map-panel">
        <FarmMap onGeometryDrawn={handleGeometryDrawn} selectedGeometry={selectedGeometry} />
      </div>
      <div className="side-panel">
        <LandForm onSave={handleSaveLand} hasGeometry={!!selectedGeometry} />
        <LandList lands={lands} />
      </div>
      <div style={{ padding: '20px', background: '#1f2937', borderRadius: '1rem' }}>
        <h2>Map Page Placeholder</h2>
        <p>If you see this, the rest of the app is working correctly.</p>
      </div>
    </div>
  )
}

export default MapPage
