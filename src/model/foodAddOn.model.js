const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const foodAddOn = new Schema({
    addOnName: { type: String, trim: true, index: true, required: true },
    aliasNames: String,
    imageUrl: String,
    hidetoKitchen: Boolean,
    addOnFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
    addOnType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
    itemServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
    addOnPrice: { type: Number, required: true },
    addOnMaxPrice: { type: Number, required: true },
    addOnDescription: String,
});



module.exports = remoteMongoDb.model('FoodAddOn', foodAddOn);