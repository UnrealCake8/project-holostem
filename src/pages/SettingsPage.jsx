import { useEffect, useState } from 'react'
import { applyUiSettings, persistUiSettings, readUiSettings } from '../lib/uiSettings'

export default function SettingsPage() {
  const [settings, setSettings] = useState(readUiSettings)

  useEffect(() => {
    persistUiSettings(settings)
    applyUiSettings(settings)
  }, [settings])

  return (
    <div className="theme-app-bg p-4 space-y-4">
      <h1 className="text-2xl font-bold text-neon-cyan">Accessibility + UI Settings</h1>
      <div className="theme-card space-y-3 rounded-xl border p-4">
        <label className="flex items-center justify-between rounded-lg bg-black/20 p-3">
          <span>Large text mode</span>
          <input type="checkbox" checked={settings.largeText} onChange={(e) => setSettings((s) => ({ ...s, largeText: e.target.checked }))} />
        </label>
        <label className="flex items-center justify-between rounded-lg bg-black/20 p-3">
          <span>Simple mode (minimal UI)</span>
          <input type="checkbox" checked={settings.simpleMode} onChange={(e) => setSettings((s) => ({ ...s, simpleMode: e.target.checked }))} />
        </label>
        <label className="flex items-center justify-between rounded-lg bg-black/20 p-3">
          <span>Dark mode</span>
          <input type="checkbox" checked={settings.darkMode} onChange={(e) => setSettings((s) => ({ ...s, darkMode: e.target.checked }))} />
        </label>
      </div>
    </div>
  )
}
