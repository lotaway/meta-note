import { useState, useEffect } from 'react'
import Files2video from './features/Files2video'
import { useScroll, useMousePosition } from './utils/hooks'

enum Status {
  NoInit,
  Loading,
  Loaded,
  End,
  Error
}

interface States {
  welcomeTitle: string
  status: Status
}

export default function App() {
  const [name] = useState<string>("Meta Note")
  const [commonData, setCommonData] = useState<States>({
    welcomeTitle: `welcome to use Meta Note`,
    status: Status.NoInit
  })
  const scrollInfo = useScroll()
  const mousePosition = useMousePosition()

  useEffect(() => {
    setCommonData(prev => ({
      ...prev,
      status: Status.Loaded
    }))
  }, [])

  return (
    <div className="container">
      <h1>{name}</h1>
      <span className="sec-title">{commonData.welcomeTitle}</span>
      <div className="content">
        <div className="scroll-info">
          <span className="item-info">top: {scrollInfo.top},</span>
          <span className="item-info">left: {scrollInfo.left}</span>
        </div>
        <div className="mouse-position">
          <span className="item-info">x: {mousePosition.x},</span>
          <span className="item-info">y: {mousePosition.y}</span>
        </div>
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <button
            className="premium-button"
            onClick={() => (window as any).desktop.requestOpenChatGPTWindow()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10a37f',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 10px rgba(16, 163, 127, 0.3)'
            }}
          >
            Open ChatGPT Monitor
          </button>
          <button
            className="premium-button"
            onClick={() => (window as any).desktop.requestOpenExternalLogin()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginLeft: '10px',
              boxShadow: '0 2px 10px rgba(66, 133, 244, 0.3)'
            }}
          >
            Google Login (System Browser)
          </button>
          <button
            className="premium-button"
            onClick={() => (window as any).desktop.requestOpenDeepseekWindow()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginLeft: '10px',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
            }}
          >
            Open Deepseek Monitor
          </button>
          <button
            className="premium-button"
            onClick={() => (window as any).desktop.requestOpenDeepseekExternalLogin()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginLeft: '10px',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
            }}
          >
            Deepseek Login (System Browser)
          </button>
        </div>
        <div style={{ color: '#666', fontSize: '12px', marginBottom: '20px' }}>
          * If Google login fails in Electron, use the button above to login in your system browser.
        </div>
        <Files2video />
      </div>
    </div>
  )
}
