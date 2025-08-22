declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string
      type: string
      target: HTMLVideoElement
      constraints: {
        width: number
        height: number
        facingMode: string
      }
    }
    locator: {
      patchSize: string
      halfSample: boolean
    }
    numOfWorkers: number
    decoder: {
      readers: string[]
    }
    locate: boolean
  }

  interface DetectionResult {
    codeResult: {
      code: string
      format: string
    }
    line: any
    angle: number
    pattern: any
    box: any
  }

  interface Quagga {
    init(config: QuaggaConfig, callback: (err: any) => void): void
    start(): void
    stop(): void
    onDetected(callback: (data: DetectionResult) => void): void
    offDetected(callback: (data: DetectionResult) => void): void
  }

  const quagga: Quagga
  export default quagga
}