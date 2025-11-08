import React, { useState } from 'react'

const LandForm = ({ onSave, hasGeometry }) => {
  const [name, setName] = useState('')
  const [flow, setFlow] = useState(50)
  const [priority, setPriority] = useState(1)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      name,
      irrigation_flow_lpm: Number(flow),
      priority: Number(priority),
    })
    setName('')
    setFlow(50)
    setPriority(1)
  }

  return (
    <div className="panel">
      <h2>Create Land</h2>
      <p className="muted">Draw an area on the map first, then fill this out.</p>
      <form onSubmit={handleSubmit} className="land-form">
        <label>
          Land name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Irrigation Flow (L/min)
          <input
            type="number"
            value={flow}
            onChange={(e) => setFlow(e.target.value)}
            min="0"
            step="5"
          />
        </label>

        <label>
          Priority (1 = highest)
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            min="1"
            max="5"
          />
        </label>

        <button type="submit" className="primary-btn" disabled={!hasGeometry}>
          Save Land
        </button>
        {!hasGeometry && <p className="warning-text">Draw an area on the map to enable saving.</p>}
      </form>
    </div>
  )
}

export default LandForm
