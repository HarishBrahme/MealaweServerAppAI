const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const blogCategorySchema = new Schema({
    blogCategoryName: { type: String, required: true },
    pathName: { type: String, required: true, unique: true },
    description: { type: String }
}, {
    timestamps: true
});
module.exports = remoteMongoDb.model('BlogCategory', blogCategorySchema);