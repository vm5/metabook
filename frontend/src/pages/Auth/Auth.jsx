// Authentication module for handling user login and signup functionality
import React, { useEffect, useState, useRef } from "react";
import "./Auth.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PolicyModal from "../../components/PrivacyPolicy/PolicyModal"

// Configure axios defaults
axios.defaults.withCredentials = true;

const termsAndConditions = {
  title: "Terms and Conditions",
  sections: [
    {
      title: "1. Introduction",
      content: "These Website Standard Terms and Conditions (these 'Terms' or these 'Website Standard Terms and Conditions') contained herein on this webpage, shall govern your use of this website, including all pages within this website (collectively referred to herein below as this 'Website'). These Terms apply in full force and effect to your use of this Website and by using this Website, you expressly accept all terms and conditions contained herein in full. You must not use this Website, if you have any objection to any of these Website Standard Terms and Conditions. For more information, please visit teamMetabook.com/legal.",
      subsections: [
        {
          title: "1.1 Acceptance of Terms",
          content: "By accessing and using this Website, you confirm that you have read, understood, and agree to be bound by these Terms. If you disagree with any part of these terms, you must not use our Website."
        },
        {
          title: "1.2 Modifications to Terms",
          content: "Team Metabook reserves the right to modify these terms at any time without prior notice. Your continued use of the Website following any changes constitutes your acceptance of such changes."
        }
      ]
    },
    {
      title: "2. Age Restrictions and Eligibility",
      content: "You must be of legal age in your jurisdiction to access and use this website. By using this website, you warrant and represent that you are of legal age and are accessing this website on your own freewill and in your complete conscious state of sound and mind.",
      subsections: [
        {
          title: "2.1 Age Verification",
          content: "You may be required to verify your age through appropriate documentation or other means as determined by Team Metabook."
        },
        {
          title: "2.2 Account Requirements",
          content: "If you create an account, you must provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials."
        }
      ]
    },
    {
      title: "3. Intellectual Property Rights",
      content: "Other than content you own, which you may have opted to include on this Website, under these Terms, Team Metabook and/or its licensors own all rights to the intellectual property and material contained in this Website, and all such rights are reserved. You are granted a limited license only, subject to the restrictions provided in these Terms, for purposes of viewing the material contained on this Website.",
      subsections: [
        {
          title: "3.1 Copyright",
          content: "All content on this Website, including but not limited to text, graphics, logos, images, audio clips, digital downloads, and software, is the property of Team Metabook or its content suppliers and is protected by international copyright laws."
        },
        {
          title: "3.2 Trademarks",
          content: "All trademarks, service marks, and trade names are proprietary to Team Metabook or its affiliates, unless otherwise noted."
        },
        {
          title: "3.3 User Content",
          content: "By posting, uploading, or sharing any content on our Website, you grant Team Metabook a non-exclusive, worldwide, royalty-free license to use, modify, publicly display, reproduce, and distribute such content."
        }
      ]
    },
    {
      title: "4. Restrictions and Prohibited Activities",
      content: "You are expressly and emphatically restricted from all of the following: publishing any Website material in any media; selling, sublicensing and/or otherwise commercializing any Website material; publicly performing and/or showing any Website material; using this Website in any way that is, or may be, damaging to this Website; using this Website in any way that impacts user access to this Website; using this Website contrary to applicable laws and regulations, or in a way that causes, or may cause, harm to the Website, or to any person or business entity; engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this Website, or while using this Website.",
      subsections: [
        {
          title: "4.1 Technical Restrictions",
          content: "You may not: (a) use any automated means to access the Website; (b) attempt to bypass any security measures; (c) interfere with the proper working of the Website; (d) impose an unreasonable load on our infrastructure."
        },
        {
          title: "4.2 Content Restrictions",
          content: "You may not post, upload, or transmit any content that: (a) is illegal, harmful, or offensive; (b) infringes on others' rights; (c) contains malware or viruses; (d) is spam or commercial advertising."
        },
        {
          title: "4.3 Account Usage",
          content: "You may not: (a) share your account credentials; (b) use another user's account; (c) create multiple accounts; (d) sell or transfer your account."
        }
      ]
    },
    {
      title: "5. Privacy and Data Protection",
      content: "Your privacy is important to us. Any personal information you provide will be handled in accordance with our Privacy Policy (teamMetabook.com/privacy). By using this Website, you consent to our collection and use of your information as described in our Privacy Policy.",
      subsections: [
        {
          title: "5.1 Data Collection",
          content: "We collect and process personal data as outlined in our Privacy Policy (teamMetabook.com/privacy#data-collection), including but not limited to: (a) information you provide directly; (b) usage data; (c) cookies and similar technologies."
        },
        {
          title: "5.2 Data Security",
          content: "We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction."
        },
        {
          title: "5.3 Third-Party Services",
          content: "Our Website may integrate with third-party services. Your use of such services is subject to their respective privacy policies and terms of service."
        }
      ]
    },
    {
      title: "6. Limitation of Liability",
      content: "In no event shall Team Metabook, nor any of its officers, directors and employees, be liable to you for anything arising out of or in any way connected with your use of this Website, whether such liability is under contract, tort or otherwise, and Team Metabook shall not be liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.",
      subsections: [
        {
          title: "6.1 Disclaimer of Warranties",
          content: "The Website is provided 'as is' and 'as available' without any warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement."
        },
        {
          title: "6.2 Limitation of Damages",
          content: "To the maximum extent permitted by law, Team Metabook shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Website."
        },
        {
          title: "6.3 Indemnification",
          content: "You agree to indemnify and hold harmless Team Metabook and its affiliates from any claims, damages, or expenses arising from your use of the Website or violation of these Terms."
        }
      ]
    },
    {
      title: "7. Service Availability and Maintenance",
      content: "Team Metabook strives to provide uninterrupted access to the Website but does not guarantee continuous, uninterrupted access.",
      subsections: [
        {
          title: "7.1 Maintenance",
          content: "We may temporarily suspend access to the Website for maintenance, updates, or improvements. We will attempt to provide notice when possible."
        },
        {
          title: "7.2 Service Modifications",
          content: "We reserve the right to modify, suspend, or discontinue any part of the Website at any time without notice."
        }
      ]
    },
    {
      title: "8. Termination",
      content: "Team Metabook reserves the right to terminate or suspend your access to the Website immediately, without prior notice, for any violation of these Terms.",
      subsections: [
        {
          title: "8.1 Effects of Termination",
          content: "Upon termination: (a) your rights under these Terms will cease; (b) you must stop using the Website; (c) certain provisions of these Terms will survive termination."
        },
        {
          title: "8.2 Data Retention",
          content: "We may retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce agreements."
        }
      ]
    },
    {
      title: "9. Governing Law and Jurisdiction",
      content: "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Team Metabook is established. For detailed legal information, please visit teamMetabook.com/legal/jurisdiction.",
      subsections: [
        {
          title: "9.1 Dispute Resolution",
          content: "Any disputes arising from these Terms shall be resolved through negotiation, mediation, or litigation in the courts of the applicable jurisdiction."
        },
        {
          title: "9.2 Severability",
          content: "If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect."
        }
      ]
    }
  ]
};

