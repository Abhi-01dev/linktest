import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const hasValidClientId =
  rawGoogleClientId &&
  rawGoogleClientId !== 'YOUR_GOOGLE_CLIENT_ID' &&
  !rawGoogleClientId.startsWith('YOUR_');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {hasValidClientId ? (
      <GoogleOAuthProvider clientId={rawGoogleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
