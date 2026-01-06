import React from 'react'

export default function Sidebar() {
    return (
        <div style={{ width: 200, borderRight: '1px solid #333', padding: 12, backgroundColor: '#1e1e1e', color: '#fff' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Scene</div>
            <div style={{ paddingLeft: 8 }}>└─ Layout</div>
            <div style={{ paddingLeft: 24, fontSize: '0.9em', color: '#aaa' }}>├─ Object_1</div>
            <div style={{ paddingLeft: 24, fontSize: '0.9em', color: '#aaa' }}>├─ Object_2</div>
        </div>
    )
}
