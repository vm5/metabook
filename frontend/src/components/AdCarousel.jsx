import React, { useState, useEffect } from 'react';
import './AdCarousel.css';

const AdCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Updated ad data with real images and content
  const ads = [
    {
      id: 1,
      image: '/ads/premium-membership.jpg',
      title: 'Premium Membership',
      description: 'Unlock exclusive features and connect with more people!',
      link: '/upgrade'
    },
    {
      id: 2,
      image: '/ads/dating-events.jpg',
      title: 'Local Dating Events',
      description: 'Join exciting events in your area and meet new people',
      link: '/events'
    },
    {
      id: 3,
      image: '/ads/matchmaking.jpg',
      title: 'Smart Matchmaking',
      description: 'Find your perfect match with our AI-powered suggestions',
      link: '/matches'
    }
  ];

  useEffect(() => {
    // Auto-rotate slides every 5 seconds
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  const handleSlideClick = (link) => {
    window.open(link, '_blank');
  };

  return (
    <div className="ad-carousel">
      {ads.map((ad, index) => (
        <div
          key={ad.id}
          className={`ad-slide ${index === currentSlide ? 'active' : ''}`}
          onClick={() => handleSlideClick(ad.link)}
        >
          <img 
            src={ad.image} 
            alt={ad.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Ad+Coming+Soon';
            }} 
          />
          <div className="ad-slide-content">
            <h4>{ad.title}</h4>
            <p>{ad.description}</p>
          </div>
        </div>
      ))}
      <div className="ad-carousel-dots">
        {ads.map((_, index) => (
          <div
            key={index}
            className={`ad-carousel-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default AdCarousel; 