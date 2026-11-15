import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { SubtitleStyle, DEFAULT_SUBTITLE_STYLE } from '../types/Subtitle'
import SubtitleSettingsPanel from '../components/SubtitleSettingsPanel'
import { apiFetch, resolveApiBase } from '../services/local-api'

// Full URL configurable via env (e.g., VITE_VOICE_API_URL=http://localhost:5051)
const API_BASE_URL = resolveApiBase(import.meta.env.VITE_VOICE_API_URL)

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

const SubtitleText = styled.div<{ $style: SubtitleStyle }>`
    margin-top: 20px;
    padding: 10px 20px;
    color: ${props => props.$style.color};
    font-size: ${props => props.$style.fontSize}px;
    font-weight: bold;
    text-align: center;
    pointer-events: auto;
    -webkit-text-stroke: ${props => props.$style.strokeWidth}px ${props => props.$style.strokeColor};
    text-shadow: 
        -1px -1px 0 ${props => props.$style.strokeColor},  
         1px -1px 0 ${props => props.$style.strokeColor},
        -1px  1px 0 ${props => props.$style.strokeColor},
         1px  1px 0 ${props => props.$style.strokeColor};
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
    transition: background 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`

export default function SubtitlesOverlay() {
    const [text, setText] = useState('')
    const [style, setStyle] = useState<SubtitleStyle>(DEFAULT_SUBTITLE_STYLE)
    const [isSettingsVisible, setIsSettingsVisible] = useState(false)

    useEffect(() => {
        const handleText = (newText: string) => {
            setText(newText)
        }

        const handleStyle = (newStyle: Partial<SubtitleStyle>) => {
            setStyle(prev => ({ ...prev, ...newStyle }))
        }

        window.desktop.onSubtitlesText(handleText)
        window.desktop.onSubtitlesStyle(handleStyle)

        return () => {
            window.desktop.offSubtitlesText(handleText)
            window.desktop.offSubtitlesStyle(handleStyle)
        }
    }, [])

    const playTTS = async () => {
        if (!text) return;
        try {
            const response = await apiFetch('/api/tts/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice_profile_id: 'default' })
            }, API_BASE_URL);
            if (response.ok) {
                const blob = await response.blob();
                const audio = new Audio(URL.createObjectURL(blob));
                audio.play();
            }
        } catch (err) {
            console.error('Overlay TTS failed', err);
        }
    }

    const updateStyle = (newStyle: Partial<SubtitleStyle>) => {
        setStyle(prev => ({ ...prev, ...newStyle }))
    }

    return (
        <OverlayContainer>
            <SubtitleText $style={style}>
                {text}
                {text && (
                    <button 
                        onClick={playTTS}
                        style={{ 
                            marginLeft: '10px', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '0.8em',
                            pointerEvents: 'auto'
                        }}
                    >
                        🔊
                    </button>
                )}
            </SubtitleText>
            
            <SettingsButton onClick={() => setIsSettingsVisible(!isSettingsVisible)}>
                ⚙️
            </SettingsButton>

            {isSettingsVisible && (
                <SubtitleSettingsPanel 
                    style={style} 
                    onStyleChange={updateStyle} 
                />
            )}
        </OverlayContainer>
    )
}
