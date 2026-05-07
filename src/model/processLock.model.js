const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const processLock = new Schema({
    processName: { type: String, unique: true, required: true },
    createdAt: Date
});
processLock.index({ 'createdAt': 1 }, { expireAfterSeconds: 30 });
module.exports = remoteMongoDb.model('ProcessLock', processLock);