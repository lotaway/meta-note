import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, Text, Html } from '@react-three/drei'
import { useState, useMemo, useRef, ReactNode } from 'react'
import * as THREE from 'three'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Colors, Spacing } from './styles/constants'

// ============ 常量提取 ============
const SHELF_CONFIG = {
  width: 1.8,
  height: 2.5,
  depth: 0.6,
  levels: 4,
  spacingColumn: 2.5,
  spacingLevel: 3,
  pillarThickness: 0.1,
  loadBarThickness: 0.15,
  loadBarDepthRatio: 0.8,
  indicatorRadius: 0.08,
  indicatorSegments: 16,
  labelFontSize: 0.2,
  labelOffsetY: 0.3,
  labelOffsetZ: 0.1
} as const

const WAREHOUSE_CONFIG = {
  wallHeight: 5,
  wallOpacity: 0.3,
  floorThickness: 0.01,
  gridThickness: 0.5,
  gridSectionThickness: 1,
  gridFadeDistance: 50
} as const

const HEATMAP_CONFIG = {
  canvasSize: 64,
  gridColumnMax: 20,
  gridLevelMax: 10,
  gradientRadius: 8,
  rectSize: 16,
  opacity: 0.5
} as const

const LOAD_THRESHOLDS = {
  low: 0.3,
  high: 0.7,
  heatmapStep: 25
} as const

const INFO_PANEL_CONFIG = {
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '12px',
  titleMarginBottom: '8px',
  gridGap: '4px'
} as const

export interface Shelf {
  id: string
  code: string
  level: number
  column: number
  capacity: number
  currentLoad: number
  status: 'empty' | 'occupied' | 'full' | 'maintenance'
}

export interface Warehouse {
  id: string
  name: string
  totalArea: number
  usedArea: number
  capacity: number
  status: 'active' | 'inactive' | 'maintenance'
}

export interface WarehouseHeatmapData {
  shelfId: string
  level: number
  column: number
  value: number
}

interface ShelfModelProps {
  shelf: Shelf
  isSelected: boolean
  onClick: () => void
  heatmapValue?: number
}

// ============ 子组件：货架模型 ============
function ShelfModel({ shelf, isSelected, onClick, heatmapValue }: ShelfModelProps) {
  const groupRef = useRef<THREE.Group>(null)

  const getShelfColor = (): string => {
    if (shelf.status === 'maintenance') return Colors.status.maintenance
    if (shelf.status === 'empty') return Colors.border
    if (shelf.status === 'full') return Colors.danger

    if (heatmapValue !== undefined) {
      const idx = Math.min(Math.floor(heatmapValue / LOAD_THRESHOLDS.heatmapStep) + 1, 4)
      const heatmapKeys: Record<number, keyof typeof Colors.heatmap> = { 1: 'cold', 2: 'cool', 3: 'normal', 4: 'warm' }
      return Colors.heatmap[heatmapKeys[idx]] || Colors.success
    }

    const ratio = shelf.currentLoad / shelf.capacity
    if (ratio < LOAD_THRESHOLDS.low) return Colors.success
    if (ratio < LOAD_THRESHOLDS.high) return Colors.warning
    return Colors.danger
  }

  const getStatusIndicatorColor = (): string => {
    return Colors.status[shelf.status as keyof typeof Colors.status] || Colors.info
  }

  const loadRatio = shelf.currentLoad / shelf.capacity
  const color = getShelfColor()
  const statusColor = getStatusIndicatorColor()
  const isOccupied = shelf.status === 'occupied' || shelf.status === 'full'

  return (
    <group
      ref={groupRef}
      position={[
        shelf.column * SHELF_CONFIG.spacingColumn,
        0,
        shelf.level * SHELF_CONFIG.spacingLevel
      ]}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* 左侧支柱 */}
      <mesh position={[-SHELF_CONFIG.width / 2, SHELF_CONFIG.height / 2, 0]}>
        <boxGeometry args={[SHELF_CONFIG.pillarThickness, SHELF_CONFIG.height, SHELF_CONFIG.pillarThickness]} />
        <meshStandardMaterial color={Colors.textMuted} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 右侧支柱 */}
      <mesh position={[SHELF_CONFIG.width / 2, SHELF_CONFIG.height / 2, 0]}>
        <boxGeometry args={[SHELF_CONFIG.pillarThickness, SHELF_CONFIG.height, SHELF_CONFIG.pillarThickness]} />
        <meshStandardMaterial color={Colors.textMuted} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 每层隔板和负载条 */}
      {Array.from({ length: SHELF_CONFIG.levels }).map((_, levelIdx) => {
        const levelY = (levelIdx + 0.5) * (SHELF_CONFIG.height / SHELF_CONFIG.levels)
        const loadBarWidth = SHELF_CONFIG.width * loadRatio
        const loadBarY = levelY + 0.1

        return (
          <group key={levelIdx}>
            {/* 隔板 */}
            <mesh position={[0, levelY, 0]}>
              <boxGeometry args={[SHELF_CONFIG.width, 0.05, SHELF_CONFIG.depth]} />
              <meshStandardMaterial
                color={color}
                metalness={0.3}
                roughness={0.6}
                emissive={isSelected ? color : '#000000'}
                emissiveIntensity={isSelected ? 0.2 : 0}
              />
            </mesh>

            {/* 负载条 */}
            {shelf.status !== 'empty' && (
              <mesh position={[0, loadBarY, 0]}>
                <boxGeometry
                  args={[
                    loadBarWidth,
                    SHELF_CONFIG.loadBarThickness,
                    SHELF_CONFIG.depth * SHELF_CONFIG.loadBarDepthRatio
                  ]}
                />
                <meshStandardMaterial
                  color={statusColor}
                  emissive={statusColor}
                  emissiveIntensity={0.3}
                />
              </mesh>
            )}
          </group>
        )
      })}

      {/* 状态指示球 */}
      <mesh
        position={[
          SHELF_CONFIG.width / 2 + 0.1,
          SHELF_CONFIG.height + 0.1,
          0
        ]}
      >
        <sphereGeometry args={[SHELF_CONFIG.indicatorRadius, SHELF_CONFIG.indicatorSegments, SHELF_CONFIG.indicatorSegments]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={isOccupied ? 1 : 0.3}
        />
      </mesh>

      {/* 货架标签 */}
      <Text
        position={[0, SHELF_CONFIG.height + SHELF_CONFIG.labelOffsetY, SHELF_CONFIG.depth / 2 + SHELF_CONFIG.labelOffsetZ]}
        fontSize={SHELF_CONFIG.labelFontSize}
        color={Colors.textMuted}
        anchorX="center"
        anchorY="bottom"
      >
        {shelf.code}
      </Text>
    </group>
  )
}

