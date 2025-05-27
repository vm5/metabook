import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCamera,
  FaTrash,
  FaEdit,
  FaMapMarkerAlt,
  FaBriefcase,
  FaCalendarAlt,
  FaUserTag,
  FaImage,
  FaVideo,
  FaTimes,
  FaHeart,
  FaComment,
  FaCloudUploadAlt,
  FaEnvelope,
  FaArrowLeft
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './userProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    photos: []
  });
  const [previews, setPreviews] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const userId = localStorage.getItem('userid');
        console.log('Current userId:', userId);

        if (!userId) {
          setError('Please log in to view your profile');
          setLoading(false);
          return;
        }

        // First get the user data
        const userResponse = await axios.get(`http://localhost:8080/api/users/${userId}`,{ withCredentials: true });
        console.log('User data:', userResponse.data);

        // Then get their profile data
        const profileResponse = await axios.get(`http://localhost:8080/api/profile/${userId}`,{ withCredentials: true });
        console.log('Profile data:', profileResponse.data);

        // Combine user and profile data
        const combinedData = {
          ...userResponse.data,
          ...profileResponse.data
        };

        setProfile(combinedData);
      } catch (error) {
        console.error('Error fetching user and profile:', error);
        // Still set the user data even if profile fetch fails
        try {
          const userResponse = await axios.get(`http://localhost:8080/api/users/${localStorage.getItem('userid')}`,{ withCredentials: true });
          setProfile(userResponse.data);
        } catch (userError) {
          setError('Failed to load profile information');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, []);

  // Add a function to refresh profile data
  const refreshProfile = async () => {
    try {
      const userId = localStorage.getItem('userid');
      const response = await axios.get(`http://localhost:8080/api/profile/${userId}`,{ withCredentials: true });
      if (response.data) {
        console.log(response.data);
        //setProfile(response.data);
        //toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const fetchUserPosts = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/posts/user/${userId}`,{ withCredentials: true });
      console.log('User posts:', response.data);
      setUserPosts(response.data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      toast.error('Failed to load posts');
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length !== files.length) {
      toast.error('Please upload only images or videos');
    }

    setNewPost(prev => ({
      ...prev,
      photos: [...prev.photos, ...validFiles]
    }));

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, {
          url: reader.result,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    setNewPost(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newPost.title.trim() || !newPost.content.trim()) {
        toast.error('Please add both title and content');
        return;
    }

    const formData = new FormData();
    formData.append('userId', localStorage.getItem('userid'));
    formData.append('userName', localStorage.getItem('name'));
    formData.append('title', newPost.title);
    formData.append('content', newPost.content);
    newPost.photos.forEach(photo => {
      formData.append('photos', photo);
    });

    try {
        const response = await axios.post('http://localhost:8080/api/posts/create', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },  withCredentials: true 
        });

        if (response.data) {
            toast.success('Post created successfully!');
            setNewPost({ title: '', content: '', photos: [] });
            setPreviews([]);
            setShowCreatePost(false);
            fetchUserPosts(localStorage.getItem('userid'));
        }
    } catch (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
    }
  };

  const handleEdit = () => {
    const userId = localStorage.getItem('userid');
    navigate(`/editprofile/${userId}`);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`http://localhost:8080/api/posts/${postId}`,{ withCredentials: true });
      toast.success('Post deleted successfully');
      // Refresh posts
      fetchUserPosts(localStorage.getItem('userid'));
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleGalleryUpload = async (images) => {
    try {
      console.log('Uploading image:', images[0]);
      const formData = new FormData();
      formData.append('userId', localStorage.getItem('userid'));
      formData.append('userName', localStorage.getItem('name'));
      
      // Make sure the image path uses forward slashes
      const imagePath = images[0].path ? images[0].path.replace(/\\/g, '/') : images[0];
      formData.append('image', imagePath);

      const response = await axios.post('http://localhost:8080/api/profile/galleries/public', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true 
      });

      console.log('Upload response:', response.data);
      
      // After successful upload, update the image path in the gallery
      const gallerySection = document.querySelector('.galleries-grid');
      if (gallerySection) {
        const newGallery = document.createElement('div');
        newGallery.style.cssText = `
          background: #333;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          width: 100%;
          height: 200px;
          margin-bottom: 10px;
        `;
        
        newGallery.innerHTML = `
          <img 
            src="http://localhost:8080/${imagePath}"
            alt="Gallery" 
            style="width: 100%; height: 100%; object-fit: cover; display: block;"
          />
          <div style="position: absolute; bottom: 10px; left: 10px; display: flex; align-items: center; gap: 5px; color: white; background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 5px;">
            <i class="fas fa-user-circle"></i>
            <span>${localStorage.getItem('name')}</span>
          </div>
        `;
        
        gallerySection.insertBefore(newGallery, gallerySection.firstChild);
      }
    } catch (error) {
      console.error('Error uploading to gallery:', error);
    }
  };

  // Define handlePhotoUpload
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // You can add logic to upload the file to a server or update the state
      setProfilePicture(URL.createObjectURL(file));
      console.log('Photo uploaded:', file.name);
    }
  };

  // Add a debug button in development
  const debugStorage = () => {
    console.log('Current localStorage:', {
      userid: localStorage.getItem('userid'),
      email: localStorage.getItem('email'),
      token: localStorage.getItem('token')
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
        {process.env.NODE_ENV === 'development' && (
          <button onClick={debugStorage}>Debug Storage</button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-profile-container">
        <div className="profile-header">
          <button className="nav-button" onClick={() => navigate('/feed')}>
            <FaArrowLeft /> Back to Feed
          </button>
        </div>
        <h2>{error}</h2>
        <p>Debug info: {localStorage.getItem('email')}</p>
        <button className="edit-button" onClick={() => navigate('/editprofile')}>
          Create Profile
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="empty-profile-container">
        <div className="profile-header">
          <button className="nav-button" onClick={() => navigate('/feed')}>
            <FaArrowLeft /> Back to Feed
          </button>
        </div>
        <h2>No Profile Found</h2>
        <p>Create your profile to get started</p>
        <button className="edit-button" onClick={() => navigate('/editprofile')}>
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <button className="nav-button" onClick={() => navigate('/feed')}>
            <FaArrowLeft /> Back to Feed
          </button>
          <h1>{profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'My Profile'}</h1>
          <button className="edit-button" onClick={() => navigate('/editprofile')}>
            <FaEdit /> Edit Profile
          </button>
        </div>

        {/* Create Post Section */}
        <div className="create-post-section">
          <button 
           style={{
            backgroundColor: showCreatePost ? '#f87171' : '#1d4ed8', // Red when canceling, blue otherwise
            color: '#ffffff', // White text
            padding: '10px 20px',
            fontSize: '16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          onClick={() => setShowCreatePost(!showCreatePost)}
          onMouseOver={(e) =>
            (e.target.style.backgroundColor = showCreatePost ? '#f43f5e' : '#2563eb') // Darker shade on hover
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundColor = showCreatePost ? '#f87171' : '#1d4ed8') // Original color on mouse out
          }
           
          >
            {showCreatePost ? 'Cancel Post' : 'Create New Post'}
          </button>

          {showCreatePost && (
            <form onSubmit={handleCreatePost} className="create-post-form">
              <input
                type="text"
                placeholder="Post Title"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                className="post-input"
              />
              
              <textarea
                placeholder="What's on your mind?"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                className="post-input"
              />
              
              <div className="media-previews">
                {previews.map((preview, index) => (
                  <div key={index} className="media-preview-item">
                    {preview.type.startsWith('image/') ? (
                      <img src={preview.url} alt={`Preview ${index + 1}`} />
                    ) : (
                      <video src={preview.url} controls />
                    )}
                    <button 
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="remove-media-btn"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>

              <div className="post-actions">
                <div className="media-buttons">
                  <label className="media-button">
                    <FaImage />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMediaChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <label className="media-button">
                    <FaVideo />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleMediaChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <button type="submit" className="submit-post-btn">
                  Create Post
                </button>
              </div>
            </form>
          )}
        </div>

       

        {/* User's Posts Container */}
        <div className="user-posts-container">
          <h2>Your Posts</h2>
          {userPosts.length > 0 ? (
            <div className="posts-grid">
              {userPosts.map((post) => (
                <div key={post._id} className="post-card">
                  <div className="post-header">
                    <div className="post-user-info">
                      <span className="post-author">
                        {post.userName}
                        <span className="you-tag"> • You</span>
                      </span>
                      <span className="post-time">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeletePost(post._id)} 
                      className="delete-post-btn"
                    >
                      Delete
                    </button>
                  </div>

                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-content">{post.content}</p>

                  {post.photos && post.photos.length > 0 && (
                    <div className="post-media">
                      {post.photos.map((photo, index) => (
                        <img 
                          key={index} 
                          src={`http://localhost:8080/${photo}`} 
                          alt={`Post media ${index + 1}`} 
                        />
                      ))}
                    </div>
                  )}

                  <div className="post-stats">
                    <span>
                      <FaHeart /> {post.likes?.length || 0} likes
                    </span>
                    <span>
                      <FaComment /> {post.comments?.length || 0} comments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-posts-message">
              <p>You haven't created any posts yet.</p>
            </div>
          )}
        </div>

        {/* Basic Info Section */}
        <div className="profile-section basic-info">
          <div className="info-item">
            <span className="label">Age:</span>
            <span>{profile.age || 'Not specified'}</span>
          </div>
          <div className="info-item">
            <span className="label">Gender:</span>
            <span>{profile.gender || 'Not specified'}</span>
          </div>
          <div className="info-item">
            <span className="label">Orientation:</span>
            <span>{profile.orientation || 'Not specified'}</span>
          </div>
        </div>

        {/* Location Section */}
        <div className="profile-section location">
          <h2>
            <FaMapMarkerAlt /> Location
          </h2>
          <p>{profile.location || 'Not specified'}</p>
        </div>

       {/* Photos Section */}
  <div className="gallery-upload-section">
    <h2 className="gallery-header">
      <FaCamera /> Gallery
    </h2>
    <h3 className="gallery-title">Your Gallery</h3>

    {/* Upload Section */}
    <label className="upload-section" htmlFor="gallery-upload">
      <div className="upload-text">Click to upload your photos</div>
      <input
        type="file"
        id="gallery-upload"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={handlePhotoUpload}
      />
    </label>

    {/* Gallery Display */}
    <div className="gallery-upload">
      {profile.gallery && profile.gallery.length > 0 ? (
        <div className="photos-grid">
          {profile.gallery.map((photo, index) => (
            <div key={index} className="photo-item">
              <img
                src={photo.startsWith('http') ? photo : `http://localhost:8080${photo}`}
                alt={`Photo ${index + 1}`}
                className="profile-photo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-gallery-image.png';
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="no-photos">
          <p>No photos uploaded yet</p>
        </div>
      )}
    </div>
  </div>


        {/* Professional Info */}
        <div className="profile-section">
          <h2>
            <FaBriefcase /> Professional Info
          </h2>
          {profile.occupation && (
            <div className="info-item">
              <span className="label">Occupation:</span>
              <span>{profile.occupation}</span>
            </div>
          )}
          {profile.bio && (
            <div className="bio">
              <p>{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Services & Rates */}
        {profile.services && profile.services.length > 0 && (
          <div className="profile-section">
            <h2>Services & Rates</h2>
            <div className="services">
              <span className="label">Services:</span>
              <div className="tags">
                {profile.services.map((service, index) => (
                  <span key={index} className="tag">
                    {service}
                  </span>
                ))}
              </div>
            </div>
            {profile.rates && (
              <div className="info-item">
                <span className="label">Rates:</span>
                <span>{profile.rates}</span>
              </div>
            )}
          </div>
        )}

        {/* Availability */}
        <div className="profile-section">
          <h2>
            <FaCalendarAlt /> Availability
          </h2>
          <p>{profile.availability || 'Not specified'}</p>
        </div>

        {profile.role && profile.role.length > 0 && (
          <div className="roles">
            <span className="label">Roles:</span>
            <div className="tags">
              {profile.role.map((role, index) => (
                <span key={index} className="tag">
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="profile-section">
          <h2>Contact Information</h2>
          <div className="info-item">
            <FaEnvelope className="icon" />
            <span className="label">Email:</span>
            <span>{profile?.email || 'Not specified'}</span>
          </div>
        </div>

        {/* Debug information */}
        <div className="debug-info">
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;