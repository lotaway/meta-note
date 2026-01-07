import { useState } from 'react'
import Sidebar from './components/Sidebar'
import { ShapeType } from '../types/Editor'
import Settings from './pages/Settings'
import Editor from './components/Editor'
import { AppContainer, SettingsToggle, OverlayLayer, OverlayBody } from './components/AppLayout'

const ToggleButton = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
  <SettingsToggle $active={show} onClick={onClick}>
    {show ? 'Close Settings' : 'Settings'}
  </SettingsToggle>
)

const SettingsOverlay = ({ show }: { show: boolean }) => {
  if (!show) return null
  return (
    <OverlayLayer>
      <OverlayBody>
        <Settings />
      </OverlayBody>
    </OverlayLayer>
  )
}

export default function App() {
  const [dragType, setDragType] = useState<ShapeType | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <AppContainer>
      <ToggleButton show={showSettings} onClick={() => setShowSettings(!showSettings)} />
      <SettingsOverlay show={showSettings} />
      <Sidebar />
      <Editor dragType={dragType} setDragType={setDragType} />
    </AppContainer>
  )
}
