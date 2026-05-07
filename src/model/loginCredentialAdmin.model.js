const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const LoginCredentialAdmin = new Schema({
    phoneNo: { type: Number, required: true, unique: true },
    adminId: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    loginAt: Date,
    token: String,
    attempts: Number
});

module.exports = remoteMongoDb.model('LoginCredentialAdmin', LoginCredentialAdmin);