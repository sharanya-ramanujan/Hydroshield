import React, { useState } from 'react'

export default function AddressSearch({ onLocate }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          // Nominatim usage policy: include a valid referer; browser will send current origin.
        }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.length) {
        setError('Not found')
      } else {
        const { lon, lat, display_name } = data[0]
        onLocate && onLocate(Number(lon), Number(lat), display_name)
      }
    } catch (err) {
      setError('Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel" style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <form onSubmit={handleSubmit} style={{ display:'flex', gap:6 }}>
        <input
          type="text"
          placeholder="Enter address or place"
            value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex:1,
            padding:'6px 10px',
            borderRadius:8,
            border:'1px solid #334155',
            background:'#0f172a',
            color:'inherit'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding:'6px 12px',
            borderRadius:8,
            border:'1px solid #334155',
            background:'#1e3a8a',
            color:'#fff',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          {loading ? '...' : 'Go'}
        </button>
      </form>
      {error && <div style={{ fontSize:12, color:'#f87171' }}>{error}</div>}
    </div>
  )
}