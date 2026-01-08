import React, { useState } from 'react'
import { useDirectory } from '../contexts/DirectoryContext'

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
        <div style={{ width: 200, borderRight: '1px solid #333', padding: 12, backgroundColor: '#1e1e1e', color: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Scene</div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {directories.map(dir => (
                    <div
                        key={dir.id}
                        onClick={() => selectDirectory(dir.id)}
                        style={{
                            paddingLeft: 8,
                            padding: '4px 8px',
                            marginBottom: 2,
                            cursor: 'pointer',
                            backgroundColor: selectedDirectoryId === dir.id ? '#333' : 'transparent',
                            borderRadius: 4
                        }}
                    >
                        └─ {dir.name}
                    </div>
                ))}
            </div>
            {isCreating ? (
                <div style={{ marginTop: 8 }}>
                    <input
                        type="text"
                        value={newDirName}
                        onChange={e => setNewDirName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleCreate()
                            if (e.key === 'Escape') { setIsCreating(false); setNewDirName('') }
                        }}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '4px 8px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #444',
                            color: '#fff',
                            borderRadius: 4,
                            fontSize: '0.9em'
                        }}
                        placeholder="Directory name"
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                            onClick={handleCreate}
                            style={{
                                flex: 1,
                                padding: '4px 8px',
                                backgroundColor: '#44aa88',
                                border: 'none',
                                color: '#fff',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: '0.85em'
                            }}
                        >
                            Create
                        </button>
                        <button
                            onClick={() => { setIsCreating(false); setNewDirName('') }}
                            style={{
                                flex: 1,
                                padding: '4px 8px',
                                backgroundColor: '#666',
                                border: 'none',
                                color: '#fff',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: '0.85em'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    style={{
                        marginTop: 8,
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #444',
                        color: '#fff',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.85em'
                    }}
                >
                    + New Directory
                </button>
            )}
        </div>
    )
}