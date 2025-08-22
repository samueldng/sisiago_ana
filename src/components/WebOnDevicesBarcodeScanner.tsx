'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Camera, Keyboard, RotateCcw } from 'lucide-react'

interface WebOnDevicesBarcodeScanner {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => void
  title?: string
}

// Configurações do scanner
const BARCODE_CONFIG = {
  start: 0.1,
  end: 0.9,
  threshold: 160,
  quality: 0.45,
  scanInterval: 100, // ms
  minBarcodeLength: 8,
  maxBarcodeLength: 18
}

// Padrões EAN-13
const EAN_PATTERNS = {
  L: [
    '0001101', '0011001', '0010011', '0111101', '0100011',
    '0110001', '0101111', '0111011', '0110111', '0001011'
  ],
  G: [
    '0100111', '0110011', '0011011', '0100001', '0011101',
    '0111001', '0000101', '0010001', '0001001', '0010111'
  ],
  R: [
    '1110010', '1100110', '1101100', '1000010', '1011100',
    '1001110', '1010000', '1000100', '1001000', '1110100'
  ]
}

export default function WebOnDevicesBarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scanner de Código de Barras'
}: WebOnDevicesBarcodeScanner) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [lastScanTime, setLastScanTime] = useState(0)

  // Função para converter padrão binário em dígito
  const patternToDigit = (pattern: string, patternSet: string[]): number => {
    const index = patternSet.indexOf(pattern)
    return index !== -1 ? index : -1
  }

  // Função para validar checksum EAN-13
  const validateEAN13 = (digits: number[]): boolean => {
    if (digits.length !== 13) return false
    
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = digits[i]
      if (digit === undefined) return false
      sum += digit * (i % 2 === 0 ? 1 : 3)
    }
    
    const checkDigit = (10 - (sum % 10)) % 10
    const lastDigit = digits[12]
    if (lastDigit === undefined) return false
    return checkDigit === lastDigit
  }

  // Função para decodificar EAN-13
  const decodeEAN13 = (binaryString: string): string | null => {
    if (binaryString.length < 95) return null
    
    // Procurar pelo padrão de início (101)
    let startIndex = binaryString.indexOf('101')
    if (startIndex === -1) return null
    
    // Verificar se há espaço suficiente para o código completo
    if (startIndex + 95 > binaryString.length) return null
    
    const code = binaryString.substring(startIndex, startIndex + 95)
    
    // Verificar padrões de início e fim
    if (!code.startsWith('101') || !code.endsWith('101')) return null
    
    // Verificar padrão central
    const centerPattern = code.substring(45, 50)
    if (centerPattern !== '01010') return null
    
    const digits: number[] = []
    const leftPatterns: string[] = []
    
    // Decodificar lado esquerdo (6 dígitos)
    for (let i = 0; i < 6; i++) {
      const start = 3 + i * 7
      const pattern = code.substring(start, start + 7)
      leftPatterns.push(pattern)
      
      let digit = patternToDigit(pattern, EAN_PATTERNS.L)
      if (digit === -1) {
        digit = patternToDigit(pattern, EAN_PATTERNS.G)
        if (digit === -1) return null
      }
      digits.push(digit)
    }
    
    // Decodificar lado direito (6 dígitos)
    for (let i = 0; i < 6; i++) {
      const start = 50 + i * 7
      const pattern = code.substring(start, start + 7)
      
      const digit = patternToDigit(pattern, EAN_PATTERNS.R)
      if (digit === -1) return null
      
      digits.push(digit)
    }
    
    // Determinar primeiro dígito baseado nos padrões L/G
    const firstDigitPatterns = [
      'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
      'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'
    ]
    
    let patternString = ''
    for (let i = 0; i < 6; i++) {
      const pattern = leftPatterns[i]
      if (!pattern) return null
      if (EAN_PATTERNS.L.includes(pattern)) {
        patternString += 'L'
      } else {
        patternString += 'G'
      }
    }
    
    const firstDigit = firstDigitPatterns.indexOf(patternString)
    if (firstDigit === -1) return null
    
    const fullDigits = [firstDigit, ...digits]
    
    // Validar checksum
    if (!validateEAN13(fullDigits)) return null
    
    return fullDigits.join('')
  }

  // Função para converter pixels em string binária
  const pixelsToBinary = (imageData: ImageData): string => {
    const { data, width, height } = imageData
    const scanLine = Math.floor(height / 2)
    const startX = Math.floor(width * BARCODE_CONFIG.start)
    const endX = Math.floor(width * BARCODE_CONFIG.end)
    
    let binary = ''
    
    for (let x = startX; x < endX; x++) {
      const index = (scanLine * width + x) * 4
      const r = data[index] ?? 0
      const g = data[index + 1] ?? 0
      const b = data[index + 2] ?? 0
      
      // Converter para escala de cinza
      const gray = (r + g + b) / 3
      
      // Aplicar threshold
      binary += gray < BARCODE_CONFIG.threshold ? '1' : '0'
    }
    
    return binary
  }

  // Função principal de scan
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return
    
    // Configurar canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Desenhar frame do vídeo
    ctx.drawImage(video, 0, 0)
    
    // Obter dados da imagem
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Converter para binário
    const binaryString = pixelsToBinary(imageData)
    
    // Tentar decodificar
    const result = decodeEAN13(binaryString)
    
    if (result && result.length >= BARCODE_CONFIG.minBarcodeLength) {
      const now = Date.now()
      if (now - lastScanTime > 1000) { // Evitar scans duplicados
        setLastScanTime(now)
        onScan(result)
        
        // Feedback sonoro
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          if (AudioContextClass) {
            const audioContext = new AudioContextClass()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
          
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
            
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.1)
          }
        } catch (e) {
          // Ignorar erro de áudio
        }
      }
    }
  }, [isScanning, onScan, lastScanTime])

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        try {
          await videoRef.current.play()
          setIsScanning(true)
        } catch (playError) {
          console.warn('Erro ao reproduzir vídeo:', playError)
          setIsScanning(true)
        }
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setError('Erro ao acessar câmera. Verifique as permissões.')
    }
  }, [])

  // Parar câmera
  const stopCamera = useCallback(() => {
    setIsScanning(false)
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      if (tracks) {
        tracks.forEach(track => {
          if (track && typeof track.stop === 'function') {
            track.stop()
          }
        })
      }
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Fechar scanner
  const handleClose = useCallback(() => {
    stopCamera()
    setError(null)
    setShowManualInput(false)
    setManualInput('')
    onClose()
  }, [stopCamera, onClose])

  // Entrada manual
  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput('')
      setShowManualInput(false)
    }
  }

  // Reiniciar scanner
  const handleRestart = () => {
    stopCamera()
    setTimeout(startCamera, 500)
  }

  // Efeitos
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  useEffect(() => {
    if (isScanning) {
      scanIntervalRef.current = setInterval(scanFrame, BARCODE_CONFIG.scanInterval)
    } else if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [isScanning, scanFrame])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full h-[90vh] flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-6 pt-0">
          {/* Área do vídeo */}
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Overlay de scan */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2">
                <div className="mx-auto w-4/5 h-1 bg-red-500 opacity-75"></div>
                <div className="mx-auto w-4/5 h-1 bg-red-500 opacity-50 mt-2"></div>
                <div className="mx-auto w-4/5 h-1 bg-red-500 opacity-25 mt-2"></div>
              </div>
            </div>
            
            {/* Canvas ocultos para processamento */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Status overlay */}
            <div className="absolute top-4 left-4 right-4">
              {error && (
                <div className="bg-red-500 text-white p-3 rounded-lg mb-2">
                  {error}
                </div>
              )}
              
              {isScanning && (
                <div className="bg-green-500 text-white p-2 rounded-lg text-center">
                  🔍 Escaneando... Posicione o código de barras na linha vermelha
                </div>
              )}
            </div>
          </div>
          
          {/* Controles */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={isScanning ? stopCamera : startCamera}
              variant={isScanning ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {isScanning ? 'Parar' : 'Iniciar'} Scanner
            </Button>
            
            <Button
              onClick={handleRestart}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </Button>
            
            <Button
              onClick={() => setShowManualInput(!showManualInput)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Keyboard className="w-4 h-4" />
              Entrada Manual
            </Button>
          </div>
          
          {/* Entrada manual */}
          {showManualInput && (
            <div className="flex gap-2 mt-4">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Digite o código manualmente"
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button onClick={handleManualSubmit}>OK</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}