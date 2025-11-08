import React, { useState } from 'react'
import FarmMap from '../components/FarmMap.jsx'
import LandForm from '../components/LandForm.jsx'
import LandList from '../components/LandList.jsx'

export default function MapPage() {
  const [selectedGeometry, setSelectedGeometry] = useState(null)
  const [lands, setLands] = useState([])

  const handleGeometryDrawn = (geojson) => {
    setSelectedGeometry(geojson)
  }

  const handleSaveLand = (landData) => {
    if (!selectedGeometry) return
    const newLand = {
      id: Date.now(),
      ...landData,
      geometry: selectedGeometry
    }
    setLands(prev => [...prev, newLand])
    setSelectedGeometry(null) // reset for next drawing
  }

  return (
    <div className="map-page">
      <div className="map-panel">
        <FarmMap
            onGeometryDrawn={handleGeometryDrawn}
            selectedGeometry={selectedGeometry}
        />
      </div>
      <div className="side-panel">
        <LandForm
          onSave={handleSaveLand}
          hasGeometry={!!selectedGeometry}
        />
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Current Geometry</h3>
          <pre className="muted" style={{ whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>
            {selectedGeometry ? JSON.stringify(selectedGeometry.geometry.coordinates[0].length) + ' points' : 'None'}
          </pre>
        </div>
        <LandList lands={lands} />
      </div>
    </div>
  )
}
