const mongoose = require('mongoose');

// Comment Schema (separated for clarity)
const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Post Schema
const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: false
    },
    url: {
      type: String,
      required: false
    },
    thumbnail: {
      type: String,
      required: false
    }
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  privacy: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add text index for search
postSchema.index({ title: 'text', description: 'text' });

// Helper method to extract mentions from comment content
commentSchema.methods.extractMentions = function() {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(this.content)) !== null) {
    mentions.push(match[2]); // Push the user ID from the mention
  }
  
  return mentions;
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;

