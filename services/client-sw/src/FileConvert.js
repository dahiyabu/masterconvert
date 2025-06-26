import { useState } from 'react';
import ModeSelector from './components/ModeSelector';
import ConvertSection from './components/ConvertSection';
import MergeSection from './components/MergeSection';
import FormatCompatibilityLookup from './components/FormatCompatibilityTable';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc, #e0f2fe, #e0e7ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  wrapper: {
    width: '100%',
    maxWidth: '64rem',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(16px)',
    borderRadius: '1.5rem',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  content: {
    padding: '2rem',
    textAlign: 'center', // This is the key - same alignment as ModeSelector
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
  },
  footerText: {
    color: '#64748b',
    fontSize: '0.875rem',
  }
};

export default function FileConvertApp() {
  const [mode, setMode] = useState('convert');
  const API_URL = window.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Main Card */}
        <div style={styles.card}>
          {/* Mode Selector */}
          <ModeSelector mode={mode} setMode={setMode} />
          
          {/* Content - with same text alignment as ModeSelector */}
          <div style={styles.content}>
            <div className="transition-all duration-500 ease-in-out">
              {mode === 'convert' ? (
                <>
                  <ConvertSection API_URL={API_URL} />
                  <div style={{ marginTop: '3rem' }}>
                    <FormatCompatibilityLookup />
                  </div>
                </>
              ) : (
                <MergeSection API_URL={API_URL} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Powered by ConvertMaster
          </p>
        </div>
      </div>
    </div>
  );
}