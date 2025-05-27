import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './PhoneVerification.css';
import { FaPhone, FaCheckCircle, FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneVerification = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  // Check user verification status on component mount
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/users/${userId}`, { withCredentials: true });
        const user = response.data.user;
        
        // If user is already verified or has phone verified, redirect to feed
        if (user.isVerified || user.isPhoneVerified) {
          navigate('/feed');
          return;
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        toast.error('Error checking verification status');
      }
    };

    if (userId) {
      checkVerificationStatus();
    } else {
      navigate('/');
    }
  }, [userId, navigate]);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8080/api/phone/send-code',
        {
          userId,
          phoneNumber: '+' + phoneNumber
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setCodeSent(true);
        toast.success('Verification code sent to your email!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8080/api/phone/verify',
        {
          userId,
          code: verificationCode
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setIsVerified(true);
        toast.success('Phone number verified successfully!');
        
        // Navigate to profile edit after successful phone verification
        navigate('/profileedit/' + userId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="blur" style={{ top: "-18%", right: "0" }}></div>
      <div className="blur" style={{ top: "36%", left: "-8rem" }}></div>
      
      <div className="phone-verification-container">
        <div className="phone-verification-card">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
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

          <h2>Phone Verification</h2>
          
          {!isVerified ? (
            <div className="verification-steps">
              <div className="step">
                <FaPhone className="step-icon" />
                <h3>Step 1: Enter Your Phone Number</h3>
                <p>Please enter your phone number to receive a verification code via email.</p>
                
                <div className="phone-input-container">
                  <PhoneInput
                    country={'us'}
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    inputProps={{
                      required: true,
                      autoFocus: true
                    }}
                  />
                </div>
                <button 
                  className="verify-button"
                  onClick={handleSendCode}
                  disabled={loading || !phoneNumber}
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
                <div className="info-text">
                  <FaEnvelope className="info-icon" />
                  <p>The verification code will be sent to your registered email address</p>
                </div>
              </div>

              {codeSent && (
                <div className="step">
                  <h3>Step 2: Enter Verification Code</h3>
                  <p>Please enter the verification code sent to your email.</p>
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="verification-input"
                    maxLength={6}
                  />
                  <button 
                    className="verify-button"
                    onClick={handleVerifyCode}
                    disabled={loading || !verificationCode}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button 
                    className="resend-button"
                    onClick={handleSendCode}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="step success">
              <FaCheckCircle className="step-icon" />
              <h3>Phone Number Verified!</h3>
              <p>Your phone number has been successfully verified.</p>
            </div>
          )}

          <div className="info-box">
            <p>
              Important: You must verify both your phone number and set up two-factor authentication
              to complete your account verification and receive the verified badge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification; 