import React, { useState } from 'react'

export default function LandForm({ onSave, hasGeometry }) {
  const [name, setName] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!hasGeometry) return
        onSave && onSave({ name })
        setName('')
      }}
      className="panel"
      style={{ display:'flex', flexDirection:'column', gap:8 }}
    >
      <h3 style={{ margin:0 }}>Add Farm</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Farm name"
        required
      />
      <button
        type="submit"
        className="primary-btn"
        disabled={!hasGeometry}
        style={{ fontSize:12 }}
      >
        Save Farm
      </button>
      {!hasGeometry && <div className="muted" style={{ fontSize:12 }}>Draw a polygon to enable saving.</div>}
    </form>
  )
}
