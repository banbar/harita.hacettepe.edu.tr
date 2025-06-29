// src/components/ErrorBoundary.js
import React from 'react';
import { Snackbar, Alert } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, snackbar: { open: false, message: '', severity: 'error' } };
  }
  
  static getDerivedStateFromError(error) {
    // Bir hata meydana geldiğinde state'i güncelle
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Hata bilgilerini loglamak için
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ snackbar: { open: true, message: 'Bir hata oluştu.', severity: 'error' } });
  }
  
  handleCloseSnackbar = () => {
    this.setState({ snackbar: { ...this.state.snackbar, open: false } });
  };

  render() {
    if (this.state.hasError) {
      // Yedek UI
      return (
        <div>
          <h2>Bir hata oluştu.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          {/* Snackbar */}
          <Snackbar open={this.state.snackbar.open} autoHideDuration={6000} onClose={this.handleCloseSnackbar}>
            <Alert onClose={this.handleCloseSnackbar} severity={this.state.snackbar.severity} sx={{ width: '100%' }}>
              {this.state.snackbar.message}
            </Alert>
          </Snackbar>
        </div>
      );
    }
    
    return this.props.children; 
  }
}

export default ErrorBoundary;
