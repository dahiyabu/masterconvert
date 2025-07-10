import React, { useState, useEffect} from 'react';
import { Check, Star, Zap, Shield, Download, Globe, Smartphone, X, Mail, CreditCard, ArrowLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const PricingPage = ({ isMobile, API_URL }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const [fingerprint, setFingerprint] = useState(null);
  const [activeTab, setActiveTab] = useState('Online');

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      type: 'Online',
      description: 'Perfect for occasional users',
      originalPrice: null,
      currentPrice: '$0',
      period: 'Forever free',
      discount: null,
      features: [
        '3 conversions/merges per day',
        '200+ file format support',
        'Advanced compression',
        'Password encryption',
        'Online processing',
        'Delete File every hour',
        'Basic customer support'
      ],
      buttonText: 'Get Started Free',
      buttonStyle: 'outline',
      popular: false
    },
    {
      id: 'daily',
      name: 'Daily Plan',
      type: 'Online',
      description: 'Infrequent users',
      originalPrice: '$0.99',
      currentPrice: '$0.49',
      period: 'per day',
      discount: 'Save 50%',
      features: [
        'Unlimited conversions & merges',
        '200+ file formats supported',
        'Online processing',
        'Advanced compression & encryption',
        'Batch processing',
        'Delete File every hour',
        'Premium customer support',
        'No advertisements',
        'Free Upgrades'
      ],
      buttonText: 'Get Daily Plan',
      buttonStyle: 'secondary',
      popular: false
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      type: 'Online',
      description: 'Maximum savings for power users',
      originalPrice: '$59.99',
      currentPrice: '$29.99',
      period: 'per year',
      discount: 'Save 50%',
      features: [
        'Unlimited conversions & merges',
        '200+ file formats supported',
        'Online local processing',
        'Advanced compression & encryption',
        'Batch processing',
        'Delete File every hour',
        'Premium customer support',
        'No advertisements',
        'Free Upgrades'
      ],
      buttonText: 'Get Yearly Plan',
      buttonStyle: 'primary',
      popular: true
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      type: 'Online',
      description: 'Best value for regular users',
      originalPrice: '$9.99',
      currentPrice: '$4.99',
      period: 'per month',
      discount: 'Save 50%',
      features: [
        'Unlimited conversions & merges',
        '200+ file formats supported',
        'Online processing',
        'Advanced compression & encryption',
        'Batch processing',
        'Delete File every hour',
        'Priority customer support',
        'No advertisements',
        'Free Upgrades'
      ],
      buttonText: 'Start Monthly Plan',
      buttonStyle: 'secondary',
      popular: false
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      type: 'Offline',
      description: 'Best value for regular users',
      originalPrice: '$6.99',
      currentPrice: '$3.99',
      period: 'per month',
      discount: 'Save 43%',
      features: [
        'Unlimited conversions & merges',
        '200+ file formats supported',
        'Desktop app download',
        'Offline local processing',
        'Advanced compression & encryption',
        'Batch processing',
        'Priority customer support',
        'No advertisements',
        'Free Upgrades'
      ],
      buttonText: 'Start Monthly Plan',
      buttonStyle: 'secondary',
      popular: false
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      type: 'Offline',
      description: 'Maximum savings for power users',
      originalPrice: '$49.99',
      currentPrice: '$24.99',
      period: 'per year',
      discount: 'Save 50%',
      features: [
        'Unlimited conversions & merges',
        '200+ file formats supported',
        'Desktop app download',
        'Offline local processing',
        'Advanced compression & encryption',
        'Batch processing',
        'Premium customer support',
        'No advertisements',
        'Free Upgrades'
      ],
      buttonText: 'Get Yearly Plan',
      buttonStyle: 'primary',
      popular: true
    }
  ];

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace('#', ''));
      if (element) {
        // Timeout ensures DOM is rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 0);
      }
    }
  }, [location]);
  
  // Initialize FingerprintJS and get the fingerprint
  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setFingerprint(result.visitorId);  // Store the fingerprint
    };

    getFingerprint();
  }, []);
  
  const getFilteredPlans = () => {
    return plans.filter(plan => plan.type === activeTab);
  };

  const handlePlanSelect = (plan) => {
    if (plan.id === 'free') {
      const event = new Event('open-free-plan');
      window.dispatchEvent(event);
    } else {
      setSelectedPlan(plan);
      setShowPopup(true);
      setEmail('');
      setError('');
    }
  };

  const handleCheckout = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!fingerprint) {
      setError('Please retry, internal error');
    }
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: selectedPlan.id, plan_type: selectedPlan.type, fingerprint: fingerprint }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedPlan(null);
    setEmail('');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 50%, #e0e7ff 100%)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 1.5rem'
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '4rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              padding: '0.75rem',
              borderRadius: '1rem'
            }}>
              <Zap size={32} color="white" />
            </div>
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1.5rem',
            lineHeight: '1.1'
          }}>Choose Your Plan</h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            maxWidth: '32rem',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Transform your files with professional-grade tools. Convert, merge, and compress with complete security and privacy.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '0.5rem',
            display: 'flex',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            {['Online', 'Offline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  background: activeTab === tab 
                    ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                    : 'transparent',
                  color: activeTab === tab ? 'white' : '#6b7280',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab) {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#6b7280';
                  }
                }}
              >
                {tab === 'Online' ? '🌐 Online Plans' : '💻 Offline Plans'}
              </button>
            ))}
          </div>
        </div>
        {/* Pricing Grid */}
        <div style={{
          width: '100%',
          padding: '2rem 0', // Add vertical padding to prevent cut-off
          overflow: 'visible'
        }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: isMobile?'wrap':'nowrap', 
          gap: '2rem',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '0 2rem',
          margin: '0 auto',
          overflow: 'visible'
        }}>
          {getFilteredPlans().map((plan) => (
            <div
              key={plan.id}
              style={{
                width: '300px',
                flex: '0 0 300px',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                background: plan.popular ? 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)' : 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                transition: 'all 0.3s ease',
                border: plan.popular ? '2px solid #60a5fa' : '2px solid #e5e7eb',
                boxShadow: plan.popular ? '0 20px 40px rgba(59, 130, 246, 0.2)' : '0 10px 25px rgba(0, 0, 0, 0.1)',
                transform: plan.popular ? 'scale(1.05)' : hoveredCard === plan.id ? 'translateY(-8px) scale(1.02)' : 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredCard(plan.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
                }}>
                  <Star size={16} fill="currentColor" />
                  MOST POPULAR
                </div>
              )}

              {/* Plan Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '0.75rem'
                }}>{plan.name}</h3>
                <p style={{
                  color: '#6b7280',
                  marginBottom: '1.5rem'
                }}>{plan.description}</p>
                
                {/* Pricing */}
                <div style={{ marginBottom: '1.5rem' }}>
                  {plan.originalPrice && (
                    <div style={{
                      fontSize: '1.125rem',
                      color: '#9ca3af',
                      textDecoration: 'line-through',
                      marginBottom: '0.5rem'
                    }}>
                      {plan.originalPrice}{plan.id === 'daily' ? ' per day' : (plan.id === 'monthly' ? ' per month' : ' per year')}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '3rem',
                      fontWeight: '700',
                      color: '#111827'
                    }}>{plan.currentPrice}</span>
                    <span style={{
                      color: '#6b7280',
                      fontSize: '1.125rem'
                    }}>{plan.period}</span>
                  </div>
                  {plan.discount && (
                    <div style={{
                      display: 'inline-block',
                      marginTop: '0.75rem',
                      background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                      color: 'white',
                      padding: '0.25rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {plan.discount}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Features List */}
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0 0 2rem 0',
                flexgrow: 1
              }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      flexShrink: '0',
                      width: '1.5rem',
                      height: '1.5rem',
                      background: '#dcfce7',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '0.125rem'
                    }}>
                      <Check size={16} color="#16a34a" />
                    </div>
                    <span style={{
                      color: '#374151',
                      lineHeight: '1.6'
                    }}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: '600',
                  fontSize: '1.125rem',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: plan.buttonStyle === 'primary' 
                    ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                    : plan.buttonStyle === 'secondary'
                    ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                    : 'transparent',
                  color: plan.buttonStyle === 'outline' ? '#374151' : 'white',
                  boxShadow: plan.buttonStyle === 'primary'
                    ? '0 8px 25px rgba(59, 130, 246, 0.4)'
                    : plan.buttonStyle === 'secondary'
                    ? '0 8px 25px rgba(139, 92, 246, 0.4)'
                    : 'none',
                  ...(plan.buttonStyle === 'outline' && {
                    border: '2px solid #d1d5db'
                  })
                }}
                onClick={() => handlePlanSelect(plan)}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div style={{ marginTop: '5rem', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '3rem'
          }}>
            Why Choose ConvertMaster?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            maxWidth: '80rem',
            margin: '0 auto'
          }}>
            {[
              { icon: Shield, title: '100% Secure', text: 'All processing happens locally on your device', color: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
              { icon: Download, title: 'Offline Ready', text: 'Works without internet connection', color: 'linear-gradient(135deg, #8b5cf6, #6366f1)' },
              { icon: Globe, title: '200+ Formats', text: 'Support for all major file types', color: 'linear-gradient(135deg, #10b981, #34d399)' },
              { icon: Smartphone, title: 'Cross-Platform', text: 'Available on Windows, Mac, and Web', color: 'linear-gradient(135deg, #f97316, #ef4444)' }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                transition: 'box-shadow 0.3s ease'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  background: feature.color
                }}>
                  <feature.icon size={24} color="white" />
                </div>
                <h3 style={{
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.5rem'
                }}>{feature.title}</h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>{feature.text}</p>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Trust Section */}
        {/*<div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            maxWidth: '48rem',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} color="#fbbf24" fill="#fbbf24" />
                ))}
              </div>
              <span style={{
                color: '#6b7280',
                fontWeight: '500'
              }}></span>
            </div>
            <p style={{
              fontSize: '1.25rem',
              color: '#374151',
              fontStyle: 'italic',
              lineHeight: '1.6'
            }}>
              "ConvertMaster has completely transformed how I handle file conversions. The offline capability gives me peace of mind for sensitive documents."
            </p>
            <p style={{
              color: '#6b7280',
              marginTop: '0.75rem',
              fontWeight: '500'
            }}>- Sarah Chen, Digital Marketing Manager</p>
          </div>
        </div>
        */}
      </div>
      {/* Checkout Popup */}
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '100%',
            position: 'relative',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {/* Close Button */}
            <button
              onClick={closePopup}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <X size={24} color="#6b7280" />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: selectedPlan?.buttonStyle === 'primary' 
                  ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                  : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto'
              }}>
                <CreditCard size={24} color="white" />
              </div>
              <h2 style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>Complete Your Purchase</h2>
              <p style={{
                color: '#6b7280',
                fontSize: '1.125rem'
              }}>
                {selectedPlan?.name} - {selectedPlan?.currentPrice} {selectedPlan?.period}
              </p>
            </div>

            {/* Plan Summary */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc, #e0e7ff)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid #e0e7ff'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{
                  fontWeight: '600',
                  color: '#374151'
                }}>{selectedPlan?.name}</span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#111827'
                }}>{selectedPlan?.currentPrice}</span>
              </div>
              {selectedPlan?.discount && (
                <div style={{
                  fontSize: '0.875rem',
                  color: '#059669',
                  fontWeight: '600'
                }}>
                  ✨ {selectedPlan.discount}
                </div>
              )}
            </div>

            {/* Email Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} color="#9ca3af" style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  style={{
                    width: '100%',
                    padding: '1rem 1rem 1rem 3rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              {error && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem'
                }}>{error}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '1rem'
            }}>
              <button
                onClick={closePopup}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#6b7280',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.backgroundColor = 'white';
                }}
              >
                <ArrowLeft size={16} />
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: selectedPlan?.buttonStyle === 'primary' 
                    ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                    : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: isLoading ? '0.7' : '1'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 25px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Checkout
                  </>
                )}
              </button>
            </div>

            {/* Security Notice */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '0.75rem',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Shield size={16} color="#16a34a" />
              <span style={{
                fontSize: '0.875rem',
                color: '#166534'
              }}>
                Secure checkout powered by Stripe. Your payment information is encrypted and safe.
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Hide scrollbar for WebKit browsers */
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PricingPage;