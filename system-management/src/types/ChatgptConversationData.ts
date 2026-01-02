export interface ChatgptConversationData {
    type?: string
    event?: string
    message?: ChatgptMessage
    conversation_id?: string
    p?: string // patch path
    o?: string // operation: add, append, patch
    v?: any    // value
    metadata?: any
    marker?: string
}

export interface ChatgptMessage {
    id: string
    author: {
        role: string
        name: string | null
        metadata: any
    }
    create_time: number
    update_time: number | null
    content: {
        content_type: string
        parts: string[]
    }
    status: string
    end_turn: boolean | null
    weight: number
    metadata: any
    recipient: string
    channel: string | null
}
