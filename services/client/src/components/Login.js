import React, { useEffect, useState, useCallback } from 'react';
import { X, Mail, Key, AlertCircle, Loader2 } from 'lucide-react';
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export default function LoginPopup({ isOpen, onClose, onSuccess, API_URL }) {
  const [email, setEmail] = useState('');
  const [licenseId, setLicenseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fingerprint, setFingerprint] = useState(null);

  // Initialize FingerprintJS and get the fingerprint
  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setFingerprint(result.visitorId);  // Store the fingerprint
    };

    getFingerprint();
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/validateUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          licenseId,
          fingerprint
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError('Invalid credentials. Please check your email and license ID.');
      }
    } catch (err) {
      setError('Connection error. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  }, [fingerprint, email, licenseId, API_URL, onSuccess, onClose]);

  const handleRetry = () => {
    setError('');
    setEmail('');
    setLicenseId('');
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    backdropFilter: 'blur(4px)'
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    overflow: 'hidden'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    letterSpacing: '-0.025em'
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const inputContainerStyle = {
    marginBottom: '24px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    letterSpacing: '0.025em'
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#1f2937',
    backgroundColor: '#fafafa',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const inputFocusStyle = {
    borderColor: '#4f46e5',
    backgroundColor: 'white',
    boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)'
  };

  const buttonStyle = {
    width: '100%',
    padding: '18px 24px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    letterSpacing: '0.025em'
  };

  const buttonHoverStyle = {
    backgroundColor: '#4338ca',
    transform: 'translateY(-1px)',
    boxShadow: '0 8px 25px -8px rgba(79, 70, 229, 0.4)'
  };

  const buttonDisabledStyle = {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none'
  };

  const errorStyle = {
    marginBottom: '24px',
    padding: '16px 20px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '16px',
    color: '#dc2626'
  };

  const errorHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontWeight: '600'
  };

  const errorActionsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  };

  const errorButtonStyle = {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const footerStyle = {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center'
  };

  const footerTextStyle = {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: 0
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ padding: '40px' }}>
          <div style={headerStyle}>
            <h2 style={titleStyle}>Access Pro Portal</h2>
            <button 
              onClick={onClose}
              style={closeButtonStyle}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6b7280';
              }}
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div style={errorStyle}>
              <div style={errorHeaderStyle}>
                <AlertCircle size={20} />
                <span>Login Failed</span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>{error}</p>
              <div style={errorActionsStyle}>
                <button
                  onClick={handleRetry}
                  style={{
                    ...errorButtonStyle,
                    backgroundColor: '#fee2e2',
                    color: '#dc2626'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fecaca'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fee2e2'}
                >
                  Try Again
                </button>
                <button
                  onClick={() => {handleRetry();onClose(); window.location.hash = '#contact'}}
                  style={{
                    ...errorButtonStyle,
                    backgroundColor: '#f3f4f6',
                    color: '#374151'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={inputContainerStyle}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="Enter your email"
                required
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.backgroundColor = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={inputContainerStyle}>
              <label style={labelStyle}>License ID</label>
              <input
                type="text"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                style={inputStyle}
                placeholder="Enter your license ID"
                required
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.backgroundColor = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...buttonStyle,
                ...(isLoading ? buttonDisabledStyle : {})
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  Object.assign(e.target.style, buttonHoverStyle);
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#4f46e5';
                  e.target.style.transform = 'none';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                'Access Pro Portal'
              )}
            </button>
          </form>

          <div style={footerStyle}>
            <p style={footerTextStyle}>
              Enter the email and license ID used during your purchase to access premium features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}