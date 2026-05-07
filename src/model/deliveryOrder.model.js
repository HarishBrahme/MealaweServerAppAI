const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const deliveryOrder = new Schema({
    reference_id: String,
    request_id: String,
    deliveryTaskId: String,
    orderNoList: [{ type: Number }],
    deliveryTaskState: String,
    deliveryVendor: String,
    serverNameOrderType: String
});

module.exports = remoteMongoDb.model('DeliveryOrder', deliveryOrder);