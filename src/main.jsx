import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ContentProvider } from './context/ContentContext.jsx'
import SiteThemeManager from './components/SiteThemeManager.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ContentProvider>
      <SiteThemeManager />
      <App />
    </ContentProvider>
  </React.StrictMode>
)
