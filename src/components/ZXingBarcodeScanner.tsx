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
import { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library'

interface ZXingBarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
}

export default function ZXingBarcodeScanner({ isOpen, onClose, onScan }: ZXingBarcodeScannerProps) {
  console.log('🔧 ZXingBarcodeScanner renderizado:', { isOpen })
  
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
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializar leitor ZXing
  const initializeReader = useCallback(() => {
    if (!readerRef.current) {
      console.log('🔧 Inicializando ZXing reader...')
      const reader = new BrowserMultiFormatReader()
      
      // Configurar hints para otimizar detecção
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)
      
      reader.hints = hints
      readerRef.current = reader
      console.log('✅ ZXing reader inicializado com hints otimizados')
    }
    return readerRef.current
  }, [])

  // Detectar câmeras disponíveis
  const detectCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(cameras)
      console.log('📷 Câmeras detectadas:', cameras.length)
    } catch (error) {
      console.warn('⚠️ Erro ao detectar câmeras:', error)
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
    
    console.log('📊 Código detectado pelo ZXing:', result)
    setScanCount(prev => prev + 1)
    setLastScanTime(now)
    
    // Validar se é EAN-13 ou código válido
    if (isValidEAN13(result) || result.length >= 8) {
      console.log('✅ Código válido:', result)
      
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
        console.warn('⚠️ Erro ao reproduzir som:', e)
      }
      
      // Parar scanner e retornar resultado
      stopScanner()
      onScan(result)
      onClose()
    } else {
      console.log('❌ Código inválido:', result)
    }
  }, [lastScanTime, isValidEAN13, onScan, onClose])

  // Iniciar scanner ZXing
  const startScanner = useCallback(async () => {
    console.log('🚀 Iniciando ZXing scanner...', { currentCamera, isInitializing, isScanning })
    
    // Evitar múltiplas inicializações
    if (isInitializing || isScanning) {
      console.log('⏸️ Scanner já está inicializando ou ativo, ignorando...')
      return Promise.resolve()
    }
    
    try {
      setIsInitializing(true)
      setError('')
      setScanCount(0)
      setLastScanTime(0)
      
      // Parar scanner anterior se existir
      if (readerRef.current) {
        console.log('🛑 Resetando scanner anterior')
        try {
          readerRef.current.reset()
        } catch (e) {
          console.warn('⚠️ Erro ao resetar scanner:', e)
        }
      }
      
      // Inicializar reader
      const reader = initializeReader()
      
      // Aguardar e verificar se o elemento de vídeo está disponível
      let attempts = 0
      const maxAttempts = 20 // 2 segundos no máximo
      
      while (!videoRef.current && attempts < maxAttempts) {
        console.log(`⏳ Tentativa ${attempts + 1}/${maxAttempts} - Aguardando elemento de vídeo...`)
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      if (!videoRef.current) {
        console.error('❌ Elemento de vídeo não encontrado após', maxAttempts, 'tentativas')
        throw new Error('Elemento de vídeo não encontrado')
      }
      
      console.log('✅ Elemento de vídeo encontrado após', attempts, 'tentativas')
      
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia não suportado neste navegador')
      }
      
      // Configurações da câmera otimizadas
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentCamera,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      }
      
      console.log('📱 Solicitando acesso à câmera com ZXing...', constraints)
      
      // Timeout para evitar travamento
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout starting video source')), 10000)
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
      
      streamRef.current = stream
      
      // Aguardar o vídeo carregar
      console.log('⏳ Aguardando carregamento do vídeo...')
      await new Promise((resolve, reject) => {
        const video = videoRef.current
        
        if (!video) {
          console.error('❌ Elemento de vídeo não encontrado')
          reject(new Error('Elemento de vídeo não encontrado'))
          return
        }
        
        const timeoutId = setTimeout(() => {
          console.error('❌ Timeout ao carregar vídeo')
          if (video) {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
          }
          reject(new Error('Timeout ao carregar vídeo'))
        }, 5000)
        
        const onLoadedMetadata = () => {
          console.log('📹 Metadados do vídeo carregados')
          clearTimeout(timeoutId)
          if (video) {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
          }
          resolve(void 0)
        }
        
        const onError = (e: any) => {
          console.error('❌ Erro no elemento de vídeo:', e)
          clearTimeout(timeoutId)
          if (video) {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
          }
          reject(new Error('Erro ao carregar vídeo: ' + (e.message || 'Erro desconhecido')))
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)
        
        // Limpar srcObject anterior se existir
        if (video.srcObject) {
          video.srcObject = null
        }
        
        video.srcObject = stream
        
        // Aguardar um pouco antes de tentar reproduzir
        setTimeout(() => {
          if (video && video.srcObject === stream && mountedRef.current) {
            video.play().catch((playError) => {
              console.warn('⚠️ Erro ao reproduzir vídeo:', playError)
              if (playError.name !== 'AbortError') {
                reject(playError)
              }
            })
          }
        }, 100)
      })
      
      console.log('🎉 Vídeo carregado, iniciando detecção ZXing...')
      setIsScanning(true)
      setIsInitializing(false)
      
      // Iniciar detecção contínua com ZXing
      const scanContinuously = () => {
        if (!isScanning || !videoRef.current || !readerRef.current) return
        
        console.log('🔍 Executando scan ZXing...')
        
        if (!videoRef.current || !videoRef.current.id) {
          console.warn('⚠️ Elemento de vídeo não disponível para scan')
          setTimeout(scanContinuously, 500)
          return
        }
        
        reader.decodeOnceFromVideoDevice(undefined, videoRef.current.id)
          .then((result) => {
            console.log('🎯 ZXing detectou código:', result.getText())
            handleScanResult(result.getText())
          })
          .catch((err) => {
            if (err instanceof NotFoundException) {
              // Nenhum código encontrado, continuar tentando
              setTimeout(scanContinuously, 100)
            } else {
              console.warn('⚠️ Erro no ZXing scan:', err)
              setTimeout(scanContinuously, 500)
            }
          })
      }
      
      // Aguardar um pouco antes de iniciar o scan
      setTimeout(scanContinuously, 500)
      
      console.log('🎉 Scanner ZXing inicializado com sucesso!')
      return Promise.resolve()
      
    } catch (error: any) {
      console.error('💥 Erro capturado no ZXing scanner:', {
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
      } else if (error.name === 'AbortError') {
        errorMessage = 'Operação de vídeo foi interrompida. Tente novamente.'
      } else {
        errorMessage = `Erro ao acessar câmera: ${error.message || 'Erro desconhecido'}`
      }
      
      console.error('🚨 Mensagem de erro final:', errorMessage)
      setError(errorMessage)
      return Promise.reject(error)
    }
  }, [currentCamera, initializeReader, handleScanResult, isScanning])

  // Parar scanner
  const stopScanner = useCallback(() => {
    console.log('🛑 Parando ZXing scanner...')
    setIsScanning(false)
    setIsInitializing(false)
    
    // Parar ZXing reader
    if (readerRef.current) {
      try {
        readerRef.current.reset()
        console.log('✅ ZXing reader resetado')
      } catch (e) {
        console.warn('⚠️ Erro ao resetar ZXing reader:', e)
      }
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
        console.log('📷 Track da câmera parado')
      })
      streamRef.current = null
    }
    
    // Limpar vídeo
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch (e) {
        console.warn('⚠️ Erro ao limpar srcObject do vídeo:', e)
      }
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

  // Ref para controlar inicialização
  const initializationRef = useRef<boolean>(false)
  const mountedRef = useRef<boolean>(false)

  // Efeito principal para controlar o scanner
  useEffect(() => {
    console.log('🔄 useEffect principal executado:', { isOpen, currentCamera, isInitializing, error })
    
    if (isOpen) {
      // Marcar como montado
      mountedRef.current = true
      
      console.log('✅ Scanner aberto, detectando câmeras...')
      detectCameras()
      
      // Aguardar a renderização do elemento de vídeo antes de iniciar o scanner
      const initializeScanner = () => {
        // Verificar se ainda está montado e não está inicializando
        if (!mountedRef.current || initializationRef.current) {
          console.log('⏸️ Scanner desmontado ou já inicializando, cancelando...')
          return
        }
        
        // Verificar se o elemento de vídeo está disponível
        if (videoRef.current) {
          console.log('📹 Elemento de vídeo encontrado, iniciando ZXing scanner')
          initializationRef.current = true
          startScanner().finally(() => {
            initializationRef.current = false
          })
        } else {
          console.log('⏳ Elemento de vídeo não encontrado, aguardando...')
          // Tentar novamente após um delay
          setTimeout(initializeScanner, 100)
        }
      }
      
      // Usar requestAnimationFrame para aguardar a próxima renderização
      requestAnimationFrame(() => {
        // Aguardar um pouco mais para garantir que o DOM foi atualizado
        setTimeout(initializeScanner, 50)
      })
    } else {
      console.log('❌ Scanner fechado, chamando stopScanner')
      mountedRef.current = false
      initializationRef.current = false
      stopScanner()
    }
    
    return () => {
      console.log('🧹 Cleanup do useEffect principal')
      mountedRef.current = false
      initializationRef.current = false
      stopScanner()
    }
  }, [isOpen, currentCamera]) // Combinar ambos os efeitos em um só

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 Cleanup final do ZXingBarcodeScanner')
      if (readerRef.current) {
        try {
          readerRef.current.reset()
        } catch (e) {
          console.warn('⚠️ Erro no cleanup final:', e)
        }
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Scanner ZXing
            </h3>
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
                <Button 
                  onClick={startScanner} 
                  disabled={isInitializing}
                  className="w-full"
                >
                  {isInitializing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  {isInitializing ? 'Iniciando...' : 'Tentar Novamente'}
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
              <p className="text-gray-600">Iniciando ZXing scanner...</p>
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
                  id="zxing-video"
                />
                
                {/* Overlay de scan */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-blue-500 w-64 h-32 relative">
                      <ScanLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
                      <div className="absolute -top-6 left-0 text-blue-500 text-sm font-medium">
                        ZXing Ativo
                      </div>
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
                  disabled={availableCameras.length <= 1 || isInitializing}
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    ZXing escaneando... Aponte para o código de barras
                  </div>
                ) : (
                  'Aguardando inicialização do ZXing...'
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

export { ZXingBarcodeScanner }