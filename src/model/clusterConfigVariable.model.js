const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const clusterConfigVariable = new Schema({
    configName: {
        type: String,
        required: true,
        unique: true
    },
    subscriptionPlatformCharges: {
        type: Number,
        required: true,
    },
    subscriptionPlatformChargesDiscount: {
        type: Number,
        required: true,
    },
    subscriptionDeliveryCharges: {
        type: Number,
        required: true,
    },
    subscriptionDeliveryChargesDiscount: {
        type: Number,
        required: true,
    },
    subscriptionEcoFriendlyPackagingCharges: {
        type: Number,
        required: true,
    },
    subscriptionEcoFriendlyPackagingChargesDiscount: {
        type: Number,
        required: true,
    },
    onDemandPlatformCharges: {
        type: Number,
        required: true,
    },
    onDemandPlatformChargesDiscount: {
        type: Number,
        required: true,
    },
    onDemandPlatformChargesGstPercentage: {
        type: Number,
        required: true,
    },
    onDemandDeliveryCharges: {
        type: Number,
        required: true,
    },
    onDemandDeliveryChargesDiscount: {
        type: Number,
        required: true,
    },
    onDemandDeliveryGstPercentage: {
        type: Number,
        required: true,
    },
    onDemandEcoFriendlyPackagingCharges: {
        type: Number,
        required: true,
    },
    onDemandEcoFriendlyPackagingChargesDiscount: {
        type: Number,
        required: true,
    },
    onDemandEcoFriendlyPackagingGstPercentage: {
        type: Number,
        required: true,
    },
    subscriptionPlatformGstPercentage: {
        type: Number,
        required: true,
    },

    subscriptionEcoFriendlyPackagingGstPercentage: {
        type: Number,
        required: true,
    },
    subscriptionDeliveryGstPercentage: {
        type: Number,
        required: true,
    },

    bulkPlatformChargesGstPercentage: {
        type: Number,
        required: true,
    },

    bulkEcoFriendlyPackagingGstPercentage: {
        type: Number,
        required: true,
    },
    bulkDeliveryGstPercentage: {
        type: Number,
        required: true,
    },
    // subscriptionScrenType: {
    //     type: Number,
    //     required: true,
    // }, 

    showSubscription: {
        type: Boolean,
        required: true
    },
    showOndemand: {
        type: Boolean,
        required: true
    },
    showClusterMenu: {
        type: Boolean,
        required: true
    },
    // showOyo:{
    //     type:Boolean,
    //     required:true
    // },
    showNavmool: {
        type: Boolean,
        required: true
    },
    showBulk: {
        type: Boolean,
        required: true
    },

    showApartment: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true // Enable timestamps
});

module.exports = remoteMongoDb.model('ClusterConfigVariable', clusterConfigVariable);