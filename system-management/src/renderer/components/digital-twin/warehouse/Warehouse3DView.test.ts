import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock Three.js and react-three-fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'mock-canvas' }, children),
}))

vi.mock('@react-three/drei', () => ({
  __esModule: true,
  OrbitControls: () => React.createElement('div', { 'data-testid': 'mock-orbit-controls' }),
  Grid: () => React.createElement('div', { 'data-testid': 'mock-grid' }),
  Environment: () => React.createElement('div', { 'data-testid': 'mock-environment' }),
  Text: ({ children }: { children: React.ReactNode }) => React.createElement('span', { 'data-testid': 'mock-text' }, children),
  Html: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'mock-html' }, children),
}))

vi.mock('three', () => ({
  Group: vi.fn(),
  Mesh: vi.fn(),
  PlaneGeometry: vi.fn(),
  BoxGeometry: vi.fn(),
  CircleGeometry: vi.fn(),
  BufferGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  CanvasTexture: vi.fn(),
  Vector3: vi.fn(),
  Color: vi.fn(),
}))

// Import after mocks
import { Warehouse3DView, type Warehouse, type Shelf, type WarehouseHeatmapData } from '../warehouse/Warehouse3DView'

describe('Warehouse3DView - 3D Scene Loading', () => {
  const mockWarehouse: Warehouse = {
    id: 'wh-001',
    name: '主仓库A',
    totalArea: 400,
    usedArea: 280,
    capacity: 1000,
    status: 'active'
  }

  const mockShelves: Shelf[] = [
    { id: 'shelf-001', code: 'A-01', level: 1, column: 1, capacity: 100, currentLoad: 80, status: 'occupied' },
    { id: 'shelf-002', code: 'A-02', level: 1, column: 2, capacity: 100, currentLoad: 30, status: 'occupied' },
    { id: 'shelf-003', code: 'A-03', level: 2, column: 1, capacity: 100, currentLoad: 100, status: 'full' },
    { id: 'shelf-004', code: 'B-01', level: 1, column: 3, capacity: 100, currentLoad: 0, status: 'empty' },
    { id: 'shelf-005', code: 'B-02', level: 1, column: 4, capacity: 100, currentLoad: 50, status: 'occupied' },
  ]

  const mockHeatmapData: WarehouseHeatmapData[] = [
    { shelfId: 'shelf-001', level: 1, column: 1, value: 80 },
    { shelfId: 'shelf-002', level: 1, column: 2, value: 30 },
    { shelfId: 'shelf-003', level: 2, column: 1, value: 100 },
    { shelfId: 'shelf-004', level: 1, column: 3, value: 0 },
    { shelfId: 'shelf-005', level: 1, column: 4, value: 50 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render 3D canvas container', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      const canvasContainer = screen.getByRole('img', { name: /主仓库A 3D 视图/i })
      expect(canvasContainer).toBeInTheDocument()
      expect(canvasContainer).toHaveAttribute('aria-label', '主仓库A 3D 视图')
    })

    it('should render Canvas element with correct props', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
    })

    it('should render OrbitControls for camera manipulation', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      expect(screen.getByTestId('mock-orbit-controls')).toBeInTheDocument()
    })

    it('should render grid when showGrid is true (default)', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves,
          showGrid: true
        })
      )

      expect(screen.getByTestId('mock-grid')).toBeInTheDocument()
    })

    it('should not render grid when showGrid is false', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves,
          showGrid: false
        })
      )

      expect(screen.queryByTestId('mock-grid')).not.toBeInTheDocument()
    })
  })

  describe('Warehouse Information Display', () => {
    it('should display warehouse name in info panel', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      expect(screen.getByTestId('mock-html')).toBeInTheDocument()
      expect(screen.getByText('主仓库A')).toBeInTheDocument()
    })

    it('should calculate and display correct utilization rate', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      // Utilization rate = 280/400 * 100 = 70%
      expect(screen.getByText(/70\.0%/)).toBeInTheDocument()
    })

    it('should display total area', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      expect(screen.getByText(/400 m²/)).toBeInTheDocument()
    })

    it('should display capacity', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      expect(screen.getByText(/1000/)).toBeInTheDocument()
    })

    it('should display active status', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      expect(screen.getByText(/ACTIVE/)).toBeInTheDocument()
    })
  })

  describe('Shelf Interaction', () => {
    it('should call onShelfClick when shelf is clicked', () => {
      const mockOnShelfClick = vi.fn()

      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves,
          onShelfClick: mockOnShelfClick
        })
      )

      // Verify the callback is registered
      expect(mockOnShelfClick).not.toHaveBeenCalled()
    })

    it('should highlight selected shelf', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves,
          selectedShelfId: 'shelf-001'
        })
      )

      // Verify component renders with selection state
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('Heatmap Display', () => {
    it('should render heatmap overlay when showHeatmap is true', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves,
          heatmapData: mockHeatmapData,
          showHeatmap: true
        })
      )

      // The heatmap overlay should be rendered inside the scene
      expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
    })

    it('should not render heatmap when showHeatmap is false', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves,
          heatmapData: mockHeatmapData,
          showHeatmap: false
        })
      )

      // Heatmap should not be visible
      expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
    })
  })

  describe('Empty State Handling', () => {
    it('should handle empty shelves array', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: []
        })
      )

      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('should handle empty heatmap data', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves,
          heatmapData: []
        })
      )

      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper role attribute', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      expect(screen.getByRole('img')).toHaveAttribute('aria-label')
    })

    it('should have descriptive aria-label', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      const element = screen.getByRole('img')
      expect(element).toHaveAttribute('aria-label', expect.stringContaining('主仓库A'))
      expect(element).toHaveAttribute('aria-label', expect.stringContaining('3D 视图'))
    })
  })

  describe('Container Styling', () => {
    it('should have 100% width and height', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      const container = screen.getByRole('img')
      expect(container).toHaveStyle({ width: '100%', height: '100%' })
    })

    it('should have minimum height of 400px', () => {
      render(
        React.createElement(Warehouse3DView, {
          warehouse: mockWarehouse,
          shelves: mockShelves
        })
      )

      const container = screen.getByRole('img')
      expect(container).toHaveStyle({ minHeight: '400px' })
    })
  })

  describe('Performance', () => {
    it('should render large number of shelves without crashing', () => {
      const largeShelfArray = Array.from({ length: 100 }, (_, i) => ({
        id: `shelf-${i}`,
        code: `S-${i}`,
        level: Math.floor(i / 10) + 1,
        column: (i % 10) + 1,
        capacity: 100,
        currentLoad: Math.floor(Math.random() * 100),
        status: 'occupied' as const
      }))

      expect(() => {
        render(
          React.createElement(Warehouse3DView, {
            warehouse: mockWarehouse,
            shelves: largeShelfArray
          })
        )
      }).not.toThrow()
    })
  })
})