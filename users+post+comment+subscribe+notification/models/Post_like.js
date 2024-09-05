const mongoose = require('mongoose');

const postLikeSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Foreign key referencing User
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // Foreign key referencing Post
});

const PostLike = mongoose.model('PostLike', postLikeSchema);

module.exports = PostLike;
