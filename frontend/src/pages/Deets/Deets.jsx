import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  FaCamera, 
  FaMapMarkerAlt, 
  FaBriefcase, 
  FaCheck, 
  FaCrown,
  FaTrash 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Deets.css';

const SuccessOverlay = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="success-overlay"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="success-content"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="success-icon"
        >
          <FaCheck />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Profile Updated Successfully!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Redirecting to feed...
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5 }}
          className="progress-bar"
        />
      </motion.div>
    </motion.div>
  );
};

const subscriptionPlans = [
  {
    name: 'Trial-Free 60 days trial',
    price: '$0/month',
    features: [
      'Profile Creation with Badge (on Trial)',
      'Full Profile Visibility',
      'Basic Passport Access',
      '1 Status Story per day',
      '5 Tags',
      '10 Blogs',
      'Pics and Videos: 200 MB Space',
      'Basic Social Media Connectors',
      'Advanced Matching',
      'Limited Messages',
      '3 Photo Uploads'
    ],
    background: '#1a1a1a',
    borderColor: '#333'
  },
  {
    name: 'Beginner',
    price: '$5/month',
    features: [
     'Profile Creation with Badge Beginner',
      'Limited Profile Visibility',
      'Passport: NA',
      'Status Story: NA',
      'Tagging: NA',
      'Blogs: NA',
      'Pics and Videos: 200 MB Space',
      'Social Media Connectors: NA',
      'Advanced Matching',
      'Unlimited Messages',
      '4 Photo Uploads',
      'See Who Likes You'
    ],
    background: '#1a1a1a',
    borderColor: '#333'
  },
  {
    name: 'Professional',
    price: '$15/month',
    features: [
      'Profile Creation with Badge Pro',
      'Custom Profile Visibility',
      '5 Passports',
      '1 Status Story per day',
      '10 Tags',
      '20 Blogs',
      'Pics and Videos: 300 MB Space',
      'Social Media Connectors: Available',
      'Priority Matching',
      'Unlimited Everything',
      '6 Photo Uploads',
      'Advanced Analytics',
      'Profile Boost'
    ],
    background: '#1a1a1a',
    borderColor: '#333'
  }
];

