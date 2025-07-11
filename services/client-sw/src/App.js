import React from 'react';
import FileConvertApp from './FileConvert'; // adjust if needed

function App() {
  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        backgroundColor: '#fff',
        zIndex: 1000,
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
        padding: '1rem 2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* Purple icon box with white cloud download icon */}
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#4F46E5',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              fill="white" viewBox="0 0 24 24">
              <path d="M16 16l-4 4-4-4h3V9h2v7h3zm-4-14a7 7 0 00-7 7c0 .19.01.38.03.57A5.507 5.507 0 000 15.5C0 18.537 2.463 21 5.5 21h13a5.5 5.5 0 100-11c-.279 0-.553.022-.821.064A7.002 7.002 0 0012 2z" />
            </svg>
          </div>

          {/* Brand text */}
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#4F46E5'
          }}>
            ExtConvert
          </span>
        </div>
      </header>

      {/* Push content below fixed header */}
      <div style={{ paddingTop: '80px' }}>
        <FileConvertApp />
      </div>
    </>
  );
}

export default App;