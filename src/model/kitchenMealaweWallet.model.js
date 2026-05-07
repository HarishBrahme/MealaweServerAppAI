const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const kitchenMealaweWallet = new Schema({
    kitchenId: { type: Schema.Types.ObjectId, required: true },
    kitchenPartnerName: { type: String, required: true },
    kitchenName: { type: String, required: true },
    kitchenPhoneNo: { type: String, required: true },
    kitchenEmail: { type: String },
    wallet_balance: { type: Number, required: true }
});

module.exports = remoteMongoDb.model('KitchenMealaweWallet', kitchenMealaweWallet);