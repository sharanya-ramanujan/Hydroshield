import React from 'react'

export default function HomePage({ onEnter }) {
  return (
    <div className="home-page">
      <img
        src="/HydroShieldLogo.png"
        alt="HydroShield"
        style={{ maxWidth:640, width:'100%', marginBottom:'2.5rem' }}
      />
      <p style={{ fontSize:'1.25rem', fontStyle:'italic', marginBottom:'2rem' }}>
        Protect your water. Protect your land. Protect your future.
      </p>
      <button
        className="primary-btn"
        onClick={onEnter}
        style={{ fontSize:'1rem', padding:'0.85rem 1.75rem' }}
      >
        Enter App
      </button>
    </div>
  )
}