import React, { useState, useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'

interface SceneObjectUIProps {
    active: boolean
    position: [number, number, number]
    text: string
    onTextChange: (text: string) => void
    onDelete: () => void
}

export default function SceneObjectUI({ active, position, text, onTextChange, onDelete }: SceneObjectUIProps) {
    const [isEditing, setIsEditing] = useState(false)
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

    const handleTextClick = (e: React.MouseEvent) => {
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

    return (
        <Html position={[position[0], position[1] + 0.8, position[2]]} center>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
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
                        marginBottom: 4
                    }}
                    title="Delete"
                >
                    ×
                </button>
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleTextSubmit()
                            if (e.key === 'Escape') handleTextCancel()
                        }}
                        onBlur={handleTextSubmit}
                        onClick={e => e.stopPropagation()}
                        style={{
                            padding: '2px 6px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #44aa88',
                            color: '#fff',
                            borderRadius: 4,
                            fontSize: '12px',
                            minWidth: 100
                        }}
                    />
                ) : (
                    <div
                        onClick={handleTextClick}
                        style={{
                            padding: '2px 6px',
                            backgroundColor: 'rgba(42, 42, 42, 0.8)',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: 4,
                            fontSize: '12px',
                            cursor: 'pointer',
                            minWidth: 100,
                            textAlign: 'center'
                        }}
                    >
                        {text || 'Click to edit'}
                    </div>
                )}
            </div>
        </Html>
    )
}