// ============ 子组件：仓库地面 ============
function WarehouseFloor({ area }: { area: number }) {
  const size = Math.sqrt(area)

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, WAREHOUSE_CONFIG.floorThickness, 0]}
        receiveShadow
      >
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={Colors.backgroundSecondary} />
      </mesh>
      <gridHelper
        args={[size, Math.floor(size), Colors.border, Colors.borderLight]}
        position={[0, WAREHOUSE_CONFIG.floorThickness + 0.01, 0]}
      />
    </group>
  )
}

// ============ 子组件：仓库墙壁 ============
function WarehouseWalls({ area, height = WAREHOUSE_CONFIG.wallHeight }: { area: number; height?: number }) {
  const size = Math.sqrt(area)

  return (
    <group>
      {/* 后墙 */}
      <mesh position={[0, height / 2, -size / 2]}>
        <boxGeometry args={[size, height, 0.1]} />
        <meshStandardMaterial color={Colors.textMuted} transparent opacity={WAREHOUSE_CONFIG.wallOpacity} />
      </mesh>

      {/* 左墙 */}
      <mesh position={[-size / 2, height / 2, 0]}>
        <boxGeometry args={[0.1, height, size]} />
        <meshStandardMaterial color={Colors.textMuted} transparent opacity={WAREHOUSE_CONFIG.wallOpacity} />
      </mesh>

      {/* 右墙 */}
      <mesh position={[size / 2, height / 2, 0]}>
        <boxGeometry args={[0.1, height, size]} />
        <meshStandardMaterial color={Colors.textMuted} transparent opacity={WAREHOUSE_CONFIG.wallOpacity} />
      </mesh>
    </group>
  )
}

