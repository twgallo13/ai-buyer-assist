import { useState, useEffect } from 'react'
import Home from './pages/Home'
import AnalyzeRedirect from './pages/AnalyzeRedirect'
import TrendRadar from './pages/TrendRadar'
import ComparePage from './pages/Compare'
import BatchPage from './pages/Batch'
import SettingsPage from './pages/Settings'
import SessionsPage from './pages/Sessions'
import UsagePage from './pages/Usage'
import Header from './components/layout/Header'
import { getSettings, applyTheme } from './lib/settings'
import './styles/theme.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'analyze' | 'trendradar' | 'compare' | 'batch' | 'settings' | 'sessions' | 'usage'>('home');
  const [usage, setUsage] = useState<{ deepCalls: number, budget: number } | null>(null);
  const [queryParam, setQueryParam] = useState<string>('');

  // Simple navigation function
  const navigate = (path: string) => {
    const url = new URL(path, window.location.origin);
    const page = url.pathname.substring(1) || 'home';
    const query = url.searchParams.get('q') || '';

    setCurrentPage(page as any);
    setQueryParam(query);

    // Update browser URL without reloading
    window.history.pushState({}, '', path);
  };

  useEffect(() => {
    // Handle initial URL and browser back/forward
    const handlePopState = () => {
      const path = window.location.pathname;
      const page = path.substring(1) || 'home';
      const query = new URLSearchParams(window.location.search).get('q') || '';

      setCurrentPage(page as any);
      setQueryParam(query);
    };

    // Set initial page from URL
    handlePopState();

    window.addEventListener('popstate', handlePopState);

    // Initialize theme from settings synchronously to prevent flash
    try {
      const { theme } = getSettings();
      applyTheme(theme);
    } catch (error) {
      console.warn('Failed to initialize theme:', error);
    }

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
      case 'home': return <Home navigate={navigate} initialQuery={queryParam} />;
      case 'analyze': return <AnalyzeRedirect navigate={navigate} />;
      case 'trendradar': return <TrendRadar />;
      case 'compare': return <ComparePage />;
      case 'batch': return <BatchPage />;
      case 'settings': return <SettingsPage />;
      case 'sessions': return <SessionsPage />;
      case 'usage': return <UsagePage />;
      default: return <Home navigate={navigate} />;
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
