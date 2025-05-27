// EditProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUpload, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './editprofile.css';

const EditProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [location, setLocation] = useState(formData?.location || '');

  useEffect(() => {
    const userId = localStorage.getItem('userid');
   

    setFormData({
      userId: userId,
      firstName: '',
      lastName: '',
      email: '',
      age: '',
      gender: '',
      location: '',
      orientation: '',
      bio: '',
      interests: [],
      services: [],
      rates: '',
      availability: '',
      occupation: '',
      role: [],
      gallery: []
    });

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/profile/${userId}`,{ withCredentials: true });
        console.log('Fetched profile:', response.data);
        setFormData(prev => ({
          ...prev,
          ...response.data,
          userId: userId
        }));
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('Coordinates:', latitude, longitude); // Debug coordinates
  
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
            {
              headers: {
                'User-Agent': 'Lucifer App (contact@example.com)'
              },
              withCredentials: true
            }
          );
  
          console.log('Raw API response:', response.data); // Debug full response
  
          const address = response.data.address;
          
          // More specific fallbacks for each field
          const locationDetails = {
            street: address.road || 
                   address.street || 
                   address.footway || 
                   address.path || '',
            
            houseNumber: address.house_number || 
                        address.building || '',
            
            neighborhood: address.suburb || 
                         address.neighbourhood || 
                         address.residential || '',
            
            city: address.city || 
                  address.town || 
                  address.village || 
                  address.suburb || 
                  address.district || '',
            
            district: address.county || 
                     address.district || 
                     address.state_district || '',
            
            state: address.state || '',
            
            postcode: address.postcode || 
                     address.postal_code || '',
            
            country: address.country || ''
          };
  
          // Only include parts that exist
          const addressParts = [];
          
          if (locationDetails.street) addressParts.push(locationDetails.street);
          if (locationDetails.houseNumber) addressParts.push(locationDetails.houseNumber);
          if (locationDetails.neighborhood) addressParts.push(locationDetails.neighborhood);
          if (locationDetails.city) addressParts.push(locationDetails.city);
          if (locationDetails.district) addressParts.push(locationDetails.district);
          if (locationDetails.state) addressParts.push(locationDetails.state);
          if (locationDetails.postcode) addressParts.push(locationDetails.postcode);
  
          const fullAddress = addressParts.join(', ');
  
          console.log('Processed location details:', locationDetails); // Debug processed data
          console.log('Final address:', fullAddress); // Debug final address
  
          if (fullAddress.trim()) {
            setLocation(fullAddress);
            setFormData(prev => ({
              ...prev,
              location: fullAddress,
              locationDetails: locationDetails
            }));
          } else {
            throw new Error('No address details found');
          }
  
        } catch (error) {
          console.error('Error getting location:', error);
          console.error('Error details:', error.response?.data); // Debug API errors
          setLocation('Unable to fetch location details');
        }
      }, (error) => {
        console.error('Geolocation permission error:', error);
        setLocation('Please enable location access');
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      setLocation('Geolocation not supported');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (e, field) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(item => item !== '')
    }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('photos', file);
    });

    try {
      setSaving(true);
      const response = await axios.post('http://localhost:8080/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true 
      });
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...response.data.paths]
      }));
      toast.success('Photos uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    const userId = localStorage.getItem('userid');
    e.preventDefault();
    setSaving(true);

    try {
      console.log('Submitting profile data:', formData);
      const response = await axios.put(`http://localhost:8080/api/profile/${userId || 'new'}`, formData,{ withCredentials: true });
      console.log('Profile update response:', response.data);
      
      if (response.data) {
        const profileId = response.data._id;
        localStorage.setItem('userid', profileId);
        console.log('Stored profile ID:', profileId);
        
        toast.success('Profile updated successfully');
        navigate(`/userprofile/${profileId}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-profile-container">
      <div className="navigation-bar">
        <button 
          className="nav-button back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        <h1>Edit Profile</h1>

        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-group">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
              required
              className="form-input"
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="Age"
              required
              min="18"
              max="100"
              className="form-input"
            />
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleInputChange}
              required
              className="form-select"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <select 
              name="orientation" 
              value={formData.orientation} 
              onChange={handleInputChange}
              required
              className="form-select"
            >
              <option value="">Select Orientation</option>
              <option value="Straight">Straight</option>
              <option value="Gay">Gay</option>
              <option value="Lesbian">Lesbian</option>
              <option value="Bisexual">Bisexual</option>
              <option value="Other">Other</option>
            </select>
            <div className="form-group">
              <label>Location</label>
              <div className="location-display">
                <FaMapMarkerAlt />
                <span>{location}</span>
              </div>
            </div>
          </div>

          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleInputChange}
            placeholder="Occupation"
            required
            className="form-input full-width"
          />
        </div>

        <div className="form-section">
          <h2>About Me</h2>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself..."
            rows="4"
            required
            className="form-textarea"
          />
        </div>

        <div className="form-section">
          <h2>Services & Rates</h2>
          <textarea
            name="services"
            value={formData.services.join(', ')}
            onChange={(e) => handleArrayInputChange(e, 'services')}
            placeholder="Enter services (comma separated)"
            rows="3"
            required
            className="form-textarea"
          />
          <textarea
            name="rates"
            value={formData.rates}
            onChange={handleInputChange}
            placeholder="Enter your rates"
            rows="3"
            required
            className="form-textarea"
          />
        </div>

        <div className="form-section">
          <h2>Availability</h2>
          <textarea
            name="availability"
            value={formData.availability}
            onChange={handleInputChange}
            placeholder="Enter your availability"
            rows="3"
            required
            className="form-textarea"
          />
        </div>

        <div className="form-section">
          <h2>Photos</h2>
          <div className="photo-upload">
            <label className="upload-button">
              <FaUpload />
              <span>Upload Photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="photos-preview">
            {formData.gallery.map((photo, index) => (
              <div key={index} className="photo-preview-card">
                <img 
                  src={`http://localhost:8080${photo}`} 
                  alt={`Preview ${index + 1}`} 
                />
                <button
                  type="button"
                  className="remove-photo"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      gallery: prev.gallery.filter((_, i) => i !== index)
                    }));
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className={`submit-button ${saving ? 'saving' : ''} ${saveSuccess ? 'success' : ''}`}
          disabled={saving}
        >
          {saving ? (
            <span className="saving-text">
              <span className="dots">...</span>
              Saving
            </span>
          ) : saveSuccess ? (
            <span className="success-text">
              <span className="check">✓</span>
              Saved
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;