import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'
import { DirectoryProvider } from './contexts/DirectoryContext'

const container = document.getElementById('app')
const root = createRoot(container!)
root.render(
    <DirectoryProvider>
        <App />
    </DirectoryProvider>
)
