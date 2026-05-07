const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const kitchenWallet = new Schema({
    kitchenName: { type: String, required: true },
    kitchenId: { type: Schema.Types.ObjectId, required: true },
    kitchenPartnerName: { type: String, required: true },
    loginId: String,
    phoneNo: { type: String, required: true },
    email: String,
    contact_id: { type: String },
    fund_id: { type: String },
    ifsc: { type: String },
    bank_name: { type: String },
    account_name: { type: String },
    account_number: { type: String },
    wallet_balance: { type: Number, required: true },
});

module.exports = remoteMongoDb.model('KitchenWallet', kitchenWallet);
