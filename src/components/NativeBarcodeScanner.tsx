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

interface NativeBarcodeScannerProps {
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

export default function NativeBarcodeScanner({ isOpen, onClose, onScan }: NativeBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<ScanLog[]>([])
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [scanCount, setScanCount] = useState(0)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [consecutiveDetections, setConsecutiveDetections] = useState<{[key: string]: number}>({})
  const [isInCooldown, setIsInCooldown] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Função para adicionar log (controlada para evitar spam)
  const addLog = useCallback((type: ScanLog['type'], message: string, details?: any) => {
    // Filtrar logs repetitivos para reduzir spam
    if (type === 'info' && (message.includes('Analisando frame') || message.includes('Linha'))) {
      // Reduzir logs de análise para 1 a cada 10
      if (Math.random() > 0.1) return
    }
    
    const log: ScanLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    }
    
    setLogs(prev => [...prev.slice(-19), log]) // Manter apenas os últimos 20 logs
    
    // Log apenas erros e sucessos no console para reduzir spam
    if (type === 'error' || type === 'success') {
      console.log(`[NativeScanner ${type.toUpperCase()}]`, message, details)
    }
  }, [])

  // Validação EAN-13 simples
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
    // Aceitar códigos de 8 a 13 dígitos
    if (!/^\d{8,13}$/.test(code)) return false
    
    // Para códigos de 13 dígitos, validar EAN-13
    if (code.length === 13) {
      return isValidEAN13(code)
    }
    
