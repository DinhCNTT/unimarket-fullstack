import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để hiển thị fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log lỗi để debug
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI khi có lỗi
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
            😵 Oops! Có lỗi xảy ra
          </div>
          <div style={{ marginBottom: '20px', fontSize: '16px', color: '#ccc' }}>
            Đã có lỗi không mong muốn xảy ra khi tải video
          </div>
          
          {/* Hiển thị chi tiết lỗi khi development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginBottom: '20px', 
              maxWidth: '800px', 
              backgroundColor: '#333', 
              padding: '15px', 
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '14px',
              color: '#ff6b6b'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
                Chi tiết lỗi (Development Mode)
              </summary>
              <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ff7a00',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🔄 Tải lại trang
            </button>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ← Quay lại
            </button>
          </div>
        </div>
      );
    }

    // Nếu không có lỗi, render children bình thường
    return this.props.children;
  }
}

export default ErrorBoundary;