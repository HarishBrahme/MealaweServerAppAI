const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const fcmCloudMessage = new Schema({
    profileId: { type: Schema.Types.ObjectId, required: true },
    fcmToken: String
});

module.exports = remoteMongoDb.model('FcmCloudMessage', fcmCloudMessage);