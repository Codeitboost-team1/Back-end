const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    follower_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
