import React from 'react'

const LandList = ({ lands }) => {
  return (
    <div className="panel">
      <h2>Your Lands</h2>
      {lands.length === 0 ? (
        <p className="muted">No lands yet. Draw on the map and save.</p>
      ) : (
        <ul className="land-list">
          {lands.map((land) => (
            <li key={land.id} className="land-item">
              <div className="land-title">{land.name}</div>
              <div className="land-meta">
                Flow: {land.irrigation_flow_lpm} L/min • Priority: {land.priority}
              </div>
              <details>
                <summary>Geometry (GeoJSON)</summary>
                <pre>{JSON.stringify(land.geometry, null, 2)}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LandList
