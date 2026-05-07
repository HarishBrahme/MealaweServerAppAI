const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const imageGroupConfigSchema = new Schema({
    name: { type: String, required: true, unique: true },
    imageData: [{ type: String, required: true }],
}, {
    timestamps: true
});

module.exports = remoteMongoDb.model('ImageGroupConfig', imageGroupConfigSchema);