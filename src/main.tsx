import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/App'
import './styles/index.css'

// Note: no <StrictMode>. Strict mode double-mounts effects in dev, which
// would start the webcam and load vision models twice on every visit.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
