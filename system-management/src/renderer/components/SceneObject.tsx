import React, { useRef, useState } from 'react'
import { TransformControls, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { ShapeType } from '../../types/Editor'
import SceneObjectUI from './SceneObjectUI'

export interface SceneObjectData {
    id: number
    type: ShapeType
    position: [number, number, number]
    color: string
    text: string
    directoryId: number
}

const Geometry = ({ type }: { type: ShapeType }) => {
    if (type === 'box') return <boxGeometry />
    if (type === 'sphere') return <sphereGeometry args={[0.5, 32, 32]} />
    return <coneGeometry args={[0.5, 1, 32]} />
}

const SceneLabel = ({ position, text }: { position: [number, number, number], text: string }) => (
    <Billboard position={[position[0], position[1] - 0.9, position[2]]}>
        <Text fontSize={0.2} color="white" anchorX="center" anchorY="middle">
            {text}
        </Text>
    </Billboard>
)

const MeshGroup = React.forwardRef<THREE.Mesh, { data: SceneObjectData; onClick: (e: any) => void }>(
    ({ data, onClick }, ref) => (
        <mesh ref={ref} position={data.position} onClick={onClick}>
            <Geometry type={data.type} />
            <meshStandardMaterial color={data.color} />
        </mesh>
    )
)

export default function SceneObject({ data, onChange, onDelete, editable }: { data: SceneObjectData; onChange: (v: SceneObjectData) => void; onDelete: () => void; editable: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [active, setActive] = useState(false)

    const handleUpdate = () => meshRef.current && onChange({ ...data, position: meshRef.current.position.toArray() as [number, number, number] })
    const toggleActive = (e: any) => {
        if (!editable) return
        e.stopPropagation()
        setActive(v => !v)
    }
    const handleTextChange = (text: string) => {
        if (!editable) return
        onChange({ ...data, text })
    }
    const handleColorChange = (color: string) => {
        if (!editable) return
        onChange({ ...data, color })
    }

    return (
        <>
            <TransformControls object={active && editable ? meshRef.current : undefined} onMouseUp={handleUpdate}>
                <group>
                    <MeshGroup ref={meshRef} data={data} onClick={toggleActive} />
                    <SceneLabel position={data.position} text={data.text} />
                </group>
            </TransformControls>
            {editable && (
                <SceneObjectUI
                    active={active}
                    position={data.position}
                    text={data.text}
                    color={data.color}
                    onTextChange={handleTextChange}
                    onColorChange={handleColorChange}
                    onDelete={onDelete}
                    meshRef={meshRef}
                />
            )}
        </>
    )
}
