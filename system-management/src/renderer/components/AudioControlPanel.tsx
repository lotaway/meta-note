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

const Title = styled.h3`
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const FileInput = styled.input`
    margin-top: 10px;
    width: 100%;
`

export default function AudioControlPanel() {
    const [isExpanded, setIsExpanded] = useState(true)

    return (
        <PanelContainer>
            <Title>
                Voice Control
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                    {isExpanded ? '▼' : '▲'}
                </button>
            </Title>
            
            {isExpanded && <VoiceTools />}
        </PanelContainer>
    )
}
