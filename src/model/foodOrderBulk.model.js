const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const foodOrderBulk = new Schema({
    orderNo: String,
    customerId: Schema.Types.ObjectId,
    customerName: String,
    customerPhoneNo: String,
    customerEmail: String,
    groupType: String,
    companyName: String,
    numberOfPeople: Number,
    occassion: String,
    address: String,
    mealType: String,
    orderDate: Date,
    orderComplitionDate: Date,
    orderComplitionTime: Date,
    orderStatus: { type: String, enum: ['placed', 'inprogress', 'completed', 'rejected', 'preparing'] },
    comment: String,
    clusterId: String,
    clusterName: String,
    pgName: String,
    transactionTime: Date
});

module.exports = remoteMongoDb.model('FoodOrderBulk', foodOrderBulk);