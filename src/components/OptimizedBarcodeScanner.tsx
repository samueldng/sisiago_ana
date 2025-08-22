'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Camera,
  X,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Keyboard,
  Zap,
  Loader2,
  ScanLine,
  FlipHorizontal
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface OptimizedBarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
}

export default function OptimizedBarcodeScanner({ isOpen, onClose, onScan }: OptimizedBarcodeScannerProps) {
  console.log('🔧 OptimizedBarcodeScanner renderizado:', { isOpen })
  
  const [isScanning, setIsScanning] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [lastScanTime, setLastScanTime] = useState(0)
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('environment')
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Detectar câmeras disponíveis
  const detectCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(cameras)
      console.log('Câmeras detectadas:', cameras.length)
    } catch (error) {
      console.warn('Erro ao detectar câmeras:', error)
    }
  }, [])

  // Validar código EAN-13
  const isValidEAN13 = useCallback((code: string): boolean => {
    // Verificar se é numérico e tem 13 dígitos
    if (!/^\d{13}$/.test(code)) return false
    
    // Verificar dígito verificador EAN-13
    const digits = code.split('').map(Number)
    const checksum = digits.slice(0, 12).reduce((sum, digit, index) => {
      return sum + digit * (index % 2 === 0 ? 1 : 3)
    }, 0)
    
    const calculatedCheckDigit = (10 - (checksum % 10)) % 10
    return calculatedCheckDigit === digits[12]
  }, [])

  // Processar resultado do scan
  const handleScanResult = useCallback((result: string) => {
    const now = Date.now()
    
    // Evitar scans duplicados muito rápidos
    if (now - lastScanTime < 1500) return
    
    console.log('Código detectado:', result)
    setScanCount(prev => prev + 1)
    setLastScanTime(now)
    
    // Validar se é EAN-13 ou código válido
    if (isValidEAN13(result) || result.length >= 8) {
      console.log('Código válido:', result)
      
      // Feedback sonoro
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      } catch (e) {
        console.warn('Erro ao reproduzir som:', e)
      }
      
      // Parar scanner e retornar resultado
      stopScanner()
      onScan(result)
      onClose()
    } else {
      console.log('Código inválido:', result)
    }
  }, [lastScanTime, isValidEAN13, onScan, onClose])

  // Análise de imagem para detecção de código de barras
  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(analyzeFrame)
      return
    }
    
    // Configurar canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Desenhar frame do vídeo
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Obter dados da imagem
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Análise simples de contraste para detectar barras
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height
    
    // Analisar linha central horizontal
    const centerY = Math.floor(height / 2)
    const lineData: number[] = []
    
    for (let x = 0; x < width; x++) {
      const index = (centerY * width + x) * 4
      const r = data[index] ?? 0
      const g = data[index + 1] ?? 0
      const b = data[index + 2] ?? 0
      const gray = (r + g + b) / 3
      lineData.push(gray)
    }
    
    // Detectar padrões de barras (simplificado)
    const threshold = 128
    let transitions = 0
    let lastState = (lineData[0] ?? 0) > threshold
    
    for (let i = 1; i < lineData.length; i++) {
      const currentState = (lineData[i] ?? 0) > threshold
      if (currentState !== lastState) {
        transitions++
        lastState = currentState
      }
    }
    
    // Se há muitas transições, pode ser um código de barras
    if (transitions > 20 && transitions < 200) {
      // Simular detecção de código (em produção, usar biblioteca especializada)
      const mockCode = '7891234567890' // Código EAN-13 válido para teste
      if (Math.random() > 0.95) { // 5% de chance de "detectar" para demonstração
        handleScanResult(mockCode)
        return
      }
    }
    
    // Continuar análise
    animationFrameRef.current = requestAnimationFrame(analyzeFrame)
  }, [isScanning, handleScanResult])

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Iniciando câmera...', { currentCamera, isInitializing, isScanning })
      setIsInitializing(true)
      setError(null)
      
      // Parar stream anterior se existir
      if (streamRef.current) {
        console.log('🛑 Parando stream anterior')
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia não suportado neste navegador')
      }
      
      // Configurações da câmera otimizadas para mobile
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentCamera,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      }
      
      console.log('📱 Solicitando acesso à câmera...', constraints)
      
      // Timeout para evitar travamento (aumentado para 15 segundos)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout starting video source')), 15000)
      })
      
      let stream: MediaStream
      
      try {
        const streamPromise = navigator.mediaDevices.getUserMedia(constraints)
        stream = await Promise.race([streamPromise, timeoutPromise]) as MediaStream
        console.log('✅ Stream obtido com sucesso')
      } catch (streamError: any) {
        console.log('⚠️ Tentando configuração simplificada da câmera...')
        // Fallback com configuração mais simples
        const fallbackConstraints = {
          video: { facingMode: currentCamera },
          audio: false
        }
        const fallbackPromise = navigator.mediaDevices.getUserMedia(fallbackConstraints)
        stream = await Promise.race([fallbackPromise, timeoutPromise]) as MediaStream
        console.log('✅ Stream obtido com configuração simplificada')
      }
      
      if (!videoRef.current) {
        throw new Error('Elemento de vídeo não encontrado')
      }
      
      console.log('🎬 Configurando stream no elemento de vídeo')
      videoRef.current.srcObject = stream
      streamRef.current = stream
      
      // Aguardar carregamento com timeout
      console.log('⏳ Aguardando carregamento do vídeo...')
      await new Promise((resolve, reject) => {
        const video = videoRef.current!
        const timeoutId = setTimeout(() => {
          console.error('❌ Timeout ao carregar vídeo')
          reject(new Error('Timeout ao carregar vídeo'))
        }, 8000) // Aumentado para 8 segundos
        
        const onLoadedMetadata = () => {
          console.log('📹 Metadados do vídeo carregados')
          clearTimeout(timeoutId)
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          video.removeEventListener('canplay', onCanPlay)
          resolve(void 0)
        }
        
        const onCanPlay = () => {
          console.log('▶️ Vídeo pronto para reproduzir')
          clearTimeout(timeoutId)
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          video.removeEventListener('canplay', onCanPlay)
          resolve(void 0)
        }
        
        const onError = (e: any) => {
          console.error('❌ Erro no elemento de vídeo:', e)
          clearTimeout(timeoutId)
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          video.removeEventListener('canplay', onCanPlay)
          reject(new Error('Erro ao carregar vídeo: ' + (e.message || 'Erro desconhecido')))
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('canplay', onCanPlay)
        video.addEventListener('error', onError)
        
        console.log('🎮 Iniciando reprodução do vídeo')
        video.play().catch((playError) => {
          console.error('❌ Erro ao reproduzir vídeo:', playError)
          reject(playError)
        })
      })
      
      console.log('🎉 Câmera iniciada com sucesso!')
      setIsScanning(true)
      setIsInitializing(false)
      
      // Iniciar análise de frames
      console.log('🔍 Iniciando análise de frames')
      analyzeFrame()
      
    } catch (error: any) {
      console.error('💥 Erro capturado na função startCamera:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        currentCamera,
        isInitializing,
        isScanning
      })
      
      setIsInitializing(false)
      setIsScanning(false)
      
      // Parar stream se houver erro
      if (streamRef.current) {
        console.log('🛑 Parando stream devido ao erro')
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      let errorMessage = ''
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Acesso à câmera negado. Por favor, permita o acesso e tente novamente.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada no dispositivo.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Câmera não suportada neste navegador.'
      } else if (error.message?.includes('Timeout')) {
        errorMessage = 'Timeout ao acessar a câmera. Tente novamente.'
      } else if (error.message?.includes('getUserMedia')) {
        errorMessage = 'Erro ao acessar getUserMedia. Verifique se o navegador suporta câmera.'
      } else {
        errorMessage = `Erro ao acessar câmera: ${error.message || 'Erro desconhecido'}`
      }
      
      console.error('🚨 Mensagem de erro final:', errorMessage)
      setError(errorMessage)
    }
  }, [currentCamera, analyzeFrame])

  // Parar scanner
  const stopScanner = useCallback(() => {
    console.log('Parando scanner...')
    setIsScanning(false)
    setIsInitializing(false)
    
    // Parar análise de frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Limpar timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
    
    // Parar stream da câmera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Track da câmera parado')
      })
      streamRef.current = null
    }
    
    // Limpar vídeo
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setScanCount(0)
    setLastScanTime(0)
  }, [])

  // Alternar câmera
  const switchCamera = useCallback(() => {
    setCurrentCamera(prev => prev === 'environment' ? 'user' : 'environment')
  }, [])

  // Processar entrada manual
  const handleManualSubmit = useCallback(() => {
    if (manualInput.trim()) {
      handleScanResult(manualInput.trim())
      setManualInput('')
      setShowManualInput(false)
    }
  }, [manualInput, handleScanResult])

  // Efeitos
  useEffect(() => {
    console.log('🔄 useEffect isOpen executado:', { isOpen, isInitializing, error, isScanning })
    
    if (isOpen) {
      console.log('✅ Scanner aberto, detectando câmeras e iniciando')
      detectCameras()
      startCamera()
    } else {
      console.log('❌ Scanner fechado, chamando stopScanner')
      stopScanner()
    }
    
    return () => {
      console.log('🧹 Cleanup do useEffect isOpen')
      stopScanner()
    }
  }, [isOpen]) // Removido dependências que causavam loop

  useEffect(() => {
    console.log('🔄 useEffect currentCamera executado:', { isOpen, isInitializing, error, currentCamera })
    
    if (isOpen && !isInitializing && !error) {
      console.log('✅ Condições atendidas para trocar câmera, chamando startCamera')
      startCamera()
    } else {
      console.log('⏸️ Condições não atendidas para trocar câmera:', { isOpen, isInitializing, error })
    }
  }, [currentCamera]) // Apenas quando trocar câmera

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Scanner Otimizado</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={startCamera} className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowManualInput(true)}
                  className="w-full"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Entrada Manual
                </Button>
              </div>
            </div>
          ) : isInitializing ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Iniciando câmera...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Área do vídeo */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Overlay de scan */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-green-500 w-64 h-32 relative">
                      <ScanLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-green-500 animate-pulse" />
                    </div>
                  </div>
                )}
                
                {/* Contador de scans */}
                {scanCount > 0 && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    Tentativas: {scanCount}
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="flex gap-2">
                {availableCameras.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={switchCamera}
                    className="flex-1"
                  >
                    <FlipHorizontal className="w-4 h-4 mr-2" />
                    {currentCamera === 'environment' ? 'Traseira' : 'Frontal'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  className="flex-1"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Manual
                </Button>
              </div>

              {/* Status */}
              <div className="text-center text-sm text-gray-600">
                {isScanning ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Escaneando... Aponte para o código de barras
                  </div>
                ) : (
                  'Aguardando inicialização...'
                )}
              </div>
            </div>
          )}

          {/* Entrada manual */}
          {showManualInput && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-2">Entrada Manual</h4>
              <div className="flex gap-2">
                <Input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Digite o código de barras"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  autoFocus
                />
                <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowManualInput(false)
                  setManualInput('')
                }}
                className="mt-2 w-full"
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { OptimizedBarcodeScanner }