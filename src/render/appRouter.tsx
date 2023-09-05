import { Route, createHashRouter, createRoutesFromElements } from 'react-router-dom'
import HomePage from './pages/HomePage'
import InfoPage from './pages/InfoPage'
import SettingsPage from './pages/SettingsPage'
import InspectSerialPage from './pages/InspectSerialPage'
import DeviceSelectionPage from './pages/DeviceSelectionPage'

export const appRouter = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<HomePage />} />
      <Route path="hw/:hwId" element={<DeviceSelectionPage />} />
      <Route path="inspect-serial" element={<InspectSerialPage />} />
      <Route path="info" element={<InfoPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </>,
  ),
)
