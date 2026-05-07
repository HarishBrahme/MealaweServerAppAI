const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const deliveryPartner = new Schema({
    name: String,
    imageUrl: String,
    vehicleNo: String,
    geolocation: { latitude: Number, longitude: Number },
    phoneNo: { type: String, unique: true, required: true },
    email: { type: String, unique: true },
});

module.exports = remoteMongoDb.model('DeliveryPartner', deliveryPartner);