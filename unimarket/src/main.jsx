import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import App from './App.jsx'
import { VolumeProvider } from "./context/VolumeContext"; 
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VolumeProvider>
      <App />
    </VolumeProvider>
  </StrictMode>,
)
