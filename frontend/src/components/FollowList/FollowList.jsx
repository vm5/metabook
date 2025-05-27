import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaTimes, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import './FollowList.css';
import { useNavigate } from 'react-router-dom';

const FollowList = ({ userId, type, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const fetchUsers = async () => {
    try {
      const endpoint = type === 'followers' 
        ? `http://localhost:8080/api/connections/followers/${userId}`
        : `http://localhost:8080/api/connections/following/${userId}`;

      const response = await axios.get(endpoint, { withCredentials: true });
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/viewprofile/${userId}`);
    onClose();
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture || profilePicture === '/default-avatar.png') {
      return null;
    }
    return profilePicture.startsWith('http') ? profilePicture : `http://localhost:8080${profilePicture}`;
  };

  const getLocationString = (location) => {
    if (!location) return null;
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return location.formatted_address || location.city || null;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="follow-list-modal">
        <div className="follow-list-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="follow-list-modal" onClick={onClose}>
      <div className="follow-list-content" onClick={e => e.stopPropagation()}>
        <div className="follow-list-header">
          <h2>{type === 'followers' ? 'Followers' : 'Following'}</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="users-list">
          {users.length === 0 ? (
            <div className="no-users-message">
              {type === 'followers' 
                ? 'No followers yet' 
                : 'Not following anyone yet'}
            </div>
          ) : (
            users.map(user => (
              <div 
                key={user._id} 
                className="user-item"
                onClick={() => handleUserClick(user._id)}
              >
                <div className="user-info">
                  {getProfilePictureUrl(user.profilePicture) ? (
                    <img 
                      src={getProfilePictureUrl(user.profilePicture)}
                      alt={`${user.firstName}'s profile`}
                      className="user-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <FaUserCircle className="user-avatar-icon" />
                  )}
                  <div className="user-details">
                    <span className="user-name">
                      {user.firstName} {user.lastName}
                      {user.verifiedBadge && (
                        <FaCheckCircle className="verified-badge" />
                      )}
                    </span>
                    {getLocationString(user.location) && (
                      <span className="user-location">{getLocationString(user.location)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowList; 