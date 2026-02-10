import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VoiceTools from './VoiceTools';

const API_BASE_URL = `http://localhost:${import.meta.env.VITE_WEB_SERVER_PORT || '5051'}`;

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

const Button = styled.button`
  background-color: #44aa88;
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

export default function VideoNote() {
    const [videoUrl, setVideoUrl] = useState('');
    const [noteStyle, setNoteStyle] = useState('detailed');
    const [isScreenshotEnabled, setIsScreenshotEnabled] = useState(false);
    const [isImageUnderstandingEnabled, setIsImageUnderstandingEnabled] = useState(false);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [appWorkerStatus, setAppWorkerStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [generatedMarkdown, setGeneratedMarkdown] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isVoiceToolsVisible, setIsVoiceToolsVisible] = useState(false);

    const handleGenerateNote = async () => {
        if (!videoUrl) return;
        setAppWorkerStatus('processing');
        setErrorMessage(null);
        setGeneratedMarkdown('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/note/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    video_url: videoUrl, 
                    style: noteStyle,
                    options: {
                        screenshot: isScreenshotEnabled,
                        videoUnderstanding: isImageUnderstandingEnabled
                    }
                })
            });
            const result = await response.json();
            if (result.code === 200) {
                setActiveTaskId(result.data.task_id);
            } else {
                throw new Error(result.message);
            }
        } catch (err: any) {
            setAppWorkerStatus('failed');
            setErrorMessage(err.message);
        }
    };

    // Keep handlePlayTTS here for playing the generated summary
    const handlePlayTTS = async (text: string) => {
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

    useEffect(() => {
        if (!activeTaskId || appWorkerStatus !== 'processing') return;
        
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/note/status/${activeTaskId}`);
                const result = await response.json();
                if (result.code === 200) {
                    if (result.data.status === 'SUCCESS') {
                        setGeneratedMarkdown(result.data.markdown);
                        setAppWorkerStatus('success');
                        setActiveTaskId(null);
                    } else if (result.data.status === 'FAILED') {
                        setErrorMessage(result.data.error);
                        setAppWorkerStatus('failed');
                        setActiveTaskId(null);
                    }
                }
            } catch (err) {
                console.error('Polling failed', err);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeTaskId, appWorkerStatus]);

    return (
        <NoteContainer>
            <Title>
                Video Note Generator
                <Button style={{ padding: '5px 10px', fontSize: '0.6em', background: '#34495e' }} onClick={() => setIsVoiceToolsVisible(!isVoiceToolsVisible)}>
                    {isVoiceToolsVisible ? 'Hide Voice Tools' : 'Show Voice Tools'}
                </Button>
            </Title>
            
            {isVoiceToolsVisible && <VoiceTools mode="compact" />}

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
                        <Select value={noteStyle} onChange={(e) => setNoteStyle(e.target.value)}>
                            <option value="minimal">Minimal</option>
                            <option value="detailed">Detailed</option>
                            <option value="academic">Academic</option>
                        </Select>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '15px', paddingBottom: '8px' }}>
                        <Label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: 0 }}>
                            <input type="checkbox" checked={isScreenshotEnabled} onChange={(e) => setIsScreenshotEnabled(e.target.checked)} />
                            Screenshot
                        </Label>
                        <Label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: 0 }}>
                            <input type="checkbox" checked={isImageUnderstandingEnabled} onChange={(e) => setIsImageUnderstandingEnabled(e.target.checked)} />
                            Images
                        </Label>
                    </div>
                </div>
                <Button 
                    onClick={handleGenerateNote} 
                    disabled={appWorkerStatus === 'processing' || !videoUrl}
                    style={{ marginTop: '15px' }}
                >
                    {appWorkerStatus === 'processing' ? 'Generating...' : 'Generate Video Note'}
                </Button>
            </FormSection>

            <ResultSection>
                {errorMessage && <p style={{ color: '#e74c3c' }}>Error: {errorMessage}</p>}
                {generatedMarkdown && (
                    <>
                        <TTSButton onClick={() => handlePlayTTS(generatedMarkdown)}>🔊 Read Summary</TTSButton>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {generatedMarkdown}
                        </ReactMarkdown>
                    </>
                )}
            </ResultSection>
        </NoteContainer>
    );
}
