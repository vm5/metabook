import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ResetPassword.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Check for at least one number
    if (!/\d/.test(newPassword)) {
      toast.error('Password must contain at least one number');
      return;
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one letter');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/reset-password', {
        token,
        newPassword
      }, { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Password reset successful! Please login with your new password');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>Reset Your Password</h2>
        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="reset-password-input"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="reset-password-input"
              required
            />
          </div>
          <div className="password-guidelines">
            <p>Password must:</p>
            <ul>
              <li>Be at least 6 characters long</li>
              <li>Contain at least one number</li>
              <li>Contain at least one letter</li>
            </ul>
          </div>
          <button 
            type="submit" 
            className="reset-password-button"
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 