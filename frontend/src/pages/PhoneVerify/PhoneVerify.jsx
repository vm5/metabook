import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './PhoneVerify.css';

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

const PhoneVerify = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  // Country codes array
  const countryCodes = [
    { code: '+1', country: 'USA/Canada' },
    { code: '+7', country: 'Russia/Kazakhstan' },
    { code: '+20', country: 'Egypt' },
    { code: '+27', country: 'South Africa' },
    { code: '+30', country: 'Greece' },
    { code: '+31', country: 'Netherlands' },
    { code: '+32', country: 'Belgium' },
    { code: '+33', country: 'France' },
    { code: '+34', country: 'Spain' },
    { code: '+36', country: 'Hungary' },
    { code: '+39', country: 'Italy' },
    { code: '+40', country: 'Romania' },
    { code: '+41', country: 'Switzerland' },
    { code: '+43', country: 'Austria' },
    { code: '+44', country: 'UK' },
    { code: '+45', country: 'Denmark' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+48', country: 'Poland' },
    { code: '+49', country: 'Germany' },
    { code: '+51', country: 'Peru' },
    { code: '+52', country: 'Mexico' },
    { code: '+53', country: 'Cuba' },
    { code: '+54', country: 'Argentina' },
    { code: '+55', country: 'Brazil' },
    { code: '+56', country: 'Chile' },
    { code: '+57', country: 'Colombia' },
    { code: '+58', country: 'Venezuela' },
    { code: '+60', country: 'Malaysia' },
    { code: '+61', country: 'Australia' },
    { code: '+62', country: 'Indonesia' },
    { code: '+63', country: 'Philippines' },
    { code: '+64', country: 'New Zealand' },
    { code: '+65', country: 'Singapore' },
    { code: '+66', country: 'Thailand' },
    { code: '+81', country: 'Japan' },
    { code: '+82', country: 'South Korea' },
    { code: '+84', country: 'Vietnam' },
    { code: '+86', country: 'China' },
    { code: '+90', country: 'Turkey' },
    { code: '+91', country: 'India' },
    { code: '+92', country: 'Pakistan' },
    { code: '+93', country: 'Afghanistan' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+95', country: 'Myanmar' },
    { code: '+98', country: 'Iran' },
    { code: '+211', country: 'South Sudan' },
    { code: '+212', country: 'Morocco' },
    { code: '+213', country: 'Algeria' },
    { code: '+216', country: 'Tunisia' },
    { code: '+218', country: 'Libya' },
    { code: '+220', country: 'Gambia' },
    { code: '+221', country: 'Senegal' },
    { code: '+222', country: 'Mauritania' },
    { code: '+223', country: 'Mali' },
    { code: '+224', country: 'Guinea' },
    { code: '+225', country: 'Ivory Coast' },
    { code: '+226', country: 'Burkina Faso' },
    { code: '+227', country: 'Niger' },
    { code: '+228', country: 'Togo' },
    { code: '+229', country: 'Benin' },
    { code: '+230', country: 'Mauritius' },
    { code: '+231', country: 'Liberia' },
    { code: '+232', country: 'Sierra Leone' },
    { code: '+233', country: 'Ghana' },
    { code: '+234', country: 'Nigeria' },
    { code: '+235', country: 'Chad' },
    { code: '+236', country: 'Central African Republic' },
    { code: '+237', country: 'Cameroon' },
    { code: '+238', country: 'Cape Verde' },
    { code: '+239', country: 'São Tomé and Príncipe' },
    { code: '+240', country: 'Equatorial Guinea' },
    { code: '+241', country: 'Gabon' },
    { code: '+242', country: 'Republic of the Congo' },
    { code: '+243', country: 'Democratic Republic of the Congo' },
    { code: '+244', country: 'Angola' },
    { code: '+245', country: 'Guinea-Bissau' },
    { code: '+246', country: 'British Indian Ocean Territory' },
    { code: '+248', country: 'Seychelles' },
    { code: '+249', country: 'Sudan' },
    { code: '+250', country: 'Rwanda' },
    { code: '+251', country: 'Ethiopia' },
    { code: '+252', country: 'Somalia' },
    { code: '+253', country: 'Djibouti' },
    { code: '+254', country: 'Kenya' },
    { code: '+255', country: 'Tanzania' },
    { code: '+256', country: 'Uganda' },
    { code: '+257', country: 'Burundi' },
    { code: '+258', country: 'Mozambique' },
    { code: '+260', country: 'Zambia' },
    { code: '+261', country: 'Madagascar' },
    { code: '+262', country: 'Réunion' },
    { code: '+263', country: 'Zimbabwe' },
    { code: '+264', country: 'Namibia' },
    { code: '+265', country: 'Malawi' },
    { code: '+266', country: 'Lesotho' },
    { code: '+267', country: 'Botswana' },
    { code: '+268', country: 'Eswatini' },
    { code: '+269', country: 'Comoros' },
    { code: '+290', country: 'Saint Helena' },
    { code: '+291', country: 'Eritrea' },
    { code: '+297', country: 'Aruba' },
    { code: '+298', country: 'Faroe Islands' },
    { code: '+299', country: 'Greenland' }
  ];

  const [selectedCountry, setSelectedCountry] = useState('+91');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullPhoneNumber = selectedCountry + phoneNumber;
      const response = await axios.post('http://localhost:8080/api/phone/send-code', {
        userId: id,
        phoneNumber: fullPhoneNumber
      }, { withCredentials: true });

      if (response.data.success) {
        setCodeSent(true);
        
        if (response.data.devMode && response.data.devCode) {
          setDevCode(response.data.devCode);
          setVerificationCode(response.data.devCode);
          toast.success('DEV MODE: Verification code set automatically!');
        } else {
          toast.success('Verification code sent successfully! Check your SMS.');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullPhoneNumber = selectedCountry + phoneNumber;
      const response = await axios.post('http://localhost:8080/api/phone/verify', {
        userId: id,
        phoneNumber: fullPhoneNumber,
        code: verificationCode
      }, { withCredentials: true });

      if (response.data.success) {
        toast.success('Phone number verified successfully!');
        navigate(`/profileedit/${id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-verify">
      <div className="verify-container">
        <h2>We'll also need to verify your phone number</h2>
        
        <div className="verification-reasons">
          <div className="reason-item">
            <div className="reason-icon">📱</div>
            <p>So you can hit the ground running and start using our Metabook services.</p>
          </div>
          <div className="reason-item">
            <div className="reason-icon">🔒</div>
            <p>To verify you during log in through two-factor authentication (2FA).</p>
          </div>
          <div className="reason-item">
            <div className="reason-icon">🛡️</div>
            <p>To help us mitigate fraud and abuse.</p>
          </div>
        </div>

        {!codeSent ? (
          <form onSubmit={handleSendCode} className="phone-form">
            <div className="phone-input-group">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="country-select"
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.code} ({country.country})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                pattern="[0-9]{10}"
                required
                className="phone-input"
              />
            </div>
            <button type="submit" disabled={loading || !phoneNumber} className="send-code-button">
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <>
            <p className="verification-prompt">Enter the 6-digit code sent to your phone</p>
            
            {devCode && (
              <div className="dev-mode-alert">
                <p>DEVELOPMENT MODE</p>
                <p>Use this verification code:</p>
                <strong>{devCode}</strong>
              </div>
            )}
            
            <form onSubmit={handleVerify} className="verification-form">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                className="code-input"
              />
              <div className="verification-buttons">
                <button type="submit" disabled={loading || verificationCode.length !== 6} className="verify-button">
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button 
                  type="button" 
                  className="resend-button"
                  onClick={handleSendCode}
                  disabled={loading}
                >
                  Resend Code
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PhoneVerify; 