import React, { useState } from 'react'
import TopBar from './components/TopBar.jsx'
import HomePage from './pages/HomePage.jsx'
import MapPage from './pages/MapPage.jsx'
import './App.css'

function App() {
  const [view, setView] = useState('home') // 'home' | 'map'

  if (view === 'home') {
    return <HomePage onEnter={() => setView('map')} />
  }

  return (
    <div className="app-shell">
      <TopBar onHome={() => setView('home')} />
      <MapPage />
    </div>
  )
}

export default App