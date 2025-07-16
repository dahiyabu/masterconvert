import React from 'react';
import { RefreshCw, Merge } from 'lucide-react';

const styles = {
  container: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #111827, #374151, #111827)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    marginBottom: '1.5rem',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '1.125rem',
    color: '#6b7280',
    marginBottom: '2rem',
    lineHeight: '1.6',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 2rem',
    borderRadius: '1rem',
    border: '2px solid #e5e7eb',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#374151',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  },
  buttonActive: {
    borderColor: '#3b82f6',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
    transform: 'translateY(-2px)',
  }
};

export default function ModeSelector({ mode, setMode }) {
  const handleButtonHover = (e, isActive) => {
    if (!isActive) {
      e.target.style.borderColor = '#d1d5db';
      e.target.style.transform = 'translateY(-1px)';
      e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.1)';
    }
  };

  const handleButtonLeave = (e, isActive) => {
    if (!isActive) {
      e.target.style.borderColor = '#e5e7eb';
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>File Processing Studio</h1>
      <p style={styles.subtitle}>
        Transform and merge your files with professional-grade tools
      </p>
      <div style={styles.buttonGroup}>
        <button
          style={{
            ...styles.button,
            ...(mode === 'convert' ? styles.buttonActive : {})
          }}
          onClick={() => setMode('convert')}
          onMouseEnter={(e) => handleButtonHover(e, mode === 'convert')}
          onMouseLeave={(e) => handleButtonLeave(e, mode === 'convert')}
        >
          <RefreshCw size={20} />
          Convert Files
        </button>
        {/*<button
          style={{
            ...styles.button,
            ...(mode === 'merge' ? styles.buttonActive : {})
          }}
          onClick={() => setMode('merge')}
          onMouseEnter={(e) => handleButtonHover(e, mode === 'merge')}
          onMouseLeave={(e) => handleButtonLeave(e, mode === 'merge')}
        >
          <Merge size={20} />
          Merge Files
        </button>*/}
      </div>
    </div>
  );
}