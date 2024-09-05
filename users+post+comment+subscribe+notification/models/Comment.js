// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },  // 댓글이 달린 게시물
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // 댓글 작성자
  content: { type: String, required: true },                                      // 댓글 내용
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // 부모 댓글 ID (대댓글의 경우 설정)
  createdAt: { type: Date, default: Date.now }                                      // 댓글 작성 시간
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
