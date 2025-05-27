import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaEllipsisV, FaLock, FaGlobe, FaUserFriends, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import './Feed.css';
import { toast } from 'react-hot-toast';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const currentUserId = localStorage.getItem('userId');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/posts', {
        withCredentials: true
      });
      if (response.data.success) {
        setPosts(response.data.posts);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      if (!currentUser) {
        toast.error('Please log in to like posts');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/posts/${postId}/like`,
        { userId: currentUser._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setPosts(posts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              likes: response.data.isLiked 
                ? [...(post.likes || []), currentUser._id]
                : (post.likes || []).filter(id => id !== currentUser._id)
            };
          }
          return post;
        }));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        setCurrentUser(null);
      } else {
        toast.error('Error liking post. Please try again.');
        console.error('Like error:', error);
      }
    }
  };

  const toggleComments = (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === postId 
          ? { ...post, showComments: !post.showComments }
          : post
      )
    );
  };

  const handleComment = async (e, postId) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`http://localhost:8080/api/posts/${postId}/comments`, {
        userId: currentUserId,
        content: newComment
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? {
                  ...post,
                  comments: [...post.comments, response.data.comment]
                }
              : post
          )
        );
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Please log in to comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8080/api/posts/${postId}/comments/${commentId}`,
        { withCredentials: true }
      );
      
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
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      {posts.map((post) => (
        <div key={post._id} className="post">
          <div className="user-info">
            <img 
              src={post.user?.profilePicture || '/default-avatar.png'} 
              alt={`${post.user?.username}'s avatar`} 
              className="user-avatar"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
            <div className="user-details">
              <h4>{post.user?.username || 'Anonymous'}</h4>
              <span className="post-time">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="post-content">
            <h3>{post.title}</h3>
            <p>{post.description}</p>
            {post.media && (
              <img 
                src={post.media} 
                alt="Post media" 
                className="post-media"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
          </div>
          <div className="post-actions">
            <button 
              onClick={() => handleLike(post._id)}
              className={`like-button ${post.likes?.includes(currentUserId) ? 'liked' : ''}`}
            >
              <i className="fas fa-heart"></i>
              <span>{post.likes?.length || 0}</span>
            </button>
            <button onClick={() => handleComment(post._id)} className="comment-button">
              <i className="fas fa-comment"></i>
              <span>{post.comments?.length || 0}</span>
            </button>
          </div>
          {post.comments?.map((comment) => (
            <div key={comment._id} className="comment">
              <img 
                src={comment.user?.profilePicture || '/default-avatar.png'} 
                alt={`${comment.user?.username}'s avatar`} 
                className="comment-avatar"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div className="comment-content">
                <h5>{comment.user?.username || 'Anonymous'}</h5>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Feed; 