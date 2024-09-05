// models/CommentLike.js
const mongoose = require('mongoose');

const commentLikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true }
});

const CommentLike = mongoose.model('CommentLike', commentLikeSchema);

module.exports = CommentLike;
