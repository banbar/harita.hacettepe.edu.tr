import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./index.css";

// 'root' elementini hedefleyerek bir ReactDOM kökü oluştur
// Create a ReactDOM root by targeting the 'root' element
const root = ReactDOM.createRoot(document.getElementById('root'));
// ReactDOM kökünde uygulamayı render et
// render app in ReactDOM root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

