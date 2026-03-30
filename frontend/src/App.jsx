import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home         from "./pages/Home"
import Monitor      from "./pages/Monitor"
import TradeHistory from "./pages/TradeHistory"
import Pricing      from "./pages/Pricing"
import Account      from "./pages/Account"
import Login        from "./pages/Login"
import Landing      from "./pages/Landing"
import Trade        from "./pages/Trade"
import Onboarding   from "./pages/Onboarding"
import Settings     from "./pages/Settings"
import ErrorBoundary from "./components/ErrorBoundary"
import ProtectedRoute from "./pages/ProtectedRoute"

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* 퍼블릭 */}
          <Route path="/"         element={<Landing />} />
          <Route path="/landing"  element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/signup"   element={<Login />} />
          <Route path="/pricing"  element={<Pricing />} />

          {/* 로그인 필요 */}
          <Route path="/scan"       element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard"  element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/trade"      element={<ProtectedRoute><Trade /></ProtectedRoute>} />
          <Route path="/monitor"    element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
          <Route path="/history"    element={<ProtectedRoute><TradeHistory /></ProtectedRoute>} />
          <Route path="/account"    element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
