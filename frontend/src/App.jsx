import { useState, useEffect } from "react" 
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home         from "./pages/Home"
import Monitor      from "./pages/Monitor"
import TradeHistory from "./pages/TradeHistory"
import Pricing      from "./pages/Pricing"
import Account      from "./pages/Account"
import Login        from "./pages/Login"
import ErrorBoundary from "./components/ErrorBoundary"

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"   element={<Home />}/>
          <Route path="/monitor"      element={<Monitor/>}/>
          <Route path="/history"      element={<TradeHistory/>}/>
          <Route path="/pricing"      element={<Pricing/>}/>
          <Route path="/account"      element={<Account/>}/>
          <Route path="/login"        element={<Login/>}/>
          <Route path="/signup"       element={<Login/>}/>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}