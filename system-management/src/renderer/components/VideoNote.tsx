import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAudio } from '../contexts/AudioContext';
import { AudioSourceType } from '../types/Audio';
import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../../main/constants';

const API_BASE_URL = `http://localhost:${import.meta.env.VITE_WEB_SERVER_PORT || '5051'}`

const NoteContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background-color: #1e1e1e;
  color: #fff;
  overflow-y: auto;
`;

const FormSection = styled.div`
  margin-bottom: 20px;
  background-color: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
`;

const TranscriptionSection = styled.div`
  margin-bottom: 20px;
  background-color: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #444;
`;

const Title = styled.h2`
  margin-top: 0;
  color: #44aa88;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InputGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 0.9em;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  background: #333;
  border: 1px solid #444;
  color: white;
  border-radius: 4px;
  box-sizing: border-box;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  background: #333;
  border: 1px solid #444;
  color: white;
  border-radius: 4px;
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

const ResultSection = styled.div`
  flex: 1;
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  overflow-y: auto;
  line-height: 1.6;
  position: relative;

  pre {
    background: #1e1e1e;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
`;

const TTSButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(68, 170, 136, 0.2);
  border: 1px solid #44aa88;
  color: #44aa88;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  &:hover {
    background: rgba(68, 170, 136, 0.4);
  }
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
`;

export default function VideoNote() {
    const { 
        isStreaming, 
        startRecording, 
        stopRecording, 
        availableSources, 
        reloadSources,
        latestTranscript
    } = useAudio();

    const [videoUrl, setVideoUrl] = useState('');
    const [style, setStyle] = useState('detailed');
    const [useScreenshot, setUseScreenshot] = useState(false);
    const [useVideoUnderstanding, setUseVideoUnderstanding] = useState(false);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [markdown, setMarkdown] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Transcription States
    const [sourceType, setSourceType] = useState<AudioSourceType>(AudioSourceType.Mic);
    const [selectedSourceId, setSelectedSourceId] = useState<string>('');
    const [isTranscribingVisible, setIsTranscribingVisible] = useState(false);
    const [modelStatus, setModelStatus] = useState<{ready: boolean, version: string} | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);

    const checkModelStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tts/status`);
            const result = await response.json();
            if (result.code === 200) {
                setModelStatus(result.data);
            }
        } catch (err) {
            console.error('Check model status failed', err);
        }
    }, []);

    const downloadModel = async () => {
        try {
            setStatus('processing');
            setDownloadProgress(0);
            
            const eventSource = new EventSource(`${API_BASE_URL}/api/tts/download`);
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.progress !== undefined) {
                        setDownloadProgress(data.progress);
                    }
                    if (data.status === 'success') {
                        eventSource.close();
                        checkModelStatus();
                        setStatus('idle');
                        setDownloadProgress(100);
                    }
                    if (data.status === 'error') {
                        eventSource.close();
                        console.error('Download error:', data.message);
                        setStatus('failed');
                        setError(data.message);
                    }
                } catch (e) {
                    console.error('Failed to parse download event', e);
                }
            };
            
            eventSource.onerror = (err) => {
                console.error('SSE Error:', err);
                eventSource.close();
                setStatus('failed');
                setError('Connection to download stream lost');
            };

        } catch (err) {
            console.error('Download model failed', err);
            setStatus('failed');
            setDownloadProgress(0);
        }
    };

    const deleteModel = async () => {
        if (!confirm('Are you sure you want to delete the TTS model?')) return;
        try {
            setStatus('processing');
            const response = await fetch(`${API_BASE_URL}/api/tts/delete`, { method: 'POST' });
            if (response.ok) {
                await checkModelStatus();
                setStatus('idle');
            }
        } catch (err) {
            console.error('Delete model failed', err);
            setStatus('failed');
        }
    };

    const generateNote = async () => {
        if (!videoUrl) return;
        setStatus('processing');
        setError(null);
        setMarkdown('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/note/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    video_url: videoUrl, 
                    style,
                    options: {
                        screenshot: useScreenshot,
                        videoUnderstanding: useVideoUnderstanding
                    }
                })
            });
            const result = await response.json();
            if (result.code === 200) {
                setTaskId(result.data.task_id);
            } else {
                throw new Error(result.message);
            }
        } catch (err: any) {
            setStatus('failed');
            setError(err.message);
        }
    };

    const handleStartRecording = async () => {
        await startRecording(selectedSourceId, sourceType);
    };

    const handleOpenSubtitles = () => {
        ipcRenderer.send(IPC_CHANNELS.SUBTITLES_OPEN);
    };

    const playTTS = async (text: string) => {
        if (!modelStatus?.ready) {
            alert('Please download the TTS model first.');
            return;
        }
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
            } else {
                const err = await response.json();
                alert(`TTS Error: ${err.message}`);
            }
        } catch (err) {
            console.error('TTS Playback failed', err);
        }
    };

    useEffect(() => {
        checkModelStatus();
    }, [checkModelStatus]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
// ... (rest of the file remains similar)
        if (taskId && status === 'processing') {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/note/status/${taskId}`);
                    const result = await response.json();
                    if (result.code === 200) {
                        if (result.data.status === 'SUCCESS') {
                            setMarkdown(result.data.markdown);
                            setStatus('success');
                            setTaskId(null);
                        } else if (result.data.status === 'FAILED') {
                            setError(result.data.error);
                            setStatus('failed');
                            setTaskId(null);
                        }
                    }
                } catch (err) {
                    console.error('Polling failed', err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [taskId, status]);

    return (
        <NoteContainer>
            <Title>
                Video Note Generator
                <Button $variant="secondary" style={{ padding: '5px 10px', fontSize: '0.6em' }} onClick={() => setIsTranscribingVisible(!isTranscribingVisible)}>
                    {isTranscribingVisible ? 'Hide Voice Tools' : 'Show Voice Tools'}
                </Button>
            </Title>
            
            {isTranscribingVisible && (
                <TranscriptionSection>
                    <Title style={{ fontSize: '1.2em', color: '#007aff' }}>
                        Voice Transcription
                        <span style={{ fontSize: '0.6em', color: modelStatus?.ready ? '#2ecc71' : '#e74c3c' }}>
                            TTS Model: {modelStatus?.ready ? `Ready (${modelStatus.version})` : 'Missing'}
                        </span>
                    </Title>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        {modelStatus?.ready ? (
                            <Button $variant="danger" onClick={deleteModel} disabled={status === 'processing'}>
                                Delete TTS Model
                            </Button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <Button $variant="primary" onClick={downloadModel} disabled={status === 'processing'}>
                                    {status === 'processing' ? `Downloading ${downloadProgress}%` : 'Download TTS Model'}
                                </Button>
                                {status === 'processing' && (
                                    <div style={{ width: '100%', height: '4px', background: '#444', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${downloadProgress}%`, height: '100%', background: '#44aa88', transition: 'width 0.3s' }} />
                                    </div>
                                )}
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <Label>Source Type:</Label>
                            <Select 
                                value={sourceType} 
                                onChange={e => {
                                    const type = e.target.value as AudioSourceType;
                                    setSourceType(type);
                                    if (type === AudioSourceType.System) reloadSources();
                                }}
                            >
                                <option value={AudioSourceType.Mic}>Microphone</option>
                                <option value={AudioSourceType.System}>System Audio</option>
                            </Select>
                        </div>
                        {sourceType === AudioSourceType.System && (
                            <div style={{ flex: 2 }}>
                                <Label>Source:</Label>
                                <Select 
                                    value={selectedSourceId} 
                                    onChange={e => setSelectedSourceId(e.target.value)}
                                >
                                    <option value="">Select Screen/Window</option>
                                    {availableSources.map(source => (
                                        <option key={source.id} value={source.id}>{source.name}</option>
                                    ))}
                                </Select>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {!isStreaming ? (
                            <Button $variant="primary" onClick={handleStartRecording}>Start Recording</Button>
                        ) : (
                            <Button $variant="danger" onClick={stopRecording}>Stop Recording</Button>
                        )}
                        <Button $variant="success" onClick={handleOpenSubtitles}>Open Subtitles Overlay</Button>
                        <Button $variant="secondary" onClick={() => playTTS(latestTranscript)} disabled={!latestTranscript}>Read Last Text</Button>
                    </div>
                    {latestTranscript && (
                        <TranscriptDisplay>
                            <strong>Subtitles Content:</strong><br/>
                            {latestTranscript}
                        </TranscriptDisplay>
                    )}
                </TranscriptionSection>
            )}

            <FormSection>
                <InputGroup>
                    <Label>Video URL</Label>
                    <Input 
                        placeholder="https://www.bilibili.com/video/..." 
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                    />
                </InputGroup>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <Label>Style</Label>
                        <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                            <option value="minimal">Minimal</option>
                            <option value="detailed">Detailed</option>
                            <option value="academic">Academic</option>
                        </Select>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '15px', paddingBottom: '8px' }}>
                        <Label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: 0 }}>
                            <input type="checkbox" checked={useScreenshot} onChange={(e) => setUseScreenshot(e.target.checked)} />
                            Screenshot
                        </Label>
                        <Label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: 0 }}>
                            <input type="checkbox" checked={useVideoUnderstanding} onChange={(e) => setUseVideoUnderstanding(e.target.checked)} />
                            Images
                        </Label>
                    </div>
                </div>
                <Button 
                    onClick={generateNote} 
                    disabled={status === 'processing' || !videoUrl}
                    style={{ marginTop: '15px' }}
                >
                    {status === 'processing' ? 'Generating...' : 'Generate Video Note'}
                </Button>
            </FormSection>

            <ResultSection>
                {status === 'failed' && <p style={{ color: '#e74c3c' }}>Error: {error}</p>}
                {status === 'processing' && <p>Processing... Please wait.</p>}
                {markdown && (
                    <>
                        <TTSButton onClick={() => playTTS(markdown)}>🔊 Read Summary</TTSButton>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {markdown}
                        </ReactMarkdown>
                    </>
                )}
                {!markdown && status === 'idle' && (
                    <p style={{ color: '#666' }}>Generated content will appear here.</p>
                )}
            </ResultSection>
        </NoteContainer>
    );
}
