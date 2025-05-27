import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import './Otp.css';

const OTPVerification = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [initialOtpSent, setInitialOtpSent] = useState(false);
    const navigate = useNavigate();

    const email = localStorage.getItem('signupEmail');

    useEffect(() => {
        if (!initialOtpSent && email) {
            handleInitialOTP();
        }
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    const handleInitialOTP = async () => {
        if (loading || resendDisabled || initialOtpSent) return;
        
        setLoading(true);
        try {
            const response = await axios.post('http://147.93.72.94:8080/api/send-otp', { 
                email: email  // Make sure email is being passed correctly
            },{ withCredentials: true });
            console.log("Send OTP response:", response.data); // Debug log
            
            if (response.data.success) {
                setInitialOtpSent(true);
                setResendDisabled(true);
                setCountdown(60);
                toast.success(`OTP sent to ${email}`);
            }
        } catch (error) {
            console.error('OTP send error:', error);
            toast.error('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!email || loading || resendDisabled) return;
        
        setLoading(true);
        try {
            const response = await axios.post('http://147.93.72.94:8080/api/send-otp', { email },{ withCredentials: true });
            if (response.data.success) {
                setResendDisabled(true);
                setCountdown(60);
                toast.success(`New OTP sent to ${email}`, {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "dark",
                    style: {
                        background: '#1f1f1f',
                        color: '#fff',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                });
            }
        } catch (error) {
            toast.error('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://147.93.72.94:8080/api/verify-otp', {
                email,
                otp
            },{ withCredentials: true });

            if (response.data.success) {
                // Store the userId in localStorage
                localStorage.setItem('userId', response.data.userId);
                
                // Check for next step in the response
                if (response.data.nextStep === '2fa-setup' && response.data.setupUrl) {
                    navigate(response.data.setupUrl);
                    toast.success('Email verified successfully! Please set up 2FA.');
                } 
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="otp-container">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="email-verification-reminder"
            >
                <div className="reminder-content">
                    <h3>📧 Check Your Email!</h3>
                    <p>We've sent a verification code to your email address.</p>
                    <p>Please enter the code to continue setting up your profile.</p>
                    <div className="email-tips">
                        <h4>Tips:</h4>
                        <ul>
                            <li>Check your spam if you don't see the email</li>
                            <li>The code expires in 5 minutes</li>
                            <li>Make sure to enter the code exactly as shown in the email</li>
                        </ul>
                    </div>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="otp-form">
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter verification code"
                    maxLength="6"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify Email'}
                </button>
            </form>
        </div>
    );
};

export default OTPVerification;
