// src/index.js
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { BrowserRouter } from 'react-router-dom';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading translations...</div>}>
           <I18nextProvider i18n={i18n}>
         <App />
     </I18nextProvider>
    </Suspense>
  </React.StrictMode>
);
