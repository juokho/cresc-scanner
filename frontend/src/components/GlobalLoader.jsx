import { BLUE, BG, BLUE_LT, TEXT_PRI } from '../theme'

// 로고 SVG 컴포넌트
function LogoSpinner({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" style={{ display: 'block' }}>
      <rect width="128" height="128" rx="20" fill={BLUE}/>
      <circle cx="64" cy="64" r="44" stroke="white" strokeWidth="8" fill="none" opacity="0.3"/>
      <path d="M64 20 A44 44 0 1 0 64 108" stroke="white" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <line x1="82" y1="82" x2="106" y2="110" stroke="white" strokeWidth="9" strokeLinecap="round"/>
    </svg>
  )
}

export default function GlobalLoader({ isLoading, message = "QUANTER Scanning..." }) {
  if (!isLoading) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(8, 12, 16, 0.95)', // 더 어둡게
      backdropFilter: 'blur(5px)', // 블러 효과
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      gap: 32, zIndex: 9999,
    }}>
      {/* 로고 스피너 - 회전 + 펄스 애니메이션 */}
      <div className="logo-spinner" style={{
        width: 80, height: 80,
        animation: 'spin 2s linear infinite, pulse-opacity 1.5s ease-in-out infinite',
      }}>
        <LogoSpinner size={80} />
      </div>

      {/* 로딩 메시지 */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        color: TEXT_PRI,
        fontSize: 16,
        fontWeight: 500,
        textAlign: 'center',
        lineHeight: 1.5,
        letterSpacing: '0.5px',
      }}>
        {message}
      </div>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
