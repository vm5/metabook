/*
  Simple Profile Verification
  Matches entered names with database records
  Shows success animation before navigating to feed
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import './ProfileCheck.css';
import { toast } from 'react-hot-toast';

const ProfileCheck = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // Check for valid session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const userId = localStorage.getItem('userId');

      if (!userId) {
        toast.error('Session expired. Please login again.');
        navigate('/', { replace: true });
        return;
      }

      try {
        // Verify session is still valid
        const response = await axios.get('/api/users/session-check');

        if (!response.data.success) {
          throw new Error('Invalid session');
        }

        // Use the user data from session check
        const user = response.data.user;
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName
        });

      } catch (error) {
        console.error('Session check failed:', error);
        localStorage.clear();
        toast.error('Session expired. Please login again.');
        navigate('/', { replace: true });
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        throw new Error('Session expired');
      }

      // Get the user's actual data from the database
      const userResponse = await axios.get(`/api/users/${userId}`);
      
      if (!userResponse.data.success || !userResponse.data.user) {
        throw new Error('Failed to verify user');
      }

      const dbUser = userResponse.data.user;

      // Case-sensitive name comparison with the logged-in user's data
      if (dbUser.firstName !== formData.firstName || dbUser.lastName !== formData.lastName) {
        setError(
          'Names do not match your registration details. Please enter your name exactly as registered (case-sensitive). ' +
          'For example, if you registered as "John Doe", entering "john doe" will not work.'
        );
        return;
      }

      // Store verified user data
      localStorage.setItem('firstName', dbUser.firstName);
      localStorage.setItem('lastName', dbUser.lastName);
      
      // Show success message
      setShowSuccess(true);
      toast.success('Profile verified successfully!');

      // Navigate based on verification status
      setTimeout(() => {
        if (dbUser.isVerified) {
          navigate('/feed', { replace: true });
        } else {
          navigate('/verify-otp', { replace: true });
        }
      }, 2000);

    } catch (error) {
      console.error('Profile verification error:', error);
      
      if (error.response?.status === 401) {
        localStorage.clear();
        toast.error('Session expired. Please login again.');
        navigate('/', { replace: true });
      } else {
        setError(error.message || 'Failed to verify profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="profile-check-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {showSuccess ? (
          <motion.div
            className="success-message"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Profile Verified!</h2>
            <p>Redirecting...</p>
          </motion.div>
        ) : (
          <motion.div className="profile-check-content">
            <motion.h1
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Verify Your Profile
            </motion.h1>

            <motion.p className="verification-info">
              Please confirm your name exactly as shown below. 
              This verification is case-sensitive.
            </motion.p>

            <motion.div className="name-format-example">
              <p>Your registered name:</p>
              <p className="correct">"{formData.firstName} {formData.lastName}"</p>
              <p>Please type it exactly as shown above.</p>
            </motion.div>

            <motion.form 
              onSubmit={handleSubmit}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div className="input-group">
                <input
                  type="text"
                  placeholder="First Name (case-sensitive)"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </motion.div>

              <motion.div className="input-group">
                <input
                  type="text"
                  placeholder="Last Name (case-sensitive)"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </motion.div>

              {error && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Verifying...' : 'Verify Profile'}
              </motion.button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileCheck; 