const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, unique: true },
  feedName: { type: String },
  bio: { type: String },
  profilePicture: { type: String },  // URL 또는 파일 경로
});

const User = mongoose.model('User', userSchema);

module.exports = User;
