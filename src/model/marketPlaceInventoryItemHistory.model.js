const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const marketPlaceInventoryItemHistory = new Schema({
    inventoryId: { type: Schema.Types.ObjectId },
    inventoryName: String,
    itemId: String,
    itemName: String,
    itemServingUnit: String,
    previousQuantity: Number,
    transactionQuantity: Number,
    finalQuantity: Number,
    transactionType: { type: String, enum: ['ADD', 'REMOVE'], required: true },
    orderNo: String,
    created_at: Date,
});

module.exports = remoteMongoDb.model('MarketPlaceInventoryItemHistory', marketPlaceInventoryItemHistory);