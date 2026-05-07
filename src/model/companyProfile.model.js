const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const companyProfile = new Schema({
    companyName: String,
    address: String,
    contactPerson: String,
    contactNo: Number
});

module.exports = remoteMongoDb.model('CompanyProfile', companyProfile);