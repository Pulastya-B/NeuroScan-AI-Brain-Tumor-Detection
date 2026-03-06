import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a3e',
          color: '#e0e7ff',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px',
        },
      }}
    />
  </BrowserRouter>
)
