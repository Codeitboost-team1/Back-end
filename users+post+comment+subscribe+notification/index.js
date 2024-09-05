const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

const cors = require('cors');

// MongoDB 연결 설정
mongoose.connect('mongodb://localhost:27017/piecehouseDB')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
  });

const express = require('express');
const bcrypt  = require('bcrypt');
const router  = express.Router();
const User     = require('./models/User');
const Post     = require('./models/post');
const PostLike = require('./models/Post_like');
const Comment  = require('./models/Comment');
const Subscription = require('./models/Subscription');
const app = express();
const port = process.env.PORT || 3000;

  // JSON 파싱을 위한 미들웨어
app.use(cors());
app.use(express.json());
app.use(router);

// 회원가입 라우트
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Step 1: 이메일 중복 체크
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Email already exists'); // 로그 추가
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Step 2: 비밀번호 해싱
        if (!password) {
            console.error('Password is missing');
            return res.status(400).json({ message: 'Password is required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully'); // 로그 추가

        // Step 3: 새로운 사용자 생성
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        // Step 4: 사용자 저장
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

        res.status(200).json({ message: "User logged in successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in user' });
    }
});

// 게시글 작성 라우트
app.post('/api/posts', async (req, res) => {
  const { title, content, image_name, memory_timeline, bgm, userId } = req.body;

  try {
      // Step 1: 작성자 확인
    const author = await User.findById(userId);
    if (!author) return res.status(400).json({ message: "Invalid author ID" });

      // Step 2: 게시글 생성
    const newPost = new Post({
      title,
      content,
      image_name,
      memory_timeline,
      bgm,
      user_id: userId
    });

      // Step 3: 게시글 저장
    await newPost.save();

      // 작성자를 구독한 사용자들에게 알림 보내기
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
app.get('/api/posts/:id', async (req, res) => {
  const { id }           = req.params;
  const requestingUserId = req.query.userId;  // 쿼리 파라미터에서 요청자의 사용자 ID를 가져옵니다

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(id).populate('user_id', 'name email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

      // 게시글 작성자 ID
    const postAuthorId = post.user_id._id;

      // 요청자가 게시글 작성자의 구독자 목록에 있는지 확인
    const isSubscriber = await Subscription.findOne({
      follower_id : postAuthorId,
      following_id: requestingUserId
    });

      // 자신을 포함한 구독자 목록에 있는지 확인
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
app.put('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, image_name, memory_timeline, bgm, user_Id } = req.body;

  try {
    // 게시글 찾기
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // 작성자 확인
    if (post.user_id.toString() !== user_Id) {
      return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    // 게시글 업데이트
    post.title = title || post.title;
    post.content = content || post.content;
    post.image_name = image_name || post.image_name;
    post.memory_timeline = memory_timeline || post.memory_timeline;
    post.bgm = bgm || post.bgm;

    await post.save();
    res.status(200).json({ message: 'Post updated successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Error updating post' });
  }
});

// 게시글 삭제 라우트
app.delete('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    // 게시글 찾기
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // 작성자 확인
    if (post.user_id.toString() !== user_id) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    const result = await Post.findByIdAndDelete(id);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
});

  // 게시글 좋아요 라우트
app.post('/api/posts/:id/like', async (req, res) => {
  const { id }     = req.params;
  const { userId } = req.body;

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

      // 게시글 작성자에게 알림 전송
    const post         = await Post.findById(id).populate('user_id');
    const notification = new Notification({
      user   : post.user_id._id,
      type   : 'like',
      message: `${userId}님이 당신의 게시글에 좋아요를 눌렀습니다.`,
    });
    await notification.save();

    res.status(201).json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post' });
  }
});

  // 댓글 작성 라우트
app.post('/api/posts/:postId/comments', async (req, res) => {
  const { postId }                    = req.params;
  const { userId, content, parentId } = req.body;

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
        user   : post.user_id._id,
        type   : 'comment',
        message: `${user.name}님이 당신의 게시글에 댓글을 남겼습니다.`,
      });
      await notification.save();
    } else {
        // 부모 댓글 작성자에게 대댓글 알림 전송
      const parentComment = await Comment.findById(parentId).populate('userId');
      const notification  = new Notification({
        user   : parentComment.userId._id,
        type   : 'reply',
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

// 댓글 조회 라우트 (댓글과 대댓글 모두 조회)
app.get('/api/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;

  try {
    // 게시물 확인
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // 댓글과 대댓글 조회
    const comments = await Comment.find({ postId }).populate('userId', 'name email').populate('parentId');
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

  // 알림 조회 라우트
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// 구독 생성 라우트
router.post('/api/subscribe', async (req, res) => {
  const { follower_id, following_id } = req.body;

  try {
      const existingSubscription = await Subscription.findOne({ follower_id, following_id });
      if (existingSubscription) {
          return res.status(400).json({ message: 'Already subscribed to this user' });
      }

      const newSubscription = new Subscription({ follower_id, following_id });
      await newSubscription.save();

      res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
      console.error('Error subscribing:', error);
      res.status(500).json({ message: 'Error subscribing to user' });
  }
});

// 구독 취소 라우트
router.delete('/api/unsubscribe', async (req, res) => {
  const { follower_id, following_id } = req.body;

  try {
      const subscription = await Subscription.findOneAndDelete({ follower_id, following_id });
      if (!subscription) {
          return res.status(404).json({ message: 'Subscription not found' });
      }

      res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ message: 'Error unsubscribing from user' });
  }
});


// 구독자 목록 조회 라우트
router.get('/api/subscribers/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
      const subscribers = await Subscription.find({ following_id: userId }).populate('follower_id', 'name email');
      res.status(200).json(subscribers);
  } catch (error) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

//알림 조회
router.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// 알림 읽음 상태 업데이트
router.put('/api/notifications/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});