const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const foodItem = new Schema({
    itemName: { type: String, trim: true, index: true, required: true },
    aliasNames: String,
    imageUrl: String,
    itemRegion: String,
    itemType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
    itemFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
    itemServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
    itemPrice: { type: Number, required: true },
    maxItemPrice: { type: Number, required: true },
    itemDescription: String,
    isAddon: Boolean,
    searchCategory: String,
    groupCategory: String,
    searchKeyword: String,
    itemIsBreakfast: Boolean,
    itemIsCombo: Boolean,
    isSpecialMenu: Boolean,
    deliveryDate: Date,
    specialQuantityAvailable: Number,
    showInAdvance: Boolean,
    showInAllDay: Boolean,
    preparationTime: Number,
    inflatePrice: Boolean
});

module.exports = remoteMongoDb.model('FoodItem', foodItem);