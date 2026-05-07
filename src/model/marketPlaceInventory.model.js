const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const marketPlaceInventory = new Schema({
    inventoryName: String,
    pocName: String,
    pocPhNo: String,
    address: {
        address1: String,
        address2: String,
        landmark: String,
        pincode: Number,
        city: String,
        state: String
    },
    geolocation: { lat: Number, lng: Number },
    itemList: [{
        itemId: String,
        itemName: String,
        availableQuantity: Number,
        itemServingUnit: String
    }]
});

module.exports = remoteMongoDb.model('MarketPlaceInventory', marketPlaceInventory);