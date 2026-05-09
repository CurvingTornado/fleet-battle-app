/**
 * main.jsx — Application Entry Point
 *
 * Mounts the root React application into the #root DOM element.
 * StrictMode enables additional development-time warnings and double-renders
 * to help surface side effects in hooks.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FleetProvider } from './hooks/FleetContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FleetProvider>
      <App />
    </FleetProvider>
  </StrictMode>,
)
