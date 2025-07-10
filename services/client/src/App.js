import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import FileConvertApp from './FileConvert'; // Adjust the path if needed
import FormatCompatibilityLookup from './components/FormatCompatibilityTable';
import ContactPage from './components/Contact';
import PricingPage from './components/Pricing';
import CheckoutResultPage from './components/CheckoutResult'; // Add your checkout result component
import DownloadPage from './components/Download'; // Add your download page component
import LoginPopup from './components/Login';

// Wrapper component to handle existing logic
function AppContent() {
  const [showApp, setShowApp] = useState(false);
  const isMobile = useIsMobile();
  const [formats, setFormats] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [scrollTarget, setScrollTarget] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  console.log("REACT_APP_URL in APP =");
  //console.log(window.env.REACT_APP_API_URL);
  const API_URL = window.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Check if we're on special routes
  const isCheckoutResult = location.pathname === '/checkout-result';
  const isPricingRoute = location.pathname === '/pricing';
  const isDownloadRoute = location.pathname === '/download';
  const isDownloadAppRoute = location.pathname === '/downloadapp';

  // Detect #contact from URL
  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#contact') {
      showContactSection();
    }
  }, [location]);
  // Handle /download route - redirect to download.html in public folder
  useEffect(() => {
    if (isDownloadRoute) {
      window.location.href = '/download.html';
    }
  }, [isDownloadRoute]);

  // Handle /pricing route
  useEffect(() => {
    if (isPricingRoute) {
      setShowPricing(true);
      setShowApp(false);
      setFormats(false);
      setShowContact(false);
    }
  }, [isPricingRoute]);

  useEffect(() => {
    const tryButton = document.getElementById('try-free-btn');

    const handleClick = (e) => {
      e.preventDefault();
      setShowApp(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (tryButton) {
      tryButton.addEventListener('click', handleClick);
    }

    return () => {
      if (tryButton) {
        tryButton.removeEventListener('click', handleClick);
      }
    };
  }, []);

  useEffect(() => {
    const handleFreePlanClick = () => {
      setShowApp(true);
      setShowPricing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  
    window.addEventListener('open-free-plan', handleFreePlanClick);
  
    return () => {
      window.removeEventListener('open-free-plan', handleFreePlanClick);
    };
  }, []);
  
  useEffect(() => {
    const formatsButton = document.getElementById('formats-btn');

    const handleClick = (e) => {
      e.preventDefault();
      setFormats(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (formatsButton) {
      formatsButton.addEventListener('click', handleClick);
    }

    return () => {
      if (formatsButton) {
        formatsButton.removeEventListener('click', handleClick);
      }
    };
  }, []);

  useEffect(() => {
    const landing = document.getElementById('landing-page');
    if (landing) {
      landing.style.display = (showApp || formats || showContact || showPricing || isCheckoutResult || isPricingRoute || isDownloadAppRoute) ? 'none' : 'block';
    }
  }, [showApp, formats, showContact, showPricing, isCheckoutResult, isPricingRoute, isDownloadAppRoute]);

  useEffect(() => {
    const navLinks = document.querySelectorAll('.nav-links a');
  
    const handleNavClick = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (e.currentTarget.getAttribute('href') === '#contact'){
        e.preventDefault();
      setShowApp(false);
      setFormats(false);
      setShowContact(true);
      setShowPricing(false);
      return;
    }
    if (href.startsWith('#')) {
      e.preventDefault();
      setShowApp(false);
      setFormats(false);
      setShowContact(false);
      setShowPricing(false);
      setScrollTarget(href);
    }
    };
  
    navLinks.forEach(link => link.addEventListener('click', handleNavClick));
  
    return () => {
      navLinks.forEach(link => link.removeEventListener('click', handleNavClick));
    };
  }, []);

  useEffect(() => {
  const handlePricingPageClick = () => {
    setShowApp(false);
    setFormats(false);
    setShowContact(false);
    setShowPricing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.addEventListener('open-pricing-page', handlePricingPageClick);

  return () => {
    window.removeEventListener('open-pricing-page', handlePricingPageClick);
  };
}, []);

  useEffect(() => {
    if (!showApp && !formats && !showContact && !showPricing && scrollTarget) {
        setTimeout(() => {
          const section = document.querySelector(scrollTarget);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      } 
      setScrollTarget(null);
    }, 300);
    }
  }, [showApp, formats, showContact, showPricing, scrollTarget]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const navLinks = document.querySelector('.nav-links');
      const menuButton = document.querySelector('.mobile-menu-toggle');
      
      if (isMobileMenuOpen && navLinks && !navLinks.contains(event.target) && !menuButton.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Outside AppContent
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(
      typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );
  
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
      };
  
      handleResize(); // Run on mount
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    return isMobile;
  }
  
  
  

  
  const handleLoginSuccess = () => {
    console.log('Login successful! Redirect to FileConvert component');
    setShowPopup(false);
    setShowApp(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setShowApp(false);
    setFormats(false);
    setShowContact(false);
    setShowPricing(false);
    navigate('/'); // Navigate to home page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactClick = (e) => {
    e?.preventDefault(); // optional if triggered by an event
    showContactSection();
  };

  const showContactSection = () => {
    setShowApp(false);
    setFormats(false);
    setShowContact(true);
    setShowPricing(false);

    // Delay scroll slightly to ensure DOM renders
    setTimeout(() => {
      const el = document.getElementById('contact');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handlePricingClick = (e) => {
    e.preventDefault();
    setShowApp(false);
    setFormats(false);
    setShowContact(false);
    setShowPricing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If we're on downloadapp route, render DownloadPage with header
  if (isDownloadAppRoute) {
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
          <div className="container">
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="logo" onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <div className="logo-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                    fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773
                             16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5
                             C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805
                             1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763
                             1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                    <path d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1
                             0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708l3 3z" />
                  </svg>
                </div>
                ConvertMaster
              </div>
              {isMobile && !showApp && (<button 
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
                //style={{ display: 'none' }} // Add this line
              >
                {isMobileMenuOpen ? '×' : '☰'}
              </button>
              )}
              
              {/* Show back to home link on download page */}
              <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <a href="/" onClick={(e) => { e.preventDefault(); handleBack(); }} style={{ color: '#007bff', textDecoration: 'none' }}>
                  ← Back to Home
                </a>
              </div>
            </nav>
          </div>
        </header>
        <main className="pt-24 w-full min-h-screen bg-gray-50">
          <div style={{ paddingTop: '90px' }}>
            <DownloadPage API_URL={API_URL}/>
          </div>
        </main>
      </>
    );
  }

  // If we're on checkout-result route, render with header
  if (isCheckoutResult) {
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
          <div className="container">
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="logo" onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <div className="logo-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                    fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773
                             16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5
                             C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805
                             1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763
                             1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                    <path d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1
                             0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708l3 3z" />
                  </svg>
                </div>
                ConvertMaster
              </div>
              
              {/* Add hamburger menu button */}
              {isMobile && !showApp && (<button 
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? '×' : '☰'}
              </button>
              )}
              {/* Show back to home link on checkout result page */}
              <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <a href="/" onClick={(e) => { e.preventDefault(); handleBack(); }} style={{ color: '#007bff', textDecoration: 'none' }}>
                  ← Back to Home
                </a>
                <div className="desktop-buttons" style={{ position: 'relative', display: 'inline-block' }}>
                  <button className='pro-portal-btn'
                    onClick={() => setShowPopup(true)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '25px',
                      padding: '12px 24px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(0)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                      // Show tooltip
                      const tooltip = e.target.nextElementSibling;
                      tooltip.style.opacity = '1';
                      tooltip.style.visibility = 'visible';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                      // Hide tooltip
                      const tooltip = e.target.nextElementSibling;
                      tooltip.style.opacity = '0';
                      tooltip.style.visibility = 'hidden';
                    }}
                  >
                  Pro Poral
                  </button>
                  
                  {/* Tooltip */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-40px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#2d3748',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      opacity: '0',
                      visibility: 'hidden',
                      transition: 'all 0.3s ease',
                      zIndex: 1000,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    Portal Access for Paid Online Users
                    {/* Tooltip arrow */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '0',
                        height: '0',
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '5px solid #2d3748',
                      }}
                    />
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </header>
        <main className="pt-24 w-full min-h-screen bg-gray-50">
          <div style={{ paddingTop: '90px' }}>
            <CheckoutResultPage API_URL={API_URL}/>
          </div>
        </main>
      </>
    );
  }

  // If we're on pricing route, render pricing page with header
  if (isPricingRoute || showPricing) {
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
          <div className="container">
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="logo" onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <div className="logo-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                    fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773
                             16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5
                             C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805
                             1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763
                             1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                    <path d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1
                             0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708l3 3z" />
                  </svg>
                </div>
                ConvertMaster
              </div>
              {isMobile && !showApp && (<button 
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
                //style={{ display: 'none' }} // Add this line
              >
                {isMobileMenuOpen ? '×' : '☰'}
              </button>)
              }
              
              {/* Show navigation links on pricing page */}
              <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <a href="/" onClick={(e) => { e.preventDefault(); handleBack(); }}>Home</a>
                <a href="#contact" onClick={(e) => { handleContactClick(e); setIsMobileMenuOpen(false); }}>Contact</a>
              </div>
            </nav>
          </div>
        </header>
        <main className="pt-24 w-full min-h-screen bg-gray-50">
          <div style={{ paddingTop: '90px' }}>
            <PricingPage isMobile={isMobile} API_URL={API_URL}/>
          </div>
        </main>
      </>
    );
  }

  // Otherwise, render your existing logic
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
        <div className="container">
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo"  onClick={handleBack}  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <div className="logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                  fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773
                           16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5
                           C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805
                           1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763
                           1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                  <path d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1
                           0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708l3 3z" />
                </svg>
              </div>
              ConvertMaster
            </div>
            {isMobile && !showApp && (<button 
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
                //style={{ display: 'none' }} // Add this line
              >
                {isMobileMenuOpen ? '×' : '☰'}
              </button>
            )}

            {!showApp && (
              <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!showContact && !formats && (
                  <>
                    <a href="#features" onClick={(e) => { e.preventDefault(); navigate('#features'); setIsMobileMenuOpen(false); }}>Features</a>
                    <a href="#formats" onClick={(e) => { e.preventDefault(); navigate('#formats'); setIsMobileMenuOpen(false); }}>Formats</a>
                    <a href="#how-it-works" onClick={(e) => { e.preventDefault(); navigate('#how-it-works'); setIsMobileMenuOpen(false); }}>How It Works</a>

                    {/*<a href="#testimonials">Testimonials</a>*/}
                  </>
                )}
                {(showContact || formats) && (
                  <a href="/" onClick={(e) => { e.preventDefault(); handleBack(); setIsMobileMenuOpen(false); }}>Home</a>
                )}
                <a href="#pricing" onClick={(e) => { handlePricingClick(e); setIsMobileMenuOpen(false); }}>Pricing</a>
                {!showContact && (
                  <a href="#contact" onClick={(e) => { handleContactClick(e); setIsMobileMenuOpen(false); }}>Contact Us</a>
                )}
                <div style={{ position: 'relative', display: 'inline-block'}}>
                  <button
                    onClick={() => {setShowPopup(true); setIsMobileMenuOpen(false);}}
                    className='pro-portal-btn'
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '25px',
                      padding: '12px 24px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(0)',
                      width: '100%', // Add this for mobile
                      margin: '1rem 0', // Add this for mobile
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                      // Show tooltip
                      const tooltip = e.target.nextElementSibling;
                      tooltip.style.opacity = '1';
                      tooltip.style.visibility = 'visible';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                      // Hide tooltip
                      const tooltip = e.target.nextElementSibling;
                      tooltip.style.opacity = '0';
                      tooltip.style.visibility = 'hidden';
                    }}
                  >
                    Pro Portal
                  </button>
                  
                  {/* Tooltip */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-40px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#2d3748',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      opacity: '0',
                      visibility: 'hidden',
                      transition: 'all 0.3s ease',
                      zIndex: 1000,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    Portal Access for Paid Online Users
                    {/* Tooltip arrow */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '0',
                        height: '0',
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '5px solid #2d3748',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              {!showApp && (
                <div className='desktop-buttons'>
                  <a href="#try-free" className="btn btn-secondary" onClick={(e) => {e.preventDefault();setScrollTarget('#try-free');
                    setShowApp(false);setFormats(false);setShowContact(false);setShowPricing(false);setIsMobileMenuOpen(false);}}>
                    Try It Free
                  </a>
                  <a href="#download" className="btn" onClick={(e) => {e.preventDefault();setScrollTarget('#download');setShowApp(false);
                    setFormats(false);setShowContact(false);setShowPricing(false);setIsMobileMenuOpen(false);}}>
                      Download Now
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="pt-24 w-full min-h-screen bg-gray-50">
      {formats && (
        <div style={{ paddingTop: '90px' }}>
          <FormatCompatibilityLookup API_URL={API_URL}/>
        </div>
      )}

      {showApp && (
        <div style={{ paddingTop: '90px' }}>
          <FileConvertApp />
        </div>
      )}
      {showContact && (
        <div id="contact" style={{ paddingTop: '90px' }}>
          <ContactPage API_URL={API_URL}/>
        </div>
      )}
      {showPricing && (
        <div style={{ paddingTop: '90px' }}>
          <PricingPage />
        </div>
      )}
      </main>
        <LoginPopup
    isOpen={showPopup}
    onClose={() => setShowPopup(false)}
    onSuccess={handleLoginSuccess}
    API_URL={API_URL}
  />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;