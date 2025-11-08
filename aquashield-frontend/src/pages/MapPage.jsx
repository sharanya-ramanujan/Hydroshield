import React, { useState } from 'react'
import FarmMap from '../components/FarmMap.jsx'
import LandForm from '../components/LandForm.jsx'
import LandList from '../components/LandList.jsx'

export default function MapPage() {
  const [selectedGeometry, setSelectedGeometry] = useState(null)
  const [lands, setLands] = useState([])
  const [focusLandId, setFocusLandId] = useState(null)

  const handleGeometryDrawn = (geojson) => setSelectedGeometry(geojson)

  const handleSaveLand = (landData) => {
    if (!selectedGeometry) return
    const newLand = {
      id: Date.now(),
      ...landData,
      geometry: selectedGeometry
    }
    setLands(prev => [...prev, newLand])
    setSelectedGeometry(null)
    setFocusLandId(newLand.id) // zoom to new polygon
  }

  return (
    <div className="map-page">
      <div className="map-panel">
        <FarmMap
          onGeometryDrawn={handleGeometryDrawn}
          selectedGeometry={selectedGeometry}
          lands={lands}
          focusLandId={focusLandId}
        />
      </div>
      <div className="side-panel">
        <LandForm onSave={handleSaveLand} hasGeometry={!!selectedGeometry} />
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Current Geometry</h3>
          <pre className="muted" style={{ whiteSpace:'pre-wrap', maxHeight:160, overflow:'auto' }}>
            {selectedGeometry
              ? `${selectedGeometry.geometry.coordinates[0].length} points`
              : 'None'}
          </pre>
        </div>
        <LandList lands={lands} />
      </div>
    </div>
  )
}
