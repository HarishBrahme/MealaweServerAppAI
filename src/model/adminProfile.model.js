const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const adminProfile = new Schema({
    name: String,
    imageUrl: String,
    phoneNo: { type: String, unique: true, required: true },
    email: { type: String, unique: true },
    loginId: { type: String, required: true },
    role: String,
    policy_name: String,
    inventoryDetails: {
        inventoryName: String,
        _id: { type: Schema.Types.ObjectId },
    },
    cluster_allowed: [{
        clusterId: String,
        clusterName: String,
        allowed: Boolean
    }],
    delivery_route_no: Number,
    oyo_details: [{
       hotel_name: String,
       hotel_id: String
    }]
});

module.exports = remoteMongoDb.model('AdminProfile', adminProfile);