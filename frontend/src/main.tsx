// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster, toast } from 'sonner'
import './index.css'
import App from './App'

// Import API config to setup axios interceptors
import './api/config';

// Migrate legacy alert notifications to Sonner toasts globally.
if (typeof window !== 'undefined') {
  const patchedWindow = window as Window & { __imbAlertPatched?: boolean }
  if (!patchedWindow.__imbAlertPatched) {
    window.alert = (message?: unknown) => {
      const text = typeof message === 'string'
        ? message
        : message == null
          ? ''
          : String(message)
      toast.info(text)
    }
    patchedWindow.__imbAlertPatched = true
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" richColors closeButton />
  </StrictMode>,
)