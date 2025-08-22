'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  Smartphone,
  AlertCircle,
  Timer
} from 'lucide-react'
import { formatCurrency } from '@/utils'

interface PixQRCodeProps {
  amount: number
  saleId: string
  onPaymentConfirmed: () => void
  onCancel: () => void
  onExpired: () => void
  isOpen: boolean
}

interface PixPaymentData {
  qrCode: string
  pixKey: string
  txId: string
  expiresAt: Date
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
}

export default function PixQRCode({ 
  amount, 
  saleId, 
  onPaymentConfirmed, 
  onCancel, 
  onExpired, 
  isOpen 
}: PixQRCodeProps) {
  const [pixData, setPixData] = useState<PixPaymentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (isOpen && !pixData) {
      generatePixPayment()
    }
    return
  }, [isOpen])

  useEffect(() => {
    if (pixData && pixData.status === 'pending') {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expiry = new Date(pixData.expiresAt).getTime()
        const remaining = Math.max(0, expiry - now)
        
        setTimeLeft(remaining)
        
        if (remaining === 0) {
          setPixData(prev => prev ? { ...prev, status: 'expired' } : null)
          onExpired()
          clearInterval(interval)
        }
      }, 1000)

      // Verificar status do pagamento periodicamente
      const statusInterval = setInterval(() => {
        if (pixData.status === 'pending') {
          checkPaymentStatus()
        }
      }, 3000) // Verificar a cada 3 segundos

      return () => {
        clearInterval(interval)
        clearInterval(statusInterval)
      }
    }
    return undefined
  }, [pixData])

  const generatePixPayment = async () => {
    try {
      setLoading(true)
      
      // TODO: Implementar chamada para API do gateway de pagamento
      // const response = await fetch('/api/payments/pix/generate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, saleId })
      // })
      // const data = await response.json()
      
      // Simulação de dados PIX
      const mockPixData: PixPaymentData = {
        qrCode: generateMockPixCode(),
        pixKey: 'exemplo@email.com',
        txId: `TXN${Date.now()}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
        status: 'pending'
      }
      
      setPixData(mockPixData)
    } catch (error) {
      console.error('Erro ao gerar PIX:', error)
      alert('Erro ao gerar código PIX. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const generateMockPixCode = (): string => {
    // Simulação de um código PIX (EMV)
    // Em uma implementação real, isso viria do gateway de pagamento
    const pixKey = 'exemplo@email.com'
    const merchantName = 'SIS IAGO COMERCIO'
    const merchantCity = 'SAO PAULO'
    const txId = `TXN${Date.now()}`
    
    // Formato simplificado para demonstração
    return `00020126580014BR.GOV.BCB.PIX0136${pixKey}0208${txId}5204000053039865802BR5913${merchantName}6009${merchantCity}62070503***6304`
  }

  const checkPaymentStatus = async () => {
    if (!pixData || checking) return
    
    try {
      setChecking(true)
      
      // TODO: Implementar verificação real do status
      // const response = await fetch(`/api/payments/pix/status/${pixData.txId}`)
      // const data = await response.json()
      
      // Simulação: 10% de chance de pagamento ser confirmado a cada verificação
      const isPaid = Math.random() < 0.1
      
      if (isPaid) {
        setPixData(prev => prev ? { ...prev, status: 'paid' } : null)
        onPaymentConfirmed()
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setChecking(false)
    }
  }

  const copyPixCode = async () => {
    if (!pixData) return
    
    try {
      await navigator.clipboard.writeText(pixData.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
      alert('Erro ao copiar código PIX')
    }
  }

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleCancel = () => {
    if (pixData) {
      setPixData(prev => prev ? { ...prev, status: 'cancelled' } : null)
    }
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              Pagamento PIX
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Gerando código PIX...</p>
            </div>
          ) : !pixData ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 mb-4">Erro ao gerar código PIX</p>
              <Button onClick={generatePixPayment}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          ) : pixData.status === 'paid' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">Pagamento Confirmado!</h3>
              <p className="text-gray-600">O pagamento foi processado com sucesso.</p>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Valor:</strong> {formatCurrency(amount)}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Transação:</strong> {pixData.txId}
                </p>
              </div>
            </div>
          ) : pixData.status === 'expired' ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              <h3 className="text-xl font-bold text-orange-600 mb-2">Código Expirado</h3>
              <p className="text-gray-600 mb-4">O tempo limite para pagamento foi excedido.</p>
              <Button onClick={generatePixPayment} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Novo Código
              </Button>
            </div>
          ) : (
            <>
              {/* Valor e Timer */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(amount)}
                </div>
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <Timer className="w-4 h-4" />
                  <span className="font-mono text-lg">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Tempo restante para pagamento</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCodeSVG
                    value={pixData.qrCode}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Instruções */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Smartphone className="w-5 h-5" />
                  <span className="font-medium">Como pagar:</span>
                </div>
                <ol className="text-sm text-gray-600 text-left space-y-1">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escolha a opção PIX</li>
                  <li>3. Escaneie o QR Code ou copie o código</li>
                  <li>4. Confirme o pagamento</li>
                </ol>
              </div>

              {/* Código PIX para copiar */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Código PIX (Copiar e Colar):
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-gray-50 border rounded text-xs font-mono break-all">
                    {pixData.qrCode.substring(0, 50)}...
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPixCode}
                    className={copied ? 'text-green-600' : ''}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Status e Ações */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-yellow-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Aguardando pagamento...</span>
                  {checking && <RefreshCw className="w-4 h-4 animate-spin" />}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={checkPaymentStatus}
                    disabled={checking}
                    className="flex-1"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                    Verificar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>Chave PIX: {pixData.pixKey}</p>
                <p>ID da Transação: {pixData.txId}</p>
                <p>Venda: #{saleId}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}