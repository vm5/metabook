import React, { useState } from 'react';
import { FaTimes, FaImage, FaGlobe, FaUserFriends, FaCamera, FaVideo } from 'react-icons/fa';
import './CreatePostModal.css';
import { toast } from 'react-hot-toast';

const CreatePostModal = ({ onClose, onSubmit, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState(null);
  const [privacy, setPrivacy] = useState('public');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const privacyOptions = [
    {
      value: 'public',
      label: 'Post to General Feed',
      icon: <FaGlobe />,
      description: 'Everyone can see this post'
    },
    {
      value: 'followers',
      label: 'Post to Followers',
      icon: <FaUserFriends />,
      description: 'Only your followers can see this post'
    }
  ];

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('privacy', privacy);
      
      if (media) {
        formData.append('media', media);
      }

      await onSubmit(title, description, media, privacy);
      
      // Clear form and close modal
      setTitle('');
      setDescription('');
      setMedia(null);
      setMediaPreview(null);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Post</h2>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          
          <textarea
            placeholder="What's on your mind?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="privacy-options">
            {privacyOptions.map((option) => (
              <div
                key={option.value}
                className={`privacy-option ${privacy === option.value ? 'selected' : ''}`}
                onClick={() => setPrivacy(option.value)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setPrivacy(option.value);
                  }
                }}
              >
                <div className="privacy-icon">
                  {option.icon}
                </div>
                <div className="privacy-details">
                  <h4>{option.label}</h4>
                  <p>{option.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="media-upload">
            <label htmlFor="media-input" className="media-label">
              {media?.type?.startsWith('image/') ? <FaCamera /> : <FaVideo />}
              {media ? 'Change Media' : 'Add Photo/Video'}
            </label>
            <input
              id="media-input"
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              style={{ display: 'none' }}
            />
          </div>

          {mediaPreview && (
            <div className="media-preview">
              {media.type.startsWith('image/') ? (
                <img src={mediaPreview} alt="Preview" />
              ) : (
                <video src={mediaPreview} controls />
              )}
              <button 
                type="button" 
                onClick={() => {
                  setMedia(null);
                  setMediaPreview(null);
                }}
                className="remove-media"
              >
                <FaTimes />
              </button>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : (privacy === 'public' ? 'Share to Feed' : 'Share with Followers')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal; 