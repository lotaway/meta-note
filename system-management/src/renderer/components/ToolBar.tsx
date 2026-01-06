import { ShapeType } from './types'

interface ToolBarProps {
    setDragType: (v: ShapeType) => void
}

const ToolItem = ({ type, setDragType }: { type: ShapeType; setDragType: (v: ShapeType) => void }) => (
    <div
        draggable
        onDragStart={() => setDragType(type)}
        style={{
            padding: '12px',
            border: '1px solid #444',
            marginBottom: '8px',
            borderRadius: '4px',
            cursor: 'grab',
            backgroundColor: '#2a2a2a',
            color: '#eee',
            textAlign: 'center',
            userSelect: 'none'
        }}
    >
        {type.charAt(0).toUpperCase() + type.slice(1)}
    </div>
)

export default function ToolBar({ setDragType }: ToolBarProps) {
    return (
        <div style={{ width: 120, borderRight: '1px solid #333', padding: 12, backgroundColor: '#1e1e1e' }}>
            <div style={{ marginBottom: 12, color: '#888', fontSize: '0.8em' }}>Draggables</div>
            <ToolItem type="box" setDragType={setDragType} />
            <ToolItem type="sphere" setDragType={setDragType} />
            <ToolItem type="cone" setDragType={setDragType} />
        </div>
    )
}
