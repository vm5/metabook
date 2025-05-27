import React, { useState } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Gallery.css';

const Gallery = ({ onImageUploaded }) => {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem('userid');
  const userName = localStorage.getItem('name');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));

    if (validFiles.length !== files.length) {
      toast.error('Please upload only images');
      return;
    }

    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('userName', userName);
    images.forEach(image => {
      formData.append('images', image);
    });

    try {
      const response = await axios.post('http://localhost:8080/api/gallery/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      if (response.data) {
        toast.success('Images uploaded successfully!');
        setImages([]);
        setPreviews([]);
        if (onImageUploaded) onImageUploaded();
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gallery-upload-container">
      <h3>Upload to Public Gallery</h3>
      
      <div className="gallery-previews">
        {previews.map((preview, index) => (
          <div key={index} className="preview-item">
            <img src={preview} alt={`Preview ${index + 1}`} />
            <button 
              onClick={() => removeImage(index)}
              className="remove-image-btn"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      <div className="gallery-actions">
        <label className="upload-btn">
          <FaImage />
          <span>Select Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </label>
        
        {images.length > 0 && (
          <button 
            onClick={handleUpload}
            disabled={loading}
            className="submit-gallery-btn"
          >
            {loading ? 'Uploading...' : 'Upload to Gallery'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Gallery;