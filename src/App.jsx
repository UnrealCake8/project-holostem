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
import VideoPage from './pages/VideoPage'
import ModeratorDashboardPage from './pages/ModeratorDashboardPage'

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
        <Route path="/video/:id" element={<VideoPage />} />
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
          path="moderation"
          element={(
            <RequireAuth>
              <ModeratorDashboardPage />
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
