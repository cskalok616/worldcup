import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { isElectronWorldCupApp } from './lib/worldCupApiClient'

const isStaticHostedBuild = import.meta.env.VITE_STATIC_DATA_MODE === 'true'
const Router = isElectronWorldCupApp() || isStaticHostedBuild ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)
