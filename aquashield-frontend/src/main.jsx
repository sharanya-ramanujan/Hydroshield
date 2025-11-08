import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css'; // This line loads your styles

// This finds the <div id="root"></div> in your index.html
const rootElement = document.getElementById('root');

// This tells React to render your App component inside that div
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);