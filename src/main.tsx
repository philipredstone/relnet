import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app.css';

// Create root and render the App component into the HTML element with ID 'root'
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.error('Root element not found');
}
