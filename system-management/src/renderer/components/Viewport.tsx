import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, QuadraticBezierLine } from '@react-three/drei'
import SceneObject, { SceneObjectData } from './SceneObject'
import SceneConnection from './SceneConnection'
import { ShapeType } from '../../types/Editor'
import { useDirectory } from '../contexts/DirectoryContext'
import * as THREE from 'three'
import styled from 'styled-components'

const ViewportContainer = styled.div`
  flex: 1;
  background-color: #111;
`

export interface ConnectionData {
    id: number
    fromId: number
    toId: number
    directoryId: number
}

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

const SceneCanvas = ({
    objects,
    connections,
    updateObject,
    deleteObject,
    editable,
    selectedId,
    onSelect,
    onLinkStart,
    linkingSourceId,
    tempTargetPoint,
    onLinkingMove,
    selectedConnId,
    onSelectConn
}: {
    objects: SceneObjectData[],
    connections: ConnectionData[],
    updateObject: (o: SceneObjectData) => void,
    deleteObject: (id: number) => void,
    editable: boolean,
    selectedId: number | null,
    onSelect: (id: number | null) => void,
    onLinkStart: (id: number) => void,
    linkingSourceId: number | null,
    tempTargetPoint: [number, number, number] | null,
    onLinkingMove: (e: any) => void,
    selectedConnId: number | null,
    onSelectConn: (id: number | null) => void
}) => {
    const sourceObj = objects.find(o => o.id === linkingSourceId)

    return (
        <Canvas
            camera={{ position: [4, 4, 6] }}
            onPointerMissed={() => { onSelect(null); onSelectConn(null) }}
            onContextMenu={(e) => {
                if (linkingSourceId) {
                    e.nativeEvent.preventDefault()
                    onSelect(null)
                }
            }}
        >
            <LightsAndHelpers />

            {linkingSourceId && (
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0, 0]}
                    onPointerMove={onLinkingMove}
                >
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            )}

            {objects.map(obj => (
                <SceneObject
                    key={obj.id}
                    data={obj}
                    onChange={updateObject}
                    onDelete={() => deleteObject(obj.id)}
                    editable={editable}
                    selected={selectedId === obj.id}
                    onSelect={() => onSelect(obj.id)}
                    onLinkStart={() => onLinkStart(obj.id)}
                    highlighted={!!linkingSourceId && linkingSourceId !== obj.id}
                />
            ))}

            {connections.map(conn => {
                const from = objects.find(o => o.id === conn.fromId)
                const to = objects.find(o => o.id === conn.toId)
                if (!from || !to) return null
                return (
                    <SceneConnection
                        key={conn.id}
                        id={conn.id}
                        start={from.position}
                        end={to.position}
                        selected={selectedConnId === conn.id}
                        onClick={() => onSelectConn(conn.id)}
                    />
                )
            })}

            {linkingSourceId && sourceObj && tempTargetPoint && (
                <QuadraticBezierLine
                    start={sourceObj.position}
                    end={tempTargetPoint}
                    mid={[
                        (sourceObj.position[0] + tempTargetPoint[0]) / 2,
                        (sourceObj.position[1] + tempTargetPoint[1]) / 2 + 1.5,
                        (sourceObj.position[2] + tempTargetPoint[2]) / 2
                    ]}
                    color="#44aa88"
                    dashed
                    lineWidth={2}
                />
            )}
        </Canvas>
    )
}

export default function Viewport({ dragType, setDragType }: ViewportProps) {
    const [objects, setObjects] = useState<SceneObjectData[]>([])
    const [connections, setConnections] = useState<ConnectionData[]>([])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [selectedConnId, setSelectedConnId] = useState<number | null>(null)
    const [linkingSourceId, setLinkingSourceId] = useState<number | null>(null)
    const [tempTargetPoint, setTempTargetPoint] = useState<[number, number, number] | null>(null)

    const { selectedDirectoryId } = useDirectory()

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (!dragType || !selectedDirectoryId) return
        const newObj: SceneObjectData = { id: Date.now(), type: dragType, position: [0, 0, 0], color: '#ffffff', text: 'Text', directoryId: selectedDirectoryId }
        setObjects(prev => [...prev, newObj])
        setDragType(null)
    }

    const updateObject = (newObj: SceneObjectData) => setObjects(list => list.map(o => (o.id === newObj.id ? newObj : o)))
    const deleteObject = (id: number) => {
        setObjects(list => list.filter(o => o.id !== id))
        setConnections(list => list.filter(c => c.fromId !== id && c.toId !== id))
        if (selectedId === id) setSelectedId(null)
    }

    const handleSelect = (id: number | null) => {
        if (linkingSourceId && id && linkingSourceId !== id) {
            // Check if connection already exists
            const exists = connections.some(c =>
                (c.fromId === linkingSourceId && c.toId === id) ||
                (c.fromId === id && c.toId === linkingSourceId)
            )
            if (!exists && selectedDirectoryId) {
                const newConn: ConnectionData = {
                    id: Date.now(),
                    fromId: linkingSourceId,
                    toId: id,
                    directoryId: selectedDirectoryId
                }
                setConnections(prev => [...prev, newConn])
            }
            setLinkingSourceId(null)
            setTempTargetPoint(null)
            return
        }

        setSelectedId(id)
        setSelectedConnId(null)
        if (linkingSourceId && !id) {
            setLinkingSourceId(null)
            setTempTargetPoint(null)
        }
    }

    const handleLinkStart = (id: number) => {
        setLinkingSourceId(id)
        setSelectedId(null)
    }

    const handleLinkingMove = (e: any) => {
        if (linkingSourceId) {
            setTempTargetPoint([e.point.x, e.point.y, e.point.z])
        }
    }

    const filteredObjects = selectedDirectoryId ? objects.filter(obj => obj.directoryId === selectedDirectoryId) : []
    const filteredConnections = selectedDirectoryId ? connections.filter(conn => conn.directoryId === selectedDirectoryId) : []
    const editable = selectedDirectoryId !== null

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedConnId) {
                    setConnections(prev => prev.filter(c => c.id !== selectedConnId))
                    setSelectedConnId(null)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedConnId])

    return (
        <ViewportContainer onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
            <SceneCanvas
                objects={filteredObjects}
                connections={filteredConnections}
                updateObject={updateObject}
                deleteObject={deleteObject}
                editable={editable}
                selectedId={selectedId}
                onSelect={handleSelect}
                onLinkStart={handleLinkStart}
                linkingSourceId={linkingSourceId}
                tempTargetPoint={tempTargetPoint}
                onLinkingMove={handleLinkingMove}
                selectedConnId={selectedConnId}
                onSelectConn={setSelectedConnId}
            />
        </ViewportContainer>
    )
}
