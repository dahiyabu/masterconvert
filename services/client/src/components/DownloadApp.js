import React, { useEffect, useState } from 'react';
import './DownloadApp.css';
import DownloadManager from './downloadManager';

const DownloadApp = ({ sessionId, customerEmail, planName, API_URL }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [downloadedPlatforms, setDownloadedPlatforms] = useState(new Set());
  const [licenseId, setLicenseId] = useState(null);

  useEffect(() => {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    let detected = null;
    if (platform.includes('win') || userAgent.includes('windows')) detected = 'windows';
    else if (platform.includes('mac') || userAgent.includes('macintosh')) detected = 'macos';
    else if (platform.includes('linux') || userAgent.includes('linux')) detected = 'linux';

    setDetectedPlatform(detected);

    // Check session storage for previous downloads
    const downloadSession = sessionStorage.getItem('convertmaster_download_session');
    if (downloadSession) {
      const session = JSON.parse(downloadSession);
      setHasDownloaded(session.hasDownloaded || false);
      setDownloadedPlatforms(new Set(session.downloadedPlatforms || []));
      setLicenseId(session.licenseId || null);
    }
    // Check server-side download status
    if (sessionId && customerEmail && planName) {
      checkDownloadStatus();
    }
  }, []);

  const goToHomepage = () => {
    window.location.href = '/';
  };

  const checkDownloadStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/check-download-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          email: customerEmail,
          plan: planName
        })
      });
      
      const result = await response.json();
      if (result.hasDownloaded) {
        setHasDownloaded(true);
        setDownloadedPlatforms(new Set(result.downloadedPlatforms || []));
        setLicenseId(result.licenseId);
      }
    } catch (error) {
      console.error('Error checking download status:', error);
    }
  };
  
  const handleWindowsDownload = () => {
    if (downloadedPlatforms.has('windows')) {
      setStatusMessage('You have already downloaded ConvertMaster for Windows. Use your existing download.');
      setStatusType('info');
      return;
    }
    setSelectedPlatform('windows');
    setDownloadPath('ConvertMaster-windows-Package.zip');
    setIsConfirmEnabled(true);
    setShowSaveModal(true);
  };

  const handleMacDownload = () => {
    if (downloadedPlatforms.has('macos')) {
      setStatusMessage('You have already downloaded ConvertMaster for MacOS. Use your existing download.');
      setStatusType('info');
      return;
    }
    setSelectedPlatform('macos');
    setDownloadPath('ConvertMaster-macos-Package.zip');
    setIsConfirmEnabled(true);
    setShowSaveModal(true);
  };

  const handleLinuxDownload = () => {
    if (downloadedPlatforms.has('linux')) {
      setStatusMessage('You have already downloaded ConvertMaster for Linux. Use your existing download.');
      setStatusType('info');
      return;
    }
    setSelectedPlatform('linux');
    setDownloadPath('ConvertMaster-linux-Package.zip');
    setIsConfirmEnabled(true);
    setShowSaveModal(true);
  };

  const handleQuickLocation = (location) => {
    const filename = `ConvertMaster-${selectedPlatform}-Package.zip`;
    setDownloadPath(`${location}/${filename}`);
    setIsConfirmEnabled(true);
  };

  
  const handleBrowse = useCallback(async () => {
    try {
      // Modern File System Access API (Chrome 86+, Edge 86+)
      if ('showDirectoryPicker' in window) {
        try {
          const directoryHandle = await window.showDirectoryPicker({
            mode: 'readwrite'
          });
          
          setDownloadPath(directoryHandle.name);
          setIsConfirmEnabled(true);
          return;
        } catch (fsError) {
          if (fsError.name !== 'AbortError') {
            console.warn('File System Access API failed:', fsError);
          }
          // Continue to fallback
        }
      }
      
      // Fallback: Directory picker using file input
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.style.display = 'none';
      
      // Add to DOM temporarily
      document.body.appendChild(input);
      
      const handleFileSelect = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
          const firstFile = files[0];
          let directoryPath = '';
          
          if (firstFile.webkitRelativePath) {
            // Extract directory name from path
            const pathParts = firstFile.webkitRelativePath.split('/');
            directoryPath = pathParts[0];
          } else {
            directoryPath = 'Selected Directory';
          }
          
          setDownloadPath(directoryPath);
          setIsConfirmEnabled(true);
        }
        
        // Clean up
        document.body.removeChild(input);
        input.removeEventListener('change', handleFileSelect);
      };
      
      const handleCancel = () => {
        // Clean up on cancel
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
        input.removeEventListener('change', handleFileSelect);
      };
      
      // Add event listeners
      input.addEventListener('change', handleFileSelect);
      input.addEventListener('cancel', handleCancel);
      
      // Trigger file picker
      input.click();
      
    } catch (error) {
      console.error('Error in directory selection:', error);
      // Final fallback - manual input with platform detection
      showManualPathInput();
    }
}, [downloadPath, setDownloadPath, setIsConfirmEnabled]);

