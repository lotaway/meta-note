import React, { useState, useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { SketchPicker, ColorResult } from 'react-color'
import styled from 'styled-components'

const UIContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

const LabelBox = styled.div`
  padding: 2px 6px;
  background-color: rgba(42, 42, 42, 0.8);
  border: 1px solid #444;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  min-width: 100px;
  text-align: center;
  pointer-events: auto;
  &:hover {
    border-color: #666;
  }
`

const ActionRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`

const IconButton = styled.button<{ $bgColor?: string; $borderColor?: string; $round?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: ${props => props.$round ? '50%' : '4px'};
  border: 1px solid ${props => props.$borderColor || '#666'};
  background-color: ${props => props.$bgColor || '#2a2a2a'};
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: flex;
  alignItems: center;
  justifyContent: center;
  position: relative;
  color: #fff;
  transition: transform 0.1s;
  &:hover {
    transform: scale(1.1);
  }
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ModalContent = styled.div`
  background-color: #2a2a2a;
  border: 2px solid #44aa88;
  border-radius: 8px;
  padding: 16px;
  z-index: 10000;
  pointer-events: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  min-width: 300px;
`

const ModalTitle = styled.div`
  margin-bottom: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
`

const TextInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  background-color: #1a1a1a;
  border: 1px solid #555;
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 12px;
  box-sizing: border-box;
  &:focus {
    border-color: #44aa88;
    outline: none;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`

const TextButton = styled.button<{ $primary?: boolean }>`
  padding: 6px 12px;
  background-color: ${props => props.$primary ? '#44aa88' : '#666'};
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  &:hover {
    opacity: 0.9;
  }
`

interface SceneObjectUIProps {
    active: boolean
    position: [number, number, number]
    text: string
    color: string
    onTextChange: (text: string) => void
    onColorChange: (color: string) => void
    onDelete: () => void
    onLinkStart: () => void
    meshRef: React.RefObject<THREE.Mesh>
}

export default function SceneObjectUI({ active, position, text, color, onTextChange, onColorChange, onDelete, onLinkStart, meshRef }: SceneObjectUIProps) {
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
                <UIContainer>
                    <LabelBox onDoubleClick={handleTextDoubleClick}>
                        {text || 'Double click to edit'}
                    </LabelBox>
                    <ActionRow>
                        <IconButton
                            onClick={e => { e.stopPropagation(); onLinkStart() }}
                            $borderColor="#44aa88"
                            title="Link to other object"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#44aa88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </IconButton>
                        <IconButton
                            onClick={e => { e.stopPropagation(); setIsColorPickerOpen(!isColorPickerOpen) }}
                            $bgColor={color}
                            title="Change Color"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute' }}>
                                <path d="M7 1L9 5H13L10 8L12 12L7 9L2 12L4 8L1 5H5L7 1Z" fill="white" opacity="0.8" />
                            </svg>
                        </IconButton>
                        <IconButton
                            onClick={e => { e.stopPropagation(); onDelete() }}
                            $bgColor="#ff4444"
                            $borderColor="#ff4444"
                            $round
                            title="Delete"
                        >
                            <span style={{ fontSize: '16px', lineHeight: 1 }}>×</span>
                        </IconButton>
                    </ActionRow>
                </UIContainer>
            </Html>
            {isColorPickerOpen && (
                <Html position={[position[0], position[1], position[2]]} center>
                    <Overlay onClick={e => { e.stopPropagation(); setIsColorPickerOpen(false) }}>
                        <div onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                            <SketchPicker color={color} onChange={handleColorChange} />
                        </div>
                    </Overlay>
                </Html>
            )}
            {isEditing && (
                <Html position={[position[0], position[1], position[2]]} center>
                    <Overlay onClick={handleTextCancel}>
                        <ModalContent onClick={e => e.stopPropagation()}>
                            <ModalTitle>Edit Text</ModalTitle>
                            <TextInput
                                ref={inputRef}
                                type="text"
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleTextSubmit()
                                    if (e.key === 'Escape') handleTextCancel()
                                }}
                                onClick={e => e.stopPropagation()}
                            />
                            <ButtonGroup>
                                <TextButton onClick={handleTextCancel}>Cancel</TextButton>
                                <TextButton $primary onClick={handleTextSubmit}>OK</TextButton>
                            </ButtonGroup>
                        </ModalContent>
                    </Overlay>
                </Html>
            )}
        </>
    )
}