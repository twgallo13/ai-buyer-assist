import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import './index.css'
import './styles/global.css'
import { initTheme } from './lib/theme'
import App from './App.tsx'

// Initialize theme before rendering
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
