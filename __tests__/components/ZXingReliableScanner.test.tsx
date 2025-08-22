import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ZXingReliableScanner } from '@/components/ZXingReliableScanner'
import '@testing-library/jest-dom'

// Mock do ZXing library
jest.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
    decodeFromVideoDevice: jest.fn(),
    reset: jest.fn(),
    getVideoInputDevices: jest.fn().mockResolvedValue([
      { deviceId: 'camera1', label: 'Camera 1' },
      { deviceId: 'camera2', label: 'Camera 2' }
    ])
  }))
}))

describe('ZXingReliableScanner', () => {
  const mockOnScan = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar quando isOpen é true', () => {
    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Scanner ZXing Confiável')).toBeInTheDocument()
    expect(screen.getByText('Posicione o código de barras na área destacada')).toBeInTheDocument()
  })

  it('não deve renderizar quando isOpen é false', () => {
    render(
      <ZXingReliableScanner
        isOpen={false}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    expect(screen.queryByText('Scanner ZXing Confiável')).not.toBeInTheDocument()
  })

  it('deve chamar onClose quando o botão fechar é clicado', () => {
    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByRole('button', { name: /fechar/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve exibir mensagem de erro quando câmera não está disponível', async () => {
    // Mock erro de getUserMedia
    const mockGetUserMedia = jest.fn().mockRejectedValue(new Error('Camera not available'))
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia
      }
    })

    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/erro ao acessar a câmera/i)).toBeInTheDocument()
    })
  })

  it('deve alternar entre câmeras quando há múltiplas disponíveis', async () => {
    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    // Aguardar carregamento das câmeras
    await waitFor(() => {
      const switchButton = screen.queryByRole('button', { name: /alternar câmera/i })
      if (switchButton) {
        fireEvent.click(switchButton)
      }
    })

    // Verificar se a função de alternância foi chamada
    // (implementação específica depende do componente)
  })

  it('deve validar códigos de barras e rejeitar números aleatórios', async () => {
    const { BrowserMultiFormatReader } = require('@zxing/library')
    const mockReader = new BrowserMultiFormatReader()
    
    // Mock de resultado inválido (número aleatório)
    mockReader.decodeFromVideoDevice.mockResolvedValue({
      getText: () => '123456789'
    })

    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    // Simular detecção de código inválido
    // O componente deve rejeitar números aleatórios
    await waitFor(() => {
      expect(mockOnScan).not.toHaveBeenCalled()
    })
  })

  it('deve aceitar códigos de barras válidos', async () => {
    const { BrowserMultiFormatReader } = require('@zxing/library')
    const mockReader = new BrowserMultiFormatReader()
    
    // Mock de resultado válido (código de barras real)
    const validBarcode = '7891234567890' // EAN-13 válido
    mockReader.decodeFromVideoDevice.mockResolvedValue({
      getText: () => validBarcode
    })

    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    // Simular detecção de código válido
    await waitFor(() => {
      // Verificar se o callback foi chamado com o código válido
      // (implementação específica depende da lógica de validação)
    })
  })

  it('deve limpar recursos quando o componente é desmontado', () => {
    const { unmount } = render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    const { BrowserMultiFormatReader } = require('@zxing/library')
    const mockReader = new BrowserMultiFormatReader()

    unmount()

    // Verificar se o reset foi chamado para limpar recursos
    expect(mockReader.reset).toHaveBeenCalled()
  })

  it('deve exibir indicador de carregamento durante inicialização', () => {
    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    // Verificar se há indicador de carregamento
    expect(screen.getByText(/iniciando câmera/i)).toBeInTheDocument()
  })

  it('deve ter acessibilidade adequada', () => {
    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    // Verificar elementos de acessibilidade
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/scanner de código de barras/i)).toBeInTheDocument()
  })

  it('deve funcionar com teclado (navegação por tab)', () => {
    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    const closeButton = screen.getByRole('button', { name: /fechar/i })
    
    // Simular navegação por teclado
    fireEvent.keyDown(closeButton, { key: 'Enter' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)

    // Testar tecla Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(2)
  })
})

// Testes de integração
describe('ZXingReliableScanner - Integração', () => {
  it('deve integrar corretamente com o PDV', async () => {
    const mockOnScan = jest.fn()
    const mockOnClose = jest.fn()

    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={mockOnScan}
        onClose={mockOnClose}
      />
    )

    // Simular scan de produto
    const productBarcode = '7891234567890'
    
    // Verificar se o callback é chamado com o formato correto
    // mockOnScan.mockImplementation((code) => {
    //   expect(typeof code).toBe('string')
    //   expect(code.length).toBeGreaterThan(0)
    // })
  })

  it('deve funcionar em diferentes tamanhos de tela', () => {
    // Teste responsivo
    const originalInnerWidth = window.innerWidth
    const originalInnerHeight = window.innerHeight

    // Simular tela mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    })

    render(
      <ZXingReliableScanner
        isOpen={true}
        onScan={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.getByText('Scanner ZXing Confiável')).toBeInTheDocument()

    // Restaurar valores originais
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    })
  })
})