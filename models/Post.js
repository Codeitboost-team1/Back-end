const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title          : { type: String, required: true },                                        // 필수 입력 사항
  content        : { type: String, required: true },                                        // 필수 입력 사항
  image_name     : { type: String, required: false, maxlength: 50 },                        // 선택 사항, 최대 길이 50자
  memory_timeline: { type: Number, required: false },                                       // 선택 사항, 숫자형 필드
  user_id        : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // 필수 입력 사항, 외래키
  createdAt      : { type: Date, default: Date.now },                                       // 생성일시, 기본값 현재 시간
  likes          : { type: Number, default: 0 },                                            // 선택 사항, 기본값 0
  tags           : { type: [String], required: false },                                     // 선택 사항, 문자열 배열
  location       : { type: String, required: false },                                       // 선택 사항, 문자열형 필드
  date_recorded  : { type: Date, required: false }                                          // 선택 사항, 날짜형 필드
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
