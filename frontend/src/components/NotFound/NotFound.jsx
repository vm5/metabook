import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <FaExclamationTriangle className="not-found-icon" />
        <h1>Oops!</h1>
        <h2>The page you were looking for isn't there</h2>
        <p>You might have followed a broken link or entered a URL that doesn't exist on this site.</p>
        <Link to="/feed" className="home-button">
          <FaHome /> Back to Feed
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 