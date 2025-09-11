import { useState } from 'react'
import Analyze from './pages/Analyze'
import SettingsPage from './pages/Settings'
import BatchPage from './pages/Batch'

function App() {
  const [currentPage, setCurrentPage] = useState<'analyze' | 'batch' | 'settings'>('analyze');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      <nav style={{ borderBottom: '1px solid #333', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setCurrentPage('analyze')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === 'analyze' ? '#333' : 'transparent',
              border: '1px solid #555',
              borderRadius: '0.25rem',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Analyze
          </button>
          <button
            onClick={() => setCurrentPage('batch')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === 'batch' ? '#333' : 'transparent',
              border: '1px solid #555',
              borderRadius: '0.25rem',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Batch
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === 'settings' ? '#333' : 'transparent',
              border: '1px solid #555',
              borderRadius: '0.25rem',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Settings
          </button>
        </div>
      </nav>

      {currentPage === 'analyze' && <Analyze />}
      {currentPage === 'batch' && <BatchPage />}
      {currentPage === 'settings' && <SettingsPage />}
    </div>
  );
}

export default App
