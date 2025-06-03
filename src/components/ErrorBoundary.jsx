
import React, { Component } from 'react';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends Component {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-[#FFF3E0] px-4">
          <div className="bg-[#ffebee] border-l-4 border-[#FF6200] text-[#FF6200] p-3 rounded-lg">
            <p className="text-sm">Xatolik yuz berdi: {this.state.errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-[#FF6200] hover:text-[#FFAB40] font-medium flex items-center text-sm"
            >
              <RefreshIcon className="w-4 h-4 mr-1" />
              Sahifani yangilash
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
