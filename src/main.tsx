import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './components/ui/ConfirmProvider';
import './index.css';
// Loaded after index.css so the landing-page rework wins the cascade.
import './landing-v3.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
