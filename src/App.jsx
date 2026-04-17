import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import RequireAuth from './components/RequireAuth'
import { applyUiSettings, readUiSettings } from './lib/uiSettings'
import AuthPage from './pages/AuthPage'
import ContentViewerPage from './pages/ContentViewerPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import SettingsPage from './pages/SettingsPage'
import UploadPage from './pages/UploadPage'

export default function App() {
  useEffect(() => {
    applyUiSettings(readUiSettings())
  }, [])

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="content/:id" element={<ContentViewerPage />} />
        <Route path="u/:username" element={<PublicProfilePage />} />
        <Route
          path="profile"
          element={(
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          )}
        />
        <Route
          path="settings"
          element={(
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          )}
        />
        <Route
          path="upload"
          element={(
            <RequireAuth>
              <UploadPage />
            </RequireAuth>
          )}
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
