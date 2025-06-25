// utils/verifyPayment.js
export const verifyPayment = async (email, plan, sessionId, setStatus, setVerificationError) => {
    try {
      const response = await fetch('http://localhost:5000/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, plan, sessionId })
      });
  
      const result = await response.json();
  
      if (response.ok && result.verified) {
        setStatus('success');
      } else {
        setStatus('verification_failed');
        setVerificationError(result.message || 'Payment could not be verified.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('verification_failed');
      setVerificationError('An error occurred during verification.');
    }
  };  