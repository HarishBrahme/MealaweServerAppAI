const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const bulkMenu = new Schema({
    bulkCategory: String,
    moq: Number,
    slabLimit1: Number,
    slabLimit2: Number,
    slabLimit3: Number,
    dateLimit1: Number,
    dateLimit2: Number,
    dateLimit3: Number,
    deliverySlab1: Number,
    deliverySlab2: Number,
    deliverySlab3: Number,
    packagingCharges: Number,
    platformCharges: Number,
    itemList: [{
        imageUrl: String,
        itemName: { type: String, trim: true, index: true, required: true },
        itemPrice: Number,
        itemType: { type: String, enum: ['Veg', 'NonVeg', 'Jain'] },
        itemFlavour: { type: String, enum: ['Sweet', 'Sour', 'Normal'] },
        itemServingType: { type: String, enum: ['perPerson', 'perUnit', 'perQuantity'] },
        slab1Price: { type: Number, required: true },
        slab2Price: { type: Number, required: true },
        slab3Price: { type: Number, required: true },
        slab4Price: { type: Number, required: true },
        payAmtToKitchen: Number,
        packagingCost: Number,
        packagingDescription: String,
        itemDescription: String,
        group: String,
        mainMenuItemId: { type: Schema.Types.ObjectId }
    }],
});

module.exports = remoteMongoDb.model('bulkMenu', bulkMenu);