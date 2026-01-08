import React, { useState, useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { SketchPicker, ColorResult } from 'react-color'

interface SceneObjectUIProps {
    active: boolean
    position: [number, number, number]
    text: string
    color: string
    onTextChange: (text: string) => void
    onColorChange: (color: string) => void
    onDelete: () => void
    meshRef: React.RefObject<THREE.Mesh>
}

export default function SceneObjectUI({ active, position, text, color, onTextChange, onColorChange, onDelete, meshRef }: SceneObjectUIProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
    const [editText, setEditText] = useState(text)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setEditText(text)
    }, [text])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    if (!active) return null

    const handleTextDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsEditing(true)
    }

    const handleTextSubmit = () => {
        onTextChange(editText)
        setIsEditing(false)
    }

    const handleTextCancel = () => {
        setEditText(text)
        setIsEditing(false)
    }

    const handleColorChange = (colorResult: ColorResult) => {
        onColorChange(colorResult.hex)
    }

    return (
        <>
            <Html position={[position[0], position[1] - 0.9, position[2]]} center>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                        onDoubleClick={handleTextDoubleClick}
                        style={{
                            padding: '2px 6px',
                            backgroundColor: 'rgba(42, 42, 42, 0.8)',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: 4,
                            fontSize: '12px',
                            cursor: 'pointer',
                            minWidth: 100,
                            textAlign: 'center',
                            pointerEvents: 'auto'
                        }}
                    >
                        {text || 'Double click to edit'}
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button
                            onClick={e => { e.stopPropagation(); setIsColorPickerOpen(!isColorPickerOpen) }}
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                border: '1px solid #666',
                                backgroundColor: color,
                                cursor: 'pointer',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                            title="Change Color"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute' }}>
                                <path d="M7 1L9 5H13L10 8L12 12L7 9L2 12L4 8L1 5H5L7 1Z" fill="white" opacity="0.8" />
                            </svg>
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); onDelete() }}
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: '1px solid #ff4444',
                                backgroundColor: '#ff4444',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                lineHeight: 1,
                                padding: 0,
                                margin: 0
                            }}
                            title="Delete"
                        >
                            ×
                        </button>
                    </div>
                </div>
            </Html>
            {isColorPickerOpen && (
                <Html position={[position[0], position[1], position[2]]} center>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 9999,
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={e => { e.stopPropagation(); setIsColorPickerOpen(false) }}
                    >
                        <div
                            style={{
                                pointerEvents: 'auto',
                                zIndex: 10000
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <SketchPicker color={color} onChange={handleColorChange} />
                        </div>
                    </div>
                </Html>
            )}
            {isEditing && (
                <Html position={[position[0], position[1], position[2]]} center>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 9999,
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={handleTextCancel}
                    >
                        <div
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '2px solid #44aa88',
                                borderRadius: 8,
                                padding: '16px',
                                zIndex: 10000,
                                pointerEvents: 'auto',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                                minWidth: 300
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ marginBottom: '12px', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>Edit Text</div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleTextSubmit()
                                    if (e.key === 'Escape') handleTextCancel()
                                }}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #555',
                                    color: '#fff',
                                    borderRadius: 4,
                                    fontSize: '14px',
                                    marginBottom: '12px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleTextCancel}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#666',
                                        border: 'none',
                                        color: '#fff',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTextSubmit}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#44aa88',
                                        border: 'none',
                                        color: '#fff',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </Html>
            )}
        </>
    )
}