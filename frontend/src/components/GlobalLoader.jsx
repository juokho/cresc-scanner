import { BLUE, BG, BLUE_LT, TEXT_PRI } from '../theme'

function ScanningLogo({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 1. 배경 사각형 (로고 본체) */}
      <rect width="128" height="128" rx="20" fill={BLUE} />
      
      {/* 2. 고정된 원형 라인 (Q의 몸통 - 배경) */}
      <circle 
        cx="64" cy="64" r="44" 
        stroke="white" strokeWidth="8" 
        fill="none" opacity="0.15" 
      />
      
      {/* 3. 느리게 도는 Q 진한 아크 */}
      <g style={{ 
        transformOrigin: '64px 64px', 
        animation: 'spin-slow 3s linear infinite' 
      }}>
        <path 
          d="M64 20 A44 44 0 1 0 64 108" 
          stroke="white" strokeWidth="9" strokeLinecap="round" fill="none"
        />
      </g>
      
      {/* 4. 빠르게 도는 스캔 작대기 */}
      <g style={{ 
        transformOrigin: '64px 64px', 
        animation: 'spin 2.0s linear infinite' 
      }}>
        {/* Q의 꼬리 겸 스캔 바 */}
        <line 
          x1="64" y1="64" x2="100" y2="100" 
          stroke="white" strokeWidth="10" strokeLinecap="round" 
        />
        {/* 앞부분에 살짝 강조 효과 */}
        <circle cx="100" cy="100" r="4" fill="white" />
      </g>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

export default function GlobalLoader({ isLoading, message = "QUANTER ENGINE SCANNING..." }) {
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
      {/* 스캐닝 로고 - 1.5초 회전 애니메이션 */}
      <ScanningLogo size={80} />

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
    </div>
  );
}
