import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './TwoFactorVerify.css';

const TwoFactorVerify = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('Session expired. Please login again.');
        navigate('/');
        return;
      }

      const response = await axios.post('http://147.93.72.94:8080/api/2fa/verify', {
        userId,
        token: verificationCode
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        const user = response.data.user;
        
        // Store user data
        localStorage.setItem('userId', user._id);
        localStorage.setItem('sessionId', user.sessionId);
        localStorage.setItem('signupEmail', user.email);
        localStorage.setItem('verifiedBadge', user.verifiedBadge);

        toast.success('2FA verification successful!');
        
        // Check if phone is already verified
        if (user.isPhoneVerified) {
          // If phone is verified, go to profile edit
          navigate(`/profileedit/${response.data.user._id}`);
        } else {
          // If phone is not verified, go to phone verification
          navigate(`/phone-verify/${response.data.user._id}`);
        }
      }
    } catch (error) {
      console.error('2FA Verification Error:', error);
      if (error.response?.status === 401) {
        toast.error('Invalid verification code');
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="two-factor-verify">
      <div className="verify-container">
        <h2>Two-Factor Authentication</h2>
        <p>Please enter the verification code from your authenticator app</p>
        
        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            pattern="[0-9]*"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          
          <button type="submit" disabled={loading || !verificationCode}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorVerify; 
