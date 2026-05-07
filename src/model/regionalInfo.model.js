const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const regionalInfo = new Schema({
    name: String,
    imageUrl: String,
    keywords: String
});

module.exports = remoteMongoDb.model('RegionalInfo', regionalInfo);