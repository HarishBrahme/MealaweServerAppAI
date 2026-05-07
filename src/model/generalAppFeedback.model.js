const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const generalAppFeedback = new Schema({
    feedbackFrom_id: { type: Schema.Types.ObjectId, required: true },
    feedbackFrom_name: { type: String, required: true },
    feedbackFrom_phoneNo: { type: String, required: true },
    feedbackFrom_userType: { type: String, enum: ['customer', 'homeChef', 'deliveryPartner'], required: true },
    feedbackType: { type: String, enum: ['suggestion', 'praise', 'complaint'] },
    feedbackComment: String,
    acknowledged: Boolean
});

module.exports = remoteMongoDb.model('GeneralAppFeedback', generalAppFeedback);