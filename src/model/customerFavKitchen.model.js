const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const customerFavKitchen = new Schema({
    customerId: { type: Schema.Types.ObjectId, required: true, index: true },
    favKitchens: [{
        cluster: String,
        kitchenIds: [{ type: Schema.Types.ObjectId }]
    }]
});

module.exports = remoteMongoDb.model('CustomerFavKitchen', customerFavKitchen);