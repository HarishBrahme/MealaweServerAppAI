const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const kitchenTransactionHistory = new Schema({
    payout_id: { type: String },
    fund_id: { type: String },
    c: {type: Schema.Types.ObjectId},
    status: {type: String, enum:[ 'Initiated','Pending', 'Failed', 'Review_With_Bank','Success','Refund','inprogress'], required: true},
    mode: String,
    remark: String,
    transaction_amount: { type: Number, required: true },
    created_at: Date,
    kitchenId: { type: Schema.Types.ObjectId, required: true },
    kitchenName: { type: String, required: true },
    walletPreviousBalance: { type: Number, required: true },
    transactionType: { type: String, enum: ['Debit', 'Credit'], required: true },
    stopTransactionValidation:{
        type: Boolean,
        default:false
    },
    withdrawalBy:{ type: String},
    category: { type: String, enum: ['Refund', 'Compensation', 'Promotion', 'Inventory amount deduct', 'Reward','offline','complimentary','penalty','Bank transfer','Other']}
});

module.exports = remoteMongoDb.model('KitchenTransactionHistory', kitchenTransactionHistory);