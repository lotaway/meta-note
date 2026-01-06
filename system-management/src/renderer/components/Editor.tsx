import { ShapeType } from "../../types/Editor"
import ToolBar from "./ToolBar"
import Viewport from "./Viewport"

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
