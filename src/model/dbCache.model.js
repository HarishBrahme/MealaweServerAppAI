const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const dbCache = new Schema({
    key: String,
    data: String,
    createdAt: Date
});
dbCache.index({ 'createdAt': 1 }, { expireAfterSeconds: 60 * 60 });
module.exports = remoteMongoDb.model('DBCache', dbCache);