import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import SceneObject, { SceneObjectData } from './SceneObject'
import { ShapeType } from '../../types/Editor'
import { useDirectory } from '../contexts/DirectoryContext'

interface ViewportProps {
    dragType: ShapeType | null
    setDragType: (v: ShapeType | null) => void
}

const LightsAndHelpers = () => (
    <>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <gridHelper args={[20, 20, 0x2a2a2a, 0x333333]} />
        <OrbitControls makeDefault />
    </>
)

const SceneCanvas = ({ objects, updateObject, deleteObject, editable }: { objects: SceneObjectData[], updateObject: (o: SceneObjectData) => void, deleteObject: (id: number) => void, editable: boolean }) => (
    <Canvas camera={{ position: [4, 4, 6] }}>
        <LightsAndHelpers />
        {objects.map(obj => (
            <SceneObject key={obj.id} data={obj} onChange={updateObject} onDelete={() => deleteObject(obj.id)} editable={editable} />
        ))}
    </Canvas>
)

export default function Viewport({ dragType, setDragType }: ViewportProps) {
    const [objects, setObjects] = useState<SceneObjectData[]>([])
    const { selectedDirectoryId } = useDirectory()

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (!dragType || !selectedDirectoryId) return
        const newObj: SceneObjectData = { id: Date.now(), type: dragType, position: [0, 0, 0], color: '#ffffff', text: 'Text', directoryId: selectedDirectoryId }
        setObjects(prev => [...prev, newObj])
        setDragType(null)
    }

    const updateObject = (newObj: SceneObjectData) => setObjects(list => list.map(o => (o.id === newObj.id ? newObj : o)))
    const deleteObject = (id: number) => setObjects(list => list.filter(o => o.id !== id))

    const filteredObjects = selectedDirectoryId ? objects.filter(obj => obj.directoryId === selectedDirectoryId) : []
    const editable = selectedDirectoryId !== null

    return (
        <div style={{ flex: 1, backgroundColor: '#111' }} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
            <SceneCanvas objects={filteredObjects} updateObject={updateObject} deleteObject={deleteObject} editable={editable} />
        </div>
    )
}
