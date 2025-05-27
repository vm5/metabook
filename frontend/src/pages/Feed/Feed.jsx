// Feed.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaAd,
  FaSearch,
  FaHome, 
  FaVideo,
  FaBell,
  FaUserCircle, 
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaTrash,
  FaEdit,
  FaUser,
  FaVenusMars,
  FaBirthdayCake,
  FaGlobe,
  FaEnvelope,
  FaPhone,
  FaStar,
  FaBriefcase,
  FaCrown,
  FaArrowLeft,
  FaRegThumbsUp,
  FaThumbsUp,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaRegUserCircle,
  FaClock,
  FaUserFriends,
  FaLock,
  FaCog,
  FaCheckCircle
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Feed.css';
import { toast } from 'react-hot-toast';
import Search from '../../components/Search/Search';
import SideBarAds from '../../components/Ad/SideBarAds'
import AdCarousel from '../../components/AdCarousel';
import CommentSection from '../../components/CommentSection/CommentSection';

const obfuscateUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://localhost:8080')) {
    return url;
  }
  // Convert external URLs to base64
  return atob(btoa(url));
};

const hideUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://localhost:8080')) {
    const randomId = Math.random().toString(36).substring(7);
    // Store real URL in memory but display fake one in DOM
    window[`__url_${randomId}`] = url;
    return `data:image/url,${randomId}`;
  }
  return url;
};

