import { useState, useEffect } from 'react'
import Analyze from './pages/Analyze'
import TrendRadar from './pages/TrendRadar'
import ComparePage from './pages/Compare'
import BatchPage from './pages/Batch'
import SettingsPage from './pages/Settings'
import SessionsPage from './pages/Sessions'
import UsagePage from './pages/Usage'
import ThemeToggle from './components/ThemeToggle'
import { initTheme } from './lib/theme'
import './styles/theme.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'analyze' | 'trendradar' | 'compare' | 'batch' | 'settings' | 'sessions' | 'usage'>('analyze');
  const [usage, setUsage] = useState<{ deepCalls: number, budget: number } | null>(null);

  useEffect(() => {
    // Initialize theme
    initTheme();

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
    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius-md)',
    color: isActive ? 'var(--accent-contrast)' : 'var(--accent)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontSize: '0.875rem',
    fontWeight: 500
  });

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)',
        padding: 'var(--space-4)',
        backgroundColor: 'var(--card)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ThemeToggle />
              {usage && (
                <div style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: usage.deepCalls >= usage.budget ? 'var(--error)' : 'var(--success)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#ffffff'
                }}>
                  Deep: {usage.deepCalls} / {usage.budget}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        {currentPage === 'analyze' && <Analyze />}
        {currentPage === 'trendradar' && <TrendRadar />}
        {currentPage === 'compare' && <ComparePage />}
        {currentPage === 'batch' && <BatchPage />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'sessions' && <SessionsPage />}
        {currentPage === 'usage' && <UsagePage />}
      </div>
    </div>
  );
}

export default App
