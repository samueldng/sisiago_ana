'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Camera,
  X,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Smartphone
} from 'lucide-react'

interface Html5QrcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
}

export default function Html5QrcodeScanner({ isOpen, onClose, onScan }: Html5QrcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  
  const scannerRef = useRef<any>(null)
  const scannerElementId = 'html5qr-code-scanner'
  const lastScanTimeRef = useRef<number>(0)

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
    // Aceitar códigos de 8 a 13 dígitos
    if (!/^\d{8,13}$/.test(code)) return false
    
    // Para códigos de 13 dígitos, validar EAN-13
    if (code.length === 13) {
      return isValidEAN13(code)
    }
    
    // Para outros tamanhos, aceitar como válidos
    return true
  }, [isValidEAN13])

  // Tocar som de confirmação
  const playBeepSound = useCallback(() => {
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
    } catch (error) {
      console.warn('Não foi possível reproduzir som:', error)
    }
  }, [])

  // Processar resultado do scan
  const handleScanResult = useCallback((decodedText: string) => {
    const now = Date.now()
    
    // Evitar scans duplicados muito rápidos (menos de 2 segundos)
    if (lastScannedCode === decodedText && now - lastScanTimeRef.current < 2000) {
      return
    }
    
    console.log('📱 Código detectado:', decodedText)
    setScanCount(prev => prev + 1)
    
    // Validar código
    if (isValidBarcode(decodedText)) {
      console.log('✅ Código válido:', decodedText)
      setLastScannedCode(decodedText)
      lastScanTimeRef.current = now
      
      // Tocar som de confirmação
      playBeepSound()
      
      // Chamar callback
      onScan(decodedText)
      
      // Fechar scanner após scan bem-sucedido
      setTimeout(() => {
        onClose()
      }, 500)
    } else {
      console.warn('⚠️ Código inválido:', decodedText)
      setError(`Código inválido: ${decodedText}`)
      setTimeout(() => setError(null), 3000)
    }
  }, [isValidBarcode, lastScannedCode, onScan, onClose, playBeepSound])

  // Processar erro do scan
  const handleScanError = useCallback((error: string) => {
    // Ignorar erros comuns que não são realmente problemas
    if (
      error.includes('NotFoundException') ||
      error.includes('No MultiFormat Readers') ||
      error.includes('No code found')
    ) {
      return
    }
    
    console.warn('Scanner error:', error)
  }, [])

  // Inicializar scanner
  const initializeScanner = useCallback(async () => {
    // Verificações robustas para evitar múltiplas inicializações
    if (scannerRef.current || isInitializing || isInitializingRef.current) {
      console.log('Scanner já está inicializando ou ativo')
      return
    }
    
    // Marcar como inicializando
    isInitializingRef.current = true
    setIsInitializing(true)
    setError(null)
    
    try {
      // Verificar se o elemento DOM existe
      const element = document.getElementById(scannerElementId)
      if (!element) {
        throw new Error(`Elemento DOM com id '${scannerElementId}' não encontrado`)
      }
      
      // Limpar conteúdo anterior do elemento
      element.innerHTML = ''
      
      // Importação dinâmica para evitar problemas de SSR
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      
      const config = {
        fps: 8, // Reduzir FPS para melhor performance em mobile
        qrbox: {
          width: 200,
          height: 200
        },
        aspectRatio: 1.0,
        disableFlip: false,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: false, // Desabilitar zoom para evitar problemas
        useBarCodeDetectorIfSupported: true,
        rememberLastUsedCamera: true,
        supportedScanTypes: [
          // Focar apenas em códigos de barras
          1, // CODE_128
          2, // CODE_39
          3, // CODE_93
          4, // CODABAR
          5, // EAN_13
          6, // EAN_8
          7, // ITF
          8  // UPC_A
        ]
      }
      
      const scanner = new Html5QrcodeScanner(
        scannerElementId,
        config,
        false // verbose
      )
      
      // Aguardar um pouco antes de renderizar
      await new Promise(resolve => setTimeout(resolve, 100))
      
      scanner.render(
        (decodedText) => {
          console.log('Scanner detectou código:', decodedText)
          handleScanResult(decodedText)
        },
        (error) => {
          // Filtrar erros não críticos
          if (!error.includes('NotFoundException') && 
              !error.includes('No MultiFormat Readers') && 
              !error.includes('No code found')) {
            console.warn('Scanner error:', error)
          }
          handleScanError(error)
        }
      )
      
      scannerRef.current = scanner
      setIsScanning(true)
      setIsInitializing(false)
      isInitializingRef.current = false
      
      console.log('✅ Html5QrcodeScanner inicializado com sucesso')
      
    } catch (error) {
      console.error('❌ Erro ao inicializar scanner:', error)
      setError(`Erro ao inicializar scanner: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setIsInitializing(false)
      isInitializingRef.current = false
    }
  }, [handleScanResult, handleScanError, isInitializing])

  // Parar scanner
  const stopScanner = useCallback(() => {
    // Limpar timeout se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
        scannerRef.current = null
        setIsScanning(false)
        setIsInitializing(false)
        isInitializingRef.current = false
        
        // Limpar elemento DOM
        const element = document.getElementById(scannerElementId)
        if (element) {
          element.innerHTML = ''
        }
        
        console.log('🛑 Scanner parado com sucesso')
      } catch (error) {
        console.warn('⚠️ Erro ao parar scanner:', error)
        // Forçar reset dos estados mesmo com erro
        scannerRef.current = null
        setIsScanning(false)
        setIsInitializing(false)
        isInitializingRef.current = false
      }
    } else {
      // Reset estados mesmo sem scanner ativo
      setIsScanning(false)
      setIsInitializing(false)
      isInitializingRef.current = false
    }
  }, [])

  // Reiniciar scanner
  const restartScanner = useCallback(() => {
    stopScanner()
    setTimeout(() => {
      initializeScanner()
    }, 500)
  }, [stopScanner, initializeScanner])

  // Referência para controlar timeouts e evitar race conditions
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializingRef = useRef(false)
  
  // Função para verificar se o elemento DOM existe
  const waitForElement = (elementId: string, maxAttempts: number = 20): Promise<HTMLElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0
      
      const checkElement = () => {
        const element = document.getElementById(elementId)
        if (element) {
          resolve(element)
          return
        }
        
        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error(`Elemento ${elementId} não encontrado após ${maxAttempts} tentativas`))
          return
        }
        
        setTimeout(checkElement, 100)
      }
      
      checkElement()
    })
  }

  // Efeito para controlar o scanner baseado no estado isOpen
  useEffect(() => {
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (isOpen && !isScanning && !isInitializing && !isInitializingRef.current) {
      // Aguardar DOM estar pronto e evitar múltiplas inicializações
      timeoutRef.current = setTimeout(async () => {
        try {
          // Verificar se o elemento existe antes de inicializar
          await waitForElement(scannerElementId)
          if (isOpen && !isInitializingRef.current) {
            initializeScanner()
          }
        } catch (error) {
          console.error('Erro ao aguardar elemento DOM:', error)
          setError('Erro ao inicializar scanner: elemento não encontrado')
        }
      }, 200)
    } else if (!isOpen && (isScanning || isInitializing)) {
      stopScanner()
    }
    
    // Cleanup ao desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (scannerRef.current) {
        stopScanner()
      }
    }
  }, [isOpen, isScanning, isInitializing, initializeScanner, stopScanner])

  // Reset estados quando fechar
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setScanCount(0)
      setLastScannedCode(null)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Scanner de Código de Barras</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Status */}
          <div className="mb-4">
            {isInitializing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Inicializando câmera...</span>
              </div>
            )}
            
            {isScanning && !isInitializing && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Scanner ativo - Aponte para o código de barras</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Scanner Container */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <div id={scannerElementId} className="w-full"></div>
            
            {/* Overlay de informações */}
            {isScanning && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                <div className="flex items-center space-x-1">
                  <Smartphone className="w-3 h-3" />
                  <span>Html5-QRCode Ativo</span>
                </div>
              </div>
            )}
            
            {/* Contador de scans */}
            {scanCount > 0 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                Tentativas: {scanCount}
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex space-x-2">
            <Button
              onClick={restartScanner}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={isInitializing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>

          {/* Instruções */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>• Posicione o código de barras dentro da área de scan</p>
            <p>• Mantenha o dispositivo estável</p>
            <p>• Certifique-se de que há boa iluminação</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}