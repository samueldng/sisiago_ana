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
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AdvancedBarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
  title?: string
}

export default function AdvancedBarcodeScanner({ onScan, onClose, isOpen, title = 'Scanner de Código de Barras' }: AdvancedBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [quaggaLoaded, setQuaggaLoaded] = useState(false)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const quaggaRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Função para carregar Quagga com retry
  const loadQuagga = useCallback(async () => {
    if (quaggaLoaded) return true
    
    try {
      if (typeof window !== 'undefined') {
        console.log('Carregando biblioteca Quagga...')
        const QuaggaModule = await import('quagga')
        quaggaRef.current = QuaggaModule.default || QuaggaModule
        setQuaggaLoaded(true)
        console.log('Quagga carregado com sucesso')
        return true
      }
    } catch (err) {
      console.error('Erro ao carregar Quagga:', err instanceof Error ? err.message : 'Erro desconhecido')
      setError('Erro ao carregar biblioteca de scanner. Tente recarregar a página.')
      return false
    }
    return false
  }, [quaggaLoaded])

  const handleBarcodeDetected = useCallback((data: any) => {
    const code = data.codeResult.code
    const quality = data.codeResult.quality
    
    console.log('Código detectado:', code, 'Qualidade:', quality)
    
    // Incrementar contador de scans
    setScanCount(prev => prev + 1)
    
    // Verificar qualidade mínima reduzida e evitar duplicatas
    if (code && code.length >= 6 && code !== lastScan && isScanning && quality > 30) {
      // Validar se o código contém apenas números (para EAN/UPC) ou formato alfanumérico válido
      const isValidBarcode = /^[0-9]{6,}$/.test(code) || /^[0-9A-Z\-]{6,}$/.test(code)
      
      if (isValidBarcode) {
        setLastScan(code)
        setIsScanning(false)
        
        // Feedback sonoro
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmHgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
          audio.play().catch(() => {})
        } catch (e) {}
        
        // Parar scanner e retornar resultado
        setTimeout(() => {
          const Quagga = quaggaRef.current
          if (Quagga && typeof Quagga.stop === 'function') {
            Quagga.stop()
          }
          onScan(code)
          stopScanner()
          onClose()
        }, 200)
      } else {
        console.log('Código inválido ignorado:', code)
      }
    }
  }, [isScanning, lastScan, onScan, onClose])

  useEffect(() => {
    loadQuagga()
  }, [])

  const startScanner = useCallback(async () => {
    if (isInitializing || isScanning) {
      console.log('Scanner já está sendo inicializado ou está ativo')
      return
    }

    setIsInitializing(true)
    setError(null)
    setPermissionDenied(false)
    setLastScan(null)
    setScanCount(0)

    try {
      // Verificar se Quagga está carregado
      if (!quaggaLoaded || !quaggaRef.current) {
        console.log('Aguardando carregamento do Quagga...')
        const loaded = await loadQuagga()
        if (!loaded) {
          throw new Error('Falha ao carregar biblioteca de scanner')
        }
      }

      console.log('Iniciando scanner avançado...')
      console.log('HTTPS:', window.location.protocol === 'https:')
      console.log('Localhost:', window.location.hostname === 'localhost')

      // Verificar suporte à câmera
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador')
      }

      // Parar qualquer scanner anterior
      if (isScanning) {
        setIsScanning(false)
        if (quaggaRef.current && typeof quaggaRef.current.stop === 'function') {
          quaggaRef.current.stop()
        }
      }

      // Configurações otimizadas para diferentes dispositivos
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      }

      console.log('Solicitando acesso à câmera...')
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (!videoRef.current) {
        throw new Error('Elemento de vídeo não encontrado')
      }

      videoRef.current.srcObject = mediaStream
      
      // Aguardar o vídeo carregar
      await new Promise((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Elemento de vídeo perdido'))
          return
        }
        
        const video = videoRef.current
        
        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          resolve(void 0)
        }
        
        const onError = (e: any) => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          reject(new Error('Erro ao carregar vídeo: ' + e.message))
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)
        
        video.play().catch(reject)
      })
      console.log('Câmera iniciada, configurando Quagga...')
      
      // Aguardar um pouco para garantir que o vídeo está pronto
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const Quagga = quaggaRef.current
      
      // Configuração otimizada do Quagga para melhor detecção
      const quaggaConfig = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
            facingMode: "environment"
          }
        },
        locator: {
          patchSize: "large",
          halfSample: false
        },
        numOfWorkers: Math.min(navigator.hardwareConcurrency || 2, 2),
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader",
            "codabar_reader"
          ],
          debug: {
            drawBoundingBox: true,
            showFrequency: true,
            drawScanline: true,
            showPattern: true
          }
        },
        locate: true,
        frequency: 20
      }
      
      // Inicializar Quagga com Promise
      await new Promise((resolve, reject) => {
        Quagga.init(quaggaConfig, (err: any) => {
          if (err) {
            console.error('Erro ao inicializar Quagga:', err)
            reject(new Error('Erro ao inicializar scanner: ' + err.message))
            return
          }
          
          console.log('Quagga inicializado com sucesso')
          
          // Configurar callback de detecção
          Quagga.onDetected(handleBarcodeDetected)
          
          // Adicionar callback para processar dados em tempo real
          Quagga.onProcessed((result: any) => {
            const drawingCtx = Quagga.canvas.ctx.overlay
            const drawingCanvas = Quagga.canvas.dom.overlay
            
            if (result) {
              if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute('width') || '0'), parseInt(drawingCanvas.getAttribute('height') || '0'))
                result.boxes.filter((box: any) => box !== result.box).forEach((box: any) => {
                  Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: 'green', lineWidth: 2})
                })
              }
              
              if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: 'blue', lineWidth: 2})
              }
              
              if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3})
              }
            }
          })
          
          // Iniciar o scanner
          Quagga.start()
          setIsScanning(true)
          console.log('Scanner iniciado e ativo')
          resolve(void 0)
        })
      })
      
      setIsInitializing(false)

    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err instanceof Error ? err.message : 'Erro desconhecido')
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true)
        setError('Permissão de câmera negada. Clique no ícone de câmera na barra de endereços e permita o acesso.')
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.')
      } else if (err.name === 'NotSupportedError') {
        setError('Câmera não suportada neste navegador.')
      } else {
        setError(err.message || 'Erro ao acessar a câmera')
      }
      
      setIsScanning(false)
      setIsInitializing(false)
    }
  }, [quaggaLoaded, loadQuagga, handleBarcodeDetected])

  const stopScanner = useCallback(async () => {
    console.log('Parando scanner...')
    setIsScanning(false)
    setIsInitializing(false)
    setError(null)
    
    // Limpar timeout se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // Parar Quagga se estiver rodando
    try {
      const Quagga = quaggaRef.current
      if (Quagga && typeof Quagga.stop === 'function') {
        Quagga.stop()
        console.log('Quagga parado')
      }
    } catch (error) {
      // Ignorar erros de parada do Quagga - não são críticos
      console.warn('Aviso ao parar Quagga:', error)
    }
    
    // Parar stream da câmera
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('Track da câmera parado')
      })
      setStream(null)
    }
    
    // Limpar vídeo
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setPermissionDenied(false)
    setLastScan(null)
    setScanCount(0)
  }, [stream])

  useEffect(() => {
    if (isOpen && quaggaLoaded) {
      startScanner()
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isOpen, quaggaLoaded, startScanner, stopScanner])

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput('')
      setShowManualInput(false)
      onClose()
    }
  }

  const handleRetry = () => {
    setPermissionDenied(false)
    setError(null)
    startScanner()
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {!quaggaLoaded ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando scanner...</p>
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
                  placeholder="Ex: 7894900011517"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleManualSubmit} className="flex-1">
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
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-y-2">
                {permissionDenied && (
                  <Button onClick={handleRetry} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setShowManualInput(true)} 
                  className="w-full"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Digitar Código
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Área do vídeo */}
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Overlay de scanning */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-green-400 border-dashed rounded-lg w-64 h-32 flex items-center justify-center animate-pulse">
                    {isInitializing ? (
                      <div className="text-white text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-green-400" />
                        <p className="text-sm font-medium">Inicializando...</p>
                        <p className="text-xs mt-1 opacity-75">Carregando câmera</p>
                      </div>
                    ) : isScanning ? (
                      <div className="text-white text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Zap className="w-6 h-6 mr-2 text-green-400" />
                          <Camera className="w-6 h-6 text-green-400" />
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
                        <Camera className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Iniciando scanner...</p>
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
                    Scanner automático ativo - Detecção em tempo real
                  </div>
                ) : (
                  <p className="text-gray-600">Preparando scanner...</p>
                )}
              </div>

              {/* Controles */}
              <div className="flex gap-2">
                {!isScanning && !isInitializing ? (
                  <Button
                    onClick={startScanner}
                    disabled={isInitializing}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Iniciar Scanner
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanner}
                    disabled={isInitializing}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Inicializando...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Parar Scanner
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  disabled={isInitializing}
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

// Exportação nomeada para compatibilidade
export { AdvancedBarcodeScanner as BarcodeScanner }