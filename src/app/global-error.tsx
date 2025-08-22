'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-red-600 mb-2">500</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Algo deu errado!
              </h2>
              <p className="text-gray-600 mb-8">
                Ocorreu um erro inesperado. Tente novamente.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={reset}
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
              
              <div>
                <a
                  href="/"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Voltar ao início
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}