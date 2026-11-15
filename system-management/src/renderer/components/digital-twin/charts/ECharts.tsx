import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface ChartData {
  name: string
  value: number
}

interface PieChartProps {
  title: string
  data: ChartData[]
  colors?: string[]
  height?: number
}

export function PieChart({ title, data, colors, height = 250 }: PieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    const option: any = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#94a3b8' }
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#1e293b',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: data.map((item, index) => ({
            ...item,
            itemStyle: { color: colors?.[index] || defaultColors[index % defaultColors.length] }
          }))
        }
      ]
    }

    chartInstance.current.setOption(option)

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [title, data, colors])

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '12px' }}>{title}</div>
      <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  )
}

interface LineChartProps {
  title: string
  data: { time: string; value: number }[]
  unit?: string
  color?: string
  height?: number
}

export function LineChart({ title, data, unit = '', color = '#3b82f6', height = 200 }: LineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    const option: any = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0]
          return `${p.name}<br/>${p.value}${unit}`
        }
      },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.time),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
      },
      series: [
        {
          name: title,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color, width: 2 },
          itemStyle: { color },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '10' }
            ])
          },
          data: data.map(d => d.value)
        }
      ]
    }

    chartInstance.current.setOption(option)

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [title, data, unit, color, height])

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>{title}</div>
      <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  )
}

interface GaugeChartProps {
  title: string
  value: number
  max?: number
  unit?: string
  color?: string
  height?: number
}

export function GaugeChart({ title, value, max = 100, unit = '%', color = '#3b82f6', height = 200 }: GaugeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    const option: any = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: max,
          splitNumber: 5,
          itemStyle: { color },
          progress: { show: true, width: 20 },
          pointer: { show: false },
          axisLine: { lineStyle: { width: 20, color: [[1, '#334155']] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            fontSize: 28,
            fontWeight: 'bold',
            color: '#e2e8f0',
            offsetCenter: [0, '30%'],
            formatter: `{value}${unit}`
          },
          data: [{ value }]
        }
      ]
    }

    chartInstance.current.setOption(option)

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [title, value, max, unit, color, height])

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>{title}</div>
      <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  )
}

interface BarChartProps {
  title: string
  data: { name: string; value: number }[]
  color?: string
  height?: number
}

export function BarChart({ title, data, color = '#3b82f6', height = 200 }: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    const option: any = {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
      },
      series: [
        {
          name: title,
          type: 'bar',
          barWidth: '60%',
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color },
              { offset: 1, color: color + '60' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          data: data.map(d => d.value)
        }
      ]
    }

    chartInstance.current.setOption(option)

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [title, data, color, height])

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px' }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>{title}</div>
      <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  )
}