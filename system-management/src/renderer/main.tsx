import { createRoot } from 'react-dom/client'
import App from './App'
import SubtitlesOverlay from './pages/SubtitlesOverlay'
import { AudioProvider } from './contexts/AudioContext'
import './style.css'
import { DirectoryProvider } from './contexts/DirectoryContext'

const container = document.getElementById('app')
const root = createRoot(container!)

if (window.location.hash === '#subtitles') {
    root.render(
        <AudioProvider>
            <SubtitlesOverlay />
        </AudioProvider>
    )
} else {
    root.render(
        <AudioProvider>
            <DirectoryProvider>
                <App />
            </DirectoryProvider>
        </AudioProvider>
    )
}
