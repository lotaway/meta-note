import React, { useState } from 'react'
import styled from 'styled-components'
import { useAudio } from '../contexts/AudioContext'
import { ipcRenderer } from 'electron'

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
`

const PrimaryButton = styled(Button)`
  background: #007aff;
  color: white;
`

const DangerButton = styled(Button)`
  background: #ff3b30;
  color: white;
`

const FileInput = styled.input`
  margin-top: 10px;
  width: 100%;
`

export default function AudioControlPanel() {
    const { 
        isStreaming, 
        startStreaming, 
        stopStreaming, 
        uploadFile, 
        sources, 
        refreshSources 
    } = useAudio()
    
    const [sourceType, setSourceType] = useState<'mic' | 'system'>('mic')
    const [selectedSourceId, setSelectedSourceId] = useState<string>('')
    const [isExpanded, setIsExpanded] = useState(true)

    const handleStart = async () => {
        await startStreaming(selectedSourceId, sourceType)
    }

    const handleStop = () => {
        stopStreaming()
    }

    const handleOpenSubtitles = () => {
        ipcRenderer.send('subtitles:open')
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0])
        }
    }

    return (
        <PanelContainer>
            <Title>
                音频转录控制
                <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    {isExpanded ? '▼' : '▲'}
                </button>
            </Title>
            
            {isExpanded && (
                <>
                    <div>
                        <label>音频来源:</label>
                        <Select 
                            value={sourceType} 
                            onChange={e => {
                                setSourceType(e.target.value as 'mic' | 'system')
                                if (e.target.value === 'system') refreshSources()
                            }}
                        >
                            <option value="mic">🎤 麦克风</option>
                            <option value="system">🔊 系统音频/程序</option>
                        </Select>
                    </div>

                    {sourceType === 'system' && (
                        <div>
                            <Select 
                                value={selectedSourceId} 
                                onChange={e => setSelectedSourceId(e.target.value)}
                            >
                                <option value="">选择程序/标签页...</option>
                                {sources.map(source => (
                                    <option key={source.id} value={source.id}>
                                        {source.name}
                                    </option>
                                ))}
                            </Select>
                            <Button onClick={refreshSources} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)' }}>
                                刷新列表
                            </Button>
                        </div>
                    )}

                    <div style={{ marginTop: '15px' }}>
                        {!isStreaming ? (
                            <PrimaryButton onClick={handleStart} disabled={sourceType === 'system' && !selectedSourceId}>
                                开始转录
                            </PrimaryButton>
                        ) : (
                            <DangerButton onClick={handleStop}>
                                停止转录
                            </DangerButton>
                        )}
                        
                        <PrimaryButton onClick={handleOpenSubtitles} style={{ background: '#34c759' }}>
                            打开字幕
                        </PrimaryButton>
                    </div>

                    <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                        <label>或上传本地文件 (MP3/MP4):</label>
                        <FileInput type="file" accept="audio/*,video/*" onChange={handleFileChange} />
                    </div>
                </>
            )}
        </PanelContainer>
    )
}
