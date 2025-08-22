'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Smartphone,
  Monitor,
  Wifi,
  Settings
} from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: any
}

interface DeviceInfo {
  userAgent: string
  platform: string
  language: string
  cookieEnabled: boolean
  onLine: boolean
  screen: {
    width: number
    height: number
    orientation?: string
  }
  viewport: {
    width: number
    height: number
  }
}

export default function CameraDebugPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // Função para adicionar log
  const addLog = useCallback((test: string, status: DiagnosticResult['status'], message: string, details?: any) => {
    const result: DiagnosticResult = {
      test,
      status,
      message,
      details,
    }
    
    setDiagnostics(prev => [...prev, result])
    
    // Auto-scroll para o final dos logs
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight
      }
    }, 100)
  }, [])

  // Coletar informações do dispositivo
  const collectDeviceInfo = useCallback(() => {
    addLog('Device Info', 'pending', 'Coletando informações do dispositivo...')
    
    try {
      const info: DeviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          orientation: (screen as any).orientation?.type || 'unknown'
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
      
      setDeviceInfo(info)
      addLog('Device Info', 'success', 'Informações coletadas com sucesso', info)
    } catch (error) {
      addLog('Device Info', 'error', `Erro ao coletar informações: ${error}`, error)
    }
  }, [addLog])

  // Verificar suporte a MediaDevices
  const checkMediaDevicesSupport = useCallback(() => {
    addLog('MediaDevices Support', 'pending', 'Verificando suporte a MediaDevices...')
    
    if (!navigator.mediaDevices) {
      addLog('MediaDevices Support', 'error', 'navigator.mediaDevices não está disponível')
      return false
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      addLog('MediaDevices Support', 'error', 'getUserMedia não está disponível')
      return false
    }
    
    if (!navigator.mediaDevices.enumerateDevices) {
      addLog('MediaDevices Support', 'warning', 'enumerateDevices não está disponível')
    }
    
    addLog('MediaDevices Support', 'success', 'MediaDevices totalmente suportado')
    return true
  }, [addLog])

  // Verificar protocolo HTTPS
  const checkHTTPS = useCallback(() => {
    addLog('HTTPS Check', 'pending', 'Verificando protocolo...')
    
    const isHTTPS = location.protocol === 'https:'
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    
    if (isHTTPS || isLocalhost) {
      addLog('HTTPS Check', 'success', `Protocolo seguro: ${location.protocol}`)
      return true
    } else {
      addLog('HTTPS Check', 'error', 'HTTPS é obrigatório para acesso à câmera em produção')
      return false
    }
  }, [addLog])

  // Enumerar câmeras disponíveis
  const enumerateCameras = useCallback(async () => {
    addLog('Camera Enumeration', 'pending', 'Listando câmeras disponíveis...')
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      setCameras(videoDevices)
      
      if (videoDevices.length === 0) {
        addLog('Camera Enumeration', 'error', 'Nenhuma câmera encontrada')
        return false
      }
      
      addLog('Camera Enumeration', 'success', `${videoDevices.length} câmera(s) encontrada(s)`, videoDevices)
      
      // Selecionar a primeira câmera por padrão
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
      
      return true
    } catch (error) {
      addLog('Camera Enumeration', 'error', `Erro ao enumerar câmeras: ${error}`, error)
      return false
    }
  }, [addLog, selectedCamera])

  // Testar acesso básico à câmera
  const testBasicCameraAccess = useCallback(async () => {
    addLog('Basic Camera Access', 'pending', 'Testando acesso básico à câmera...')
    
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Câmera traseira preferida
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setCurrentStream(stream)
      addLog('Basic Camera Access', 'success', 'Câmera acessada com sucesso')
      
      // Informações sobre o stream
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        addLog('Video Track Settings', 'success', 'Configurações do vídeo obtidas', settings)
      }
      
      return true
    } catch (error) {
      addLog('Basic Camera Access', 'error', `Erro ao acessar câmera: ${error}`, error)
      return false
    }
  }, [addLog])

  // Testar acesso com câmera específica
  const testSpecificCamera = useCallback(async (deviceId: string) => {
    addLog('Specific Camera Test', 'pending', `Testando câmera específica: ${deviceId}...`)
    
    try {
      // Parar stream atual se existir
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setCurrentStream(stream)
      addLog('Specific Camera Test', 'success', `Câmera ${deviceId} funcionando`)
      
      return true
    } catch (error) {
      addLog('Specific Camera Test', 'error', `Erro com câmera ${deviceId}: ${error}`, error)
      return false
    }
  }, [addLog, currentStream])

  // Testar captura de frame
  const testFrameCapture = useCallback(() => {
    addLog('Frame Capture', 'pending', 'Testando captura de frame...')
    
    try {
      if (!videoRef.current || !canvasRef.current) {
        addLog('Frame Capture', 'error', 'Elementos de vídeo ou canvas não encontrados')
        return false
      }
      
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        addLog('Frame Capture', 'error', 'Contexto 2D do canvas não disponível')
        return false
      }
      
      // Definir tamanho do canvas
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Capturar frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Obter dados da imagem
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      addLog('Frame Capture', 'success', `Frame capturado: ${canvas.width}x${canvas.height}`, {
        width: canvas.width,
        height: canvas.height,
        dataLength: imageData.data.length
      })
      
      return true
    } catch (error) {
      addLog('Frame Capture', 'error', `Erro na captura: ${error}`, error)
      return false
    }
  }, [addLog])

  // Executar todos os testes
  const runAllTests = useCallback(async () => {
    setIsRunning(true)
    setDiagnostics([])
    
    // Parar stream atual se existir
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
      setCurrentStream(null)
    }
    
    try {
      // 1. Coletar informações do dispositivo
      collectDeviceInfo()
      
      // 2. Verificar suporte a MediaDevices
      const hasMediaDevices = checkMediaDevicesSupport()
      if (!hasMediaDevices) return
      
      // 3. Verificar HTTPS
      const hasHTTPS = checkHTTPS()
      if (!hasHTTPS) return
      
      // 4. Enumerar câmeras
      const hasCameras = await enumerateCameras()
      if (!hasCameras) return
      
      // 5. Testar acesso básico
      const hasBasicAccess = await testBasicCameraAccess()
      if (!hasBasicAccess) return
      
      // 6. Aguardar um pouco para o vídeo carregar
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 7. Testar captura de frame
      testFrameCapture()
      
      addLog('All Tests', 'success', 'Todos os testes concluídos com sucesso!')
      
    } catch (error) {
      addLog('All Tests', 'error', `Erro durante os testes: ${error}`, error)
    } finally {
      setIsRunning(false)
    }
  }, [addLog, checkHTTPS, checkMediaDevicesSupport, collectDeviceInfo, currentStream, enumerateCameras, testBasicCameraAccess, testFrameCapture])

  // Parar todos os streams
  const stopAllStreams = useCallback(() => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
      setCurrentStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    addLog('Cleanup', 'success', 'Todos os streams foram parados')
  }, [addLog, currentStream])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [currentStream])

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'pending':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-6 h-6" />
              <span>Diagnóstico Completo da Câmera</span>
            </CardTitle>
            <p className="text-gray-600">
              Esta página executa testes abrangentes para identificar problemas com o acesso à câmera no seu dispositivo.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="flex items-center space-x-2"
              >
                {isRunning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                <span>{isRunning ? 'Executando...' : 'Executar Todos os Testes'}</span>
              </Button>
              
              <Button 
                onClick={stopAllStreams} 
                variant="outline"
                disabled={!currentStream}
              >
                Parar Câmera
              </Button>
              
              <Button 
                onClick={() => setDiagnostics([])} 
                variant="outline"
              >
                Limpar Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Dispositivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>Informações do Dispositivo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceInfo ? (
                <div className="space-y-2 text-sm">
                  <div><strong>User Agent:</strong> {deviceInfo.userAgent}</div>
                  <div><strong>Plataforma:</strong> {deviceInfo.platform}</div>
                  <div><strong>Idioma:</strong> {deviceInfo.language}</div>
                  <div><strong>Online:</strong> {deviceInfo.onLine ? 'Sim' : 'Não'}</div>
                  <div><strong>Tela:</strong> {deviceInfo.screen.width}x{deviceInfo.screen.height}</div>
                  <div><strong>Viewport:</strong> {deviceInfo.viewport.width}x{deviceInfo.viewport.height}</div>
                  <div><strong>Orientação:</strong> {deviceInfo.screen.orientation}</div>
                </div>
              ) : (
                <p className="text-gray-500">Execute os testes para coletar informações</p>
              )}
            </CardContent>
          </Card>

          {/* Câmeras Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Câmeras Disponíveis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cameras.length > 0 ? (
                <div className="space-y-2">
                  {cameras.map((camera, index) => (
                    <div key={camera.deviceId} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{camera.label || `Câmera ${index + 1}`}</div>
                        <div className="text-xs text-gray-500">{camera.deviceId}</div>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedCamera === camera.deviceId ? "default" : "outline"}
                        onClick={() => {
                          setSelectedCamera(camera.deviceId)
                          testSpecificCamera(camera.deviceId)
                        }}
                      >
                        Testar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Execute os testes para listar câmeras</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview da Câmera */}
          <Card>
            <CardHeader>
              <CardTitle>Preview da Câmera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <video 
                  ref={videoRef}
                  className="w-full max-w-md mx-auto border rounded"
                  autoPlay
                  playsInline
                  muted
                />
                
                <canvas 
                  ref={canvasRef}
                  className="w-full max-w-md mx-auto border rounded hidden"
                />
                
                {currentStream && (
                  <div className="text-center">
                    <Badge className="bg-green-100 text-green-800">
                      Câmera Ativa
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logs de Diagnóstico */}
          <Card>
            <CardHeader>
              <CardTitle>Logs de Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={logRef}
                className="h-96 overflow-y-auto space-y-2 border rounded p-4 bg-gray-50"
              >
                {diagnostics.length === 0 ? (
                  <p className="text-gray-500 text-center">Clique em "Executar Todos os Testes" para começar</p>
                ) : (
                  diagnostics.map((result, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{result.test}:</span>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                        <div className="text-gray-600 mt-1">{result.message}</div>
                        {result.details && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              Ver detalhes
                            </summary>
                            <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}