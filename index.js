const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const express = require('express');
const bcrypt  = require('bcrypt');
const router  = express.Router();
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const User    = require('./models/User');
const Post    = require('./models/post');
const PostLike = require('./models/Post_like');
const Comment = require('./models/Comment');
const CommentLike = require('./models/CommentLike');
const Subscription = require('./models/Subscription');
const Notification = require('./models/Notification');

// MongoDB 연결 설정
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('Connected to MongoDB Atlas');
    })
    .catch(err => {
      console.error('Could not connect to MongoDB Atlas', err);
    });
  
  const app = express();
  const port = process.env.PORT || 3000;

// JSON 파싱을 위한 미들웨어
app.use(express.json());
app.use(cors());

// JWT 미들웨어
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// 회원가입 라우트
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already exists'); // 로그 추가
      return res.status(400).json({ message: 'Email already exists' });
    }

    if (!password) {
      console.error('Password is missing');
      return res.status(400).json({ message: 'Password is required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully'); // 로그 추가

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      originalPassword: password
    });

    await newUser.save();
    console.log('User registered successfully'); // 로그 추가
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error); // 에러 로그
    res.status(500).json({ message: 'Error registering user' });
  }
});

// 로그인 라우트
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // JWT 생성
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: "User logged in successfully",
      token // JWT를 응답으로 반환
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});

// 프로필 조회 라우트
app.get('/api/profile/:userId', authenticateJWT, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select('username feedName bio profilePicture');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 게시물 수와 구독자 수를 포함하려면 추가적인 모델에서 데이터를 조회해야 함
    const postCount = await Post.countDocuments({ user_id: userId });
    const subscriberCount = await Subscription.countDocuments({ following_id: userId });

    res.status(200).json({
      username: user.username,
      feedName: user.feedName,
      bio: user.bio,
      profilePicture: user.profilePicture,
      postCount,
      subscriberCount
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// 프로필 설정 라우트
app.put('/api/profile', authenticateJWT, async (req, res) => {
  const { username, feedName, bio, profilePicture } = req.body;
  const userId = req.user.id;  // JWT에서 인증된 사용자 ID를 가져옵니다

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, {
      username,
      feedName,
      bio,
      profilePicture
    }, { new: true });

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});


// 게시글 작성 라우트
app.post('/api/posts', authenticateJWT, async (req, res) => {
  const { title, content, image_name, memory_timeline, bgm, userId } = req.body;

  try {
    // 인증된 사용자의 ID와 요청 본문의 userId가 일치하는지 확인
    if (req.user.id !== userId) return res.status(403).json({ message: "Forbidden: Invalid user" });

    const author = await User.findById(userId);
    if (!author) return res.status(400).json({ message: "Invalid author ID" });

    const newPost = new Post({
      title,
      content,
      image_name,
      memory_timeline,
      bgm,
      user_id: userId
    });

    await newPost.save();

    const subscribers = await Subscription.find({ following_id: userId }).populate('follower_id');
    subscribers.forEach(async (subscription) => {
      const notification = new Notification({
        user: subscription.follower_id._id,
        type: 'new_post',
        message: `${author.name}님이 새로운 게시글을 작성했습니다.`,
      });
      await notification.save();
    });

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// 게시글 조회 라우트
app.get('/api/posts/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const requestingUserId = req.user.id;  // JWT에서 인증된 사용자 ID를 가져옵니다

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(id).populate('user_id', 'name email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const postAuthorId = post.user_id._id;
    const isSubscriber = await Subscription.findOne({
      follower_id: postAuthorId,
      following_id: requestingUserId
    });

    const isSelfSubscriber = postAuthorId.equals(requestingUserId);

    if (!isSubscriber && !isSelfSubscriber) {
      return res.status(403).json({ message: 'You are not subscribed to this user' });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);  // 에러 로그
    res.status(500).json({ message: 'Error fetching post' });
  }
});


// 게시글 수정 라우트
app.put('/api/posts/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { title, content, image_name, memory_timeline, bgm } = req.body;
  const userId = req.user.id;  // JWT에서 인증된 사용자 ID를 가져옵니다

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.user_id.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.image_name = image_name || post.image_name;
    post.memory_timeline = memory_timeline || post.memory_timeline;
    post.bgm = bgm || post.bgm;

    await post.save();
    res.status(200).json({ message: 'Post updated successfully', post });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post' });
  }
});

// 게시글 삭제 라우트
app.delete('/api/posts/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;  // JWT에서 인증된 사용자 ID를 가져옵니다

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.user_id.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// 게시글 좋아요 라우트
app.post('/api/posts/:id/like', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;  // JWT에서 인증된 사용자 ID를 가져옵니다

  try {
    const existingLike = await PostLike.findOne({ post_id: id, user_id: userId });
    if (existingLike) {
      return res.status(400).json({ message: 'You already liked this post' });
    }

    const newLike = new PostLike({
      post_id: id,
      user_id: userId,
    });

    await newLike.save();
    await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } });

    const post = await Post.findById(id).populate('user_id');
    const notification = new Notification({
      user: post.user_id._id,
      type: 'like',
      message: `${req.user.name}님이 당신의 게시글에 좋아요를 눌렀습니다.`,
    });
    await notification.save();

    res.status(201).json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post' });
  }
});

  // 댓글 작성 라우트
