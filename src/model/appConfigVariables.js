const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const appConfigVariable = new Schema({
    configName: String,
    configData: Object,
    configIndex: Number
});

module.exports = remoteMongoDb.model('AppConfigVariable', appConfigVariable);