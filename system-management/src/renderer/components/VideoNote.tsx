import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  pre {
    background: #1e1e1e;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
`;

export default function VideoNote() {
    const [videoUrl, setVideoUrl] = useState('');
    const [style, setStyle] = useState('detailed');
    const [useScreenshot, setUseScreenshot] = useState(false);
    const [useVideoUnderstanding, setUseVideoUnderstanding] = useState(false);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [markdown, setMarkdown] = useState('');
    const [error, setError] = useState<string | null>(null);

    const generateNote = async () => {
        if (!videoUrl) return;
        setStatus('processing');
        setError(null);
        setMarkdown('');

        try {
            const response = await fetch('http://localhost:5051/api/note/generate', {
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

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (taskId && status === 'processing') {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`http://localhost:5051/api/note/status/${taskId}`);
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
            <Title>Video Note Generator</Title>
            <FormSection>
                <InputGroup>
                    <Label>Video URL (Bilibili, YouTube, etc.)</Label>
                    <Input 
                        placeholder="https://www.bilibili.com/video/..." 
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                    />
                </InputGroup>
                <InputGroup>
                    <Label>Note Style</Label>
                    <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                        <option value="minimal">Minimal</option>
                        <option value="detailed">Detailed</option>
                        <option value="academic">Academic</option>
                        <option value="xiaohongshu">Xiaohongshu</option>
                        <option value="tutorial">Tutorial</option>
                    </Select>
                </InputGroup>
                <InputGroup style={{ display: 'flex', gap: '20px' }}>
                    <Label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={useScreenshot} 
                            onChange={(e) => setUseScreenshot(e.target.checked)} 
                        />
                        Screenshots
                    </Label>
                    <Label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={useVideoUnderstanding} 
                            onChange={(e) => setUseVideoUnderstanding(e.target.checked)} 
                        />
                        Video Understanding
                    </Label>
                </InputGroup>
                <Button 
                    onClick={generateNote} 
                    disabled={status === 'processing' || !videoUrl}
                >
                    {status === 'processing' ? 'Generating...' : 'Generate Note'}
                </Button>
            </FormSection>

            <ResultSection>
                {status === 'failed' && <p style={{ color: '#e74c3c' }}>Error: {error}</p>}
                {status === 'processing' && <p>Processing video. This may take a few minutes...</p>}
                {markdown ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {markdown}
                    </ReactMarkdown>
                ) : (
                    status === 'idle' && <p style={{ color: '#666' }}>Your generated note will appear here.</p>
                )}
            </ResultSection>
        </NoteContainer>
    );
}
