const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const blogAuthorSchema = new Schema({
    profilePicture: { type: String },
    authorName: { type: String, required: true },
    pathName: { type: String, required: true, unique: true },
    description: { type: String },
    socialMedia: [{
        platform: { type: String, required: true },
        url: { type: String, required: true }
    }],
    locationName: { type: String }
}, {
    timestamps: true
});

module.exports = remoteMongoDb.model('BlogAuthor', blogAuthorSchema);
