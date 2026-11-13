import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/sessao' // escuta o login e sincroniza perfil e grade
import App from './App.tsx'
import { iniciarMetricas } from './lib/metricas'

iniciarMetricas()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
