import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Download, 
  Mail, 
  CreditCard, 
  Home, 
  RefreshCw,
  Shield,
  Zap,
  Star,
  AlertCircle
} from 'lucide-react';

const CheckoutResultPage = ({ API_URL }) => {
  const [status, setStatus] = useState('loading');
  const [sessionId, setSessionId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [planName, setPlanName] = useState('');
  const [amount, setAmount] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdParam = urlParams.get('session_id');
    const emailParam = urlParams.get('email');
    const planParam = urlParams.get('plan');
    const successParam = urlParams.get('success');
    const canceledParam = urlParams.get('canceled');
    
    if (successParam === 'true' || sessionIdParam) {
      setSessionId(sessionIdParam || '');
      setCustomerEmail(emailParam || '');
      setPlanName(planParam || '');
      
      // Verify payment before showing success
      if (emailParam && planParam) {
        verifyPayment(emailParam, planParam, sessionIdParam);
      } else {
        // Fallback to fetch session details if email/plan not in URL
        fetchSessionDetails(sessionIdParam);
      }
    } else if (canceledParam === 'true') {
      setStatus('canceled');
    } else {
      // Default to canceled if no clear success indicator
      setStatus('canceled');
    }
  }, []);

  const verifyPayment = async (email, plan, sessionId) => {
    setIsVerifying(true);
    setVerificationError('');
    try {
      const response = await fetch(`${API_URL}/verifypayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          plan: plan,
          session_id: sessionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_status=='success') {
          setStatus('success');
          // Update with verified data
          setCustomerEmail(data.customer_email || email);
          setPlanName(data.plan_name || plan);
          setAmount(data.amount || '');
        } else {
          setStatus('verification_failed');
          setVerificationError(data.message || 'Payment verification failed');
        }
      } else {
        setStatus('verification_failed');
        setVerificationError('Unable to verify payment. Please contact support.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('verification_failed');
      setVerificationError('Network error during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      // Optional: Fetch session details from your backend
      const response = await fetch(`${API_URL}/checkout-session/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const email = data.customer_email || '';
        const plan = data.plan_name || '';
        
        setCustomerEmail(email);
        setPlanName(plan);
        setAmount(data.amount || '');
        
        // Verify payment with fetched details
        if (email && plan) {
          verifyPayment(email, plan, sessionId);
        } else {
          setStatus('verification_failed'); // Fallback if verification data unavailable
        }
      } else {
        setStatus('verification_failed'); // Fallback if session fetch fails
      }
    } catch (error) {
      console.log('Could not fetch session details:', error);
      setStatus('verification_failed'); // Fallback if session fetch fails
    }
  };

  const handleRetryCheckout = () => {
    window.location.href = '/pricing'; // Redirect back to pricing page
  };

  const handleGoHome = () => {
    window.location.href = '/'; // Redirect to home page
  };

  const handleDownloadApp = () => {
    // Navigate to download.html with plan and email parameters
    const params = new URLSearchParams({
      plan: planName,
      email: customerEmail
    });
    navigate(`/downloadapp?${params.toString()}`);
    //window.location.href = `/download.html?${params.toString()}`;
  };

  // Fixed function to handle Start Free Trial
  const handleStartFreeTrial = () => {
    // Navigate to home page first, then dispatch the event after a delay
    window.location.href = '/';
    
    // Alternative approach: Use window.history to navigate and then dispatch event
    // This ensures we're on the main app page before dispatching the event
    setTimeout(() => {
      const event = new Event('open-free-plan');
      window.dispatchEvent(event);
    }, 500);
  };

  const handleRetryVerification = () => {
    if (customerEmail && planName && sessionId) {
      verifyPayment(customerEmail, planName, sessionId);
    }
  };

  // Check if download button should be shown (not for daily plan)
  const shouldShowDownloadButton = () => {
    const plan = planName.toLowerCase();
    return plan !== 'daily' && plan !== 'day';
  };

  // Verification failed state
  if (status === 'verification_failed') {
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
              disabled={isVerifying}
              style={{
                padding: '1rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: isVerifying ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                color: 'white',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
              }}
            >
              <RefreshCw size={18} />
              {isVerifying ? 'Verifying...' : 'Retry Verification'}
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

  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          textAlign: 'center'
        }}>
          {/* Success Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '6rem',
              height: '6rem',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)',
              animation: 'bounce 0.6s ease-in-out'
            }}>
              <CheckCircle size={48} color="white" />
            </div>
          </div>

          {/* Success Message */}
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: '#065f46',
            marginBottom: '1rem',
            lineHeight: '1.1'
          }}>
            Payment Successful!
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: '#047857',
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            Welcome to ConvertMaster Premium! Your subscription is now active and ready to use.
          </p>

          {/* Order Details Card */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '2px solid #bbf7d0'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <CreditCard size={24} color="#10b981" />
              Order Confirmation
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              textAlign: 'left'
            }}>
              {sessionId && (
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>ORDER ID</div>
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

              {amount && (
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>AMOUNT</div>
                  <div style={{
                    fontSize: '1.25rem',
                    color: '#10b981',
                    fontWeight: '700'
                  }}>${amount}</div>
                </div>
              )}
            </div>

            {/* Email Confirmation Notice */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#f0f9ff',
              borderRadius: '0.75rem',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Mail size={20} color="#0369a1" />
              <span style={{
                fontSize: '0.875rem',
                color: '#0c4a6e'
              }}>
                A confirmation email with your receipt and download instructions has been sent to your email address.
              </span>
            </div>
          </div>

          {/* Next Steps */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>What's Next?</h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {shouldShowDownloadButton() && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: '0'
                  }}>
                    <Download size={16} color="white" />
                  </div>
                  <div>
                    <h4 style={{
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.5rem'
                    }}>Download the App</h4>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}>
                      Download the desktop app for offline processing and advanced features.
                    </p>
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: '0'
                }}>
                  <Zap size={16} color="white" />
                </div>
                <div>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}>Start Converting</h4>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    Begin using unlimited conversions and premium features right away.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: '0'
                }}>
                  <Shield size={16} color="white" />
                </div>
                <div>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}>Premium Support</h4>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    Get priority support and help whenever you need it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: shouldShowDownloadButton() ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr',
            gap: '1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {shouldShowDownloadButton() && (
              <button
                onClick={handleDownloadApp}
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                }}
              >
                <Download size={18} />
                Download App
              </button>
            )}

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
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '4rem 1.5rem',
          textAlign: 'center'
        }}>
          {/* Cancel Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '6rem',
              height: '6rem',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)'
            }}>
              <XCircle size={48} color="white" />
            </div>
          </div>

          {/* Cancel Message */}
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: '#991b1b',
            marginBottom: '1rem',
            lineHeight: '1.1'
          }}>
            Payment Canceled
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: '#dc2626',
            marginBottom: '3rem',
            lineHeight: '1.6'
          }}>
            No worries! Your payment was canceled and you haven't been charged.
          </p>

          {/* Information Card */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '2px solid #fecaca'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1.5rem'
            }}>
              What Happened?
            </h3>

            <div style={{
              textAlign: 'left',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              <p style={{ marginBottom: '1rem' }}>
                Your payment process was interrupted or canceled. This could happen for several reasons:
              </p>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#ef4444',
                    borderRadius: '50%'
                  }} />
                  You decided to review your purchase
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#ef4444',
                    borderRadius: '50%'
                  }} />
                  Browser or connection issues occurred
                </li>
                <li style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#ef4444',
                    borderRadius: '50%'
                  }} />
                  You want to compare with other options
                </li>
              </ul>
            </div>

            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#f0f9ff',
              borderRadius: '0.75rem',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Shield size={20} color="#0369a1" />
              <span style={{
                fontSize: '0.875rem',
                color: '#0c4a6e'
              }}>
                Your information is secure and no charges were made to your account.
              </span>
            </div>
          </div>

          {/* Free Trial Offer */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '3rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        border: '2px solid #dbeafe'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          marginBottom: '1rem'
                        }}>
                          <Star size={24} color="#3b82f6" fill="#3b82f6" />
                          <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0'
                          }}>
                            Try ConvertMaster Free
                          </h3>
                        </div>
                        <p style={{
                          color: '#6b7280',
                          marginBottom: '1.5rem',
                          lineHeight: '1.6'
                        }}>
                          Not ready to commit? Start with our free plan and experience the power of ConvertMaster with no strings attached.
                        </p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>✓ 5 conversions per day</span>
                          <span style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>✓ 200+ file formats</span>
                          <span style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>✓ No credit card required</span>
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
                          onClick={handleRetryCheckout}
                          style={{
                            padding: '1rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.6)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                          }}
                        >
                          <RefreshCw size={18} />
                          Try Again
                        </button>
            
                        <button
                          onClick={handleStartFreeTrial}
                          style={{
                            padding: '1rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: '2px solid #10b981',
                            background: 'white',
                            color: '#10b981',
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
                            e.target.style.background = '#10b981';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.color = '#10b981';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          <Star size={18} />
                          Start Free Trial
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
            
                    <style>{`
                      @keyframes bounce {
                        0%, 20%, 53%, 80%, 100% {
                          transform: translate3d(0,0,0);
                        }
                        40%, 43% {
                          transform: translate3d(0, -30px, 0);
                        }
                        70% {
                          transform: translate3d(0, -15px, 0);
                        }
                        90% {
                          transform: translate3d(0, -4px, 0);
                        }
                      }
                    `}</style>
                  </div>
                );
              }
            
              // Loading state
              return (
                <div style={{
                  minHeight: '100vh',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 50%, #e0e7ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '4rem',
                      height: '4rem',
                      border: '4px solid #e5e7eb',
                      borderTop: '4px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 2rem auto'
                    }} />
                    <p style={{
                      fontSize: '1.25rem',
                      color: '#6b7280'
                    }}>Processing your request...</p>
                  </div>
            
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              );
            };
            
            export default CheckoutResultPage;