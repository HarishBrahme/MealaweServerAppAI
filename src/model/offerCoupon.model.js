const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const offerCoupon = new Schema({
    couponCode: { type: String, unique: true, required: true },
    couponHeader: String,
    description: String,
    subDescription: String,
    termsAndConditions: [{ type: String }],
    discountType: { type: String, enum: ['percentage', 'flat'] },
    maxLimit: Number,
    minAmount: Number,
    discountValue: Number,
    startDate: Date,
    expiryDate: Date,
    orderTypes: [{ type: String, enum: ['advance', 'daily', 'allDay', 'subscription', 'bulk', 'marketPlaceMain', 'oyo','apartment_today','apartment_advance','apartmentBulk'] }],
    couponScope: { type: String, enum: ['generic', 'userSpecific'] },
    couponUsage: { type: String, enum: ['oneTimeOneUser', 'oneTimeOneDay', 'everytime'] },
    offerAppliedOn: { type: String, enum: ['billAmount', 'itemAmount'] },
    discountOnDelivery: Boolean,
    discountOnItems: Boolean,
    appliedOnlyOnSpecial: Boolean,
    applyFullDiscount: Boolean,
    seqWeightage: Number,
    clusters: [{ type: String }],
    marketplaceCategoryList: [{ type: String }]
});

module.exports = remoteMongoDb.model('OfferCoupon', offerCoupon);