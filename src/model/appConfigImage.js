const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const appConfigImage = new Schema({
    imageName: String,
    imageUrl: String,
});

module.exports = remoteMongoDb.model('AppConfigImage', appConfigImage);