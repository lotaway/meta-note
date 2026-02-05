import { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'
import { ipcRenderer } from 'electron'

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  -webkit-app-region: drag;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 9999;
`

const SubtitleText = styled.div<{ $color: string; $fontSize: number; $strokeColor: string; $strokeWidth: number }>`
  margin-top: 20px;
  padding: 10px 20px;
  color: ${props => props.$color};
  font-size: ${props => props.$fontSize}px;
  font-weight: bold;
  text-align: center;
  pointer-events: auto;
  -webkit-text-stroke: ${props => props.$strokeWidth}px ${props => props.$strokeColor};
  /* 简单的描边效果 */
  text-shadow: 
    -1px -1px 0 ${props => props.$strokeColor},  
     1px -1px 0 ${props => props.$strokeColor},
    -1px  1px 0 ${props => props.$strokeColor},
     1px  1px 0 ${props => props.$strokeColor};
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  max-width: 80%;
`

const SettingsButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  -webkit-app-region: no-drag;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 5px 10px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 4px;
`

export default function SubtitlesOverlay() {
    const [text, setText] = useState('')
    const [color, setColor] = useState('#ffffff')
    const [strokeColor, setStrokeColor] = useState('#000000')
    const [fontSize, setFontSize] = useState(48)
    const [strokeWidth, setStrokeWidth] = useState(1)
    const [isSettingsVisible, setIsSettingsVisible] = useState(false)
    const settingsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleText = (_event: any, newText: string) => {
            setText(newText)
        }

        const handleStyle = (_event: any, style: any) => {
            if (style.color) setColor(style.color)
            if (style.strokeColor) setStrokeColor(style.strokeColor)
            if (style.fontSize) setFontSize(style.fontSize)
            if (style.strokeWidth) setStrokeWidth(style.strokeWidth)
        }

        ipcRenderer.on('subtitles:text', handleText)
        ipcRenderer.on('subtitles:style', handleStyle)

        return () => {
            ipcRenderer.off('subtitles:text', handleText)
            ipcRenderer.off('subtitles:style', handleStyle)
        }
    }, [])

    const toggleSettings = () => {
        setIsSettingsVisible(!isSettingsVisible)
    }

    return (
        <OverlayContainer>
            <SubtitleText 
                $color={color} 
                $fontSize={fontSize} 
                $strokeColor={strokeColor}
                $strokeWidth={strokeWidth}
            >
                {text}
            </SubtitleText>
            
            <SettingsButton onClick={toggleSettings}>
                ⚙️
            </SettingsButton>

            {isSettingsVisible && (
                <div 
                    ref={settingsRef}
                    style={{
                        position: 'absolute',
                        top: '60px',
                        right: '20px',
                        background: 'rgba(40, 40, 40, 0.9)',
                        padding: '15px',
                        borderRadius: '8px',
                        color: 'white',
                        width: '200px',
                        zIndex: 10000,
                        pointerEvents: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ marginBottom: '10px' }}>
                        <label>Color: <input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Size: <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} /></label>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Outline Color: <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} /></label>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Outline Width: <input type="number" value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} /></label>
                    </div>
                </div>
            )}
        </OverlayContainer>
    )
}
