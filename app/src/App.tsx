import { useState, useEffect } from 'react'
import Analyze from './pages/Analyze'
import TrendRadar from './pages/TrendRadar'
import ComparePage from './pages/Compare'
import BatchPage from './pages/Batch'
import SettingsPage from './pages/Settings'
import SessionsPage from './pages/Sessions'
import UsagePage from './pages/Usage'

function App() {
  const [currentPage, setCurrentPage] = useState<'analyze' | 'trendradar' | 'compare' | 'batch' | 'settings' | 'sessions' | 'usage'>('analyze');
  const [usage, setUsage] = useState<{ deepCalls: number, budget: number } | null>(null);

  useEffect(() => {
    // Poll usage every 20 seconds
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/usage');
        const data = await response.json();
        if (data.ok) {
          setUsage({ deepCalls: data.deepCalls, budget: data.budget });
        }
      } catch (e) {
        // Ignore errors, just don't update usage
      }
    };

    fetchUsage(); // Initial fetch
    const interval = setInterval(fetchUsage, 20000); // Every 20 seconds
    return () => clearInterval(interval);
  }, []);

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
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <button
              onClick={() => setCurrentPage('usage')}
              style={navButtonStyle(currentPage === 'usage')}
            >
              Usage
            </button>
          </div>

          {usage && (
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: usage.deepCalls >= usage.budget ? '#dc2626' : '#059669',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Deep: {usage.deepCalls} / {usage.budget}
            </div>
          )}
        </div>
      </nav>

      {currentPage === 'analyze' && <Analyze />}
      {currentPage === 'trendradar' && <TrendRadar />}
      {currentPage === 'compare' && <ComparePage />}
      {currentPage === 'batch' && <BatchPage />}
      {currentPage === 'settings' && <SettingsPage />}
      {currentPage === 'sessions' && <SessionsPage />}
      {currentPage === 'usage' && <UsagePage />}
    </div>
  );
}

export default App
