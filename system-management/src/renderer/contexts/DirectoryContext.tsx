import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Directory {
    id: number
    name: string
}

interface DirectoryContextType {
    directories: Directory[]
    selectedDirectoryId: number | null
    createDirectory: (name: string) => void
    selectDirectory: (id: number | null) => void
    deleteDirectory: (id: number) => void
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined)

export function DirectoryProvider({ children }: { children: ReactNode }) {
    const [directories, setDirectories] = useState<Directory[]>([
        { id: 1, name: 'Layout' }
    ])
    const [selectedDirectoryId, setSelectedDirectoryId] = useState<number | null>(1)

    const createDirectory = (name: string) => {
        const newDir: Directory = { id: Date.now(), name: name || `Directory_${Date.now()}` }
        setDirectories(prev => [...prev, newDir])
        setSelectedDirectoryId(newDir.id)
    }

    const selectDirectory = (id: number | null) => {
        setSelectedDirectoryId(id)
    }

    const deleteDirectory = (id: number) => {
        setDirectories(prev => prev.filter(d => d.id !== id))
        if (selectedDirectoryId === id) {
            setSelectedDirectoryId(directories.length > 1 ? directories.find(d => d.id !== id)?.id || null : null)
        }
    }

    return (
        <DirectoryContext.Provider value={{ directories, selectedDirectoryId, createDirectory, selectDirectory, deleteDirectory }}>
            {children}
        </DirectoryContext.Provider>
    )
}

export function useDirectory() {
    const context = useContext(DirectoryContext)
    if (!context) {
        throw new Error('useDirectory must be used within DirectoryProvider')
    }
    return context
}