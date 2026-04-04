const Post = require('../models/Post');
const User = require('../models/User');
const notificationController = require('./notificationController');

// @desc    Create new post
// @route   POST /api/posts
const createPost = async (req, res) => {
  const { content, tags, skills, type, codeSnippet, imageUrl, imageUrls, poll } = req.body;

  try {
    let endsAt = null;
    if (poll?.durationHours) {
      endsAt = new Date(Date.now() + poll.durationHours * 60 * 60 * 1000);
    }

    const pollData = poll ? {
      question: poll.question || '',
      options: (poll.options || []).map(opt => ({
        text: opt.text,
        votes: [],
        voteCount: 0
      })),
      isMultiple: poll.isMultiple || false,
      endsAt,
      totalVotes: 0,
      votedUsers: []
    } : undefined;

    const post = await Post.create({
      userId: req.user._id,
      authorName: req.user.name,
      authorAvatar: req.user.avatarUrl || req.user.name.charAt(0).toUpperCase(),
      authorRole: req.user.goal === 'Mentor' ? 'Mentor' : req.user.goal === 'Exchange' ? 'Exchanger' : 'Learner',
      content,
      tags,
      skills: skills || tags,
      type: poll ? 'Poll' : type,
      codeSnippet,
      imageUrl: imageUrl || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : null),
      imageUrls: imageUrls || (imageUrl ? [imageUrl] : []),
      poll: pollData
    });

    const io = req.app.get('io');
    io.emit('new_post', post);

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Follow = require('../models/Follow');

// @desc    Get all posts (Feed algorithm)
// @route   GET /api/posts
const getPosts = async (req, res) => {
  try {
    const user = req.user;
    const pageNum = Math.max(1, parseInt(req.query.page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const { category, skill, type, following, sort } = req.query;
    
    let query = {
      notInterested: { $nin: [req.user._id] }
    };
    
    if (category && category !== 'All') query.type = category;
    if (type && type !== 'all') query.type = type;
    if (skill) query.skills = { $in: [skill] };

    // Filter by following users
    if (following === 'true' || following === true) {
      const followingDocs = await Follow.find({ 
        follower: user._id, 
        status: 'accepted' 
      }).select('following');
      const followingUsers = followingDocs.map(doc => doc.following);
      
      if (followingUsers.length === 0) {
        return res.json([]);
      }
      
      query.userId = { $in: followingUsers };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'likes') {
      sortOption = { likes: -1 };
    }

    const posts = await Post.find(query)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl')
      .populate({
        path: 'originalPostId',
        populate: {
          path: 'userId',
          select: 'name avatarUrl skills goal experienceLevel isMentor mentorStatus'
        }
      })
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // If sort by likes, return directly without scoring
    if (sort === 'likes') {
      return res.json(posts);
    }

    // Dynamic scoring for the feed
    const scoredPosts = posts.map(post => {
      let score = 0;
      
      // Interaction Score
      score += (post.likes ? post.likes.length : 0) * 5;
      score += (post.comments ? post.comments.length : 0) * 10;
      score += (post.saves ? post.saves.length : 0) * 20;
      score += (post.shares || 0) * 15;
      score += (post.interested ? post.interested.length : 0) * 25;

      // Match skills boost
      if (user.skills && post.skills) {
        const matches = post.skills.filter(s => user.skills.includes(s));
        score += matches.length * 50;
      }

      // Personalized boost for interested users
      if (post.interested && post.interested.includes(user._id)) {
        score += 500;
      }
      
      // Recency Decay
      const ageInHours = (new Date() - new Date(post.createdAt)) / (1000 * 60 * 60);
      const decayFactor = 1 / Math.pow(ageInHours + 2, 1.5);
      
      const finalScore = score * decayFactor;
      
      return { ...post._doc, score: finalScore };
    });

    // Sort by final score
    scoredPosts.sort((a, b) => b.score - a.score);

    res.json(scoredPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like/Unlike post
// @route   PUT /api/posts/:id/like
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    // Populate before emitting/responding
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    // Emit socket event for general post update
    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);

    // Trigger Notification for Like
    if (!alreadyLiked) {
      await notificationController.createNotification(io, {
        recipient: post.userId,
        sender: req.user._id,
        senderName: req.user.name,
        senderAvatar: req.user.avatarUrl || `https://ui-avatars.com/api/?name=${req.user.name}&background=random`,
        type: 'like',
        post: post._id
      });
    }

    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save/Unsave post
// @route   PUT /api/posts/:id/save
const savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadySaved = post.saves.includes(req.user._id);

    if (alreadySaved) {
      post.saves = post.saves.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.saves.push(req.user._id);
    }

    await post.save();

    // Populate before emitting/responding
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    // Emit socket event
    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);

    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Share/Repost post
// @route   PUT /api/posts/:id/share
const sharePost = async (req, res) => {
  try {
    const { content } = req.body; // Optional comment
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment original post reposts
    originalPost.reposts += 1;
    await originalPost.save();

    // Create a new post representing the repost
    const repost = await Post.create({
      userId: req.user._id,
      authorName: req.user.name,
      authorAvatar: req.user.avatarUrl || req.user.name.charAt(0).toUpperCase(),
      authorRole: req.user.goal === 'Mentor' ? 'Mentor' : req.user.goal === 'Exchange' ? 'Exchanger' : 'Learner',
      content: content || '',
      type: 'Post',
      isRepost: true,
      originalPostId: originalPost.isRepost ? originalPost.originalPostId : originalPost._id,
      originalAuthorName: originalPost.isRepost ? originalPost.originalAuthorName : originalPost.authorName
    });

    const populatedRepost = await Post.findById(repost._id)
      .populate('originalPostId')
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    // Populate original post before emitting
    const populatedOriginal = await Post.findById(originalPost._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    // Emit socket event
    const io = req.app.get('io');
    io.emit('post_updated', populatedOriginal);
    io.emit('new_post', populatedRepost);

    res.json(populatedRepost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment
// @route   POST /api/posts/:id/comment
const addComment = async (req, res) => {
  const { content } = req.body;

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      userId: req.user._id,
      authorName: req.user.name,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    
    // Update engagement score
    post.engagementScore = (post.likes ? post.likes.length : 0) * 5 + 
                          (post.comments ? post.comments.length : 0) * 10 + 
                          (post.saves ? post.saves.length : 0) * 20 + 
                          (post.shares || 0) * 15;

    await post.save();

    // Populate before emitting/responding
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    // Emit socket event for general post update
    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);

    // Trigger Notification for Comment
    await notificationController.createNotification(io, {
      recipient: post.userId,
      sender: req.user._id,
      senderName: req.user.name,
      senderAvatar: req.user.avatarUrl || `https://ui-avatars.com/api/?name=${req.user.name}&background=random`,
      type: 'comment',
      post: post._id,
      content: content // Pass the comment content for the notification
    });

    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's own posts
// @route   GET /api/posts/user/:userId
const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { userId: req.params.userId };
    
    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
        .populate('likes', 'name _id avatarUrl')
        .populate('saves', 'name _id avatarUrl')
        .populate({
          path: 'originalPostId',
          populate: {
            path: 'userId',
            select: 'name avatarUrl skills goal experienceLevel isMentor mentorStatus'
          }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Post.countDocuments(query)
    ]);
    res.json({ posts, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get current user's saved posts
// @route   GET /api/posts/saved
const getSavedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { saves: req.user._id };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
        .populate('likes', 'name _id avatarUrl')
        .populate('saves', 'name _id avatarUrl')
        .populate({
          path: 'originalPostId',
          populate: {
            path: 'userId',
            select: 'name avatarUrl skills goal experienceLevel isMentor mentorStatus'
          }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Post.countDocuments(query)
    ]);
    res.json({ posts, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's interested posts
// @route   GET /api/posts/interested
const getInterestedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { interested: req.user._id };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
        .populate('likes', 'name _id avatarUrl')
        .populate('saves', 'name _id avatarUrl')
        .populate({
          path: 'originalPostId',
          populate: {
            path: 'userId',
            select: 'name avatarUrl skills goal experienceLevel isMentor mentorStatus'
          }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Post.countDocuments(query)
    ]);
    res.json({ posts, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's reposts
// @route   GET /api/posts/reposts
const getReposts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id, isRepost: true };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
        .populate('likes', 'name _id avatarUrl')
        .populate('saves', 'name _id avatarUrl')
        .populate({
          path: 'originalPostId',
          populate: {
            path: 'userId',
            select: 'name avatarUrl skills goal experienceLevel isMentor mentorStatus'
          }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Post.countDocuments(query)
    ]);
    res.json({ posts, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's not interested posts
// @route   GET /api/posts/not-interested
const getNotInterestedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { notInterested: req.user._id };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
        .populate('likes', 'name _id avatarUrl')
        .populate('saves', 'name _id avatarUrl')
        .populate({
          path: 'originalPostId',
          populate: {
            path: 'userId',
            select: 'name avatarUrl skills goal experienceLevel isMentor mentorStatus'
          }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Post.countDocuments(query)
    ]);
    res.json({ posts, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
const updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Populate before emitting/responding
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    await post.deleteOne();
    
    const io = req.app.get('io');
    io.emit('post_deleted', req.params.id);
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark comment as helpful
// @route   PUT /api/posts/:id/comments/:commentId/helpful
const markCommentHelpful = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Only author can mark helpful' });

    post.comments = post.comments.map(c => {
      if (c._id.toString() === req.params.commentId) {
        c.isHelpful = !c.isHelpful;
      }
      return c;
    });

    post.isResolved = post.comments.some(c => c.isHelpful);
    await post.save();

    // Populate before emitting/responding
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark post as interested
// @route   PUT /api/posts/:id/interested
const interestedPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyInterested = post.interested.includes(req.user._id);
    if (alreadyInterested) {
      post.interested = post.interested.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.interested.push(req.user._id);
      // Remove from notInterested if switching
      post.notInterested = post.notInterested.filter(id => id.toString() !== req.user._id.toString());
    }

    await post.save();

    // Populate before emitting/responding
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark post as not interested
// @route   PUT /api/posts/:id/not-interested
const notInterestedPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyNotInterested = post.notInterested.includes(req.user._id);
    if (alreadyNotInterested) {
      post.notInterested = post.notInterested.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.notInterested.push(req.user._id);
      // Remove from interested if switching
      post.interested = post.interested.filter(id => id.toString() !== req.user._id.toString());
    }

    await post.save();

    // Populate before emitting/responding
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get profile stats (counts)
// @route   GET /api/posts/profile-stats
const getProfileStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [postsCount, savedCount, interestedCount, notInterestedCount, repostsCount] = await Promise.all([
      Post.countDocuments({ userId }),
      Post.countDocuments({ saves: userId }),
      Post.countDocuments({ interested: userId }),
      Post.countDocuments({ notInterested: userId }),
      Post.countDocuments({ userId, isRepost: true })
    ]);

    res.json({
      postsCount,
      savedCount,
      interestedCount,
      notInterestedCount,
      repostsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Share post link (increment shares counter)
// @route   PUT /api/posts/:id/share-count
const sharePostLink = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.shares += 1;
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl')
      .populate({
        path: 'originalPostId',
        populate: {
          path: 'userId',
          select: 'name avatarUrl skills goal experienceLevel isMentor mentorStatus'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload post image
// @route   POST /api/posts/upload
const uploadPostImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote on poll
// @route   PUT /api/posts/:id/vote
const votePoll = async (req, res) => {
  try {
    const { optionIndexes, remove } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.poll || post.type !== 'Poll') {
      return res.status(400).json({ message: 'Post is not a poll' });
    }

    const userId = req.user._id;
    const hasVoted = post.poll.votedUsers.some(id => id.toString() === userId.toString());

    if (remove) {
      post.poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(id => id.toString() !== userId.toString());
        opt.voteCount = opt.votes.length;
      });
      post.poll.votedUsers = post.poll.votedUsers.filter(id => id.toString() !== userId.toString());
      post.poll.totalVotes = post.poll.votedUsers.length;
    } else {
      if (post.poll.isMultiple) {
        const newVotes = Array.isArray(optionIndexes) ? optionIndexes : [optionIndexes];
        newVotes.forEach(idx => {
          if (post.poll.options[idx] && !post.poll.options[idx].votes.includes(userId)) {
            post.poll.options[idx].votes.push(userId);
            post.poll.options[idx].voteCount += 1;
          }
        });
        if (!post.poll.votedUsers.some(id => id.toString() === userId.toString())) {
          post.poll.votedUsers.push(userId);
        }
      } else {
        if (!hasVoted) {
          const idx = Array.isArray(optionIndexes) ? optionIndexes[0] : optionIndexes;
          if (post.poll.options[idx]) {
            post.poll.options[idx].votes.push(userId);
            post.poll.options[idx].voteCount += 1;
            post.poll.votedUsers.push(userId);
          }
        }
      }
      post.poll.totalVotes = post.poll.votedUsers.length;
    }

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatarUrl skills goal experienceLevel isMentor mentorStatus')
      .populate('likes', 'name _id avatarUrl')
      .populate('saves', 'name _id avatarUrl');

    const io = req.app.get('io');
    io.emit('post_updated', populatedPost);

    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfileStats,
  getPostById,
  uploadPostImage,
  createPost,
  getPosts,
  likePost,
  savePost,
  sharePost,
  sharePostLink,
  addComment,
  getUserPosts,
  getSavedPosts,
  getInterestedPosts,
  getNotInterestedPosts,
  getReposts,
  updatePost,
  deletePost,
  markCommentHelpful,
  interestedPost,
  notInterestedPost,
  votePoll
};
