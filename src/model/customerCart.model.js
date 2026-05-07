const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const customerCart = new Schema({
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerName: String,
    itemList: [{
        itemName: String,
        quantity: Number,
        itemPrice: Number
    }],
    addOns: [{
        addOnsName: String,
        quantity: Number,
        addOnsPrice: Number
    }],
    orderType: { type: String, enum: ['advance', 'todays'] }
});

module.exports = remoteMongoDb.model('CustomerCart', customerCart);
