import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Device {
  id: string
  code: string
  name: string
  type: string
  status: 'online' | 'offline' | 'running' | 'idle' | 'warning' | 'error'
  position: [number, number, number]
  rotation: number
}

interface FactorySceneProps {
  devices: Device[]
  onDeviceClick?: (device: Device) => void
  selectedDeviceId?: string
}

function AnimatedDeviceModel({ device, isSelected, onClick }: { 
  device: Device
  isSelected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetPosition = useRef(new THREE.Vector3(...device.position))
  const currentPosition = useRef(new THREE.Vector3(...device.position))
  
  const getColor = () => {
    switch (device.status) {
      case 'running': return '#4ade80'
      case 'idle': return '#94a3b8'
      case 'warning': return '#fbbf24'
      case 'error': return '#ef4444'
      case 'offline': return '#6b7280'
      default: return '#3b82f6'
    }
  }

  const getGeometry = () => {
    switch (device.type) {
      case 'AGV': return <boxGeometry args={[1, 0.5, 1.5]} />
      case 'ROBOT': return <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
      case 'PLC': return <boxGeometry args={[0.8, 0.6, 0.4]} />
      case 'CONVEYOR': return <boxGeometry args={[2, 0.3, 0.5]} />
      default: return <boxGeometry args={[1, 1, 1]} />
    }
  }

  // Animation for AGV movement and ROBOT rotation
  useFrame((state, delta) => {
    if (!meshRef.current) return

    if (device.type === 'AGV' && device.status === 'running') {
      // Smooth position interpolation (lerp) for AGV
      targetPosition.current.set(...device.position)
      currentPosition.current.lerp(targetPosition.current, 0.1)
      meshRef.current.position.copy(currentPosition.current)
    } else if (device.type === 'ROBOT' && device.status === 'running') {
      // Continuous rotation animation for ROBOT
      meshRef.current.rotation.y += delta * 2 // 2 radians per second
    }

    // Subtle hover animation when selected
    if (isSelected) {
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1
    }
  })

  return (
    <group 
      position={device.position} 
      rotation={[0, device.rotation, 0]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <mesh ref={meshRef}>
        {getGeometry()}
        <meshStandardMaterial 
          color={getColor()} 
          emissive={isSelected ? '#ffffff' : getColor()}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
        />
      </mesh>
      {/* Status indicator light */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()}
          emissiveIntensity={device.status === 'running' ? 1 : 0.3}
        />
      </mesh>
    </group>
  )
}

// Keep the original DeviceModel for backward compatibility
function DeviceModel({ device, isSelected, onClick }: { 
  device: Device
  isSelected: boolean
  onClick: () => void
}) {
  return <AnimatedDeviceModel device={device} isSelected={isSelected} onClick={onClick} />
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  )
}

function Workshop({ position, size }: { position: [number, number, number], size: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[size[0], size[2]]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Walls */}
      <mesh position={[0, size[1] / 2, -size[2] / 2]}>
        <boxGeometry args={[size[0], size[1], 0.1]} />
        <meshStandardMaterial color="#475569" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-size[0] / 2, size[1] / 2, 0]}>
        <boxGeometry args={[0.1, size[1], size[2]]} />
        <meshStandardMaterial color="#475569" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

export function FactoryScene({ devices, onDeviceClick, selectedDeviceId }: FactorySceneProps) {
  const [hoveredDevice, setHoveredDevice] = useState<string | null>(null)

  return (
    <Canvas
      shadows
      camera={{ position: [15, 15, 15], fov: 50 }}
      style={{ background: '#0f172a' }}
    >
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      {/* Environment */}
      <Environment preset="city" />
      <Grid 
        args={[50, 50]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#334155" 
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={30}
        infiniteGrid
      />
      
      {/* Floor */}
      <Floor />
      
      {/* Workshop areas */}
      <Workshop position={[-8, 0, -8]} size={[10, 4, 10]} />
      <Workshop position={[8, 0, -8]} size={[10, 4, 10]} />
      <Workshop position={[-8, 0, 8]} size={[10, 4, 10]} />
      <Workshop position={[8, 0, 8]} size={[10, 4, 10]} />
      
      {/* Devices with animation */}
      {devices.map((device) => (
        <AnimatedDeviceModel
          key={device.id}
          device={device}
          isSelected={device.id === selectedDeviceId}
          onClick={() => onDeviceClick?.(device)}
        />
      ))}
    </Canvas>
  )
}

export type { Device, FactorySceneProps }