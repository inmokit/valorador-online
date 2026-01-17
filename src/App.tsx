import { Routes, Route } from 'react-router-dom'
import AddressSearch from './features/address-search/AddressSearch'
import PropertyDetails from './features/property-details/PropertyDetails'
import UnitSelector from './features/unit-selector/UnitSelector'
import VerifyData from './features/verify-data/VerifyData'
import RoomsConfig from './features/rooms-config/RoomsConfig'
import Extras from './features/extras/Extras'
import Finishes from './features/finishes/Finishes'
import ValuationResult from './features/result/ValuationResult'

function App() {
  return (
    <div className="min-h-dvh bg-background-light dark:bg-background-dark font-[Manrope] antialiased">
      <Routes>
        <Route path="/" element={<AddressSearch />} />
        <Route path="/detalles" element={<PropertyDetails />} />
        <Route path="/seleccionar-vivienda" element={<UnitSelector />} />
        <Route path="/verificar" element={<VerifyData />} />
        <Route path="/habitaciones" element={<RoomsConfig />} />
        <Route path="/extras" element={<Extras />} />
        <Route path="/acabados" element={<Finishes />} />
        <Route path="/resultado" element={<ValuationResult />} />
      </Routes>
    </div>
  )
}

export default App
