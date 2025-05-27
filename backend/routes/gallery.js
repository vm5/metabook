const express = require('express');
const galleryRouter = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const PublicGallery = require('../models/publicGalleryModel');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for gallery uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/gallery');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// JUST upload to gallery, NO POST CREATION
gallaryRouter.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const { userId, userName } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // Simply add to public galleries
    const gallery = new PublicGallery({
      userId,
      userName,
      images: req.files.map(file => file.path)
    });

    await gallery.save();
    res.status(201).json(gallery);
  } catch (error) {
    console.error('Error uploading to gallery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all galleries
gallaryRouter.get('/all', async (req, res) => {
  try {
    const galleries = await PublicGallery.find().sort({ createdAt: -1 });
    res.json(galleries);
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = gallaryRouter;