import React from 'react'

function TopBar({ onHome }) {
  return (
    <header className="topbar">
      <span
        className="logo"
        style={{ cursor: onHome ? 'pointer' : 'default' }}
        onClick={() => onHome && onHome()}
      >
        HydroShield
      </span>
    </header>
  )
}

export default TopBar
