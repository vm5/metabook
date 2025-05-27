import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaUserCircle, FaReply } from 'react-icons/fa';
import './CommentSection.css';

const CommentSection = ({ postId, currentUser, onUserClick }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [mentionListVisible, setMentionListVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/posts/${postId}/comments`);
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const handleMentionSearch = async (searchText) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/users/search?q=${searchText}`);
      setMentionResults(response.data.users);
      setMentionListVisible(true);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const insertMention = (user) => {
    const beforeMention = newComment.substring(0, cursorPosition).replace(/@\w*$/, '');
    const afterMention = newComment.substring(cursorPosition);
    const mention = `@[${user.firstName} ${user.lastName}](${user._id})`;
    
    setNewComment(beforeMention + mention + afterMention);
    setMentionListVisible(false);
    setMentionResults([]);
    
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setNewComment(text);
    setCursorPosition(e.target.selectionStart);

    const lastAtSymbol = text.lastIndexOf('@', cursorPosition);
    if (lastAtSymbol !== -1) {
      const searchText = text.substring(lastAtSymbol + 1, cursorPosition);
      if (searchText) {
        handleMentionSearch(searchText);
      }
    } else {
      setMentionListVisible(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`http://localhost:8080/api/posts/${postId}/comments`, {
        userId: currentUser._id,
        content: newComment,
        parentCommentId: replyTo?.commentId
      });

      if (response.data.success) {
        setNewComment('');
        setReplyTo(null);
        await fetchComments(); // Refresh comments after adding new one
        toast.success(replyTo ? 'Reply added successfully' : 'Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleReply = (comment) => {
    setReplyTo({
      commentId: comment._id,
      userName: `${comment.userId.firstName} ${comment.userId.lastName}`
    });
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setNewComment('');
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture || profilePicture === '/default-avatar.png') {
      return null;
    }
    return profilePicture.startsWith('http') ? profilePicture : `http://localhost:8080${profilePicture}`;
  };

  const renderComment = (comment, isReply = false, depth = 0) => {
    if (!comment || !comment.userId) {
      return null;
    }

    const user = {
      _id: comment.userId._id || null,
      firstName: comment.userId.firstName || 'Deleted',
      lastName: comment.userId.lastName || 'User',
      profilePicture: comment.userId.profilePicture || null,
      verifiedBadge: comment.userId.verifiedBadge || false
    };
    
    const profilePic = getProfilePictureUrl(user.profilePicture);

    return (
      <div 
        key={comment._id} 
        className={`comment ${isReply ? 'reply' : ''}`}
        style={{ marginLeft: isReply ? `${depth * 20}px` : '0' }}
      >
        <div className="comment-header">
          <div 
            className="comment-user-info"
            onClick={() => user._id ? onUserClick(user._id) : null}
            style={{ cursor: user._id ? 'pointer' : 'default' }}
          >
            {profilePic ? (
              <img 
                src={profilePic}
                alt={`${user.firstName}'s avatar`}
                className="comment-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
            ) : (
              <FaUserCircle className="comment-avatar-icon" size={32} />
            )}
            <div className="comment-user-details">
              <span className="comment-user-name">
                {user.firstName} {user.lastName}
                {user.verifiedBadge && <span className="verified-badge">✓</span>}
              </span>
              <span className="comment-time">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="comment-content">
          {comment.content}
          {comment.mentions && comment.mentions.length > 0 && (
            <div className="comment-mentions">
              {comment.mentions.map(mention => {
                if (!mention || !mention._id) return null;
                return (
                  <span 
                    key={mention._id}
                    className="mention"
                    onClick={() => onUserClick(mention._id)}
                  >
                    @{mention.firstName} {mention.lastName}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="comment-actions">
          <button 
            onClick={() => handleReply(comment)} 
            className="reply-button"
          >
            <FaReply /> Reply
          </button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-section">
            {comment.replies.map(reply => renderComment(reply, true, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="comment-section">
      <div className="comments-container">
        {comments.map(comment => renderComment(comment))}
      </div>

      <form onSubmit={handleSubmitComment} className="comment-form">
        {replyTo && (
          <div className="reply-indicator">
            <span>Replying to {replyTo.userName}</span>
            <button type="button" onClick={handleCancelReply} className="cancel-reply">
              ×
            </button>
          </div>
        )}
        
        <div className="comment-input-container">
          <textarea
            ref={commentInputRef}
            value={newComment}
            onChange={handleInputChange}
            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
            className="comment-input"
          />
          
          {mentionListVisible && mentionResults.length > 0 && (
            <div className="mention-list">
              {mentionResults.map(user => (
                <div
                  key={user._id}
                  className="mention-item"
                  onClick={() => insertMention(user)}
                >
                  {getProfilePictureUrl(user.profilePicture) ? (
                    <img 
                      src={getProfilePictureUrl(user.profilePicture)}
                      alt={`${user.firstName}'s avatar`}
                      className="mention-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <FaUserCircle className="mention-avatar-icon" size={24} />
                  )}
                  <span>{user.firstName} {user.lastName}</span>
                  {user.verifiedBadge && <span className="verified-badge">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-comment"
          disabled={!newComment.trim()}
        >
          {replyTo ? 'Reply' : 'Comment'}
        </button>
      </form>
    </div>
  );
};

export default CommentSection; 