import React from 'react'

export default function HomePage({ onEnter }) {
  return (
    <main className="home-page">
      <img
        src="/HydroShieldLogo.png"
        alt="HydroShield"
      />
      <p style={{ fontSize:'1.25rem', fontStyle:'italic', margin:0 }}>
        Protect your water. Protect your land. Protect your future.
      </p>
      <button
        className="primary-btn"
        onClick={() => (onEnter ? onEnter() : (window.location.hash = '#/map'))}
        style={{ fontSize:'1rem', padding:'0.85rem 1.75rem' }}
      >
        Get Started
      </button>
    </main>
  )
}