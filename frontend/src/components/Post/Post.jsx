import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaEllipsisV, FaLock, FaGlobe, FaUserFriends } from 'react-icons/fa';
import "./Post.css";
import Comment from "../../img/comment.png";
import Share from "../../img/share.png";
import Heart from "../../img/like.png";
import NotLike from "../../img/notlike.png";

const Post = ({ post, onLike, currentUserId }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState('')
  const url = post.type === "image" ? `data:image/jpeg;base64,${post.media}` : `data:video/mp4;base64,${post.media}`;

  const privacyIcons = {
    public: <FaGlobe />,
    friends: <FaUserFriends />,
    private: <FaLock />
  };

  const handleLike = () => {
    onLike(post._id);
  };

  const handleComment = (e) => {
    e.preventDefault();
    // Add comment logic here
    setNewComment('');
  };

  const handleLikes = async () => {
    console.log("Attributes", post);
    const formData = {
      _id: post._id,
      userId: localStorage.getItem("userId")
    }
    const response = await fetch('http://localhost:8080/api/profile/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData),
    });
    console.log("like response", response)
    if (response.ok) {
      const resp = await response.json();
      console.log("Result : ", resp)
    }
  }

  return (
    <motion.div 
      className="post"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="post-header">
        <div className="post-user-info">
          <img 
            src={post.userId.photos?.[0] || '/default-avatar.png'} 
            alt="User" 
            className="user-avatar"
          />
          <div className="user-details">
            <h4>{`${post.userId.firstName} ${post.userId.lastName}`}</h4>
            <div className="post-meta">
              <span className="post-time">
                {new Date(post.createdAt).toLocaleString()}
              </span>
              <span className="post-privacy">
                {privacyIcons[post.privacy]}
              </span>
            </div>
          </div>
        </div>
        <button className="post-options">
          <FaEllipsisV />
        </button>
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.type !== 'text' && post.media && (
          <div className="post-media">
            {post.type === 'image' ? (
              <img src={url} alt="Post content" />
            ) : (
              <video controls>
                <source src={url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}
      </div>

      <div className="post-actions">
        <button 
          className={`action-button like-button ${post.likes.includes(currentUserId) ? 'liked' : ''}`}
          onClick={handleLike}
        >
          {post.likes.includes(currentUserId) ? <FaHeart /> : <FaRegHeart />}
          <span>{post.likes.length}</span>
        </button>
        <button 
          className="action-button comment-button"
          onClick={() => setShowComments(!showComments)}
        >
          <FaComment />
          <span>{post.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {post.comments.map((comment, index) => (
              <div key={index} className="comment">
                <img 
                  src={comment.userId.photos?.[0] || '/default-avatar.png'} 
                  alt="Commenter" 
                  className="commenter-avatar"
                />
                <div className="comment-content">
                  <h5>{`${comment.userId.firstName} ${comment.userId.lastName}`}</h5>
                  <p>{comment.content}</p>
                  <span className="comment-time">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        </div>
      )}
    </motion.div>
  );
};

export default Post;
