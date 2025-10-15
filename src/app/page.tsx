export default function Home() {
  return (
    <main className="min-h-screen bg-facil-gris flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          FácilChat
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Centraliza tus conversaciones de WhatsApp Business
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <p className="text-gray-700 mb-6">
            Inicia sesión para gestionar tus clientes y conversaciones desde un solo lugar.
          </p>
          <a 
            href="/login"
            className="inline-block bg-facil-verde text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    </main>
  )
}