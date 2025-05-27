import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaUser, FaVenusMars, FaHeart, FaCamera, FaPlus, FaComment, FaRegHeart, FaEllipsisV, FaLock, FaGlobe, FaUserFriends, FaImage, FaCrown, FaStar, FaClock, FaTrash, FaThemeisle, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import axios from '../../utils/axios';
import './ViewProfile.css';
import CreatePostModal from '../../components/CreatePostModal/CreatePostModal';
import { toast } from 'react-hot-toast';
import UpgradeModal from '../../components/UpgradeModal/UpgradeModal';
import FollowList from '../../components/FollowList/FollowList';

// Add URL obfuscation
const obfuscateUrl = (url) => {
  if (!url) return url;
  if (url.startsWith(process.env.REACT_APP_BACKEND_URL)) {
    return url;
  }
  return atob(btoa(url));
};

// Add this function near the top after imports
const hideUrl = (url) => {
  if (!url) return url;
  if (url.startsWith(process.env.REACT_APP_BACKEND_URL)) {
    const randomId = Math.random().toString(36).substring(7);
    // Store real URL in memory but display fake one in DOM
    window[`__url_${randomId}`] = url;
    return `data:image/url,${randomId}`;
  }
  return url;
};

const ViewProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [bannerImage, setBannerImage] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPostModal, setShowPostModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [bannerPreview, setBannerPreview] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = id === currentUserId;
  const [profilePicture, setProfilePicture] = useState("/default-avatar.png");

  const [isCurrentUserFollowingUser, setIsCurrentUserFollowingUser] = useState(null);
  const [isFollowButtonEnabled, setDisableFollowButton] = useState(true);
  const [userFollowerCount, setUserFollowerCount] = useState(null);
  const [userFollowingCount, setUserFollowingCount] = useState(null);
  const [showFollowList, setShowFollowList] = useState(false);
  const [followListType, setFollowListType] = useState(null);
  const privacyIcons = {
    public: <FaGlobe />,
    friends: <FaUserFriends />,
    private: <FaLock />
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!id) {
          setError('Invalid profile ID');
          setLoading(false);
          return;
        }

        const profileResponse = await axios.get(`http://147.93.72.94:8080/api/users/${id}`, { withCredentials: true });
        
        if (!profileResponse.data) {
          setError('Failed to load profile data');
          return;
        }

        // Check if we have user data directly in the response
        const userData = profileResponse.data.user || profileResponse.data;
        if (!userData) {
          setError('User not found');
          return;
        }

        setProfile(userData);
          
        // Fetch additional profile data
        try {
          const additionalDataResponse = await axios.get(`http://147.93.72.94:8080/api/profile/${id}`, { withCredentials: true });
          if (additionalDataResponse.data.success && additionalDataResponse.data.profile) {
            setProfile(prev => ({
              ...prev,
              ...additionalDataResponse.data.profile
            }));
          }
        } catch (profileError) {
          // Don't set error here as we already have basic user data
        }

      } catch (error) {
        if (error.response?.status === 404) {
          setError('Profile not found');
        } else if (error.response?.status === 401) {
          setError('Please log in to view this profile');
        } else {
          setError(error.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://147.93.72.94:8080/api/posts/user/${id}`, { 
          withCredentials: true 
        });
        
        if (response.data.success) {
          // Get user details for each post
          const postsWithUserDetails = await Promise.all(response.data.posts.map(async (post) => {
            try {
              // Get post author details
              const postUserId = typeof post.userId === 'string' ? post.userId : post.userId._id;
              const userResponse = await axios.get(`http://147.93.72.94:8080/api/users/${postUserId}`, {
                withCredentials: true
              });
              
              // Get comment author details for each comment
              const commentsWithUsers = await Promise.all(post.comments.map(async (comment) => {
                try {
                  const commentUserId = typeof comment.userId === 'string' ? comment.userId : comment.userId._id;
                  const commentUserResponse = await axios.get(`http://147.93.72.94:8080/api/users/${commentUserId}`, {
                    withCredentials: true
                  });
                  return {
                    ...comment,
                    userId: commentUserResponse.data.user
                  };
                } catch (error) {
                  return {
                    ...comment,
                    userId: {
                      firstName: 'Unknown',
                      lastName: 'User',
                      profilePicture: '/default-avatar.png'
                    }
                  };
                }
              }));
              
              return {
                ...post,
                userId: userResponse.data.user,
                comments: commentsWithUsers
              };
            } catch (error) {
              return {
                ...post,
                userId: {
                  firstName: 'Unknown',
                  lastName: 'User',
                  profilePicture: '/default-avatar.png'
                }
              };
            }
          }));
          
          setPosts(postsWithUserDetails);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setPosts([]); // Set empty posts array if no posts found
        } else {
          toast.error('Failed to load posts');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPosts();
    }
  }, [id]);

  useEffect(() => {
    if (profile?.profilePicture) {
      setProfilePicture(getProfilePictureUrl(profile.profilePicture));
    } else {
      setProfilePicture("/default-avatar.png");
    }
  }, [profile]);

  useEffect(() => {
    const checkIfCurrentUserIsFollowingUser = async () => {
      if (!id || !currentUserId) return;

      try {
        const data = { "userId": currentUserId, "followedUserId": id };
        const response = await axios.post(`http://147.93.72.94:8080/api/connections/isFollowing`, data, {
          headers: {"Content-Type":"application/json"},  
          withCredentials: true 
        });
        if(response.status === 200){
          const isConnection = response.data.isConnection;
          if(isConnection != null){
            isConnection? setIsCurrentUserFollowingUser(true): setIsCurrentUserFollowingUser(false);
          }
        }
      } catch (error){
        toast.error('Error checking follow status');
      }
    };

    if(!isOwnProfile) {
      checkIfCurrentUserIsFollowingUser();
    }
  },[id, currentUserId, isOwnProfile]);

  useEffect(() => {
    const fetchFollowerNFollowingCountForUser = async () => {
      if (!id) return;
      
      try {
        const followersFollowingCountResponse = await axios.get(`http://147.93.72.94:8080/api/connections/getFollowersAndFollowings/${id}`,{ withCredentials: true });
        if(followersFollowingCountResponse.data.success){
          setUserFollowerCount(followersFollowingCountResponse.data.followersCount);
          setUserFollowingCount(followersFollowingCountResponse.data.followingsCount);
        }
      } catch (error) {
        toast.error('Failed to load follower counts');
      }
    };

    fetchFollowerNFollowingCountForUser();
  }, [id]);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > parseInt(process.env.REACT_APP_MAX_FILE_SIZE)) {
      toast.error(`File size exceeds ${parseInt(process.env.REACT_APP_MAX_FILE_SIZE) / (1024 * 1024)}MB limit`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await axios.post('http://147.93.72.94:8080/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      if (response.data.success) {
        setPhotos(prev => [...prev, response.data.url]);
        toast.success('Photo uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > parseInt(process.env.REACT_APP_MAX_FILE_SIZE)) {
      toast.error(`File size exceeds ${parseInt(process.env.REACT_APP_MAX_FILE_SIZE) / (1024 * 1024)}MB limit`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await axios.post('http://147.93.72.94:8080/api/upload/banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      if (response.data.success) {
        setBannerUrl(response.data.url);
        setBannerImage(response.data.url);
        toast.success('Banner uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload banner');
    }
  };

  const handleCreatePost = async (title, description, media, privacy = 'public') => {
    try {
      const formData = new FormData();
      formData.append('userId', id);
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
        const userResponse = await axios.get(`http://147.93.72.94:8080/api/users/${id}`, {
          withCredentials: true
        });

        // Add user details to the post
        const newPost = {
          ...response.data.post,
          userId: userResponse.data.user,
          comments: [],
          likes: []
        };

        setPosts(prevPosts => [newPost, ...prevPosts]);
        setShowCreatePostModal(false);
        toast.success('Post created successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await axios.post('http://147.93.72.94:8080/api/posts/like', {
        postId,
        userId: currentUserId
      }, { withCredentials: true });
      
      if (response.data.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? {
                  ...post,
                  likes: response.data.isLiked 
                    ? [...post.likes, currentUserId]
                    : post.likes.filter(id => id !== currentUserId)
                }
              : post
          )
        );
      }
    } catch (error) {
      toast.error('Error liking post');
    }
  };

  const toggleComments = (postuserId) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postuserId
          ? { ...post, showComments: !post.showComments }
          : post
      )
    );
  };

  const handleComment = async (e, postId) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post('http://147.93.72.94:8080/api/posts/comment', {
        postId,
        userId: currentUserId,
        content: newComment
      }, { withCredentials: true });

      if (response.data.success) {
        // Get user details for the new comment
        const userResponse = await axios.get(`http://147.93.72.94:8080/api/users/${currentUserId}`, {
          withCredentials: true
        });

        const newComment = {
          _id: response.data.comment._id,
          content: newComment,
          userId: userResponse.data.user,
          createdAt: new Date()
        };

        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? {
                  ...post,
                  comments: [...post.comments, newComment]
                }
              : post
          )
        );

        setNewComment('');
        toast.success('Comment added successfully');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await axios.delete(`http://147.93.72.94:8080/api/posts/${postId}`, { withCredentials: true });
      if (response.data.success) {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        toast.success('Post deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handlePhotoPreview = (photo) => {
    setSelectedPhoto(photo);
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

  const getSubscriptionStatus = (profile) => {
    if (!profile) return null;

    if (profile.plan === 'free') {
      return {
        status: 'Trial',
        daysLeft: calculateDaysLeft(profile.trialEndDate),
        isActive: true
      };
    }

    return {
      status: profile.plan,
      isActive: profile.subscriptionStatus === 'active'
    };
  };

  const handlePlanSelect = async (planId) => {
    try {
      const response = await axios.post('http://147.93.72.94:8080/api/subscription/select-plan', {
        userId: id,
        planId
      }, { withCredentials: true });

      if (response.data.success) {
        setSubscription(response.data.subscription);
        setShowUpgradeModal(false);
        toast.success('Plan selected successfully');
      }
    } catch (error) {
      toast.error('Failed to select plan');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const response = await axios.delete(`http://147.93.72.94:8080/api/posts/${postId}/comments/${commentId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? {
                  ...post,
                  comments: post.comments.filter(comment => comment._id !== commentId)
                }
              : post
          )
        );
        toast.success('Comment deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const getProfilePictureUrl = (picturePath) => {
    if (!picturePath) return "/default-avatar.png";
    if (picturePath === '/default-avatar.png') return picturePath;
    const url = picturePath.startsWith('http') ? picturePath : `${process.env.REACT_APP_BACKEND_URL}${picturePath}`;
    return hideUrl(url);
  };

  const handleFollowListClick = (type) => {
    setFollowListType(type);
    setShowFollowList(true);
  };

  const handleFollowButtonClick = async (event) => {
    event.preventDefault();
    if (!currentUserId || !id || isOwnProfile) return;

    setDisableFollowButton(true);
    try {
      const response = await axios.post('http://147.93.72.94:8080/api/connections/follow', {
        userId: currentUserId,
        followedUserId: id
      }, { withCredentials: true });

      if (response.data.success) {
        setIsCurrentUserFollowingUser(!isCurrentUserFollowingUser);
        // Update follower count
        setUserFollowerCount(prev => isCurrentUserFollowingUser ? prev - 1 : prev + 1);
        toast.success(isCurrentUserFollowingUser ? 'Unfollowed successfully' : 'Followed successfully');
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    } finally {
      setDisableFollowButton(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Oops!</h2>
          <p>{error}</p>
          <Link to="/feed" className="back-to-feed">
            <FaArrowLeft /> Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Profile Not Found</h2>
          <p>The profile you're looking for doesn't exist or has been removed.</p>
          <Link to="/feed" className="back-to-feed">
            <FaArrowLeft /> Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="profile-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="back-to-feed-header">
        <Link to="/feed?tab=following" className="back-link">
          <FaArrowLeft /> Back to Feed
        </Link>
      </div>

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-name-profile-pic">
            <img 
              src={getProfilePictureUrl(profile?.profilePicture)} 
              alt={`${profile?.firstName || 'User'}'s profile`}
              className="profile-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
            <div className="profile-name-wrapper">
              <h3>
                {profile.firstName} {profile.lastName}
                {(profile.verifiedBadge || profile.isVerified) && (
                  <span className="verified-badge" title="Verified Account">
                    <FaCheckCircle style={{ color: '#3897f0', marginLeft: '5px' }} />
                  </span>
                )}
              </h3>
              <div className="follower-following-info">
                <div 
                  className="follower-following-count"
                  onClick={() => handleFollowListClick('followers')}
                >
                  <span className="count-number">{userFollowerCount || 0}</span>
                  <span className="count-label">followers</span>
                </div>
                <div 
                  className="follower-following-count"
                  onClick={() => handleFollowListClick('following')}
                >
                  <span className="count-number">{userFollowingCount || 0}</span>
                  <span className="count-label">following</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Only show subscription status on own profile */}
          {isOwnProfile && (
            <div className="subscription-status">
              {(() => {
                const status = getSubscriptionStatus(profile);
                if (!status) return null;

                return (
                  <div className={`plan-banner ${status.type}`}>
                    <div className="plan-icon">
                      {status.type === 'free' ? (
                        <FaClock style={{ color: '#888' }} />
                      ) : (
                        status.icon
                      )}
                    </div>
                    <div className="plan-details">
                      <h3>{status.label}</h3>
                      <p>
                        {status.type === 'free' 
                          ? status.message
                          : status.message}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        

        {/* {if it's not own profile then show whether current user is following user displayed or not } */}
        { !isOwnProfile && isCurrentUserFollowingUser != null && (
          <div className="follow-unfollow">
            <button
            className="action-btn"
            onClick={handleFollowButtonClick}
            disabled = {!isFollowButtonEnabled}>
              { !isCurrentUserFollowingUser ? 'Follow' : 'Following'}
            </button>
          </div>
        )}

      </div>

      <div className="profile-grid">
        {/* Left Column - Basic Info */}
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
                <span>
                  {typeof profile.location === 'object' 
                    ? (profile.location.formatted_address || profile.location.city || 'Not specified')
                    : (profile.location || 'Not specified')}
                </span>
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

        {/* Right Column - Photos */}
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
                  src={`http://147.93.72.94:8080${photo}`} 
                  alt={`Photo ${index + 1}`}
                  onClick={() => handlePhotoPreview(photo)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="profile-section posts-section">
        <div className="posts-header">
          <h2>Posts</h2>
          {/* Only show create post button on own profile */}
          {isOwnProfile && (
            <button 
              className="create-post-btn"
              onClick={() => setShowCreatePostModal(true)}
            >
              <FaPlus /> Create Post
            </button>
          )}
        </div>
        
        <div className="posts-grid">
          {posts.map((post) => (
            <motion.div 
              key={post._id}
              className="post-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="post-header">
                <div className="user-info">
                  <img 
                    src={getProfilePictureUrl(post.userId?.profilePicture)}
                    alt={`${post.userId?.firstName || 'User'}'s profile`}
                    className="post-profile-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div className="user-details">
                    <h4>{post.userId?.firstName ? `${post.userId.firstName} ${post.userId.lastName}` : 'Anonymous User'}</h4>
                    <div className="post-meta">
                      <span className="post-time">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                      <span className="post-privacy">
                        {post.privacy === 'private' ? (
                          <FaLock title="Private" />
                        ) : post.privacy === 'friends' ? (
                          <FaUserFriends title="Friends Only" />
                        ) : (
                          <FaGlobe title="Public" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                {currentUserId === post.userId?._id && (
                  <button 
                    className="delete-post-btn"
                    onClick={() => handleDeletePost(post._id)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-description">{post.description}</p>
                
                {post.media && post.media.url && (
                  <div className="post-media">
                    {post.media.type === 'image' ? (
                      <img 
                        src={`http://147.93.72.94:8080${post.media.url}`} 
                        alt="Post content" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <video controls>
                        <source src={`http://147.93.72.94:8080${post.media.url}`} type="video/mp4" />
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
                  {post.likes.includes(currentUserId) ? <FaHeart /> : <FaRegHeart />}
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
                <div className="comments-section">
                  <div className="comments-list">
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="comment">
                        <div className="comment-header">
                          <div className="comment-user-info">
                            <img 
                              src={getProfilePictureUrl(comment.userId?.profilePicture)}
                              alt={`${comment.userId?.firstName || 'User'}'s profile`} 
                              className="comment-avatar"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                            <div className="comment-user-details">
                              <Link 
                                to={`/profile/${comment.userId?._id}`} 
                                className="comment-username-link"
                              >
                                <strong>
                                  {comment.userId?.firstName ? 
                                    `${comment.userId.firstName} ${comment.userId.lastName}` : 
                                    'Anonymous User'}
                                </strong>
                              </Link>
                              <span className="comment-time">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {comment.userId?._id === currentUserId && (
                            <button 
                              className="delete-comment-btn"
                              onClick={() => handleDeleteComment(post._id, comment._id)}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                        <p className="comment-content">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                  
                  <form onSubmit={(e) => handleComment(e, post._id)} className="comment-form">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit">Post</button>
                  </form>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>

    {/* Photo Preview Modal */}
    {selectedPhoto && (
      <motion.div 
        className="photo-preview-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedPhoto(null)}
      >
        <img src={`http://147.93.72.94:8080${selectedPhoto}`} alt="Preview" />
      </motion.div>
    )}

    {showPostModal && (
      <CreatePostModal 
        onClose={() => setShowPostModal(false)}
        onSubmit={handleCreatePost}
        useruserId={id}
      />
    )}

    {/* Only render modals if it's own profile */}
    {isOwnProfile && (
      <>
        {showUpgradeModal && (
          <UpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            onSelectPlan={handlePlanSelect}
          />
        )}
        {showCreatePostModal && (
          <CreatePostModal
            onClose={() => setShowCreatePostModal(false)}
            onSubmit={handleCreatePost}
            initialPrivacy="public"
          />
        )}
      </>
    )}

    {showFollowList && (
      <FollowList
        userId={id}
        type={followListType}
        onClose={() => setShowFollowList(false)}
      />
    )}
  </motion.div>
);
};

export default ViewProfile;
