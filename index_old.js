const mongoose = require('mongoose');

// MongoDB 연결 설정
// MongoDB Atlas 연결 설정
mongoose.connect('mongodb+srv://gpyo0111:tjrlvy01122@codeitboost.qqddh.mongodb.net/codeitboost?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('Could not connect to MongoDB Atlas', err);
  });


const express = require('express');
const bcrypt  = require('bcrypt');
const User    = require('./models/User');
const Post    = require('./models/post');
const PostLike = require('./models/Post_like');
const Comment = require('./models/Comment');
const CommentLike = require('./models/CommentLike');
const app = express();
const port = 3000;

// JSON 파싱을 위한 미들웨어
app.use(express.json());

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
    res.status(201).json({ message: 'sPost created successfully', post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// 게시글 조회 라우트
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }
    const post = await Post.findById(id).populate('user_id', 'name email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error); // 에러 로그
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
    const { id } = req.params;
    const { userId } = req.body;

    try {
        // 좋아요 중복 체크
        const existingLike = await PostLike.findOne({ post_id: id, user_id: userId });
        if (existingLike) {
            return res.status(400).json({ message: 'You already liked this post' });
        }

        // 새로운 좋아요 생성
        const newLike = new PostLike({
            post_id: id,
            user_id: userId,
        });

        // 좋아요 저장
        await newLike.save();

        // 게시글의 좋아요 수 증가
        await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } });
        
        res.status(201).json({ message: 'Post liked successfully' });
    } catch (error) {
        console.error('Error liking post:', error); // 에러 로그
        res.status(500).json({ message: 'Error liking post' });
    }
});

// 댓글 작성 라우트
app.post('/api/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params;
  const { userId, content, parentId } = req.body;

  try {
    // 게시물 확인
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // 사용자 확인
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 댓글 생성
    const newComment = new Comment({
      postId,
      userId,
      content,
      parentId: parentId || null  // 부모 댓글이 없는 경우 null로 설정
    });

    // 댓글 저장
    await newComment.save();
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
app.post('/api/posts/:postId/comments/:commentId/like', async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (!commentId || !userId) {
    return res.status(400).json({ message: 'CommentId and UserId are required' });
  }

  try {
    // 댓글 확인
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // 좋아요 중복 체크
    const existingLike = await CommentLike.findOne({ commentId, userId });
    if (existingLike) {
      return res.status(400).json({ message: 'You already liked this comment' });
    }

    // 새로운 좋아요 생성
    const newLike = new CommentLike({
      commentId,
      userId,
    });

    // 좋아요 저장
    await newLike.save();

    // 댓글의 좋아요 수 증가
    await Comment.findByIdAndUpdate(commentId, { $inc: { likes: 1 } });

    res.status(201).json({ message: 'Comment liked successfully' });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Error liking comment' });
  }
});



// 댓글 좋아요 제거 
app.delete('/api/comments/:commentId/like', async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  try {
    // 댓글 확인
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // 좋아요 확인
    const existingLike = await CommentLike.findOne({ commentId, userId });
    if (!existingLike) return res.status(404).json({ message: 'Like not found' });

    // 좋아요 제거
    await CommentLike.findByIdAndDelete(existingLike._id);

    // 댓글의 좋아요 수 감소 
    await Comment.findByIdAndUpdate(commentId, { $inc: { likes: -1 } });

    res.status(200).json({ message: 'Comment unliked successfully' });
  } catch (error) {
    console.error('Error unliking comment:', error);
    res.status(500).json({ message: 'Error unliking comment' });
  }
});

// 댓글 좋아요 수 조회 
app.get('/api/comments/:commentId/likes', async (req, res) => {
  const { commentId } = req.params;

  try {
    // 댓글 확인
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // 좋아요 수 조회
    const likesCount = await CommentLike.countDocuments({ commentId });
    
    res.status(200).json({ likes: likesCount });
  } catch (error) {
    console.error('Error fetching comment likes:', error);
    res.status(500).json({ message: 'Error fetching comment likes' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});