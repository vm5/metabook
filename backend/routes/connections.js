const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Connection = require('../models/connectionModel');
const User = require('../models/userModel');

const connectionRouter = express.Router();

// connectionRouter.use(bodyParser.urlencoded({ extended: true }));
// connectionRouter.use(bodyParser.json());

connectionRouter.get('/getfollowers/:userId', async(req, res) => {
    const userId = req.params.userId;
    try {
        const count = await Connection.countDocuments({ followingId: userId });
        res.status(200).json({
            success: true,
            followersCount: count
        });
    } catch (err) {
        console.error("Error getting followers:", err);
        res.status(500).json({
            success: false,
            message: "Error getting followers"
        });
    }
});

connectionRouter.get('/getFollowing/:userId', async(req, res) => {
    const userId = req.params.userId;
    try {
        const count = await Connection.countDocuments({ userId: userId });
        res.status(200).json({
            success: true,
            followingCount: count
        });
    } catch (err) {
        console.error("Error getting following count:", err);
        res.status(500).json({
            success: false,
            message: "Error getting following count"
        });
    }
});

connectionRouter.post('/follow', async (req, res) => {
  try {
    const { userId, followingId } = req.body;
    console.log('Follow request:', { userId, followingId });

    if (!userId || !followingId) {
      return res.status(400).json({
        success: false,
        message: 'Both userId and followingId are required'
      });
    }

    // Check if users exist
    const [user, followedUser] = await Promise.all([
      User.findById(userId),
      User.findById(followingId)
    ]);

    if (!user || !followedUser) {
      return res.status(404).json({
        success: false,
        message: 'One or both users not found'
      });
    }

    // Check if the connection already exists
    const existingConnection = await Connection.findOne({
      userId,
      followingId
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Create new connection
    const connection = new Connection({
      userId,
      followingId,
      status: 'following'
    });

    await connection.save();
    console.log('Created new connection:', connection);

    res.json({
      success: true,
      message: 'Successfully followed user',
      connection
    });
  } catch (error) {
    console.error('Error in follow route:', error);
    res.status(500).json({
      success: false,
      message: 'Error following user',
      error: error.message
    });
  }
});

connectionRouter.post('/unfollow', async (req, res) => {
  try {
    const { userId, followingId } = req.body;
    console.log('Unfollow request:', { userId, followingId });

    if (!userId || !followingId) {
      return res.status(400).json({
        success: false,
        message: 'Both userId and followingId are required'
      });
    }

    const result = await Connection.findOneAndDelete({
      userId,
      followingId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    console.log('Deleted connection:', result);

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Error in unfollow route:', error);
    res.status(500).json({
      success: false,
      message: 'Error unfollowing user',
      error: error.message
    });
  }
});

connectionRouter.post('/isFollowing', async (req, res) => {
  try {
    const { userId, followedUserId } = req.body;
    console.log('Checking following status:', { userId, followedUserId });

    const connection = await Connection.findOne({
      userId,
      followingId: followedUserId
    });

    res.json({
      success: true,
      isConnection: !!connection
    });
  } catch (error) {
    console.error('Error checking following status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking following status',
      error: error.message
    });
  }
});

connectionRouter.get('/getFollowersAndFollowings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Getting followers and following count for:', userId);

    const [followers, following] = await Promise.all([
      Connection.countDocuments({ followingId: userId }),
      Connection.countDocuments({ userId })
    ]);

    res.json({
      success: true,
      followersCount: followers,
      followingCount: following
    });
  } catch (error) {
    console.error('Error getting followers and following count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting followers and following count',
      error: error.message
    });
  }
});

// Get user's followers with details
connectionRouter.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all connections where this user is being followed
    const connections = await Connection.find({ 
      followingId: userId,
      status: 'following'
    });

    // Get the user IDs of all followers
    const followerIds = connections.map(conn => conn.userId);

    // Fetch user details for all followers
    const followers = await User.find(
      { _id: { $in: followerIds } },
      'firstName lastName profilePicture verifiedBadge location'
    ).lean();

    // Format the location data
    const formattedFollowers = followers.map(user => ({
      ...user,
      location: user.location ? (
        typeof user.location === 'object' 
          ? user.location.formatted_address || user.location.city || 'Unknown Location'
          : user.location
      ) : 'Unknown Location'
    }));

    res.json({
      success: true,
      users: formattedFollowers
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching followers',
      error: error.message
    });
  }
});

// Get users that this user is following with details
connectionRouter.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all connections where this user is following others
    const connections = await Connection.find({ 
      userId,
      status: 'following'
    });

    // Get the user IDs of all users being followed
    const followingIds = connections.map(conn => conn.followingId);

    // Fetch user details for all followed users
    const following = await User.find(
      { _id: { $in: followingIds } },
      'firstName lastName profilePicture verifiedBadge location'
    ).lean();

    // Format the location data
    const formattedFollowing = following.map(user => ({
      ...user,
      location: user.location ? (
        typeof user.location === 'object' 
          ? user.location.formatted_address || user.location.city || 'Unknown Location'
          : user.location
      ) : 'Unknown Location'
    }));

    res.json({
      success: true,
      users: formattedFollowing
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching following',
      error: error.message
    });
  }
});

module.exports = connectionRouter;