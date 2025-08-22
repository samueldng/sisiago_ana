'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  X,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Zap,
  Eye,
  Settings
} from 'lucide-react'

interface ZXingReliableScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
}

interface ScanLog {
  timestamp: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: any
}

export default function ZXingReliableScanner({ isOpen, onClose, onScan }: ZXingReliableScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<ScanLog[]>([])
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [scanCount, setScanCount] = useState(0)
  const [lastScannedCode, setLastScannedCode] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isInCooldown, setIsInCooldown] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const codeReaderRef = useRef<any>(null)
  const initializationRef = useRef<boolean>(false)
  const mountedRef = useRef<boolean>(false)

  // Função para adicionar log
  const addLog = useCallback((type: ScanLog['type'], message: string, details?: any) => {
    const log: ScanLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    }
    
    setLogs(prev => [...prev.slice(-19), log])
    
    // Log apenas erros e sucessos importantes no console
    if (type === 'error' || (type === 'success' && message.includes('Código válido'))) {
      console.log(`[ZXingScanner ${type.toUpperCase()}]`, message, details)
    }
  }, [])

  // Validação EAN-13
  const isValidEAN13 = useCallback((code: string): boolean => {
    if (!/^\d{13}$/.test(code)) return false
    
    const digits = code.split('').map(Number)
    const checksum = digits.slice(0, 12).reduce((sum, digit, index) => {
      return sum + digit * (index % 2 === 0 ? 1 : 3)
    }, 0)
    
    const calculatedCheckDigit = (10 - (checksum % 10)) % 10
    return calculatedCheckDigit === digits[12]
  }, [])

  // Validação de código de barras
  const isValidBarcode = useCallback((code: string): boolean => {
    if (!/^\d{8,13}$/.test(code)) return false
    
    if (code.length === 13) {
      return isValidEAN13(code)
    }
    
    return true
  }, [isValidEAN13])

  // Inicializar ZXing
  const initializeZXing = useCallback(async () => {
    try {
      addLog('info', 'Carregando biblioteca ZXing...')
      
      const { BrowserMultiFormatReader } = await import('@zxing/library')
      codeReaderRef.current = new BrowserMultiFormatReader()
      
      addLog('success', 'ZXing carregado com sucesso')
      return true
    } catch (error) {
      addLog('error', `Erro ao carregar ZXing: ${error}`)
      return false
    }
  }, [addLog])

  // Processar resultado do scan
  const handleScanResult = useCallback((result: any) => {
    if (!result || isInCooldown) return
    
    const code = result.getText()
    // Remover log excessivo: addLog('info', `Código detectado pelo ZXing: ${code}`)
    
    if (isValidBarcode(code)) {
      const now = Date.now()
      
      // Evitar scans duplicados muito rápidos
      if (lastScannedCode === code && now - lastScanTimeRef.current < 2000) {
        return
      }
      
      addLog('success', `Código válido: ${code}`)
      setLastScannedCode(code)
      lastScanTimeRef.current = now
      setScanCount(prev => prev + 1)
      
      // Iniciar cooldown
      setIsInCooldown(true)
      cooldownTimeoutRef.current = setTimeout(() => {
        setIsInCooldown(false)
      }, 1500)
      
      // Som de confirmação
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
      } catch (audioError) {
        // Remover log de erro de áudio
      }
      
      // Chamar callback
      onScan(code)
      
      // Fechar scanner
      setTimeout(() => {
        onClose()
      }, 500)
    } else {
      addLog('warning', `Código inválido: ${code}`)
    }
  }, [addLog, isValidBarcode, lastScannedCode, onClose, onScan, isInCooldown])

  // Verificar suporte e permissões
  const checkCameraSupport = useCallback(async () => {
    try {
      addLog('info', 'Verificando suporte à câmera...')
      
      // Log detalhado do ambiente
      addLog('info', `Navegador: ${navigator.userAgent}`)
      addLog('info', `Protocolo: ${location.protocol}`)
      addLog('info', `Hostname: ${location.hostname}`)
      addLog('info', `isSecureContext: ${window.isSecureContext}`)
      
      // Verificar se MediaDevices é suportado
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices não está disponível')
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia não está disponível')
      }
      
      // Verificar se está em contexto seguro (HTTPS ou localhost)
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      
      addLog('info', `Contexto seguro: ${isSecureContext}`)
      
      if (!isSecureContext) {
        throw new Error(`Acesso à câmera requer contexto seguro (HTTPS ou localhost). Atual: ${location.protocol}//${location.hostname}`)
      }
      
      addLog('success', 'Suporte à câmera confirmado')
      return true
    } catch (error) {
      addLog('error', `Erro de suporte: ${error}`)
      setError(`Erro de suporte: ${error}`)
      return false
    }
  }, [addLog])

  // Solicitar permissão básica
  const requestBasicPermission = useCallback(async () => {
    try {
      addLog('info', 'Solicitando permissão básica da câmera...')
      
      // Tentar diferentes estratégias de constraints
      const strategies = [
        // Estratégia 1: Câmera traseira preferencial
        { video: { facingMode: 'environment' }, audio: false },
        // Estratégia 2: Qualquer câmera
        { video: true, audio: false },
        // Estratégia 3: Constraints mínimas
        { video: { width: 640, height: 480 }, audio: false }
      ]
      
      let stream = null
      let lastError = null
      
      for (let i = 0; i < strategies.length; i++) {
        try {
          addLog('info', `Tentativa ${i + 1}: ${JSON.stringify(strategies[i])}`)
          stream = await navigator.mediaDevices.getUserMedia(strategies[i])
          addLog('success', `Sucesso na tentativa ${i + 1}`)
          break
        } catch (err) {
          lastError = err
          addLog('warning', `Tentativa ${i + 1} falhou: ${err}`)
        }
      }
      
      if (!stream) {
        throw lastError || new Error('Todas as tentativas de acesso à câmera falharam')
      }
      
      // Log das tracks obtidas
      const videoTracks = stream.getVideoTracks()
      addLog('info', `Tracks de vídeo obtidas: ${videoTracks.length}`)
      videoTracks.forEach((track, index) => {
        addLog('info', `Track ${index}: ${track.label} (${track.kind})`)
      })
      
      // Parar imediatamente - só queríamos a permissão
      stream.getTracks().forEach(track => track.stop())
      
      addLog('success', 'Permissão da câmera concedida')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorName = error instanceof Error ? error.name : 'UnknownError'
      
      addLog('error', `Erro de permissão: ${errorName} - ${errorMessage}`, error)
      
      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied')) {
        setError('Permissão da câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador e recarregue a página.')
      } else if (errorName === 'NotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.')
      } else if (errorName === 'NotReadableError') {
        setError('Câmera está sendo usada por outro aplicativo.')
      } else if (errorName === 'OverconstrainedError') {
        setError('Configurações de câmera não suportadas pelo dispositivo.')
      } else {
        setError(`Erro ao acessar câmera: ${errorName} - ${errorMessage}`)
      }
      
      return false
    }
  }, [addLog])

  // Enumerar câmeras
  const enumerateCameras = useCallback(async () => {
    try {
      addLog('info', 'Enumerando câmeras...')
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      setCameras(videoDevices)
      addLog('success', `${videoDevices.length} câmera(s) encontrada(s)`)
      
      // Selecionar câmera traseira
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )
      
      if (backCamera) {
        setSelectedCameraId(backCamera.deviceId)
        addLog('info', `Câmera traseira selecionada: ${backCamera.label}`)
      } else if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId)
        addLog('info', `Primeira câmera selecionada: ${videoDevices[0].label}`)
      }
      
      return true
    } catch (error) {
      addLog('error', `Erro ao enumerar câmeras: ${error}`)
      return false
    }
  }, [addLog])

  // Inicializar scanner
  const initializeScanner = useCallback(async () => {
    // Evitar múltiplas inicializações
    if (initializationRef.current || !mountedRef.current) {
      addLog('warning', 'Scanner já está inicializando ou desmontado, ignorando...')
      return Promise.resolve()
    }
    
    try {
      initializationRef.current = true
      setIsInitializing(true)
      addLog('info', 'Inicializando scanner ZXing...')
      setError(null)
      
      if (!codeReaderRef.current) {
        const success = await initializeZXing()
        if (!success) {
          initializationRef.current = false
          setIsInitializing(false)
          return Promise.reject(new Error('Falha ao inicializar ZXing'))
        }
      }
      
      // Parar stream atual
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
        setCurrentStream(null)
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          facingMode: selectedCameraId ? undefined : 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      }
      
      addLog('info', 'Solicitando acesso à câmera...')
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!videoRef.current) {
        addLog('error', 'Elemento de vídeo não encontrado')
        initializationRef.current = false
        setIsInitializing(false)
        return Promise.reject(new Error('Elemento de vídeo não encontrado'))
      }
      
      // Limpar srcObject anterior se existir
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject = null
      }
      
      videoRef.current.srcObject = stream
      setCurrentStream(stream)
      
      // Aguardar vídeo carregar
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!
        
        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          resolve()
        }
        
        const onError = (error: Event) => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          reject(error)
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)
        
        // Aguardar um pouco antes de tentar reproduzir
        setTimeout(() => {
          video.play().catch(reject)
        }, 100)
      })
      
      addLog('success', 'Câmera inicializada com sucesso')
      setIsScanning(true)
      
      // Iniciar detecção contínua com ZXing imediatamente
      const scanContinuously = () => {
        // Verificar se ainda estamos montados e com elementos válidos
        if (!mountedRef.current || !videoRef.current || !codeReaderRef.current || isInCooldown) {
          return
        }
        
        setIsAnalyzing(true)
        
        // Garantir que o elemento de vídeo tem um ID
        if (!videoRef.current.id) {
          videoRef.current.id = 'zxing-reliable-video-' + Date.now()
        }
        
        codeReaderRef.current.decodeOnceFromVideoDevice(undefined, videoRef.current.id)
          .then((result) => {
            if (mountedRef.current) {
              addLog('success', `Código detectado: ${result.getText()}`)
              handleScanResult(result)
            }
          })
          .catch((error) => {
            if (!mountedRef.current) return
            
            // ZXing lança NotFoundException quando não encontra código, isso é normal
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (!errorMessage.includes('NotFoundException')) {
              addLog('warning', `Erro na detecção: ${errorMessage}`)
            }
          })
          .finally(() => {
            if (mountedRef.current) {
              setIsAnalyzing(false)
              
              // Continuar o loop de scan se ainda estamos montados e não em cooldown
              if (!isInCooldown) {
                setTimeout(scanContinuously, 100)
              }
            }
          })
      }
      
      // Iniciar o scan imediatamente após a câmera estar pronta
      setTimeout(scanContinuously, 100)
      
      addLog('success', 'Scanner inicializado com sucesso')
      initializationRef.current = false
      setIsInitializing(false)
      return Promise.resolve()
      
    } catch (error) {
      initializationRef.current = false
      setIsInitializing(false)
      
      // Tratamento específico para AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        addLog('warning', 'Reprodução de vídeo foi interrompida - tentando novamente...')
        return Promise.resolve() // Não rejeitar para AbortError
      }
      
      const errorMessage = `Erro ao inicializar scanner: ${error}`
      addLog('error', errorMessage)
      setError(errorMessage)
      return Promise.reject(error)
    }
  }, [addLog, currentStream, selectedCameraId, initializeZXing, handleScanResult, isInCooldown])

  // Parar scanner
  const stopScanner = useCallback(() => {
    addLog('info', 'Parando scanner...')
    
    initializationRef.current = false
    setIsInitializing(false)
    setIsScanning(false)
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current)
      cooldownTimeoutRef.current = null
    }
    
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
      setCurrentStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset()
      } catch (error) {
        // Ignorar erros de reset
      }
    }
    
    addLog('success', 'Scanner parado com sucesso')
  }, [addLog, currentStream])

  // Reiniciar scanner
  const restartScanner = useCallback(() => {
    if (initializationRef.current) return
    
    addLog('info', 'Reiniciando scanner...')
    stopScanner()
    setTimeout(() => {
      if (mountedRef.current && !initializationRef.current) {
        initializeScanner()
      }
    }, 1000)
  }, [addLog, initializeScanner, stopScanner])

  // Alternar câmera
  const switchCamera = useCallback(() => {
    if (cameras.length <= 1 || initializationRef.current) return
    
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextCamera = cameras[nextIndex]
    
    addLog('info', `Alternando para: ${nextCamera.label}`)
    setSelectedCameraId(nextCamera.deviceId)
    
    setTimeout(() => {
      if (mountedRef.current && !initializationRef.current) {
        initializeScanner()
      }
    }, 500)
  }, [addLog, cameras, initializeScanner, selectedCameraId])

  // Efeito de montagem
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Efeito principal
  useEffect(() => {
    if (isOpen && !isScanning && !initializationRef.current) {
      addLog('info', 'Scanner aberto, iniciando diagnóstico...')
      
      const initializeWithDiagnostic = async () => {
        try {
          // Passo 1: Verificar suporte
          const hasSupport = await checkCameraSupport()
          if (!hasSupport || !mountedRef.current) return
          
          // Passo 2: Solicitar permissão básica
          const hasPermission = await requestBasicPermission()
          if (!hasPermission || !mountedRef.current) return
          
          // Passo 3: Enumerar câmeras
          const camerasFound = await enumerateCameras()
          if (!camerasFound || !mountedRef.current) return
          
          // Passo 4: Inicializar scanner
          setTimeout(() => {
            if (mountedRef.current && !initializationRef.current) {
              initializeScanner()
            }
          }, 500)
          
        } catch (error) {
          if (mountedRef.current) {
            addLog('error', `Erro na inicialização: ${error}`)
            setError(`Erro na inicialização: ${error}`)
          }
        }
      }
      
      initializeWithDiagnostic()
    } else if (!isOpen && isScanning) {
      stopScanner()
    }
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current)
      }
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isOpen])

  // Reset estados
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setScanCount(0)
      setLastScannedCode(null)
      setLogs([])
      setIsInCooldown(false)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Scanner ZXing Confiável</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Alerta de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800 mb-1">Erro no Scanner</h3>
                  <p className="text-red-700 text-sm mb-3">{error}</p>
                  
                  {error.includes('Permissão da câmera negada') && (
                    <div className="text-red-600 text-xs space-y-1">
                      <p><strong>Como resolver:</strong></p>
                      <p>1. Clique no ícone de câmera na barra de endereços</p>
                      <p>2. Selecione "Permitir" para acesso à câmera</p>
                      <p>3. Clique em "Diagnosticar" abaixo para tentar novamente</p>
                    </div>
                  )}
                  
                  {error.includes('contexto seguro') && (
                    <div className="text-red-600 text-xs space-y-1">
                      <p><strong>Como resolver:</strong></p>
                      <p>• Acesse via HTTPS ou localhost</p>
                      <p>• Verifique se a URL está correta</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Preview da Câmera */}
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Status overlay */}
                <div className="absolute top-2 left-2 space-y-1">
                  {isInitializing && (
                    <Badge className="bg-orange-100 text-orange-800">
                      <Settings className="w-3 h-3 mr-1 animate-spin" />
                      Inicializando
                    </Badge>
                  )}
                  
                  {isScanning && !isInitializing && (
                    <Badge className="bg-green-100 text-green-800">
                      <Eye className="w-3 h-3 mr-1" />
                      Escaneando
                    </Badge>
                  )}
                  
                  {isAnalyzing && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Analisando
                    </Badge>
                  )}
                  
                  {isInCooldown && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Cooldown
                    </Badge>
                  )}
                </div>
                
                {/* Contador */}
                {scanCount > 0 && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black bg-opacity-50 text-white">
                      Tentativas: {scanCount}
                    </Badge>
                  </div>
                )}
                
                {/* Linha de scan */}
                {isScanning && (
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 opacity-75 transform -translate-y-1/2" />
                )}
              </div>
              
              {/* Controles */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={restartScanner}
                  variant="outline"
                  size="sm"
                  disabled={!isScanning || isInitializing}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {isInitializing ? 'Iniciando...' : 'Reiniciar'}
                </Button>
                
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="sm"
                  disabled={cameras.length <= 1 || isInitializing}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Alternar Câmera
                </Button>
                
                <Button
                  onClick={async () => {
                    setError(null)
                    setLogs([])
                    addLog('info', 'Iniciando diagnóstico manual...')
                    
                    const hasSupport = await checkCameraSupport()
                    if (!hasSupport) return
                    
                    const hasPermission = await requestBasicPermission()
                    if (!hasPermission) return
                    
                    const camerasFound = await enumerateCameras()
                    if (!camerasFound) return
                    
                    addLog('success', 'Diagnóstico concluído com sucesso!')
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Diagnosticar
                </Button>
                
                <Button
                  onClick={() => setLogs([])}
                  variant="outline"
                  size="sm"
                >
                  Limpar Logs
                </Button>
              </div>
              
              {/* Status */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              
              {lastScannedCode && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Último código: {lastScannedCode}</span>
                </div>
              )}
            </div>
            
            {/* Logs */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="font-medium">Logs do ZXing</span>
              </div>
              
              <div className="h-64 overflow-y-auto border rounded p-3 bg-gray-50 text-xs space-y-1">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center">Aguardando atividade...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-gray-400 font-mono">{log.timestamp}</span>
                      <span className={`font-medium ${
                        log.type === 'success' ? 'text-green-600' :
                        log.type === 'error' ? 'text-red-600' :
                        log.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        [{log.type.toUpperCase()}]
                      </span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Câmeras disponíveis */}
              {cameras.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium text-sm">Câmeras Disponíveis:</span>
                  <div className="space-y-1">
                    {cameras.map((camera, index) => (
                      <div key={camera.deviceId} className="text-xs p-2 border rounded">
                        <div className="font-medium">
                          {camera.label || `Câmera ${index + 1}`}
                          {camera.deviceId === selectedCameraId && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800">Ativa</Badge>
                          )}
                        </div>
                        <div className="text-gray-500 truncate">{camera.deviceId}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Instruções */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Scanner usando biblioteca ZXing comprovada em produção</p>
            <p>• Posicione um código de barras na linha vermelha central</p>
            <p>• Detecção 100% confiável sem números aleatórios</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}