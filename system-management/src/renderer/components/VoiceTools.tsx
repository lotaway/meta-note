import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAudio } from '../contexts/AudioContext';
import { AudioSourceType } from '../types/Audio';
import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../../main/constants';

const API_BASE_URL = `http://localhost:${import.meta.env.VITE_WEB_SERVER_PORT || '5051'}`;

const Container = styled.div<{ $minimal?: boolean }>`
  background-color: ${props => props.$minimal ? 'transparent' : '#2a2a2a'};
  padding: ${props => props.$minimal ? '0' : '15px'};
  border-radius: 8px;
  border: ${props => props.$minimal ? 'none' : '1px solid #444'};
`;

const Title = styled.h2`
  margin-top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2em;
  color: #007aff;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'success' | 'secondary' }>`
  background-color: ${props => {
    switch (props.$variant) {
      case 'danger': return '#e74c3c';
      case 'success': return '#2ecc71';
      case 'secondary': return '#34495e';
      default: return '#44aa88';
    }
  }};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 10px;
  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 0.9em;
  color: white;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  border-radius: 4px;
  margin-bottom: 15px;
`;

const TranscriptDisplay = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: #1e1e1e;
  border-radius: 4px;
  min-height: 50px;
  max-height: 150px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.9em;
  color: white;
`;

const FileInput = styled.input`
    margin-top: 10px;
    width: 100%;
    color: white;
`

const IconButton = styled.button`
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.2em;
    padding: 5px;
    &:hover {
        opacity: 0.8;
    }
`

const VisualizerCanvas = styled.canvas`
    width: 100%;
    height: 60px;
    background: #000;
    border-radius: 4px;
    margin-bottom: 15px;
    border: 1px solid #333;
`

const AudioVisualizer = ({ analyser }: { analyser: AnalyserNode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !analyser) return
        
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set internal resolution matches CSS size for sharpness
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        let animationId: number

        const draw = () => {
            animationId = requestAnimationFrame(draw)
            analyser.getByteFrequencyData(dataArray)
            
            ctx.fillStyle = '#1a1a1a'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            const barWidth = (canvas.width / bufferLength) * 2.5
            let barHeight
            let x = 0
            
            for(let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height
                
                // Gradient color
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
                gradient.addColorStop(0, '#44aa88')
                gradient.addColorStop(1, '#66ccaa')
                ctx.fillStyle = gradient
                
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
                
                x += barWidth + 1
            }
        }
        
        draw()
        
        return () => cancelAnimationFrame(animationId)
    }, [analyser])

    return <VisualizerCanvas ref={canvasRef} />
}

interface VoiceToolsProps {
    mode: 'full' | 'compact';
    onClose?: () => void;
}

