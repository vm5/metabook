import React from 'react';
import ReactDOM from 'react-dom';
import './PolicyModal.css'; // We'll create this next
import {useState, useEffect, useRef} from "react";

const PolicyModal = ({ isOpen, onClose, onAccept }) => {

    // Move all hooks BEFORE any conditional returns
    const policyTextRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(false);
    
    // Use useEffect to set up and clean up scroll handlers
    useEffect(() => {
      // Only add event listeners if the modal is open
      if (!isOpen || !policyTextRef.current) return;
      
      const textElement = policyTextRef.current;
      
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = textElement;
        // Check if scrolled to bottom with a small buffer
        const hasReachedBottom = scrollHeight - scrollTop <= clientHeight + 5;
        
        if (hasReachedBottom) {
          setIsAtBottom(true);
        } else {
          setIsAtBottom(false);
        }
      };
      
      // Reset state when modal opens
      setIsAtBottom(false);
      textElement.scrollTop = 0;
      
      // Add event listener
      textElement.addEventListener('scroll', handleScroll);
      
      // Clean up function
      return () => {
        textElement.removeEventListener('scroll', handleScroll);
      };
    }, [isOpen]); // Re-run when isOpen changes
    
    // Early return after ALL hooks are called
    if (!isOpen) return null;



  // Use React Portal to render outside your component hierarchy
  return ReactDOM.createPortal(
    <div className="privacy-modal-overlay">
      <div className="privacy-modal">
        <div className="privacy-modal-header">
          <h2>Privacy Policy</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="privacy-modal-content" ref={policyTextRef}>
        <h3>1. Introduction</h3>
            <p>This Privacy Policy describes how we collect, use, and disclose your personal information when you use our services.</p>
            
            <h3>2. Information We Collect</h3>
            <p>We may collect various types of information, including:</p>
            <ul>
              <li>Personal information such as name, email address, and contact details</li>
              <li>Usage data related to your interaction with our services</li>
              <li>Device information including IP address, browser type, and operating system</li>
            </ul>
            
            <h3>3. How We Use Your Information</h3>
            <p>We use your information for various purposes, including:</p>
            <ul>
              <li>Providing and maintaining our services</li>
              <li>Improving and personalizing user experience</li>
              <li>Communicating with you about updates and changes</li>
              <li>Analyzing usage patterns to enhance our offerings</li>
            </ul>
            
            <h3>4. Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
            
            <h3>5. Data Retention</h3>
            <p>We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy.</p>
            
            <h3>6. Your Rights</h3>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul>
              <li>Right to access and obtain a copy of your data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure of your data</li>
              <li>Right to restrict processing of your data</li>
            </ul>
            
            <h3>7. Changes to This Policy</h3>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
            
            <h3>8. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us.</p>
            
            <h3>9. Consent</h3>
            <p>By using our services, you consent to the collection and use of information in accordance with this Privacy Policy.</p>
            
            <h3>10. Third-Party Services</h3>
            <p>We may employ third-party companies and individuals to facilitate our services, provide services on our behalf, perform service-related tasks, or assist us in analyzing how our services are used.</p>
            
            <h3>11. Children's Privacy</h3>
            <p>Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13.</p>
            
            <h3>12. International Transfers</h3>
            <p>Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.</p>
        </div>
        
        <div className="privacy-modal-footer">
          <button className="accept-button" onClick={onAccept} disabled={!isAtBottom}>Accept</button>
        </div>
      </div>
    </div>,
    document.getElementById('portal-root')
  );
};

export default PolicyModal;