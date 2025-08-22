'use client'

import { useEffect, useRef } from 'react'

interface ChartData {
  label: string
  value: number
}

interface SimpleChartProps {
  data: ChartData[]
  type: 'bar' | 'line' | 'doughnut'
  color?: string
  formatValue?: (value: number) => string
  height?: number
}

export default function SimpleChart({ 
  data, 
  type, 
  color = '#3b82f6', 
  formatValue = (value) => value.toString(),
  height = 300 
}: SimpleChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar canvas
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    // Limpar canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Configurações gerais
    const padding = 60
    const chartWidth = rect.width - padding * 2
    const chartHeight = rect.height - padding * 2
    const maxValue = Math.max(...data.map(d => d.value))

    if (type === 'bar') {
      drawBarChart(ctx, data, rect.width, rect.height, padding, chartWidth, chartHeight, maxValue, color, formatValue)
    } else if (type === 'line') {
      drawLineChart(ctx, data, rect.width, rect.height, padding, chartWidth, chartHeight, maxValue, color, formatValue)
    } else if (type === 'doughnut') {
      drawDoughnutChart(ctx, data, rect.width, rect.height, color, formatValue)
    }
  }, [data, type, color, formatValue])

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData[],
    width: number,
    height: number,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    maxValue: number,
    color: string,
    formatValue: (value: number) => string
  ) => {
    const barWidth = chartWidth / data.length * 0.8
    const barSpacing = chartWidth / data.length * 0.2

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2
      const y = height - padding - barHeight

      // Desenhar barra
      ctx.fillStyle = color
      ctx.fillRect(x, y, barWidth, barHeight)

      // Desenhar label
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(item.label, x + barWidth / 2, height - padding + 20)

      // Desenhar valor
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px sans-serif'
      ctx.fillText(formatValue(item.value), x + barWidth / 2, y - 5)
    })

    // Desenhar eixos
    drawAxes(ctx, width, height, padding)
  }

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData[],
    width: number,
    height: number,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    maxValue: number,
    color: string,
    formatValue: (value: number) => string
  ) => {
    const pointSpacing = chartWidth / (data.length - 1)

    // Desenhar linha
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((item, index) => {
      const x = padding + index * pointSpacing
      const y = height - padding - (item.value / maxValue) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Desenhar pontos
    data.forEach((item, index) => {
      const x = padding + index * pointSpacing
      const y = height - padding - (item.value / maxValue) * chartHeight

      // Ponto
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()

      // Label
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(item.label, x, height - padding + 20)

      // Valor
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px sans-serif'
      ctx.fillText(formatValue(item.value), x, y - 10)
    })

    // Desenhar eixos
    drawAxes(ctx, width, height, padding)
  }

  const drawDoughnutChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData[],
    width: number,
    height: number,
    baseColor: string,
    formatValue: (value: number) => string
  ) => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 3
    const innerRadius = radius * 0.6
    const total = data.reduce((sum, item) => sum + item.value, 0)

    let currentAngle = -Math.PI / 2
    const colors = generateColors(data.length, baseColor)

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI
      const endAngle = currentAngle + sliceAngle

      // Desenhar fatia
      ctx.fillStyle = colors[index] || baseColor
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, endAngle)
      ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true)
      ctx.closePath()
      ctx.fill()

      // Desenhar label
      const labelAngle = currentAngle + sliceAngle / 2
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20)
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20)

      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(item.label, labelX, labelY)

      // Desenhar valor
      const valueX = centerX + Math.cos(labelAngle) * (radius + 35)
      const valueY = centerY + Math.sin(labelAngle) * (radius + 35)
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px sans-serif'
      ctx.fillText(formatValue(item.value), valueX, valueY + 12)

      currentAngle = endAngle
    })
  }

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    padding: number
  ) => {
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1

    // Eixo X
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Eixo Y
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()
  }

  const generateColors = (count: number, baseColor: string): string[] => {
    const colors = []
    const hue = parseInt(baseColor.slice(1, 3), 16)
    
    for (let i = 0; i < count; i++) {
      const saturation = 70 + (i * 10) % 30
      const lightness = 50 + (i * 15) % 40
      colors.push(`hsl(${(hue + i * 360 / count) % 360}, ${saturation}%, ${lightness}%)`)
    }
    
    return colors
  }

  if (!data.length) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full border rounded-lg bg-white"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}