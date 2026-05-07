const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const foodItem = new Schema({
    imageUrl: String,
    group: String,
    itemName: { type: String, trim: true, index: true, required: true },
    itemType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
    itemFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
    itemServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
    slab1Price: { type: Number, required: true },
    slab2Price: { type: Number, required: true },
    slab3Price: { type: Number, required: true },
    slab4Price: { type: Number, required: true },
    payAmtToKitchen: Number,
    itemDescription: String,
    packagingCost: Number,
    packagingDescription: String,
});

module.exports = remoteMongoDb.model('bulkFoodItem', foodItem);