import { useState } from 'react'
import Sidebar from './components/Sidebar'
import { ShapeType } from '../types/Editor'
import Settings from './pages/Settings'
import Editor from './components/Editor'
import VideoNote from './components/VideoNote'
import { AppContainer, SettingsToggle, OverlayLayer, OverlayBody } from './components/AppLayout'
import AudioControlPanel from './components/AudioControlPanel'
import styled from 'styled-components'

const NoteToggle = styled.button<{ $active: boolean }>`
    position: absolute;
    top: 10px;
    right: 140px;
    z-index: 2000;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background-color: ${({ $active }: { $active: boolean }) => ($active ? '#e74c3c' : '#44aa88')};
    color: white;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
`

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

const VideoNoteOverlay = ({ show }: { show: boolean }) => {
    if (!show) return null
    return (
        <OverlayLayer style={{ backgroundColor: '#1e1e1e' }}>
            <OverlayBody style={{ maxWidth: '1000px', height: '90%' }}>
                <VideoNote />
            </OverlayBody>
        </OverlayLayer>
    )
}

export default function App() {
    const [dragType, setDragType] = useState<ShapeType | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [showVideoNote, setShowVideoNote] = useState(false)

    return (
        <AppContainer>
            <NoteToggle $active={showVideoNote} onClick={() => setShowVideoNote(!showVideoNote)}>
                {showVideoNote ? 'Close Video Note' : 'Video Note'}
            </NoteToggle>
            <ToggleButton show={showSettings} onClick={() => setShowSettings(!showSettings)} />
            <SettingsOverlay show={showSettings} />
            <VideoNoteOverlay show={showVideoNote} />
            <Sidebar />
            <Editor dragType={dragType} setDragType={setDragType} />
            <AudioControlPanel />
        </AppContainer>
    )
}

