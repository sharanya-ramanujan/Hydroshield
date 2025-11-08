import React from 'react'
import TopBar from './components/TopBar.jsx'
import MapPage from './pages/MapPage.jsx'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <MapPage />
    </div>
  )
}

export default App