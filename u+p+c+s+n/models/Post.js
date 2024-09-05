const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title          : {type: String, required: true},
  content        : { type: String, required: true },
  image_name     : { type: String, required: false, maxlength: 50 },                        // Image field with max length constraint
  memory_timeline: { type: Number, required: false },                                       // Assuming it’s an integer field for memory duration
  bgm            : { type: String, required: false },                                       // Assuming background music as a string (file path or name)
  user_id        : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // Foreign key referencing User
  createdAt      : { type: Date, default: Date.now },                                        // Timestamp of post creation
  likes: { type: Number, default: 0 } // 필드 추가: 좋아요 수
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
