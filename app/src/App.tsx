import { useState, useEffect } from 'react'
import Analyze from './pages/Analyze'
import TrendRadar from './pages/TrendRadar'
import ComparePage from './pages/Compare'
import BatchPage from './pages/Batch'
import SettingsPage from './pages/Settings'
import SessionsPage from './pages/Sessions'
import UsagePage from './pages/Usage'
import ThemeToggle from './components/ThemeToggle'
import './styles/theme.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'analyze' | 'trendradar' | 'compare' | 'batch' | 'settings' | 'sessions' | 'usage'>('analyze');
  const [usage, setUsage] = useState<{ deepCalls: number, budget: number } | null>(null);

  useEffect(() => {
    // Initialize theme from settings
    import('./lib/settings').then(({ getSettings, applyTheme }) => {
      const { theme } = getSettings();
      applyTheme(theme);
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
      case 'analyze': return <Analyze />;
      case 'trendradar': return <TrendRadar />;
      case 'compare': return <ComparePage />;
      case 'batch': return <BatchPage />;
      case 'settings': return <SettingsPage />;
      case 'sessions': return <SessionsPage />;
      case 'usage': return <UsagePage />;
      default: return <Analyze />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Buyer Assistant
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {[
                  { key: 'analyze', label: 'Analyze' },
                  { key: 'trendradar', label: 'Trends' },
                  { key: 'compare', label: 'Compare' },
                  { key: 'batch', label: 'Batch' },
                  { key: 'settings', label: 'Settings' },
                  { key: 'sessions', label: 'Sessions' },
                  { key: 'usage', label: 'Usage' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setCurrentPage(key as any)}
                    className={`${currentPage === key
                        ? 'border-indigo-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {usage && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {usage.deepCalls}/{usage.budget} calls
                </span>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
