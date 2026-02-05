import React, { useState } from 'react'
import styled from 'styled-components'
import { useAudio } from '../contexts/AudioContext'
import { ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../../main/constants'
import { AudioSourceType } from '../types/Audio'

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

const Select = styled.select`
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    border-radius: 4px;
`

const Button = styled.button`
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: bold;
    margin-right: 10px;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.9;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`

const PrimaryButton = styled(Button)`
    background: #007aff;
    color: white;
`

const DangerButton = styled(Button)`
    background: #ff3b30;
    color: white;
`

const SuccessButton = styled(Button)`
    background: #34c759;
    color: white;
`

const FileInput = styled.input`
    margin-top: 10px;
    width: 100%;
`

export default function AudioControlPanel() {
    const { 
        isStreaming, 
        startRecording, 
        stopRecording, 
        requestTranscription, 
        availableSources, 
        reloadSources,
        updateTranscript
    } = useAudio()
    
    const [sourceType, setSourceType] = useState<AudioSourceType>(AudioSourceType.Mic)
    const [selectedSourceId, setSelectedSourceId] = useState<string>('')
    const [isExpanded, setIsExpanded] = useState(true)

    const handleStart = async () => {
        await startRecording(selectedSourceId, sourceType)
    }

    const handleOpenSubtitles = () => {
        ipcRenderer.send(IPC_CHANNELS.SUBTITLES_OPEN)
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const text = await requestTranscription(file)
            updateTranscript(text)
        }
    }

    return (
        <PanelContainer>
            <Title>
                Voice Transcription
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                    {isExpanded ? '▼' : '▲'}
                </button>
            </Title>
            
            {isExpanded && (
                <>
                    <div>
                        <label>Source Type:</label>
                        <Select 
                            value={sourceType} 
                            onChange={e => {
                                const type = e.target.value as AudioSourceType
                                setSourceType(type)
                                if (type === AudioSourceType.System) reloadSources()
                            }}
                        >
                            <option value={AudioSourceType.Mic}>🎤 Microphone</option>
                            <option value={AudioSourceType.System}>🔊 System Audio</option>
                        </Select>
                    </div>

                    {sourceType === AudioSourceType.System && (
                        <div>
                            <Select 
                                value={selectedSourceId} 
                                onChange={e => setSelectedSourceId(e.target.value)}
                            >
                                <option value="">Select Window/Screen...</option>
                                {availableSources.map(source => (
                                    <option key={source.id} value={source.id}>
                                        {source.name}
                                    </option>
                                ))}
                            </Select>
                            <Button onClick={reloadSources} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)' }}>
                                Refresh Sources
                            </Button>
                        </div>
                    )}

                    <div style={{ marginTop: '15px' }}>
                        {!isStreaming ? (
                            <PrimaryButton onClick={handleStart} disabled={sourceType === AudioSourceType.System && !selectedSourceId}>
                                Start Recording
                            </PrimaryButton>
                        ) : (
                            <DangerButton onClick={stopRecording}>
                                Stop Recording
                            </DangerButton>
                        )}
                        
                        <SuccessButton onClick={handleOpenSubtitles}>
                            Open Subtitles
                        </SuccessButton>
                    </div>

                    <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                        <label>Upload Local File (Audio/Video):</label>
                        <FileInput type="file" accept="audio/*,video/*" onChange={handleFileChange} />
                    </div>
                </>
            )}
        </PanelContainer>
    )
}