export default function VoiceTools({ mode, onClose }: VoiceToolsProps) {
    const {
        isStreaming,
        startRecording,
        stopRecording,
        availableSources,
        reloadSources,
        latestTranscript,
        requestTranscription,
        updateTranscript,
        analyser
    } = useAudio();

    const [activeAudioSourceType, setActiveAudioSourceType] = useState<AudioSourceType>(AudioSourceType.Mic);
    const [selectedAudioSourceId, setSelectedAudioSourceId] = useState<string>('');
    const [ttsModelStatus, setTtsModelStatus] = useState<{ ready: boolean, version: string } | null>(null);
    const [appWorkerStatus, setAppWorkerStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [currentDownloadProgress, setCurrentDownloadProgress] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const checkTtsStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tts/status`);
            const result = await response.json();
            if (result.code === 200) {
                setTtsModelStatus(result.data);
            }
        } catch (err) {
            console.error('Check TTS status failed', err);
        }
    }, []);

    const handleDownloadModel = async () => {
        setAppWorkerStatus('processing');
        setCurrentDownloadProgress(0);

        const eventSource = new EventSource(`${API_BASE_URL}/api/tts/download`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.progress !== undefined) {
                setCurrentDownloadProgress(data.progress);
            }
            if (data.status === 'success') {
                eventSource.close();
                checkTtsStatus();
                setAppWorkerStatus('idle');
                setCurrentDownloadProgress(100);
            }
            if (data.status === 'error') {
                eventSource.close();
                setAppWorkerStatus('failed');
                setErrorMessage(data.message);
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            setAppWorkerStatus('failed');
            setErrorMessage('Connection to download stream lost');
        };
    };

    const handleDeleteModel = async () => {
        if (!confirm('Are you sure you want to delete the TTS model?')) return;
        setAppWorkerStatus('processing');
        try {
            const response = await fetch(`${API_BASE_URL}/api/tts/delete`, { method: 'POST' });
            if (response.ok) {
                await checkTtsStatus();
                setAppWorkerStatus('idle');
            }
        } catch (err) {
            setAppWorkerStatus('failed');
        }
    };

    const handlePlayTTS = async (text: string) => {
        if (!ttsModelStatus?.ready) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/tts/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    voice_profile_id: 'default'
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.play();
            }
        } catch (err) {
            console.error('TTS Playback failed', err);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const text = await requestTranscription(file);
                updateTranscript(text);
            } catch (err: any) {
                setErrorMessage(err.message);
            }
        }
    }

    useEffect(() => {
        checkTtsStatus();
    }, [checkTtsStatus]);

    const renderModelStatus = () => (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
             {/* Only show TTS management in compact/VideoNote mode or if explicitly requested */}
             {mode === 'compact' && (
                <>
                {ttsModelStatus?.ready ? (
                    <Button $variant="danger" onClick={handleDeleteModel} disabled={appWorkerStatus === 'processing'} style={{fontSize: '12px', padding: '5px 10px'}}>
                        Delete TTS
                    </Button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                        <Button $variant="primary" onClick={handleDownloadModel} disabled={appWorkerStatus === 'processing'} style={{fontSize: '12px', padding: '5px 10px'}}>
                            {appWorkerStatus === 'processing' ? `Downloading ${currentDownloadProgress}%` : 'Download TTS Model'}
                        </Button>
                        {appWorkerStatus === 'processing' && (
                            <div style={{ width: '100%', height: '2px', background: '#444', borderRadius: '1px', overflow: 'hidden' }}>
                                <div style={{ width: `${currentDownloadProgress}%`, height: '100%', background: '#44aa88', transition: 'width 0.3s' }} />
                            </div>
                        )}
                    </div>
                )}
                </>
             )}
        </div>
    )

    const renderSourceSelection = () => (
        <>
            <Label>Audio Source</Label>
            <Select
                value={activeAudioSourceType}
                onChange={e => {
                    const type = e.target.value as AudioSourceType;
                    setActiveAudioSourceType(type);
                    if (type === AudioSourceType.System) reloadSources();
                }}
            >
                <option value={AudioSourceType.Mic}>🎤 Microphone</option>
                <option value={AudioSourceType.System}>🔊 System Audio</option>
            </Select>

            {activeAudioSourceType === AudioSourceType.System && (
                <>
                    <Label>Select Window/Screen</Label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <Select
                            value={selectedAudioSourceId}
                            onChange={e => setSelectedAudioSourceId(e.target.value)}
                            style={{ marginBottom: '15px' }}
                        >
                            <option value="">Choose source...</option>
                            {availableSources.map(source => (
                                <option key={source.id} value={source.id}>{source.name}</option>
                            ))}
                        </Select>
                        <IconButton onClick={reloadSources} title="Refresh Sources">🔄</IconButton>
                    </div>
                </>
            )}
        </>
    )

    return (
        <Container $minimal={mode === 'compact'}>
            {mode === 'full' && (
                <Title>
                    Voice Control
                    {onClose && <IconButton onClick={onClose}>▼</IconButton>}
                </Title>
            )}

            {renderModelStatus()}
            {renderSourceSelection()}

            {(isStreaming && analyser) && <AudioVisualizer analyser={analyser} />}

            <div style={{ display: 'flex', flexDirection: mode === 'full' ? 'column' : 'row', gap: '10px' }}>
                {!isStreaming ? (
                    <Button 
                        $variant="primary" 
                        onClick={() => startRecording(selectedAudioSourceId, activeAudioSourceType)}
                        style={{ width: mode === 'full' ? '100%' : 'auto' }}
                        disabled={activeAudioSourceType === AudioSourceType.System && !selectedAudioSourceId}
                    >
                        Start Recording
                    </Button>
                ) : (
                    <Button 
                        $variant="danger" 
                        onClick={stopRecording}
                        style={{ width: mode === 'full' ? '100%' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                         <span style={{ 
                            display: 'inline-block', 
                            width: '10px', 
                            height: '10px', 
                            background: 'white', 
                            borderRadius: '50%',
                            animation: 'pulse 1s infinite'
                        }} />
                        Stop Recording
                    </Button>
                )}
                
                <Button 
                    $variant="success" 
                    onClick={() => ipcRenderer.send(IPC_CHANNELS.SUBTITLES_OPEN)}
                    style={{ width: mode === 'full' ? '100%' : 'auto' }}
                >
                    Subtitles
                </Button>

                {mode === 'compact' && (
                    <Button 
                        $variant="secondary" 
                        onClick={() => handlePlayTTS(latestTranscript)} 
                        disabled={!latestTranscript || !ttsModelStatus?.ready}
                    >
                        Read Last Text
                    </Button>
                )}
            </div>

            {mode === 'full' && (
                <div style={{ marginTop: '15px', borderTop: '1px solid #444', paddingTop: '15px' }}>
                    <Label>Upload File</Label>
                    <FileInput type="file" accept="audio/*,video/*" onChange={handleFileChange} />
                </div>
            )}
            
            {(latestTranscript && mode === 'compact') && (
                 <TranscriptDisplay>
                    <strong>Subtitles Content:</strong><br/>
                    {latestTranscript}
                </TranscriptDisplay>
            )}

            {errorMessage && <p style={{ color: '#e74c3c', fontSize: '0.9em' }}>{errorMessage}</p>}
        </Container>
    );
}
