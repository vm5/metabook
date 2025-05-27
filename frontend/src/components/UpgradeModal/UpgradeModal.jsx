import React from 'react';
import { motion } from 'framer-motion';
import { FaCrown, FaStar, FaTimes } from 'react-icons/fa';
import './UpgradeModal.css';

const UpgradeModal = ({ onClose, onSelectPlan }) => {
  const plans = [
    {
      id: 'beginner',
      name: 'Beginner',
      price: '$5/month',
      icon: <FaStar className="plan-icon" />,
      features: [
        'Advanced matching algorithm',
        'Up to 100 likes per day',
        'Unlimited messages to matches',
        'View profile visitors',
        'Profile boost once per week',
        'Access to advanced filters'
      ],
      color: '#00c6ff'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$15/month',
      icon: <FaCrown className="plan-icon" />,
      features: [
        'Premium matching algorithm',
        'Unlimited likes',
        'Priority in search results',
        'See who liked your profile',
        'Advanced filters and search',
        'Read receipts',
        'Profile boost once per day',
        'Priority customer support',
        'Ad-free experience'
      ],
      color: '#ffd700',
      popular: true
    }
  ];

  return (
    <motion.div 
      className="upgrade-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="upgrade-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <h2>Upgrade Your Experience</h2>
        <p className="subtitle">Choose a plan that works for you</p>

        <div className="plans-container">
          {plans.map((plan) => (
            <motion.div 
              key={plan.id}
              className={`plan-card ${plan.popular ? 'popular' : ''}`}
              whileHover={{ scale: 1.02 }}
              style={{
                '--plan-color': plan.color
              }}
            >
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              <div className="plan-header">
                {plan.icon}
                <h3>{plan.name}</h3>
                <p className="price">{plan.price}</p>
              </div>

              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>

              <button 
                className="select-plan-btn"
                onClick={() => onSelectPlan(plan.id)}
              >
                Select {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UpgradeModal; 