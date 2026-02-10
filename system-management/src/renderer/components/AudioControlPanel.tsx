import React, { useState } from 'react'
import styled from 'styled-components'
import VoiceTools from './VoiceTools'

const PanelContainer = styled.div`
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(30, 30, 30, 0.95);
    padding: 20px;
    border-radius: 12px;
    color: white;
    width: 300px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    z-index: 1000;
    border: 1px solid rgba(255,255,255,0.1);
`

const CompactButton = styled.button`
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background: #007aff;
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    z-index: 1000;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background: #0062cc;
    }
`

export default function AudioControlPanel() {
    const [isExpanded, setIsExpanded] = useState(true)

    if (!isExpanded) {
        return (
            <CompactButton onClick={() => setIsExpanded(true)} title="Open Voice Control">
                🎤
            </CompactButton>
        )
    }

    return (
        <PanelContainer>
            <VoiceTools 
                mode="full" 
                onClose={() => setIsExpanded(false)} 
            />
        </PanelContainer>
    )
}