const ProfileEdit = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();


  const [profile, setProfile] = useState({
    plan: 'free',
    firstName: '',
    lastName: '',
    age: '',
    location: '',
    gender: '',
    sexuality: '',
    bio: '',
    interests: [],
    photos: []
  });

  const interestOptions = [
    'Travel', 'Music', 'Movies', 'Reading', 'Sports',
    'Cooking', 'Photography', 'Art', 'Gaming', 'Fitness',
    'Technology', 'Nature', 'Dancing', 'Writing', 'Yoga',
    'Fashion', 'Food', 'Pets', 'Cars', 'Politics',
    'Science', 'History', 'Languages', 'Meditation', 'Business'
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoUpload,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 6,
    multiple: true
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/feed');
      return;
    }
    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('No user ID found');
      }

      const response = await axios.get(
        `http://147.93.72.94:8080/api/profile/${userId}`,
        {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        const profileData = response.data.profile;
        setProfile(prev => ({
          ...prev,
          ...profileData,
          interests: profileData.interests || []
        }));
      } else {
        throw new Error(response.data?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 404) {
        console.log('New profile will be created on save');
      } else {
        setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
        toast.error('Failed to load profile');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          ...(subChild 
            ? { 
                [child]: {
                  ...prev[parent][child],
                  [subChild]: value
                }
              }
            : { [child]: value })
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubscriptionSelect = (planName) => {
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(now.getDate() + 60); // 60 days trial
    
    setProfile(prev => ({
      ...prev,
      plan: planName.toLowerCase(),
      trialStartDate: now,
      trialEndDate: trialEndDate
    }));
    
    setCurrentStep(4);
  };

  const handleInterestToggle = (interest) => {
    setProfile(prev => {
      const currentInterests = prev.interests || [];
      return {
        ...prev,
        interests: currentInterests.includes(interest)
          ? currentInterests.filter(i => i !== interest)
          : [...currentInterests, interest]
      };
    });
  };

  async function handlePhotoUpload(acceptedFiles) {
    if (acceptedFiles.length + profile.photos.length > 6) {
      toast.error('Maximum 6 photos allowed');
      return;
    }

    setLoading(true);
    setError(null);

    for (const file of acceptedFiles) {
      try {
        // Validate file size before upload
        if (file.size > 5 * 1024 * 1024) { // 5MB
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB`);
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }

        // Create FormData and append file
        const formData = new FormData();
        formData.append('photo', file);

        // Log formData contents for debugging
        console.log('FormData contents:', file.name, file.type, file.size);

        let retries = 0;
        let success = false;
        let response;

        // Try up to 3 times if upload fails
        while (retries < 3 && !success) {
          try {
            response = await axios.post(
              'http://147.93.72.94:8080/api/profile/upload-photo',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                  const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                  setUploadProgress(percentCompleted);
                },
                // Increase timeout to 30 seconds
                timeout: 30000
              }
            );
            success = true;
          } catch (uploadError) {
            retries++;
            console.warn(`Upload attempt ${retries} failed:`, uploadError);
            
            if (retries >= 3) {
              throw uploadError;
            }
            
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Check response
        if (!response?.data || !response.data.success) {
          console.error('Upload response:', response?.data);
          throw new Error(response?.data?.message || 'Upload failed');
        }

        // Update profile with new photo
        const updatedPhotos = [...profile.photos, response.data.url];
        setProfile(prev => ({
          ...prev,
          photos: updatedPhotos
        }));

        // Save photos to profile in database
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User ID not found');
        }

        await axios.post(
          `http://147.93.72.94:8080/api/profile/update/${userId}`,
          { photos: updatedPhotos },
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        toast.success(`${file.name} uploaded successfully`);
      } catch (err) {
        console.error('Upload error:', err);
        const errorMessage = err.response?.data?.message || err.message;
        setError(`Failed to upload ${file.name}: ${errorMessage}`);
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }

    setLoading(false);
    setUploadProgress(0);
  }

  const handlePhotoDelete = async (index, photoUrl) => {
    try {
      const userId = localStorage.getItem('userId');
      // Extract filename from the full URL
      const filename = photoUrl.split('/').pop();
      
      await axios.delete(`http://147.93.72.94:8080/api/profile/photo/${userId}/${filename}`,{ withCredentials: true });
      
      setProfile(prev => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      }));
      toast.success('Photo deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete photo');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const sessionId = localStorage.getItem('sessionId') || Date.now().toString();
      const profileData = {
        userId,
        sessionId,
        plan: profile.plan,
        firstName: profile.firstName,
        lastName: profile.lastName,
        age: profile.age,
        location: profile.location,
        gender: profile.gender,
        sexuality: profile.sexuality,
        bio: profile.bio,
        interests: profile.interests,
        photos: profile.photos,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const response = await axios.post(
        'http://147.93.72.94:8080/api/profile/create', 
        profileData,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Store user data
        localStorage.setItem('firstName', profileData.firstName);
        localStorage.setItem('sessionId', sessionId);
        
        // Show success message and overlay
        setShowSuccess(true);
        
        // Add a delay before navigation to show the success message
        setTimeout(() => {
          navigate('/feed');
        }, 3000);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessComplete = () => {
    navigate('/feed');
  };

  const fetchLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's coordinates
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Store coordinates even if geocoding fails
      const coordinates = {
        latitude,
        longitude
      };

      try {
        // Make request to OpenStreetMap without restricted headers
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            withCredentials: false // Keep credentials false for CORS
          }
        );

        const { address } = response.data;
        const city = address.city || address.town || address.village || address.suburb;
        const state = address.state;
        const country = address.country;
        
        const locationString = `${city || ''}, ${state || ''}, ${country || ''}`.replace(/^,\s*|,\s*$/g, '');
        setProfile(prev => ({ 
          ...prev, 
          location: locationString,
          coordinates 
        }));
      } catch (geocodingError) {
        console.error('Geocoding failed:', geocodingError);
        // Still save the coordinates even if geocoding fails
        setProfile(prev => ({ 
          ...prev, 
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          coordinates 
        }));
        toast.warning('Could not get address details. Saving coordinates instead.');
      }
    } catch (error) {
      console.error('Location fetch error:', error);
      setError('Could not fetch location. Please check your browser permissions and try again.');
      toast.error('Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
      calculateProgress();
    } else {
      toast.error('Please complete all required fields');
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Plan Selection
        return profile.plan;
      case 2: // Personal Details
        return profile.firstName && profile.lastName && profile.age && 
               profile.gender && profile.sexuality && profile.location;
      case 3: // Photos
        return profile.photos.length > 0;
      case 4: // Interests
        return profile.interests.length > 0;
      default:
        return false;
    }
  };

  const calculateProgress = () => {
    const totalSteps = 4;
    setProgress((currentStep / totalSteps) * 100);
  };

  return (
    <div className="profile-edit-container">
      <AnimatePresence>
        {showSuccess && <SuccessOverlay onComplete={handleSuccessComplete} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-edit-card"
      >
        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            <span className="progress-text">{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Step 1: Plan Selection */}
        {currentStep === 1 && (
          <motion.div 
            className="subscription-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2>Choose Your Plan</h2>
            <p className="select-plan-text">Please select a plan to continue</p>
            <p className="select-plan-text">Please note that you cannot change your details once you have filled them here</p>
            <div className="subscription-grid">
              {subscriptionPlans.map((plan) => (
                <div 
                  key={plan.name}
                  className={`subscription-card ${profile.plan === plan.name.toLowerCase() ? 'selected' : ''}`}
                  style={{ 
                    background: plan.background,
                    borderColor: profile.plan === plan.name.toLowerCase() ? '#00c6ff' : plan.borderColor 
                  }}
                  onClick={() => setProfile({...profile, plan: plan.name.toLowerCase()})}
                >
                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <div className="price">{plan.price}</div>
                  </div>
                  <div className="plan-features">
                    {plan.features.map((feature, index) => (
                      <p key={index}>
                        <span className="feature-check">✓</span>
                        {feature}
                      </p>
                    ))}
                  </div>
                  <div className="plan-select-indicator">
                    {profile.plan === plan.name.toLowerCase() ? (
                      <span className="selected-text">Selected Plan</span>
                    ) : (
                      <span className="select-text">Click to Select</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Personal Details */}
        {currentStep === 2 && (
          <motion.div 
            className="form-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3>Personal Details</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="First Name"
                value={profile.firstName}
                onChange={(e) => setProfile({...profile, firstName: e.target.value})}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={profile.lastName}
                onChange={(e) => setProfile({...profile, lastName: e.target.value})}
              />
              <input
                type="number"
                placeholder="Age"
                value={profile.age}
                onChange={(e) => setProfile({...profile, age: e.target.value})}
              />
            </div>
            <div className="location-group">
              <input
                type="text"
                placeholder="Your Location"
                value={profile.location}
                readOnly
              />
              <button 
                className="fetch-location-btn"
                onClick={fetchLocation}
                disabled={loading}
              >
                {loading ? 'Fetching...' : 'Get Location'}
              </button>
            </div>
            <div className="input-group">
              <select
                value={profile.gender}
                onChange={(e) => setProfile({...profile, gender: e.target.value})}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
              <select
                value={profile.sexuality}
                onChange={(e) => setProfile({...profile, sexuality: e.target.value})}
              >
                <option value="">Select Sexuality</option>
                <option value="straight">Straight</option>
                <option value="gay">Gay</option>
                <option value="lesbian">Lesbian</option>
                <option value="bisexual">Bisexual</option>
                <option value="pansexual">Pansexual</option>
                <option value="asexual">Asexual</option>
                <option value="other">Other</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Step 3: Photo Upload */}
        {currentStep === 3 && (
          <motion.div 
            className="photos-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h3>Upload Photos</h3>
            <p className="upload-info">Upload up to 6 photos. First photo will be your profile picture.</p>
            
            <div className="photos-grid">
              {/* Existing Photos */}
              {profile.photos.map((photo, index) => (
                <div key={index} className="photo-item">
                  <img 
                    src={`http://localhost:8080${photo}`} 
                    alt={`Upload ${index + 1}`} 
                  />
                  <button 
                    className="delete-photo"
                    onClick={() => handlePhotoDelete(index, photo)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}

              {/* Upload Dropzone */}
              {profile.photos.length < 6 && (
                <div 
                  {...getRootProps()} 
                  className={`dropzone ${isDragActive ? 'active' : ''}`}
                >
                  <input {...getInputProps()} />
                  <div className="upload-placeholder">
                    <FaCamera size={24} />
                    <p>Drag photos here or click to upload</p>
                    {loading && (
                      <div className="upload-progress">
                        <div 
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                        <span>{uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}
            
            <div className="upload-requirements">
              <p>Requirements:</p>
              <ul>
                <li>Maximum 6 photos</li>
                <li>Supported formats: JPG, PNG, WEBP</li>
                <li>Maximum size: 5MB per photo</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Step 4: Interests */}
        {currentStep === 4 && (
          <motion.div 
            className="interests-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h3>Select Your Interests</h3>
            <p className="interests-info">Select at least 3 interests that define you</p>
            
            <div className="interests-grid">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  className={`interest-tag ${profile.interests.includes(interest) ? 'active' : ''}`}
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>

            {profile.interests.length > 0 && (
              <div className="selected-interests">
                <p>Selected: {profile.interests.length}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="button-container">
          {currentStep > 1 && (
            <button 
              className="nav-button"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Previous
            </button>
          )}
          <button 
            className="nav-button"
            onClick={currentStep === 4 ? handleSubmit : handleNext}
            disabled={loading}
          >
            {currentStep === 4 ? 'Create Profile' : 'Next'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileEdit;
