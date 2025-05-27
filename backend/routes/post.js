const User = require('./../models/userModel');
const Post = require("../models/postModel");
const Connection = require("../models/connectionModel");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const postRouter = express.Router();

// Ensure upload directories exist
const postsDir = path.join(__dirname, '../uploads/posts');
const thumbnailsDir = path.join(__dirname, '../uploads/posts/thumbnails');

if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, postsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  
  if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPG, PNG, GIF) and videos (MP4, MOV, AVI) are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// postRouter.use(bodyParser.urlencoded({ extended: true }));
// postRouter.use(bodyParser.json());

postRouter.post("/data", async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await Post.countDocuments({ userId });
        const userData = await User.findOne({ _id: userId })
        console.log("USerData", userData)
        const profileData = {
            posts: user,
            followers: userData.followers,
            followings: userData.followings
        }
        res.status(200).json(profileData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
postRouter.post("/follow", async (req, res) => {
    try {
        const { userId, followerId } = req.body;
        console.log("Getting", req.body)
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $push: { followersList: followerId }, $inc: { followings: 1 } },
            { new: true } // This option ensures that the updated document is returned
        );

        console.log("updatedUser", updatedUser)
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
postRouter.post("/like", async (req, res) => {
    try {
        const { postId, userId } = req.body;
        
        if (!postId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Post ID and User ID are required'
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const likeIndex = post.likes.indexOf(userId);
        
        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(userId);
        }

        await post.save();

        res.json({
            success: true,
            likes: post.likes.length,
            isLiked: likeIndex === -1
        });
    } catch (error) {
        console.error('Error updating like:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating like',
            error: error.message
        });
    }
});

// Create post
postRouter.post('/create', async (req, res) => {
  try {
    if (!req.files && !req.body.title) {
      return res.status(400).json({
        success: false,
        message: 'No files or post content provided'
      });
    }

    const { userId, title, description, privacy = 'public' } = req.body;
    console.log('Creating post with privacy:', privacy);

    // Validate required fields
    if (!userId || !title) {
      return res.status(400).json({
        success: false,
        message: 'User ID and title are required'
      });
    }

    // Get user details first
    const user = await User.findById(userId)
      .select('firstName lastName profilePicture verifiedBadge')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create new post object
    const newPost = new Post({
      userId: user._id,
      title,
      description: description || '',
      privacy: privacy || 'public',  // Ensure privacy is set
      createdAt: new Date(),
      likes: [],
      comments: []
    });

    // Handle media file if present
    if (req.files && req.files.media) {
      const mediaFile = req.files.media;
      const mediaType = mediaFile.mimetype.startsWith('image/') ? 'image' : 'video';
      
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(mediaFile.name)}`;
      const uploadPath = path.join(__dirname, '..', 'uploads', 'posts', filename);
      
      const dir = path.dirname(uploadPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await mediaFile.mv(uploadPath);
      
      newPost.media = {
        type: mediaType,
        url: `/uploads/posts/${filename}`,
        thumbnail: mediaType === 'image' ? `/uploads/posts/${filename}` : null
      };
    }

    console.log('Saving post with data:', newPost);

    // Save the post
    await newPost.save();

    // Return post with user details
    const postWithUser = {
      ...newPost.toObject(),
      userId: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture || '/default-avatar.png',
        verifiedBadge: user.verifiedBadge
      }
    };

    console.log('Created post:', postWithUser);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: postWithUser
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
});

// Get user's posts
postRouter.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First get the user details
    const user = await User.findById(userId)
      .select('firstName lastName profilePicture verifiedBadge')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get posts with populated user data
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Transform posts to include proper user data and handle comments
    const transformedPosts = await Promise.all(posts.map(async post => {
      // Get comment user details
      const commentsWithUsers = await Promise.all(post.comments.map(async comment => {
        try {
          const commentUser = await User.findById(comment.userId)
            .select('firstName lastName profilePicture verifiedBadge')
            .lean();

          return {
            ...comment,
            userId: commentUser ? {
              _id: commentUser._id,
              firstName: commentUser.firstName,
              lastName: commentUser.lastName,
              profilePicture: commentUser.profilePicture || '/default-avatar.png',
              verifiedBadge: commentUser.verifiedBadge
            } : {
              firstName: 'Anonymous',
              lastName: 'User',
              profilePicture: '/default-avatar.png'
            }
          };
        } catch (error) {
          console.error('Error fetching comment user:', error);
          return comment;
        }
      }));

      return {
        ...post,
        userId: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture || '/default-avatar.png',
          verifiedBadge: user.verifiedBadge
        },
        comments: commentsWithUsers
      };
    }));
    
    res.status(200).json({
      success: true,
      posts: transformedPosts
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching posts',
      error: error.message 
    });
  }
});

// Get all posts (with pagination)
postRouter.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user's following list
    const connections = await Connection.find({
      userId: userId,
      status: 'following'
    }).lean();

    const followingIds = connections.map(conn => conn.followingId);

    // Fetch posts based on privacy settings
    const posts = await Post.find({
      $or: [
        { privacy: 'public' },  // Public posts
        { userId: userId },     // User's own posts
        { 
          $and: [
            { privacy: 'followers' },  // Posts marked for followers only
            { userId: { $in: followingIds } }  // Posts from users they follow
          ]
        }
      ]
    })
    .populate('userId', 'firstName lastName profilePicture verifiedBadge')
    .sort({ createdAt: -1 })
    .lean();

    // Transform posts to include proper user data
    const transformedPosts = await Promise.all(posts.map(async post => {
      // Get comment user details
      const commentsWithUsers = await Promise.all(post.comments.map(async comment => {
        try {
          const commentUser = await User.findById(comment.userId)
            .select('firstName lastName profilePicture verifiedBadge')
            .lean();

          // Get mentioned users' details
          const mentionedUsers = await Promise.all((comment.mentions || []).map(async mentionId => {
            const mentionedUser = await User.findById(mentionId)
              .select('firstName lastName profilePicture verifiedBadge')
              .lean();
            return mentionedUser;
          }));

          return {
            ...comment,
            userId: commentUser ? {
              _id: commentUser._id,
              firstName: commentUser.firstName,
              lastName: commentUser.lastName,
              profilePicture: commentUser.profilePicture || '/default-avatar.png',
              verifiedBadge: commentUser.verifiedBadge || false
            } : {
              firstName: 'Deleted',
              lastName: 'User',
              profilePicture: '/default-avatar.png'
            },
            mentions: mentionedUsers.filter(Boolean).map(user => ({
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePicture: user.profilePicture || '/default-avatar.png',
              verifiedBadge: user.verifiedBadge || false
            }))
          };
        } catch (error) {
          console.error('Error fetching comment user:', error);
          return comment;
        }
      }));

      return {
        ...post,
        userId: post.userId ? {
          _id: post.userId._id,
          firstName: post.userId.firstName,
          lastName: post.userId.lastName,
          profilePicture: post.userId.profilePicture || '/default-avatar.png',
          verifiedBadge: post.userId.verifiedBadge || false
        } : {
          firstName: 'Deleted',
          lastName: 'User',
          profilePicture: '/default-avatar.png'
        },
        comments: commentsWithUsers
      };
    }));

    res.json({
      success: true,
      posts: transformedPosts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
});

// Delete a post
postRouter.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Delete associated images
    if (post.media && post.media.length > 0) {
      // Add logic to delete files from uploads folder
    }

    await Post.findByIdAndDelete(postId);
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
});

// Add comment
postRouter.post('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content, parentCommentId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Get complete user details
    const user = await User.findById(userId)
      .select('firstName lastName profilePicture verifiedBadge')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create new comment
    const newComment = {
      _id: new mongoose.Types.ObjectId(), // Generate new ID explicitly
      userId: user._id,
      content,
      parentCommentId: parentCommentId || null,
      replies: [],
      mentions: [],
      createdAt: new Date()
    };

    // Extract mentions from content
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedUserId = match[2];
      // Verify the mentioned user exists
      const mentionedUser = await User.findById(mentionedUserId);
      if (mentionedUser) {
        newComment.mentions.push(mentionedUserId);
      }
    }

    // If this is a reply, update the parent comment's replies array
    if (parentCommentId) {
      const parentComment = post.comments.find(c => c._id.toString() === parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
      parentComment.replies.push(newComment._id);
    }

    // Add the comment to the post
    post.comments.push(newComment);
    await post.save();

    // Return comment with complete user details
    const commentWithUser = {
      ...newComment,
      userId: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture || '/default-avatar.png',
        verifiedBadge: user.verifiedBadge
      },
      mentions: await Promise.all(newComment.mentions.map(async (mentionId) => {
        const mentionedUser = await User.findById(mentionId)
          .select('firstName lastName profilePicture verifiedBadge')
          .lean();
        return mentionedUser ? {
          _id: mentionedUser._id,
          firstName: mentionedUser.firstName,
          lastName: mentionedUser.lastName,
          profilePicture: mentionedUser.profilePicture || '/default-avatar.png',
          verifiedBadge: mentionedUser.verifiedBadge
        } : null;
      })).then(mentions => mentions.filter(Boolean))
    };

    res.json({ 
      success: true, 
      comment: commentWithUser
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Error adding comment' });
  }
});

// Get comments with replies
postRouter.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId)
      .populate({
        path: 'comments.userId',
        select: 'firstName lastName profilePicture verifiedBadge'
      })
      .populate({
        path: 'comments.mentions',
        select: 'firstName lastName profilePicture verifiedBadge'
      })
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // First, transform all comments to include proper user data
    const allComments = post.comments.map(comment => ({
      ...comment,
      userId: comment.userId || {
        firstName: 'Deleted',
        lastName: 'User',
        profilePicture: '/default-avatar.png'
      },
      mentions: (comment.mentions || []).map(mention => ({
        _id: mention._id,
        firstName: mention.firstName,
        lastName: mention.lastName,
        profilePicture: mention.profilePicture || '/default-avatar.png',
        verifiedBadge: mention.verifiedBadge
      }))
    }));

    // Organize comments into a hierarchical structure
    const commentMap = new Map();
    allComments.forEach(comment => {
      commentMap.set(comment._id.toString(), comment);
    });

    // Separate top-level comments and replies
    const topLevelComments = allComments.filter(comment => !comment.parentCommentId);
    const replies = allComments.filter(comment => comment.parentCommentId);

    // Attach replies to their parent comments
    replies.forEach(reply => {
      const parentComment = commentMap.get(reply.parentCommentId.toString());
      if (parentComment) {
        parentComment.replies = parentComment.replies || [];
        parentComment.replies.push(reply);
      }
    });

    res.json({
      success: true,
      comments: topLevelComments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
});

// Delete comment
postRouter.delete('/:postId/comments/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Find and remove the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // If this is a reply, remove it from parent's replies array
    if (comment.parentCommentId) {
      const parentComment = post.comments.id(comment.parentCommentId);
      if (parentComment) {
        parentComment.replies = parentComment.replies.filter(
          replyId => replyId.toString() !== commentId
        );
      }
    }

    // Remove all replies if this is a parent comment
    if (comment.replies.length > 0) {
      comment.replies.forEach(replyId => {
        post.comments = post.comments.filter(
          c => c._id.toString() !== replyId.toString()
        );
      });
    }

    // Remove the comment itself
    post.comments = post.comments.filter(
      c => c._id.toString() !== commentId
    );

    await post.save();

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Error deleting comment' });
  }
});

// Like/Unlike post
postRouter.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!postId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and User ID are required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      // Like the post
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likes: post.likes.length
    });
  } catch (error) {
    console.error('Error handling like:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing like'
    });
  }
});

// Get posts from followed users
postRouter.get('/following/:userId', async (req, res) => {
  try {
    console.log('Fetching following posts for userId:', req.params.userId);
    
    // Find all connections where the current user is following others
    const connections = await Connection.find({
      userId: req.params.userId
    }).lean();
    
    console.log('Found connections:', connections);
    
    if (!connections || connections.length === 0) {
      console.log('No connections found, returning empty array');
      return res.json([]);
    }
    
    // Extract the followingIds from connections
    const followingIds = connections.map(conn => conn.followingId || conn.following).filter(Boolean);
    console.log('Following IDs:', followingIds);
    
    // Fetch posts from followed users
    const posts = await Post.find({
      $and: [
        { userId: { $in: followingIds } },
        {
          $or: [
            { privacy: 'public' },
            { privacy: 'followers' },
            { privacy: { $exists: false } }
          ]
        }
      ]
    })
    .populate('userId', 'firstName lastName profilePicture verifiedBadge')
    .sort({ createdAt: -1 })
    .lean();
    
    console.log('Found posts:', posts);
    
    // Transform posts to include user data
    const transformedPosts = await Promise.all(posts.map(async (post) => {
      try {
        // Transform comments if they exist
        const transformedComments = post.comments && Array.isArray(post.comments) 
          ? await Promise.all(post.comments.map(async (comment) => {
              if (!comment.userId) return null;
              
              const commentUser = await User.findById(comment.userId)
                .select('firstName lastName profilePicture verifiedBadge')
                .lean();

              // Get mentioned users' details
              const mentionedUsers = await Promise.all((comment.mentions || []).map(async mentionId => {
                const mentionedUser = await User.findById(mentionId)
                  .select('firstName lastName profilePicture verifiedBadge')
                  .lean();
                return mentionedUser;
              }));
                
              return {
                ...comment,
                userId: commentUser ? {
                  _id: commentUser._id,
                  firstName: commentUser.firstName,
                  lastName: commentUser.lastName,
                  profilePicture: commentUser.profilePicture || '/default-avatar.png',
                  verifiedBadge: commentUser.verifiedBadge || false
                } : {
                  firstName: 'Deleted',
                  lastName: 'User',
                  profilePicture: '/default-avatar.png'
                },
                mentions: mentionedUsers.filter(Boolean).map(user => ({
                  _id: user._id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  profilePicture: user.profilePicture || '/default-avatar.png',
                  verifiedBadge: user.verifiedBadge || false
                }))
              };
            }))
          : [];
          
        // Filter out null comments
        const validComments = transformedComments.filter(comment => comment !== null);
        
        return {
          ...post,
          userId: post.userId ? {
            _id: post.userId._id,
            firstName: post.userId.firstName,
            lastName: post.userId.lastName,
            profilePicture: post.userId.profilePicture || '/default-avatar.png',
            verifiedBadge: post.userId.verifiedBadge || false
          } : {
            firstName: 'Deleted',
            lastName: 'User',
            profilePicture: '/default-avatar.png'
          },
          comments: validComments
        };
      } catch (error) {
        console.error('Error transforming post:', error);
        return null;
      }
    }));
    
    // Filter out null posts
    const validPosts = transformedPosts.filter(post => post !== null);
    console.log('Returning transformed posts:', validPosts.length);
    
    res.json({
      success: true,
      posts: validPosts
    });
  } catch (error) {
    console.error('Error in /following/:userId:', error);
    res.status(500).json({ message: 'Error fetching following posts', error: error.message });
  }
});

// Get posts with privacy handling
postRouter.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user's following list
    const user = await User.findById(userId);
    const following = user.following || [];

    // Fetch posts based on privacy settings
    const posts = await Post.find({
      $or: [
        { privacy: 'public' },  // Public posts
        { userId: userId },     // User's own posts
        { 
          privacy: 'followers', 
          userId: { $in: following }  // Posts from users they follow
        }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts'
    });
  }
});

module.exports = postRouter;