const Auth = () => {
  const [showCoverPage, setShowCoverPage] = useState(true);
  const [location, setLocation] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalAge, setLegalAge] = useState(false);
  const [tncRead, setTncRead] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowCoverPage(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          logLocation({ latitude, longitude });
        },
        (error) => {
          console.error("Error getting location:", error.message);
          toast.error("Failed to get location");
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      toast.warning("Geolocation is not supported by your browser");
    }
  };

  const logLocation = async (coords) => {
    try {
      const response = await axios.post('http://localhost:8080/api/log', {
        location: coords,
      }, { withCredentials: true });
    } catch (error) {
      // Error handling without console.log
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }
    return 'denied';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!legalAge) {
      toast.error('You must confirm that you are of legal age to use this platform');
      return;
    }

    // Add minimum password length check
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Get location first
      let coordinates = null;
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (locationError) {
        // Error handling without console.log
      }

      // Clean and prepare login data
      const loginData = {
        email: username.toLowerCase().trim(),
        password: password,
        coordinates: coordinates,
        rememberMe: rememberMe,
        newsletter: newsletter
      };

      const response = await axios.post('http://localhost:8080/api/users/login', loginData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const user = response.data.user;
        
        // Store user data
        localStorage.setItem('userId', user._id);
        localStorage.setItem('signupEmail', user.email);
        localStorage.setItem('verifiedBadge', user.verifiedBadge);

        // If remember me is checked, store additional data
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('lastLoginEmail', user.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('lastLoginEmail');
        }

        toast.success('Login successful!');
        
        // Navigate directly to feed instead of profile-check
        setTimeout(() => {
          navigate('/feed');
        }, 100);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLoginMode(prevMode => !prevMode);
    setError('');
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!firstName || !lastName || !username || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Password validation
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      toast.error("Password must contain at least one letter");
      return;
    }

    try {
      const signupResponse = await axios.post('http://localhost:8080/api/users/signup', {
        firstName,
        lastName,
        username,
        email,
        password
      },{ withCredentials: true });

      console.log('Signup response:', signupResponse.data); // Debug log

      if (signupResponse.data.success) {
        const userId = signupResponse.data.data._id; // Access _id from data object
        
        // Store user data
        localStorage.setItem('signupEmail', email);
        localStorage.setItem('userId', userId);
        
        // Send OTP
        try {
          const otpResponse = await axios.post('http://localhost:8080/api/send-otp', {
            email: email,
            userId: userId
          },{ withCredentials: true });

          console.log('OTP response:', otpResponse.data); // Debug log

          if (otpResponse.data.success) {
            toast.success('Sign up successful! Please verify your email.');
            navigate("/verify-otp");
          } else {
            toast.error('Error sending verification code');
          }
        } catch (otpError) {
          console.error("OTP send error:", otpError);
          toast.error('Error sending verification code. Please try again.');
        }
      } else {
        toast.error(signupResponse.data.message || 'Signup failed');
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/logout', {}, {
        withCredentials: true
      });
      localStorage.clear();
      navigate('/');
    } catch (error) {
      // Error handling without console.log
    }
  };

  // Check for remembered user on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('lastLoginEmail');
    if (rememberedEmail) {
      setUsername(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <>
      {showCoverPage ? (
        <CoverPage />
      ) : (
        <div className="page-container">
          <Navbar />
          <div className="Auth">
            <div className="a-left"></div>
            <LogIn termsAndConditions={termsAndConditions} />
          </div>
          <footer className="main-footer">
            <p>&copy; {new Date().getFullYear()} Team Metabook. All rights reserved.</p>
          </footer>
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
      )}
    </>
  );
};

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="brand-name">
      <h1>Metabook</h1>

      </div>
    </div>
  );
};

