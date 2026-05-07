const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const orderBooking = new Schema({
    orderNo: Number,
    bookingOrderNo: Number,
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerName: String,
    customerLocation: {
        tagLocation: String,
        geolocation: { lat: Number, lng: Number },
        address: String,
        location: String,
        landmark: String,
        pincode: Number
    },
    customerPhoneNo: { type: String, required: true },
    customerEmail: { type: String },
    kitchenId: { type: Schema.Types.ObjectId, required: true },
    kitchenLoginId: String,
    kitchenName: String,
    kitchenPhoneNo: String,
    kitchenLocation: {
        address1: String,
        address2: String,
        landmark: String,
    },
    kitchenGeolocation: { lat: Number, lng: Number },
    orderType: { type: String, enum: ['advance', 'daily', 'allDay', 'subscription'] },
    mealType: { type: String, enum: ['Breakfast', 'Lunch', 'HighTea', 'Dinner'] },
    orderDate: Date,
    orderComplitionDate: Date,
    orderComplitionTime: Date,
    itemAmount: Number,
    amount: Number,
    deliveryCharges: Number,
    taxes: Number,
    discount: Number,
    kitchenDiscount: Number,
    bookingstatus: {
        type: String,
        enum: ['booked', 'acknowledged', 'accepted', 'rejected', 'created']
    },
    itemList: [{
        itemName: String,
        count: Number,
        itemPrice: Number,
        itemType: String,
        itemDescription: String,
        itemIsCombo: Boolean,
        itemIsBreakfast: Boolean,
        mealawePrice: Number,
        itemServingType: String,
        servingQuantity: Number,
        servingQuantityUnit: String,
    }],
    addOns: [{
        addOnName: String,
        count: Number,
        addOnPrice: Number,
        addOnType: String,
        mealawePrice: Number,
        hidetoKitchen: Boolean
    }],
    specialRequest: String,
    nonContactDelivery: Boolean,
    moneyWalletPointsUsed: Number,
    mealaweWalletPointsUsed: Number,
    distance: Number,
    mealaweDeliveryDiscount: Number,
    mealaweItemDiscount: Number,
    mealaweTotalAmt: Number,
    mealaweKitchenDiscount: Number,
    voucherCode: String,
    voucherDiscount: Number,
    extraDiscount: Number,
    slotStartTime: Date,
    slotEndTime: Date,
    specialMenuId: Schema.Types.ObjectId
});
module.exports = remoteMongoDb.model('OrderBooking', orderBooking);