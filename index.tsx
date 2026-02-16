import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registrazione Service Worker per PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Risoluzione esplicita dell'URL per evitare che il browser punti a ai.studio
    // Usiamo il file sw.js presente nella root del progetto
    const swUrl = new URL('sw.js', window.location.href).href;
    
    navigator.serviceWorker.register(swUrl)
      .then(reg => {
        console.log('DomusLog PWA: Service Worker pronto all\'origine:', reg.scope);
      })
      .catch(err => {
        console.error('DomusLog PWA: Errore critico registrazione SW:', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);