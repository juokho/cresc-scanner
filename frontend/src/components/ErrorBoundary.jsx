import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error, errorInfo) {
    return {
      hasError: true,
      error,
      errorInfo
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff2f2',
          color: '#ff6b6b',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '10px' }}>⚠️ 오류가 발생했습니다</h2>
          <details style={{ textAlign: 'left', marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>오류 상세 정보</summary>
            <pre style={{ 
              background: '#f8f8f8', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              textAlign: 'left'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
            {this.state.errorInfo && (
              <div style={{ marginTop: '10px' }}>
                <strong>Component Stack:</strong>
                <pre style={{ 
                  background: '#f0f0f0', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '11px',
                  overflow: 'auto'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#3b5bdb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            페이지 새로고침
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
