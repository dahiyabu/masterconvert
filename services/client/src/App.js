import React, { useEffect, useState } from 'react';
import FileConvertApp from './FileConvert'; // Adjust the path if needed
import FormatCompatibilityLookup from './components/FormatCompatibilityTable';
function App() {
  const [showApp, setShowApp] = useState(false);
  const [formats, setFormats] = useState(false);

  useEffect(() => {
    const tryButton = document.getElementById('try-free-btn');

    const handleClick = (e) => {
      e.preventDefault();
      setShowApp(true);
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
    const formatsButton = document.getElementById('formats-btn');

    const handleClick = (e) => {
      e.preventDefault();
      setFormats(true);
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
      landing.style.display = showApp ? 'none' : 'block';
    }
  }, [showApp]);

  useEffect(() => {
    const landing = document.getElementById('landing-page');
    if (landing) {
      landing.style.display = formats ? 'none' : 'block';
    }
  }, [formats]);

  useEffect(() => {
    if (!formats) return;
  
    const navLinks = document.querySelectorAll('.nav-links a');
  
    const handleNavClick = (e) => {
      e.preventDefault();
      handleBack(); // call your function
      const href = e.currentTarget.getAttribute('href');
      const section = document.querySelector(href);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    };
  
    navLinks.forEach(link => link.addEventListener('click', handleNavClick));
  
    return () => {
      navLinks.forEach(link => link.removeEventListener('click', handleNavClick));
    };
  }, [formats]);

  const handleBack = () => {
    setShowApp(false);
    setFormats(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header>
        <div className="container">
          <nav>
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

            {!showApp && (
              <div className="nav-links">
                <a href="#features">Features</a>
                <a href="#formats">Formats</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#testimonials">Testimonials</a>
              </div>
            )}

            <div>
              {!showApp && (
                <>
                  <a href="#try-free" className="btn btn-secondary">Try It Free</a>
                  <a href="#download" className="btn">Download Now</a>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      {formats && (
        <div style={{ paddingTop: '90px' }}>
          <FormatCompatibilityLookup />
        </div>
      )}

      {showApp && (
        <div style={{ paddingTop: '90px' }}>
          <FileConvertApp />
        </div>
      )}
    </>
  );
}

const backButtonStyle = {
  padding: '10px 15px',
  backgroundColor: '#f0f0f0',
  border: '1px solid #ccc',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default App;
