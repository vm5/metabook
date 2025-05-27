import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Sprofile.css';

const SProfile = () => {
  const navigate = useNavigate();
  const userid = localStorage.getItem('userid');
  const [profileData, setProfileData] = useState({
    bio: '',
    location: '',
    work: '',
    education: '',
    relationship: '',
    interests: [],
    socialLinks: {}
  });

  useEffect(() => {
    if (!userid) {
      navigate('/login');
      return;
    }
    checkExistingProfile();
  }, [userid, navigate]);

  const checkExistingProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/users/${userid}`,{ withCredentials: true });
      if (response.data) {
        // If profile exists, redirect to the user profile page
        navigate(`/profile/${userid}`);
      }
    } catch (error) {
      // If profile doesn't exist, stay on this page to create one
      console.log('No existing profile found, ready to create new profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:8080/api/users/${userid}/profile`, profileData, { withCredentials: true });
      
      if (response.data) {
        toast.success('Profile created successfully!');
        navigate(`/profile/${userid}`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="profile-setup-container">
      <h1>Set Up Your Profile</h1>
      <p>Tell us a bit about yourself</p>
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Bio</label>
          <textarea
            name="bio"
            value={profileData.bio}
            onChange={handleChange}
            placeholder="Write something about yourself..."
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={profileData.location}
            onChange={handleChange}
            placeholder="Where are you based?"
          />
        </div>

        <div className="form-group">
          <label>Work</label>
          <input
            type="text"
            name="work"
            value={profileData.work}
            onChange={handleChange}
            placeholder="What do you do?"
          />
        </div>

        <div className="form-group">
          <label>Education</label>
          <input
            type="text"
            name="education"
            value={profileData.education}
            onChange={handleChange}
            placeholder="Your education background"
          />
        </div>

        <div className="form-group">
          <label>Relationship Status</label>
          <select
            name="relationship"
            value={profileData.relationship}
            onChange={handleChange}
          >
            <option value="">Select status</option>
            <option value="Single">Single</option>
            <option value="In a relationship">In a relationship</option>
            <option value="Married">Married</option>
          </select>
        </div>

        <button type="submit" className="create-profile-btn">
          Create Profile
        </button>
      </form>
    </div>
  );
};

export default SProfile;