import { BrowserRouter, Routes, Route } from "react-router-dom"
import ErrorBoundary  from "./components/ErrorBoundary"
import ProtectedRoute from "./pages/common/ProtectedRoute"

// 공통
import Landing     from "./pages/common/Landing"
import Login       from "./pages/common/Login"
import Pricing     from "./pages/common/Pricing"
import Account     from "./pages/common/Account"

// 미국주식
import Home         from "./pages/stock/Home"          // 스캐너 (모니터링 기능 포함)
import TradeHistory from "./pages/stock/TradeHistory"   // 거래내역 (스캐너용)

// 비트코인
import Trade        from "./pages/crypto/Trade"          // 봇제어
import CryptoMonitor  from "./pages/crypto/CryptoMonitor"  // BTC 모니터
import CryptoHistory  from "./pages/crypto/CryptoHistory"  // BTC 거래내역

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* 퍼블릭 */}
          <Route path="/"        element={<Landing />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* 공통 (로그인 필요) */}
          <Route path="/account"    element={<ProtectedRoute><Account /></ProtectedRoute>} />

          {/* 미국주식 섹션 - 스캐너가 모니터링 기능 포함 */}
          <Route path="/stock"          element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/stock/history"  element={<ProtectedRoute><TradeHistory /></ProtectedRoute>} />

          {/* 비트코인 섹션 */}
          <Route path="/crypto"          element={<ProtectedRoute><Trade /></ProtectedRoute>} />
          <Route path="/crypto/monitor"  element={<ProtectedRoute><CryptoMonitor /></ProtectedRoute>} />
          <Route path="/crypto/history"  element={<ProtectedRoute><CryptoHistory /></ProtectedRoute>} />

          {/* 하위 호환 (기존 링크 유지) - 모니터는 스캐너로 통합 */}
          <Route path="/scan"      element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/trade"     element={<ProtectedRoute><Trade /></ProtectedRoute>} />
          <Route path="/monitor"   element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/history"   element={<ProtectedRoute><TradeHistory /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
