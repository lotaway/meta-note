import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import SceneObject, { SceneObjectData } from './SceneObject'
import { ShapeType } from '../../types/Editor'

interface ViewportProps {
    dragType: ShapeType | null
    setDragType: (v: ShapeType | null) => void
}

const LightsAndHelpers = () => (
    <>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <gridHelper args={[20, 20, 0x444444, 0x222222]} />
        <OrbitControls makeDefault />
    </>
)

const SceneCanvas = ({ objects, updateObject }: { objects: SceneObjectData[], updateObject: (o: SceneObjectData) => void }) => (
    <Canvas camera={{ position: [4, 4, 6] }}>
        <LightsAndHelpers />
        {objects.map(obj => (
            <SceneObject key={obj.id} data={obj} onChange={updateObject} />
        ))}
    </Canvas>
)

export default function Viewport({ dragType, setDragType }: ViewportProps) {
    const [objects, setObjects] = useState<SceneObjectData[]>([])

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (!dragType) return
        const newObj: SceneObjectData = { id: Date.now(), type: dragType, position: [0, 0, 0], color: '#44aa88', text: 'Text' }
        setObjects(prev => [...prev, newObj])
        setDragType(null)
    }

    const updateObject = (newObj: SceneObjectData) => setObjects(list => list.map(o => (o.id === newObj.id ? newObj : o)))

    return (
        <div style={{ flex: 1, backgroundColor: '#111' }} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
            <SceneCanvas objects={objects} updateObject={updateObject} />
        </div>
    )
}
