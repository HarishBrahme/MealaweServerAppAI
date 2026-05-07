const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const cashback = new Schema({
    title: String,
    status: { type: String, enum: ['New', 'Updated', 'Used', 'Expired'], required: true },
    remark: String,
    cashbackPoints: { type: Number, required: true },
    createdOn: Date,
    expiryOn: Date,
    lastUpdatedOn: Date,
    customerId: { type: Schema.Types.ObjectId, required: true, index: true },
    customerName: String,
    customerPhoneNo: { type: String, required: true },
    customerEmail: { type: String },
    updateHistory: [{
        previousAmount: Number,
        previousRemark: String,
        usedAmount: Number,
        updatedOn: Date,
        updateRemark: String
    }]

});

module.exports = remoteMongoDb.model('Cashback', cashback);