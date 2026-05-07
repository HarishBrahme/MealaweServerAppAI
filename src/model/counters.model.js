const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const counters = new Schema({
    collectionName: { type: String, unique: true, required: true },
    sequenceValue: Number,
});
module.exports = remoteMongoDb.model('Counters', counters);