import React, { useState } from 'react'
import FarmEditorMap from '../components/FarmEditorMap.jsx'
import FarmDetailsForm from '../components/FarmDetailsForm.jsx'

export default function FarmEditorPage({ land, onBack }) {
  const [features, setFeatures] = useState([])
  const [details, setDetails] = useState(land.details || null)

  return (
    <div className="map-page">
      <div className="map-panel">
        <FarmEditorMap
          polygonGeoJSON={land.geometry}
          features={features}
          onAddFeature={(f) => setFeatures(prev => [...prev, f])}
        />
      </div>
      <div className="side-panel">
        <div className="panel" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0 }}>Farm Editor</h3>
          <button className="primary-btn" style={{ fontSize:12 }} onClick={onBack}>Back</button>
        </div>

        <FarmDetailsForm
          polygonGeoJSON={land.geometry}
          value={details || undefined}
          onChange={(d) => setDetails(d)}
        />

        <div className="panel" style={{ display:'flex', gap:8 }}>
          <button
            className="primary-btn"
            onClick={() => {
              // persist to your model; here we mutate in-memory land
              land.details = details
              alert('Saved farm details.')
            }}
            disabled={!details}
          >
            Save details
          </button>
        </div>
      </div>
    </div>
  )
}