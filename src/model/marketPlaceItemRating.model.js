const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const marketPlaceItemRating = new Schema({
    itemName: { type: String, index: true, required: true },
    itemId: { type: Schema.Types.ObjectId },
    itemServingUnit: String,
    rating: Number,
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerName: String,
    customerPhoneNo: { type: String, required: true },
    orderNo: String,
    masterOrderNo: String,
    ratingDate: Date
});

module.exports = remoteMongoDb.model('MarketPlaceItemRating', marketPlaceItemRating);