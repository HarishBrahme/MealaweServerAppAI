const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});
const kitchenMenu = new Schema({
  kitchenName: { type: String, trim: true, required: true },
  kitchenId: { type: Schema.Types.ObjectId, required: true },
  kitchenSpeciality: String,
  kitchenMainSpeciality: String,
  kitchenOpened: Boolean,
  kitchenType: [{ type: String, enum: ['B2C', 'B2B', 'Subscription', 'Oyo', 'Tier2', 'Apartment'] }],
  clusters: [{ type: String }],
  location: { type: pointSchema, index: '2dsphere' },
  itemList: [{
    itemName: { type: String, trim: true, index: true, required: true },
    imageUrl: String,
    itemRegion: String,
    aliasNames: String,
    itemFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
    itemType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
    itemServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
    itemIsCombo: Boolean,
    itemIsApartment: Boolean, // ADD THIS LINE
    itemIsBreakfast: Boolean,
    itemPrice: { type: Number, required: true },
    maxItemPrice: { type: Number, required: true },
    itemDescription: String,
    spicyLevel: { type: Number, min: 0, max: 3 },
    servesTo: { type: Number, required: true },
    tasteOfRegion: String,
    itemAvailable: Boolean,
    mainMenuItemId: { type: Schema.Types.ObjectId },
    servingQuantity: Number,
    servingQuantityUnit: String,
    searchCategory: String,
    groupCategory: String,
    searchKeyword: String,
    serveDaily: Boolean,
    isSpecialMenu: Boolean,
    deliveryDate: Date,
    specialQuantityAvailable: Number,
    showInAdvance: Boolean,
    showInAllDay: Boolean,
    preparationTime: Number,
    inflatePrice: Boolean
  }],
  addOnsList: [{
    addOnName: { type: String, trim: true, index: true, required: true },
    aliasNames: String,
    imageUrl: String,
    addOnFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
    addOnType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
    addOnServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
    addOnPrice: { type: Number, required: true },
    addOnMaxPrice: { type: Number, required: true },
    spicyLevel: { type: Number, min: 0, max: 3 },
    addOnDescription: String,
    addOnAvailable: Boolean,
    mainMenuAddonId: { type: Schema.Types.ObjectId },
    servingQuantity: Number,
    servingQuantityUnit: String,
    searchCategory: String,
    groupCategory: String,
    searchKeyword: String,
    preparationTime: Number,
    inflatePrice: Boolean
  }]
});

module.exports = remoteMongoDb.model('KitchenMenu', kitchenMenu);