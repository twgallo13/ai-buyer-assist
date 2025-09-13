import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import TrendRadar from './pages/TrendRadar'
import ComparePage from './pages/Compare'
import BatchPage from './pages/Batch'
import SettingsPage from './pages/Settings'
import SessionsPage from './pages/Sessions'
import UsagePage from './pages/Usage'
import Header from './components/layout/Header'
import './styles/theme.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'analyze' | 'trendradar' | 'compare' | 'batch' | 'settings' | 'sessions' | 'usage'>('home');
  const [usage, setUsage] = useState<{ deepCalls: number, budget: number } | null>(null);

  useEffect(() => {
    // Initialize theme from settings
    import('./lib/settings').then(({ getSettings }) => {
      import('./lib/theme').then(({ applyTheme }) => {
        const { theme } = getSettings();
        applyTheme(theme);
      });
    });

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

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home />;
      case 'analyze': return <Analyze />;
      case 'trendradar': return <TrendRadar />;
      case 'compare': return <ComparePage />;
      case 'batch': return <BatchPage />;
      case 'settings': return <SettingsPage />;
      case 'sessions': return <SessionsPage />;
      case 'usage': return <UsagePage />;
      default: return <Home />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        usage={usage}
      />

      <main>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