const CoverPage = () => {
  return (
    <div className="cover-page">
      <img
        src="/luciferlogo.png" 
        alt="Logo"
        className="cover-logo"
      />
    </div>
  );
};

const AnimatedText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text[index]);
      index = (index + 1) % text.length;
      if (index === 0) setDisplayedText("");
    }, 4000); 
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
};

const LogIn = ({ termsAndConditions }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState("");
  const [legalAge, setLegalAge] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const navigate = useNavigate();

  // Check for remembered user on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('lastLoginEmail');
    if (rememberedEmail) {
      setUsername(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!legalAge) {
      toast.error('You must confirm that you are of legal age to use this platform');
      return;
    }

    // Add minimum password length check
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Get location first
      let coordinates = null;
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (locationError) {
        // Error handling without console.log
      }

      // Clean and prepare login data
      const loginData = {
        email: username.toLowerCase().trim(),
        password: password,
        coordinates: coordinates,
        rememberMe: rememberMe,
        newsletter: newsletter
      };

      const response = await axios.post('http://localhost:8080/api/users/login', loginData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const user = response.data.user;
        
        // Store user data
        localStorage.setItem('userId', user._id);
        localStorage.setItem('signupEmail', user.email);
        localStorage.setItem('verifiedBadge', user.verifiedBadge);

        // If remember me is checked, store additional data
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('lastLoginEmail', user.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('lastLoginEmail');
        }

        toast.success('Login successful!');
        
        // Navigate directly to feed instead of profile-check
        setTimeout(() => {
          navigate('/feed');
        }, 100);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="a-right">
      <form className="infoForm authForm" onSubmit={handleLogin}>
        <h3>Welcome to Metabook! Please Sign In to continue</h3>
        
        <div>
          <input
            type="text"
            placeholder="Email"
            className="infoInput"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            className="infoInput"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div className="auth-links">
          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>

        <div className="signup-checkbox-div">
          <input
            type="checkbox"
            className="form-check-input"
            checked={legalAge}
            onChange={(e) => setLegalAge(e.target.checked)}
            id="legalAgeCheck"
          />
          <label htmlFor="legalAgeCheck">
            I certify that I am of legal age and am accessing this website on my freewill and in my complete conscious state of sound and mind.
          </label>
        </div>

        <div className="signup-checkbox-div">
          <input
            type="checkbox"
            className="form-check-input"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            id="rememberMeCheck"
          />
          <label htmlFor="rememberMeCheck">
            Remember me
          </label>
        </div>

        <div className="signup-checkbox-div">
          <input
            type="checkbox"
            className="form-check-input"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            id="newsletterCheck"
          />
          <label htmlFor="newsletterCheck">
            Subscribe to our newsletter for updates and promotions
          </label>
        </div>

        <button type="submit" className="button infoButton" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

const SignUp = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="Auth">
        <div className="a-left"></div>
        <Authenticate />
      </div>
      <footer className="main-footer">
        <p>&copy; {new Date().getFullYear()} Team Metabook. All rights reserved.</p>
      </footer>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

function Authenticate() {
  const [username, setUsername] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAccepted, setIsAccepted] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSignupEnabled, setIsSignupEnabled] = useState(false);
  const policyTextRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    console.log("isAccepted updated:", isAccepted);
  }, [isAccepted]);

  useEffect(() => {
    console.log("ageChecked updated:", ageChecked);
  }, [ageChecked]);

  useEffect(() => {
    console.log("isSignupEnabled updated:", isSignupEnabled);
  }, [isSignupEnabled]);

  useEffect(() => {
    setIsSignupEnabled(isAccepted && ageChecked);
  }, [isAccepted, ageChecked]);

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!firstName || !lastName || !username || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Password validation
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      toast.error("Password must contain at least one letter");
      return;
    }

    const formData = {
      firstName,
      lastName,
      username,
      email,
      password
    };

    try {
      console.log("Sending signup request with:", formData);

      const response = await axios.post('http://localhost:8080/api/users/signup', 
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true  // This enables sending and receiving cookies
        }
      );

      const data = await response.data;
      console.log("received signup response ", response);
      if (response.data.success) {
        // Store both email and userId for OTP verification
        localStorage.setItem('signupEmail', email);
        localStorage.setItem('userId', data.data._id);
        localStorage.setItem('sessionId', data.data.sessionId);
        
        // Automatically trigger OTP send
        try {
          console.log("calling send otp ");
          const otpResponse = await axios.post('/http://localhost:8080/api/send-otp', {
            email: email,
            userId: data.data._id
          },{ withCredentials: true });
          console.log("otp response receieved");
          if (otpResponse.data.success) {
            toast.success('Sign up successful! Please check your email for OTP.', {
              onClose: () => navigate("/verify-otp")
            });
          } else {
            toast.error('Failed to send OTP. Please try again.');
          }
        } catch (otpError) {
          console.error("OTP send error:", otpError);
          toast.error('Failed to send verification email. Please try again.');
        }
      } else {
        toast.error(data.message || 'Sign up failed');
      }
    } catch (error) {
      console.log("Signup error:", error);
      toast.error('Network error occurred');
    }
  };

  return (
    <div className="a-right">
      <form className="infoForm authForm" onSubmit={handleSignup}>
        <h1>Sign Up</h1>
        <div>
          <input
            type="text"
            placeholder="First Name"
            className="infoInput"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className="infoInput"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Username (Your email)"
            className="infoInput"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            className="infoInput"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            className="infoInput"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <div className="password-guidelines">
            <p>Password must:</p>
            <ul>
              <li>Be at least 6 characters long</li>
              <li>Contain at least one number</li>
              <li>Contain at least one letter</li>
            </ul>
          </div>
        </div>
        <div className="signup-checkbox-div">
          <input
            type="checkbox"
            className="form-check-input"
            checked={isAccepted}
            onChange={() => setIsAccepted(!isAccepted)}
            id="policyCheck"
          />
          <label htmlFor="policyCheck">
            I agree with all the{" "}
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowTerms(true);
              }}
              className="terms-link"
            >
              Terms and Conditions
            </button>
            {" "}mentioned on this website and have gone through the rules in detail and hereby commit to abide by them at all times.
          </label>
        </div>

        <div className="signup-checkbox-div">
          <input
            type="checkbox"
            className="form-check-input"
            checked={ageChecked}
            onChange={() => setAgeChecked(!ageChecked)}
            id="ageCheck"
          />
          <label htmlFor="ageCheck">
            I certify that I am of legal age and am accessing this website on my freewill and in my complete conscious state of sound and mind.
          </label>
        </div>
        <div>
          <span style={{ fontSize: "12px", color: "#b3b3b3" }}>
            Already have an account? <Link to="/">Login</Link>
          </span>
        </div>

        <button 
          type="submit" 
          className="button infoButton" 
          disabled={!isSignupEnabled}
        >
          Sign Up
        </button>
      </form>

      {showTerms && (
        <TermsModal 
          isOpen={showTerms}
          onClose={() => setShowTerms(false)}
          termsAndConditions={termsAndConditions}
        />
      )}
    </div>
  );
}

const TermsModal = ({ isOpen, onClose, termsAndConditions }) => {
  const [expandedSections, setExpandedSections] = useState({});

  if (!isOpen) return null;

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content terms-modal">
        <h2 className="terms-title">Terms and Conditions</h2>
        <div className="terms-sections">
          {termsAndConditions.sections.map((section, index) => (
            <div key={index} className="terms-section">
              <div 
                className="section-header" 
                onClick={() => toggleSection(index)}
                aria-expanded={expandedSections[index]}
              >
                <h3>{section.title}</h3>
                <span className="expand-icon">
                  {expandedSections[index] ? '−' : '+'}
                </span>
              </div>
              {expandedSections[index] && (
                <div className="section-content">
                  <p>{section.content}</p>
                  {section.subsections && section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="subsection">
                      <h4>{subsection.title}</h4>
                      <p>{subsection.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export { Auth, SignUp };
