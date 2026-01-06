import ToolBar from './ToolBar'
import Viewport from './Viewport'
import { ShapeType } from './types'

interface EditorProps {
    dragType: ShapeType | null
    setDragType: (v: ShapeType | null) => void
}

export default function Editor({ dragType, setDragType }: EditorProps) {
    return (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <ToolBar setDragType={setDragType} />
            <Viewport dragType={dragType} setDragType={setDragType} />
        </div>
    )
}
