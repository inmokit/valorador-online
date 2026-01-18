import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { ClientProvider, useClient } from './context/ClientContext'
import AddressSearch from './features/address-search/AddressSearch'
import PropertyDetails from './features/property-details/PropertyDetails'
import UnitSelector from './features/unit-selector/UnitSelector'
import VerifyData from './features/verify-data/VerifyData'
import RoomsConfig from './features/rooms-config/RoomsConfig'
import Extras from './features/extras/Extras'
import Finishes from './features/finishes/Finishes'
import LeadCapture from './features/lead-capture/LeadCapture'
import ValuationResult from './features/result/ValuationResult'
import PublicReport from './features/report/PublicReport'

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="animate-pulse text-primary font-bold text-lg">Cargando...</div>
    </div>
  )
}

// Error component
function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="text-6xl mb-4">🏠</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cliente no encontrado</h1>
      <p className="text-gray-500 dark:text-gray-400 text-center">{message}</p>
    </div>
  )
}

// Valorador content - wrapped with client context
function ValoradorContent() {
  const { client, loading, error } = useClient()

  if (loading) return <LoadingScreen />
  if (error || !client) return <ErrorScreen message={error || 'El enlace puede estar incorrecto'} />

  return (
    <Routes>
      <Route index element={<AddressSearch />} />
      <Route path="detalles" element={<PropertyDetails />} />
      <Route path="seleccionar-vivienda" element={<UnitSelector />} />
      <Route path="verificar" element={<VerifyData />} />
      <Route path="habitaciones" element={<RoomsConfig />} />
      <Route path="extras" element={<Extras />} />
      <Route path="acabados" element={<Finishes />} />
      <Route path="datos" element={<LeadCapture />} />
      <Route path="resultado" element={<ValuationResult />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  )
}

// Client wrapper - gets slug from URL
function ClientWrapper() {
  const { slug } = useParams<{ slug: string }>()

  if (!slug) {
    return <ErrorScreen message="No se especificó un cliente" />
  }

  return (
    <ClientProvider slug={slug}>
      <ValoradorContent />
    </ClientProvider>
  )
}

// Legacy routes (without client) - redirect to home or show generic
function GenericValuator() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <div className="text-6xl mb-4">🏠</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Valorador de Viviendas</h1>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        Este valorador debe ser accedido a través del enlace proporcionado por tu agente inmobiliario.
      </p>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-dvh bg-background-light dark:bg-background-dark font-[Manrope] antialiased">
      <Routes>
        {/* Public valuation report */}
        <Route path="/v/:token" element={<PublicReport />} />

        {/* Client-specific routes */}
        <Route path="/:slug/*" element={<ClientWrapper />} />

        {/* Root fallback */}
        <Route path="/" element={<GenericValuator />} />
      </Routes>
    </div>
  )
}

export default App
