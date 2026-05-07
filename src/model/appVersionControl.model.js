const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const appVersionControl = new Schema({
    appName: String,
    appVersion: String,
});

module.exports = remoteMongoDb.model('AppVersionControl', appVersionControl);