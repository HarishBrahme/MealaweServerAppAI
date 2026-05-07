const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const marketPlaceItemOrder = new Schema({
    orderNo: { type: String },
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerName: { type: String },
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
    orderstatus: {
        type: String,
        enum: [
            'paymentInprogress', 'paymentFailed', 'placed', 'accepted',
            'cancelledBySeller', 'packagingInProgess', 'readyToDelivery', 'inTransit',
            'outForDelivery', 'delivered', 'refundCompleted'
        ]
    },
    orderType: { type: String, enum: ['marketPlaceItem'] },
    orderCreatedBy: {
        type: String,
        enum: ['navmool_web', 'mealawe_app_ios', 'mealawe_app_android', 'mealawe_web', 'Admin', 'Auto', 'User'],
        default: 'mealawe_app_ios'
    },
    orderDate: { type: Date },
    itemId: { type: Schema.Types.ObjectId },
    itemName: { type: String },
    itemActualName: { type: String },
    feedbackProvided: { type: Boolean, default: false },
    imageUrls: [{ type: String }],
    count: { type: Number },
    itemPrice: { type: Number },
    itemDescription: { type: String },
    searchCategory: { type: String },
    groupCategory: { type: String },
    groupCategoryId: { type: Schema.Types.ObjectId },
    itemServingText: { type: String },
    itemServingValue: { type: Number },
    itemServingUnit: { type: String },
    discount: { type: Number },
    length: { type: Number },
    breadth: { type: Number },
    height: { type: Number },
    weight: { type: Number },
    inventoryInfo: {
        inventoryId: { type: Schema.Types.ObjectId },
        inventoryName: { type: String },
        pocName: { type: String },
        pocPhNo: { type: String },
        address: {
            address1: { type: String },
            address2: { type: String },
            landmark: { type: String },
            pincode: { type: Number },
            city: { type: String },
            state: { type: String }
        },
        geolocation: { lat: Number, lng: Number }
    },
    statusHistory: [{
        orderstatus: String,
        updatedOn: Date,
        updatedBy: String,
        updateByType: String
    }],
    mainOrderNo: { type: String },
    deliveryVendor: { type: String },
    deliveryTaskId: { type: String },
    receipt: { type: String },
    refund_id: { type: String },
    refund_status: { type: String },
    refund_amount: { type: Number },
    cancel_comment: { type: String },
    shipmentId: { type: String },
    standAloneShipment: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = remoteMongoDb.model('MarketPlaceItemOrder', marketPlaceItemOrder);