const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const appConfigVideo = new Schema({
    videoName: String,
    videoUrl: String,
});

module.exports = remoteMongoDb.model('AppConfigVideo', appConfigVideo);