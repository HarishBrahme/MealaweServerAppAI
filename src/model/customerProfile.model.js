const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const customerProfile = new Schema({
    userName: { type: String, index: true },
    imageUrl: String,
    addressList: [{
        tagLocation: String,
        geolocation: { lat: Number, lng: Number },
        address: String,
        location: String,
        landmark: String,
        pincode: Number,
        city: String,
        state: String,
        currentlySelected: Boolean
    }],
    currentLocation: {
        tagLocation: String,
        geolocation: { lat: Number, lng: Number },
        address: String,
        location: String,
        landmark: String,
        pincode: Number,
        city: String,
        state: String
    },
    phoneNo: { type: String, unique: true, required: true },
    email: { type: String },
    preferences: String,
    loginId: { type: Schema.Types.ObjectId, required: true },
    referralCode: String,
    installReferrer: String,
    couponList: [{ type: String }],
    createdOn: Date,
    lastLogin: { type: Date },
    registeredPlatform: {
        type: String,
        enum: ['navmool_web', 'mealawe_app_ios', 'mealawe_app_android', 'mealawe_web'],
        default: 'mealawe_app_ios'
    },
    rmInfo: {
        rmId: String,
        rmName: String
    },
    navmoolOrderPlaced: { type: Boolean, default: false },
    mealaweOrderPlaced: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = remoteMongoDb.model('CustomerProfile', customerProfile);