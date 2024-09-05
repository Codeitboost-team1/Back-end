  // models/Notification.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 알림 받는 사람
  type: { type: String, required: true }, // 알림 타입 (예: 'new_post', 'like', 'comment', 'reply')
  message: { type: String, required: true }, // 알림 내용
  isRead: { type: Boolean, default: false }, // 읽음 여부
  createdAt: { type: Date, default: Date.now }, // 알림 생성 시간
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
