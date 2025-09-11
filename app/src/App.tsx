import { useState } from 'react'
import Analyze from './pages/Analyze'
import TrendRadar from './pages/TrendRadar'
import SettingsPage from './pages/Settings'
import BatchPage from './pages/Batch'

function App() {
  const [currentPage, setCurrentPage] = useState<'analyze' | 'trendradar' | 'batch' | 'settings'>('analyze');

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
        </div>
      </nav>

      {currentPage === 'analyze' && <Analyze />}
      {currentPage === 'trendradar' && <TrendRadar />}
      {currentPage === 'batch' && <BatchPage />}
      {currentPage === 'settings' && <SettingsPage />}
    </div>
  );
}

export default App
