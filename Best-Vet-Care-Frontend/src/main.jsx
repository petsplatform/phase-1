import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { redirectToCanonicalOrigin } from './utils/canonicalOrigin.js'

redirectToCanonicalOrigin()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
