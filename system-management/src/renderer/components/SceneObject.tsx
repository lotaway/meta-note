import React, { useRef, useState } from 'react'
import { TransformControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { ShapeType } from './types'

export interface SceneObjectData {
    id: number
    type: ShapeType
    position: [number, number, number]
    color: string
    text: string
}

const Geometry = ({ type }: { type: ShapeType }) => {
    if (type === 'box') return <boxGeometry />
    if (type === 'sphere') return <sphereGeometry args={[0.5, 32, 32]} />
    return <coneGeometry args={[0.5, 1, 32]} />
}

const SceneLabel = ({ position, text }: { position: [number, number, number], text: string }) => (
    <Text position={[position[0], position[1] - 0.9, position[2]]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
        {text}
    </Text>
)

// Wrapper to attach the ref to the mesh for TransformControls to find
const MeshGroup = React.forwardRef<THREE.Mesh, { data: SceneObjectData; onClick: (e: any) => void; onMaterialClick: (e: any) => void }>(
    ({ data, onClick, onMaterialClick }, ref) => (
        <mesh ref={ref} position={data.position} onClick={onClick}>
            <Geometry type={data.type} />
            <meshStandardMaterial color={data.color} onClick={onMaterialClick} />
        </mesh>
    )
)

export default function SceneObject({ data, onChange }: { data: SceneObjectData; onChange: (v: SceneObjectData) => void }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [active, setActive] = useState(false)

    const handleUpdate = () => meshRef.current && onChange({ ...data, position: meshRef.current.position.toArray() as [number, number, number] })
    const toggleActive = (e: any) => { e.stopPropagation(); setActive(v => !v) }
    const changeColor = (e: any) => { e.stopPropagation(); onChange({ ...data, color: '#' + Math.random().toString(16).slice(2, 8).padEnd(6, '0') }) }

    return (
        <TransformControls object={active ? meshRef.current : undefined} onMouseUp={handleUpdate}>
            <group>
                <MeshGroup ref={meshRef} data={data} onClick={toggleActive} onMaterialClick={changeColor} />
                <SceneLabel position={data.position} text={data.text} />
            </group>
        </TransformControls>
    )
}