app.post('/api/posts/:postId/comments', authenticateJWT, async (req, res) => {
  const { postId } = req.params;
  const { content, parentId } = req.body;
  const userId = req.user.id;  // JWT에서 인증된 사용자 ID를 가져옵니다

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newComment = new Comment({
      postId,
      userId,
      content,
      parentId: parentId || null,
    });

    await newComment.save();

    // 게시글 작성자에게 알림 전송
    if (!parentId) {
      const notification = new Notification({
        user: post.user_id._id,
        type: 'comment',
        message: `${user.name}님이 당신의 게시글에 댓글을 남겼습니다.`,
      });
      await notification.save();
    } else {
      // 부모 댓글 작성자에게 대댓글 알림 전송
      const parentComment = await Comment.findById(parentId).populate('userId');
      const notification = new Notification({
        user: parentComment.userId._id,
        type: 'reply',
        message: `${user.name}님이 당신의 댓글에 답글을 남겼습니다.`,
      });
      await notification.save();
    }

    res.status(201).json({ message: 'Comment created successfully', comment: newComment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
});

// 댓글 조회 라우트
app.get('/api/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;

  try {
    const comments = await Comment.find({ postId }).populate('userId', 'name');
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// 댓글 좋아요 라우트 (JWT 인증 필요)
app.post('/api/comments/:commentId/like', authenticateJWT, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id; // JWT에서 userId 가져오기

  try {
    const existingLike = await CommentLike.findOne({ commentId, userId });
    if (existingLike) return res.status(400).json({ message: 'You already liked this comment' });

    const newLike = new CommentLike({
      commentId,
      userId
    });

    await newLike.save();
    await Comment.findByIdAndUpdate(commentId, { $inc: { likes: 1 } });

    const comment = await Comment.findById(commentId).populate('userId');
    const notification = new Notification({
      user: comment.userId._id,
      type: 'like',
      message: `${req.user.name}님이 당신의 댓글에 좋아요를 눌렀습니다.`,
    });
    await notification.save();

    res.status(201).json({ message: 'Comment liked successfully' });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Error liking comment' });
  }
});

// 구독 등록 라우트 (JWT 인증 필요)
app.post('/api/users/:userId/subscribe', authenticateJWT, async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id; // JWT에서 followerId 가져오기

  try {
    const existingSubscription = await Subscription.findOne({ following_id: userId, follower_id: followerId });
    if (existingSubscription) return res.status(400).json({ message: 'Already subscribed' });

    const newSubscription = new Subscription({
      following_id: userId,
      follower_id: followerId
    });

    await newSubscription.save();
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ message: 'Error subscribing' });
  }
});

// 구독 취소 라우트 (JWT 인증 필요)
app.post('/api/users/:userId/unsubscribe', authenticateJWT, async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id; // JWT에서 followerId 가져오기

  try {
    const subscription = await Subscription.findOneAndDelete({ following_id: userId, follower_id: followerId });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });

    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Error unsubscribing' });
  }
});

// 구독자 목록 조회 라우트 
app.get('/api/subscribers/:userId', authenticateJWT, async (req, res) => {
  const { userId } = req.params;  // 조회할 사용자의 ID

  try {
      const subscribers = await Subscription.find({ following_id: userId })
          .populate('follower_id', 'name email');
      res.status(200).json(subscribers);
  } catch (error) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

// 알림 조회
app.get('/api/notifications/:userId', authenticateJWT, async (req, res) => {
  const { userId } = req.params;

  // JWT에서 추출한 사용자 ID와 요청된 userId가 일치하는지 확인
  if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
  }

  try {
      const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
      res.status(200).json(notifications);
  } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// 알림 읽음 상태 업데이트
app.put('/api/notifications/:notificationId/read', authenticateJWT, async (req, res) => {
  const { notificationId } = req.params;

  try {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
          return res.status(404).json({ message: 'Notification not found' });
      }

      // JWT에서 추출한 사용자 ID와 알림의 소유자가 일치하는지 확인
      if (notification.user.toString() !== req.user.id) {
          return res.status(403).json({ message: 'You are not authorized to update this notification' });
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
