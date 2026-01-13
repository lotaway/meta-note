import React, { useMemo } from 'react'
import { QuadraticBezierLine } from '@react-three/drei'
import * as THREE from 'three'

interface SceneConnectionProps {
    id: number
    start: [number, number, number]
    end: [number, number, number]
    selected: boolean
    onClick: (e: any) => void
}

export default function SceneConnection({ start, end, selected, onClick }: SceneConnectionProps) {
    const mid = useMemo(() => {
        const v1 = new THREE.Vector3(...start)
        const v2 = new THREE.Vector3(...end)
        const v3 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5)
        v3.y += 1.5
        return v3
    }, [start, end])

    return (
        <QuadraticBezierLine
            start={start}
            end={end}
            mid={mid}
            color={selected ? '#44aa88' : '#666'}
            lineWidth={selected ? 4 : 2}
            onClick={(e) => {
                e.stopPropagation()
                onClick(e)
            }}
        />
    )
}
