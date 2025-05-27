import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './TwoFactorAuth.css';
import { FaCheckCircle, FaQrcode, FaMobile, FaEnvelope, FaArrowLeft } from 'react-icons/fa';

// Add URL obfuscation
const obfuscateUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://localhost:8080')) {
    return url;
  }
  return atob(btoa(url));
};

// Modify axios calls to use obfuscated URLs
axios.interceptors.request.use(config => {
  if (!config.url.startsWith('http://localhost:8080')) {
    config.url = obfuscateUrl(config.url);
  }
  return config;
});

// Add this function near the top after imports
const hideUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://localhost:8080')) {
    const randomId = Math.random().toString(36).substring(7);
    // Store real URL in memory but display fake one in DOM
    window[`__url_${randomId}`] = url;
    return `data:image/url,${randomId}`;
  }
  return url;
};

const TwoFactorAuth = () => {
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const setupTwoFactor = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Please log in first');
          navigate('/');
          return;
        }

        const response = await axios.post('http://localhost:8080/api/2fa/setup', 
          { userId },
          { withCredentials: true }
        );

        if (response.data.success) {
          setQrCode(response.data.qrCode);
        } else {
          toast.error('Failed to setup 2FA');
        }
      } catch (error) {
        console.error('2FA setup error:', error);
        toast.error('Error setting up 2FA');
      } finally {
        setIsLoading(false);
      }
    };

    setupTwoFactor();
  }, [navigate]);

  const handleVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      const response = await axios.post('http://localhost:8080/api/2fa/verify', {
        userId,
        token: verificationCode
      }, { withCredentials: true });

      if (response.data.success) {
        setIsVerified(true);
        toast.success('2FA verification successful!');
        setTimeout(() => {
          navigate(`/profileedit/${userId}`);
        }, 2000);
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast.error('Error verifying 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Modify the getQrCodeUrl function
  const getQrCodeUrl = (qrCode) => {
    if (!qrCode) return qrCode;
    return hideUrl(qrCode);
  };

  // Add this effect to handle image loading
  useEffect(() => {
    const images = document.querySelectorAll('img[src^="data:image/url"]');
    images.forEach(img => {
      const randomId = img.src.split(',')[1];
      const realUrl = window[`__url_${randomId}`];
      if (realUrl) {
        // Create a new image element with the real URL
        const realImg = new Image();
        realImg.onload = () => {
          img.src = realUrl;
          // Clean up the stored URL
          delete window[`__url_${randomId}`];
        };
        realImg.src = realUrl;
      }
    });
  }, [qrCode]);

  return (
    <div className="App">
      <div className="blur" style={{ top: "-18%", right: "0" }}></div>
      <div className="blur" style={{ top: "36%", left: "-8rem" }}></div>
      
      <div className="twofa-container">
        <div className="twofa-card">
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft /> Back to Login
          </button>

          <img 
            src="/luciferlogo.png" 
            alt="Lucifer Logo" 
            className="auth-logo"
            style={{ 
              width: "200px", 
              marginBottom: "20px",
              filter: "drop-shadow(0 0 10px rgba(0, 0, 255, 0.7))"
            }}
          />

          <h2>Two-Factor Authentication Setup</h2>
          
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Setting up two-factor authentication...</p>
            </div>
          ) : (
            <div className="verification-steps">
              <div className="step">
                <FaQrcode className="step-icon" />
                <h3>Step 1: Scan QR Code</h3>
                <p>Open Google Authenticator and scan this QR code:</p>
                {qrCode && (
                  <div className="qr-container">
                    <img src={getQrCodeUrl(qrCode)} alt="2FA QR Code" />
                  </div>
                )}
              </div>

              <div className="step">
                <FaMobile className="step-icon" />
                <h3>Step 2: Enter Code</h3>
                <p>Enter the 6-digit code from Google Authenticator:</p>
                <form onSubmit={handleVerification} className="verification-form">
                  <input
                    type="text"
                    maxLength="6"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    required
                  />
                  <button type="submit" disabled={verificationCode.length !== 6 || isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </form>
              </div>

              {isVerified && (
                <div className="step success">
                  <FaCheckCircle className="step-icon" />
                  <h3>Verification Successful!</h3>
                  <p>Your account is now secured with 2FA and verified.</p>
                </div>
              )}
            </div>
          )}

          <div className="info-box">
            <FaEnvelope className="info-icon" />
            <p>
              Important: Your account must be verified within 7 days. You will receive
              daily email reminders until verification is complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth; 