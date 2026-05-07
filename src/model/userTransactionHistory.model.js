const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const userTransactionHistory = new Schema({
    status: String,
    remark: String,
    transaction_points: { type: Number, required: true },
    created_at: Date,
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerName: String,
    wallet_balance: { type: Number, required: true },
    transactionType: { type: String, enum: ['Debit', 'Credit'], required: true },
    category: { type: String, enum: ['Package Upgrade', 'Social Reviews','Out Of City', 'Out Of Cluster', 'Allday Order Not FullFilled', 'Food Quality','Delivery Issue','Agent Error','Not Agreed For Wallet Refund','Other']}
});

module.exports = remoteMongoDb.model('UserTransactionHistory', userTransactionHistory);