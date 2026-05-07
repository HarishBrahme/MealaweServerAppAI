const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const marketPlaceMainOrder = new Schema({
    orderNo: String,
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerName: String,
    customerLocation: {
        tagLocation: String,
        geolocation: { lat: Number, lng: Number },
        address: String,
        location: String,
        landmark: String,
        pincode: Number,
        city: String,
        state: String
    },
    customerPhoneNo: { type: String, required: true },
    customerEmail: { type: String },
    orderType: { type: String, enum: ['marketPlaceMain'] },
    orderCreatedBy: {
        type: String,
        enum: ['navmool_web', 'mealawe_app_ios', 'mealawe_app_android', 'mealawe_web', 'Admin', 'Auto', 'User'],
        default: 'mealawe_app_ios'
    },
    orderDate: Date,
    amount: Number,
    totalItemAmount: Number,
    totalItemDiscount: Number,
    orderstatus: {
        type: String,
        enum: ['paymentInitiated', 'paymentInprogress', 'paymentFailed', 'placed', 'accepted', 'cancelledByUser',
            'cancelledBySeller', 'rejectedBySeller']
    },
    itemList: [{
        orderNo: Number,
        itemId: { type: Schema.Types.ObjectId },
        itemName: String,
        imageUrls: [{ type: String }],
        count: Number,
        itemPrice: Number,
        itemDescription: String,
        searchCategory: String,
        groupCategory: String,
        groupCategoryId: { type: Schema.Types.ObjectId },
        itemServingText: String,
        itemServingValue: Number,
        itemServingUnit: String,
        discount: Number,
        length: Number,
        breadth: Number,
        height: Number,
        weight: Number,
    }],
    payment_id: String,
    order_id: String,
    receipt: String,
    refund_id: String,
    refund_status: String,
    refund_amount: Number,
    cancel_comment: String,
    moneyWalletPointsUsed: Number,
    mealaweWalletPointsUsed: Number,
    statusHistory: [{
        orderstatus: String,
        updatedOn: Date,
        updatedBy: String,
        updateByType: String
    }],
    stopRefundProcess: Boolean,
    cgst: Number,
    sgst: Number,
    taxes: Number,
    voucherCode: String,
    voucherDiscount: Number,
    stopPaymentValidation: Boolean,
    platformCharges: Number,
    couponCode: String,
    couponDiscount: Number,
    finalDiscount: Number,
    deliveryCharges: Number,
    deliveryDiscount: Number,
    pgName: String,
    transactionTime: Date
});
module.exports = remoteMongoDb.model('MarketPlaceMainOrder', marketPlaceMainOrder);