const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const faq = new Schema({
    question: String,
    answer: String,
    faqFor: { type: String, enum: ['All', 'User', 'Kitchen'] }
});

module.exports = remoteMongoDb.model('FAQ', faq);