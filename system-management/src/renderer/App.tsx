import { useState } from 'react'
import Sidebar from './components/Sidebar'
import { ShapeType } from '../types/Editor'
import Settings from './pages/Settings';
import Editor from './components/Editor';

const ToggleButton = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 2000,
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: show ? '#e74c3c' : '#3498db',
      color: 'white',
      cursor: 'pointer',
      fontWeight: 'bold',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }}
  >
    {show ? 'Close Settings' : 'Settings'}
  </button>
)

const SettingsOverlay = ({ show }: { show: boolean }) => {
  if (!show) return null
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      zIndex: 1050,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'auto'
    }}>
      <div style={{ width: '80%', maxWidth: '800px', padding: '20px' }}>
        <Settings />
      </div>
    </div>
  )
}

export default function App() {
  const [dragType, setDragType] = useState<ShapeType | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <ToggleButton show={showSettings} onClick={() => setShowSettings(!showSettings)} />
      <SettingsOverlay show={showSettings} />
      <Sidebar />
      <Editor dragType={dragType} setDragType={setDragType} />
    </div>
  )
}
