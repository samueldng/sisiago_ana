'use client'

export default function TestSimplePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Teste Simples</h1>
        <p className="text-gray-600 text-center">
          Esta é uma página de teste simples para verificar se o Next.js está funcionando corretamente.
        </p>
        <div className="mt-6">
          <button 
            onClick={() => alert('Botão funcionando!')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Testar JavaScript
          </button>
        </div>
      </div>
    </div>
  )
}