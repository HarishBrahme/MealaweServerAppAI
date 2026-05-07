const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const userMealaweTransactionHistory = new Schema({
    status: String,
    remark: String,
    transaction_points: { type: Number, required: true },
    created_at: Date,
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerName: String,
    wallet_balance: { type: Number, required: true },
    transactionType: { type: String, enum: ['Debit', 'Credit'], required: true }
});

module.exports = remoteMongoDb.model('UserMealaweTransactionHistory', userMealaweTransactionHistory);