// ============ 子组件：热力图覆盖层 ============
function HeatmapOverlay({ data, warehouseArea }: { data: WarehouseHeatmapData[]; warehouseArea: number }) {
  const size = Math.sqrt(warehouseArea)

  const heatmapTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = HEATMAP_CONFIG.canvasSize
    canvas.height = HEATMAP_CONFIG.canvasSize

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, HEATMAP_CONFIG.canvasSize, HEATMAP_CONFIG.canvasSize)

    data.forEach(point => {
      const x = (point.column / HEATMAP_CONFIG.gridColumnMax) * HEATMAP_CONFIG.canvasSize
      const y = (point.level / HEATMAP_CONFIG.gridLevelMax) * HEATMAP_CONFIG.canvasSize
      const intensity = point.value / 100

      let color: string
      if (intensity < 0.25) {
        color = `rgba(59, 130, 246, ${intensity * 4})`
      } else if (intensity < 0.5) {
        color = `rgba(34, 197, 94, ${(intensity - 0.25) * 4})`
      } else if (intensity < 0.75) {
        color = `rgba(234, 179, 8, ${(intensity - 0.5) * 4})`
      } else {
        color = `rgba(239, 68, 68, ${(intensity - 0.75) * 4})`
      }

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, HEATMAP_CONFIG.gradientRadius)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(
        x - HEATMAP_CONFIG.gradientRadius,
        y - HEATMAP_CONFIG.gradientRadius,
        HEATMAP_CONFIG.rectSize,
        HEATMAP_CONFIG.rectSize
      )
    })

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [data])

  if (!heatmapTexture) return null

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={heatmapTexture}
        transparent
        opacity={HEATMAP_CONFIG.opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

// ============ 子组件：仓库信息面板 ============
function WarehouseInfoPanel({ warehouse }: { warehouse: Warehouse }) {
  const size = Math.sqrt(warehouse.totalArea)
  const utilRate = (warehouse.usedArea / warehouse.totalArea) * 100

  const statusColor = warehouse.status === 'active'
    ? Colors.success
    : warehouse.status === 'maintenance'
      ? Colors.warning
      : Colors.textMuted

  return (
    <Html position={[size / 2 - 2, 3, -size / 2 + 1]} center>
      <div
        role="status"
        aria-label={`${warehouse.name} 信息面板`}
        style={{
          background: Colors.background,
          padding: INFO_PANEL_CONFIG.padding,
          borderRadius: INFO_PANEL_CONFIG.borderRadius,
          border: `1px solid ${Colors.border}`,
          color: Colors.text,
          fontSize: INFO_PANEL_CONFIG.fontSize,
          fontFamily: 'monospace',
          minWidth: '180px'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: INFO_PANEL_CONFIG.titleMarginBottom, color: Colors.primary }}>
          {warehouse.name}
        </div>
        <div style={{ display: 'grid', gap: INFO_PANEL_CONFIG.gridGap }}>
          <div>
            总面积: <span style={{ color: Colors.textMuted }}>{warehouse.totalArea} m²</span>
          </div>
          <div>
            使用面积: <span style={{ color: Colors.success }}>{warehouse.usedArea} m²</span>
          </div>
          <div>
            利用率:{' '}
            <span style={{ color: utilRate > 80 ? Colors.danger : Colors.success }}>
              {utilRate.toFixed(1)}%
            </span>
          </div>
          <div>
            容量: <span style={{ color: Colors.info }}>{warehouse.capacity}</span>
          </div>
          <div>
            状态: <span style={{ color: statusColor }}>{warehouse.status.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </Html>
  )
}

export interface Warehouse3DViewProps {
  warehouse: Warehouse
  shelves: Shelf[]
  heatmapData?: WarehouseHeatmapData[]
  onShelfClick?: (shelf: Shelf) => void
  selectedShelfId?: string
  showHeatmap?: boolean
  showGrid?: boolean
}

// ============ 子组件：3D 场景 ============
function Warehouse3DScene({
  warehouse,
  shelves,
  heatmapData,
  onShelfClick,
  selectedShelfId,
  showHeatmap,
  showGrid
}: Warehouse3DViewProps) {
  const warehouseSize = Math.sqrt(warehouse.totalArea)
  const cameraDistance = warehouseSize * 1.5

  const getHeatmapValue = (shelfId: string): number | undefined => {
    if (!showHeatmap) return undefined
    return heatmapData?.find(d => d.shelfId === shelfId)?.value
  }

  return (
    <Canvas
      shadows
      camera={{
        position: [cameraDistance, cameraDistance * 0.8, cameraDistance],
        fov: 50
      }}
      style={{ background: Colors.background }}
    >
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={cameraDistance * 2}
      />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color={Colors.info} />
      <pointLight position={[10, 10, 10]} intensity={0.3} color={Colors.warning} />
      <Environment preset="warehouse" />

      {showGrid && (
        <Grid
          args={[warehouseSize * 1.5, warehouseSize * 1.5]}
          cellSize={1}
          cellThickness={WAREHOUSE_CONFIG.gridThickness}
          cellColor={Colors.border}
          sectionSize={5}
          sectionThickness={WAREHOUSE_CONFIG.gridSectionThickness}
          sectionColor={Colors.textMuted}
          fadeDistance={WAREHOUSE_CONFIG.gridFadeDistance}
          infiniteGrid
        />
      )}

      <WarehouseFloor area={warehouse.totalArea} />
      <WarehouseWalls area={warehouse.totalArea} height={WAREHOUSE_CONFIG.wallHeight} />

      {showHeatmap && heatmapData && heatmapData.length > 0 && (
        <HeatmapOverlay data={heatmapData} warehouseArea={warehouse.totalArea} />
      )}

      {shelves.map(shelf => (
        <ShelfModel
          key={shelf.id}
          shelf={shelf}
          isSelected={shelf.id === selectedShelfId}
          onClick={() => onShelfClick?.(shelf)}
          heatmapValue={getHeatmapValue(shelf.id)}
        />
      ))}

      <WarehouseInfoPanel warehouse={warehouse} />
    </Canvas>
  )
}

// ============ 主组件 ============
export function Warehouse3DView({
  warehouse,
  shelves,
  heatmapData = [],
  onShelfClick,
  selectedShelfId,
  showHeatmap = false,
  showGrid = true
}: Warehouse3DViewProps) {
  return (
    <ErrorBoundary>
      <div
        role="img"
        aria-label={`${warehouse.name} 3D 视图`}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      >
        <Warehouse3DScene
          warehouse={warehouse}
          shelves={shelves}
          heatmapData={heatmapData}
          onShelfClick={onShelfClick}
          selectedShelfId={selectedShelfId}
          showHeatmap={showHeatmap}
          showGrid={showGrid}
        />
      </div>
    </ErrorBoundary>
  )
}