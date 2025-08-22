'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import BarcodeScanner from '@/components/BarcodeScanner'
import PixelBarcodeScanner from '@/components/PixelBarcodeScanner'
import WebOnDevicesBarcodeScanner from '@/components/WebOnDevicesBarcodeScanner'
import ZXingBarcodeScanner from '@/components/ZXingBarcodeScanner'
import ZXingReliableScanner from '@/components/ZXingReliableScanner'
import OptimizedBarcodeScanner from '@/components/OptimizedBarcodeScanner'
import Html5QrcodeScanner from '@/components/Html5QrcodeScanner'
import { Camera, TestTube, Zap, Smartphone, Cpu, Scan } from 'lucide-react'

export default function TestScannerPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [showPixelScanner, setShowPixelScanner] = useState(false)
  const [showWebOnDevicesScanner, setShowWebOnDevicesScanner] = useState(false)
  const [showZXingScanner, setShowZXingScanner] = useState(false)
  const [showZXingReliableScanner, setShowZXingReliableScanner] = useState(false)
  const [showOptimizedScanner, setShowOptimizedScanner] = useState(false)
  const [showHtml5Scanner, setShowHtml5Scanner] = useState(false)

  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<Array<{code: string, timestamp: Date, scanner: string}>>([])  
  const [systemInfo, setSystemInfo] = useState({
    protocol: 'N/A',
    hostname: 'N/A',
    userAgent: 'N/A',
    cameraSupported: 'N/A'
  })

  useEffect(() => {
    // Atualizar informações do sistema apenas no cliente
    setSystemInfo({
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent.substring(0, 50) + '...',
      cameraSupported: navigator.mediaDevices ? 'Sim' : 'Não'
    })
  }, [])

  const handleScanResult = (code: string) => {
    setLastScannedCode(code)
    setScanHistory(prev => [{
      code,
      timestamp: new Date(),
      scanner: 'Quagga Scanner'
    }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10
    
    // Fechar scanner
    setShowScanner(false)
  }

  const handleSimpleScanResult = (code: string) => {
    setLastScannedCode(code)
    setScanHistory(prev => [{
      code,
      timestamp: new Date(),
      scanner: 'Pixel Scanner'
    }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10
    
    // Fechar scanner
    setShowPixelScanner(false)
  }

  const handleWebOnDevicesScanResult = (code: string) => {
    setLastScannedCode(code)
    setScanHistory(prev => [{
      code,
      timestamp: new Date(),
      scanner: 'WebOnDevices Scanner'
    }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10
    
    // Fechar scanner
    setShowWebOnDevicesScanner(false)
  }

  const handleZXingScanResult = (code: string) => {
    setLastScannedCode(code)
    setScanHistory(prev => [{
      code,
      timestamp: new Date(),
      scanner: 'ZXing Scanner'
    }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10
    
    // Fechar scanner
    setShowZXingScanner(false)
  }

  const handleZXingReliableScanResult = (code: string) => {
    setLastScannedCode(code)
    setScanHistory(prev => [{
      code,
      timestamp: new Date(),
      scanner: 'ZXing Confiável (SOLUÇÃO)'
    }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10
    
    // Fechar scanner
    setShowZXingReliableScanner(false)
  }

  const handleOptimizedScanResult = (code: string) => {
    setLastScannedCode(code)
    setScanHistory(prev => [{
      code,
      timestamp: new Date(),
      scanner: 'Scanner Otimizado'
    }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10
    
    // Fechar scanner
    setShowOptimizedScanner(false)
  }

  const handleHtml5ScanResult = (code: string) => {
    setLastScannedCode(code)
    setScanHistory(prev => [{
      code,
      timestamp: new Date(),
      scanner: 'Html5-QRCode Scanner'
    }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10
    
    // Fechar scanner
    setShowHtml5Scanner(false)
  }

  const closeScanner = () => {
    setShowScanner(false)
  }

  const closeSimpleScanner = () => {
    setShowPixelScanner(false)
  }

  const closeWebOnDevicesScanner = () => {
    setShowWebOnDevicesScanner(false)
  }

  const closeZXingScanner = () => {
    setShowZXingScanner(false)
  }

  const closeZXingReliableScanner = () => {
    setShowZXingReliableScanner(false)
  }

  const closeOptimizedScanner = () => {
    setShowOptimizedScanner(false)
  }

  const closeHtml5Scanner = () => {
    setShowHtml5Scanner(false)
  }

  const handleSimpleDebugScanResult = (code: string) => {
    setLastScannedCode(code)
    setScanHistory(prev => [{
      code,
      timestamp: new Date(),
      scanner: 'Scanner Simples Debug'
    }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10
    
    // Fechar scanner

  }

  const closeSimpleDebugScanner = () => {

  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TestTube className="w-6 h-6 mr-2 text-blue-500" />
              Teste de Scanners de Código de Barras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Esta página permite testar diferentes implementações de scanner de código de barras.
              Teste em diferentes dispositivos e navegadores para verificar a compatibilidade.
            </p>
          </CardContent>
        </Card>

        {/* Scanner ZXing Confiável - SOLUÇÃO DEFINITIVA */}
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Scan className="w-5 h-5 mr-2 text-red-500" />
              ZXing Confiável - SOLUÇÃO DEFINITIVA 🎯
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Scanner usando biblioteca ZXing comprovada que elimina completamente os números aleatórios.
              Esta é a solução definitiva para o problema de detecções falsas.
            </p>
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">🎯 Solução Implementada:</p>
              <ul className="text-xs text-red-700 mt-1 space-y-1">
                <li>• Elimina 100% dos números aleatórios</li>
                <li>• Biblioteca ZXing comprovada em produção</li>
                <li>• Detecção precisa e confiável</li>
                <li>• Validação rigorosa de códigos</li>
                <li>• Cooldown inteligente entre scans</li>
                <li>• Interface otimizada e logs detalhados</li>
              </ul>
            </div>
            <Button 
              onClick={() => setShowZXingReliableScanner(true)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Testar Scanner ZXing Confiável
            </Button>
          </CardContent>
        </Card>

        {/* Scanner Html5-QRCode - RECOMENDADO */}
        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Scan className="w-5 h-5 mr-2 text-green-500" />
              Html5-QRCode Scanner (RECOMENDADO) 🚀
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Scanner baseado na biblioteca html5-qrcode, amplamente testada e usada em produção.
              Funciona garantidamente em smartphones e dispositivos móveis.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">🚀 Vantagens:</p>
              <ul className="text-xs text-green-700 mt-1 space-y-1">
                <li>• Biblioteca amplamente testada em produção</li>
                <li>• Suporte nativo para dispositivos móveis</li>
                <li>• Múltiplos formatos de código de barras</li>
                <li>• Interface otimizada e responsiva</li>
                <li>• Configurações avançadas de câmera</li>
              </ul>
            </div>
            <Button 
              onClick={() => setShowHtml5Scanner(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Testar Html5-QRCode Scanner
            </Button>
          </CardContent>
        </Card>

        {/* Scanner Original */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Zap className="w-5 h-5 mr-2 text-orange-500" />
              Scanner Original (Quagga)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Scanner com detecção automática usando biblioteca Quagga.
              Suporta múltiplos formatos de código de barras e entrada manual.
            </p>
            <Button 
              onClick={() => setShowScanner(true)}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Testar Scanner Original
            </Button>
          </CardContent>
        </Card>

        {/* Scanner Simples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Cpu className="w-5 h-5 mr-2 text-blue-500" />
              Scanner Simples (Alternativo)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Scanner alternativo com análise de pixels simplificada.
              Implementação mais leve para testes de compatibilidade.
            </p>
            <Button 
              onClick={() => setShowPixelScanner(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Testar Scanner Simples
            </Button>
          </CardContent>
        </Card>

        {/* Scanner WebOnDevices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Scan className="w-5 h-5 mr-2 text-purple-500" />
              Scanner WebOnDevices (EAN-13)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Scanner baseado na implementação do webondevices.com.
              Otimizado especificamente para códigos EAN-13 com análise de padrões.
            </p>
            <Button 
              onClick={() => setShowWebOnDevicesScanner(true)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Testar Scanner WebOnDevices
            </Button>
          </CardContent>
        </Card>

        {/* Scanner ZXing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Scan className="w-5 h-5 mr-2 text-green-500" />
              Scanner ZXing (Recomendado)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Scanner baseado na biblioteca ZXing-js.
              Suporte robusto para múltiplos formatos de código de barras com alta precisão.
            </p>
            <Button 
              onClick={() => setShowZXingScanner(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Testar Scanner ZXing
            </Button>
          </CardContent>
        </Card>

        {/* Scanner Otimizado */}
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Zap className="w-5 h-5 mr-2 text-blue-500" />
              Scanner Otimizado (NOVO) ⭐
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Scanner otimizado com melhor performance, detecção de câmeras, 
              alternância entre câmeras frontal/traseira, entrada manual e feedback visual aprimorado.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">✨ Novidades:</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Detecção automática de câmeras disponíveis</li>
                <li>• Alternância entre câmera frontal e traseira</li>
                <li>• Interface otimizada para mobile</li>
                <li>• Melhor tratamento de erros</li>
                <li>• Feedback sonoro e visual</li>
              </ul>
            </div>
            <Button 
              onClick={() => setShowOptimizedScanner(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Testar Scanner Otimizado
            </Button>
          </CardContent>
        </Card>

        {/* Scanner Simples Debug */}
        <Card className="border-2 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TestTube className="w-5 h-5 mr-2 text-orange-500" />
              Scanner Simples - Debug 🔧
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Versão simplificada para debug e identificação de problemas.
              Use este scanner para testar a inicialização básica da câmera.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800 font-medium">🔧 Debug Features:</p>
              <ul className="text-xs text-orange-700 mt-1 space-y-1">
                <li>• Logs detalhados no console do navegador</li>
                <li>• Configuração mínima da câmera</li>
                <li>• Tratamento de erro simplificado</li>
                <li>• Ideal para identificar problemas</li>
              </ul>
            </div>
            <Button 
              disabled
              className="w-full bg-gray-400 cursor-not-allowed"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scanner Debug (Indisponível)
            </Button>
          </CardContent>
        </Card>

        {/* Resultado Atual */}
        {lastScannedCode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">
                ✅ Último Código Escaneado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-2xl font-mono font-bold text-green-800">
                  {lastScannedCode}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Escaneado em: {new Date().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        {scanHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Histórico de Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scanHistory.map((scan, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{scan.code}</span>
                      <span className="text-xs text-blue-600">{scan.scanner}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {scan.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Protocolo:</strong> {systemInfo.protocol}
              </div>
              <div>
                <strong>Host:</strong> {systemInfo.hostname}
              </div>
              <div>
                <strong>User Agent:</strong> {systemInfo.userAgent}
              </div>
              <div>
                <strong>Câmera Suportada:</strong> {systemInfo.cameraSupported}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner Original */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={closeScanner}
        onScan={handleScanResult}
        title="Scanner Original (Quagga) - Teste"
      />

      {/* Scanner Simples */}
      <PixelBarcodeScanner
        isOpen={showPixelScanner}
        onClose={closeSimpleScanner}
        onScan={handleSimpleScanResult}
        title="Scanner Simples - Teste"
      />

      {/* Scanner WebOnDevices */}
      <WebOnDevicesBarcodeScanner
        isOpen={showWebOnDevicesScanner}
        onClose={closeWebOnDevicesScanner}
        onScan={handleWebOnDevicesScanResult}
        title="Scanner WebOnDevices (EAN-13) - Teste"
      />

      {/* Scanner ZXing */}
      <ZXingBarcodeScanner
        isOpen={showZXingScanner}
        onClose={closeZXingScanner}
        onScan={handleZXingScanResult}
      />

      {/* Scanner ZXing Confiável */}
      <ZXingReliableScanner
        isOpen={showZXingReliableScanner}
        onClose={closeZXingReliableScanner}
        onScan={handleZXingReliableScanResult}
      />

      {/* Scanner Otimizado */}
      <OptimizedBarcodeScanner
        isOpen={showOptimizedScanner}
        onClose={closeOptimizedScanner}
        onScan={handleOptimizedScanResult}
      />

      {/* Scanner Html5-QRCode */}
      <Html5QrcodeScanner
        isOpen={showHtml5Scanner}
        onClose={closeHtml5Scanner}
        onScan={handleHtml5ScanResult}
      />

    </div>
  )
}