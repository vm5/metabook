import { useState, useEffect } from 'react';
import axios from 'axios';
import './Follow.css';

const Follow = ({ profileUserId, currentUserId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollingCount] = useState(0);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await axios.get(`/api/users/${profileUserId}/follow-status`, {
          params: { currentUserId },
          withCredentials: true
        });
        setIsFollowing(response.data.isFollowing);
        setFollowersCount(response.data.followersCount);
        setFollingCount(response.data.followingCount);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [profileUserId, currentUserId]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await axios.post(`/api/users/unfollow/${profileUserId}`,{ withCredentials: true });
        setFollowersCount(prev => prev - 1);
      } else {
        await axios.post(`/api/users/follow/${profileUserId}`,{ withCredentials: true });
        setFollowersCount(prev => prev + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    }
  };

  return (
    <div className="follow-container">
      <div className="follow-stats">
        <div className="stat-item">
          <span className="stat-count">{followersCount}</span>
          <span className="stat-label">Followers</span>
        </div>
        <div className="stat-item">
          <span className="stat-count">{followingCount}</span>
          <span className="stat-label">Following</span>
        </div>
      </div>
      
      {currentUserId !== profileUserId && (
        <button 
          className={`follow-button ${isFollowing ? 'following' : ''}`}
          onClick={handleFollow}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
};

export default Follow; 