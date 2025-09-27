import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { ProjectDetail } from './pages/ProjectDetail'
import { SettingsPage as Settings } from './pages/Settings'
import { HealthStatus } from './types'

function App() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)

  useEffect(() => {
    fetch('/healthz')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch((err) => console.error('Health check failed:', err))
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Side Sync
                  </h1>
                  <span className="ml-2 text-sm text-gray-500">
                    Time Tracking
                  </span>
                </Link>
              </div>
              <nav className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/settings"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Settings
                </Link>
              </nav>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    healthStatus?.status === 'ok'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm text-gray-600">
                  {healthStatus?.status === 'ok' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export { App }
