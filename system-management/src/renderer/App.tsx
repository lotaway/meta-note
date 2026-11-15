import { useState } from 'react'
import Sidebar from './components/Sidebar'
import { ShapeType } from '../types/Editor'
import Settings from './pages/Settings'
import Editor from './components/Editor'
import DigitalTwinPage from './pages/DigitalTwinPage'
import VideoNote from './components/VideoNote'
import { AppContainer, SettingsToggle, OverlayLayer, OverlayBody } from './components/AppLayout'
import styled from 'styled-components'

const ModeToggle = styled.button<{ $active: boolean; $offset: number }>`
    position: absolute;
    top: 10px;
    right: ${({ $offset }) => $offset}px;
    z-index: 2000;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background-color: ${({ $active }: { $active: boolean }) => ($active ? '#7c3aed' : '#3b82f6')};
    color: white;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

    &:hover {
        background-color: ${({ $active }: { $active: boolean }) => ($active ? '#6d28d9' : '#2563eb')};
    }
`

const VideoNoteShell = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    background-color: #1e1e1e;

    > div:last-child {
        flex: 1;
        min-height: 0;
    }
`

const BackButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2000;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: #34495e;
    color: white;
    cursor: pointer;
    font-weight: bold;
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

const VideoNotePage = ({ onClose }: { onClose: () => void }) => (
    <VideoNoteShell>
        <BackButton onClick={onClose}>返回</BackButton>
        <VideoNote />
    </VideoNoteShell>
)

export default function App() {
    const [dragType, setDragType] = useState<ShapeType | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [showDigitalTwin, setShowDigitalTwin] = useState(false)
    const [showVideoNote, setShowVideoNote] = useState(false)

    if (showDigitalTwin) {
        return <DigitalTwinPage onClose={() => setShowDigitalTwin(false)} />
    }

    if (showVideoNote) {
        return <VideoNotePage onClose={() => setShowVideoNote(false)} />
    }

    return (
        <AppContainer>
            <ModeToggle $active={false} $offset={290} onClick={() => setShowVideoNote(true)}>
                📝 视频笔记
            </ModeToggle>
            <ModeToggle $active={showDigitalTwin} $offset={140} onClick={() => setShowDigitalTwin(true)}>
                🏭 数字孪生
            </ModeToggle>
            <ToggleButton show={showSettings} onClick={() => setShowSettings(!showSettings)} />
            <SettingsOverlay show={showSettings} />
            <Sidebar />
            <Editor dragType={dragType} setDragType={setDragType} />
        </AppContainer>
    )
}
