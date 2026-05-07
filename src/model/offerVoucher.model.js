const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const offerVoucher = new Schema({
    voucherCode: { type: String, unique: true, required: true },
    description: String,
    termsAndConditions: [{ type: String }],
    discountType: { type: String, enum: ['percentage', 'flat'] },
    orderTypes: [{ type: String, enum: ['advance', 'daily', 'allDay', 'subscription', 'bulk', 'marketPlaceMain', 'oyo','apartment_today','apartment_advance','apartmentBulk'] }],
    maxLimit: Number,
    minAmount: Number,
    discountValue: Number,
    startDate: Date,
    expiryDate: Date,
    voucherUsage: { type: String, enum: ['oneTimeOneUser', 'oneTimeOneDay', 'oneTimeOnly', 'everytime'] },
    clusters: [{ type: String }],
    marketplaceCategoryList: [{ type: String }]
});

module.exports = remoteMongoDb.model('OfferVoucher', offerVoucher);