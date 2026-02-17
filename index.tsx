import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SUPABASE_CREDENTIALS_AVAILABLE } from './services/supabaseClient';
import { GEMINI_API_KEY_AVAILABLE } from './services/geminiService';
import { ConfigurationError } from './components/ConfigurationError';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// Initialize Sentry for error monitoring
// DSN should be set in environment variable VITE_SENTRY_DSN
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% on error
    // Environment
    environment: import.meta.env.MODE,
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Check for Demo Mode (allows bypassing config check)
const searchParams = new URLSearchParams(window.location.search);
const isDemoMode = searchParams.get('demo') === 'true';

const isConfigured = (SUPABASE_CREDENTIALS_AVAILABLE && GEMINI_API_KEY_AVAILABLE) || isDemoMode;

if (!isConfigured) {
  const missingServices: string[] = [];
  const requiredVariables: string[] = [];
  if (!SUPABASE_CREDENTIALS_AVAILABLE) {
    missingServices.push('Supabase Database');
    requiredVariables.push('VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY');
  }
  if (!GEMINI_API_KEY_AVAILABLE) {
    missingServices.push('Google Gemini AI');
    requiredVariables.push('GEMINI_API_KEY (Supabase Secret)');
  }

  root.render(
    <React.StrictMode>
      <ConfigurationError
        missingServices={missingServices}
        requiredVariables={requiredVariables}
      />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
