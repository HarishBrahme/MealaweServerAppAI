const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const userMealaweWallet = new Schema({
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerPhoneNo: { type: String, required: true },
    customerEmail: { type: String },
    wallet_balance: { type: Number, required: true }
});

module.exports = remoteMongoDb.model('UserMealaweWallet', userMealaweWallet);