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
const todaysMenu = new Schema({
  kitchenName: { type: String, trim: true, required: true },
  kitchenId: { type: Schema.Types.ObjectId, required: true },
  kitchenSpeciality: String,
  kitchenMainSpeciality: String,
  kitchenOpened: Boolean,
  clusters: [{ type: String }],
  location: { type: pointSchema, index: '2dsphere' },
  menuCreatedOn: { type: Date, required: true },
  itemList: [{
    itemName: { type: String, trim: true, index: true, required: true },
    imageUrl: String,
    itemRegion: String,
    aliasNames: String,
    itemFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
    itemType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
    itemServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
    itemIsCombo: Boolean,
    itemIsBreakfast: Boolean,
    itemPrice: { type: Number, required: true },
    maxItemPrice: Number,
    itemDescription: String,
    spicyLevel: { type: Number, min: 1, max: 3 },
    servesTo: { type: Number, required: true },
    tasteOfRegion: String,
    quantityAvailable: { type: Number, required: true },
    quantityBooked: { type: Number, required: true, default: 0 },
    servesTo: { type: Number, required: true },
    mealType: { type: String, enum: ['Breakfast', 'Lunch', 'HighTea', 'Dinner'] },
    servingQuantity: Number,
    servingQuantityUnit: String,
    searchCategory: String,
    groupCategory: String,
    searchKeyword: String,
    preparationTime: Number,
    inflatePrice: Boolean
  }]
});

module.exports = remoteMongoDb.model('TodaysMenu', todaysMenu);