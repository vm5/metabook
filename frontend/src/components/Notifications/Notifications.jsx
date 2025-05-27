import { useState, useEffect } from 'react';
import axios from 'axios';
import './Notifications.css';

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notifications/${userId}`,{ withCredentials: true });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="notifications-container">
      <h3 className="notifications-title">Notifications</h3>
      
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="no-notifications">No notifications yet</div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div 
              key={notification._id} 
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
            >
              <div className="notification-avatar">
                {notification.sender.profilePicture ? (
                  <img 
                    src={notification.sender.profilePicture} 
                    alt={notification.sender.name} 
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {notification.sender.name[0]}
                  </div>
                )}
              </div>
              
              <div className="notification-content">
                <p className="notification-text">
                  <span className="sender-name">{notification.sender.name}</span>
                  {notification.type === 'follow' ? ' started following you' : ''}
                </p>
                <span className="notification-time">
                  {formatTime(notification.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 