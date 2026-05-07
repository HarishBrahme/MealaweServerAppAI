const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const marketPlaceGroup = new Schema({
    categoryName: String,
    imageUrl: String,
    pathName: String,
    groupName: String
});

module.exports = remoteMongoDb.model('MarketPlaceGroup', marketPlaceGroup);