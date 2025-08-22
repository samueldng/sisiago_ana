'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Camera,
  X,
  CheckCircle,
  RotateCcw,
  Keyboard,
  Zap
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SimpleBarcodeScanner {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
  title?: string
}

export default function SimpleBarcodeScanner({ onScan, onClose, isOpen, title = 'Scanner de Código de Barras' }: SimpleBarcodeScanner) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastScanRef = useRef<string | null>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Configurações do scanner
  const config = {
    start: 0.1,
    end: 0.9,
    threshold: 160,
    quality: 0.45,
    scanInterval: 100
  }

  // Função para detectar código de barras usando análise de pixels
  const detectBarcode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return

    // Configurar canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Desenhar frame do vídeo no canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Área de scan (linha horizontal no meio)
    const scanY = Math.floor(canvas.height * 0.5)
    const startX = Math.floor(canvas.width * config.start)
    const endX = Math.floor(canvas.width * config.end)
    
    // Obter dados dos pixels da linha de scan
    const imageData = ctx.getImageData(startX, scanY, endX - startX, 1)
    const data = imageData.data
    
    // Converter para escala de cinza e aplicar threshold
    const grayData: number[] = []
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      grayData.push(gray > config.threshold ? 1 : 0)
    }
    
    // Detectar padrões de código de barras
    const barcode = analyzeBarcode(grayData)
    
    if (barcode && barcode !== lastScanRef.current) {
      console.log('Código detectado:', barcode)
      lastScanRef.current = barcode
      setScanCount(prev => prev + 1)
      
      // Validar código
      if (isValidBarcode(barcode)) {
        // Feedback sonoro
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmHgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
          audio.play().catch(() => {})
        } catch (e) {}
        
        // Parar scanner e retornar resultado
        setIsScanning(false)
        onScan(barcode)
        onClose()
        return
      }
    }
    
    // Continuar scanning
    if (isScanning) {
      scanTimeoutRef.current = setTimeout(detectBarcode, config.scanInterval)
    }
  }, [isScanning, onScan, onClose, config.scanInterval, config.start, config.end, config.threshold])

  // Analisar dados de pixels para detectar código de barras
  const analyzeBarcode = (data: number[]): string | null => {
    // Detectar transições (mudanças de 0 para 1 ou 1 para 0)
    const transitions: number[] = []
    let currentState = data[0]
    let currentLength = 1
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] === currentState) {
        currentLength++
      } else {
        transitions.push(currentLength)
        currentState = data[i]
        currentLength = 1
      }
    }
    transitions.push(currentLength)
    
    // Verificar se temos transições suficientes para um código de barras
    if (transitions.length < 20) return null
    
    // Tentar decodificar como sequência numérica simples
    const code = generateNumericCode(transitions)
    return code
  }

  // Gerar código numérico baseado nas transições
  const generateNumericCode = (transitions: number[]): string | null => {
    // Algoritmo simplificado para gerar código baseado em padrões
    const sum = transitions.reduce((a, b) => a + b, 0)
    const avg = sum / transitions.length
    
    let code = ''
    for (let i = 0; i < Math.min(13, transitions.length); i++) {
      const transition = transitions[i]
      if (transition !== undefined) {
        const digit = Math.floor((transition / avg) * 10) % 10
        code += digit.toString()
      }
    }
    
    return code.length >= 8 ? code : null
  }

  // Validar código de barras
  const isValidBarcode = (code: string): boolean => {
    return /^[0-9]{8,13}$/.test(code)
  }

  // Iniciar scanner
  const startScanner = useCallback(async () => {
    if (isScanning) return
    
    setError(null)
    setScanCount(0)
    lastScanRef.current = null
    
    try {
      console.log('Iniciando scanner simples...')
      
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        try {
          await videoRef.current.play()
          setIsScanning(true)
          console.log('Scanner simples iniciado com sucesso')
          
          // Iniciar detecção após um pequeno delay
          setTimeout(() => {
            detectBarcode()
          }, 500)
        } catch (playError) {
          console.warn('Erro ao reproduzir vídeo:', playError)
          // Mesmo com erro de play, continuar com o scanner
          setIsScanning(true)
          setTimeout(() => {
            detectBarcode()
          }, 500)
        }
      }
    } catch (err: any) {
      console.error('Erro ao iniciar scanner:', err)
      
      if (err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Permita o acesso à câmera.')
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada.')
      } else {
        setError('Erro ao acessar a câmera: ' + err.message)
      }
    }
  }, [isScanning, detectBarcode])

  // Parar scanner
  const stopScanner = useCallback(() => {
    console.log('Parando scanner...')
    setIsScanning(false)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    lastScanRef.current = null
    setScanCount(0)
  }, [stream])

  useEffect(() => {
    if (isOpen) {
      startScanner()
    } else {
      stopScanner()
    }
    
    return () => {
      stopScanner()
    }
  }, [isOpen, startScanner, stopScanner])

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput('')
      setShowManualInput(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-500" />
              {title}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={startScanner} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowManualInput(true)}
                  className="w-full"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Inserir Manualmente
                </Button>
              </div>
            </div>
          ) : showManualInput ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Digite o código de barras:
                </label>
                <Input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Ex: 1234567890123"
                  className="w-full"
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleManualSubmit} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowManualInput(false)}
                  className="flex-1"
                >
                  Voltar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay de scanning */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-green-400 border-dashed rounded-lg w-48 h-24 flex items-center justify-center animate-pulse">
                    {isScanning ? (
                      <div className="text-white text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Zap className="w-5 h-5 mr-2 text-green-400" />
                          <Camera className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-sm font-medium">Scanner Ativo</p>
                        <p className="text-xs mt-1 opacity-75">Posicione o código aqui</p>
                        {scanCount > 0 && (
                          <p className="text-xs mt-1 opacity-75">
                            Tentativas: {scanCount}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-white text-center">
                        <Camera className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm">Iniciando...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-center text-sm">
                {isScanning ? (
                  <div className="flex items-center justify-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Scanner ativo - Análise de pixels
                  </div>
                ) : (
                  <p className="text-gray-600">Preparando scanner...</p>
                )}
              </div>

              {/* Controles */}
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button onClick={startScanner} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Iniciar Scanner
                  </Button>
                ) : (
                  <Button onClick={stopScanner} variant="destructive" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Parar Scanner
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Manual
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}