// Helper function for manual path input
const showManualPathInput = useCallback(() => {
  const platform = getPlatformInfo();
  const userPath = window.prompt(
    `Please enter the full path where you want to save ConvertMaster:\n\nExample for ${platform.name}: ${platform.example}`,
    downloadPath || ''
  );
  
  if (userPath && userPath.trim()) {
    setDownloadPath(userPath.trim());
    setIsConfirmEnabled(true);
  }
}, [downloadPath, setDownloadPath, setIsConfirmEnabled]);

// Platform detection helper
const getPlatformInfo = useCallback(() => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (platform.includes('mac') || userAgent.includes('macintosh')) {
    return {
      name: 'macOS',
      example: '/Users/[your-username]/Downloads/ConvertMaster',
      separator: '/'
    };
  } else if (platform.includes('win') || userAgent.includes('windows')) {
    return {
      name: 'Windows',
      example: 'C:\\Users\\[your-username]\\Downloads\\ConvertMaster',
      separator: '\\'
    };
  } else {
    return {
      name: 'Linux',
      example: '/home/[your-username]/Downloads/ConvertMaster',
      separator: '/'
    };
  }
}, []);
  
  const handleConfirmDownload = async () => {
    if (!downloadPath.trim()) {
      setStatusMessage('Please select a save location');
      setStatusType('error');
      return;
    }

    setShowSaveModal(false);
    setIsDownloading(true);

    const onProgress = (percent) => setDownloadProgress(percent);
    const onStatus = (message, type) => {
      setStatusMessage(message);
      setStatusType(type);
    };

    try {
      const result = await DownloadManager.downloadPackage(selectedPlatform, downloadPath, onProgress, onStatus,licenseId,
      {
        sessionId,
        email: customerEmail,
        plan: planName,
        os: selectedPlatform
      });
      // Update download tracking
      const newDownloadedPlatforms = new Set([...downloadedPlatforms, selectedPlatform]);
      setDownloadedPlatforms(newDownloadedPlatforms);
      setHasDownloaded(true);
      setLicenseId(result.licenseId);

      // Save to session storage
      sessionStorage.setItem('convertmaster_download_session', JSON.stringify({
        hasDownloaded: true,
        downloadedPlatforms: Array.from(newDownloadedPlatforms),
        licenseId: result.licenseId,
        timestamp: Date.now()
      }));
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsDownloading(false);
    }
  };

  const closeModal = () => {
    setShowSaveModal(false);
    setSelectedPlatform(null);
    setDownloadPath('');
    setIsConfirmEnabled(false);
  };

  return (
    <div className="download-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content" onClick={goToHomepage}>
          <div className="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M16 16l-4 4-4-4h3V9h2v7h3zm-4-14a7 7 0 00-7 7c0 .19.01.38.03.57A5.507 5.507 0 000 15.5C0 18.537 2.463 21 5.5 21h13a5.5 5.5 0 100-11c-.279 0-.553.022-.821.064A7.002 7.002 0 0012 2z" />
            </svg>
          </div>
          <span className="brand-name">ConvertMaster</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-container">
        <div className="success-card">
          {/* Success Icon */}
          <div className="success-icon">
            <div className="checkmark-circle">
              <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="success-title">Thank You for Your Purchase!</h1>
          <p className="success-subtitle">
            Your payment has been processed successfully. Download ConvertMaster now and start converting your files with ease.
          </p>

          {/* Download Section */}
          <div className="download-section">
            <h2 className="download-title">Download ConvertMaster</h2>
            <p className="download-subtitle">Choose your platform below to download the software:</p>

            <div className="download-buttons">
              <button 
                className={`platform-button ${detectedPlatform === 'windows' ? 'recommended' : ''}`}
                onClick={handleWindowsDownload}
                disabled={isDownloading}
              >
                <div className="platform-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 3.5l9.5-1.4v8.9H1V3.5zm10.5-1.5L23 0v11h-11.5V2zM1 12h9.5v8.9L1 19.5V12zm10.5 0H23v11l-11.5-2.1V12z"/>
                  </svg>
                </div>
                <span>Download for Windows</span>
                {detectedPlatform === 'windows' && <span className="recommended-badge">Recommended</span>}
              </button>

              <button 
                className={`platform-button ${detectedPlatform === 'macos' ? 'recommended' : ''}`}
                onClick={handleMacDownload}
                disabled={isDownloading}
              >
                <div className="platform-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.365 1.43c0 1.14-.474 2.283-1.306 3.136-.87.88-2.018 1.39-3.11 1.32-.06-1.09.42-2.28 1.28-3.14.83-.84 2.14-1.42 3.14-1.32zm5.058 16.07c-.42.97-.88 1.87-1.47 2.72-.78 1.14-1.59 2.26-2.82 2.28-1.12.02-1.48-.73-2.98-.72s-1.9.73-2.96.74c-1.24.01-2.19-1.21-2.97-2.34-2.03-3-3.58-8.47-1.5-12.17.87-1.53 2.45-2.5 4.15-2.53 1.06-.02 2.07.74 2.97.74.87 0 2.26-.91 3.8-.77.65.03 2.47.27 3.63 2.05-3.2 1.75-2.67 6.31.05 7.97z"/>
                  </svg>
                </div>
                <span>Download for macOS</span>
                {detectedPlatform === 'macos' && <span className="recommended-badge">Recommended</span>}
              </button>

              <button 
                className={`platform-button ${detectedPlatform === 'linux' ? 'recommended' : ''}`}
                onClick={handleLinuxDownload}
                disabled={isDownloading}
              >
                <div className="platform-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0a12 12 0 1012 12A12.013 12.013 0 0012 0zm0 22.093a10.093 10.093 0 1110.093-10.093A10.105 10.105 0 0112 22.093zm0-13.343a3.25 3.25 0 103.25 3.25 3.254 3.254 0 00-3.25-3.25z"/>
                  </svg>
                </div>
                <span>Download for Linux</span>
                {detectedPlatform === 'linux' && <span className="recommended-badge">Recommended</span>}
              </button>
            </div>

            {/* Status Messages */}
            {statusMessage && (
              <div className={`status-message ${statusType}`}>
                {statusMessage}
              </div>
            )}

            {/* Progress Bar */}
            {downloadProgress > 0 && (
              <div className="progress-container">
                <div className="progress-header">
                  <span>Download Progress</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Info Sections */}
          <div className="info-sections">
            <div className="info-card">
              <div className="info-header">
                <span className="info-icon">📋</span>
                <h3>What's Included</h3>
              </div>
              <ul className="info-list">
                <li>Complete ConvertMaster software package</li>
                <li>Installation instructions included in the zip file</li>
                <li>Pre-configured license.lic file for instant activation</li>
                <li>Simply extract and run - no additional setup required!</li>
              </ul>
            </div>

            <div className="info-card">
              <div className="info-header">
                <span className="info-icon">🔑</span>
                <h3>License & Updates</h3>
              </div>
              <div className="info-content">
                <p>Your license.lic file is included in the download package and contains all necessary activation data.</p>
                <p>Your subscription includes free updates and premium support based on your chosen plan (monthly or yearly).</p>
                <p><strong>Important:</strong> Keep the license.lic file in the same directory as the ConvertMaster executable.</p>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="support-section">
            <p>Need help? Our support team is here to assist you!</p>
            <a href="/#contact" className="support-button">Contact Support</a>
          </div>
        </div>
      </div>

      {/* Save Location Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Save Location</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">Select where to save your ConvertMaster package:</p>
              
              <div className="file-input-container">
                <input
                  type="text"
                  value={downloadPath}
                  onChange={(e) => {
                    setDownloadPath(e.target.value);
                    setIsConfirmEnabled(e.target.value.trim().length > 0);
                  }}
                  className="file-input"
                  placeholder="Enter filename..."
                />
                <button className="browse-button" onClick={handleBrowse}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  Browse
                </button>
              </div>

              <div className="quick-locations">
                <p className="quick-title">Quick locations:</p>
                <div className="quick-buttons">
                  <button className="quick-button" onClick={() => handleQuickLocation('Downloads')}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10,9 9,9 8,9" />
                    </svg>
                    Downloads
                  </button>
                  <button className="quick-button" onClick={() => handleQuickLocation('Desktop')}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    Desktop
                  </button>
                  <button className="quick-button" onClick={() => handleQuickLocation('Documents')}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    Documents
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={closeModal}>
                Cancel
              </button>
              <button 
                className="confirm-button" 
                onClick={handleConfirmDownload}
                disabled={!isConfirmEnabled}
              >
                Start Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadApp;