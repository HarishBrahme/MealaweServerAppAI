const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const dishSuggestion = new Schema({
    dishName: String,
    dishType: String,
    dishRegion: String,
    description: String,
    kitchenName: String,
    kitchenLoginId: String,
    kitchenPhoneNo: String,
    kitchenPartnerName: String,
    acknowledged: Boolean
});

module.exports = remoteMongoDb.model('DishSuggestion', dishSuggestion);