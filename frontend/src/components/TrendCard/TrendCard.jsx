import React from 'react';
import { motion } from 'framer-motion';
import { FaExclamationCircle } from 'react-icons/fa';
import './Feed.css';

const Feed = () => {
  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>Discover</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="no-profiles"
      >
        <FaExclamationCircle size={40} />
        <h2>No profiles to display yet</h2>
        <p>Check back later for new profiles</p>
      </motion.div>
    </div>
  );
};

export default Feed;