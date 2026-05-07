const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const banner = new Schema({
    imageUrl: String,
    searchBy: String,
    seqOrder: Number,
    type: String,
    packageCategory: String,
    packageSubCategory: String,
});

module.exports = remoteMongoDb.model('Banner', banner);