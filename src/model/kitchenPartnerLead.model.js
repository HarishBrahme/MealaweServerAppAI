const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const kitchenPartnerLead = new Schema({
    name: { type: String, trim: true, index: true, required: true },
    address: String,
    phoneNo: { type: String, unique: true, required: true },
    email: { type: String, unique: true },
    maritalStatus: String,
    leadStatus: { type: String, enum: ['started', 'inprogress', 'completed', 'noteligible'] },
    comment: String,
    installReferrer: String
});

module.exports = remoteMongoDb.model('KitchenPartnerLead', kitchenPartnerLead);