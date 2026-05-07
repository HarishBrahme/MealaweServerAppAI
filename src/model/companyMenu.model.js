const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const companyMenu = new Schema({
    itemName: { type: String, required: true },
    itemType: { type: String, enum: ['Veg', 'NonVeg'] },
    itemPrice: { type: Number, required: true },
    itemDescription: String,
});

module.exports = remoteMongoDb.model('CompanyMenu', companyMenu);