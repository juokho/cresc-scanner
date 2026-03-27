import { useState, useEffect } from "react" 
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login        from "./pages/login"
import Onboarding   from "./pages/Onboarding"
import Home         from "./pages/Home"
import Monitor      from "./pages/Monitor"
import Settings     from "./pages/Settings"
import TradeHistory from "./pages/TradeHistory"
import Pricing      from "./pages/Pricing"
import Account      from "./pages/Account"
import ErrorBoundary from "./components/ErrorBoundary"
import { fetchUserSettings, saveUserSettings } from "./api"

export default function App() {
  // 전역 상태 관리: 페이지 이동 시에도 값이 유지됩니다.
  const [leverage, setLeverage] = useState(50)
  const [tradePct, setTradePct] = useState(5)
  const [slRoi,     setSlRoi]    = useState(1.5)   // ATR 손절 배수 (Pine 기본값)
  const [tpRoi,     setTpRoi]    = useState(3.5)   // ATR 익절 배수 (Pine 기본값)
  const [symbolUpdating, setSymbolUpdating] = useState(false)  // 심볼 선택 로딩 상태

  // 사용자 설정 로드
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settings = await fetchUserSettings()
        if (settings) {
          setLeverage(settings.leverage || 50)
          setTradePct((settings.trade_pct || 0.05) * 100)
          setSlRoi(settings.sl_atr_mult || 1.5)
          setTpRoi(settings.tp_atr_mult || 3.5)
        }
      } catch (error) {
        console.error("설정 로드 실패:", error)
      }
    }
    loadUserSettings()
  }, [])

  // 설정 저장 함수
  const saveSettings = async () => {
    try {
      await saveUserSettings({
        leverage,
        tradePct,
        slAtrMult: slRoi,
        tpAtrMult: tpRoi,
      })
    } catch (error) {
      console.error("설정 저장 실패:", error)
    }
  }

  // Home 컴포넌트에 전달할 설정 객체
  const botSettings = {
    leverage, setLeverage,
    tradePct, setTradePct,
    slRoi,     setSlRoi,
    tpRoi,     setTpRoi,
    symbolUpdating, setSymbolUpdating,
    saveSettings  // 설정 저장 함수 전달
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<Navigate to="/dashboard" replace />} />
          <Route path="/login"         element={<Login/>}/>
          <Route path="/onboarding"   element={<Onboarding/>}/>
          <Route path="/dashboard"   element={<Home {...botSettings} />}/>
          <Route path="/monitor"      element={<Monitor/>}/>
          <Route path="/settings"     element={<Settings/>}/>
          <Route path="/history"      element={<TradeHistory/>}/>
          <Route path="/pricing"      element={<Pricing/>}/>
          <Route path="/account"      element={<Account/>}/>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}