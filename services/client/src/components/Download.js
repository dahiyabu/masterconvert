import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle, Loader2, Sparkles, Shield, Zap, Users, Star, ArrowRight, X, FolderOpen, Monitor, Laptop, Smartphone, RefreshCw, Home, Clock, Gift, Crown } from 'lucide-react';
import DownloadApp from './DownloadApp';

const DownloadPage = ({API_URL}) => {
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [planDetails, setPlanDetails] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savePath, setSavePath] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [sessionId, setSessionId] = useState('');
  const [planName, setPlanName] = useState('');
  const [period, setPeriod] = useState('');
  const [planType, setPlanType] = useState('');
  const [verificationError, setVerificationError] = useState('');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    const planType = urlParams.get('planType');
    const email = urlParams.get('email');
    let period = urlParams.get('period');
    
    if (!plan || !email || !planType) {
      setVerificationStatus('failed');
      setVerificationError('Plan or Email or PlanType are missing')
      return;
    }
    if (!period) {
      period = 'lifetime';
    }
    setPlanName(plan);
    setPlanType(planType);
    setCustomerEmail(email);
    setPeriod(period);
    verifyPayment(plan, planType, email);
  }, []);

  const verifyPayment = async (plan, plan_type,email) => {
    try {
      const response = await fetch(`${API_URL}/verifypayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, plan_type, email }),
      });

      const result = await response.json();
      if (result.payment_status=='success') {
      //if(true){
        setPlanDetails({
          name: plan,
          duration: plan === 'yearly' ? 365 : 30,
          displayName: plan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'
        });
        setSessionId(result.session_id)
        setVerificationStatus('success');
      } else {
        setVerificationStatus('failed');
        setVerificationError('Cannot Verify You Payment. Contact Support');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('failed');
      setVerificationError('Cannot Verify You Payment. Contact Support');
    }
  };

  const generateLicense = async (durationInDays) => {
    try {
      const response = await fetch(`${API_URL}/generateLicense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          platform: 'web',
          duration: durationInDays * 24 * 60 * 60,
          email: customerEmail,
          plan: planDetails.name
        })
      });

      if (!response.ok) {
        throw new Error(`License generation failed: ${response.status}`);
      }

      const licenseJson = await response.json();
      return licenseJson.key;
    } catch (error) {
      console.error('License generation error:', error);
      return `DEMO_LICENSE_${Date.now()}_${planDetails.name.toUpperCase()}`;
    }
  };

  const downloadSoftware = async (platform) => {
    const s3Keys = {
      windows: 'software/windows/extconvert.exe',
      macos: 'software/macos/extconvert',
      linux: 'software/linux/extconvert'
    };
  
    try {
      // Step 1: Get presigned URL from backend
      const res = await fetch(`${API_URL}/api/get-download-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: s3Keys[platform] })
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to get download link');
      }
  
      // Step 2: Fetch the file using the presigned URL
      const fileRes = await fetch(data.url);
      if (!fileRes.ok) throw new Error('Failed to fetch file');
  
      const blob = await fileRes.blob();
      return blob;
    } catch (error) {
      console.error('Software download error:', error);
      return new Blob(
        [`Demo ${platform} software - ${new Date().toISOString()}`],
        { type: 'application/octet-stream' }
      );
    }
  };
  
  const createPackage = async (licenseData, softwareBlob, platform) => {
    const JSZip = window.JSZip;
    const zip = new JSZip();
    
    zip.file('license.lic', licenseData);
    
    const extensions = {
      windows: '.exe',
      macos: '.dmg', 
      linux: '.AppImage'
    };
    
    const softwareFileName = `ExtConvert-${platform}${extensions[platform]}`;
    zip.file(softwareFileName, softwareBlob);
    
    const readmeContent = `ExtConvert ${platform.charAt(0).toUpperCase() + platform.slice(1)} Package

Installation Instructions:
1. Extract this package to your desired location
2. The license.lic file must remain in the same directory as the software
3. Run the ExtConvert executable

License: ${planDetails.displayName} - Valid for ${planDetails.duration} days
Email: ${customerEmail}
Generated: ${new Date().toISOString()}
Platform: ${platform}
`;
    
    zip.file('README.txt', readmeContent);
    return await zip.generateAsync({ type: 'blob' });
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    setSavePath(`ExtConvert-${platform}-Package.zip`);
    setShowModal(true);
  };

  const handleDownloadConfirm = async () => {
    if (!savePath || !selectedPlatform) return;

    setShowModal(false);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Generating license...');

    try {
      setDownloadProgress(20);
      const licenseData = await generateLicense(planDetails.duration);
      
      setDownloadStatus('Downloading software...');
      setDownloadProgress(50);
      const softwareBlob = await downloadSoftware(selectedPlatform);
      
      setDownloadStatus('Creating package...');
      setDownloadProgress(80);
      const packageBlob = await createPackage(licenseData, softwareBlob, selectedPlatform);
      
      setDownloadStatus('Starting download...');
      setDownloadProgress(100);
      
      const filename = savePath.endsWith('.zip') ? savePath : `${savePath}.zip`;
      downloadBlob(packageBlob, filename);
      
      setDownloadStatus('Download completed successfully!');
      
      setTimeout(() => {
        setDownloadProgress(0);
        setDownloadStatus('');
        setIsDownloading(false);
      }, 3000);

    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus(`Error: ${error.message}`);
      setDownloadProgress(0);
      setIsDownloading(false);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/'; // Redirect to home page
  };

  const handleRetryVerification = () => {
    if (customerEmail && planName && planType && sessionId) {
      verifyPayment(customerEmail, planName, planType, sessionId);
    }
  };

  const goToHomepage = () => {
    window.location.href = '/';
  };

  const retryVerification = () => {
    window.location.reload();
  };

  const platforms = [
    {
      id: 'windows',
      name: 'Windows',
      icon: Monitor,
      description: 'Windows 10/11 (64-bit)',
      details: 'Supports all Windows editions'
    },
    {
      id: 'macos',
      name: 'macOS',
      icon: Laptop,
      description: 'macOS 10.15+ (Intel & Apple Silicon)',
      details: 'Universal binary included'
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: Smartphone,
      description: 'Ubuntu 18.04+ (AppImage)',
      details: 'Works on most Linux distributions'
    }
  ];

  // Verification Loading State
  if (verificationStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-12 max-w-2xl w-full backdrop-blur-sm bg-white/90">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Verifying Payment
            </h1>
            <p className="text-slate-600 text-lg mb-8">
              Please wait while we verify your purchase...
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800 font-medium">
                  This usually takes just a few seconds
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Customer Email</p>
                <p className="text-slate-800 font-medium truncate">{customerEmail || 'Loading...'}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Plan Status</p>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-slate-800 font-medium">Verifying...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment Verification Failed State
  if (verificationStatus === 'failed') {
        return (
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fde68a 100%)'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              padding: '4rem 1.5rem',
              textAlign: 'center'
            }}>
              {/* Warning Icon */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  width: '6rem',
                  height: '6rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)'
                }}>
                  <AlertCircle size={48} color="white" />
                </div>
              </div>
    
              {/* Verification Failed Message */}
              <h1 style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: '#92400e',
                marginBottom: '1rem',
                lineHeight: '1.1'
              }}>
                Payment Verification Required
              </h1>
    
              <p style={{
                fontSize: '1.25rem',
                color: '#a16207',
                marginBottom: '3rem',
                lineHeight: '1.6'
              }}>
                We need to verify your payment before proceeding.
              </p>
    
              {/* Error Details Card */}
              <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                marginBottom: '3rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '2px solid #fde68a'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Verification Details
                </h3>
    
                {verificationError && (
                  <div style={{
                    padding: '1rem',
                    background: '#fef2f2',
                    borderRadius: '0.75rem',
                    border: '1px solid #fecaca',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{
                      color: '#dc2626',
                      fontSize: '0.875rem',
                      margin: '0'
                    }}>
                      {verificationError}
                    </p>
                  </div>
                )}
    
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.5rem',
                  textAlign: 'left'
                }}>
                  {customerEmail && (
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>EMAIL</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{customerEmail}</div>
                    </div>
                  )}
    
                  {planName && (
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>PLAN</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827'
                      }}>{planName}</div>
                    </div>
                  )}
    
                  {sessionId && (
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>SESSION ID</div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#111827',
                        fontFamily: 'monospace',
                        background: '#f3f4f6',
                        padding: '0.5rem',
                        borderRadius: '0.5rem'
                      }}>
                        {sessionId.substring(0, 20)}...
                      </div>
                    </div>
                  )}
                </div>
              </div>
    
              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                <button
                  onClick={handleRetryVerification}
                  disabled={verificationStatus=='verifying'}
                  style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    background: verificationStatus=='verifying' ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: verificationStatus == 'verifying' ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <RefreshCw size={18} />
                  {verificationStatus=='verfying' ? 'Verifying...' : 'Retry Verification'}
                </button>
    
                <button
                  onClick={handleGoHome}
                  style={{
                    padding: '1rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#9ca3af';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <Home size={18} />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        );
      }
  // Success State - Download Page
  return (
    <DownloadApp 
      sessionId={sessionId}
      customerEmail={customerEmail}
      planName={planName}
      period={period}
      API_URL={API_URL}
    />
  );
};

export default DownloadPage;