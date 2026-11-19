import { ErrorBoundary } from './components/ErrorBoundary'
import { Warehouse3DScene } from './Warehouse3DScene'

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

export interface Warehouse3DViewProps {
  warehouse: Warehouse
  shelves: Shelf[]
  heatmapData?: WarehouseHeatmapData[]
  onShelfClick?: (shelf: Shelf) => void
  selectedShelfId?: string
  showHeatmap?: boolean
  showGrid?: boolean
}

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
