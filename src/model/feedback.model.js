const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const feedback = new Schema({
    feedbackFrom_id: { type: Schema.Types.ObjectId, required: true },
    feedbackFrom_name: { type: String, required: true },
    feedbackFrom_imageUrl: String,
    feedbackFrom_userType: { type: String, enum: ['customer', 'kitchenPartner', 'deliveryPartner', 'admin'], required: true },
    feedbackTo_id: { type: Schema.Types.ObjectId, required: true },
    feedbackTo_name: { type: String, required: true },
    feedbackTo_userType: { type: String, enum: ['customer', 'kitchenPartner', 'deliveryPartner', 'admin'], required: true },
    feedbackOrderNo: Number,
    feedbackComment: String,
    feedbackRating: Number,
    extraFeedback: [{ type: String }],
    feedbackDate: Date
});

module.exports = remoteMongoDb.model('feedback', feedback);