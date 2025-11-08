import React, { useState } from 'react'

export default function LandForm({ onSave, hasGeometry }) {
  const [name, setName] = useState('')

  return (
    <form
      className="land-form panel"
      onSubmit={(e) => {
        e.preventDefault()
        if (!hasGeometry) return
        onSave && onSave({ name })
        setName('')
      }}
    >
      <h3 style={{ marginTop: 0 }}>New Land</h3>
      <label>
        <span>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Farm parcel name"
          required
        />
      </label>
      {!hasGeometry && (
        <div className="warning-text">
          Draw a polygon on the map first.
        </div>
      )}
      <button
        type="submit"
        className="primary-btn"
        disabled={!hasGeometry || !name.trim()}
        style={{ cursor: (!hasGeometry || !name.trim()) ? 'not-allowed' : 'pointer' }}
      >
        Save Land
      </button>
    </form>
  )
}
