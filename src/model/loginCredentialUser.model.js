const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const LoginCredentialUser = new Schema({
    phoneNo: { type: Number, unique: true, required: true },
    password: { type: String, required: true },
    loginAt: Date,
    token: String,
    attempts: Number
},{ timestamps: true });

module.exports = remoteMongoDb.model('LoginCredentialUser', LoginCredentialUser);