// Create post
router.post('/create', upload.single('media'), async (req, res) => {
  try {
    const { userId, content } = req.body;
    const mediaPath = req.file ? `/uploads/posts/${req.file.filename}` : null;

    const newPost = new Post({
      userId,
      content,
      media: mediaPath,
      type: mediaPath ? 'image' : 'text'
    });

    await newPost.save();

    res.json({
      success: true,
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post'
    });
  }
});

// Delete post
router.delete('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Delete media file if exists
    if (post.media) {
      const filePath = path.join(__dirname, '..', post.media);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await post.remove();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post'
    });
  }
}); 