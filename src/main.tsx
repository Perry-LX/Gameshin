import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './i18n'
import { initializeAnalytics } from './analytics'
import './index.css'
import App from './App.tsx'

const startAnalytics = () => void initializeAnalytics()

const scheduleAnalytics = () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startAnalytics, { timeout: 3000 })
  } else {
    globalThis.setTimeout(startAnalytics, 1500)
  }
}

if (document.readyState === 'complete') scheduleAnalytics()
else window.addEventListener('load', scheduleAnalytics, { once: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