    return true
  }, [isValidEAN13])

  // Padrões de códigos de barras EAN-13
  const EAN13_PATTERNS = {
    L: [ // Left-hand odd parity
      '0001101', '0011001', '0010011', '0111101', '0100011',
      '0110001', '0101111', '0111011', '0110111', '0001011'
    ],
    G: [ // Left-hand even parity
      '0100111', '0110011', '0011011', '0100001', '0011101',
      '0111001', '0000101', '0010001', '0001001', '0010111'
    ],
    R: [ // Right-hand
      '1110010', '1100110', '1101100', '1000010', '1011100',
      '1001110', '1010000', '1000100', '1001000', '1110100'
    ]
  }

  const FIRST_DIGIT_PATTERNS = [
    'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
    'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'
  ]

  // Verificar qualidade da imagem antes de processar
  const checkImageQuality = useCallback((grayData: Uint8Array): boolean => {
    // Converter para array para usar Math.min/max
    const dataArray = Array.from(grayData)
    
    // Calcular contraste
    const min = Math.min(...dataArray)
    const max = Math.max(...dataArray)
    const contrast = max - min
    
    // Calcular variância (indicador de nitidez)
    const mean = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
    const variance = dataArray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dataArray.length
    
    // Critérios de qualidade
    const hasGoodContrast = contrast > 50
    const hasGoodSharpness = variance > 100
    
    return hasGoodContrast && hasGoodSharpness
  }, [])

  // Detectar padrões de código de barras em dados de imagem
  const detectBarcodePattern = useCallback((imageData: ImageData): string | null => {
    try {
      const { data, width, height } = imageData
      
      // Converter para escala de cinza
      const grayData = new Uint8Array(width * height)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] ?? 0
        const g = data[i + 1] ?? 0
        const b = data[i + 2] ?? 0
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        grayData[i / 4] = gray
      }
      
      // Verificar qualidade da imagem
      if (!checkImageQuality(grayData)) {
        return null // Não processar imagens de baixa qualidade
      }
      
      // Tentar apenas linha central para melhor performance
      const scanY = Math.floor(height * 0.5)
      
      if (scanY < 0 || scanY >= height) return null
      
      const result = scanLineForBarcode(grayData, width, height, scanY)
      if (result) {
        addLog('success', `Código detectado: ${result}`)
        return result
      }
      
      return null
      
    } catch (error) {
      addLog('error', `Erro na detecção de padrão: ${error}`)
      return null
    }
  }, [addLog, checkImageQuality])

  // Escanear uma linha específica em busca de código de barras
  const scanLineForBarcode = useCallback((grayData: Uint8Array, width: number, _height: number, y: number): string | null => {
    try {
      // Extrair linha de varredura
      const scanLine = grayData.slice(y * width, (y + 1) * width)
      
      // Aplicar threshold adaptativo melhorado
      const threshold = calculateAdaptiveThreshold(scanLine)
      const binaryLine = Array.from(scanLine).map(pixel => pixel < threshold ? 0 : 1)
       
      // Detectar transições (barras e espaços)
      const bars = detectBars(binaryLine)
      
      // Critérios mais rigorosos para reduzir falsos positivos
      if (bars.length < 70 || bars.length > 120) {
        return null
      }
      
      // Verificar se há variação suficiente nas larguras das barras
      const uniqueWidths = new Set(bars).size
      if (uniqueWidths < 3) {
        return null // Muito uniforme, provavelmente não é um código de barras
      }
      
      // Tentar decodificar como EAN-13
      const ean13Result = decodeEAN13(bars)
      if (ean13Result) {
        return ean13Result
      }
      
      // Tentar decodificar como EAN-8
      const ean8Result = decodeEAN8(bars)
      if (ean8Result) {
        return ean8Result
      }
      
      return null
      
    } catch (error) {
      addLog('error', `Erro ao escanear linha ${y}: ${error}`)
      return null
    }
  }, [addLog])

  // Calcular threshold adaptativo melhorado
  const calculateAdaptiveThreshold = useCallback((line: Uint8Array): number => {
    const sorted = Array.from(line).sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    
    // Verificar se os valores existem
    if (median === undefined || q1 === undefined || q3 === undefined) {
      return 128 // Valor padrão
    }
    
    // Método Otsu simplificado para melhor separação
    const iqr = q3 - q1
    const threshold = median + (iqr * 0.1) // Ajuste mais conservador
    
    // Garantir que o threshold esteja dentro de limites razoáveis
    return Math.max(q1 + 10, Math.min(q3 - 10, Math.floor(threshold)))
  }, [])

  // Detectar barras e espaços
  const detectBars = useCallback((binaryLine: number[]): number[] => {
    const bars: number[] = []
    let currentValue = binaryLine[0]
    let currentLength = 1
    
    for (let i = 1; i < binaryLine.length; i++) {
      if (binaryLine[i] === currentValue) {
        currentLength++
      } else {
        bars.push(currentLength)
        currentValue = binaryLine[i]
        currentLength = 1
      }
    }
    bars.push(currentLength)
    
    return bars
  }, [])

  // Decodificar EAN-13
  const decodeEAN13 = useCallback((bars: number[]): string | null => {
    try {
      // Normalizar larguras das barras
      const normalizedBars = normalizeBars(bars)
      if (!normalizedBars || normalizedBars.length < 59) {
        return null
      }
      
      // Procurar padrões de início (101)
      let startIndex = -1
      for (let i = 0; i <= normalizedBars.length - 59; i++) {
        if (normalizedBars[i] === 1 && normalizedBars[i + 1] === 1 && normalizedBars[i + 2] === 1) {
          startIndex = i
          break
        }
      }
      
      if (startIndex === -1) {
        addLog('info', 'Padrão de início EAN-13 não encontrado')
        return null
      }
      
      addLog('info', `Padrão de início encontrado no índice ${startIndex}`)
      
      // Extrair dados dos dígitos
      const leftDigits: number[] = []
      const rightDigits: number[] = []
      let pattern = ''
      
      // Decodificar 6 dígitos da esquerda
      let pos = startIndex + 3
      for (let i = 0; i < 6; i++) {
        const digitBars = normalizedBars.slice(pos, pos + 7)
        if (digitBars.length < 7) break
        
        const digitPattern = digitBars.join('')
        const digitValue = findDigitInPatterns(digitPattern, ['L', 'G'])
        
        if (digitValue.digit === -1) {
          addLog('info', `Dígito esquerdo ${i + 1} não reconhecido: ${digitPattern}`)
          return null
        }
        
        leftDigits.push(digitValue.digit)
        pattern += digitValue.type
        pos += 7
      }
      
      // Verificar separador central (01010)
      if (pos + 5 > normalizedBars.length) return null
      const separator = normalizedBars.slice(pos, pos + 5).join('')
      if (separator !== '01010') {
        addLog('info', `Separador central inválido: ${separator}`)
        return null
      }
      pos += 5
      
      // Decodificar 6 dígitos da direita
      for (let i = 0; i < 6; i++) {
        const digitBars = normalizedBars.slice(pos, pos + 7)
        if (digitBars.length < 7) break
        
        const digitPattern = digitBars.join('')
        const digitValue = findDigitInPatterns(digitPattern, ['R'])
        
        if (digitValue.digit === -1) {
          addLog('info', `Dígito direito ${i + 1} não reconhecido: ${digitPattern}`)
          return null
        }
        
        rightDigits.push(digitValue.digit)
        pos += 7
      }
      
      // Verificar padrão de fim (101)
      if (pos + 3 > normalizedBars.length) return null
      const endPattern = normalizedBars.slice(pos, pos + 3).join('')
      if (endPattern !== '101') {
        addLog('info', `Padrão de fim inválido: ${endPattern}`)
        return null
      }
      
      // Determinar primeiro dígito pelo padrão L/G
      const firstDigit = FIRST_DIGIT_PATTERNS.indexOf(pattern)
      if (firstDigit === -1) {
        addLog('info', `Padrão L/G inválido: ${pattern}`)
        return null
      }
      
      // Construir código completo
      const fullCode = firstDigit + leftDigits.join('') + rightDigits.join('')
      
      addLog('info', `Código EAN-13 decodificado: ${fullCode}`)
      
      // Validar checksum
      if (isValidEAN13(fullCode)) {
        return fullCode
      } else {
        addLog('warning', `Checksum EAN-13 inválido: ${fullCode}`)
        return null
      }
      
    } catch (error) {
      addLog('error', `Erro na decodificação EAN-13: ${error}`)
      return null
    }
  }, [addLog, isValidEAN13])

  // Decodificar EAN-8
  const decodeEAN8 = useCallback((bars: number[]): string | null => {
    try {
      const normalizedBars = normalizeBars(bars)
      if (!normalizedBars || normalizedBars.length < 43) {
        return null
      }
      
      // Procurar padrões de início (101)
      let startIndex = -1
      for (let i = 0; i <= normalizedBars.length - 43; i++) {
        if (normalizedBars[i] === 1 && normalizedBars[i + 1] === 1 && normalizedBars[i + 2] === 1) {
          startIndex = i
          break
        }
      }
      
      if (startIndex === -1) return null
      
      const leftDigits: number[] = []
      const rightDigits: number[] = []
      
      // Decodificar 4 dígitos da esquerda
      let pos = startIndex + 3
      for (let i = 0; i < 4; i++) {
        const digitBars = normalizedBars.slice(pos, pos + 7)
        if (digitBars.length < 7) break
        
        const digitPattern = digitBars.join('')
        const digitValue = findDigitInPatterns(digitPattern, ['L'])
        
        if (digitValue.digit === -1) return null
        
        leftDigits.push(digitValue.digit)
        pos += 7
      }
      
      // Verificar separador central (01010)
      if (pos + 5 > normalizedBars.length) return null
      const separator = normalizedBars.slice(pos, pos + 5).join('')
      if (separator !== '01010') return null
      pos += 5
      
      // Decodificar 4 dígitos da direita
      for (let i = 0; i < 4; i++) {
        const digitBars = normalizedBars.slice(pos, pos + 7)
        if (digitBars.length < 7) break
        
        const digitPattern = digitBars.join('')
        const digitValue = findDigitInPatterns(digitPattern, ['R'])
        
        if (digitValue.digit === -1) return null
        
        rightDigits.push(digitValue.digit)
        pos += 7
      }
      
      // Verificar padrão de fim (101)
      if (pos + 3 > normalizedBars.length) return null
      const endPattern = normalizedBars.slice(pos, pos + 3).join('')
      if (endPattern !== '101') return null
      
      const fullCode = leftDigits.join('') + rightDigits.join('')
      
      // Validar EAN-8 (8 dígitos)
      if (fullCode.length === 8 && /^\d{8}$/.test(fullCode)) {
        return fullCode
      }
      
      return null
      
    } catch (error) {
      addLog('error', `Erro na decodificação EAN-8: ${error}`)
      return null
    }
  }, [addLog])

  // Normalizar larguras das barras
  const normalizeBars = useCallback((bars: number[]): number[] | null => {
    if (bars.length < 10) return null
    
    // Encontrar a menor largura (módulo unitário)
    const minWidth = Math.min(...bars.filter(w => w > 0))
    if (minWidth === 0) return null
    
    // Normalizar todas as larguras
    const normalized = bars.map(width => Math.round(width / minWidth))
    
    // Converter para padrão binário
    const binary: number[] = []
    for (let i = 0; i < normalized.length; i++) {
      const isBar = i % 2 === 0 // Começamos com uma barra
      const value = isBar ? 1 : 0
      const normalizedValue = normalized[i]
      if (normalizedValue !== undefined && normalizedValue > 0) {
        for (let j = 0; j < normalizedValue; j++) {
          binary.push(value)
        }
      }
    }
    
    return binary
  }, [])

  // Encontrar dígito nos padrões
  const findDigitInPatterns = useCallback((pattern: string, types: string[]): { digit: number, type: string } => {
    for (const type of types) {
      const patterns = EAN13_PATTERNS[type as keyof typeof EAN13_PATTERNS]
      const index = patterns.indexOf(pattern)
      if (index !== -1) {
        return { digit: index, type }
      }
    }
    return { digit: -1, type: '' }
  }, [])

  // Analisar frame do vídeo com validação rigorosa
  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning || isInCooldown) {
      return
    }
    
    try {
      setIsAnalyzing(true)
      
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        setIsAnalyzing(false)
        return
      }
      
      // Definir tamanho do canvas (reduzido para melhor performance)
      const scale = 0.5 // Reduzir resolução para melhor performance
      canvas.width = video.videoWidth * scale
      canvas.height = video.videoHeight * scale
      
      // Capturar frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Obter dados da imagem
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // Tentar detectar código de barras
      const detectedCode = detectBarcodePattern(imageData)
      
      if (detectedCode && isValidBarcode(detectedCode)) {
        // Validação rigorosa: exigir 3 detecções consecutivas do mesmo código
        setConsecutiveDetections(prev => {
          const newCount = (prev[detectedCode] || 0) + 1
          const updated = { ...prev, [detectedCode]: newCount }
          
          // Limpar outros códigos para focar no atual
          Object.keys(updated).forEach(code => {
            if (code !== detectedCode) {
              delete updated[code]
            }
          })
          
          // Se detectado 3 vezes consecutivas, confirmar
          if (newCount >= 3) {
            const now = Date.now()
            
            // Verificar se não é muito rápido após o último scan
            if (lastScannedCode !== detectedCode || now - lastScanTimeRef.current >= 3000) {
              addLog('success', `Código confirmado após ${newCount} detecções: ${detectedCode}`)
              setLastScannedCode(detectedCode)
              lastScanTimeRef.current = now
              setScanCount(prev => prev + 1)
              
              // Iniciar cooldown
              setIsInCooldown(true)
              cooldownTimeoutRef.current = setTimeout(() => {
                setIsInCooldown(false)
                setConsecutiveDetections({})
              }, 1000)
              
              // Tocar som de confirmação
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
                addLog('warning', 'Não foi possível reproduzir som de confirmação')
              }
              
              // Chamar callback
              onScan(detectedCode)
              
              // Fechar scanner após sucesso
              setTimeout(() => {
                onClose()
              }, 500)
            }
            
            return {}
          }
          
          return updated
        })
      } else {
        // Resetar contadores se não detectou nada válido
        setConsecutiveDetections({})
      }
      
    } catch (error) {
      addLog('error', `Erro na análise do frame: ${error}`)
    } finally {
      setIsAnalyzing(false)
    }
  }, [addLog, detectBarcodePattern, isScanning, isValidBarcode, lastScannedCode, onClose, onScan, isInCooldown])

  // Enumerar câmeras disponíveis
  const enumerateCameras = useCallback(async () => {
    try {
      addLog('info', 'Enumerando câmeras disponíveis...')
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      setCameras(videoDevices)
      addLog('success', `${videoDevices.length} câmera(s) encontrada(s)`, videoDevices)
      
      // Selecionar câmera traseira por padrão
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )
      
      if (backCamera) {
        setSelectedCameraId(backCamera.deviceId)
        addLog('info', `Câmera traseira selecionada: ${backCamera.label}`)
      } else if (videoDevices.length > 0 && videoDevices[0]) {
        setSelectedCameraId(videoDevices[0].deviceId)
        addLog('info', `Primeira câmera selecionada: ${videoDevices[0].label}`)
      }
      
    } catch (error) {
      addLog('error', `Erro ao enumerar câmeras: ${error}`)
    }
  }, [addLog])

  // Inicializar câmera
  const initializeCamera = useCallback(async () => {
    try {
      addLog('info', 'Inicializando câmera...')
      setError(null)
      
      // Parar stream atual se existir
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
      
      addLog('info', 'Solicitando acesso à câmera...', constraints)
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!videoRef.current) {
        addLog('error', 'Elemento de vídeo não encontrado')
        return
      }
      
      videoRef.current.srcObject = stream
      setCurrentStream(stream)
      
      // Aguardar o vídeo carregar
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
        
        video.play().catch(reject)
      })
      
      // Obter informações do stream
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        addLog('success', 'Câmera inicializada com sucesso', settings)
      }
      
      setIsScanning(true)
      
      // Iniciar análise de frames com debounce robusto
      scanIntervalRef.current = setInterval(analyzeFrame, 300) // 3.33 FPS para reduzir lag
      
    } catch (error) {
      const errorMessage = `Erro ao inicializar câmera: ${error}`
      addLog('error', errorMessage)
      setError(errorMessage)
    }
  }, [addLog, analyzeFrame, currentStream, selectedCameraId])

  // Parar scanner
  const stopScanner = useCallback(() => {
    addLog('info', 'Parando scanner...')
    
    setIsScanning(false)
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
      setCurrentStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    addLog('success', 'Scanner parado com sucesso')
  }, [addLog, currentStream])

  // Reiniciar scanner
  const restartScanner = useCallback(() => {
    addLog('info', 'Reiniciando scanner...')
    stopScanner()
    setTimeout(() => {
      initializeCamera()
    }, 1000)
  }, [addLog, initializeCamera, stopScanner])

  // Alternar câmera
  const switchCamera = useCallback(() => {
    if (cameras.length <= 1) return
    
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextCamera = cameras[nextIndex]
    
    addLog('info', `Alternando para: ${nextCamera.label}`)
    setSelectedCameraId(nextCamera.deviceId)
    
    // Reinicializar com nova câmera
    setTimeout(() => {
      initializeCamera()
    }, 500)
  }, [addLog, cameras, initializeCamera, selectedCameraId])

  // Efeito para controlar o scanner
  useEffect(() => {
    if (isOpen && !isScanning) {
      addLog('info', 'Scanner aberto, iniciando...')
      enumerateCameras().then(() => {
        setTimeout(() => {
          initializeCamera()
        }, 500)
      })
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
  }, [isOpen]) // Remover dependências para evitar loops

  // Reset estados quando fechar
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setScanCount(0)
      setLastScannedCode(null)
      setLogs([])
      setConsecutiveDetections({})
      setIsInCooldown(false)
      
      // Limpar timeouts
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current)
        cooldownTimeoutRef.current = null
      }
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
              <span>Scanner Nativo (Diagnóstico)</span>
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
                
                <canvas 
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Overlay de status */}
                <div className="absolute top-2 left-2 space-y-1">
                  {isScanning && (
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
                </div>
                
                {/* Contador de scans e status */}
                <div className="absolute top-2 right-2 space-y-1">
                  {scanCount > 0 && (
                    <Badge className="bg-black bg-opacity-50 text-white">
                      Scans: {scanCount}
                    </Badge>
                  )}
                  
                  {Object.keys(consecutiveDetections).length > 0 && (
                    <Badge className="bg-blue-500 text-white">
                      Detectando: {Object.values(consecutiveDetections)[0]}/3
                    </Badge>
                  )}
                  
                  {isInCooldown && (
                    <Badge className="bg-orange-500 text-white">
                      Cooldown
                    </Badge>
                  )}
                </div>
                
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
                  disabled={!isScanning}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reiniciar
                </Button>
                
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="sm"
                  disabled={cameras.length <= 1}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Alternar Câmera
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
                <span className="font-medium">Logs de Diagnóstico</span>
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
            <p>• Este é um scanner de diagnóstico que usa apenas APIs nativas do navegador</p>
            <p>• Posicione um código de barras na linha vermelha central</p>
            <p>• Verifique os logs para identificar problemas específicos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}