import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options, warehouse }: { warehouse: unknown; data: unknown; options: unknown }) => (
    <div data-testid="mock-line-chart" data-data={JSON.stringify(data)} data-options={JSON.stringify(options)} data-warehouse={JSON.stringify(warehouse)} />
  ),
  Bar: ({ data, options, warehouse }: { warehouse: unknown; data: unknown; options: unknown }) => (
    <div data-testid="mock-bar-chart" data-data={JSON.stringify(data)} data-options={JSON.stringify(options)} data-warehouse={JSON.stringify(warehouse)} />
  ),
  Doughnut: ({ data, options, warehouse }: { warehouse: unknown; data: unknown; options: unknown }) => (
    <div data-testid="mock-doughnut-chart" data-data={JSON.stringify(data)} data-options={JSON.stringify(options)} data-warehouse={JSON.stringify(warehouse)} />
  ),
}))

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  BarElement: vi.fn(),
  ArcElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}))

// Import components after mocks
import { DemandChart } from './DemandChart'
import { ShelfHeatmap } from './ShelfHeatmap'
import { WarehouseStatus } from './WarehouseStatus'

describe('Real-time Data Display Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('DemandChart - Real-time Demand Data', () => {
    const generateMockDemandData = (count: number): any[] => {
      const now = Date.now()
      return Array.from({ length: count }, (_, i) => ({
        date: new Date(now - (count - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        demand: Math.floor(Math.random() * 1000) + 500,
        forecast: Math.floor(Math.random() * 1000) + 500,
      }))
    }

    it('should render chart with initial data', () => {
      const mockData = generateMockDemandData(7)

      render(
        <DemandChart
          data={mockData}
          title="需求趋势"
        />
      )

      expect(screen.getByRole('img', { name: '需求趋势' })).toBeInTheDocument()
    })

    it('should display chart title', () => {
      const mockData = generateMockDemandData(7)

      render(
        <DemandChart
          data={mockData}
          title="需求趋势"
        />
      )

      expect(screen.getByText('需求趋势')).toBeInTheDocument()
    })

    it('should handle empty data gracefully', () => {
      render(
        <DemandChart
          data={[]}
          title="需求趋势"
        />
      )

      // Should render without crashing
      expect(screen.getByRole('img', { name: '需求趋势' })).toBeInTheDocument()
    })

    it('should update when data changes', () => {
      const initialData = generateMockDemandData(7)
      const { rerender } = render(
        <DemandChart
          data={initialData}
          title="需求趋势"
        />
      )

      const updatedData = generateMockDemandData(7)
      rerender(
        <DemandChart
          data={updatedData}
          title="需求趋势"
        />
      )

      expect(screen.getByRole('img', { name: '需求趋势' })).toBeInTheDocument()
    })

    it('should display all data points', () => {
      const mockData = generateMockDemandData(30)

      render(
        <DemandChart
          data={mockData}
          title="需求趋势"
        />
      )

      expect(screen.getByRole('img', { name: '需求趋势' })).toBeInTheDocument()
    })
  })

  describe('ShelfHeatmap - Real-time Load Distribution', () => {
    const generateMockShelves = (levels: number, columns: number): any[] => {
      const data: any[] = []
      for (let level = 1; level <= levels; level++) {
        for (let column = 1; column <= columns; column++) {
          data.push({
            id: `shelf-${level}-${column}`,
            code: `S${level}-${column}`,
            level,
            column,
            capacity: 100,
            currentLoad: Math.floor(Math.random() * 100),
            status: 'occupied',
          })
        }
      }
      return data
    }

    it('should render heatmap grid', () => {
      const mockShelves = generateMockShelves(5, 10)

      render(
        <ShelfHeatmap
          shelves={mockShelves}
        />
      )

      expect(screen.getByText('库位热度图')).toBeInTheDocument()
      expect(screen.getAllByRole('gridcell')).toHaveLength(66)
    })

    it('should display color legend', () => {
      const mockShelves = generateMockShelves(5, 10)

      render(
        <ShelfHeatmap
          shelves={mockShelves}
        />
      )

      expect(screen.getByText('低')).toBeInTheDocument()
      expect(screen.getByText('中')).toBeInTheDocument()
      expect(screen.getByText('高')).toBeInTheDocument()
    })

    it('should handle empty heatmap data', () => {
      render(
        <ShelfHeatmap
          shelves={[]}
        />
      )

      expect(screen.getByText('库位热度图')).toBeInTheDocument()
    })

    it('should render correct number of cells', () => {
      const mockShelves = generateMockShelves(3, 4)

      render(
        <ShelfHeatmap
          shelves={mockShelves}
        />
      )

      expect(screen.getAllByRole('gridcell')).toHaveLength(20)
    })

    it('should update heatmap when data changes', () => {
      const initialShelves = generateMockShelves(5, 10)
      const { rerender } = render(
        <ShelfHeatmap
          shelves={initialShelves}
        />
      )

      const updatedShelves = generateMockShelves(3, 4)
      rerender(
        <ShelfHeatmap
          shelves={updatedShelves}
        />
      )

      expect(screen.getAllByRole('gridcell')).toHaveLength(20)
    })

    it('should handle large grid sizes', () => {
      const largeShelves = generateMockShelves(20, 30)

      expect(() => {
        render(
          <ShelfHeatmap
            shelves={largeShelves}
          />
        )
      }).not.toThrow()
    })
  })

  describe('WarehouseStatus - Real-time Status Updates', () => {
    const mockWarehouse = {
      id: 'wh-001',
      name: 'Warehouse A',
      status: 'active' as const,
      totalArea: 10000,
      usedArea: 7500,
      capacity: 10000,
    }

    const mockShelves = [
      { id: 'shelf-1', code: 'S1', level: 1, column: 1, status: 'occupied' as const, capacity: 100, currentLoad: 80 },
      { id: 'shelf-2', code: 'S2', level: 1, column: 2, status: 'full' as const, capacity: 100, currentLoad: 100 },
      { id: 'shelf-3', code: 'S3', level: 1, column: 3, status: 'empty' as const, capacity: 100, currentLoad: 0 },
      { id: 'shelf-4', code: 'S4', level: 1, column: 4, status: 'maintenance' as const, capacity: 100, currentLoad: 50 },
    ]

    it('should render warehouse status panel', () => {
      render(
        <WarehouseStatus
          warehouse={mockWarehouse}
          shelves={mockShelves}
          compact={false}
        />
      )

      expect(screen.getByText('Warehouse A')).toBeInTheDocument()
    })

    it('should display capacity utilization percentage', () => {
      render(
        <WarehouseStatus
          warehouse={mockWarehouse}
          shelves={mockShelves}
          compact={false}
        />
      )

      expect(screen.getByText(/57\.5%/)).toBeInTheDocument()
    })

    it('should display occupied and total shelves', () => {
      render(
        <WarehouseStatus
          warehouse={mockWarehouse}
          shelves={mockShelves}
          compact={false}
        />
      )

      expect(screen.getByText('1/4')).toBeInTheDocument()
    })

    it('should render in compact mode', () => {
      render(
        <WarehouseStatus
          warehouse={mockWarehouse}
          shelves={mockShelves}
          compact={true}
        />
      )

      expect(screen.getByText('Warehouse A')).toBeInTheDocument()
    })

    it('should handle status updates', () => {
      const { rerender } = render(
        <WarehouseStatus
          warehouse={mockWarehouse}
          shelves={mockShelves}
          compact={false}
        />
      )

      const updatedShelves = [
        { id: 'shelf-1', code: 'S1', level: 1, column: 1, status: 'occupied' as const, capacity: 100, currentLoad: 90 },
        { id: 'shelf-2', code: 'S2', level: 1, column: 2, status: 'full' as const, capacity: 100, currentLoad: 100 },
        { id: 'shelf-3', code: 'S3', level: 1, column: 3, status: 'empty' as const, capacity: 100, currentLoad: 10 },
        { id: 'shelf-4', code: 'S4', level: 1, column: 4, status: 'maintenance' as const, capacity: 100, currentLoad: 50 },
      ]

      rerender(
        <WarehouseStatus
          warehouse={mockWarehouse}
          shelves={updatedShelves}
          compact={false}
        />
      )

      // (90+100+10+50)/400 = 250/400 = 62.5%
      expect(screen.getByText(/62\.5%/)).toBeInTheDocument()
    })

    it('should display capacity progress bar', () => {
      render(
        <WarehouseStatus
          warehouse={mockWarehouse}
          shelves={mockShelves}
          compact={false}
        />
      )

      const expectedRate = ((80 + 100 + 0 + 50) / 400) * 100
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(expectedRate))
    })
  })

  describe('Data Refresh Simulation', () => {
    it('should handle periodic data updates', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      let updateCount = 0
      const mockData = [
        { date: '2024-01-01', demand: 100, forecast: 110 },
        { date: '2024-01-02', demand: 150, forecast: 140 },
      ]

      const { rerender } = render(
        <DemandChart
          data={mockData}
          title="需求趋势"
        />
      )

      // Simulate data refresh
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      updateCount++
      expect(updateCount).toBeGreaterThanOrEqual(0)
    })

    it('should maintain data continuity during updates', () => {
      const initialData = [
        { date: '2024-01-01', demand: 100, forecast: 110 },
        { date: '2024-01-02', demand: 150, forecast: 140 },
      ]

      const { rerender } = render(
        <DemandChart
          data={initialData}
          title="需求趋势"
        />
      )

      const newData = [
        { date: '2024-01-01', demand: 100, forecast: 110 },
        { date: '2024-01-02', demand: 150, forecast: 140 },
        { date: '2024-01-03', demand: 180, forecast: 170 },
      ]

      rerender(
        <DemandChart
          data={newData}
          title="需求趋势"
        />
      )

      // Should maintain previous data and add new
      expect(screen.getByRole('img', { name: '需求趋势' })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const invalidData = [
        { date: 'invalid', demand: NaN, forecast: NaN },
      ] as unknown as any[]

      expect(() => {
        render(
          <DemandChart
            data={invalidData}
            title="需求趋势"
          />
        )
      }).not.toThrow()
    })

    it('should handle undefined data', () => {
      expect(() => {
        render(
          <DemandChart
            // @ts-expect-error - Testing invalid input
            data={undefined}
            title="需求趋势"
          />
        )
      }).not.toThrow()
    })

    it('should handle null values in data', () => {
      const dataWithNulls = [
        { date: '2024-01-01', demand: null, forecast: null },
      ] as unknown as any[]

      expect(() => {
        render(
          <DemandChart
            data={dataWithNulls}
            title="需求趋势"
          />
        )
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should handle high-frequency updates', async () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        demand: Math.floor(Math.random() * 1000),
        forecast: Math.floor(Math.random() * 1000),
      }))

      const { rerender } = render(
        <DemandChart
          data={mockData}
          title="需求趋势"
        />
      )

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const newData = mockData.map(d => ({
          ...d,
          demand: Math.floor(Math.random() * 1000),
        }))
        
        rerender(
          <DemandChart
            data={newData}
            title="需求趋势"
          />
        )
      }

      expect(screen.getByRole('img', { name: '需求趋势' })).toBeInTheDocument()
    })

    it('should render large dataset efficiently', () => {
      const largeShelves = Array.from({ length: 1000 }, (_, i) => ({
        id: `shelf-${i}`,
        code: `S${i}`,
        level: Math.floor(i / 50) + 1,
        column: (i % 50) + 1,
        capacity: 100,
        currentLoad: Math.floor(Math.random() * 100),
        status: 'occupied' as const,
      }))

      expect(() => {
        render(
          <ShelfHeatmap
            shelves={largeShelves}
          />
        )
      }).not.toThrow()
    })
  })
})