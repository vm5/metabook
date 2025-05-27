const express = require("express");
const Ad = require('../models/AdModel');

const adRouter = express.Router();

// Create Ad
adRouter.post("/", async (req, res) => {
  try {
    const { title, description, imageUrl, redirectUrl, priority, postedBy, startDate, endDate, userId } = req.body;

    const ad = new Ad({
      title,
      description,
      imageUrl,
      redirectUrl,
      priority,
      postedBy,
      createdBy: userId, // Tracking who created the ad
      startDate,
      endDate
    });

    await ad.save();
    res.status(201).json({
        success : true,
        data : ad
  });
  } catch (err) {
    res.status(500).json({ 
        success : false,
        error: err.message });
  }
});

// Get All Ads (Sorted by Priority and CreatedAt)
adRouter.get("/", async (req, res) => {
    try {
      console.log("enter get all");
  
      // Get pagination parameters from query
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      // Get total count of ads
      const totalCount = await Ad.countDocuments();
  
      // Fetch paginated ads, sorted by priority and createdAt
      const ads = await Ad.find()
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      // Send standardized response
      res.json({
        success: true,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: totalCount ? page : 0 ,
        data: ads,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  adRouter.get("/active", async (req, res) => {
    try {
      console.log("Fetching active ads...");
  
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const currentDate = new Date();
  
      // Fetch only active ads (startDate <= now && endDate >= now)
      const totalCount = await Ad.countDocuments({
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      });
  
      const ads = await Ad.find({
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate }
      })
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      res.json({
        success: true,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        data: ads
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  

// Get Single Ad (With Populated Fields)
adRouter.get("/:id", async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate("postedBy createdBy updatedBy", "name email");
    if (!ad) return res.status(404).json({ success : false, message: "Ad not found" });

    res.json({
        success : true,
        data : ad
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Ad
adRouter.put("/:id", async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;
    updateData.updatedBy = userId; // Tracking who updated the ad

    const ad = await Ad.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    res.json({
        success : true,
        data: ad
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Ad
adRouter.delete("/:id", async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });

    res.json({ 
        success : true,
        message: "Ad deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = adRouter;
