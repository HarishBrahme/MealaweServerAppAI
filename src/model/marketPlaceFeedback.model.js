const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const marketPlaceFeedback = new Schema({
    feedbackFrom_id: { type: String, required: true },
    feedbackFrom_name: { type: String, required: true },
    feedbackFrom_imageUrl: String,
    feedbackFrom_userType: { type: String, required: true },
    feedbackTo_id: { type: Schema.Types.ObjectId, required: true },
    feedbackTo_name: { type: String, required: true },
    feedbackTo_userType: { type: String, required: true },
    feedbackOrderNo: Number,
    feedbackComment: String,
    feedback_orderType: { type: String, required: true },
    feedbackRating: Number,
    extraFeedback: [{ type: String }]
});

module.exports = remoteMongoDb.model('MarketPlaceFeedback', marketPlaceFeedback);