const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const marketPlaceItem = new Schema({
    itemName: { type: String, index: true, required: true },
    pathName: { type: String, required: true, unique: true },
    imageUrls: [{ type: String }],
    itemDescription: String,
    subHeader: String,
    itemServingUnit: String,
    searchCategory: String,
    groupCategory: String,
    groupCategoryId: { type: Schema.Types.ObjectId, ref: 'MarketPlaceGroup' },
    comboGroupCategoryList: [{
        category: String,
        groupCategoryList: [{
            groupCategory: String,
            groupCategoryId: { type: Schema.Types.ObjectId, ref: 'MarketPlaceGroup' },
        }]
    }],
    isAvailable: Boolean,
    isBestSeller: Boolean,
    optionInfo: [
        {
            itemServingText: { type: String, required: true },
            itemServingValue: { type: Number, required: true },
            itemServingUnit: { type: String, required: true },
            itemPrice: { type: Number, required: true },
            discount: Number,
            length: Number,
            breadth: Number,
            height: Number,
            weight: Number
        }
    ],
    inventoryInfo: [
        {
            address: {
                address1: String,
                address2: String,
                landmark: String
            },
            geolocation: { lat: Number, lng: Number },
            availableQuantity: Number,
            itemServingUnit: String
        }
    ],
    ingredients: [{ type: String }],
    benefits: [{ type: String }],
    usage: [{ type: String }],
    storageInfo: [{ type: String }],
    itemIsCombo: Boolean,
    itemLabel: {
        name: { type: String },
        backGroundColor: { type: String },
        textColor: { type: String }
    },
    searchKeywords: { type: [String], required: true }
}, {
    timestamps: true
});

module.exports = remoteMongoDb.model('MarketPlaceItem', marketPlaceItem);