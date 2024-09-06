const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }, // 추가
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  memoryBoxName: { type: String } // 추가
});

const User = mongoose.model('User', userSchema);

module.exports = User;
