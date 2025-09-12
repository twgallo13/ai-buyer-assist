import { useState } from 'react'
import Analyze from './pages/Analyze'
import TrendRadar from './pages/TrendRadar'
import ComparePage from './pages/Compare'
import BatchPage from './pages/Batch'
import SettingsPage from './pages/Settings'
import SessionsPage from './pages/Sessions'

function App() {
  const [currentPage, setCurrentPage] = useState<'analyze' | 'trendradar' | 'compare' | 'batch' | 'settings' | 'sessions'>('analyze');

  const navButtonStyle = (isActive: boolean) => ({
    padding: '0.5rem 1rem',
    backgroundColor: isActive ? '#6366f1' : 'transparent',
    border: '1px solid #6366f1',
    borderRadius: '0.25rem',
    color: isActive ? '#ffffff' : '#6366f1',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none'
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0b0f', color: '#f2f2f5' }}>
      <nav style={{ borderBottom: '1px solid #333', padding: '1rem', backgroundColor: '#14141a' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setCurrentPage('analyze')}
            style={navButtonStyle(currentPage === 'analyze')}
          >
            Analyze
          </button>
          <button
            onClick={() => setCurrentPage('trendradar')}
            style={navButtonStyle(currentPage === 'trendradar')}
          >
            Trend Radar
          </button>
          <button
            onClick={() => setCurrentPage('compare')}
            style={navButtonStyle(currentPage === 'compare')}
          >
            Compare
          </button>
          <button
            onClick={() => setCurrentPage('batch')}
            style={navButtonStyle(currentPage === 'batch')}
          >
            Batch
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            style={navButtonStyle(currentPage === 'settings')}
          >
            Settings
          </button>
          <button
            onClick={() => setCurrentPage('sessions')}
            style={navButtonStyle(currentPage === 'sessions')}
          >
            Sessions
          </button>
        </div>
      </nav>

      {currentPage === 'analyze' && <Analyze />}
      {currentPage === 'trendradar' && <TrendRadar />}
      {currentPage === 'compare' && <ComparePage />}
      {currentPage === 'batch' && <BatchPage />}
      {currentPage === 'settings' && <SettingsPage />}
      {currentPage === 'sessions' && <SessionsPage />}
    </div>
  );
}

export default App
