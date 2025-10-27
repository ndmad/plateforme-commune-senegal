import React from 'react';
import ReactDOM from 'react-dom/client';
import './theme/senegal-theme.css';  // ← AJOUTEZ CETTE LIGNE
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);