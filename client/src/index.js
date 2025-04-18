// Main Application Entry Point
// Created by Chakridhar

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastProvider } from './hooks/use-toast';
import ClerkProviderWrapper from './components/ClerkProviderWrapper';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProviderWrapper>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ClerkProviderWrapper>
  </React.StrictMode>
);