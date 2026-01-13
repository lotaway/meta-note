import React, { useState } from 'react'
import { useDirectory } from '../contexts/DirectoryContext'
import styled from 'styled-components'

const SidebarContainer = styled.div`
  width: 200px;
  border-right: 1px solid #333;
  padding: 12px;
  background-color: #1e1e1e;
  color: #fff;
  display: flex;
  flex-direction: column;
`

const SidebarTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
`

const DirectoryList = styled.div`
  flex: 1;
  overflow-y: auto;
`

const DirectoryItem = styled.div<{ $selected: boolean }>`
  padding-left: 8px;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-right: 8px;
  margin-bottom: 2px;
  cursor: pointer;
  background-color: ${props => props.$selected ? '#333' : 'transparent'};
  border-radius: 4px;
  &:hover {
    background-color: ${props => props.$selected ? '#333' : '#2a2a2a'};
  }
`

const InputContainer = styled.div`
  margin-top: 8px;
`

const DirectoryInput = styled.input`
  width: 100%;
  padding: 4px 8px;
  background-color: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
  border-radius: 4px;
  font-size: 0.9em;
  box-sizing: border-box;
  &:focus {
    border-color: #44aa88;
    outline: none;
  }
`

const ControlsRow = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`

const SidebarButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'neutral' }>`
  flex: 1;
  padding: ${props => props.$variant === 'neutral' ? '6px 8px' : '4px 8px'};
  background-color: ${props => {
        if (props.$variant === 'primary') return '#44aa88'
        if (props.$variant === 'secondary') return '#666'
        return '#2a2a2a'
    }};
  border: ${props => props.$variant === 'neutral' ? '1px solid #444' : 'none'};
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: ${props => props.$variant === 'neutral' ? '0.85em' : '0.85em'};
  &:hover {
    opacity: 0.9;
  }
`

export default function Sidebar() {
    const { directories, selectedDirectoryId, createDirectory, selectDirectory } = useDirectory()
    const [isCreating, setIsCreating] = useState(false)
    const [newDirName, setNewDirName] = useState('')

    const handleCreate = () => {
        if (newDirName.trim()) {
            createDirectory(newDirName.trim())
            setNewDirName('')
        }
        setIsCreating(false)
    }

    return (
        <SidebarContainer>
            <SidebarTitle>Scene</SidebarTitle>
            <DirectoryList>
                {directories.map(dir => (
                    <DirectoryItem
                        key={dir.id}
                        onClick={() => selectDirectory(dir.id)}
                        $selected={selectedDirectoryId === dir.id}
                    >
                        └─ {dir.name}
                    </DirectoryItem>
                ))}
            </DirectoryList>
            {isCreating ? (
                <InputContainer>
                    <DirectoryInput
                        type="text"
                        value={newDirName}
                        onChange={e => setNewDirName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleCreate()
                            if (e.key === 'Escape') { setIsCreating(false); setNewDirName('') }
                        }}
                        autoFocus
                        placeholder="Directory name"
                    />
                    <ControlsRow>
                        <SidebarButton $variant="primary" onClick={handleCreate}>
                            Create
                        </SidebarButton>
                        <SidebarButton $variant="secondary" onClick={() => { setIsCreating(false); setNewDirName('') }}>
                            Cancel
                        </SidebarButton>
                    </ControlsRow>
                </InputContainer>
            ) : (
                <SidebarButton $variant="neutral" style={{ marginTop: 8 }} onClick={() => setIsCreating(true)}>
                    + New Directory
                </SidebarButton>
            )}
        </SidebarContainer>
    )
}