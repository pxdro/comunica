import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Sem StrictMode de propósito: evita o duplo start/stop da câmera em dev.
createRoot(document.getElementById('root')!).render(<App />)