const Feed = () => {
  const [generalPosts, setGeneralPosts] = useState([]);
  const [followingPosts, setFollowingPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  const [loading, setLoading] = useState(true);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    // Load initial tab from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'following') {
      setActiveTab('following');
    }
  }, []);

  useEffect(() => {
    const handleRefreshFeed = () => {
      console.log('Refreshing feed due to following status change');
      initializeFeed();
    };

    window.addEventListener('refreshFeed', handleRefreshFeed);

    return () => {
      window.removeEventListener('refreshFeed', handleRefreshFeed);
    };
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.log('No user ID found');
          setLoading(false);
          return;
        }

        if (activeTab === 'following') {
          await fetchFollowingPosts();
        } else {
          const response = await axios.get(`http://147.93.72.94:8080/api/posts?userId=${userId}`, {
            withCredentials: true
          });
          
          if (response.data.success && Array.isArray(response.data.posts)) {
            setGeneralPosts(response.data.posts);
          } else {
            console.error('Invalid response format for general posts:', response.data);
            setGeneralPosts([]);
          }
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to fetch posts');
        if (activeTab === 'following') {
          setFollowingPosts([]);
        } else {
          setGeneralPosts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab]);

  const initializeFeed = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log('No user ID found');
        setLoading(false);
        return;
      }
      setCurrentUserId(userId);

      // Fetch current user data
      try {
        const userResponse = await axios.get(`http://147.93.72.94:8080/api/users/${userId}`, {
          withCredentials: true
        });
        
        if (userResponse.data && userResponse.data.user) {
          const userData = userResponse.data.user;
          setCurrentUser(userData);
          
          if (userData.profilePicture) {
            setCurrentUserProfilePic(getProfilePictureUrl(userData.profilePicture));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      // Fetch following posts first since we're having issues with them
      try {
        console.log('Fetching following posts for user:', userId);
        const followingResponse = await axios.get(`http://147.93.72.94:8080/api/posts/following/${userId}`, {
          withCredentials: true
        });

        if (followingResponse.data && followingResponse.data.posts) {
          const validPosts = followingResponse.data.posts.filter(post => post && post._id);
          console.log('Following posts fetched:', validPosts);
          setFollowingPosts(validPosts);
        }
      } catch (error) {
        console.error('Error fetching following posts:', error);
        setFollowingPosts([]);
      }

      // Then fetch general posts
      try {
        const generalResponse = await axios.get(`http://147.93.72.94:8080/api/posts?userId=${userId}`, {
          withCredentials: true
        });

        if (generalResponse.data && generalResponse.data.posts) {
          setGeneralPosts(generalResponse.data.posts);
        }
      } catch (error) {
        console.error('Error fetching general posts:', error);
        setGeneralPosts([]);
      }
    } catch (error) {
      console.error('Error initializing feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeFeed();
  }, []);

  const [profile, setProfile] = useState(null);
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState("/default.jpg");

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSearchSuggestion, setFilteredSearchSuggestions] = useState([]);
  const [searchLoading, searchLoadingSuggestion] = useState(false);

  const [users, setUsers] = useState([]);

  const handleLogout = async () => {
    try {
      console.log("calling logout");
      const response = await axios.post('http://147.93.72.94:8080/api/users/logout', {}, { 
        withCredentials: true 
      });
      
      if (response.data.success) {
        console.log("logged out successfully");
        // Clear local storage and session storage
        localStorage.clear();
        sessionStorage.clear();
        // Redirect to login page
        window.location.href = '/';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error("error while logout:", error);
      // Even if the server request fails, clear local data and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await axios.post('http://147.93.72.94:8080/api/posts/like', {
        postId,
        userId: localStorage.getItem('userId')
      },{ withCredentials: true });
      
      if (response.data.success) {
        setGeneralPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? {
                  ...post,
                  likes: response.data.isLiked 
                    ? [...post.likes, localStorage.getItem('userId')]
                    : post.likes.filter(id => id !== localStorage.getItem('userId'))
                }
              : post
          )
        );
        setFollowingPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? {
                  ...post,
                  likes: response.data.isLiked 
                    ? [...post.likes, localStorage.getItem('userId')]
                    : post.likes.filter(id => id !== localStorage.getItem('userId'))
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const toggleComments = (postId) => {
    setGeneralPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? { ...post, showComments: !post.showComments }
          : post
      )
    );
    setFollowingPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? { ...post, showComments: !post.showComments }
          : post
      )
    );
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await axios.delete(`http://147.93.72.94:8080/api/posts/${postId}`,{ withCredentials: true });
      if (response.data.success) {
        setGeneralPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        setFollowingPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEditPost = (postId) => {
    // Implement edit functionality
    console.log('Edit post:', postId);
  };

  const handleReportPost = async (postId) => {
    try {
      const response = await axios.post(`http://147.93.72.94:8080/api/posts/${postId}/report`, {
        userId: localStorage.getItem('userId'),
        reason: 'Inappropriate content' // You could add a reason selector in the UI
      },{ withCredentials: true });
      
      if (response.data.success) {
        toast.success('Post reported successfully');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Failed to report post');
    }
  };

  const ViewProfileModal = ({ userId, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
      const fetchProfileAndPosts = async () => {
        try {
          // Fetch profile
          const profileResponse = await axios.get(`http://147.93.72.94:8080/api/users/${userId}`,{ withCredentials: true });
          setProfile(profileResponse.data.user);

          // Fetch user's posts
          const postsResponse = await axios.get(`http://147.93.72.94:8080/api/posts/user/${userId}`,{ withCredentials: true });
          if (postsResponse.data.success) {
            setUserPosts(postsResponse.data.posts);
          }

          // Fetch subscription
          const subResponse = await axios.get(`http://147.93.72.94:8080/api/users/${userId}/subscription`,{ withCredentials: true });
          if (subResponse.data.success) {
            setSubscription(subResponse.data.subscription);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfileAndPosts();
    }, [userId]);

    return (
      <div className="profile-modal" onClick={onClose}>
        <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
          <button className="close-modal" onClick={onClose}>×</button>
          
          {loading ? (
            <div className="loading-spinner"></div>
          ) : profile ? (
            <>
              <div className="profile-header">
                <FaUserCircle size={60} color="var(--accent)" />
                <div className="profile-info">
                  <h2 className="profile-name">{`${profile.firstName} ${profile.lastName}`}</h2>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-item">
                  <FaUser className="detail-icon" />
                  <span><strong>Age:</strong> {profile.age || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <FaVenusMars className="detail-icon" />
                  <span><strong>Gender:</strong> {profile.gender || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <FaMapMarkerAlt className="detail-icon" />
                  <span><strong>Location:</strong> {profile.location || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <FaHeart className="detail-icon" />
                  <span><strong>Sexuality:</strong> {profile.sexuality || 'Not specified'}</span>
                </div>
              </div>

              {subscription && (
                <div className="subscription-info">
                  <h3>Subscription Plan</h3>
                  <div className="plan-details">
                    <div className="plan-name">
                      {subscription.planName === 'free' ? (
                        <>
                          <FaClock className="detail-icon" />
                          <span>
                            {subscription.trialEndDate ? (
                              `Free Trial - ${calculateDaysLeft(subscription.trialEndDate)} days remaining`
                            ) : (
                              'Free Trial - Trial period ended'
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <FaCrown className="detail-icon" />
                          <span>{subscription.planName}</span>
                        </>
                      )}
                    </div>
                    <div className="plan-status">
                      Status: <span className={`status ${subscription.status}`}>
                        {subscription.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {profile.photos && profile.photos.length > 0 && (
                <div className="profile-photos">
                  <h3>Photos</h3>
                  <div className="photos-grid">
                    {profile.photos.map((photo, index) => (
                      <div key={index} className="photo-item">
                        <img src={photo} alt={`Photo ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="profile-posts">
                <h3>Posts</h3>
                {userPosts.length > 0 ? (
                  userPosts.map(post => (
                    <div key={post._id} className="post-card">
                      <p>{post.content}</p>
                      {post.media && (
                        <div className="post-media">
                          <img src={`http://localhost:8080${post.media}`} alt="Post" />
                        </div>
                      )}
                      <div className="post-footer">
                        <span><FaHeart /> {post.likes.length}</span>
                        <span><FaComment /> {post.comments.length}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-posts-message">
                    <p>No posts available</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="error-message">Profile not found</div>
          )}
        </div>
      </div>
    );
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    if (userId) {
      navigate(`/viewprofile/${userId}`, { replace: false });
    }
  };

  const handleViewProfile = (userId) => {
    if (!userId) {
      console.error('No userId provided');
      return;
    }

    // Extract the ID if userId is an object
    const profileId = userId._id || userId;
    
    if (!profileId) {
      console.error('Invalid userId format:', userId);
      return;
    }

    console.log('Navigating to profile:', profileId);
    navigate(`/viewprofile/${profileId}`);
  };

  const renderUsersList = () => {
    return (
      <div className="users-list-section">
  
        <div className="users-grid">
          {users.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-card-header">
                <FaUserCircle className="user-avatar" />
                <div className="user-card-info">
                  <h4>{user.firstName} {user.lastName}</h4>
                  <span>{user.location || 'Location not specified'}</span>
                </div>
              </div>
              <button 
                className="view-profile-btn"
                onClick={() => handleViewProfile(user._id)}
              >
                <FaUser /> View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MobileNavigation = ({ currentUserId, handleProfileClick, handleViewProfile }) => {
    return (
      <div className="mobile-nav">
        <div className="mobile-nav-item active">
          <FaHome />
          <span>Home</span>
        </div>
        <div 
          className="mobile-nav-item"
          onClick={handleProfileClick}
        >
          <FaUserCircle />
          <span>My Profile</span>
        </div>
        <div className="mobile-nav-item">
          <FaUserFriends />
          <span>Community</span>
          <span className="coming-soon-label">Soon</span>
        </div>
        <div 
          className="mobile-nav-item"
          onClick={() => setShowSettings(true)}
        >
          <FaCog />
          <span>Settings</span>
        </div>
      </div>
    );
  };

  const privacyIcons = {
    public: <FaGlobe title="Public" />,
    followers: <FaUserFriends title="Followers Only" />,
    private: <FaLock title="Private" />
  };

  const getProfilePictureUrl = (picturePath) => {
    if (!picturePath) return "/default-avatar.png";
    if (picturePath === '/default-avatar.png') return picturePath;
    const url = picturePath.startsWith('http') ? picturePath : `http://localhost:8080${picturePath}`;
    return hideUrl(url);
  };

  const displayPosts = () => {
    const posts = activeTab === 'general' ? generalPosts : followingPosts;
    
    if (!posts || posts.length === 0) {
      return (
        <div className="no-posts-message">
          <h3>No Posts Available</h3>
          <p>
            {activeTab === 'general' 
              ? 'Be the first to share something!' 
              : 'Start following people to see their posts here!'}
          </p>
        </div>
      );
    }

    return posts.map((post) => {
      // Ensure post.userId exists and has required fields
      const userData = post.userId || {
        _id: null,
        firstName: 'Anonymous',
        lastName: 'User',
        profilePicture: null,
        verifiedBadge: false
      };

      const handleUserClick = (e) => {
        e.stopPropagation();
        if (userData._id) {
          navigate(`/viewprofile/${userData._id}`);
        }
      };

      return (
        <div key={post._id} className="post-card">
          <div className="post-header">
            <div className="user-info">
              {getProfilePictureUrl(userData.profilePicture) ? (
                <img 
                  src={getProfilePictureUrl(userData.profilePicture)}
                  alt={`${userData.firstName || 'Anonymous'}'s profile`}
                  className="post-profile-img"
                  onClick={handleUserClick}
                  style={{ cursor: 'pointer' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
              ) : (
                <div 
                  className="post-profile-icon"
                  onClick={handleUserClick}
                  style={{ cursor: 'pointer' }}
                >
                  <FaUserCircle size={40} />
                </div>
              )}
              <div 
                className="user-details clickable" 
                onClick={handleUserClick}
                style={{ cursor: 'pointer' }}
              >
                <h4>
                  {userData.firstName && userData.lastName 
                    ? `${userData.firstName} ${userData.lastName}`
                    : 'Anonymous User'}
                  {userData.verifiedBadge && (
                    <span className="verified-badge" title="Verified Account">
                      <FaCheckCircle style={{ color: '#3897f0', marginLeft: '5px' }} />
                    </span>
                  )}
                </h4>
                <span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="post-meta">
              <span className="privacy-indicator" title={`This post is ${post.privacy}`}>
                {privacyIcons[post.privacy]}
              </span>
            </div>
          </div>

          <div className="post-content">
            <h3 className="post-title">{post.title}</h3>
            <p className="post-description">{post.description}</p>
            
            {post.media && post.media.url && (
              <div className="post-media">
                {post.media.type === 'image' ? (
                  <img 
                    src={`http://localhost:8080${post.media.url}`} 
                    alt="Post content" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <video controls>
                    <source src={`http://localhost:8080${post.media.url}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </div>

          <div className="post-actions">
            <button 
              className={`action-btn ${post.likes.includes(currentUserId) ? 'liked' : ''}`}
              onClick={() => handleLike(post._id)}
            >
              {post.likes.includes(currentUserId) ? <FaThumbsUp /> : <FaRegThumbsUp />}
              <span>{post.likes.length}</span>
            </button>

            <button 
              className="action-btn"
              onClick={() => toggleComments(post._id)}
            >
              <FaComment />
              <span>{post.comments.length}</span>
            </button>
          </div>

          {post.showComments && (
            <CommentSection 
              postId={post._id} 
              currentUser={{
                _id: currentUserId,
                firstName: currentUser?.firstName,
                lastName: currentUser?.lastName,
                profilePicture: currentUser?.profilePicture,
                verifiedBadge: currentUser?.verifiedBadge
              }}
              onUserClick={(userId) => navigate(`/viewprofile/${userId}`)}
            />
          )}
        </div>
      );
    });
  };

  const handleAccountDisable = async () => {
    try {
      const response = await axios.post(
        `http://147.93.72.94:8080/api/users/${currentUserId}/disable`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success('Account temporarily disabled');
        handleLogout();
      }
    } catch (error) {
      console.error('Error disabling account:', error);
      toast.error('Failed to disable account');
    }
  };

  const handleAccountDelete = async () => {
    try {
      const response = await axios.delete(
        `http://147.93.72.94:8080/api/users/${currentUserId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success('Account deleted successfully');
        handleLogout();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const SettingsModal = ({ onClose }) => {
    const [showConfirmDisable, setShowConfirmDisable] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <h2>Account Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
          
          <div className="settings-options">
            <div className="settings-option">
              <h3><FaClock /> Temporarily Disable Account</h3>
              <p>
                Your account will be hidden from other users and your content won't be visible. 
                You can reactivate your account at any time by logging back in.
              </p>
              <button 
                className="warning-btn"
                onClick={() => setShowConfirmDisable(true)}
              >
                <FaLock /> Disable Account
              </button>
            </div>

            <div className="settings-option">
              <h3><FaTrash /> Delete Account Permanently</h3>
              <p>
                This will permanently delete your account and all your data. This includes:
                • All your posts and comments
                • Your profile information
                • Your connections.
                This action cannot be undone.
              </p>
              <button 
                className="danger-btn"
                onClick={() => setShowConfirmDelete(true)}
              >
                <FaTrash /> Delete Account
              </button>
            </div>
          </div>

          {showConfirmDisable && (
            <div className="confirmation-dialog">
              <h3>Confirm Account Disable</h3>
              <p>Are you sure you want to temporarily disable your account? You can reactivate it anytime by logging back in.</p>
              <div className="confirmation-buttons">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowConfirmDisable(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn"
                  onClick={handleAccountDisable}
                >
                  Confirm Disable
                </button>
              </div>
            </div>
          )}

          {showConfirmDelete && (
            <div className="confirmation-dialog">
              <h3>Confirm Account Deletion</h3>
              <p>This action is permanent and cannot be undone. All your data will be permanently deleted.</p>
              <div className="confirmation-buttons">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn"
                  onClick={handleAccountDelete}
                >
                  Delete Forever
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const fetchFollowingPosts = async () => {
    try {
      console.log('Fetching following posts...');
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log('No user ID available');
        return;
      }
      
      const response = await axios.get(`http://147.93.72.94:8080/api/posts/following/${userId}`, {
        withCredentials: true
      });
      
      console.log('Following posts response:', response.data);
      
      // Check if response.data.posts exists and is an array
      if (response.data && response.data.posts && Array.isArray(response.data.posts)) {
        const posts = response.data.posts;
        setFollowingPosts(posts);
      } else {
        console.error('Invalid response format for following posts:', response.data);
        setFollowingPosts([]);
      }
    } catch (error) {
      console.error('Error fetching following posts:', error);
      toast.error('Failed to fetch posts from people you follow');
      setFollowingPosts([]);
    }
  };

  const calculateDaysLeft = (trialEndDate) => {
    if (!trialEndDate) return 0;
    
    const endDate = new Date(trialEndDate);
    const now = new Date();
    
    // Calculate the time difference in milliseconds
    const timeDiff = endDate - now;
    
    // Convert to days and round down
    const daysLeft = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
    
    return daysLeft;
  };

  useEffect(() => {
    const images = document.querySelectorAll('img[src^="data:image/url"]');
    images.forEach(img => {
      const randomId = img.src.split(',')[1];
      const realUrl = window[`__url_${randomId}`];
      if (realUrl) {
        // Create a new image element with the real URL
        const realImg = new Image();
        realImg.onload = () => {
          img.src = realUrl;
          // Clean up the stored URL
          delete window[`__url_${randomId}`];
        };
        realImg.src = realUrl;
      }
    });
  }, [generalPosts, followingPosts]);

  const handleCreatePost = async (title, description, media, privacy = 'public') => {
    try {
      const formData = new FormData();
      formData.append('userId', currentUserId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('privacy', privacy);
      
      if (media) {
        formData.append('media', media);
      }

      const response = await axios.post('http://147.93.72.94:8080/api/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }, 
        withCredentials: true 
      });

      if (response.data.success) {
        // Get user details for the new post
        const userResponse = await axios.get(`http://147.93.72.94:8080/api/users/${currentUserId}`, {
          withCredentials: true
        });

        // Add user details and privacy to the post data
        const newPost = {
          ...response.data.post,
          userId: userResponse.data.user,
          privacy: privacy,
          comments: [],
          likes: []
        };

        setGeneralPosts(prevPosts => [newPost, ...prevPosts]);
        setShowCreatePostModal(false);
        toast.success('Post created successfully!');
      }
    } catch (error) {
      console.error('Error creating post:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="fb-container">
      {/* Header */}
      <div className="fb-header">
        <div className="fb-header-left">
          <div className="fb-brand">Metabook</div>
          <Search />
        </div>

        <div className="fb-header-right">
          {/* Desktop view */}
          <div className="user-welcome">
            <span>Hello {currentUser?.firstName || 'User'}, welcome to Metabook!</span>
          </div>
          <div 
            className="fb-icon-button"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
          </div>

          {/* Mobile view */}
          <div className="mobile-user-menu">
            <div 
              className="fb-icon-button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <FaUserCircle />
            </div>
            {showMobileMenu && (
              <div className="mobile-menu-dropdown">
                <div className="mobile-menu-item">
                  <span>Hello, {currentUser?.firstName || 'User'}</span>
                </div>
                <div 
                  className="mobile-menu-item"
                  onClick={handleProfileClick}
                >
                  <FaUser />
                  <span>My Profile</span>
                </div>
                <div className="mobile-menu-item">
                  <FaUserFriends />
                  <span>Communities</span>
                  <span className="coming-soon-label">Coming Soon</span>
                </div>
                <div className="mobile-menu-item">
                  <FaVideo />
                  <span>Live Streams</span>
                  <span className="coming-soon-label">Coming Soon</span>
                </div>
                <div className="mobile-menu-item">
                  <FaBell />
                  <span>Notifications</span>
                  <span className="coming-soon-label">Coming Soon</span>
                </div>
                <div 
                  className="mobile-menu-item"
                  onClick={() => setShowSettings(true)}
                >
                  <FaCog />
                  <span>Settings</span>
                </div>
                <div 
                  className="mobile-menu-item"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="fb-main">
        {/* Left Sidebar */}
        <div className="fb-sidebar-left">
          <div className="sidebar-nav">
            <div className="menu-item profile-item">
              {getProfilePictureUrl(currentUser?.profilePicture) ? (
                <img 
                  src={getProfilePictureUrl(currentUser?.profilePicture)}
                  alt={`${currentUser?.firstName || 'User'}'s profile`}
                  className="sidebar-profile-img"
                  onClick={handleProfileClick}
                />
              ) : (
                <div className="sidebar-profile-icon">
                  <FaUserCircle size={50} />
                </div>
              )}
              <div className="profile-info">
                <span className="profile-name">{currentUser?.firstName || 'User'}</span>
                <span className="profile-welcome">Welcome back!</span>
              </div>
            </div>
            <div className="menu-item active">
              <FaHome />
              <span>Home</span>
            </div>
            <div 
              className="menu-item" 
              onClick={handleProfileClick}
              style={{ cursor: 'pointer' }}
            >
              <FaUserCircle />
              <span>My Profile</span>
            </div>
            <div className="menu-item">
              <FaUserFriends />
              <span>Communities</span>
              <span className="coming-soon-label">Coming Soon</span>
            </div>
            <div className="menu-item">
              <FaVideo />
              <span>Live Streams</span>
              <span className="coming-soon-label">Coming Soon</span>
            </div>
            <div className="menu-item">
              <FaBell />
              <span>Notifications</span>
              <span className="coming-soon-label">Coming Soon</span>
            </div>
            <div 
              className="menu-item"
              onClick={() => setShowSettings(true)}
              style={{ cursor: 'pointer' }}
            >
              <FaCog />
              <span>Settings</span>
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="fb-feed">
          {viewingUserId ? (
            <>
              <button 
                className="back-to-feed"
                onClick={() => setViewingUserId(null)}
              >
                <FaArrowLeft /> Back to Feed
              </button>
              <ProfileView userId={viewingUserId} />
            </>
          ) : (
            <>
              <div className="feed-tabs">
                <button 
                  className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
                  onClick={() => handleTabChange('general')}
                >
                  General
                </button>
                <button 
                  className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
                  onClick={() => handleTabChange('following')}
                >
                  People You Follow
                </button>
              </div>

              <div className="posts-container">
                {displayPosts()}
              </div>

              {/* Mobile Ads Section */}
              {window.innerWidth <= 768 && (
                <div className="mobile-ads-section">
                  <div className="ad-container">
                    <div className="ad-header">
                      <h3>Advertise With Us</h3>
                      <span className="ad-sponsored">Contact Us</span>
                    </div>
                    <div className="ad-carousel">
                      <div className="ad-item">
                        <div className="ad-item-content">
                          <img src="https://picsum.photos/400/200" alt="Advertise with us" className="ad-image" />
                          <h4 className="ad-item-title">Promote Your Business</h4>
                          <p className="ad-item-description">Want to reach our growing community? Contact us to discuss advertising opportunities and rates.</p>
                          <a 
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=support@teamMetabook.com&su=Advertising%20Inquiry&body=Hi%20Team%20Metabook%2C%0A%0AI'm%20interested%20in%20advertising%20on%20your%20platform.%20Please%20provide%20more%20information%20about%20advertising%20opportunities%20and%20rates.%0A%0ABest%20regards"
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="ad-item-cta"
                          >Contact for Advertising</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - Advertising Section - Only show on desktop */}
        {window.innerWidth > 768 && (
          <div className="fb-sidebar-right">
            <div className="ad-container">
              <div className="ad-header">
                <h3>Advertise With Us</h3>
                <span className="ad-sponsored">Contact Us</span>
              </div>
              <div className="ad-carousel">
                <div className="ad-item">
                  <div className="ad-item-content">
                    <img src="https://picsum.photos/400/200" alt="Advertise with us" className="ad-image" />
                    <h4 className="ad-item-title">Promote Your Business</h4>
                    <p className="ad-item-description">Want to reach our growing community? Contact us to discuss advertising opportunities and rates.</p>
                    <a 
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=support@teamMetabook.com&su=Advertising%20Inquiry&body=Hi%20Team%20Metabook%2C%0A%0AI'm%20interested%20in%20advertising%20on%20your%20platform.%20Please%20provide%20more%20information%20about%20advertising%20opportunities%20and%20rates.%0A%0ABest%20regards"
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="ad-item-cta"
                    >Contact for Advertising</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="fb-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">Metabook</div>
            <p>Connect and Share</p>
          </div>
          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>Email: support@teamMetabook.com</p>
          </div>
          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-links">
              <div className="social-link-item">
                <FaFacebook />
                <span className="coming-soon-label">Coming Soon</span>
              </div>
              <div className="social-link-item">
                <FaTwitter />
                <span className="coming-soon-label">Coming Soon</span>
              </div>
              <div className="social-link-item">
                <FaInstagram />
                <span className="coming-soon-label">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Metabook. All rights reserved.</p>
        </div>
      </footer>

      {viewingProfile && (
        <ViewProfileModal 
          userId={viewingProfile} 
          onClose={() => setViewingProfile(null)} 
        />
      )}

      {/* Mobile Navigation */}
      {window.innerWidth <= 768 && (
        <div className="mobile-nav">
          <div className="mobile-nav-item active">
            <FaHome />
            <span>Home</span>
          </div>
          <div 
            className="mobile-nav-item"
            onClick={handleProfileClick}
          >
            <FaUserCircle />
            <span>Profile</span>
          </div>
          <div className="mobile-nav-item">
            <FaVideo />
            <span>Live</span>
            <span className="coming-soon-label">Soon</span>
          </div>
          <div className="mobile-nav-item">
            <FaBell />
            <span>Alerts</span>
            <span className="coming-soon-label">Soon</span>
          </div>
          <div 
            className="mobile-nav-item"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <FaCog />
            <span>More</span>
          </div>
        </div>
      )}

      {showMobileMenu && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)} />
          <div className="mobile-menu-dropdown">
            <div className="mobile-menu-item">
              <span>Hello, {currentUser?.firstName || 'User'}</span>
            </div>
            <div 
              className="mobile-menu-item"
              onClick={handleProfileClick}
            >
              <FaUser />
              <span>My Profile</span>
            </div>
            <div className="mobile-menu-item">
              <FaUserFriends />
              <span>Communities</span>
              <span className="coming-soon-label">Coming Soon</span>
            </div>
            <div className="mobile-menu-item">
              <FaVideo />
              <span>Live Streams</span>
              <span className="coming-soon-label">Coming Soon</span>
            </div>
            <div className="mobile-menu-item">
              <FaBell />
              <span>Notifications</span>
              <span className="coming-soon-label">Coming Soon</span>
            </div>
            <div 
              className="mobile-menu-item"
              onClick={() => setShowSettings(true)}
            >
              <FaCog />
              <span>Settings</span>
            </div>
            <div 
              className="mobile-menu-item"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </div>
          </div>
        </>
      )}

      {/* Add Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

const ProfileView = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [profilePicture, setProfilePicture] = useState("/default.jpg");
  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileResponse = await axios.get(`http://147.93.72.94:8080/api/users/${userId}`,{ withCredentials: true });
        if (profileResponse.data.success) {
          setProfile(profileResponse.data.user);
          
          // Fetch additional profile data
          const additionalDataResponse = await axios.get(`http://147.93.72.94:8080/api/profile/${userId}`,{ withCredentials: true });
          if (additionalDataResponse.data.success) {
            setProfile(prev => ({
              ...prev,
              ...additionalDataResponse.data.profile
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  useEffect(() => {
    if (profile?.profilePicture && profile.profilePicture.length !== 0) {
      setProfilePicture(`http://localhost:8080${profile?.profilePicture}`);
    }
  },[profile]);

  const handlePhotoPreview = (photo) => {
    setSelectedPhoto(photo);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return null;

  return (
    <motion.div 
      className="profile-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="profile-container">
        <div className="profile-header">
          <img 
              src={profilePicture} 
              alt={profile?.firstName} 
              className="profile-image"
            />
          <h1>{profile.firstName} {profile.lastName}</h1>
        </div>

        <div className="profile-grid">
          {/* Basic Info */}
          <div className="profile-section info-section">
            <h2>Basic Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <FaUser className="info-icon" />
                <div className="info-content">
                  <label>Age</label>
                  <span>{profile.age || 'Not specified'}</span>
                </div>
              </div>
              <div className="info-item">
                <FaVenusMars className="info-icon" />
                <div className="info-content">
                  <label>Gender</label>
                  <span>{profile.gender || 'Not specified'}</span>
                </div>
              </div>
              <div className="info-item">
                <FaMapMarkerAlt className="info-icon" />
                <div className="info-content">
                  <label>Location</label>
                  <span>{profile.location || 'Not specified'}</span>
                </div>
              </div>
              <div className="info-item">
                <FaHeart className="info-icon" />
                <div className="info-content">
                  <label>Sexuality</label>
                  <span>{profile.sexuality || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="profile-section photos-section">
            <h2>Photos</h2>
            <div className="photos-grid">
              {profile.photos && profile.photos.map((photo, index) => (
                <motion.div 
                  key={index}
                  className="photo-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <img 
                    src={`http://localhost:8080${photo}`} 
                    alt={`Photo ${index + 1}`}
                    onClick={() => handlePhotoPreview(photo)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add photo preview modal */}
      {selectedPhoto && (
        <div 
          className="photo-preview-modal"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="photo-preview-content">
            <img 
              src={`http://localhost:8080${selectedPhoto}`} 
              alt="Preview"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Feed;
